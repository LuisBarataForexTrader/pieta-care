from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    MarkReadRequest,
    UnreadCountResponse,
)
from app.services.chat import (
    list_messages,
    send_message,
    mark_read,
    unread_count,
    ChatError,
)

router = APIRouter(prefix="/elderly/{elderly_id}/chat", tags=["chat"])


@router.get("", response_model=list[ChatMessageResponse])
def list_chat(
    elderly_id: int,
    since_id: int | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return list_messages(db, elderly_id, user, since_id=since_id, limit=limit)
    except ChatError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("", response_model=ChatMessageResponse, status_code=201)
def post_chat(
    elderly_id: int,
    data: ChatMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return send_message(db, elderly_id, user, data.content)
    except ChatError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/read", status_code=204)
def post_read(
    elderly_id: int,
    data: MarkReadRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        mark_read(db, elderly_id, user, data.last_read_message_id)
    except ChatError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/unread", response_model=UnreadCountResponse)
def get_unread(
    elderly_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return unread_count(db, elderly_id, user)
    except ChatError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
