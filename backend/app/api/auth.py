from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    InviteAcceptRequest,
)
from app.services.auth import register_user, login_user, accept_invite, AuthError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user, token = register_user(db, data)
        return AuthResponse(access_token=token, user=UserResponse.model_validate(user))
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        user, token = login_user(db, data)
        return AuthResponse(access_token=token, user=UserResponse.model_validate(user))
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/invite/accept", response_model=AuthResponse)
def accept_family_invite(data: InviteAcceptRequest, db: Session = Depends(get_db)):
    try:
        user, token = accept_invite(db, data.token, data.password, data.full_name)
        return AuthResponse(access_token=token, user=UserResponse.model_validate(user))
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
