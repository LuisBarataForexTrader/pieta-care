"""Smoke test: emit a real test fatura through the pieta-care
TOConline integration. Confirms end-to-end that:

  1. get_access_token() resolves a valid token
  2. /api/v1/commercial_sales_documents accepts our payload shape
  3. A real FT is created in the TOConline account

Run inside the pieta-care api container:

    docker compose exec -T api python scripts/toconline_test_invoice.py

The fatura is real (counts against the TOConline series). Customer
data is sentinel / clearly-test, NIF 999999990 (consumidor final
genérico), description prefixed [TEST].
"""
from __future__ import annotations
import asyncio
import logging
import os
import sys

# Allow running from /app/scripts
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO, format="%(message)s")

from app.core.toconline import create_invoice  # noqa: E402


async def main() -> int:
    print("→ Calling create_invoice() with test data…")
    print()
    await create_invoice(
        email="teste@pietas.care",
        name="Teste Smoke (não cobrar)",
        amount_excl_vat=1.00,                   # €1 + IVA
        description="[TEST] pieta-care TOConline smoke test",
        item_code="PIETA-FAM-M",                # use real catalogue code
        country="PT",
    )
    print()
    print("→ Done. Check the TOConline UI for the new FT.")
    print("  If you see [TEST] description, the integration works end-to-end.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
