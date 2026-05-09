from datetime import datetime, time
from sqlalchemy import String, Text, Time, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    name: Mapped[str] = mapped_column(String(255))
    dosage: Mapped[str] = mapped_column(String(100))
    instructions: Mapped[str | None] = mapped_column(Text)
    schedule_times: Mapped[str] = mapped_column(Text)  # JSON: ["08:00", "20:00"]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_prn: Mapped[bool] = mapped_column(Boolean, default=False)  # "pro re nata" - as needed
    description: Mapped[str | None] = mapped_column(Text)
    description_fetched_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship(back_populates="medications")
    logs: Mapped[list["MedicationLog"]] = relationship(back_populates="medication")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id"))
    confirmed_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    scheduled_time: Mapped[datetime] = mapped_column(DateTime)
    confirmed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(20), default="taken")  # taken, skipped, missed
    notes: Mapped[str | None] = mapped_column(Text)

    medication: Mapped["Medication"] = relationship(back_populates="logs")
    confirmed_by_user: Mapped["User"] = relationship(foreign_keys=[confirmed_by])
