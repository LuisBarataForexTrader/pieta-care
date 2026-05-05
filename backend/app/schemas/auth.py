from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None


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

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class InviteAcceptRequest(BaseModel):
    token: str
    password: str
    full_name: str
