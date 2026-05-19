from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import AccessLevel


class PlanProductCreate(BaseModel):
    plan_id: int = Field(ge=1)
    product_id: int = Field(ge=1)
    access_level: AccessLevel = AccessLevel.read


class PlanProductUpdate(BaseModel):
    access_level: AccessLevel


class PlanProductRead(BaseModel):
    id: int
    plan_id: int
    product_id: int
    access_level: AccessLevel

    model_config = {"from_attributes": True}


class PlanProductListResponse(BaseModel):
    items: list[PlanProductRead]
    limit: int
    offset: int
    total: int

