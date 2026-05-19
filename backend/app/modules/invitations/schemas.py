from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import InvitationStatus


class InvitationCreate(BaseModel):
    organization_id: int | None = Field(default=None, ge=1)
    organization_uuid: UUID | None = None
    email: EmailStr
    role_id: int = Field(ge=1)
    token: str | None = Field(default=None, min_length=16, max_length=128)
    status: InvitationStatus = InvitationStatus.pending
    expires_at: datetime
    invited_by_user_id: int | None = Field(default=None, ge=1)
    invited_by_user_uuid: UUID | None = None


class InvitationUpdate(BaseModel):
    email: EmailStr | None = None
    role_id: int | None = Field(default=None, ge=1)
    token: str | None = Field(default=None, min_length=16, max_length=128)
    status: InvitationStatus | None = None
    expires_at: datetime | None = None


class InvitationRead(BaseModel):
    id: int
    organization_id: int
    organization_uuid: UUID
    email: EmailStr
    role_id: int
    token: str
    status: InvitationStatus
    expires_at: datetime
    invited_by_user_id: int
    invited_by_user_uuid: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class InvitationListResponse(BaseModel):
    items: list[InvitationRead]
    limit: int
    offset: int
    total: int

