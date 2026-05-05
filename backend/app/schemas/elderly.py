from datetime import datetime, date
from pydantic import BaseModel, EmailStr


class ElderlyCreateRequest(BaseModel):
    full_name: str
    date_of_birth: date | None = None
    id_number: str | None = None
    health_number: str | None = None
    address: str | None = None
    medical_conditions: str | None = None
    allergies: str | None = None
    blood_type: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


class ElderlyUpdateRequest(BaseModel):
    full_name: str | None = None
    date_of_birth: date | None = None
    id_number: str | None = None
    health_number: str | None = None
    address: str | None = None
    medical_conditions: str | None = None
    allergies: str | None = None
    blood_type: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


class FamilyMemberResponse(BaseModel):
    id: int
    invited_email: str
    full_name: str | None = None
    role: str
    relation: str | None
    is_accepted: bool
    can_manage_medications: bool
    can_manage_documents: bool
    joined_at: datetime | None

    model_config = {"from_attributes": True}


class ElderlyResponse(BaseModel):
    id: int
    full_name: str
    date_of_birth: date | None
    photo_url: str | None
    id_number: str | None
    health_number: str | None
    address: str | None
    medical_conditions: str | None
    allergies: str | None
    blood_type: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    created_at: datetime
    family_members: list[FamilyMemberResponse] = []

    model_config = {"from_attributes": True}


class InviteFamilyRequest(BaseModel):
    email: EmailStr
    relation: str | None = None
    role: str = "member"
    can_manage_medications: bool = True
    can_manage_documents: bool = True
    can_invite_others: bool = False
