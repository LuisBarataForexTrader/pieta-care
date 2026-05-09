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
from app.api import auth, elderly, medication, calendar, document, billing, health, chat, support, ai_insights, feedback, push, toconline as toconline_api
from app.tasks.trial_emails import run_trial_emails
from app.tasks.weekly_digest import run_weekly_digest

UPLOAD_DIR = "/app/uploads"
log = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="Europe/Lisbon")


def _trial_emails_job():
    """Hourly trial-email sweep.

    Uvicorn runs with --workers 2, so each worker also boots its own
    AsyncIOScheduler. Without coordination both fire at 10:00 and both
    send emails (the dedup check on user.trial_emails_sent races between
    the read and the commit). We use a Postgres advisory lock so only
    ONE worker actually runs the job; the other skips silently.
    """
    from sqlalchemy import text
    from app.core.database import SessionLocal

    LOCK_KEY = 773700001  # arbitrary, unique to this job
    db = SessionLocal()
    try:
        got = db.execute(text("SELECT pg_try_advisory_lock(:k)"), {"k": LOCK_KEY}).scalar()
        if not got:
            log.info("trial_emails skipped: another worker holds the lock")
            return
        try:
            result = run_trial_emails(db)
            log.info("trial_emails job: %s", result)
        except Exception:
            log.exception("trial_emails job failed")
        finally:
            db.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": LOCK_KEY})
            db.commit()
    finally:
        db.close()


def _weekly_digest_job():
    """Same advisory-lock pattern as the trial sweep, different lock key."""
    from sqlalchemy import text
    from app.core.database import SessionLocal

    LOCK_KEY = 773700002
    db = SessionLocal()
    try:
        got = db.execute(text("SELECT pg_try_advisory_lock(:k)"), {"k": LOCK_KEY}).scalar()
        if not got:
            log.info("weekly_digest skipped: another worker holds the lock")
            return
        try:
            result = run_weekly_digest(db)
            log.info("weekly_digest job: %s", result)
        except Exception:
            log.exception("weekly_digest job failed")
        finally:
            db.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": LOCK_KEY})
            db.commit()
    finally:
        db.close()


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
    # Sundays at 09:00 Europe/Lisbon — weekly digest to household owners
    scheduler.add_job(
        _weekly_digest_job,
        CronTrigger(day_of_week="sun", hour=9, minute=0),
        id="weekly_digest",
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
app.include_router(chat.router, prefix="/api/v1")
app.include_router(support.router, prefix="/api/v1")
app.include_router(ai_insights.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(push.router, prefix="/api/v1")
app.include_router(toconline_api.router, prefix="/api/v1")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, check_dir=False), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.VERSION}
