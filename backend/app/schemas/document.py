from datetime import datetime
from pydantic import BaseModel, field_validator

CATEGORIES = ("analise", "receita", "relatorio", "identidade", "seguro", "outro")
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_MIME_TYPES = (
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/webp",
)


class DocumentResponse(BaseModel):
    id: int
    elderly_id: int
    uploaded_by: int
    uploaded_by_name: str
    name: str
    category: str
    file_size: int | None
    mime_type: str | None
    notes: str | None
    document_date: datetime | None
    created_at: datetime
    download_url: str

    model_config = {"from_attributes": True}


class DocumentUpdateRequest(BaseModel):
    name: str | None = None
    category: str | None = None
    notes: str | None = None
    document_date: datetime | None = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        if v and v not in CATEGORIES:
            raise ValueError(f"Categoria inválida. Use: {', '.join(CATEGORIES)}")
        return v
