from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Any


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    nif: str | None = None
    elderly_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    subscription_status: str
    is_verified: bool
    is_admin: bool = False

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterResponse(BaseModel):
    message: str
    email: str
    # 'trial' if a fresh 14-day trial was granted, 'expired' if the user
    # is detected as having previously consumed a trial under another
    # account (same phone / NIF / canonical email).
    subscription_status: str = "trial"


class InviteAcceptRequest(BaseModel):
    token: str
    password: str
    full_name: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class ExportResponse(BaseModel):
    exported_at: str
    user: dict[str, Any]
    elderly_profiles: list[dict[str, Any]]
