import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

# Catálogo de produtos — sempre EUR, preços SEM IVA
# IVA (23% PT / EU) é adicionado pelo TOConline na fatura
PLANS = {
    "familia": {
        "name": "Família",
        "price_env": "STRIPE_PRICE_FAMILIA",
        "amount_excl_vat": 35.00,       # €35 + IVA
        "item_code": "PIETA-FAM-M",
        "description": "pieta.care — Plano Família (mensal)",
    },
    "familia_plus": {
        "name": "Família+",
        "price_env": "STRIPE_PRICE_FAMILIA_PLUS",
        "amount_excl_vat": 59.00,       # €59 + IVA
        "item_code": "PIETA-FAM-PLUS-M",
        "description": "pieta.care — Plano Família+ (mensal)",
    },
    "cuidador_pro": {
        "name": "Cuidador Pro",
        "price_env": "STRIPE_PRICE_CUIDADOR_PRO",
        "amount_excl_vat": 19.00,       # €19 + IVA
        "item_code": "PIETA-CUI-PRO-M",
        "description": "pieta.care — Cuidador Pro (mensal)",
    },
}

# Map Stripe price_id → plan key (preenchido no startup)
STRIPE_PRICE_TO_PLAN: dict[str, str] = {}


def build_price_map():
    for plan_key, info in PLANS.items():
        price_id = getattr(settings, info["price_env"], "")
        if price_id:
            STRIPE_PRICE_TO_PLAN[price_id] = plan_key
