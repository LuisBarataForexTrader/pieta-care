from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    event_type: Mapped[str] = mapped_column(String(50))  # consulta, exame, visita, outro
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime)
    location: Mapped[str | None] = mapped_column(String(255))
    doctor_name: Mapped[str | None] = mapped_column(String(255))
    preparation_notes: Mapped[str | None] = mapped_column(Text)
    items_to_bring: Mapped[str | None] = mapped_column(Text)
    reminder_minutes: Mapped[int] = mapped_column(default=60)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship(back_populates="events")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[datetime | None] = mapped_column(DateTime)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
