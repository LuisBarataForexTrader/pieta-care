import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

# Catálogo de produtos - sempre EUR, preços SEM IVA
# IVA (23% PT / EU) é adicionado pelo TOConline na fatura
PLANS = {
    "familia": {
        "name": "Pack Família",
        "price_env": "STRIPE_PRICE_FAMILIA",
        "amount_excl_vat": 35.00,       # €35 + IVA
        "item_code": "PIETA-FAM-M",
        "description": "pietas.care - Pack Família (mensal)",
        "max_elderly": 1,
        "max_family_members": 2,
        "has_ai": False,
        "features": [
            "1 perfil de familiar",
            "Até 2 familiares",
            "Medicação, agenda e sinais vitais",
            "Incidentes e documentos",
            "Notas de turno",
        ],
    },
    "familia_plus": {
        "name": "Pack Família+",
        "price_env": "STRIPE_PRICE_FAMILIA_PLUS",
        "amount_excl_vat": 59.00,       # €59 + IVA
        "item_code": "PIETA-FAM-PLUS-M",
        "description": "pietas.care - Pack Família+ (mensal)",
        "max_elderly": 2,
        "max_family_members": 5,
        "has_ai": False,
        "features": [
            "Até 2 perfis de familiar",
            "Até 5 familiares",
            "Tudo do Pack Família",
            "Relatório médico completo",
            "Dados clínicos avançados",
            "Plano de cuidados detalhado",
        ],
    },
    "cuidador_pro": {
        # Tier de topo - internamente "cuidador_pro" para não partir env vars
        # já criadas no Stripe; mostrado como "Pack Plus + IA" na UI.
        "name": "Pack Plus + IA",
        "price_env": "STRIPE_PRICE_CUIDADOR_PRO",
        "amount_excl_vat": 88.00,       # €88 + IVA
        "item_code": "PIETA-FAM-PLUS-IA-M",
        "description": "pietas.care - Pack Plus + IA (mensal)",
        "max_elderly": 4,
        "max_family_members": None,     # ilimitado
        "has_ai": True,
        "features": [
            "Até 4 perfis de familiar",
            "Familiares ilimitados",
            "Tudo do Pack Família+",
            "Assistente IA - informação clínica de medicação",
            "Resumos automáticos e alertas inteligentes",
        ],
    },
}

# Map Stripe price_id → plan key (preenchido no startup)
STRIPE_PRICE_TO_PLAN: dict[str, str] = {}


def build_price_map():
    for plan_key, info in PLANS.items():
        price_id = getattr(settings, info["price_env"], "")
        if price_id:
            STRIPE_PRICE_TO_PLAN[price_id] = plan_key
