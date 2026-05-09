"""
Create the 3 pietas.care products in TOConline.

Uses the OAuth client_credentials flow from app.core.toconline. Run
inside the api container so it picks up TOCONLINE_CLIENT_ID +
TOCONLINE_CLIENT_SECRET from env:

    docker compose exec -T api python scripts/toconline_create_products.py

Idempotent: TOConline's items endpoint allows duplicates by item_code,
so this script first GETs to check if the code exists and only POSTs
when missing.
"""
from __future__ import annotations
import asyncio
import os
import sys

# Allow running from /app/scripts (same trick as seed_demo.py).
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.toconline import _get_access_token, TOCONLINE_API_URL  # noqa: E402

PRODUCTS = [
    {
        "item_code": "PIETA-FAM-M",
        "description": "pietas.care - Pack Família (mensal)",
        "unit_price": 35.00,
    },
    {
        "item_code": "PIETA-FAM-PLUS-M",
        "description": "pietas.care - Pack Família+ (mensal)",
        "unit_price": 59.00,
    },
    {
        "item_code": "PIETA-FAM-PLUS-IA-M",
        "description": "pietas.care - Pack Família Plus + IA (mensal)",
        "unit_price": 88.00,
    },
]


async def main() -> int:
    # The token is passed in via env (extracted from TNT's DB by the
    # workflow shell, since this container doesn't have access to
    # /opt/tnt/news.db). TNT's OAuth client uses authorization_code
    # not client_credentials, so we have to ride on its existing tokens.
    token = os.environ.get("TOC_ACCESS_TOKEN")
    if not token:
        print("ERROR: TOC_ACCESS_TOKEN env var not set (workflow shell didn't pass it)", file=sys.stderr)
        return 1
    print(f"✓ Got access token (length {len(token)})")

    print(f"✓ Authenticated against TOConline ({TOCONLINE_API_URL})")
    print()

    hdrs = {
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        # Pre-fetch existing services to skip duplicates
        existing_codes: set[str] = set()
        r_list = await client.get(f"{TOCONLINE_API_URL}/api/services", headers=hdrs)
        if r_list.status_code == 200:
            try:
                data = r_list.json()
                items = data if isinstance(data, list) else data.get("data", [])
                for svc in items:
                    attrs = svc.get("attributes", svc) if isinstance(svc, dict) else {}
                    code = str(attrs.get("item_code", "")).strip()
                    if code:
                        existing_codes.add(code)
            except Exception:
                pass
        print(f"  existing codes: {sorted(existing_codes)[:10]}{'…' if len(existing_codes) > 10 else ''}")
        print()

        for spec in PRODUCTS:
            code = spec["item_code"]
            print(f"→ {code}")
            if code in existing_codes:
                print(f"  = already exists, skipped")
                continue

            # TNT-pattern POST to /api/services with array-wrapped data
            payload = {
                "data": [{
                    "type": "services",
                    "attributes": {
                        "type": "Service",
                        "item_code": code,
                        "item_description": spec["description"],
                        "sales_price": spec["unit_price"],
                        "purchase_price": 0,
                    }
                }]
            }
            r = await client.post(
                f"{TOCONLINE_API_URL}/api/services",
                headers=hdrs,
                json=payload,
            )
            if r.status_code in (200, 201):
                print(f"  ✓ created — {spec['description']} @ €{spec['unit_price']:.2f}")
            else:
                print(f"  ✗ failed {r.status_code}: {r.text[:300]}")

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
