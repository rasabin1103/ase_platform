from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType, CatalogPurchaseProvider
from app.modules.pricing.schemas import PublicPricingPlanRead
from app.modules.catalog.catalog_media_schemas import BookPurchaseLinkRead, CatalogItemImageRead


class CatalogItemSummaryRead(BaseModel):
    id: str
    title: str
    slug: str
    type: CatalogItemType
    shortDescription: str
    imageUrl: str
    author: str


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
    pricingPlans: list[PublicPricingPlanRead] = Field(default_factory=list)
    coverImageUrl: str | None = None
    thumbnailUrl: str | None = None
    amazonUrl: str | None = None
    externalPurchaseUrl: str | None = None
    purchaseProvider: CatalogPurchaseProvider = CatalogPurchaseProvider.internal
    pdfUrl: str | None = None
    previewPdfUrl: str | None = None
    previewPages: int | None = None
    sampleDownloadUrl: str | None = None
    richContentMarkdown: str | None = None
    bookFormat: str | None = None
    audience: list[str] = Field(default_factory=list)
    relatedItems: list[CatalogItemSummaryRead] = Field(default_factory=list)
    images: list[CatalogItemImageRead] = Field(default_factory=list)
    purchaseLinks: list[BookPurchaseLinkRead] = Field(default_factory=list)
    imageCount: int = 0
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
