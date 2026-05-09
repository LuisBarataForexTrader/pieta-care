"""User feedback endpoint - reached via the day-7 trial email CTA
and from the in-app avaliação page."""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.email import send_email
from app.core.config import settings
from app.models.feedback import Feedback
from app.models.user import User

log = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    source: str | None = Field(default=None, max_length=40)


class FeedbackResponse(BaseModel):
    id: int
    rating: int
    created_at: str


@router.post("", response_model=FeedbackResponse, status_code=201)
def submit_feedback(
    data: FeedbackRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    fb = Feedback(
        user_id=user.id,
        rating=data.rating,
        comment=(data.comment or None),
        source=data.source,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    # Best-effort email to the support inbox so the team sees it
    # immediately. Failures are silent so the user always gets a 201.
    try:
        body = (
            f"<p><strong>Avaliação:</strong> {data.rating}/5 estrelas</p>"
            f"<p><strong>Utilizador:</strong> {user.full_name} &lt;{user.email}&gt;</p>"
            f"<p><strong>Origem:</strong> {data.source or '-'}</p>"
            + (f"<p><strong>Comentário:</strong></p><blockquote>{(data.comment or '').replace(chr(10), '<br>')}</blockquote>" if data.comment else "")
        )
        send_email(
            to="suporte@pietas.care",
            subject=f"Nova avaliação - {data.rating}/5 - {user.email}",
            html=f"<html><body style='font-family:Helvetica,sans-serif;color:#1a2b22'>{body}</body></html>",
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("feedback notification email failed (non-fatal): %s", exc)

    return FeedbackResponse(
        id=fb.id,
        rating=fb.rating,
        created_at=fb.created_at.isoformat(),
    )
