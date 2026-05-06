from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Text, Boolean, DateTime, Date, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class VitalSign(Base):
    __tablename__ = "vital_signs"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    recorded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    measured_at: Mapped[datetime] = mapped_column(DateTime)
    blood_pressure_sys: Mapped[int | None] = mapped_column(Integer)
    blood_pressure_dia: Mapped[int | None] = mapped_column(Integer)
    heart_rate: Mapped[int | None] = mapped_column(Integer)
    temperature: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))
    weight: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    oxygen_saturation: Mapped[int | None] = mapped_column(Integer)
    blood_glucose: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship()
    recorded_by: Mapped["User"] = relationship(foreign_keys=[recorded_by_id])


class WellbeingLog(Base):
    __tablename__ = "wellbeing_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    recorded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    logged_date: Mapped[date] = mapped_column(Date)
    mood: Mapped[int] = mapped_column(Integer)
    energy: Mapped[int | None] = mapped_column(Integer)
    pain_level: Mapped[int | None] = mapped_column(Integer)
    appetite: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship()
    recorded_by: Mapped["User"] = relationship(foreign_keys=[recorded_by_id])


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    reported_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    occurred_at: Mapped[datetime] = mapped_column(DateTime)
    type: Mapped[str] = mapped_column(String(50))
    severity: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(Text)
    actions_taken: Mapped[str | None] = mapped_column(Text)
    follow_up_required: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    body_zone: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship()
    reported_by: Mapped["User"] = relationship(foreign_keys=[reported_by_id])


class DailyNote(Base):
    __tablename__ = "daily_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    recorded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    note_date: Mapped[date] = mapped_column(Date)
    shift: Mapped[str] = mapped_column(String(20))   # manha, tarde, noite
    content: Mapped[str] = mapped_column(Text)
    mood_observed: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship()
    recorded_by: Mapped["User"] = relationship(foreign_keys=[recorded_by_id])


class ClinicalDiagnosis(Base):
    __tablename__ = "clinical_diagnoses"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    description: Mapped[str] = mapped_column(String(300))
    icd_code: Mapped[str | None] = mapped_column(String(20))
    diagnosed_date: Mapped[date | None] = mapped_column(Date)
    is_chronic: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[str | None] = mapped_column(String(50))   # sns, manual, medico
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship()
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_id])


class Vaccination(Base):
    __tablename__ = "vaccinations"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    vaccine_name: Mapped[str] = mapped_column(String(200))
    administered_date: Mapped[date | None] = mapped_column(Date)
    next_due_date: Mapped[date | None] = mapped_column(Date)
    lot_number: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(50))   # sns, manual
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship()
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_id])


class CarePlanItem(Base):
    __tablename__ = "care_plan_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category: Mapped[str] = mapped_column(String(50))   # higiene, nutricao, mobilidade, social, medico, outro
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    frequency: Mapped[str | None] = mapped_column(String(50))   # diario, semanal, mensal, conforme_necessario
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship()
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_id])
