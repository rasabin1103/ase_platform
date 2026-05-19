from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import AccessRequestPriority, AccessRequestStatus, AccessRequestType


class AccessRequestCreate(BaseModel):
    organization_id: int | None = None
    request_type: AccessRequestType
    target_entity_type: str = Field(max_length=100)
    target_entity_id: str = Field(max_length=64)
    title: str = Field(max_length=255)
    description: str | None = None
    priority: AccessRequestPriority = AccessRequestPriority.normal
    metadata_json: dict[str, Any] | None = None


class CreatorApplicationCreate(BaseModel):
    creator_scope: Literal["courses", "products", "both"]
    experience: str = Field(min_length=10, max_length=5000)
    knowledge_areas: str = Field(min_length=2, max_length=2000)
    portfolio_url: str | None = Field(default=None, max_length=2048)
    motivation: str = Field(min_length=10, max_length=5000)
    initial_proposal: str = Field(min_length=10, max_length=5000)
    quality_agreement: bool

    @field_validator("quality_agreement")
    @classmethod
    def must_accept_quality(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Quality standards must be accepted")
        return v


class AccessRequestUpdate(BaseModel):
    status: AccessRequestStatus | None = None
    priority: AccessRequestPriority | None = None
    description: str | None = None
    metadata_json: dict[str, Any] | None = None


class AccessRequestRead(BaseModel):
    id: int
    uuid: UUID
    organization_id: int | None
    organization_uuid: UUID | None = None
    requested_by_user_id: int
    requested_by_user_uuid: UUID | None = None
    reviewed_by_user_id: int | None
    reviewed_by_user_uuid: UUID | None = None
    request_type: AccessRequestType
    target_entity_type: str
    target_entity_id: str
    title: str
    description: str | None
    status: AccessRequestStatus
    priority: AccessRequestPriority
    metadata_json: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class AccessRequestListResponse(BaseModel):
    items: list[AccessRequestRead]
    limit: int
    offset: int
    total: int
