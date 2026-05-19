from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PermissionCreate(BaseModel):
    code: str = Field(min_length=1, max_length=150)
    name: str = Field(min_length=1, max_length=200)
    module: str = Field(min_length=1, max_length=100)
    description: str | None = None


class PermissionUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=150)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    module: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None


class PermissionRead(BaseModel):
    id: int
    code: str
    name: str
    module: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PermissionListResponse(BaseModel):
    items: list[PermissionRead]
    limit: int
    offset: int
    total: int

