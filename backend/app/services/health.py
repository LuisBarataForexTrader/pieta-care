from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.models.health import VitalSign, WellbeingLog, Incident, DailyNote, CarePlanItem
from app.models.family import FamilyMember
from app.models.user import User
from app.schemas.health import (
    VitalSignCreate, WellbeingCreate, IncidentCreate, IncidentUpdate,
    DailyNoteCreate, CarePlanItemCreate, CarePlanItemUpdate,
)


class HealthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def _check_access(db: Session, elderly_id: int, user: User):
    membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,
    ).first()
    if not membership:
        raise HealthError("Sem acesso a este perfil", 403)
    return membership


# ── VITALS ────────────────────────────────────────────────

def create_vital(db: Session, elderly_id: int, data: VitalSignCreate, user: User) -> VitalSign:
    _check_access(db, elderly_id, user)
    vital = VitalSign(elderly_id=elderly_id, recorded_by_id=user.id, **data.model_dump())
    db.add(vital)
    db.commit()
    db.refresh(vital)
    return vital


def list_vitals(db: Session, elderly_id: int, user: User, days: int = 30) -> list[VitalSign]:
    _check_access(db, elderly_id, user)
    since = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(VitalSign)
        .filter(VitalSign.elderly_id == elderly_id, VitalSign.measured_at >= since)
        .order_by(VitalSign.measured_at.desc())
        .all()
    )


def delete_vital(db: Session, elderly_id: int, vital_id: int, user: User):
    _check_access(db, elderly_id, user)
    vital = db.query(VitalSign).filter(VitalSign.id == vital_id, VitalSign.elderly_id == elderly_id).first()
    if not vital:
        raise HealthError("Registo não encontrado", 404)
    db.delete(vital)
    db.commit()


# ── WELLBEING ─────────────────────────────────────────────

def upsert_wellbeing(db: Session, elderly_id: int, data: WellbeingCreate, user: User) -> WellbeingLog:
    _check_access(db, elderly_id, user)
    existing = db.query(WellbeingLog).filter(
        WellbeingLog.elderly_id == elderly_id,
        WellbeingLog.logged_date == data.logged_date,
    ).first()
    if existing:
        for k, v in data.model_dump().items():
            if v is not None or k == 'notes':
                setattr(existing, k, v)
        existing.recorded_by_id = user.id
        db.commit()
        db.refresh(existing)
        return existing

    log = WellbeingLog(elderly_id=elderly_id, recorded_by_id=user.id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def list_wellbeing(db: Session, elderly_id: int, user: User, days: int = 30) -> list[WellbeingLog]:
    _check_access(db, elderly_id, user)
    since = date.today() - timedelta(days=days)
    return (
        db.query(WellbeingLog)
        .filter(WellbeingLog.elderly_id == elderly_id, WellbeingLog.logged_date >= since)
        .order_by(WellbeingLog.logged_date.desc())
        .all()
    )


def today_wellbeing(db: Session, elderly_id: int, user: User) -> WellbeingLog | None:
    _check_access(db, elderly_id, user)
    return db.query(WellbeingLog).filter(
        WellbeingLog.elderly_id == elderly_id,
        WellbeingLog.logged_date == date.today(),
    ).first()


# ── INCIDENTS ─────────────────────────────────────────────

def create_incident(db: Session, elderly_id: int, data: IncidentCreate, user: User) -> Incident:
    _check_access(db, elderly_id, user)
    incident = Incident(elderly_id=elderly_id, reported_by_id=user.id, **data.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def list_incidents(db: Session, elderly_id: int, user: User, include_resolved: bool = False) -> list[Incident]:
    _check_access(db, elderly_id, user)
    q = db.query(Incident).filter(Incident.elderly_id == elderly_id)
    if not include_resolved:
        q = q.filter(Incident.resolved == False)
    return q.order_by(Incident.occurred_at.desc()).all()


def update_incident(db: Session, elderly_id: int, incident_id: int, data: IncidentUpdate, user: User) -> Incident:
    _check_access(db, elderly_id, user)
    incident = db.query(Incident).filter(
        Incident.id == incident_id, Incident.elderly_id == elderly_id
    ).first()
    if not incident:
        raise HealthError("Incidente não encontrado", 404)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(incident, k, v)
    db.commit()
    db.refresh(incident)
    return incident


def delete_incident(db: Session, elderly_id: int, incident_id: int, user: User):
    _check_access(db, elderly_id, user)
    incident = db.query(Incident).filter(
        Incident.id == incident_id, Incident.elderly_id == elderly_id
    ).first()
    if not incident:
        raise HealthError("Incidente não encontrado", 404)
    db.delete(incident)
    db.commit()


# ── DAILY NOTES ───────────────────────────────────────────

def create_note(db: Session, elderly_id: int, data: DailyNoteCreate, user: User) -> DailyNote:
    _check_access(db, elderly_id, user)
    note = DailyNote(elderly_id=elderly_id, recorded_by_id=user.id, **data.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def list_notes(db: Session, elderly_id: int, user: User, days: int = 30) -> list[DailyNote]:
    _check_access(db, elderly_id, user)
    since = date.today() - timedelta(days=days)
    return (
        db.query(DailyNote)
        .filter(DailyNote.elderly_id == elderly_id, DailyNote.note_date >= since)
        .order_by(DailyNote.note_date.desc(), DailyNote.created_at.desc())
        .all()
    )


def delete_note(db: Session, elderly_id: int, note_id: int, user: User):
    _check_access(db, elderly_id, user)
    note = db.query(DailyNote).filter(DailyNote.id == note_id, DailyNote.elderly_id == elderly_id).first()
    if not note:
        raise HealthError("Nota não encontrada", 404)
    db.delete(note)
    db.commit()


# ── CARE PLAN ─────────────────────────────────────────────

def create_care_plan_item(db: Session, elderly_id: int, data: CarePlanItemCreate, user: User) -> CarePlanItem:
    _check_access(db, elderly_id, user)
    item = CarePlanItem(elderly_id=elderly_id, created_by_id=user.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_care_plan(db: Session, elderly_id: int, user: User, include_inactive: bool = False) -> list[CarePlanItem]:
    _check_access(db, elderly_id, user)
    q = db.query(CarePlanItem).filter(CarePlanItem.elderly_id == elderly_id)
    if not include_inactive:
        q = q.filter(CarePlanItem.is_active == True)
    return q.order_by(CarePlanItem.category, CarePlanItem.created_at).all()


def update_care_plan_item(db: Session, elderly_id: int, item_id: int, data: CarePlanItemUpdate, user: User) -> CarePlanItem:
    _check_access(db, elderly_id, user)
    item = db.query(CarePlanItem).filter(CarePlanItem.id == item_id, CarePlanItem.elderly_id == elderly_id).first()
    if not item:
        raise HealthError("Item não encontrado", 404)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


def delete_care_plan_item(db: Session, elderly_id: int, item_id: int, user: User):
    _check_access(db, elderly_id, user)
    item = db.query(CarePlanItem).filter(CarePlanItem.id == item_id, CarePlanItem.elderly_id == elderly_id).first()
    if not item:
        raise HealthError("Item não encontrado", 404)
    db.delete(item)
    db.commit()
