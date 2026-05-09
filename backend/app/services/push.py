"""Web Push notifications via VAPID.

Sends a push payload to all of a user's registered subscriptions.
Subscriptions that come back 404/410 (browser revoked / unsubscribed)
are pruned automatically so we don't keep retrying dead endpoints.

Environment:
  WEBPUSH_VAPID_PUBLIC_KEY   - URL-safe base64, shared with the browser
  WEBPUSH_VAPID_PRIVATE_KEY  - URL-safe base64, kept on the server only
  WEBPUSH_VAPID_SUBJECT      - mailto: URL with a contact email

Generate the keypair locally once with:
  pip install py-vapid
  vapid --gen
  vapid --applicationServerKey   # gives the public key for the browser
"""
from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.push import PushSubscription

log = logging.getLogger(__name__)


def _vapid_claims() -> dict[str, str] | None:
    if not getattr(settings, "WEBPUSH_VAPID_PRIVATE_KEY", None):
        return None
    return {
        "sub": getattr(settings, "WEBPUSH_VAPID_SUBJECT", "mailto:suporte@pietas.care"),
    }


def send_to_user(db: Session, user_id: int, payload: dict[str, Any]) -> int:
    """Push the payload to every subscription belonging to user_id.
    Returns the count of successful deliveries. Dead subscriptions get
    pruned. Returns 0 silently if VAPID isn't configured (dev/test)."""
    private_key = getattr(settings, "WEBPUSH_VAPID_PRIVATE_KEY", None)
    if not private_key:
        log.info("push: VAPID not configured, skipping send to user=%s", user_id)
        return 0

    try:
        from pywebpush import WebPushException, webpush  # type: ignore
    except Exception as exc:  # noqa: BLE001
        log.warning("push: pywebpush import failed: %s", exc)
        return 0

    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    if not subs:
        return 0

    claims = _vapid_claims() or {}
    sent = 0
    dead_ids: list[int] = []
    body = json.dumps(payload)

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=body,
                vapid_private_key=private_key,
                vapid_claims=claims.copy(),
                ttl=3600,  # browser delivery window in seconds
            )
            sent += 1
        except WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):
                # Browser has unsubscribed - prune.
                dead_ids.append(sub.id)
            else:
                log.warning("push: webpush error (status=%s) for sub=%s: %s", status, sub.id, exc)
        except Exception as exc:  # noqa: BLE001
            log.warning("push: unexpected error for sub=%s: %s", sub.id, exc)

    if dead_ids:
        from sqlalchemy import delete
        db.execute(delete(PushSubscription).where(PushSubscription.id.in_(dead_ids)))
        db.commit()
        log.info("push: pruned %d dead subscriptions", len(dead_ids))

    return sent
