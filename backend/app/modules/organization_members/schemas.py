from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import MembershipStatus


class OrganizationMemberCreate(BaseModel):
    # We accept public UUIDs for usability; IDs remain internal.
    organization_uuid: UUID | None = None
    user_uuid: UUID | None = None
    organization_id: int | None = Field(default=None, ge=1)
    user_id: int | None = Field(default=None, ge=1)
    membership_status: MembershipStatus = MembershipStatus.invited


class OrganizationMemberUpdate(BaseModel):
    membership_status: MembershipStatus | None = None
    joined_at: datetime | None = None


class OrganizationMemberRead(BaseModel):
    id: int
    organization_id: int
    user_id: int
    organization_uuid: UUID
    user_uuid: UUID
    membership_status: MembershipStatus
    joined_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrganizationMemberListResponse(BaseModel):
    items: list[OrganizationMemberRead]
    limit: int
    offset: int
    total: int

