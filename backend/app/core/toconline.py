"""TOConline invoicing - same pattern as TNT."""
import httpx
from app.core.config import settings

TOCONLINE_API_URL = "https://api6.toconline.pt"
TOCONLINE_OAUTH_URL = "https://app6.toconline.pt/oauth"

EU_COUNTRIES = {
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
    "HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
}

_token_cache: dict = {}


async def _get_access_token() -> str | None:
    import time
    cached = _token_cache.get("access_token")
    expires_at = _token_cache.get("expires_at", 0)
    if cached and time.time() < expires_at - 60:
        return cached

    if not settings.TOCONLINE_CLIENT_ID or not settings.TOCONLINE_CLIENT_SECRET:
        return None

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{TOCONLINE_OAUTH_URL}/token",
            data={
                "grant_type": "client_credentials",
                "client_id": settings.TOCONLINE_CLIENT_ID,
                "client_secret": settings.TOCONLINE_CLIENT_SECRET,
                "scope": "commercial contacts",
            },
            timeout=10,
        )
        if r.status_code == 200:
            data = r.json()
            _token_cache["access_token"] = data["access_token"]
            _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
            return data["access_token"]

    return None


async def create_invoice(
    email: str,
    name: str,
    amount_excl_vat: float,
    description: str,
    item_code: str = "",
    tax_id: str = "",
    country: str = "PT",
) -> None:
    token = await _get_access_token()
    if not token:
        print(f"[TOCONLINE] Sem token - fatura não emitida para {email}")
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
        "vat_included_prices": False,   # preços sempre SEM IVA
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
        r = await client.post(
            f"{TOCONLINE_API_URL}/api/v1/commercial_sales_documents",
            headers=hdrs,
            json=doc,
            timeout=15,
        )
        if r.status_code in (200, 201):
            resp = r.json()
            doc_no = resp.get("document_no") or resp.get("data", {}).get("document_no", "?")
            print(f"[TOCONLINE] Fatura {doc_no} emitida para {email} - €{amount_excl_vat:.2f} + IVA")
        else:
            print(f"[TOCONLINE] Erro {r.status_code}: {r.text[:200]}")
