from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType


class MyRatingRead(BaseModel):
    isPositive: bool
    tags: list[str] = []


class MyReviewRead(BaseModel):
    rating: int
    comment: str | None = None


class ReviewRead(BaseModel):
    userDisplayName: str
    rating: int
    comment: str | None = None
    createdAt: datetime


class ReviewListResponse(BaseModel):
    items: list[ReviewRead]
    averageRating: float | None = None
    reviewCount: int = 0
    limit: int
    offset: int


class CatalogItemImagePublicRead(BaseModel):
    url: str
    isCover: bool


class CatalogItemRead(BaseModel):
    id: str
    uuid: UUID
    title: str
    slug: str
    type: CatalogItemType
    category: str
    shortDescription: str
    longDescription: str
    # English mirrors, auto-translated via DeepL on save (see
    # CatalogAdminService._ensure_english_fields) — null only for items
    # created before this field existed and not re-saved since. The
    # frontend falls back to the Spanish text whenever these are null.
    titleEn: str | None = None
    shortDescriptionEn: str | None = None
    longDescriptionEn: str | None = None
    imageUrl: str
    images: list[CatalogItemImagePublicRead] = []
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
    tags: list[str] = []
    isFavorite: bool = False
    isPurchased: bool = False
    upvotes: int = 0
    downvotes: int = 0
    netScore: int = 0
    topTags: list[str] = []
    myRating: MyRatingRead | None = None
    averageRating: float | None = None
    reviewCount: int = 0
    myReview: MyReviewRead | None = None
    # True only when both repo_url and repo_path are configured on this
    # item — powers the "Ver contenido"/"Descargar" buttons. Deliberately
    # a plain boolean, never the raw repo_url/repo_path: those stay
    # server-side, read through GithubClient only after the ownership
    # check in resource-content/resource-download, never handed to the
    # browser directly (this is a private, shared repo, not per-item).
    hasResourceContent: bool = False
    createdAt: datetime
    updatedAt: datetime


class RateItemRequest(BaseModel):
    isPositive: bool
    tags: list[str] = Field(default_factory=list)


class ReviewRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


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


class ResourceContentRead(BaseModel):
    path: str
    # "markdown" (README.md, decoded as text in `content`) | "docx" | "xlsx"
    # (both binary, base64-encoded in `contentBase64` — the frontend decodes
    # and renders them client-side with mammoth/SheetJS instead of the
    # backend converting to HTML, keeping this endpoint format-agnostic).
    kind: str = "markdown"
    content: str | None = None
    contentBase64: str | None = None
    truncated: bool = False
