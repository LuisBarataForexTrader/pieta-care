from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.support import (
    SupportMessageRequest,
    SupportMessageResponse,
    SupportThreadResponse,
    SupportUserSummaryResponse,
)
from app.services.support import (
    get_user_summary,
    list_user_messages,
    post_user_message,
    list_admin_threads,
    get_admin_thread,
    post_admin_reply,
    admin_unread_total,
    admin_delete_message,
    SupportError,
)

router = APIRouter(prefix="/support", tags=["support"])


# ── User-facing ─────────────────────────────────────────

@router.get("/me", response_model=SupportUserSummaryResponse)
def my_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_user_summary(db, user)


@router.get("/messages", response_model=list[SupportMessageResponse])
def my_messages(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list_user_messages(db, user)


@router.post("/messages", response_model=SupportMessageResponse, status_code=201)
def send(
    data: SupportMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return post_user_message(db, user, data.content)
    except SupportError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ── Admin-facing ────────────────────────────────────────

@router.get("/admin/threads", response_model=list[SupportThreadResponse])
def admin_list(db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    try:
        return list_admin_threads(db, admin)
    except SupportError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/admin/threads/{thread_id}")
def admin_view(
    thread_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user),
):
    try:
        thread, messages = get_admin_thread(db, admin, thread_id)
        return {"thread": thread.model_dump(), "messages": [m.model_dump() for m in messages]}
    except SupportError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/admin/threads/{thread_id}/reply", response_model=SupportMessageResponse, status_code=201)
def admin_reply(
    thread_id: int,
    data: SupportMessageRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user),
):
    try:
        return post_admin_reply(db, admin, thread_id, data.content)
    except SupportError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/admin/unread")
def admin_unread(db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    try:
        return {"unread": admin_unread_total(db, admin)}
    except SupportError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/admin/messages/{message_id}", status_code=204)
def admin_delete(
    message_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user),
):
    try:
        admin_delete_message(db, admin, message_id)
    except SupportError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
