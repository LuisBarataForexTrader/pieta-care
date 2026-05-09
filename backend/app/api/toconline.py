"""TOConline OAuth endpoints.

Three endpoints, two privacy levels:

- **GET /admin/toconline/auth** — admin-only. Builds the TOConline
  authorize URL and either redirects (browser) or returns it as JSON
  (API). Stores the CSRF state in an in-memory dict keyed by random ID.
- **GET /toconline/callback** — public; TOConline redirects here with
  ?code=… &state=…. Verifies state, exchanges code, persists tokens.
- **GET /admin/toconline/status** — admin-only diagnostics: are we
  authenticated, when does the access expire, last error, etc.

The admin token gating is intentionally simple — a shared secret in
the URL or Authorization header. Same pattern TNT uses. Set
`ADMIN_TOKEN` env var to a long random string.
"""
from __future__ import annotations
import logging
import time
from typing import Dict, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.services.toconline_oauth import (
    authorize_url,
    exchange_code_for_tokens,
    gen_state,
    save_tokens,
    status_summary,
    TOConlineAuthError,
)

log = logging.getLogger(__name__)

router = APIRouter(tags=["toconline"])


# ─────────────────────────────────────────────────────────────────────
# CSRF state — in-memory store. State is single-use; valid for 10 min.

_STATE_TTL = 600  # 10 min
_states: Dict[str, float] = {}  # state → expiry timestamp


def _store_state(state: str) -> None:
    now = time.time()
    # Garbage-collect expired states on each store
    for s, t in list(_states.items()):
        if t < now:
            del _states[s]
    _states[state] = now + _STATE_TTL


def _consume_state(state: str) -> bool:
    t = _states.pop(state, None)
    return t is not None and t > time.time()


# ─────────────────────────────────────────────────────────────────────
# Admin token guard


def _require_admin(token: str | None) -> None:
    if not settings.ADMIN_TOKEN:
        raise HTTPException(503, "ADMIN_TOKEN not configured on server")
    if token != settings.ADMIN_TOKEN:
        raise HTTPException(403, "Admin token required")


# ─────────────────────────────────────────────────────────────────────
# Admin: start OAuth flow


@router.get("/admin/toconline/auth")
def start_oauth(
    token: str = Query(..., description="Admin token"),
    json_only: bool = Query(False, description="Return URL as JSON instead of redirecting"),
):
    """Build the authorize URL and either redirect or return it as JSON.
    The admin opens this in a browser; TOConline asks for permission;
    on accept, TOConline POSTs back to /toconline/callback which
    persists the tokens.
    """
    _require_admin(token)
    if not settings.TOCONLINE_CLIENT_ID:
        raise HTTPException(503, "TOCONLINE_CLIENT_ID not configured")

    state = gen_state()
    _store_state(state)
    url = authorize_url(state)
    if json_only:
        return {"url": url, "state": state}
    return RedirectResponse(url, status_code=302)


# ─────────────────────────────────────────────────────────────────────
# Public: OAuth callback (TOConline redirects here)


@router.get("/toconline/callback", response_class=HTMLResponse)
async def oauth_callback(
    request: Request,
    code: str | None = Query(None),
    state: str | None = Query(None),
    error: str | None = Query(None),
    error_description: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """TOConline redirects here after the user authorizes. We exchange
    the code for tokens and persist."""
    if error:
        return _result_page(
            ok=False,
            title="Autorização recusada",
            body=f"<code>{error}</code>: {error_description or ''}",
        )
    if not code or not state:
        return _result_page(ok=False, title="Callback inválido", body="missing code or state")
    if not _consume_state(state):
        return _result_page(ok=False, title="State inválido ou expirado", body="Re-run /admin/toconline/auth.")

    try:
        payload = await exchange_code_for_tokens(code)
    except TOConlineAuthError as e:
        log.exception("toconline callback: code exchange failed")
        return _result_page(ok=False, title="Falha na troca do código", body=str(e))

    save_tokens(db, payload)
    return _result_page(
        ok=True,
        title="TOConline autenticado ✅",
        body="A conta TOConline está agora ligada ao pietas.care. As próximas faturas serão emitidas automaticamente.",
    )


def _result_page(*, ok: bool, title: str, body: str) -> HTMLResponse:
    color = "#2A6049" if ok else "#B91C1C"
    icon = "✅" if ok else "⚠"
    html = f"""<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"><title>{title}</title>
<style>
  body{{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
       background:#FAFAF7;color:#1a2b22;margin:0;padding:64px 24px;
       display:flex;align-items:center;justify-content:center;min-height:100vh}}
  .card{{background:#fff;max-width:480px;padding:40px 36px;border-radius:16px;
        box-shadow:0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.06)}}
  h1{{margin:0 0 8px;font-size:22px;letter-spacing:-.02em;color:{color}}}
  p{{margin:0;color:#4a6458;line-height:1.6;font-size:15px}}
  .icon{{font-size:32px;margin-bottom:12px}}
</style></head>
<body><div class="card">
  <div class="icon">{icon}</div>
  <h1>{title}</h1>
  <p>{body}</p>
</div></body></html>"""
    return HTMLResponse(html, status_code=200 if ok else 400)


# ─────────────────────────────────────────────────────────────────────
# Admin: diagnostics


@router.get("/admin/toconline/status")
def status(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    _require_admin(token)
    return status_summary(db)
