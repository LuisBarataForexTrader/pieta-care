"""Read-only inspection of the Stripe account branding + public details.

Run on the server (has STRIPE_SECRET_KEY in env):

    docker compose exec -T api python scripts/stripe_account_check.py
"""
import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY
acc = stripe.Account.retrieve()

print(f"Account: {acc.id}  (mode: {'LIVE' if settings.STRIPE_SECRET_KEY.startswith('sk_live_') else 'TEST'})")
print()
print("─── Business profile ─────────────────────────────────")
bp = acc.business_profile
print(f"  name:           {bp.name}")
print(f"  url:            {bp.url}")
print(f"  support_email:  {bp.support_email}")
print(f"  support_phone:  {bp.support_phone}")
print(f"  support_url:    {bp.support_url}")
print()
print("─── Branding ─────────────────────────────────────────")
br = acc.settings.branding
print(f"  primary_color:    {br.primary_color}")
print(f"  secondary_color:  {br.secondary_color}")
print(f"  icon (file id):   {br.icon}")
print(f"  logo (file id):   {br.logo}")
print()
print("─── Statement descriptor ─────────────────────────────")
pay = acc.settings.payments
cp = acc.settings.card_payments
print(f"  payments.statement_descriptor:        {pay.statement_descriptor}")
print(f"  card_payments.statement_descriptor_prefix: {cp.statement_descriptor_prefix}")
print()
print("─── Account capabilities (live readiness) ────────────")
print(f"  charges_enabled:   {acc.charges_enabled}")
print(f"  payouts_enabled:   {acc.payouts_enabled}")
print(f"  details_submitted: {acc.details_submitted}")
