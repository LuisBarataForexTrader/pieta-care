from datetime import datetime
from pydantic import BaseModel, field_validator


EVENT_TYPES = ("consulta", "exame", "visita", "fisioterapia", "outro")


class EventCreateRequest(BaseModel):
    title: str
    description: str | None = None
    event_type: str = "outro"
    starts_at: datetime
    ends_at: datetime | None = None
    location: str | None = None
    doctor_name: str | None = None
    reminder_minutes: int = 60

    @field_validator("event_type")
    @classmethod
    def validate_type(cls, v):
        if v not in EVENT_TYPES:
            raise ValueError(f"Tipo inválido. Use: {', '.join(EVENT_TYPES)}")
        return v


class EventUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    event_type: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    location: str | None = None
    doctor_name: str | None = None
    reminder_minutes: int | None = None
    is_completed: bool | None = None


class EventResponse(BaseModel):
    id: int
    elderly_id: int
    created_by: int
    created_by_name: str
    title: str
    description: str | None
    event_type: str
    starts_at: datetime
    ends_at: datetime | None
    location: str | None
    doctor_name: str | None
    reminder_minutes: int
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskCreateRequest(BaseModel):
    title: str
    description: str | None = None
    assigned_to: int | None = None
    due_date: datetime | None = None


class TaskUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    assigned_to: int | None = None
    due_date: datetime | None = None
    is_completed: bool | None = None


class TaskResponse(BaseModel):
    id: int
    elderly_id: int
    created_by: int
    created_by_name: str
    assigned_to: int | None
    assigned_to_name: str | None
    title: str
    description: str | None
    due_date: datetime | None
    is_completed: bool
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UpcomingResponse(BaseModel):
    events: list[EventResponse]
    tasks: list[TaskResponse]
