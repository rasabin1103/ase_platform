from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ProductStatus


class ProductCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: ProductStatus = ProductStatus.active
    owner_user_id: int | None = None


class ProductUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: ProductStatus | None = None


class ProductRead(BaseModel):
    id: int
    code: str
    name: str
    description: str | None
    status: ProductStatus
    owner_user_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductRead]
    limit: int
    offset: int
    total: int

