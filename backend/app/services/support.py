"""Support chat — bridge between customers and pieta.care admins.

One thread per user. Admin users (User.is_admin = True) can read all
threads and reply. Each user only sees their own thread.
"""
from datetime import datetime
import logging
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.email import send_email
from app.models.support import SupportThread, SupportMessage
from app.models.user import User
from app.schemas.support import (
    SupportMessageResponse,
    SupportThreadResponse,
    SupportUserSummaryResponse,
)

log = logging.getLogger(__name__)


class SupportError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def _msg_to_resp(m: SupportMessage) -> SupportMessageResponse:
    return SupportMessageResponse(
        id=m.id,
        thread_id=m.thread_id,
        sender_id=m.sender_id,
        sender_name=m.sender.full_name if m.sender else "Suporte",
        is_admin_reply=m.is_admin_reply,
        content=m.content,
        created_at=m.created_at,
    )


def _thread_resp(db: Session, t: SupportThread, last_msg: SupportMessage | None = None) -> SupportThreadResponse:
    if last_msg is None:
        last_msg = (
            db.query(SupportMessage)
            .filter(SupportMessage.thread_id == t.id, SupportMessage.deleted_at.is_(None))
            .order_by(desc(SupportMessage.id))
            .first()
        )
    preview = (last_msg.content[:80] + ("…" if len(last_msg.content) > 80 else "")) if last_msg else None
    return SupportThreadResponse(
        id=t.id,
        user_id=t.user_id,
        user_name=t.user.full_name if t.user else "Desconhecido",
        user_email=t.user.email if t.user else "",
        status=t.status,
        last_message_at=t.last_message_at,
        user_unread=t.user_unread,
        admin_unread=t.admin_unread,
        last_message_preview=preview,
        created_at=t.created_at,
    )


def _ensure_thread(db: Session, user: User) -> SupportThread:
    thread = db.query(SupportThread).filter(SupportThread.user_id == user.id).first()
    if thread:
        return thread
    thread = SupportThread(user_id=user.id, status="open")
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return thread


def get_user_summary(db: Session, user: User) -> SupportUserSummaryResponse:
    thread = db.query(SupportThread).filter(SupportThread.user_id == user.id).first()
    if not thread:
        return SupportUserSummaryResponse(thread_id=None, has_thread=False, unread=0)
    return SupportUserSummaryResponse(thread_id=thread.id, has_thread=True, unread=thread.user_unread)


def list_user_messages(db: Session, user: User) -> list[SupportMessageResponse]:
    thread = db.query(SupportThread).filter(SupportThread.user_id == user.id).first()
    if not thread:
        return []
    msgs = (
        db.query(SupportMessage)
        .filter(SupportMessage.thread_id == thread.id, SupportMessage.deleted_at.is_(None))
        .order_by(SupportMessage.id.asc())
        .all()
    )
    # Mark thread as read for the user
    if thread.user_unread:
        thread.user_unread = 0
        db.commit()
    return [_msg_to_resp(m) for m in msgs]


def post_user_message(db: Session, user: User, content: str) -> SupportMessageResponse:
    text = (content or "").strip()
    if not text:
        raise SupportError("Mensagem vazia", 400)
    if len(text) > 4000:
        raise SupportError("Mensagem demasiado longa (máx. 4000 caracteres)", 400)

    thread = _ensure_thread(db, user)

    msg = SupportMessage(
        thread_id=thread.id,
        sender_id=user.id,
        is_admin_reply=False,
        content=text,
    )
    db.add(msg)
    thread.last_message_at = datetime.utcnow()
    thread.admin_unread = (thread.admin_unread or 0) + 1
    if thread.status == "closed":
        thread.status = "open"
    db.commit()
    db.refresh(msg)

    _notify_admins_async(db, user, text)
    return _msg_to_resp(msg)


