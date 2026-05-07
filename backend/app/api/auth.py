from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    AuthResponse,
    UserResponse,
    InviteAcceptRequest,
)
from app.services.auth import (
    register_user,
    login_user,
    verify_email,
    delete_account,
    export_user_data,
    accept_invite,
    AuthError,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(db, data)
        return RegisterResponse(message="Email de verificação enviado. Verifique a sua caixa de correio.", email=user.email)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/verify-email", response_model=AuthResponse)
def verify_email_endpoint(token: str = Query(...), db: Session = Depends(get_db)):
    try:
        user, access_token = verify_email(db, token)
        return AuthResponse(access_token=access_token, user=UserResponse.model_validate(user))
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


@router.post("/ping", status_code=204)
def ping(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import datetime
    current_user.last_seen_at = datetime.utcnow()
    db.commit()
    return None


@router.delete("/account", status_code=200)
def delete_my_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delete_account(db, current_user)
    return {"message": "Conta marcada para eliminação. Receberá um email de confirmação."}


@router.get("/export")
def export_my_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = export_user_data(db, current_user)
    return JSONResponse(content=data)


@router.post("/invite/accept", response_model=AuthResponse)
def accept_family_invite(data: InviteAcceptRequest, db: Session = Depends(get_db)):
    try:
        user, token = accept_invite(db, data.token, data.password, data.full_name)
        return AuthResponse(access_token=token, user=UserResponse.model_validate(user))
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
