"""
Admin API — all routes under /admin/*

Authentication: every endpoint requires the `x-admin-token` header to match
the ADMIN_TOKEN env var. No JWT involved — this is a server-to-server / admin
tool, not user-facing.
"""

from datetime import datetime, timedelta
import re

import httpx
from fastapi import APIRouter, Body, Depends, Header, HTTPException
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.elderly import ElderlyProfile
from app.models.medication import MedicationLog
from app.models.support import SupportMessage, SupportThread
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Auth ─────────────────────────────────────────────────────────────────────

def _require_token(x_admin_token: str = Header(None, alias="x-admin-token")):
    if not settings.ADMIN_TOKEN or x_admin_token != settings.ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── Overview stats ────────────────────────────────────────────────────────────

@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(_require_token)):
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    base = db.query(User).filter(User.deleted_at.is_(None))

    total_users     = base.count()
    trial_users     = base.filter(User.subscription_status == "trial").count()
    active_users    = base.filter(User.subscription_status == "active").count()
    cancelled_users = base.filter(User.subscription_status == "cancelled").count()
    new_this_week   = base.filter(User.created_at >= week_start).count()
    new_this_month  = base.filter(User.created_at >= month_start).count()
    active_24h      = base.filter(User.last_seen_at >= now - timedelta(hours=24)).count()

    total_elderly = db.query(func.count(ElderlyProfile.id)).scalar() or 0

    meds_today = db.query(func.count(MedicationLog.id)).filter(
        MedicationLog.confirmed_at >= today
    ).scalar() or 0
    meds_week = db.query(func.count(MedicationLog.id)).filter(
        MedicationLog.confirmed_at >= week_start
    ).scalar() or 0

    support_unread = int(db.query(func.sum(SupportThread.admin_unread)).scalar() or 0)
    support_open   = db.query(func.count(SupportThread.id)).filter(
        SupportThread.status == "open"
    ).count()

    plan_rows = db.query(
        User.subscription_plan, func.count(User.id)
    ).filter(
        User.deleted_at.is_(None), User.subscription_status == "active"
    ).group_by(User.subscription_plan).all()
    plans = {(p or "sem_plano"): c for p, c in plan_rows}

    # Signups per day for the last 14 days (for sparkline)
    signups_14d = []
    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        nxt = day + timedelta(days=1)
        n = db.query(func.count(User.id)).filter(
            User.created_at >= day, User.created_at < nxt
        ).scalar() or 0
        signups_14d.append({"date": day.strftime("%d/%m"), "count": n})

    return {
        "users": {
            "total": total_users,
            "trial": trial_users,
            "active": active_users,
            "cancelled": cancelled_users,
            "new_this_week": new_this_week,
            "new_this_month": new_this_month,
            "active_24h": active_24h,
        },
        "elderly": {"total": total_elderly},
        "medication": {"today": meds_today, "this_week": meds_week},
        "support": {"unread": support_unread, "open": support_open},
        "plans": plans,
        "signups_14d": signups_14d,
    }


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
def admin_users(
    db: Session = Depends(get_db),
    _=Depends(_require_token),
    skip: int = 0,
    limit: int = 50,
    search: str = "",
    status: str = "",
):
    q = db.query(User).filter(User.deleted_at.is_(None))
    if search:
        like = f"%{search}%"
        q = q.filter((User.email.ilike(like)) | (User.full_name.ilike(like)))
    if status:
        q = q.filter(User.subscription_status == status)

    total = q.count()
    users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "users": [_user_dict(u) for u in users],
    }


def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "subscription_status": u.subscription_status,
        "subscription_plan": u.subscription_plan,
        "trial_ends_at": u.trial_ends_at.isoformat() if u.trial_ends_at else None,
        "created_at": u.created_at.isoformat(),
        "last_seen_at": u.last_seen_at.isoformat() if u.last_seen_at else None,
        "is_verified": u.is_verified,
        "is_admin": u.is_admin,
        "is_active": u.is_active,
    }


@router.get("/users/{user_id}")
def admin_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(_require_token),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Not found")
    profiles = db.query(ElderlyProfile).filter(ElderlyProfile.created_by == user_id).all()
    return {
        **_user_dict(user),
        "elderly_profiles": [
            {"id": p.id, "full_name": p.full_name} for p in profiles
        ],
    }


