from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import OrganizationJoinRequestStatus, OrganizationMemberInviteStatus, OrganizationType


class OrganizationSearchItem(BaseModel):
    uuid: UUID
    name: str
    slug: str
    type: OrganizationType
    member_count: int
    has_pending_request: bool = False

    model_config = {"from_attributes": True}


class OrganizationSearchResponse(BaseModel):
    items: list[OrganizationSearchItem]
    limit: int
    offset: int
    total: int


class JoinRequestCreate(BaseModel):
    message: str | None = Field(default=None, max_length=1000)


class JoinRequestRead(BaseModel):
    id: int
    organization_uuid: UUID
    organization_name: str
    user_uuid: UUID
    user_display_name: str | None
    user_email: str
    status: OrganizationJoinRequestStatus
    message: str | None
    created_at: datetime
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class JoinRequestListResponse(BaseModel):
    items: list[JoinRequestRead]
    limit: int
    offset: int
    total: int


class UserSearchItem(BaseModel):
    uuid: UUID
    email: str
    display_name: str | None
    first_name: str | None
    last_name: str | None

    model_config = {"from_attributes": True}


class UserSearchResponse(BaseModel):
    items: list[UserSearchItem]
    limit: int
    offset: int
    total: int


class MemberInviteCreate(BaseModel):
    user_uuid: UUID


class MemberInviteRead(BaseModel):
    id: int
    organization_uuid: UUID
    organization_name: str
    invited_user_uuid: UUID
    invited_user_display_name: str | None
    invited_user_email: str
    invited_by_user_uuid: UUID
    status: OrganizationMemberInviteStatus
    created_at: datetime
    responded_at: datetime | None

    model_config = {"from_attributes": True}


class MemberInviteListResponse(BaseModel):
    items: list[MemberInviteRead]
    limit: int
    offset: int
    total: int
