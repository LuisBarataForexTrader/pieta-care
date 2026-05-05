from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    elderly_id: Mapped[int] = mapped_column(ForeignKey("elderly_profiles.id"))
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(50))  # analise, receita, relatorio, identidade, seguro, outro
    file_url: Mapped[str] = mapped_column(String(500))
    file_size: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)
    document_date: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elderly: Mapped["ElderlyProfile"] = relationship(back_populates="documents")
