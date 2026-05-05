from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.stripe_client import build_price_map
from app.api import auth, elderly, medication, calendar, document, billing


@asynccontextmanager
async def lifespan(app: FastAPI):
    build_price_map()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(elderly.router, prefix="/api/v1")
app.include_router(medication.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(document.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.VERSION}
