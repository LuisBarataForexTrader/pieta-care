import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.auth import hash_password, verify_password, create_access_token, decode_invite_token
from app.core.email import send_email, verification_email_html, deletion_confirmation_html
from app.core.config import settings
from app.models.user import User
from app.models.family import FamilyMember
from app.models.elderly import ElderlyProfile
from app.schemas.auth import RegisterRequest, LoginRequest


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def register_user(db: Session, data: RegisterRequest) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise AuthError("Email já registado", 409)

    token = secrets.token_urlsafe(32)

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        subscription_status="trial",
        trial_ends_at=datetime.utcnow() + timedelta(days=14),
        is_verified=False,
        email_verification_token=token,
    )
    db.add(user)
    db.flush()

    if data.elderly_name:
        elderly = ElderlyProfile(
            full_name=data.elderly_name,
            created_by=user.id,
        )
        db.add(elderly)
        db.flush()
        member = FamilyMember(
            elderly_id=elderly.id,
            user_id=user.id,
            invited_email=user.email,
            role="owner",
            is_accepted=True,
        )
        db.add(member)

    db.commit()
    db.refresh(user)

    verify_url = f"{settings.FRONTEND_URL}/verificar-email?token={token}"
    send_email(
        to=user.email,
        subject="Confirme o seu email - pietas.care",
        html=verification_email_html(user.full_name, verify_url),
    )

    return user


def verify_email(db: Session, token: str) -> tuple[User, str]:
    user = db.query(User).filter(
        User.email_verification_token == token,
        User.deleted_at.is_(None),
    ).first()
    if not user:
        raise AuthError("Link de verificação inválido ou já utilizado", 400)

    user.is_verified = True
    user.email_verification_token = None
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id)
    return user, access_token


def login_user(db: Session, data: LoginRequest) -> tuple[User, str]:
    user = db.query(User).filter(
        User.email == data.email,
        User.deleted_at.is_(None),
    ).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise AuthError("Email ou password incorretos", 401)

    if not user.is_active:
        raise AuthError("Conta desativada", 403)

    if not user.is_verified:
        raise AuthError("Email ainda não verificado. Verifique a sua caixa de correio.", 403)

    access_token = create_access_token(user.id)
    return user, access_token


def delete_account(db: Session, user: User) -> None:
    user.deleted_at = datetime.utcnow()
    user.is_active = False
    db.commit()
    deletion_date = (datetime.utcnow() + timedelta(days=30)).strftime("%d/%m/%Y")
    send_email(
        to=user.email,
        subject="Pedido de eliminação de conta recebido - pietas.care",
        html=deletion_confirmation_html(user.full_name, deletion_date),
    )


def export_user_data(db: Session, user: User) -> dict:
    from app.models.elderly import ElderlyProfile
    from app.models.health import VitalSign, WellbeingLog, Incident, DailyNote, ClinicalDiagnosis, Vaccination, CarePlanItem
    from app.models.medication import Medication, MedicationLog
    # Calendar events live in app.models.calendar (not "event"). The
    # original import was wrong and crashed the whole export endpoint.
    from app.models.calendar import CalendarEvent

    memberships = db.query(FamilyMember).filter(FamilyMember.user_id == user.id).all()
    elderly_ids = [m.elderly_id for m in memberships]
    profiles = db.query(ElderlyProfile).filter(ElderlyProfile.id.in_(elderly_ids)).all()

    def to_dict(obj):
        return {c.name: str(getattr(obj, c.name)) if getattr(obj, c.name) is not None else None
                for c in obj.__table__.columns}

    result = {
        "exported_at": datetime.utcnow().isoformat(),
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "subscription_status": user.subscription_status,
            "created_at": str(user.created_at),
        },
        "elderly_profiles": [],
    }

    for p in profiles:
        profile_data = to_dict(p)
        profile_data["vital_signs"] = [to_dict(v) for v in db.query(VitalSign).filter(VitalSign.elderly_id == p.id).all()]
        profile_data["wellbeing_logs"] = [to_dict(v) for v in db.query(WellbeingLog).filter(WellbeingLog.elderly_id == p.id).all()]
        profile_data["incidents"] = [to_dict(v) for v in db.query(Incident).filter(Incident.elderly_id == p.id).all()]
        profile_data["daily_notes"] = [to_dict(v) for v in db.query(DailyNote).filter(DailyNote.elderly_id == p.id).all()]
        profile_data["clinical_diagnoses"] = [to_dict(v) for v in db.query(ClinicalDiagnosis).filter(ClinicalDiagnosis.elderly_id == p.id).all()]
        profile_data["vaccinations"] = [to_dict(v) for v in db.query(Vaccination).filter(Vaccination.elderly_id == p.id).all()]
        profile_data["care_plan_items"] = [to_dict(v) for v in db.query(CarePlanItem).filter(CarePlanItem.elderly_id == p.id).all()]
        try:
            profile_data["medications"] = [to_dict(v) for v in db.query(Medication).filter(Medication.elderly_id == p.id).all()]
        except Exception:
            profile_data["medications"] = []
        try:
            profile_data["events"] = [to_dict(v) for v in db.query(CalendarEvent).filter(CalendarEvent.elderly_id == p.id).all()]
        except Exception:
            profile_data["events"] = []
        try:
            med_ids = [m.id for m in db.query(Medication).filter(Medication.elderly_id == p.id).all()]
            profile_data["medication_logs"] = (
                [to_dict(v) for v in db.query(MedicationLog).filter(MedicationLog.medication_id.in_(med_ids)).all()]
                if med_ids else []
            )
        except Exception:
            profile_data["medication_logs"] = []
        result["elderly_profiles"].append(profile_data)

    return result


def accept_invite(db: Session, token: str, password: str, full_name: str) -> tuple[User, str, int]:
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
    return user, access_token, elderly_id
