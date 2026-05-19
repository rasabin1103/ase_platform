from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType


class CatalogItemAdminBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=160)
    type: CatalogItemType
    category: str = Field(min_length=1, max_length=120)
    short_description: str = Field(min_length=1, max_length=500)
    long_description: str = Field(min_length=1)
    image_url: str = Field(min_length=1, max_length=2048)
    preview_url: str | None = Field(default=None, max_length=2048)
    price: Decimal = Field(ge=0)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    status: CatalogItemStatus = CatalogItemStatus.draft
    level: CatalogItemLevel = CatalogItemLevel.intermediate
    duration: str | None = Field(default=None, max_length=80)
    author: str = Field(min_length=1, max_length=200)
    benefits: list[str] = []
    requirements: list[str] = []
    included_items: list[str] = []


class CatalogItemAdminCreate(CatalogItemAdminBase):
    pass


class CatalogItemAdminUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    short_description: str | None = None
    long_description: str | None = None
    image_url: str | None = None
    preview_url: str | None = None
    price: Decimal | None = None
    currency: str | None = None
    status: CatalogItemStatus | None = None
    level: CatalogItemLevel | None = None
    duration: str | None = None
    author: str | None = None
    benefits: list[str] | None = None
    requirements: list[str] | None = None
    included_items: list[str] | None = None


class CatalogItemAdminRead(CatalogItemAdminBase):
    id: int
    uuid: UUID
    has_stored_image: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CatalogItemAdminListResponse(BaseModel):
    items: list[CatalogItemAdminRead]
    limit: int
    offset: int
    total: int
