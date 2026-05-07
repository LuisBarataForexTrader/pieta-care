from datetime import datetime
from sqlalchemy import Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)

    sender = relationship("User", foreign_keys=[sender_id])


class ChatRead(Base):
    __tablename__ = "chat_reads"
    __table_args__ = (
        UniqueConstraint("elderly_id", "user_id", name="uq_chat_reads_elderly_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    last_read_message_id: Mapped[int | None] = mapped_column(Integer)
    last_read_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
