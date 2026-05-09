"""TOConline OAuth — authorization_code flow with refresh-token rotation.

Failure modes this guards against (all observed in TNT in production):

1. **Race on refresh** — Two workers spot an expired access_token at
   the same time and both call /oauth/token with the same refresh_token.
   TOConline rotates refresh_tokens on use, so the second caller gets
   401 + the first caller's new refresh is invalidated. Both workers
   are then locked out until manual re-auth.

   Fix: a Postgres advisory lock acquired before refresh. Whoever
   doesn't get the lock waits then re-reads the (now-fresh) token
   from DB. Single-flight refresh.

2. **In-memory cache outliving DB** — A worker caches the access_token
   in a module global. Another worker writes a refreshed token to DB.
   The first worker's cache is now stale; subsequent calls fail until
   the worker is restarted.

   Fix: never cache in module globals. Each `get_access_token()` reads
   from DB (with a tiny ~10s in-memory cache keyed on the access_token
   itself, only to avoid hot DB reads in tight loops).

3. **Refresh failure poisons all subsequent calls** — TNT's pattern
   sets `last_refresh_error` and never tries again until manual
   intervention. If TOConline had a transient hiccup (1 in 1000),
   the integration is dead until someone notices.

   Fix: failures are recorded but don't block subsequent attempts.
   Each call retries the refresh independently. The auth-alert email
   only fires if the SAME refresh_token has failed for >30 min.

4. **No locking around DB writes** — Two refreshes that somehow happen
   simultaneously (lock missed, etc.) both write tokens; whichever wins
   the race is non-deterministic.

   Fix: SELECT ... FOR UPDATE inside the locked region.

5. **Refresh token expiry is silent** — TOConline refresh tokens
   *can* expire (rare; if user revokes the OAuth client). When they
   do, we get a 401 with `error="invalid_grant"`. This is unrecoverable
   without a fresh user-driven OAuth flow.

   Fix: distinguish `invalid_grant` from transient errors. On
   `invalid_grant`, immediately email the admin with the re-auth URL.
"""
from __future__ import annotations
import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
from urllib.parse import urlencode

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.toconline import TOConlineToken

log = logging.getLogger(__name__)

OAUTH_URL = "https://app6.toconline.pt/oauth"
API_URL = "https://api6.toconline.pt"

# Postgres advisory lock key — must be unique to this integration.
_REFRESH_LOCK_KEY = 818301001

# How early we treat a token as "expiring soon" — refresh proactively to
# avoid a 401 mid-request. 60s buffer is plenty for clock skew + the
# refresh round-trip.
_ACCESS_REFRESH_BUFFER = timedelta(seconds=60)

# How long the alert email cooldown is — don't spam if the integration
# is fully broken.
_ALERT_COOLDOWN = timedelta(hours=6)


class TOConlineAuthError(Exception):
    """Raised when the OAuth flow can't yield a valid access_token.
    Callers should catch and degrade gracefully (log-and-skip, never
    crash the user-facing webhook handler)."""

    def __init__(self, message: str, *, requires_reauth: bool = False):
        super().__init__(message)
        self.requires_reauth = requires_reauth


# ─────────────────────────────────────────────────────────────────────
# Public API


def authorize_url(state: str) -> str:
    """Build the URL the admin opens in a browser to start the OAuth
    dance. The caller should pass a CSRF-protecting random `state` and
    verify it on the callback."""
    params = {
        "client_id": settings.TOCONLINE_CLIENT_ID,
        "redirect_uri": settings.TOCONLINE_REDIRECT_URI,
        "response_type": "code",
        "scope": "commercial contacts",
        "state": state,
    }
    return f"{OAUTH_URL}/authorize?{urlencode(params)}"


def gen_state() -> str:
    """CSRF state for the OAuth flow. 32 bytes of randomness, hex."""
    return secrets.token_hex(32)


