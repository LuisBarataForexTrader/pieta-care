from datetime import datetime
from pydantic import BaseModel


class SubscribeRequest(BaseModel):
    plan: str  # familia, familia_plus, cuidador_pro
    payment_method_id: str  # from Stripe.js on frontend


class CheckoutSessionRequest(BaseModel):
    plan: str  # familia, familia_plus, cuidador_pro


class CheckoutSessionResponse(BaseModel):
    url: str


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


class PlanInfo(BaseModel):
    key: str
    name: str
    price: float                 # excl. VAT
    max_elderly: int
    max_family_members: int | None
    has_ai: bool
    features: list[str]


class BillingStatusResponse(BaseModel):
    status: str                  # trial, trialing, active, past_due, canceled, none
    plan: str | None             # own subscription plan key (or null)
    plan_name: str | None
    trial_ends_at: datetime | None
    current_period_end: datetime | None
    cancel_at_period_end: bool
    has_subscription: bool
    # ─── Access resolution ────────────────────────────────────────────────
    # Highest plan tier the user has access to right now, considering both
    # their own subscription AND any household where they're an accepted
    # member (invited members inherit the titular's plan).
    # During trial, this is "cuidador_pro" (full access).
    # Used by the frontend to gate sidebar items and pages.
    effective_plan: str | None = None
