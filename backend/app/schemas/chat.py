from datetime import datetime
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    id: int
    elderly_id: int
    sender_id: int
    sender_name: str
    content: str
    created_at: datetime


class MarkReadRequest(BaseModel):
    last_read_message_id: int


class UnreadCountResponse(BaseModel):
    elderly_id: int
    unread: int
    last_message_id: int | None
