"""TOConline invoicing.

Issues a Portuguese-compliant fatura (FT) when a Stripe invoice is
paid. Auth is handled by app.services.toconline_oauth (authorization_code
flow with refresh-token rotation, advisory lock against races).
"""
from __future__ import annotations
import logging

import httpx

from app.core.config import settings
from app.services.toconline_oauth import (
    API_URL as TOCONLINE_API_URL,  # re-exported for compat with scripts
    OAUTH_URL as TOCONLINE_OAUTH_URL,
    TOConlineAuthError,
    get_access_token,
)

log = logging.getLogger(__name__)

EU_COUNTRIES = {
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
    "HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
}


async def create_invoice(
    email: str,
    name: str,
    amount_excl_vat: float,
    description: str,
    item_code: str = "",
    tax_id: str = "",
    country: str = "PT",
) -> None:
    """Issue a fatura. Logs and swallows on failure — billing already
    succeeded at the Stripe level, the customer experience must not
    depend on TOConline being up."""
    try:
        token = await get_access_token()
    except TOConlineAuthError as e:
        log.warning("[TOCONLINE] no access token (%s) — skipping invoice for %s", e, email)
        return

    is_eu = country.upper() in EU_COUNTRIES
    tax_code = "NOR" if is_eu else "ISE"
    tax_pct = 23 if is_eu else 0

    line: dict = {
        "item_type": "Service",
        "quantity": 1,
        "unit_price": round(amount_excl_vat, 2),
        "tax_code": tax_code,
        "tax_percentage": tax_pct,
        "description": description,
    }
    if item_code:
        line["item_code"] = item_code

    doc: dict = {
        "document_type": "FT",
        "document_series_id": settings.TOCONLINE_SERIES_ID,
        "currency_iso_code": "EUR",
        "vat_included_prices": False,
        "customer_business_name": name or email.split("@")[0],
        "customer_tax_registration_number": tax_id or "999999990",
        "customer_country": country.upper(),
        "lines": [line],
    }

    if tax_code == "ISE" and settings.TOCONLINE_EXEMPTION_NON_EU:
        doc["tax_exemption_reason_id"] = settings.TOCONLINE_EXEMPTION_NON_EU

    hdrs = {
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }

    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(
                f"{TOCONLINE_API_URL}/api/v1/commercial_sales_documents",
                headers=hdrs,
                json=doc,
                timeout=15,
            )
        except httpx.HTTPError:
            log.exception("[TOCONLINE] HTTP error issuing invoice for %s", email)
            return

        if r.status_code in (200, 201):
            resp = r.json()
            doc_no = resp.get("document_no") or resp.get("data", {}).get("document_no", "?")
            log.info("[TOCONLINE] FT %s issued for %s — €%.2f + IVA", doc_no, email, amount_excl_vat)
        else:
            log.warning(
                "[TOCONLINE] FT issue failed %s: %s",
                r.status_code, (r.text or "")[:300],
            )


# Backwards-compat shim — the old _get_access_token used by some
# scripts. Just delegates to the new service.
async def _get_access_token():  # noqa: D401
    """Compatibility shim — delegates to services.toconline_oauth."""
    try:
        return await get_access_token()
    except TOConlineAuthError:
        return None
