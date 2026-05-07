import json
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.models.elderly import ElderlyProfile
from app.models.family import FamilyMember
from app.models.medication import Medication, MedicationLog
from app.models.user import User
from app.schemas.medication import (
    MedicationCreateRequest,
    MedicationUpdateRequest,
    MedicationLogRequest,
    DailyScheduleItem,
)


class MedicationError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def _check_access(db: Session, elderly_id: int, user: User, require_manage: bool = False):
    membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,
    ).first()

    if not membership:
        raise MedicationError("Sem acesso a este perfil", 403)

    if require_manage and not membership.can_manage_medications:
        raise MedicationError("Sem permissão para gerir medicação", 403)

    return membership


def create_medication(
    db: Session, elderly_id: int, data: MedicationCreateRequest, user: User
) -> Medication:
    _check_access(db, elderly_id, user, require_manage=True)

    medication = Medication(
        elderly_id=elderly_id,
        name=data.name,
        dosage=data.dosage,
        instructions=data.instructions,
        schedule_times=json.dumps(data.schedule_times),
        is_active=data.is_active,
    )
    db.add(medication)
    db.commit()
    db.refresh(medication)
    return medication


def list_medications(db: Session, elderly_id: int, user: User) -> list[Medication]:
    _check_access(db, elderly_id, user)
    return db.query(Medication).filter(
        Medication.elderly_id == elderly_id,
        Medication.is_active == True,
    ).order_by(Medication.name).all()


def update_medication(
    db: Session, elderly_id: int, medication_id: int, data: MedicationUpdateRequest, user: User
) -> Medication:
    _check_access(db, elderly_id, user, require_manage=True)

    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.elderly_id == elderly_id,
    ).first()

    if not med:
        raise MedicationError("Medicamento não encontrado", 404)

    updates = data.model_dump(exclude_none=True)
    if "schedule_times" in updates:
        updates["schedule_times"] = json.dumps(updates["schedule_times"])

    for field, value in updates.items():
        setattr(med, field, value)

    db.commit()
    db.refresh(med)
    return med


def deactivate_medication(
    db: Session, elderly_id: int, medication_id: int, user: User
) -> None:
    _check_access(db, elderly_id, user, require_manage=True)

    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.elderly_id == elderly_id,
    ).first()

    if not med:
        raise MedicationError("Medicamento não encontrado", 404)

    med.is_active = False
    db.commit()


def get_daily_schedule(
    db: Session, elderly_id: int, user: User, for_date: date | None = None
) -> list[DailyScheduleItem]:
    _check_access(db, elderly_id, user)

    target_date = for_date or date.today()
    medications = db.query(Medication).filter(
        Medication.elderly_id == elderly_id,
        Medication.is_active == True,
    ).all()

    schedule = []

    for med in medications:
        times = json.loads(med.schedule_times)

        for time_str in times:
            hour, minute = map(int, time_str.split(":"))
            scheduled_dt = datetime(
                target_date.year, target_date.month, target_date.day, hour, minute
            )

            # Find log for this medication at this time (within 2h window)
            window_start = scheduled_dt - timedelta(hours=1)
            window_end = scheduled_dt + timedelta(hours=1)

            log = db.query(MedicationLog).filter(
                MedicationLog.medication_id == med.id,
                MedicationLog.scheduled_time >= window_start,
                MedicationLog.scheduled_time <= window_end,
            ).first()

            confirmed_by_name = None
            if log:
                confirmer = db.query(User).filter(User.id == log.confirmed_by).first()
                confirmed_by_name = confirmer.full_name if confirmer else None

            if log:
                status = log.status
            elif scheduled_dt < datetime.utcnow():
                status = "missed"
            else:
                status = "pending"

            schedule.append(DailyScheduleItem(
                medication_id=med.id,
                name=med.name,
                dosage=med.dosage,
                instructions=med.instructions,
                scheduled_time=scheduled_dt,
                status=status,
                log_id=log.id if log else None,
                confirmed_by_name=confirmed_by_name,
                confirmed_at=log.confirmed_at if log else None,
            ))

    return sorted(schedule, key=lambda x: x.scheduled_time)


def confirm_medication(
    db: Session, elderly_id: int, data: MedicationLogRequest, user: User
) -> MedicationLog:
    _check_access(db, elderly_id, user, require_manage=True)

    med = db.query(Medication).filter(
        Medication.id == data.medication_id,
        Medication.elderly_id == elderly_id,
        Medication.is_active == True,
    ).first()

    if not med:
        raise MedicationError("Medicamento não encontrado", 404)

    # Prevent duplicate confirmation within 2h window
    window_start = data.scheduled_time - timedelta(hours=1)
    window_end = data.scheduled_time + timedelta(hours=1)

    existing = db.query(MedicationLog).filter(
        MedicationLog.medication_id == data.medication_id,
        MedicationLog.scheduled_time >= window_start,
        MedicationLog.scheduled_time <= window_end,
    ).first()

    if existing:
        raise MedicationError("Esta dose já foi registada", 409)

    log = MedicationLog(
        medication_id=data.medication_id,
        confirmed_by=user.id,
        scheduled_time=data.scheduled_time,
        status=data.status,
        notes=data.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_medication_history(
    db: Session,
    elderly_id: int,
    user: User,
    medication_id: int | None = None,
    days: int = 7,
) -> list[MedicationLog]:
    _check_access(db, elderly_id, user)

    since = datetime.utcnow() - timedelta(days=days)

    query = db.query(MedicationLog).join(Medication).filter(
        Medication.elderly_id == elderly_id,
        MedicationLog.scheduled_time >= since,
    )

    if medication_id:
        query = query.filter(MedicationLog.medication_id == medication_id)

    return query.order_by(MedicationLog.scheduled_time.desc()).all()


def fetch_description(
    db: Session, elderly_id: int, medication_id: int, user: User, force: bool = False
) -> Medication:
    from app.services.medication_info import fetch_medication_description, MedicationInfoError

    _check_access(db, elderly_id, user, require_manage=True)
    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.elderly_id == elderly_id,
    ).first()
    if not med:
        raise MedicationError("Medicamento não encontrado", 404)

    if med.description and not force:
        return med

    try:
        text = fetch_medication_description(med.name, med.dosage)
    except MedicationInfoError as e:
        raise MedicationError(e.message, e.status_code)

    med.description = text
    med.description_fetched_at = datetime.utcnow()
    db.commit()
    db.refresh(med)
    return med


def log_prn_medication(
    db: Session, elderly_id: int, medication_id: int, user: User, notes: str | None = None
) -> MedicationLog:
    _check_access(db, elderly_id, user, require_manage=True)
    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.elderly_id == elderly_id,
        Medication.is_prn == True,
        Medication.is_active == True,
    ).first()
    if not med:
        raise MedicationError("Medicamento PRN não encontrado", 404)
    log = MedicationLog(
        medication_id=medication_id,
        confirmed_by=user.id,
        scheduled_time=datetime.utcnow(),
        confirmed_at=datetime.utcnow(),
        status="taken",
        notes=notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
