from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, field_validator


# ── VITALS ────────────────────────────────────────────────

class VitalSignCreate(BaseModel):
    measured_at: datetime
    blood_pressure_sys: int | None = None
    blood_pressure_dia: int | None = None
    heart_rate: int | None = None
    temperature: Decimal | None = None
    weight: Decimal | None = None
    oxygen_saturation: int | None = None
    blood_glucose: Decimal | None = None
    notes: str | None = None

    @field_validator("blood_pressure_sys", "blood_pressure_dia")
    @classmethod
    def valid_bp(cls, v):
        if v is not None and not (30 <= v <= 300):
            raise ValueError("Tensão arterial fora de intervalo")
        return v

    @field_validator("heart_rate")
    @classmethod
    def valid_hr(cls, v):
        if v is not None and not (20 <= v <= 300):
            raise ValueError("Frequência cardíaca fora de intervalo")
        return v

    @field_validator("oxygen_saturation")
    @classmethod
    def valid_spo2(cls, v):
        if v is not None and not (50 <= v <= 100):
            raise ValueError("Saturação de oxigénio fora de intervalo")
        return v


class VitalSignResponse(BaseModel):
    id: int
    elderly_id: int
    recorded_by_name: str
    measured_at: datetime
    blood_pressure_sys: int | None
    blood_pressure_dia: int | None
    heart_rate: int | None
    temperature: Decimal | None
    weight: Decimal | None
    oxygen_saturation: int | None
    blood_glucose: Decimal | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── WELLBEING ─────────────────────────────────────────────

class WellbeingCreate(BaseModel):
    logged_date: date
    mood: int           # 1-5
    energy: int | None = None
    pain_level: int | None = None
    appetite: int | None = None
    notes: str | None = None

    @field_validator("mood")
    @classmethod
    def valid_mood(cls, v):
        if not (1 <= v <= 5):
            raise ValueError("Humor deve ser entre 1 e 5")
        return v

    @field_validator("energy", "appetite")
    @classmethod
    def valid_1_5(cls, v):
        if v is not None and not (1 <= v <= 5):
            raise ValueError("Valor deve ser entre 1 e 5")
        return v

    @field_validator("pain_level")
    @classmethod
    def valid_pain(cls, v):
        if v is not None and not (0 <= v <= 10):
            raise ValueError("Dor deve ser entre 0 e 10")
        return v


class WellbeingResponse(BaseModel):
    id: int
    elderly_id: int
    recorded_by_name: str
    logged_date: date
    mood: int
    energy: int | None
    pain_level: int | None
    appetite: int | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── INCIDENTS ─────────────────────────────────────────────

INCIDENT_TYPES = ("queda", "medicacao", "emergencia", "hospitalizacao", "comportamento", "outro")
SEVERITIES = ("baixa", "media", "alta", "critica")


class IncidentCreate(BaseModel):
    occurred_at: datetime
    type: str
    severity: str
    description: str
    actions_taken: str | None = None
    follow_up_required: bool = False

    @field_validator("type")
    @classmethod
    def valid_type(cls, v):
        if v not in INCIDENT_TYPES:
            raise ValueError(f"Tipo inválido. Use: {', '.join(INCIDENT_TYPES)}")
        return v

    @field_validator("severity")
    @classmethod
    def valid_severity(cls, v):
        if v not in SEVERITIES:
            raise ValueError(f"Gravidade inválida. Use: {', '.join(SEVERITIES)}")
        return v


class IncidentUpdate(BaseModel):
    actions_taken: str | None = None
    follow_up_required: bool | None = None
    resolved: bool | None = None


class IncidentResponse(BaseModel):
    id: int
    elderly_id: int
    reported_by_name: str
    occurred_at: datetime
    type: str
    severity: str
    description: str
    actions_taken: str | None
    follow_up_required: bool
    resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}
