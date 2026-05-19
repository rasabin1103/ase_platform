from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import RoleScope


class RoleCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=150)
    scope: RoleScope = RoleScope.organization
    description: str | None = None


class RoleUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    scope: RoleScope | None = None
    description: str | None = None


class RoleRead(BaseModel):
    id: int
    code: str
    name: str
    scope: RoleScope
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoleListResponse(BaseModel):
    items: list[RoleRead]
    limit: int
    offset: int
    total: int

