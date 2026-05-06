from sqlalchemy.orm import Session, joinedload

from app.core.auth import create_invite_token
from app.core.email import send_email, invite_email_html
from app.core import storage
from app.models.elderly import ElderlyProfile
from app.models.family import FamilyMember
from app.models.user import User
from app.schemas.elderly import ElderlyCreateRequest, ElderlyUpdateRequest, InviteFamilyRequest


class ElderlyError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def _get_membership(db: Session, elderly_id: int, user: User) -> FamilyMember | None:
    return db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,
    ).first()


def create_elderly(db: Session, data: ElderlyCreateRequest, user: User) -> ElderlyProfile:
    elderly = ElderlyProfile(**data.model_dump(), created_by=user.id)
    db.add(elderly)
    db.flush()

    # Creator becomes owner automatically
    membership = FamilyMember(
        elderly_id=elderly.id,
        user_id=user.id,
        invited_email=user.email,
        role="owner",
        is_accepted=True,
        can_manage_medications=True,
        can_manage_documents=True,
        can_invite_others=True,
    )
    db.add(membership)
    db.commit()
    db.refresh(elderly)
    return elderly


def get_elderly(db: Session, elderly_id: int, user: User) -> ElderlyProfile:
    membership = _get_membership(db, elderly_id, user)
    if not membership:
        raise ElderlyError("Sem acesso a este perfil", 403)

    elderly = db.query(ElderlyProfile).options(
        joinedload(ElderlyProfile.family_members)
    ).filter(ElderlyProfile.id == elderly_id).first()

    if not elderly:
        raise ElderlyError("Perfil não encontrado", 404)

    return elderly


def list_elderly(db: Session, user: User) -> list[ElderlyProfile]:
    memberships = db.query(FamilyMember).filter(
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,
    ).all()

    elderly_ids = [m.elderly_id for m in memberships]
    return db.query(ElderlyProfile).filter(ElderlyProfile.id.in_(elderly_ids)).all()


def update_elderly(
    db: Session, elderly_id: int, data: ElderlyUpdateRequest, user: User
) -> ElderlyProfile:
    membership = _get_membership(db, elderly_id, user)
    if not membership or membership.role not in ("owner", "admin"):
        raise ElderlyError("Sem permissão para editar este perfil", 403)

    elderly = db.query(ElderlyProfile).filter(ElderlyProfile.id == elderly_id).first()
    if not elderly:
        raise ElderlyError("Perfil não encontrado", 404)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(elderly, field, value)

    db.commit()
    db.refresh(elderly)
    return elderly


def invite_family_member(
    db: Session, elderly_id: int, data: InviteFamilyRequest, user: User
) -> dict:
    membership = _get_membership(db, elderly_id, user)
    if not membership:
        raise ElderlyError("Sem acesso a este perfil", 403)
    if not membership.can_invite_others and membership.role not in ("owner", "admin"):
        raise ElderlyError("Sem permissão para convidar membros", 403)

    existing = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.invited_email == data.email,
    ).first()
    if existing:
        raise ElderlyError("Este email já foi convidado", 409)

    invite_token = create_invite_token(elderly_id, data.email)

    new_member = FamilyMember(
        elderly_id=elderly_id,
        invited_email=data.email,
        role=data.role,
        relation=data.relation,
        is_accepted=False,
        invite_token=invite_token,
        can_manage_medications=data.can_manage_medications,
        can_manage_documents=data.can_manage_documents,
        can_invite_others=data.can_invite_others,
    )
    db.add(new_member)
    db.commit()

    invite_link = f"https://pieta.care/invite?token={invite_token}"

    elderly_obj = db.query(ElderlyProfile).filter(ElderlyProfile.id == elderly_id).first()
    elderly_name = elderly_obj.full_name if elderly_obj else "um familiar"

    html = invite_email_html(elderly_name, user.full_name, invite_link, data.relation)
    sent = send_email(data.email, f"Convite pieta.care — {elderly_name}", html)

    msg = "Convite enviado" if sent else "Convite criado (email não configurado — partilha o link manualmente)"
    return {"message": msg, "invite_link": invite_link}


def upload_elderly_photo(
    db: Session, elderly_id: int, file_bytes: bytes, filename: str, mime_type: str, user: User
) -> str:
    membership = _get_membership(db, elderly_id, user)
    if not membership:
        raise ElderlyError("Sem acesso a este perfil", 403)

    elderly = db.query(ElderlyProfile).filter(ElderlyProfile.id == elderly_id).first()
    if not elderly:
        raise ElderlyError("Perfil não encontrado", 404)

    photo_url = storage.upload_photo(file_bytes, filename, mime_type, elderly_id)

    elderly.photo_url = photo_url
    db.commit()

    return photo_url


def remove_family_member(
    db: Session, elderly_id: int, member_id: int, user: User
) -> None:
    membership = _get_membership(db, elderly_id, user)
    if not membership or membership.role != "owner":
        raise ElderlyError("Só o owner pode remover membros", 403)

    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.elderly_id == elderly_id,
    ).first()

    if not member:
        raise ElderlyError("Membro não encontrado", 404)
    if member.role == "owner":
        raise ElderlyError("Não podes remover o owner", 400)

    db.delete(member)
    db.commit()
