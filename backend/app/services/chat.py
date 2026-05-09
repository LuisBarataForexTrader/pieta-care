"""Family chat - coordinated messaging between accepted family members
of an elderly profile. Access depends on the owner's subscription:
all accepted family members can chat as long as the family owner is
on a trial or Família AI plan."""
from datetime import datetime
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage, ChatRead
from app.models.family import FamilyMember
from app.models.user import User
from app.schemas.chat import ChatMessageResponse


class ChatError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


# Plan keys (defined in app/core/stripe_client.py PLANS) that grant chat access.
AI_PLAN_KEYS = {"cuidador_pro"}


def _user_grants_chat(u: User | None) -> bool:
    if not u:
        return False
    if u.subscription_status == "trial":
        return True
    if u.subscription_status in ("active", "trialing"):
        return u.subscription_plan in AI_PLAN_KEYS
    return False


def _family_has_chat_access(db: Session, elderly_id: int, user: User) -> tuple[bool, bool]:
    """Returns (has_access, requesting_user_is_owner).

    Access is granted if either:
      - the requesting user themselves has AI/trial access, OR
      - the owner of this elderly profile has AI/trial access (so an
        invited member benefits from the subscriber's plan).
    """
    is_owner = False
    if _user_grants_chat(user):
        # Even non-owners with their own trial/AI sub get access.
        return True, _is_owner(db, elderly_id, user.id)

    owner = _get_owner(db, elderly_id)
    if owner and _user_grants_chat(owner):
        return True, owner.id == user.id
    is_owner = owner is not None and owner.id == user.id
    return False, is_owner


def _get_owner(db: Session, elderly_id: int) -> User | None:
    membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.role == "owner",
        FamilyMember.is_accepted == True,
    ).first()
    if not membership:
        return None
    return db.query(User).filter(User.id == membership.user_id).first()


def _is_owner(db: Session, elderly_id: int, user_id: int) -> bool:
    return db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.user_id == user_id,
        FamilyMember.role == "owner",
    ).first() is not None


def _check_membership(db: Session, elderly_id: int, user: User) -> FamilyMember:
    membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,
    ).first()
    if not membership:
        raise ChatError("Sem acesso a este perfil", 403)
    return membership


def _check_access(db: Session, elderly_id: int, user: User) -> FamilyMember:
    membership = _check_membership(db, elderly_id, user)
    has_access, is_owner = _family_has_chat_access(db, elderly_id, user)
    if not has_access:
        if is_owner:
            msg = ("O chat familiar está disponível no plano Família AI. "
                   "Faça upgrade na sua área de cliente.")
        else:
            msg = ("O chat familiar requer que o titular da família esteja "
                   "no plano Família AI.")
        raise ChatError(msg, 402)
    return membership


def _to_response(msg: ChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=msg.id,
        elderly_id=msg.elderly_id,
        sender_id=msg.sender_id,
        sender_name=msg.sender.full_name if msg.sender else "Desconhecido",
        content=msg.content,
        created_at=msg.created_at,
    )


def list_messages(
    db: Session, elderly_id: int, user: User,
    since_id: int | None = None, limit: int = 100,
) -> list[ChatMessageResponse]:
    _check_access(db, elderly_id, user)

    query = db.query(ChatMessage).filter(
        ChatMessage.elderly_id == elderly_id,
        ChatMessage.deleted_at.is_(None),
    )
    if since_id is not None:
        query = query.filter(ChatMessage.id > since_id)
        msgs = query.order_by(ChatMessage.id.asc()).limit(limit).all()
    else:
        # Most recent N, returned chronologically
        msgs = query.order_by(desc(ChatMessage.id)).limit(limit).all()
        msgs.reverse()

    return [_to_response(m) for m in msgs]


def send_message(
    db: Session, elderly_id: int, user: User, content: str,
) -> ChatMessageResponse:
    _check_access(db, elderly_id, user)

    text = (content or "").strip()
    if not text:
        raise ChatError("Mensagem vazia", 400)
    if len(text) > 4000:
        raise ChatError("Mensagem demasiado longa (máx. 4000 caracteres)", 400)

    msg = ChatMessage(
        elderly_id=elderly_id,
        sender_id=user.id,
        content=text,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Auto-mark sender's own message as read
    _upsert_read(db, elderly_id, user.id, msg.id)
    db.commit()

    return _to_response(msg)


def _upsert_read(db: Session, elderly_id: int, user_id: int, msg_id: int) -> None:
    existing = db.query(ChatRead).filter(
        ChatRead.elderly_id == elderly_id,
        ChatRead.user_id == user_id,
    ).first()
    if existing:
        if existing.last_read_message_id is None or msg_id > existing.last_read_message_id:
            existing.last_read_message_id = msg_id
            existing.last_read_at = datetime.utcnow()
    else:
        db.add(ChatRead(
            elderly_id=elderly_id,
            user_id=user_id,
            last_read_message_id=msg_id,
            last_read_at=datetime.utcnow(),
        ))


def mark_read(db: Session, elderly_id: int, user: User, last_read_message_id: int) -> None:
    _check_membership(db, elderly_id, user)  # No AI gate for marking read
    _upsert_read(db, elderly_id, user.id, last_read_message_id)
    db.commit()


def unread_count(db: Session, elderly_id: int, user: User) -> dict:
    _check_membership(db, elderly_id, user)

    last_msg = db.query(ChatMessage).filter(
        ChatMessage.elderly_id == elderly_id,
        ChatMessage.deleted_at.is_(None),
    ).order_by(desc(ChatMessage.id)).first()
    last_message_id = last_msg.id if last_msg else None

    if not last_message_id:
        return {"elderly_id": elderly_id, "unread": 0, "last_message_id": None}

    read = db.query(ChatRead).filter(
        ChatRead.elderly_id == elderly_id,
        ChatRead.user_id == user.id,
    ).first()
    last_read = read.last_read_message_id if read and read.last_read_message_id else 0

    unread = db.query(ChatMessage).filter(
        ChatMessage.elderly_id == elderly_id,
        ChatMessage.deleted_at.is_(None),
        ChatMessage.id > last_read,
        ChatMessage.sender_id != user.id,
    ).count()

    return {"elderly_id": elderly_id, "unread": unread, "last_message_id": last_message_id}
