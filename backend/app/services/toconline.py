"""TOConline e-invoicing integration.

Issues a Portuguese-compliant fatura (with VAT) automatically when a
Stripe invoice is paid. Triggered from the `invoice.paid` webhook
handler.

Configuration (env on server):
  TOCONLINE_API_KEY      - personal access token (Settings → API)
  TOCONLINE_COMPANY_ID   - empresa numerical ID (visible in URL)

The TOConline REST API base is:
  https://api.toconline.pt/api/

This module is intentionally narrow - we only do "create + send"
flows for completed Stripe charges. If the call fails, we log the
error but DO NOT block the customer experience; an admin can re-
issue the fatura manually from TOConline UI using our internal note.

Reference (TOConline public docs):
  https://api.toconline.pt/api/documentation
"""
from __future__ import annotations
import logging
from typing import Optional

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)

API_BASE = "https://api.toconline.pt/api"
PRODUCT_REF_PREFIX = "PIETAS-"  # one-of: PIETAS-FAM-M / FAM-PLUS-M / FAM-PLUS-IA-M


def _client() -> Optional[httpx.Client]:
    if not settings.TOCONLINE_API_KEY:
        return None
    return httpx.Client(
        base_url=API_BASE,
        headers={
            "Authorization": f"Bearer {settings.TOCONLINE_API_KEY}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        timeout=15.0,
    )


def ensure_customer(*, name: str, email: str, nif: str | None) -> Optional[str]:
    """Create-or-find a TOConline customer record. Returns the customer
    id, or None on failure / when API isn't configured."""
    cli = _client()
    if not cli:
        return None

    try:
        # Try lookup by NIF first (strongest signal)
        if nif:
            r = cli.get(f"/customers", params={"tax_registration_number": nif})
            if r.status_code == 200:
                items = r.json().get("data") or []
                if items:
                    return str(items[0]["id"])

        # Fall back to email
        r = cli.get(f"/customers", params={"email": email})
        if r.status_code == 200:
            items = r.json().get("data") or []
            if items:
                return str(items[0]["id"])

        # Create new
        body = {
            "name": name,
            "email": email,
            "country_code": "PT",
        }
        if nif:
            body["tax_registration_number"] = nif

        r = cli.post("/customers", json=body)
        if r.status_code in (200, 201):
            return str(r.json().get("id") or r.json().get("data", {}).get("id"))

        log.warning("toconline: create customer failed %s: %s", r.status_code, r.text[:200])
        return None
    finally:
        cli.close()


def issue_invoice(
    *,
    customer_id: str,
    plan_key: str,
    plan_name: str,
    amount_excl_vat: float,
    description: str,
    stripe_invoice_id: str,
) -> Optional[str]:
    """Issue a fatura (FT) with VAT, against an existing customer.
    Returns the TOConline invoice number, or None on failure.

    `amount_excl_vat` is in EUR (e.g. 35.00 for the Família plan).
    VAT is assumed 23% (PT) and applied automatically by TOConline based
    on the customer's country and the product configuration."""
    cli = _client()
    if not cli:
        return None

    try:
        body = {
            "customer_id": customer_id,
            "document_type": "FT",  # Fatura
            "items": [
                {
                    "reference": f"{PRODUCT_REF_PREFIX}{plan_key.upper().replace('_', '-')}",
                    "description": description,
                    "unit_price": amount_excl_vat,
                    "quantity": 1,
                    "vat_rate": 23,  # PT continental
                }
            ],
            "external_reference": stripe_invoice_id,
            "send_email": True,
        }

        r = cli.post("/invoices", json=body)
        if r.status_code in (200, 201):
            doc = r.json()
            invoice_no = doc.get("number") or doc.get("data", {}).get("number")
            log.info("toconline: invoice %s issued for stripe=%s", invoice_no, stripe_invoice_id)
            return str(invoice_no) if invoice_no else None

        log.warning("toconline: invoice POST failed %s: %s", r.status_code, r.text[:200])
        return None
    finally:
        cli.close()


# ─────────────────────────────────────────────────────────────────────
# Wired into the webhook flow:
#
#   app/api/billing.py  _on_invoice_paid()
#     1. Receives stripe invoice.paid event
#     2. Looks up the user by stripe_customer_id
#     3. Calls ensure_customer(...) to get TOConline customer_id
#     4. Calls issue_invoice(...) for the line on that paid Stripe inv
#     5. Logs the resulting fatura number on the User (optional column)
#
# This file is deliberately defensive - any TOConline failure is
# logged-and-swallowed; the user's Stripe payment continues to work.
# ─────────────────────────────────────────────────────────────────────