@router.patch("/users/{user_id}")
def admin_update_user(
    user_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(_require_token),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Not found")

    allowed = {"subscription_status", "subscription_plan", "is_admin", "is_active",
               "trial_ends_at", "is_verified"}
    for field, value in data.items():
        if field not in allowed:
            continue
        if field == "trial_ends_at" and isinstance(value, str):
            value = datetime.fromisoformat(value)
        setattr(user, field, value)

    db.commit()
    return {"ok": True}


# ── Support ───────────────────────────────────────────────────────────────────

@router.get("/support/threads")
def admin_support_threads(
    db: Session = Depends(get_db),
    _=Depends(_require_token),
):
    threads = (
        db.query(SupportThread)
        .order_by(SupportThread.admin_unread.desc(), SupportThread.last_message_at.desc())
        .limit(100)
        .all()
    )
    result = []
    for t in threads:
        user = db.query(User).filter(User.id == t.user_id).first()
        result.append({
            "id": t.id,
            "user_id": t.user_id,
            "user_email": user.email if user else "",
            "user_name": user.full_name if user else "",
            "user_plan": user.subscription_status if user else "",
            "status": t.status,
            "admin_unread": t.admin_unread,
            "last_message_at": t.last_message_at.isoformat() if t.last_message_at else None,
        })
    return result


@router.get("/support/threads/{thread_id}")
def admin_support_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    _=Depends(_require_token),
):
    thread = db.query(SupportThread).filter(SupportThread.id == thread_id).first()
    if not thread:
        raise HTTPException(404, "Not found")

    user = db.query(User).filter(User.id == thread.user_id).first()
    msgs = (
        db.query(SupportMessage)
        .filter(SupportMessage.thread_id == thread_id, SupportMessage.deleted_at.is_(None))
        .order_by(SupportMessage.created_at)
        .all()
    )

    thread.admin_unread = 0
    db.commit()

    return {
        "id": thread.id,
        "status": thread.status,
        "user": {"id": user.id, "email": user.email, "name": user.full_name,
                 "plan": user.subscription_status} if user else None,
        "messages": [
            {
                "id": m.id,
                "content": m.content,
                "is_admin_reply": m.is_admin_reply,
                "created_at": m.created_at.isoformat(),
            }
            for m in msgs
        ],
    }


@router.post("/support/threads/{thread_id}/reply")
def admin_support_reply(
    thread_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(_require_token),
):
    thread = db.query(SupportThread).filter(SupportThread.id == thread_id).first()
    if not thread:
        raise HTTPException(404, "Not found")

    content = (data.get("content") or "").strip()
    if not content:
        raise HTTPException(400, "Content required")

    # Use admin user id=0 as sender (or any admin user)
    msg = SupportMessage(
        thread_id=thread_id,
        sender_id=thread.user_id,
        is_admin_reply=True,
        content=content,
    )
    db.add(msg)
    thread.last_message_at = datetime.utcnow()
    thread.user_unread = (thread.user_unread or 0) + 1
    db.commit()
    db.refresh(msg)

    return {"ok": True, "id": msg.id, "created_at": msg.created_at.isoformat()}


@router.patch("/support/threads/{thread_id}/status")
def admin_support_status(
    thread_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(_require_token),
):
    thread = db.query(SupportThread).filter(SupportThread.id == thread_id).first()
    if not thread:
        raise HTTPException(404, "Not found")
    thread.status = data.get("status", thread.status)
    db.commit()
    return {"ok": True}


# ── SEO articles ──────────────────────────────────────────────────────────────

@router.get("/seo")
async def admin_seo(_=Depends(_require_token)):
    """Parse pietas.care/sitemap.xml to list /guias/* articles."""
    articles: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://pietas.care/sitemap.xml")
            if r.status_code == 200:
                urls = re.findall(
                    r"<loc>(https://pietas\.care/guias/([^<]+))</loc>", r.text
                )
                articles = [slug for _, slug in urls]
    except Exception:
        pass

    return {"count": len(articles), "articles": articles}


# ── System health ─────────────────────────────────────────────────────────────

@router.get("/system")
def admin_system(db: Session = Depends(get_db), _=Depends(_require_token)):
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    env = {
        "DATABASE_URL": bool(settings.DATABASE_URL),
        "SECRET_KEY": bool(settings.SECRET_KEY),
        "STRIPE_SECRET_KEY": bool(settings.STRIPE_SECRET_KEY),
        "RESEND_API_KEY": bool(settings.RESEND_API_KEY),
        "ANTHROPIC_API_KEY": bool(settings.ANTHROPIC_API_KEY),
        "ADMIN_TOKEN": bool(settings.ADMIN_TOKEN),
        "HETZNER_STORAGE_ACCESS_KEY": bool(settings.HETZNER_STORAGE_ACCESS_KEY),
        "TOCONLINE_CLIENT_ID": bool(settings.TOCONLINE_CLIENT_ID),
        "WEBPUSH_VAPID_PUBLIC_KEY": bool(settings.WEBPUSH_VAPID_PUBLIC_KEY),
    }

    return {
        "database": db_ok,
        "env_vars": env,
        "version": settings.VERSION,
    }
