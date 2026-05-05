from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.elderly import (
    ElderlyCreateRequest,
    ElderlyUpdateRequest,
    ElderlyResponse,
    InviteFamilyRequest,
)
from app.services.elderly import (
    create_elderly,
    get_elderly,
    list_elderly,
    update_elderly,
    invite_family_member,
    remove_family_member,
    ElderlyError,
)

router = APIRouter(prefix="/elderly", tags=["elderly"])


def _handle(fn):
    try:
        return fn()
    except ElderlyError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("", response_model=ElderlyResponse, status_code=201)
def create(
    data: ElderlyCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return create_elderly(db, data, user)
    except ElderlyError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("", response_model=list[ElderlyResponse])
def list_all(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_elderly(db, user)


@router.get("/{elderly_id}", response_model=ElderlyResponse)
def get_one(
    elderly_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return get_elderly(db, elderly_id, user)
    except ElderlyError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("/{elderly_id}", response_model=ElderlyResponse)
def update(
    elderly_id: int,
    data: ElderlyUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return update_elderly(db, elderly_id, data, user)
    except ElderlyError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{elderly_id}/invite", status_code=201)
def invite_member(
    elderly_id: int,
    data: InviteFamilyRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return invite_family_member(db, elderly_id, data, user)
    except ElderlyError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{elderly_id}/members/{member_id}", status_code=204)
def remove_member(
    elderly_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        remove_family_member(db, elderly_id, member_id, user)
    except ElderlyError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
