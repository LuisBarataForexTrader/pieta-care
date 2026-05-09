from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(100))
    subscription_status: Mapped[str] = mapped_column(String(20), default="trial")
    subscription_plan: Mapped[str | None] = mapped_column(String(30))
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    email_verification_token: Mapped[str | None] = mapped_column(String(100))
    password_reset_token: Mapped[str | None] = mapped_column(String(100))
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)
    # ── Anti-trial-abuse signals ────────────────────────────────────
    # Phone digits-only (last 9 digits, e.g. PT mobile). Indexed so we
    # can detect a 2nd signup with the same number.
    phone_normalized: Mapped[str | None] = mapped_column(String(15), index=True)
    # Email "canonical" form (lowercase + strip "+suffix" before @ for
    # gmail-style aliases). Indexed; used to spot foo+test@gmail.com
    # masquerading as foo@gmail.com.
    email_canonical: Mapped[str | None] = mapped_column(String(255), index=True)
    # Optional Portuguese NIF (9 digits). Strong signal when present.
    nif: Mapped[str | None] = mapped_column(String(9), index=True)
    # Marker set the moment a trial is granted; never cleared. Lets us
    # see at-a-glance whether this account ever consumed a free trial,
    # even after they've upgraded or cancelled.
    trial_used_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime)
    trial_emails_sent: Mapped[str | None] = mapped_column(Text)  # JSON list e.g. '["day_2","day_7"]'
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    family_memberships: Mapped[list["FamilyMember"]] = relationship(back_populates="user")
