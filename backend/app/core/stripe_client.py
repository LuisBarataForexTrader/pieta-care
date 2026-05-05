import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

# Price IDs — create these in Stripe Dashboard and add to .env
# Products: Família (€35/mês), Família+ (€59/mês), Cuidador Pro (€19/mês)

PLANS = {
    "familia": {
        "name": "Família",
        "price_env": "STRIPE_PRICE_FAMILIA",
        "amount": 3500,  # €35.00
    },
    "familia_plus": {
        "name": "Família+",
        "price_env": "STRIPE_PRICE_FAMILIA_PLUS",
        "amount": 5900,  # €59.00
    },
    "cuidador_pro": {
        "name": "Cuidador Pro",
        "price_env": "STRIPE_PRICE_CUIDADOR_PRO",
        "amount": 1900,  # €19.00
    },
}
