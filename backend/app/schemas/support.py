from datetime import datetime
from pydantic import BaseModel, Field


class SupportMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


class SupportMessageResponse(BaseModel):
    id: int
    thread_id: int
    sender_id: int
    sender_name: str
    is_admin_reply: bool
    content: str
    created_at: datetime


class SupportThreadResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    status: str
    last_message_at: datetime | None
    user_unread: int
    admin_unread: int
    last_message_preview: str | None
    created_at: datetime


class SupportThreadDetailResponse(BaseModel):
    thread: SupportThreadResponse
    messages: list[SupportMessageResponse]


class SupportUserSummaryResponse(BaseModel):
    """The user's own thread summary (for the badge)."""
    thread_id: int | None
    has_thread: bool
    unread: int
