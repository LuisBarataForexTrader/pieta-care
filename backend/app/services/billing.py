from datetime import datetime
import stripe
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.stripe_client import PLANS
from app.models.user import User
from app.schemas.billing import SubscriptionResponse, InvoiceResponse


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
        trial_period_days=30,
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


def get_billing_portal_url(user: User) -> str:
    if not user.stripe_customer_id:
        raise BillingError("Sem conta de faturação", 404)

    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/dashboard",
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
