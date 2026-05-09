import re
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.auth import hash_password, verify_password, create_access_token, decode_invite_token
from app.core.email import send_email, verification_email_html, deletion_confirmation_html, password_reset_html
from app.core.config import settings
from app.models.user import User
from app.models.family import FamilyMember
from app.models.elderly import ElderlyProfile
from app.schemas.auth import RegisterRequest, LoginRequest


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


# ─── Anti-trial-abuse helpers ─────────────────────────────────────────
def _normalize_phone(raw: str | None) -> str | None:
    """Keep only digits; if 10+ remain, take the last 9 (PT mobile shape).
    Returns None if nothing useful is left."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if len(digits) < 9:
        return None
    return digits[-9:]


def _canonical_email(email: str) -> str:
    """Lowercase + strip the '+suffix' before @ (gmail-style aliases).
    foo+anything@bar.com -> foo@bar.com — used for trial-abuse detection,
    not stored as the login email."""
    e = email.strip().lower()
    if "@" not in e:
        return e
    local, domain = e.rsplit("@", 1)
    if "+" in local:
        local = local.split("+", 1)[0]
    return f"{local}@{domain}"


def _trial_already_consumed(db: Session, *, email: str, phone_norm: str | None, nif: str | None) -> bool:
    """True if any pre-existing (non-deleted) account looks like the
    same person trying to grab another 14-day trial. Checks: canonical
    email, normalised phone, NIF. Returns False on any signal we can't
    evaluate (e.g. no phone provided)."""
    canon = _canonical_email(email)
    filters = [User.email_canonical == canon]
    if phone_norm:
        filters.append(User.phone_normalized == phone_norm)
    if nif:
        filters.append(User.nif == nif)

    q = db.query(User).filter(
        User.deleted_at.is_(None),
        User.trial_used_at.isnot(None),
        or_(*filters),
    )
    return q.first() is not None


def register_user(db: Session, data: RegisterRequest) -> User:
    existing = db.query(User).filter(User.email == data.email).first()

    # If a record exists but the user never confirmed their email (or the
    # confirmation send failed silently - e.g. Resend rejected the FROM
    # domain), let them re-register to refresh the credentials and trigger
    # a new verification email. This avoids "Email já registado" dead-ends
    # for users who mistyped or whose first email never arrived.
    if existing and not existing.is_verified and existing.deleted_at is None:
        token = secrets.token_urlsafe(32)
        existing.hashed_password = hash_password(data.password)
        existing.full_name = data.full_name
        existing.phone = data.phone
        existing.subscription_status = "trial"
        existing.trial_ends_at = datetime.utcnow() + timedelta(days=14)
        existing.email_verification_token = token

        # Make sure they have an elderly profile + ownership row if they
        # provided an elderly_name now (or didn't last time).
        if data.elderly_name:
            owns_any = db.query(FamilyMember).filter(
                FamilyMember.user_id == existing.id,
                FamilyMember.role == "owner",
            ).first()
            if not owns_any:
                elderly = ElderlyProfile(
                    full_name=data.elderly_name,
                    created_by=existing.id,
                )
                db.add(elderly)
                db.flush()
                db.add(FamilyMember(
                    elderly_id=elderly.id,
                    user_id=existing.id,
                    invited_email=existing.email,
                    role="owner",
                    is_accepted=True,
                ))

        db.commit()
        db.refresh(existing)

        verify_url = f"{settings.FRONTEND_URL}/verificar-email?token={token}"
        send_email(
            to=existing.email,
            subject="Confirme o seu email - pietas.care",
            html=verification_email_html(existing.full_name, verify_url),
        )
        return existing

    # Email belongs to an already-verified (real) account → genuine conflict.
    if existing:
        raise AuthError("Email já registado", 409)

    token = secrets.token_urlsafe(32)

    # ── Anti-trial-abuse decision ──────────────────────────────────
    # If the same person (by canonical email / phone / NIF) has ALREADY
    # had a trial, do NOT grant a fresh one. They register normally but
    # land on subscription_status='expired' — meaning they have to pick
    # a paid plan to use the app. Status messaging explains this.
    phone_norm = _normalize_phone(getattr(data, "phone", None))
    nif = getattr(data, "nif", None)
    canon_email = _canonical_email(data.email)
    abused = _trial_already_consumed(db, email=data.email, phone_norm=phone_norm, nif=nif)

    now = datetime.utcnow()
    user = User(
        email=data.email,
        email_canonical=canon_email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        phone_normalized=phone_norm,
        nif=nif,
        subscription_status="expired" if abused else "trial",
        trial_ends_at=None if abused else now + timedelta(days=14),
        trial_used_at=None if abused else now,
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


def request_password_reset(db: Session, email: str) -> None:
    """Generate a reset token + send email. Always returns None (we never
    leak whether the email exists or not - the API responds the same way
    in both cases)."""
    user = db.query(User).filter(
        User.email == email,
        User.deleted_at.is_(None),
    ).first()
    if not user:
        return  # silent no-op for unknown emails

    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires_at = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_email(
        to=user.email,
        subject="Repor password - pietas.care",
        html=password_reset_html(user.full_name, reset_url),
    )


def reset_password(db: Session, token: str, new_password: str) -> User:
    if len(new_password) < 8:
        raise AuthError("A password tem de ter pelo menos 8 caracteres", 400)

    user = db.query(User).filter(
        User.password_reset_token == token,
        User.deleted_at.is_(None),
    ).first()
    if not user:
        raise AuthError("Link inválido ou já utilizado", 400)

    if user.password_reset_expires_at and user.password_reset_expires_at < datetime.utcnow():
        # Clear the stale token so it can't be retried
        user.password_reset_token = None
        user.password_reset_expires_at = None
        db.commit()
        raise AuthError("Link expirado. Solicite um novo email de reposição.", 400)

    user.hashed_password = hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    # If the user is finally setting a password via reset link, treat it
    # as proof of email ownership (handy for accounts stuck unverified).
    if not user.is_verified:
        user.is_verified = True
        user.email_verification_token = None
    db.commit()
    db.refresh(user)
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
