from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.calendar import (
    EventCreateRequest,
    EventUpdateRequest,
    EventResponse,
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskResponse,
    UpcomingResponse,
)
from app.services.calendar import (
    create_event,
    list_events,
    update_event,
    delete_event,
    create_task,
    list_tasks,
    update_task,
    delete_task,
    get_upcoming,
    CalendarError,
)

router = APIRouter(prefix="/elderly/{elderly_id}", tags=["calendar"])


def _raise(e: CalendarError):
    raise HTTPException(status_code=e.status_code, detail=e.message)


# ── EVENTS ──────────────────────────────────────────────

@router.post("/events", response_model=EventResponse, status_code=201)
def create_ev(
    elderly_id: int,
    data: EventCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return create_event(db, elderly_id, data, user)
    except CalendarError as e:
        _raise(e)


@router.get("/events", response_model=list[EventResponse])
def list_ev(
    elderly_id: int,
    from_date: datetime | None = Query(default=None),
    to_date: datetime | None = Query(default=None),
    include_completed: bool = Query(default=True),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return list_events(db, elderly_id, user, from_date, to_date, include_completed)
    except CalendarError as e:
        _raise(e)


@router.patch("/events/{event_id}", response_model=EventResponse)
def update_ev(
    elderly_id: int,
    event_id: int,
    data: EventUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return update_event(db, elderly_id, event_id, data, user)
    except CalendarError as e:
        _raise(e)


@router.delete("/events/{event_id}", status_code=204)
def delete_ev(
    elderly_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        delete_event(db, elderly_id, event_id, user)
    except CalendarError as e:
        _raise(e)


# ── TASKS ────────────────────────────────────────────────

@router.post("/tasks", response_model=TaskResponse, status_code=201)
def create_tk(
    elderly_id: int,
    data: TaskCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return create_task(db, elderly_id, data, user)
    except CalendarError as e:
        _raise(e)


@router.get("/tasks", response_model=list[TaskResponse])
def list_tk(
    elderly_id: int,
    include_completed: bool = Query(default=False),
    assigned_to_me: bool = Query(default=False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return list_tasks(db, elderly_id, user, include_completed, assigned_to_me)
    except CalendarError as e:
        _raise(e)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_tk(
    elderly_id: int,
    task_id: int,
    data: TaskUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return update_task(db, elderly_id, task_id, data, user)
    except CalendarError as e:
        _raise(e)


@router.delete("/tasks/{task_id}", status_code=204)
def delete_tk(
    elderly_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        delete_task(db, elderly_id, task_id, user)
    except CalendarError as e:
        _raise(e)


# ── UPCOMING (events + tasks juntos) ────────────────────

@router.get("/upcoming", response_model=UpcomingResponse)
def upcoming(
    elderly_id: int,
    days: int = Query(default=7, ge=1, le=30),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return get_upcoming(db, elderly_id, user, days)
    except CalendarError as e:
        _raise(e)
