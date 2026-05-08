from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.ai_insights import generate_insights, AIInsightsError

router = APIRouter(prefix="/elderly/{elderly_id}/ai", tags=["ai-insights"])


@router.post("/insights")
def insights(
    elderly_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return generate_insights(db, elderly_id, user)
    except AIInsightsError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
