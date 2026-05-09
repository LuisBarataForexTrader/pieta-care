from datetime import datetime
import stripe
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.stripe_client import PLANS
from app.models.user import User
from app.schemas.billing import (
    SubscriptionResponse, InvoiceResponse, PlanInfo, BillingStatusResponse,
)


class BillingError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def _get_price_id(plan: str) -> str:
    if plan not in PLANS:
        raise BillingError(f"Plano inválido. Use: {', '.join(PLANS.keys())}", 400)
    price_id = getattr(settings, PLANS[plan]["price_env"], "")
    if not price_id:
        raise BillingError("Plano não configurado no servidor", 500)
    return price_id


def _ts(timestamp: int | None) -> datetime | None:
    return datetime.fromtimestamp(timestamp) if timestamp else None


def ensure_stripe_customer(db: Session, user: User) -> str:
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.full_name,
        metadata={"user_id": str(user.id)},
    )
    user.stripe_customer_id = customer.id
    db.commit()
    return customer.id


def create_subscription(
    db: Session, user: User, plan: str, payment_method_id: str
) -> SubscriptionResponse:
    price_id = _get_price_id(plan)
    customer_id = ensure_stripe_customer(db, user)

    # Attach payment method to customer
    stripe.PaymentMethod.attach(payment_method_id, customer=customer_id)
    stripe.Customer.modify(
        customer_id,
        invoice_settings={"default_payment_method": payment_method_id},
    )

    # Create subscription with 30-day trial
    sub = stripe.Subscription.create(
        customer=customer_id,
        items=[{"price": price_id}],
        trial_period_days=14,
        payment_behavior="default_incomplete",
        expand=["latest_invoice.payment_intent"],
        metadata={"user_id": str(user.id), "plan": plan},
    )

    user.subscription_status = "trialing"
    db.commit()

    return SubscriptionResponse(
        subscription_id=sub.id,
        status=sub.status,
        plan=plan,
        current_period_end=_ts(sub.current_period_end),
        trial_end=_ts(sub.trial_end),
        cancel_at_period_end=sub.cancel_at_period_end,
    )


def get_subscription(db: Session, user: User) -> SubscriptionResponse | None:
    if not user.stripe_customer_id:
        return None

    subs = stripe.Subscription.list(
        customer=user.stripe_customer_id,
        status="all",
        limit=1,
    )

    if not subs.data:
        return None

    sub = subs.data[0]
    plan = sub.metadata.get("plan", "familia")

    return SubscriptionResponse(
        subscription_id=sub.id,
        status=sub.status,
        plan=plan,
        current_period_end=_ts(sub.current_period_end),
        trial_end=_ts(sub.trial_end),
        cancel_at_period_end=sub.cancel_at_period_end,
    )


def cancel_subscription(db: Session, user: User) -> SubscriptionResponse:
    if not user.stripe_customer_id:
        raise BillingError("Sem subscrição ativa", 404)

    subs = stripe.Subscription.list(
        customer=user.stripe_customer_id,
        status="active",
        limit=1,
    )

    if not subs.data:
        subs = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status="trialing",
            limit=1,
        )

    if not subs.data:
        raise BillingError("Sem subscrição ativa para cancelar", 404)

    sub = stripe.Subscription.modify(
        subs.data[0].id,
        cancel_at_period_end=True,
    )

    return SubscriptionResponse(
        subscription_id=sub.id,
        status=sub.status,
        plan=sub.metadata.get("plan", "familia"),
        current_period_end=_ts(sub.current_period_end),
        trial_end=_ts(sub.trial_end),
        cancel_at_period_end=sub.cancel_at_period_end,
    )


def list_plans() -> list[PlanInfo]:
    return [
        PlanInfo(
            key=key,
            name=info["name"],
            price=info["amount_excl_vat"],
            max_elderly=info["max_elderly"],
            max_family_members=info["max_family_members"],
            has_ai=info["has_ai"],
            features=info["features"],
        )
        for key, info in PLANS.items()
    ]


_PLAN_RANK = {"familia": 1, "familia_plus": 2, "cuidador_pro": 3}


def _user_plan_now(u: User | None) -> str | None:
    """The plan tier this single user has access to via their OWN row.
    Trial → cuidador_pro (full access). Active/trialing → their stored plan.
    Anything else (member, expired, canceled) → None at this layer."""
    if not u:
        return None
    if u.subscription_status == "trial":
        return "cuidador_pro"
    if u.subscription_status in ("active", "trialing"):
        return u.subscription_plan
    return None


