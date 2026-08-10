from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.enums import BookPurchasePlatform


class CatalogItemImageInput(BaseModel):
    id: int | None = None
    image_url: str = Field(min_length=1, max_length=2048)
    alt_text: str | None = Field(default=None, max_length=500)
    title: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0, ge=0)
    is_primary: bool = False


class CatalogItemImageRead(BaseModel):
    id: int
    imageUrl: str
    altText: str | None = None
    title: str | None = None
    sortOrder: int
    isPrimary: bool
    createdAt: datetime
    updatedAt: datetime


class BookPurchaseLinkInput(BaseModel):
    id: int | None = None
    platform: BookPurchasePlatform
    label: str | None = Field(default=None, max_length=200)
    url: str = Field(min_length=1, max_length=2048)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    price: Decimal | None = Field(default=None, ge=0)
    country: str | None = Field(default=None, min_length=2, max_length=2)
    is_primary: bool = False
    is_active: bool = True
    sort_order: int = Field(default=0, ge=0)

    @field_validator("label")
    @classmethod
    def label_required_for_other(cls, v: str | None, info):
        platform = info.data.get("platform")
        if platform == BookPurchasePlatform.other and not (v and v.strip()):
            raise ValueError("label is required when platform is other")
        return v


class BookPurchaseLinkRead(BaseModel):
    id: int
    platform: BookPurchasePlatform
    label: str
    url: str
    currency: str | None = None
    price: Decimal | None = None
    country: str | None = None
    isPrimary: bool
    isActive: bool
    sortOrder: int
    createdAt: datetime
    updatedAt: datetime
