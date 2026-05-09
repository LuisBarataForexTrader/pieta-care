from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Feedback(Base):
    """User-submitted product feedback. Reached via the 'Deixar avaliação'
    CTA in the day-7 trial email and from /avaliacao on the app."""
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # 1..5 stars
    rating: Mapped[int] = mapped_column(Integer)
    # Free-form comment (max ~2k chars in UI)
    comment: Mapped[str | None] = mapped_column(Text)
    # Where did the user click from? "trial_day7", "support", "settings", etc.
    source: Mapped[str | None] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
