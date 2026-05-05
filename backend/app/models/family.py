from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    invited_email: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="member")  # owner, admin, member, viewer
    relation: Mapped[str | None] = mapped_column(String(100))  # filho, filha, neto, etc.
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    invite_token: Mapped[str | None] = mapped_column(String(512))
    can_manage_medications: Mapped[bool] = mapped_column(Boolean, default=True)
    can_manage_documents: Mapped[bool] = mapped_column(Boolean, default=True)
    can_invite_others: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship(back_populates="family_members")
    user: Mapped["User"] = relationship(back_populates="family_memberships")
