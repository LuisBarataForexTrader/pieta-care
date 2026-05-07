import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.stripe_client import build_price_map
from app.api import auth, elderly, medication, calendar, document, billing, health
from app.tasks.trial_emails import run_trial_emails

UPLOAD_DIR = "/app/uploads"
log = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="Europe/Lisbon")


def _trial_emails_job():
    try:
        result = run_trial_emails()
        log.info("trial_emails job: %s", result)
    except Exception:
        log.exception("trial_emails job failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    build_price_map()

    # Daily sweep at 10:00 Europe/Lisbon — sends day-2, day-7, day-13 trial emails
    scheduler.add_job(
        _trial_emails_job,
        CronTrigger(hour=10, minute=0),
        id="trial_emails",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    log.info("scheduler started")
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, settings.FRONTEND_URL_VERCEL, "http://localhost:3000", "http://localhost:3005"],
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
app.include_router(health.router, prefix="/api/v1")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, check_dir=False), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.VERSION}