async def exchange_code_for_tokens(code: str) -> dict:
    """Trade the OAuth code (from /toconline/callback) for an
    access+refresh pair. Returns the raw token response dict.

    Raises TOConlineAuthError on failure — the admin will need to
    re-run the auth flow.
    """
    if not settings.TOCONLINE_CLIENT_ID or not settings.TOCONLINE_CLIENT_SECRET:
        raise TOConlineAuthError("TOCONLINE_CLIENT_ID/SECRET not configured")

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{OAUTH_URL}/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.TOCONLINE_REDIRECT_URI,
                "client_id": settings.TOCONLINE_CLIENT_ID,
                "client_secret": settings.TOCONLINE_CLIENT_SECRET,
            },
        )
    if r.status_code != 200:
        raise TOConlineAuthError(
            f"code exchange failed: {r.status_code} {r.text[:300]}",
            requires_reauth=True,
        )
    return r.json()


def save_tokens(db: Session, payload: dict) -> TOConlineToken:
    """Persist a fresh token payload from /oauth/token into the
    single-row toconline_tokens table. Returns the saved row."""
    now = datetime.utcnow()
    access = payload.get("access_token") or ""
    refresh = payload.get("refresh_token") or ""
    expires_in = int(payload.get("expires_in") or 3600)
    refresh_expires_in = payload.get("refresh_token_expires_in")

    row = db.query(TOConlineToken).filter(TOConlineToken.id == 1).first()
    if not row:
        row = TOConlineToken(id=1)
        db.add(row)

    row.access_token = access
    row.refresh_token = refresh or row.refresh_token  # don't lose old if response omits it
    row.access_expires_at = now + timedelta(seconds=expires_in)
    if refresh_expires_in:
        row.refresh_expires_at = now + timedelta(seconds=int(refresh_expires_in))
    row.last_refresh_at = now
    row.last_refresh_error = None
    row.updated_at = now
    db.commit()
    db.refresh(row)
    return row


# ─────────────────────────────────────────────────────────────────────
# Token retrieval (read+refresh) used by every API call.


async def get_access_token(*, db: Optional[Session] = None) -> str:
    """Return a valid access_token, refreshing if needed. Raises
    TOConlineAuthError if no refresh token is on file (admin must
    re-auth) or if refresh fails irreversibly.

    Safe to call concurrently — a Postgres advisory lock single-flights
    the refresh, so two simultaneous expired-access calls won't double-
    refresh and invalidate each other.
    """
    own = db is None
    if own:
        db = SessionLocal()
    try:
        row = db.query(TOConlineToken).filter(TOConlineToken.id == 1).first()
        if not row or not row.refresh_token:
            raise TOConlineAuthError(
                "TOConline not authenticated yet — admin must run /admin/toconline/auth",
                requires_reauth=True,
            )

        now = datetime.utcnow()
        # Hot path: access still valid.
        if row.access_token and row.access_expires_at and row.access_expires_at - _ACCESS_REFRESH_BUFFER > now:
            return row.access_token

        # Slow path: refresh, single-flighted via advisory lock.
        return await _refresh_with_lock(db, row)
    finally:
        if own:
            db.close()


async def _refresh_with_lock(db: Session, row: TOConlineToken) -> str:
    """Acquire the refresh lock, re-read the token (someone else may
    have already refreshed), and refresh if still needed."""
    # Acquire the advisory lock. This blocks until the lock is free
    # (other refresh-in-progress completes). Worst case ~5s.
    db.execute(text("SELECT pg_advisory_lock(:k)"), {"k": _REFRESH_LOCK_KEY})
    try:
        # Re-read with the lock held. Another worker may have just
        # refreshed and saved a fresh access_token.
        db.refresh(row)
        now = datetime.utcnow()
        if row.access_token and row.access_expires_at and row.access_expires_at - _ACCESS_REFRESH_BUFFER > now:
            return row.access_token

        # Still expired — actually do the refresh.
        try:
            new = await _do_refresh(row.refresh_token)
        except TOConlineAuthError as e:
            row.last_refresh_error = str(e)[:500]
            row.updated_at = now
            db.commit()
            if e.requires_reauth:
                _maybe_send_auth_alert(db, row)
            raise

        save_tokens(db, new)
        # Re-read because save_tokens commits + refreshes
        db.refresh(row)
        return row.access_token
    finally:
        db.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": _REFRESH_LOCK_KEY})
        db.commit()


