"""Browser push subscription registration."""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.push import PushSubscription
from app.models.user import User

router = APIRouter(prefix="/push", tags=["push"])


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: PushKeys


class PushSubscribeResponse(BaseModel):
    ok: bool


@router.get("/public-key")
def public_key():
    """Returned by the frontend before calling pushManager.subscribe().
    Empty string if VAPID isn't configured (so the UI can hide the
    'Activar notificações' option in dev / test)."""
    return {"public_key": getattr(settings, "WEBPUSH_VAPID_PUBLIC_KEY", "") or ""}


@router.post("/subscribe", response_model=PushSubscribeResponse, status_code=201)
def subscribe(
    data: PushSubscribeRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not data.endpoint or not data.keys.p256dh or not data.keys.auth:
        raise HTTPException(status_code=400, detail="Subscription incomplete")

    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == data.endpoint).first()
    ua = request.headers.get("user-agent", "")[:255]
    if existing:
        existing.user_id = user.id
        existing.p256dh = data.keys.p256dh
        existing.auth = data.keys.auth
        existing.user_agent = ua
        existing.last_used_at = datetime.utcnow()
    else:
        db.add(PushSubscription(
            user_id=user.id,
            endpoint=data.endpoint,
            p256dh=data.keys.p256dh,
            auth=data.keys.auth,
            user_agent=ua,
            last_used_at=datetime.utcnow(),
        ))
    db.commit()
    return PushSubscribeResponse(ok=True)


class PushUnsubscribeRequest(BaseModel):
    endpoint: str


@router.post("/unsubscribe", response_model=PushSubscribeResponse)
def unsubscribe(
    data: PushUnsubscribeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint,
        PushSubscription.user_id == user.id,
    ).delete()
    db.commit()
    return PushSubscribeResponse(ok=True)