def _notify_admins_async(db: Session, user: User, content: str) -> None:
    """Email all admin users that a new support message arrived. Best-effort."""
    try:
        admins = db.query(User).filter(User.is_admin == True, User.deleted_at.is_(None)).all()
        if not admins:
            return
        subject = f"[suporte] Nova mensagem de {user.full_name}"
        snippet = content[:300] + ("…" if len(content) > 300 else "")
        html = f"""<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;color:#1a2b22;padding:20px;">
            <h2 style="font-size:18px;margin:0 0 12px;">Nova mensagem de suporte</h2>
            <p style="margin:0 0 6px;font-size:14px;"><strong>De:</strong> {user.full_name} &lt;{user.email}&gt;</p>
            <p style="margin:0 0 12px;font-size:14px;"><strong>Plano:</strong> {user.subscription_status}{' / ' + user.subscription_plan if user.subscription_plan else ''}</p>
            <div style="background:#F8FAF9;border:1px solid #E2EBE5;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap;">{snippet}</div>
            <p style="margin:16px 0 0;font-size:13px;">
              <a href="https://pieta.care/admin/suporte" style="color:#2A6049;font-weight:700;">Responder no painel →</a>
            </p>
        </body></html>"""
        for admin in admins:
            send_email(admin.email, subject, html)
    except Exception:
        log.exception("failed to notify admins of new support message")


# ─────────── Admin operations ───────────

def _require_admin(user: User) -> None:
    if not user.is_admin:
        raise SupportError("Acesso restrito a administradores", 403)


def list_admin_threads(db: Session, admin: User) -> list[SupportThreadResponse]:
    _require_admin(admin)
    threads = (
        db.query(SupportThread)
        .order_by(desc(SupportThread.last_message_at), desc(SupportThread.id))
        .all()
    )
    return [_thread_resp(db, t) for t in threads]


def get_admin_thread(db: Session, admin: User, thread_id: int) -> tuple[SupportThreadResponse, list[SupportMessageResponse]]:
    _require_admin(admin)
    thread = db.query(SupportThread).filter(SupportThread.id == thread_id).first()
    if not thread:
        raise SupportError("Thread não encontrada", 404)
    msgs = (
        db.query(SupportMessage)
        .filter(SupportMessage.thread_id == thread.id, SupportMessage.deleted_at.is_(None))
        .order_by(SupportMessage.id.asc())
        .all()
    )
    # Mark as read for admin
    if thread.admin_unread:
        thread.admin_unread = 0
        db.commit()
    return _thread_resp(db, thread), [_msg_to_resp(m) for m in msgs]


def post_admin_reply(db: Session, admin: User, thread_id: int, content: str) -> SupportMessageResponse:
    _require_admin(admin)
    text = (content or "").strip()
    if not text:
        raise SupportError("Mensagem vazia", 400)
    thread = db.query(SupportThread).filter(SupportThread.id == thread_id).first()
    if not thread:
        raise SupportError("Thread não encontrada", 404)

    msg = SupportMessage(
        thread_id=thread.id,
        sender_id=admin.id,
        is_admin_reply=True,
        content=text,
    )
    db.add(msg)
    thread.last_message_at = datetime.utcnow()
    thread.user_unread = (thread.user_unread or 0) + 1
    db.commit()
    db.refresh(msg)
    return _msg_to_resp(msg)


def admin_unread_total(db: Session, admin: User) -> int:
    _require_admin(admin)
    rows = db.query(SupportThread).all()
    return sum(t.admin_unread or 0 for t in rows)


def admin_delete_message(db: Session, admin: User, message_id: int) -> None:
    """Soft-delete an admin reply. Only admin replies can be deleted —
    user messages are immutable. Any admin can delete any admin reply."""
    _require_admin(admin)
    msg = db.query(SupportMessage).filter(SupportMessage.id == message_id).first()
    if not msg:
        raise SupportError("Mensagem não encontrada", 404)
    if not msg.is_admin_reply:
        raise SupportError("Só é possível apagar respostas do suporte", 403)
    if msg.deleted_at is not None:
        return  # already deleted, no-op
    msg.deleted_at = datetime.utcnow()
    db.commit()
