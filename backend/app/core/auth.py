from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, expires_minutes: int | None = None) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.SECRET_KEY, ALGORITHM)


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        return int(user_id) if user_id else None
    except JWTError:
        return None


def create_invite_token(elderly_id: int, email: str) -> str:
    # Invite tokens expire in 7 days
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode(
        {"elderly_id": elderly_id, "email": email, "exp": expire, "type": "invite"},
        settings.SECRET_KEY,
        ALGORITHM,
    )


def decode_invite_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "invite":
            return None
        return payload
    except JWTError:
        return None
