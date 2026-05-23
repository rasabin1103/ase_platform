from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType, CatalogPurchaseProvider
from app.modules.catalog.catalog_media_schemas import (
    BookPurchaseLinkInput,
    BookPurchaseLinkRead,
    CatalogItemImageInput,
    CatalogItemImageRead,
)


class CatalogItemAdminBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=160)
    type: CatalogItemType
    category: str = Field(min_length=1, max_length=120)
    short_description: str = Field(min_length=1, max_length=500)
    long_description: str = Field(min_length=1)
    image_url: str = Field(default="", max_length=2048)
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
    cover_image_url: str | None = Field(default=None, max_length=2048)
    thumbnail_url: str | None = Field(default=None, max_length=2048)
    amazon_url: str | None = Field(default=None, max_length=2048)
    external_purchase_url: str | None = Field(default=None, max_length=2048)
    purchase_provider: CatalogPurchaseProvider | None = CatalogPurchaseProvider.internal
    pdf_url: str | None = Field(default=None, max_length=2048)
    preview_pdf_url: str | None = Field(default=None, max_length=2048)
    preview_pages: int | None = Field(default=None, ge=0)
    sample_download_url: str | None = Field(default=None, max_length=2048)
    rich_content_markdown: str | None = None
    book_format: str | None = Field(default=None, max_length=80)
    audience: list[str] = []


class CatalogItemAdminCreate(CatalogItemAdminBase):
    images: list[CatalogItemImageInput] = Field(default_factory=list)
    purchase_links: list[BookPurchaseLinkInput] = Field(default_factory=list)


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
    cover_image_url: str | None = Field(default=None, max_length=2048)
    thumbnail_url: str | None = Field(default=None, max_length=2048)
    amazon_url: str | None = None
    external_purchase_url: str | None = None
    purchase_provider: CatalogPurchaseProvider | None = None
    pdf_url: str | None = None
    preview_pdf_url: str | None = None
    preview_pages: int | None = Field(default=None, ge=0)
    sample_download_url: str | None = None
    rich_content_markdown: str | None = None
    book_format: str | None = None
    audience: list[str] | None = None
    images: list[CatalogItemImageInput] | None = None
    purchase_links: list[BookPurchaseLinkInput] | None = None


class CatalogItemAdminRead(CatalogItemAdminBase):
    id: int
    uuid: UUID
    has_stored_image: bool = False
    images: list[CatalogItemImageRead] = Field(default_factory=list)
    purchase_links: list[BookPurchaseLinkRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CatalogItemAdminListResponse(BaseModel):
    items: list[CatalogItemAdminRead]
    limit: int
    offset: int
    total: int
