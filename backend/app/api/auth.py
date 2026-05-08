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
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth import (
    register_user,
    login_user,
    verify_email,
    delete_account,
    export_user_data,
    accept_invite,
    request_password_reset,
    reset_password,
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


@router.get("/verification-status")
def verification_status(email: str = Query(...), db: Session = Depends(get_db)):
    """Public lightweight check used by the register/verify screen to
    poll for cross-device email verification. Returns `verified: false`
    for unknown emails too, so it can't be used for email enumeration."""
    user = db.query(User).filter(
        User.email == email,
        User.deleted_at.is_(None),
    ).first()
    return {"verified": bool(user and user.is_verified)}


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


@router.post("/forgot-password", status_code=202)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Always responds 202 — we don't reveal whether the email exists.
    If it does, an email is sent (best-effort)."""
    request_password_reset(db, data.email)
    return {"message": "Se a conta existe, enviámos um email com instruções para repor a password."}


@router.post("/reset-password", response_model=AuthResponse)
def reset_password_endpoint(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        user = reset_password(db, data.token, data.password)
        # Issue a fresh access token so the user is logged in straight away
        from app.core.auth import create_access_token
        token = create_access_token(user.id)
        return AuthResponse(access_token=token, user=UserResponse.model_validate(user))
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/invite/accept")
def accept_family_invite(data: InviteAcceptRequest, db: Session = Depends(get_db)):
    try:
        user, token, elderly_id = accept_invite(db, data.token, data.password, data.full_name)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user).model_dump(),
            "elderly_id": elderly_id,
        }
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
