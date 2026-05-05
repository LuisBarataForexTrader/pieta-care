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
    blood_pressure_sys: Mapped[int | None] = mapped_column(Integer)   # mmHg
    blood_pressure_dia: Mapped[int | None] = mapped_column(Integer)   # mmHg
    heart_rate: Mapped[int | None] = mapped_column(Integer)           # bpm
    temperature: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))  # °C
    weight: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))    # kg
    oxygen_saturation: Mapped[int | None] = mapped_column(Integer)   # %
    blood_glucose: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))  # mg/dL
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
    mood: Mapped[int] = mapped_column(Integer)           # 1-5
    energy: Mapped[int | None] = mapped_column(Integer)  # 1-5
    pain_level: Mapped[int | None] = mapped_column(Integer)  # 0-10
    appetite: Mapped[int | None] = mapped_column(Integer)    # 1-5
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
    type: Mapped[str] = mapped_column(String(50))   # queda, medicacao, emergencia, hospitalizacao, outro
    severity: Mapped[str] = mapped_column(String(20))  # baixa, media, alta, critica
    description: Mapped[str] = mapped_column(Text)
    actions_taken: Mapped[str | None] = mapped_column(Text)
    follow_up_required: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship()
    reported_by: Mapped["User"] = relationship(foreign_keys=[reported_by_id])
