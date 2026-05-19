from __future__ import annotations

from pydantic import BaseModel, Field


class RolePermissionCreate(BaseModel):
    role_id: int = Field(ge=1)
    permission_id: int = Field(ge=1)


class RolePermissionRead(BaseModel):
    id: int
    role_id: int
    permission_id: int

    model_config = {"from_attributes": True}


class RolePermissionListResponse(BaseModel):
    items: list[RolePermissionRead]
    limit: int
    offset: int
    total: int

