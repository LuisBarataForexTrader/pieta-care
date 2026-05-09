"""
One-shot setup of pietas.care products in Stripe (Flow88 account).

Run locally with the Flow88 Stripe secret key (test or live):

    cd backend
    STRIPE_SECRET_KEY=sk_test_... python scripts/setup_stripe_products.py

The script is idempotent: re-running it re-uses existing products by
metadata.pieta_plan and only creates a new price if the amount or
currency does not match. At the end it prints the price IDs ready to
paste into GitHub secrets:

    gh secret set STRIPE_PRICE_FAMILIA -R LuisBarataForexTrader/pieta-care
    gh secret set STRIPE_PRICE_FAMILIA_PLUS -R ...
    gh secret set STRIPE_PRICE_CUIDADOR_PRO -R ...
"""
import os
import sys
import stripe

PRODUCTS = [
    {
        "plan_key": "familia",
        "name": "Pack Família",
        "description": "Pack Família — 1 perfil de familiar, até 2 familiares.",
        "amount_eur": 35,
        "secret_name": "STRIPE_PRICE_FAMILIA",
    },
    {
        "plan_key": "familia_plus",
        "name": "Pack Família+",
        "description": "Pack Família+ — até 2 perfis de familiar, até 5 familiares.",
        "amount_eur": 59,
        "secret_name": "STRIPE_PRICE_FAMILIA_PLUS",
    },
    {
        "plan_key": "cuidador_pro",
        "name": "Pack Plus + IA",
        "description": "Pack Plus + IA — até 4 perfis, familiares ilimitados, assistente IA + chat interno.",
        "amount_eur": 88,
        "secret_name": "STRIPE_PRICE_CUIDADOR_PRO",
    },
]


def _plan_key(p) -> str | None:
    """Safely extract metadata.pieta_plan even on legacy products
    where metadata may not behave as a dict."""
    try:
        return p.metadata.pieta_plan
    except (KeyError, AttributeError, TypeError):
        return None


def find_or_create_product(spec: dict):
    """Look up by metadata.pieta_plan, create if missing."""
    plan_key = spec["plan_key"]
    products = stripe.Product.list(limit=100, active=True).data
    existing = next(
        (p for p in products if _plan_key(p) == plan_key),
        None,
    )

    if existing:
        # Sync name + description in case they changed
        if existing.name != spec["name"] or (existing.description or "") != spec["description"]:
            stripe.Product.modify(
                existing.id,
                name=spec["name"],
                description=spec["description"],
            )
            print(f"  ↻ updated product {existing.id}")
        return existing

    p = stripe.Product.create(
        name=spec["name"],
        description=spec["description"],
        metadata={"pieta_plan": plan_key},
        tax_code="txcd_10103000",  # Software as a service (electronically supplied)
    )
    print(f"  + created product {p.id}")
    return p


def _interval(pr) -> str | None:
    try:
        return pr.recurring.interval if pr.recurring else None
    except (KeyError, AttributeError, TypeError):
        return None


def find_or_create_price(product, spec: dict) -> str:
    """Find an active recurring monthly EUR price matching amount, or create one."""
    amount_cents = spec["amount_eur"] * 100
    prices = stripe.Price.list(product=product.id, active=True, limit=100).data
    match = next(
        (
            pr for pr in prices
            if pr.unit_amount == amount_cents
            and pr.currency == "eur"
            and _interval(pr) == "month"
        ),
        None,
    )

    if match:
        print(f"  = price already at €{spec['amount_eur']}/mo: {match.id}")
        return match.id

    # Deactivate any other recurring monthly EUR prices on this product
    for pr in prices:
        if pr.currency == "eur" and _interval(pr) == "month":
            stripe.Price.modify(pr.id, active=False)
            print(f"  - deactivated stale price {pr.id} (€{pr.unit_amount/100})")

    new_price = stripe.Price.create(
        product=product.id,
        currency="eur",
        unit_amount=amount_cents,
        recurring={"interval": "month"},
        tax_behavior="exclusive",   # IVA added on top of price
        nickname=f"{spec['plan_key']} monthly",
    )
    print(f"  + created price €{spec['amount_eur']}/mo: {new_price.id}")
    return new_price.id


def main():
    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        print("ERROR: set STRIPE_SECRET_KEY env var first.", file=sys.stderr)
        sys.exit(1)
    stripe.api_key = key

    print(f"Stripe mode: {'LIVE' if key.startswith('sk_live_') else 'TEST'}")
    print()

    results: list[tuple[str, str]] = []
    for spec in PRODUCTS:
        print(f"→ {spec['name']}")
        product = find_or_create_product(spec)
        price_id = find_or_create_price(product, spec)
        results.append((spec["secret_name"], price_id))
        print()

    print("=" * 60)
    print("Done. Set these as GitHub secrets:")
    print("=" * 60)
    for secret_name, price_id in results:
        print(f"  echo '{price_id}' | gh secret set {secret_name} -R LuisBarataForexTrader/pieta-care")
    print()
    print("Then dispatch the workflow to push them into the server:")
    print("  gh workflow run deploy.yml -R LuisBarataForexTrader/pieta-care")


if __name__ == "__main__":
    main()
