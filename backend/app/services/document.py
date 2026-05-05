from datetime import datetime
from sqlalchemy.orm import Session

from app.core import storage
from app.models.document import Document
from app.models.family import FamilyMember
from app.models.user import User
from app.schemas.document import (
    DocumentResponse,
    DocumentUpdateRequest,
    MAX_FILE_SIZE,
    ALLOWED_MIME_TYPES,
)


class DocumentError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def _check_access(db: Session, elderly_id: int, user: User, require_manage: bool = False):
    membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,
    ).first()
    if not membership:
        raise DocumentError("Sem acesso a este perfil", 403)
    if require_manage and not membership.can_manage_documents:
        raise DocumentError("Sem permissão para gerir documentos", 403)
    return membership


def _to_response(db: Session, doc: Document) -> DocumentResponse:
    uploader = db.query(User).filter(User.id == doc.uploaded_by).first()
    url = storage.get_presigned_url(doc.file_url)
    return DocumentResponse(
        **{c.name: getattr(doc, c.name) for c in doc.__table__.columns},
        uploaded_by_name=uploader.full_name if uploader else "Desconhecido",
        download_url=url,
    )


def upload_document(
    db: Session,
    elderly_id: int,
    user: User,
    file_bytes: bytes,
    filename: str,
    mime_type: str,
    category: str,
    name: str | None = None,
    notes: str | None = None,
    document_date: datetime | None = None,
) -> DocumentResponse:
    _check_access(db, elderly_id, user, require_manage=True)

    if len(file_bytes) > MAX_FILE_SIZE:
        raise DocumentError("Ficheiro demasiado grande. Máximo 20MB.", 413)

    if mime_type not in ALLOWED_MIME_TYPES:
        raise DocumentError(
            f"Tipo de ficheiro não suportado. Use: PDF, JPG, PNG, HEIC, WEBP", 415
        )

    if category not in ("analise", "receita", "relatorio", "identidade", "seguro", "outro"):
        raise DocumentError("Categoria inválida", 400)

    key = storage.upload_file(file_bytes, filename, mime_type, elderly_id)

    doc = Document(
        elderly_id=elderly_id,
        uploaded_by=user.id,
        name=name or filename,
        category=category,
        file_url=key,
        file_size=len(file_bytes),
        mime_type=mime_type,
        notes=notes,
        document_date=document_date,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _to_response(db, doc)


def list_documents(
    db: Session,
    elderly_id: int,
    user: User,
    category: str | None = None,
) -> list[DocumentResponse]:
    _check_access(db, elderly_id, user)

    query = db.query(Document).filter(Document.elderly_id == elderly_id)
    if category:
        query = query.filter(Document.category == category)

    docs = query.order_by(Document.created_at.desc()).all()
    return [_to_response(db, d) for d in docs]


def get_document(db: Session, elderly_id: int, doc_id: int, user: User) -> DocumentResponse:
    _check_access(db, elderly_id, user)

    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.elderly_id == elderly_id,
    ).first()

    if not doc:
        raise DocumentError("Documento não encontrado", 404)

    return _to_response(db, doc)


def update_document(
    db: Session, elderly_id: int, doc_id: int, data: DocumentUpdateRequest, user: User
) -> DocumentResponse:
    _check_access(db, elderly_id, user, require_manage=True)

    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.elderly_id == elderly_id,
    ).first()

    if not doc:
        raise DocumentError("Documento não encontrado", 404)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(doc, field, value)

    db.commit()
    db.refresh(doc)
    return _to_response(db, doc)


def delete_document(db: Session, elderly_id: int, doc_id: int, user: User) -> None:
    membership = _check_access(db, elderly_id, user, require_manage=True)

    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.elderly_id == elderly_id,
    ).first()

    if not doc:
        raise DocumentError("Documento não encontrado", 404)

    if doc.uploaded_by != user.id and membership.role not in ("owner", "admin"):
        raise DocumentError("Só o uploader ou admin pode apagar este documento", 403)

    storage.delete_file(doc.file_url)
    db.delete(doc)
    db.commit()
