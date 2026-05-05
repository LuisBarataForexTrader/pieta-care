from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "pieta.care"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_FAMILIA: str = ""
    STRIPE_PRICE_FAMILIA_PLUS: str = ""
    STRIPE_PRICE_CUIDADOR_PRO: str = ""

    FIREBASE_CREDENTIALS_JSON: str = ""

    HETZNER_STORAGE_ACCESS_KEY: str = ""
    HETZNER_STORAGE_SECRET_KEY: str = ""
    HETZNER_STORAGE_BUCKET: str = "pieta-care"
    HETZNER_STORAGE_ENDPOINT: str = "https://fsn1.your-objectstorage.com"

    FRONTEND_URL: str = "https://pieta.care"

    class Config:
        env_file = ".env"


settings = Settings()
