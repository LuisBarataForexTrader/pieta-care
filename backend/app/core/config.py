from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "pietas.care"
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

    FRONTEND_URL: str = "https://pietas.care"
    # Vercel project URL (project still named "pieta-care" on Vercel - leave
    # until renamed there). Used for CORS only.
    FRONTEND_URL_VERCEL: str = "https://pieta-care.vercel.app"
    BACKEND_PUBLIC_URL: str = "https://api.pietas.care"

    # TOConline (faturação PT)
    TOCONLINE_CLIENT_ID: str = ""
    TOCONLINE_CLIENT_SECRET: str = ""
    TOCONLINE_SERIES_ID: str = ""
    TOCONLINE_EXEMPTION_NON_EU: str = ""

    # Anthropic - used for medication info lookups
    ANTHROPIC_API_KEY: str = ""

    # Email - Resend (preferred) or SMTP fallback
    RESEND_API_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    # pietas.care is verified in Resend (eu-west-1). The old pieta.care
    # domain has been removed and any noreply@pieta.care send is rejected.
    EMAIL_FROM: str = "noreply@pietas.care"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
