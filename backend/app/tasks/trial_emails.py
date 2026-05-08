"""Trial onboarding email sequence.

Three touch-points within the 14-day free trial:

  - day_2  : friendly check-in + offer support via in-app chat
  - day_7  : midpoint feedback request
  - day_13 : warning that the trial ends in ~24h, point to /conta

Idempotent: each user has a JSON list `trial_emails_sent` and we only
fire an email if its key is not in the list yet. Safe to run hourly.
"""
from __future__ import annotations
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.email import (
    send_email,
    trial_day2_html,
    trial_day7_html,
    trial_day13_html,
)
from app.models.user import User

log = logging.getLogger(__name__)

# (key, days_into_trial_window_start, days_into_trial_window_end, subject, html_fn)
# Window keeps the email in scope for ~24h so the hourly job can pick it up
# regardless of when the user registered during the day.
MILESTONES = [
    ("day_2",  2,  3,  "Tudo a correr bem? — pietas.care",                trial_day2_html),
    ("day_7",  7,  8,  "Como tem sido a experiência? — pietas.care",      trial_day7_html),
    ("day_13", 13, 14, "Faltam 24 horas no seu trial — pietas.care",      trial_day13_html),
]


def _sent_keys(user: User) -> list[str]:
    if not user.trial_emails_sent:
        return []
    try:
        v = json.loads(user.trial_emails_sent)
        return v if isinstance(v, list) else []
    except Exception:
        return []


def _record_sent(user: User, key: str) -> None:
    keys = _sent_keys(user)
    if key not in keys:
        keys.append(key)
    user.trial_emails_sent = json.dumps(keys)


def _trial_start(user: User) -> datetime | None:
    """Approximate the trial start: registration time."""
    return user.created_at


def run_trial_emails(db: Session | None = None) -> dict:
    """Iterate active-trial users and dispatch any due emails.
    Returns a small summary dict for logs."""
    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        now = datetime.utcnow()
        sent = 0
        skipped = 0

        users = (
            db.query(User)
            .filter(
                User.is_verified == True,
                User.deleted_at.is_(None),
                User.subscription_status == "trial",
                User.trial_ends_at.isnot(None),
            )
            .all()
        )

        for user in users:
            # Skip if already converted to a paid plan
            if user.subscription_plan and user.subscription_status not in ("trial",):
                skipped += 1
                continue

            start = _trial_start(user)
            if not start:
                continue

            days_in = (now - start).days
            already_sent = _sent_keys(user)

            for key, lo, hi, subject, html_fn in MILESTONES:
                if key in already_sent:
                    continue
                if not (lo <= days_in < hi):
                    continue

                html = html_fn(user.full_name)
                ok = send_email(user.email, subject, html)
                if ok:
                    _record_sent(user, key)
                    db.commit()
                    sent += 1
                    log.info("trial email sent: user=%s key=%s", user.email, key)
                else:
                    log.warning("trial email failed: user=%s key=%s", user.email, key)
                # Only one milestone per run per user
                break

        return {"sent": sent, "skipped": skipped, "users_checked": len(users)}
    finally:
        if own_session:
            db.close()
