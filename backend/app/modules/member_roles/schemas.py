from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MemberRoleCreate(BaseModel):
    organization_member_id: int = Field(ge=1)
    role_id: int = Field(ge=1)
    assigned_by_user_id: int | None = Field(default=None, ge=1)
    assigned_by_user_uuid: UUID | None = None


class MemberRoleRead(BaseModel):
    id: int
    organization_member_id: int
    role_id: int
    assigned_by_user_id: int
    assigned_by_user_uuid: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberRoleListResponse(BaseModel):
    items: list[MemberRoleRead]
    limit: int
    offset: int
    total: int

