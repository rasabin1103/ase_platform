from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class AuditLogCreate(BaseModel):
    organization_id: int | None = Field(default=None, ge=1)
    organization_uuid: UUID | None = None
    actor_user_id: int | None = Field(default=None, ge=1)
    actor_user_uuid: UUID | None = None
    action: str = Field(min_length=1, max_length=200)
    entity_type: str = Field(min_length=1, max_length=100)
    entity_id: str | None = Field(default=None, max_length=64)
    metadata_json: dict[str, Any] | None = None


class AuditLogRead(BaseModel):
    id: int
    organization_id: int | None
    organization_name: str | None = None
    actor_user_id: int | None
    actor_display_name: str | None = None
    actor_email: str | None = None
    action: str
    entity_type: str
    entity_id: str | None
    metadata_json: dict[str, Any] | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    items: list[AuditLogRead]
    limit: int
    offset: int
    total: int

