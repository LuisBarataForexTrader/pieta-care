from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.auth import hash_password, verify_password, create_access_token, decode_invite_token
from app.models.user import User
from app.models.family import FamilyMember
from app.schemas.auth import RegisterRequest, LoginRequest


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def register_user(db: Session, data: RegisterRequest) -> tuple[User, str]:
    if db.query(User).filter(User.email == data.email).first():
        raise AuthError("Email já registado", 409)

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        subscription_status="trial",
        trial_ends_at=datetime.utcnow() + timedelta(days=30),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return user, token


def login_user(db: Session, data: LoginRequest) -> tuple[User, str]:
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise AuthError("Email ou password incorretos", 401)

    if not user.is_active:
        raise AuthError("Conta desativada", 403)

    token = create_access_token(user.id)
    return user, token


def accept_invite(db: Session, token: str, password: str, full_name: str) -> tuple[User, str]:
    payload = decode_invite_token(token)
    if not payload:
        raise AuthError("Convite inválido ou expirado", 400)

    elderly_id = payload["elderly_id"]
    email = payload["email"]

    membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.invited_email == email,
        FamilyMember.invite_token == token,
        FamilyMember.is_accepted == False,
    ).first()

    if not membership:
        raise AuthError("Convite não encontrado ou já utilizado", 400)

    # Create or link user account
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            subscription_status="member",
            is_verified=True,
        )
        db.add(user)
        db.flush()

    membership.user_id = user.id
    membership.is_accepted = True
    membership.invite_token = None
    membership.joined_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id)
    return user, access_token
