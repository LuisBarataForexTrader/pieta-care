from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentUpdateRequest, CATEGORIES
from app.services.document import (
    upload_document,
    list_documents,
    get_document,
    update_document,
    delete_document,
    DocumentError,
)

router = APIRouter(prefix="/elderly/{elderly_id}/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload(
    elderly_id: int,
    file: UploadFile = File(...),
    category: str = Form(...),
    name: str | None = Form(default=None),
    notes: str | None = Form(default=None),
    document_date: datetime | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        file_bytes = await file.read()
        return upload_document(
            db=db,
            elderly_id=elderly_id,
            user=user,
            file_bytes=file_bytes,
            filename=file.filename or "documento",
            mime_type=file.content_type or "application/octet-stream",
            category=category,
            name=name,
            notes=notes,
            document_date=document_date,
        )
    except DocumentError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("", response_model=list[DocumentResponse])
def list_all(
    elderly_id: int,
    category: str | None = Query(default=None, description=f"Filtrar por: {', '.join(CATEGORIES)}"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return list_documents(db, elderly_id, user, category)
    except DocumentError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_one(
    elderly_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return get_document(db, elderly_id, doc_id, user)
    except DocumentError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("/{doc_id}", response_model=DocumentResponse)
def update(
    elderly_id: int,
    doc_id: int,
    data: DocumentUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return update_document(db, elderly_id, doc_id, data, user)
    except DocumentError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{doc_id}", status_code=204)
def delete(
    elderly_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        delete_document(db, elderly_id, doc_id, user)
    except DocumentError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
