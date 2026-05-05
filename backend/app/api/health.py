from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.health import (
    VitalSignCreate, VitalSignResponse,
    WellbeingCreate, WellbeingResponse,
    IncidentCreate, IncidentUpdate, IncidentResponse,
)
from app.services.health import (
    create_vital, list_vitals, delete_vital,
    upsert_wellbeing, list_wellbeing, today_wellbeing,
    create_incident, list_incidents, update_incident, delete_incident,
    HealthError,
)

router = APIRouter(prefix="/elderly/{elderly_id}", tags=["health"])


def _vital_response(v) -> VitalSignResponse:
    return VitalSignResponse(
        id=v.id,
        elderly_id=v.elderly_id,
        recorded_by_name=v.recorded_by.full_name if v.recorded_by else "—",
        measured_at=v.measured_at,
        blood_pressure_sys=v.blood_pressure_sys,
        blood_pressure_dia=v.blood_pressure_dia,
        heart_rate=v.heart_rate,
        temperature=v.temperature,
        weight=v.weight,
        oxygen_saturation=v.oxygen_saturation,
        blood_glucose=v.blood_glucose,
        notes=v.notes,
        created_at=v.created_at,
    )


def _wellbeing_response(w) -> WellbeingResponse:
    return WellbeingResponse(
        id=w.id,
        elderly_id=w.elderly_id,
        recorded_by_name=w.recorded_by.full_name if w.recorded_by else "—",
        logged_date=w.logged_date,
        mood=w.mood,
        energy=w.energy,
        pain_level=w.pain_level,
        appetite=w.appetite,
        notes=w.notes,
        created_at=w.created_at,
    )


def _incident_response(i) -> IncidentResponse:
    return IncidentResponse(
        id=i.id,
        elderly_id=i.elderly_id,
        reported_by_name=i.reported_by.full_name if i.reported_by else "—",
        occurred_at=i.occurred_at,
        type=i.type,
        severity=i.severity,
        description=i.description,
        actions_taken=i.actions_taken,
        follow_up_required=i.follow_up_required,
        resolved=i.resolved,
        created_at=i.created_at,
    )


# ── VITALS ────────────────────────────────────────────────

@router.post("/vitals", response_model=VitalSignResponse, status_code=201)
def add_vital(elderly_id: int, data: VitalSignCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _vital_response(create_vital(db, elderly_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/vitals", response_model=list[VitalSignResponse])
def get_vitals(elderly_id: int, days: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return [_vital_response(v) for v in list_vitals(db, elderly_id, user, days)]
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/vitals/{vital_id}", status_code=204)
def remove_vital(elderly_id: int, vital_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        delete_vital(db, elderly_id, vital_id, user)
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ── WELLBEING ─────────────────────────────────────────────

@router.post("/wellbeing", response_model=WellbeingResponse, status_code=201)
def log_wellbeing(elderly_id: int, data: WellbeingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _wellbeing_response(upsert_wellbeing(db, elderly_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/wellbeing", response_model=list[WellbeingResponse])
def get_wellbeing(elderly_id: int, days: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return [_wellbeing_response(w) for w in list_wellbeing(db, elderly_id, user, days)]
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/wellbeing/today", response_model=WellbeingResponse | None)
def get_today_wellbeing(elderly_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        w = today_wellbeing(db, elderly_id, user)
        return _wellbeing_response(w) if w else None
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ── INCIDENTS ─────────────────────────────────────────────

@router.post("/incidents", response_model=IncidentResponse, status_code=201)
def add_incident(elderly_id: int, data: IncidentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _incident_response(create_incident(db, elderly_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/incidents", response_model=list[IncidentResponse])
def get_incidents(elderly_id: int, include_resolved: bool = Query(default=False), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return [_incident_response(i) for i in list_incidents(db, elderly_id, user, include_resolved)]
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("/incidents/{incident_id}", response_model=IncidentResponse)
def patch_incident(elderly_id: int, incident_id: int, data: IncidentUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _incident_response(update_incident(db, elderly_id, incident_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/incidents/{incident_id}", status_code=204)
def remove_incident(elderly_id: int, incident_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        delete_incident(db, elderly_id, incident_id, user)
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
