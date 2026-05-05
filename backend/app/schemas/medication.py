from datetime import datetime
from pydantic import BaseModel, field_validator
import json


class MedicationCreateRequest(BaseModel):
    name: str
    dosage: str
    instructions: str | None = None
    schedule_times: list[str]  # ["08:00", "14:00", "20:00"]
    is_active: bool = True

    @field_validator("schedule_times")
    @classmethod
    def validate_times(cls, v):
        for t in v:
            try:
                hour, minute = t.split(":")
                assert 0 <= int(hour) <= 23 and 0 <= int(minute) <= 59
            except Exception:
                raise ValueError(f"Horário inválido: {t}. Use formato HH:MM")
        return v


class MedicationUpdateRequest(BaseModel):
    name: str | None = None
    dosage: str | None = None
    instructions: str | None = None
    schedule_times: list[str] | None = None
    is_active: bool | None = None


class MedicationResponse(BaseModel):
    id: int
    elderly_id: int
    name: str
    dosage: str
    instructions: str | None
    schedule_times: list[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("schedule_times", mode="before")
    @classmethod
    def parse_times(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


class MedicationLogRequest(BaseModel):
    medication_id: int
    scheduled_time: datetime
    status: str  # taken, skipped, missed
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in ("taken", "skipped", "missed"):
            raise ValueError("Status deve ser: taken, skipped ou missed")
        return v


class MedicationLogResponse(BaseModel):
    id: int
    medication_id: int
    medication_name: str
    dosage: str
    confirmed_by_name: str
    scheduled_time: datetime
    confirmed_at: datetime
    status: str
    notes: str | None

    model_config = {"from_attributes": True}


class DailyScheduleItem(BaseModel):
    medication_id: int
    name: str
    dosage: str
    instructions: str | None
    scheduled_time: datetime
    status: str  # pending, taken, skipped, missed
    log_id: int | None = None
    confirmed_by_name: str | None = None
    confirmed_at: datetime | None = None
