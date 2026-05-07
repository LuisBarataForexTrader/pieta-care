from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core import toconline
from app.core.stripe_client import PLANS, STRIPE_PRICE_TO_PLAN
from app.models.user import User
from app.schemas.billing import (
    SubscribeRequest,
    SubscriptionResponse,
    BillingPortalResponse,
    InvoiceResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    PlanInfo,
    BillingStatusResponse,
)
from app.services.billing import (
    create_subscription,
    get_subscription,
    cancel_subscription,
    get_billing_portal_url,
    list_invoices,
    list_plans,
    billing_status,
    create_checkout_session,
    handle_webhook,
    BillingError,
)

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans", response_model=list[PlanInfo])
def plans():
    return list_plans()


@router.get("/status", response_model=BillingStatusResponse)
def status(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return billing_status(db, user)


@router.post("/checkout", response_model=CheckoutSessionResponse)
def checkout(
    data: CheckoutSessionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        url = create_checkout_session(db, user, data.plan)
        return CheckoutSessionResponse(url=url)
    except BillingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/subscribe", response_model=SubscriptionResponse, status_code=201)
def subscribe(
    data: SubscribeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return create_subscription(db, user, data.plan, data.payment_method_id)
    except BillingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/subscription", response_model=SubscriptionResponse | None)
def subscription_status(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return get_subscription(db, user)
    except BillingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/subscription", response_model=SubscriptionResponse)
def cancel(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return cancel_subscription(db, user)
    except BillingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/portal", response_model=BillingPortalResponse)
def billing_portal(user: User = Depends(get_current_user)):
    try:
        url = get_billing_portal_url(user)
        return BillingPortalResponse(url=url)
    except BillingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/invoices", response_model=list[InvoiceResponse])
def invoices(user: User = Depends(get_current_user)):
    return list_invoices(user)


@router.post("/webhook", include_in_schema=False)
async def webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = handle_webhook(payload, sig_header)
    except BillingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    event_type = event["type"]
    obj = event["data"]

    if event_type == "invoice.paid":
        await _on_invoice_paid(db, obj)
    elif event_type == "checkout.session.completed":
        _on_checkout_completed(db, obj)
    elif event_type == "customer.subscription.created":
        _sync_subscription_status(db, obj)
    elif event_type == "customer.subscription.updated":
        _sync_subscription_status(db, obj)
    elif event_type == "customer.subscription.deleted":
        _sync_subscription_status(db, obj, force_status="canceled")
    elif event_type == "invoice.payment_failed":
        _sync_subscription_status(db, obj.get("subscription"), force_status="past_due")

    return {"received": True}


def _on_checkout_completed(db: Session, session_obj: dict) -> None:
    customer_id = session_obj.get("customer")
    if not customer_id:
        return
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        return
    plan = (session_obj.get("metadata") or {}).get("plan")
    if plan and plan in PLANS:
        user.subscription_plan = plan
    db.commit()


async def _on_invoice_paid(db: Session, invoice_obj: dict) -> None:
    """Emite fatura TOConline após pagamento Stripe confirmado."""
    # Só processa faturas reais (não trials sem cobrança)
    amount_paid = invoice_obj.get("amount_paid", 0)
    if amount_paid == 0:
        return

    customer_id = invoice_obj.get("customer")
    if not customer_id:
        return

    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        return

    # Identificar plano a partir do line item da fatura Stripe
    lines = invoice_obj.get("lines", {}).get("data", [])
    plan_key = "familia"
    for line in lines:
        price_id = (line.get("price") or {}).get("id", "")
        if price_id in STRIPE_PRICE_TO_PLAN:
            plan_key = STRIPE_PRICE_TO_PLAN[price_id]
            break

    plan = PLANS.get(plan_key, PLANS["familia"])

    # Emite fatura TOConline com valor SEM IVA
    await toconline.create_invoice(
        email=user.email,
        name=user.full_name,
        amount_excl_vat=plan["amount_excl_vat"],    # ex: 35.00 (sem IVA)
        description=plan["description"],
        item_code=plan["item_code"],
        country="PT",                                # default PT; expandir com dados do user
    )

    # Atualiza estado da subscrição
    user.subscription_status = "active"
    db.commit()


def _sync_subscription_status(db: Session, sub_obj, force_status: str | None = None):
    if not sub_obj:
        return
    customer_id = sub_obj.get("customer") if isinstance(sub_obj, dict) else None
    if not customer_id:
        return

    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        return

    status = force_status or (sub_obj.get("status") if isinstance(sub_obj, dict) else None)
    if status:
        user.subscription_status = status

    # Track plan from subscription metadata or price ID
    if isinstance(sub_obj, dict):
        meta_plan = (sub_obj.get("metadata") or {}).get("plan")
        if meta_plan and meta_plan in PLANS:
            user.subscription_plan = meta_plan
        else:
            items = (sub_obj.get("items") or {}).get("data", [])
            for item in items:
                price_id = (item.get("price") or {}).get("id", "")
                if price_id in STRIPE_PRICE_TO_PLAN:
                    user.subscription_plan = STRIPE_PRICE_TO_PLAN[price_id]
                    break

    db.commit()
