from datetime import datetime
from pydantic import BaseModel


class SubscribeRequest(BaseModel):
    plan: str  # familia, familia_plus, cuidador_pro
    payment_method_id: str  # from Stripe.js on frontend


class SubscriptionResponse(BaseModel):
    subscription_id: str
    status: str
    plan: str
    current_period_end: datetime | None
    trial_end: datetime | None
    cancel_at_period_end: bool


class BillingPortalResponse(BaseModel):
    url: str


class InvoiceResponse(BaseModel):
    id: str
    amount: int
    currency: str
    status: str
    created: datetime
    invoice_url: str | None
