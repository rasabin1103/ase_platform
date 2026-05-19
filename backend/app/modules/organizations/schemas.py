from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import OrganizationStatus, OrganizationType
from app.models.enums import MembershipStatus


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=100)
    type: OrganizationType = OrganizationType.business
    owner_user_uuid: UUID


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=100)
    type: OrganizationType | None = None
    status: OrganizationStatus | None = None
    owner_user_uuid: UUID | None = None


class OrganizationRead(BaseModel):
    uuid: UUID
    name: str
    slug: str
    type: OrganizationType
    status: OrganizationStatus
    owner_user_uuid: UUID
    current_user_membership_status: MembershipStatus | None = None
    current_user_role_codes: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrganizationListResponse(BaseModel):
    items: list[OrganizationRead]
    limit: int
    offset: int
    total: int

