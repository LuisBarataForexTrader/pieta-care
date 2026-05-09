"""
One-shot Stripe Account branding/public-details setup for pietas.care.

Configures everything that's API-settable in one go:
  • Branding: icon + logo upload, primary + secondary colors
  • Public details: business name, support email, support URL,
    business URL
  • Statement descriptor (full + shortened)

Customer email toggles (renewals / card-expiring / failed payments) are
Dashboard-only — Stripe doesn't expose them via API. Those still
require manual toggling in Settings → Customer emails.

Run locally with the live secret key:

    STRIPE_SECRET_KEY=sk_live_... python3 scripts/stripe_branding_setup.py

Idempotent: re-running just overwrites the same fields with the same
values. File uploads happen each run (Stripe doesn't have a "find
existing file by name" API), but the file IDs only get applied to the
account; old uploads remain in your File library harmlessly.
"""
from __future__ import annotations
import os
import sys
import stripe

_BASE = os.path.dirname(os.path.abspath(__file__))
ICON_PATH = os.path.join(_BASE, "brand", "icon.png")
LOGO_PATH = os.path.join(_BASE, "brand", "logo.png")

BRAND = {
    "name": "pietas.care",
    "url": "https://pietas.care",
    "support_email": "suporte@pietas.care",
    "support_url": "https://pietas.care",
    "primary_color":   "#2A6049",
    "secondary_color": "#4ADE80",
    "statement_descriptor":         "PIETAS.CARE",
    "statement_descriptor_prefix":  "PIETAS",
}


def upload(path: str, purpose: str) -> str:
    if not os.path.exists(path):
        print(f"  ⚠ skip — file not found: {path}", file=sys.stderr)
        return ""
    with open(path, "rb") as f:
        link = stripe.File.create(purpose=purpose, file=f)
    print(f"  ✓ uploaded {path} → {link.id} (purpose={purpose})")
    return link.id


def main() -> None:
    key = os.environ.get("STRIPE_SECRET_KEY", "")
    if not key:
        print("ERROR: STRIPE_SECRET_KEY env var required.", file=sys.stderr)
        sys.exit(1)
    stripe.api_key = key
    mode = "LIVE" if key.startswith("sk_live_") else "TEST"
    print(f"Stripe mode: {mode}\n")

    # ── 1. Upload icon + logo
    print("→ Uploading branding assets…")
    icon_id = upload(ICON_PATH, "business_icon")
    logo_id = upload(LOGO_PATH, "business_logo")
    print()

    # ── 2. Branding settings
    print("→ Applying branding settings…")
    branding: dict = {
        "primary_color":   BRAND["primary_color"],
        "secondary_color": BRAND["secondary_color"],
    }
    if icon_id: branding["icon"] = icon_id
    if logo_id: branding["logo"] = logo_id

    acc = stripe.Account.modify(
        settings={
            "branding": branding,
            "payments": {
                "statement_descriptor": BRAND["statement_descriptor"],
            },
            "card_payments": {
                "statement_descriptor_prefix": BRAND["statement_descriptor_prefix"],
            },
        },
        business_profile={
            "name":          BRAND["name"],
            "url":           BRAND["url"],
            "support_email": BRAND["support_email"],
            "support_url":   BRAND["support_url"],
            # Note: support_phone deliberately left blank — user does not
            # want to expose a personal number; receipts will fall back
            # to email-only support contact.
        },
    )
    print(f"  ✓ account {acc.id} updated")
    print()

    # ── 3. Verify
    print("→ Final state:")
    bp = acc.business_profile
    br = acc.settings.branding
    pay = acc.settings.payments
    cp = acc.settings.card_payments

    print(f"  business_profile.name:        {bp.name}")
    print(f"  business_profile.url:         {bp.url}")
    print(f"  business_profile.support_email: {bp.support_email}")
    print(f"  business_profile.support_url: {bp.support_url}")
    print(f"  branding.primary_color:       {br.primary_color}")
    print(f"  branding.secondary_color:     {br.secondary_color}")
    print(f"  branding.icon:                {br.icon}")
    print(f"  branding.logo:                {br.logo}")
    print(f"  payments.statement_descriptor: {pay.statement_descriptor}")
    print(f"  card_payments.statement_descriptor_prefix: {cp.statement_descriptor_prefix}")

    print()
    print("=" * 60)
    print("Done. Still Dashboard-only (cannot set via API):")
    print("  • Customer email toggles  →  Settings → Customer emails")
    print("    Recommended ON: renewals, card-expiring, failed cc, failed bank debit")
    print("    Recommended OFF: trial-ending reminder (we send our own day-7)")
    print("  • Stripe Radar rule using @pieta_blocked_post_cancel")
    print("    (the value list itself is created on the first cancellation)")
    print("=" * 60)


if __name__ == "__main__":
    main()