def _resolve_effective_plan(db: Session, user: User) -> str | None:
    """Highest plan tier the user has access to right now - considering
    their own subscription PLUS every household where they're an accepted
    member (invited members inherit the titular's plan)."""
    # Lazy import to keep module import graph clean
    from app.models.family import FamilyMember

    best: str | None = _user_plan_now(user)

    memberships = db.query(FamilyMember).filter(
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,  # noqa: E712
    ).all()
    seen_owner_ids: set[int] = {user.id}
    for m in memberships:
        owner_m = db.query(FamilyMember).filter(
            FamilyMember.elderly_id == m.elderly_id,
            FamilyMember.role == "owner",
            FamilyMember.is_accepted == True,  # noqa: E712
        ).first()
        if not owner_m or not owner_m.user_id or owner_m.user_id in seen_owner_ids:
            continue
        seen_owner_ids.add(owner_m.user_id)
        owner = db.query(User).filter(User.id == owner_m.user_id).first()
        candidate = _user_plan_now(owner)
        if not candidate:
            continue
        if best is None or _PLAN_RANK.get(candidate, 0) > _PLAN_RANK.get(best, 0):
            best = candidate
    return best


def billing_status(db: Session, user: User) -> BillingStatusResponse:
    sub = None
    if user.stripe_customer_id and settings.STRIPE_SECRET_KEY:
        try:
            subs = stripe.Subscription.list(
                customer=user.stripe_customer_id, status="all", limit=1
            )
            sub = subs.data[0] if subs.data else None
        except Exception:
            sub = None

    effective = _resolve_effective_plan(db, user)

    if sub:
        return BillingStatusResponse(
            status=sub.status,
            plan=user.subscription_plan or sub.metadata.get("plan"),
            plan_name=PLANS.get(user.subscription_plan or sub.metadata.get("plan", ""), {}).get("name"),
            trial_ends_at=_ts(getattr(sub, "trial_end", None)),
            current_period_end=_ts(getattr(sub, "current_period_end", None)),
            cancel_at_period_end=getattr(sub, "cancel_at_period_end", False),
            has_subscription=True,
            effective_plan=effective,
        )

    # No active Stripe subscription - fall back to local trial state
    return BillingStatusResponse(
        status=user.subscription_status or "trial",
        plan=user.subscription_plan,
        plan_name=PLANS.get(user.subscription_plan or "", {}).get("name") if user.subscription_plan else None,
        trial_ends_at=user.trial_ends_at,
        current_period_end=None,
        cancel_at_period_end=False,
        has_subscription=False,
        effective_plan=effective,
    )


def create_checkout_session(db: Session, user: User, plan: str) -> str:
    """Create a Stripe-hosted Checkout Session for subscription signup."""
    if not settings.STRIPE_SECRET_KEY:
        raise BillingError("Pagamentos não configurados no servidor", 503)

    price_id = _get_price_id(plan)
    customer_id = ensure_stripe_customer(db, user)

    # Pre-fill 14-day trial only on first-ever subscription
    has_subscribed_before = bool(user.subscription_plan)
    subscription_data = {
        "metadata": {"user_id": str(user.id), "plan": plan},
    }
    if not has_subscribed_before:
        subscription_data["trial_period_days"] = 14

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            subscription_data=subscription_data,
            allow_promotion_codes=True,
            success_url=f"{settings.FRONTEND_URL}/conta?checkout=success&plan={plan}",
            cancel_url=f"{settings.FRONTEND_URL}/conta?checkout=cancel",
            client_reference_id=str(user.id),
            metadata={"user_id": str(user.id), "plan": plan},
        )
    except stripe.error.StripeError as e:
        raise BillingError(f"Stripe: {e.user_message or str(e)}", 502)

    return session.url


def get_billing_portal_url(user: User) -> str:
    if not user.stripe_customer_id:
        raise BillingError("Sem conta de faturação", 404)
    if not settings.STRIPE_SECRET_KEY:
        raise BillingError("Pagamentos não configurados no servidor", 503)

    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/conta",
    )
    return session.url


def list_invoices(user: User) -> list[InvoiceResponse]:
    if not user.stripe_customer_id:
        return []

    invoices = stripe.Invoice.list(
        customer=user.stripe_customer_id,
        limit=12,
    )

    return [
        InvoiceResponse(
            id=inv.id,
            amount=inv.amount_paid,
            currency=inv.currency,
            status=inv.status,
            created=datetime.fromtimestamp(inv.created),
            invoice_url=inv.hosted_invoice_url,
        )
        for inv in invoices.data
    ]


def handle_webhook(payload: bytes, sig_header: str) -> dict:
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise BillingError("Webhook inválido", 400)

    return {"type": event.type, "data": event.data.object}
