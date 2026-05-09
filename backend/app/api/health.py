from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.health import (
    VitalSignCreate, VitalSignResponse,
    WellbeingCreate, WellbeingResponse,
    IncidentCreate, IncidentUpdate, IncidentResponse,
    DailyNoteCreate, DailyNoteResponse,
    CarePlanItemCreate, CarePlanItemUpdate, CarePlanItemResponse,
    ClinicalDiagnosisCreate, ClinicalDiagnosisUpdate, ClinicalDiagnosisResponse,
    VaccinationCreate, VaccinationUpdate, VaccinationResponse,
)
from app.services.health import (
    create_vital, list_vitals, delete_vital,
    upsert_wellbeing, list_wellbeing, today_wellbeing,
    create_incident, list_incidents, update_incident, delete_incident,
    create_note, list_notes, delete_note,
    create_care_plan_item, list_care_plan, update_care_plan_item, delete_care_plan_item,
    create_diagnosis, list_diagnoses, update_diagnosis, delete_diagnosis,
    create_vaccination, list_vaccinations, delete_vaccination,
    HealthError,
)

router = APIRouter(prefix="/elderly/{elderly_id}", tags=["health"])


def _vital_response(v) -> VitalSignResponse:
    return VitalSignResponse(
        id=v.id,
        elderly_id=v.elderly_id,
        recorded_by_name=v.recorded_by.full_name if v.recorded_by else "-",
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
        recorded_by_name=w.recorded_by.full_name if w.recorded_by else "-",
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
        reported_by_name=i.reported_by.full_name if i.reported_by else "-",
        occurred_at=i.occurred_at,
        type=i.type,
        severity=i.severity,
        description=i.description,
        actions_taken=i.actions_taken,
        follow_up_required=i.follow_up_required,
        resolved=i.resolved,
        body_zone=i.body_zone,
        created_at=i.created_at,
    )


def _note_response(n) -> DailyNoteResponse:
    return DailyNoteResponse(
        id=n.id,
        elderly_id=n.elderly_id,
        recorded_by_name=n.recorded_by.full_name if n.recorded_by else "-",
        note_date=n.note_date,
        shift=n.shift,
        content=n.content,
        mood_observed=n.mood_observed,
        created_at=n.created_at,
    )


def _care_plan_response(item) -> CarePlanItemResponse:
    return CarePlanItemResponse(
        id=item.id,
        elderly_id=item.elderly_id,
        created_by_name=item.created_by.full_name if item.created_by else "-",
        category=item.category,
        title=item.title,
        description=item.description,
        frequency=item.frequency,
        is_active=item.is_active,
        created_at=item.created_at,
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


# ── DAILY NOTES ───────────────────────────────────────────

@router.post("/notes", response_model=DailyNoteResponse, status_code=201)
def add_note(elderly_id: int, data: DailyNoteCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _note_response(create_note(db, elderly_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/notes", response_model=list[DailyNoteResponse])
def get_notes(elderly_id: int, days: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return [_note_response(n) for n in list_notes(db, elderly_id, user, days)]
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/notes/{note_id}", status_code=204)
def remove_note(elderly_id: int, note_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        delete_note(db, elderly_id, note_id, user)
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ── CARE PLAN ─────────────────────────────────────────────

@router.post("/care-plan", response_model=CarePlanItemResponse, status_code=201)
def add_care_plan_item(elderly_id: int, data: CarePlanItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _care_plan_response(create_care_plan_item(db, elderly_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/care-plan", response_model=list[CarePlanItemResponse])
def get_care_plan(elderly_id: int, include_inactive: bool = Query(default=False), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return [_care_plan_response(i) for i in list_care_plan(db, elderly_id, user, include_inactive)]
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("/care-plan/{item_id}", response_model=CarePlanItemResponse)
def patch_care_plan_item(elderly_id: int, item_id: int, data: CarePlanItemUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _care_plan_response(update_care_plan_item(db, elderly_id, item_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/care-plan/{item_id}", status_code=204)
def remove_care_plan_item(elderly_id: int, item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        delete_care_plan_item(db, elderly_id, item_id, user)
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ── CLINICAL DIAGNOSES ────────────────────────────────────

def _dx_response(dx) -> ClinicalDiagnosisResponse:
    return ClinicalDiagnosisResponse(
        id=dx.id, elderly_id=dx.elderly_id,
        created_by_name=dx.created_by.full_name if dx.created_by else "-",
        description=dx.description, icd_code=dx.icd_code,
        diagnosed_date=dx.diagnosed_date, is_chronic=dx.is_chronic,
        is_active=dx.is_active, source=dx.source, notes=dx.notes, created_at=dx.created_at,
    )


@router.post("/diagnoses", response_model=ClinicalDiagnosisResponse, status_code=201)
def add_diagnosis(elderly_id: int, data: ClinicalDiagnosisCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _dx_response(create_diagnosis(db, elderly_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/diagnoses", response_model=list[ClinicalDiagnosisResponse])
def get_diagnoses(elderly_id: int, include_inactive: bool = Query(default=False), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return [_dx_response(dx) for dx in list_diagnoses(db, elderly_id, user, include_inactive)]
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("/diagnoses/{dx_id}", response_model=ClinicalDiagnosisResponse)
def patch_diagnosis(elderly_id: int, dx_id: int, data: ClinicalDiagnosisUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _dx_response(update_diagnosis(db, elderly_id, dx_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/diagnoses/{dx_id}", status_code=204)
def remove_diagnosis(elderly_id: int, dx_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        delete_diagnosis(db, elderly_id, dx_id, user)
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ── VACCINATIONS ──────────────────────────────────────────

def _vac_response(v) -> VaccinationResponse:
    return VaccinationResponse(
        id=v.id, elderly_id=v.elderly_id,
        created_by_name=v.created_by.full_name if v.created_by else "-",
        vaccine_name=v.vaccine_name, administered_date=v.administered_date,
        next_due_date=v.next_due_date, lot_number=v.lot_number,
        source=v.source, notes=v.notes, created_at=v.created_at,
    )


@router.post("/vaccinations", response_model=VaccinationResponse, status_code=201)
def add_vaccination(elderly_id: int, data: VaccinationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return _vac_response(create_vaccination(db, elderly_id, data, user))
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/vaccinations", response_model=list[VaccinationResponse])
def get_vaccinations(elderly_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return [_vac_response(v) for v in list_vaccinations(db, elderly_id, user)]
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/vaccinations/{vac_id}", status_code=204)
def remove_vaccination(elderly_id: int, vac_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        delete_vaccination(db, elderly_id, vac_id, user)
    except HealthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
