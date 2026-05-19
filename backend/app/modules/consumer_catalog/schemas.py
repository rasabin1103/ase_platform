from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType


class CatalogItemRead(BaseModel):
    id: str
    uuid: UUID
    title: str
    slug: str
    type: CatalogItemType
    category: str
    shortDescription: str
    longDescription: str
    imageUrl: str
    price: Decimal
    currency: str
    status: CatalogItemStatus
    level: CatalogItemLevel
    duration: str | None = None
    author: str
    previewUrl: str | None = None
    benefits: list[str] = []
    requirements: list[str] = []
    includedItems: list[str] = []
    isFavorite: bool = False
    isPurchased: bool = False
    createdAt: datetime
    updatedAt: datetime


class CatalogItemListResponse(BaseModel):
    items: list[CatalogItemRead]
    limit: int
    offset: int
    total: int


class UserCatalogStateUpdate(BaseModel):
    favorite_slugs: list[str] = []
    purchased_slugs: list[str] = []


class UserCatalogStateRead(BaseModel):
    favorite_slugs: list[str]
    purchased_slugs: list[str]
