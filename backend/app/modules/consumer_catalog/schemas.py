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
