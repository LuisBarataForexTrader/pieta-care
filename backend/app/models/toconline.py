"""SQLAlchemy model for the toconline_tokens table.

One row by design (id=1). Stores the OAuth refresh+access token pair
used by the authorization_code flow.
"""
from sqlalchemy import Column, DateTime, Integer, Text, func

from app.core.database import Base


class TOConlineToken(Base):
    __tablename__ = "toconline_tokens"

    id = Column(Integer, primary_key=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    access_expires_at = Column(DateTime, nullable=True)
    refresh_expires_at = Column(DateTime, nullable=True)
    last_refresh_at = Column(DateTime, nullable=True)
    last_refresh_error = Column(Text, nullable=True)
    auth_alert_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now())
