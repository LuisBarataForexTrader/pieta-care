from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.calendar import CalendarEvent, Task
from app.models.family import FamilyMember
from app.models.user import User
from app.schemas.calendar import (
    EventCreateRequest,
    EventUpdateRequest,
    EventResponse,
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskResponse,
)


class CalendarError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def _check_access(db: Session, elderly_id: int, user: User) -> FamilyMember:
    membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,
    ).first()
    if not membership:
        raise CalendarError("Sem acesso a este perfil", 403)
    return membership


def _user_name(db: Session, user_id: int | None) -> str | None:
    if not user_id:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    return user.full_name if user else None


def _event_to_response(db: Session, event: CalendarEvent) -> EventResponse:
    return EventResponse(
        **{c.name: getattr(event, c.name) for c in event.__table__.columns},
        created_by_name=_user_name(db, event.created_by) or "Desconhecido",
    )


def _task_to_response(db: Session, task: Task) -> TaskResponse:
    return TaskResponse(
        **{c.name: getattr(task, c.name) for c in task.__table__.columns},
        created_by_name=_user_name(db, task.created_by) or "Desconhecido",
        assigned_to_name=_user_name(db, task.assigned_to),
    )


# ── EVENTS ──────────────────────────────────────────────

def create_event(
    db: Session, elderly_id: int, data: EventCreateRequest, user: User
) -> EventResponse:
    _check_access(db, elderly_id, user)

    event = CalendarEvent(
        elderly_id=elderly_id,
        created_by=user.id,
        **data.model_dump(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_to_response(db, event)


def list_events(
    db: Session,
    elderly_id: int,
    user: User,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    include_completed: bool = True,
) -> list[EventResponse]:
    _check_access(db, elderly_id, user)

    query = db.query(CalendarEvent).filter(CalendarEvent.elderly_id == elderly_id)

    if from_date:
        query = query.filter(CalendarEvent.starts_at >= from_date)
    if to_date:
        query = query.filter(CalendarEvent.starts_at <= to_date)
    if not include_completed:
        query = query.filter(CalendarEvent.is_completed == False)

    events = query.order_by(CalendarEvent.starts_at).all()
    return [_event_to_response(db, e) for e in events]


def update_event(
    db: Session, elderly_id: int, event_id: int, data: EventUpdateRequest, user: User
) -> EventResponse:
    _check_access(db, elderly_id, user)

    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id,
        CalendarEvent.elderly_id == elderly_id,
    ).first()

    if not event:
        raise CalendarError("Evento não encontrado", 404)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return _event_to_response(db, event)


def delete_event(db: Session, elderly_id: int, event_id: int, user: User) -> None:
    membership = _check_access(db, elderly_id, user)

    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id,
        CalendarEvent.elderly_id == elderly_id,
    ).first()

    if not event:
        raise CalendarError("Evento não encontrado", 404)

    if event.created_by != user.id and membership.role not in ("owner", "admin"):
        raise CalendarError("Só o criador ou admin pode apagar este evento", 403)

    db.delete(event)
    db.commit()


# ── TASKS ────────────────────────────────────────────────

def create_task(
    db: Session, elderly_id: int, data: TaskCreateRequest, user: User
) -> TaskResponse:
    _check_access(db, elderly_id, user)

    # Validate assignee belongs to this elderly's family
    if data.assigned_to:
        assignee = db.query(FamilyMember).filter(
            FamilyMember.elderly_id == elderly_id,
            FamilyMember.user_id == data.assigned_to,
            FamilyMember.is_accepted == True,
        ).first()
        if not assignee:
            raise CalendarError("Utilizador não pertence a esta família", 400)

    task = Task(
        elderly_id=elderly_id,
        created_by=user.id,
        **data.model_dump(),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_response(db, task)


def list_tasks(
    db: Session,
    elderly_id: int,
    user: User,
    include_completed: bool = False,
    assigned_to_me: bool = False,
) -> list[TaskResponse]:
    _check_access(db, elderly_id, user)

    query = db.query(Task).filter(Task.elderly_id == elderly_id)

    if not include_completed:
        query = query.filter(Task.is_completed == False)
    if assigned_to_me:
        query = query.filter(Task.assigned_to == user.id)

    tasks = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).all()
    return [_task_to_response(db, t) for t in tasks]


def update_task(
    db: Session, elderly_id: int, task_id: int, data: TaskUpdateRequest, user: User
) -> TaskResponse:
    _check_access(db, elderly_id, user)

    task = db.query(Task).filter(
        Task.id == task_id,
        Task.elderly_id == elderly_id,
    ).first()

    if not task:
        raise CalendarError("Tarefa não encontrada", 404)

    updates = data.model_dump(exclude_none=True)

    if updates.get("is_completed") is True and not task.is_completed:
        updates["completed_at"] = datetime.utcnow()

    for field, value in updates.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return _task_to_response(db, task)


def delete_task(db: Session, elderly_id: int, task_id: int, user: User) -> None:
    membership = _check_access(db, elderly_id, user)

    task = db.query(Task).filter(
        Task.id == task_id,
        Task.elderly_id == elderly_id,
    ).first()

    if not task:
        raise CalendarError("Tarefa não encontrada", 404)

    if task.created_by != user.id and membership.role not in ("owner", "admin"):
        raise CalendarError("Só o criador ou admin pode apagar esta tarefa", 403)

    db.delete(task)
    db.commit()


def get_upcoming(db: Session, elderly_id: int, user: User, days: int = 7) -> dict:
    _check_access(db, elderly_id, user)

    now = datetime.utcnow()
    until = now + timedelta(days=days)

    events = db.query(CalendarEvent).filter(
        CalendarEvent.elderly_id == elderly_id,
        CalendarEvent.starts_at >= now,
        CalendarEvent.starts_at <= until,
        CalendarEvent.is_completed == False,
    ).order_by(CalendarEvent.starts_at).all()

    tasks = db.query(Task).filter(
        Task.elderly_id == elderly_id,
        Task.is_completed == False,
        Task.due_date <= until,
    ).order_by(Task.due_date.asc().nullslast()).all()

    return {
        "events": [_event_to_response(db, e) for e in events],
        "tasks": [_task_to_response(db, t) for t in tasks],
    }
