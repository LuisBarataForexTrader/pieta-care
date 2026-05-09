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
    if not settings.TOCONLINE_CLIENT_ID or not settings.TOCONLINE_CLIENT_SECRET:
        print("ERROR: TOCONLINE_CLIENT_ID/SECRET not in env", file=sys.stderr)
        return 1

    token = await _get_access_token()
    if not token:
        print("ERROR: failed to get OAuth access token", file=sys.stderr)
        return 1

    print(f"✓ Authenticated against TOConline ({TOCONLINE_API_URL})")
    print()

    hdrs = {
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        for spec in PRODUCTS:
            code = spec["item_code"]
            print(f"→ {code}")

            # 1) Check if it already exists
            r = await client.get(
                f"{TOCONLINE_API_URL}/api/items",
                params={"filter[item_code]": code},
                headers=hdrs,
            )
            existing = []
            if r.status_code == 200:
                try:
                    existing = r.json().get("data", [])
                except Exception:
                    existing = []

            if existing:
                print(f"  = already exists (id={existing[0].get('id')})")
                continue

            # 2) Create
            payload = {
                "data": {
                    "type": "items",
                    "attributes": {
                        "item_code": code,
                        "description": spec["description"],
                        "unit_price": spec["unit_price"],
                        "item_type": "Service",
                        "tax_code": "NOR",
                        "tax_percentage": 23,
                    },
                }
            }
            r = await client.post(
                f"{TOCONLINE_API_URL}/api/items",
                headers=hdrs,
                json=payload,
            )
            if r.status_code in (200, 201):
                resp = r.json()
                item_id = resp.get("data", {}).get("id", "?")
                print(f"  ✓ created (id={item_id})")
            else:
                print(f"  ✗ failed {r.status_code}: {r.text[:300]}")

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
