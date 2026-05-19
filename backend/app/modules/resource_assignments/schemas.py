from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ResourceAssignmentStatus


class ResourceAssignmentCreate(BaseModel):
    organization_id: int | None = None
    resource_type: str = Field(max_length=100)
    resource_id: str = Field(max_length=64)
    assigned_to_user_id: int
    starts_at: datetime | None = None
    ends_at: datetime | None = None


class ResourceAssignmentUpdate(BaseModel):
    status: ResourceAssignmentStatus | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None


class ResourceAssignmentRead(BaseModel):
    id: int
    organization_id: int | None
    resource_type: str
    resource_id: str
    assigned_to_user_id: int
    assigned_by_user_id: int | None
    status: ResourceAssignmentStatus
    starts_at: datetime | None
    ends_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResourceAssignmentListResponse(BaseModel):
    items: list[ResourceAssignmentRead]
    limit: int
    offset: int
    total: int
