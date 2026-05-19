from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import AccessRequestStatus, AccessRequestType, CreatorStatus

MvpRequestType = Literal["product_access", "demo_access", "creator_access"]
MvpTargetType = Literal[
    "product",
    "course",
    "book",
    "resource",
    "platform_creator_permission",
]
ReviewStatus = Literal["approved", "rejected"]


class MeAccessRequestCreate(BaseModel):
    request_type: MvpRequestType
    target_type: MvpTargetType
    target_id: str | None = Field(default=None, max_length=64)
    title: str = Field(min_length=1, max_length=255)
    message: str | None = Field(default=None, max_length=5000)


class MeAccessRequestRead(BaseModel):
    id: int
    uuid: UUID
    request_type: AccessRequestType
    target_type: str
    target_id: str
    title: str
    message: str | None
    status: AccessRequestStatus
    admin_notes: str | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MeAccessRequestListResponse(BaseModel):
    items: list[MeAccessRequestRead]
    limit: int
    offset: int
    total: int


class RequesterSummary(BaseModel):
    user_id: int
    email: str
    display_name: str | None
    first_name: str | None
    last_name: str | None
    avatar_url: str | None
    has_avatar: bool = False


class AdminAccessRequestRead(BaseModel):
    id: int
    uuid: UUID
    request_type: AccessRequestType
    target_type: str
    target_id: str
    title: str
    message: str | None
    status: AccessRequestStatus
    admin_notes: str | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    requester: RequesterSummary


class AdminAccessRequestListResponse(BaseModel):
    items: list[AdminAccessRequestRead]
    limit: int
    offset: int
    total: int


class AdminAccessRequestReview(BaseModel):
    status: ReviewStatus
    admin_notes: str | None = Field(default=None, max_length=5000)
