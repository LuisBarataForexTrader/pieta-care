from datetime import datetime, date
from sqlalchemy import String, Text, Date, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ElderlyProfile(Base):
    __tablename__ = "elderly_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    id_number: Mapped[str | None] = mapped_column(String(50))
    health_number: Mapped[str | None] = mapped_column(String(50))
    address: Mapped[str | None] = mapped_column(Text)
    medical_conditions: Mapped[str | None] = mapped_column(Text)
    allergies: Mapped[str | None] = mapped_column(Text)
    blood_type: Mapped[str | None] = mapped_column(String(5))
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20))
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    family_members: Mapped[list["FamilyMember"]] = relationship(back_populates="elderly")
    medications: Mapped[list["Medication"]] = relationship(back_populates="elderly")
    events: Mapped[list["CalendarEvent"]] = relationship(back_populates="elderly")
    documents: Mapped[list["Document"]] = relationship(back_populates="elderly")
