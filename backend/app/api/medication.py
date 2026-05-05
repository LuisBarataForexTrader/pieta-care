from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.medication import (
    MedicationCreateRequest,
    MedicationUpdateRequest,
    MedicationResponse,
    MedicationLogRequest,
    MedicationLogResponse,
    DailyScheduleItem,
)
from app.services.medication import (
    create_medication,
    list_medications,
    update_medication,
    deactivate_medication,
    get_daily_schedule,
    confirm_medication,
    get_medication_history,
    MedicationError,
)

router = APIRouter(prefix="/elderly/{elderly_id}/medications", tags=["medications"])


@router.post("", response_model=MedicationResponse, status_code=201)
def create(
    elderly_id: int,
    data: MedicationCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return create_medication(db, elderly_id, data, user)
    except MedicationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("", response_model=list[MedicationResponse])
def list_all(
    elderly_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return list_medications(db, elderly_id, user)
    except MedicationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("/{medication_id}", response_model=MedicationResponse)
def update(
    elderly_id: int,
    medication_id: int,
    data: MedicationUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return update_medication(db, elderly_id, medication_id, data, user)
    except MedicationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{medication_id}", status_code=204)
def deactivate(
    elderly_id: int,
    medication_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        deactivate_medication(db, elderly_id, medication_id, user)
    except MedicationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/schedule/today", response_model=list[DailyScheduleItem])
def daily_schedule(
    elderly_id: int,
    for_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return get_daily_schedule(db, elderly_id, user, for_date)
    except MedicationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/confirm", status_code=201)
def confirm(
    elderly_id: int,
    data: MedicationLogRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        log = confirm_medication(db, elderly_id, data, user)
        return {"message": "Medicação registada", "log_id": log.id, "status": log.status}
    except MedicationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/history", response_model=list[MedicationLogResponse])
def history(
    elderly_id: int,
    medication_id: int | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        logs = get_medication_history(db, elderly_id, user, medication_id, days)
        result = []
        for log in logs:
            med = log.medication
            confirmer = log.confirmed_by_user if hasattr(log, 'confirmed_by_user') else None
            result.append(MedicationLogResponse(
                id=log.id,
                medication_id=log.medication_id,
                medication_name=med.name,
                dosage=med.dosage,
                confirmed_by_name=confirmer.full_name if confirmer else "Desconhecido",
                scheduled_time=log.scheduled_time,
                confirmed_at=log.confirmed_at,
                status=log.status,
                notes=log.notes,
            ))
        return result
    except MedicationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
