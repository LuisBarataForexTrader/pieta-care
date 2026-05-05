from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.billing import (
    SubscribeRequest,
    SubscriptionResponse,
    BillingPortalResponse,
    InvoiceResponse,
)
from app.services.billing import (
    create_subscription,
    get_subscription,
    cancel_subscription,
    get_billing_portal_url,
    list_invoices,
    handle_webhook,
    BillingError,
)

router = APIRouter(prefix="/billing", tags=["billing"])


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

    # Handle subscription lifecycle events
    event_type = event["type"]
    obj = event["data"]

    if event_type == "customer.subscription.updated":
        _sync_subscription_status(db, obj)
    elif event_type == "customer.subscription.deleted":
        _sync_subscription_status(db, obj, force_status="canceled")
    elif event_type == "invoice.payment_failed":
        _sync_subscription_status(db, obj.get("subscription"), force_status="past_due")

    return {"received": True}


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
        db.commit()