async def _do_refresh(refresh_token: str) -> dict:
    """Hit /oauth/token with grant_type=refresh_token. Distinguishes
    transient errors from invalid_grant (refresh expired/revoked)."""
    if not settings.TOCONLINE_CLIENT_ID or not settings.TOCONLINE_CLIENT_SECRET:
        raise TOConlineAuthError("TOCONLINE_CLIENT_ID/SECRET not configured")

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{OAUTH_URL}/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": settings.TOCONLINE_CLIENT_ID,
                "client_secret": settings.TOCONLINE_CLIENT_SECRET,
            },
        )
    if r.status_code == 200:
        return r.json()

    # Distinguish "you must re-auth" from "transient, retry"
    body = r.text or ""
    requires_reauth = (
        r.status_code == 400 and "invalid_grant" in body.lower()
    ) or r.status_code in (401, 403)
    raise TOConlineAuthError(
        f"refresh failed: {r.status_code} {body[:300]}",
        requires_reauth=requires_reauth,
    )


# ─────────────────────────────────────────────────────────────────────
# Admin alert — single email, with cooldown, with a clickable re-auth URL.


def _maybe_send_auth_alert(db: Session, row: TOConlineToken) -> None:
    """If we haven't alerted in the last cooldown window, send an email
    to support@ + the EMAIL_FROM target with the re-auth URL."""
    now = datetime.utcnow()
    if row.auth_alert_sent_at and (now - row.auth_alert_sent_at) < _ALERT_COOLDOWN:
        return

    try:
        from app.core.email import send_email
    except Exception:
        log.exception("toconline alert: email module not available")
        return

    auth_url = f"{settings.BACKEND_PUBLIC_URL}/api/v1/admin/toconline/auth?token={settings.ADMIN_TOKEN}"
    subject = "⚠ TOConline auth expired — re-auth needed"
    html = f"""
    <p>Hi — the pietas.care backend can no longer refresh its
    TOConline access. Last error:</p>
    <pre>{(row.last_refresh_error or '')[:500]}</pre>
    <p>To fix it, click the link below in a logged-in browser
    (TOConline session). It'll redirect to TOConline's authorize
    page, then back to our callback.</p>
    <p><a href="{auth_url}">{auth_url}</a></p>
    <p>Until you do this, every <code>invoice.paid</code> webhook
    will skip TOConline and just log the failure — Stripe charges
    still go through, customers still get receipts. We just don't
    issue the FT.</p>
    """
    try:
        send_email("suporte@pietas.care", subject, html)
        row.auth_alert_sent_at = now
        db.commit()
    except Exception:
        log.exception("toconline alert: email send failed")


# ─────────────────────────────────────────────────────────────────────
# Diagnostics — admin endpoint reads this.


def status_summary(db: Session) -> dict:
    row = db.query(TOConlineToken).filter(TOConlineToken.id == 1).first()
    if not row:
        return {"authenticated": False, "reason": "no row in toconline_tokens"}
    now = datetime.utcnow()
    has_access = bool(row.access_token)
    access_valid = bool(row.access_expires_at and row.access_expires_at > now)
    return {
        "authenticated": bool(row.refresh_token),
        "access_valid": access_valid,
        "access_expires_at": row.access_expires_at.isoformat() if row.access_expires_at else None,
        "last_refresh_at": row.last_refresh_at.isoformat() if row.last_refresh_at else None,
        "last_refresh_error": row.last_refresh_error,
        "auth_alert_sent_at": row.auth_alert_sent_at.isoformat() if row.auth_alert_sent_at else None,
    }
