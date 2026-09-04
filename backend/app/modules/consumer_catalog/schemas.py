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
    audiobookUrl: str | None = None
    benefits: list[str] = []
    requirements: list[str] = []
    includedItems: list[str] = []
    tags: list[str] = []
    isFavorite: bool = False
    isPurchased: bool = False
    # True only when the current user's access to this item comes solely
    # from their organization's active plan subscription — never actually
    # paid for at this item's own price. False for a direct purchase, an
    # admin grant, a free claim, OR when the user has no access at all.
    # Lets the frontend exclude plan-bundled items from "total spent"-style
    # sums (see IndependentProgressPanel.tsx) without double-counting a
    # €9.99/mo plan as if every item it includes was bought separately.
    isPlanIncluded: bool = False
    upvotes: int = 0
    downvotes: int = 0
    netScore: int = 0
    topTags: list[str] = []
    myRating: MyRatingRead | None = None
    averageRating: float | None = None
    reviewCount: int = 0
    myReview: MyReviewRead | None = None
    # True when both repo_url and repo_path are configured on this item —
    # gates whether the "Ver contenido"/"Descargar" buttons render at all,
    # NOT whether the current user can see something (a priced item's
    # resource folder may only offer a free preview*.pdf to non-owners;
    # the content/download endpoints enforce ownership themselves for the
    # real file). Deliberately a plain boolean, never the raw
    # repo_url/repo_path: those stay server-side, read through
    # GithubClient only inside resource-content/resource-download, never
    # handed to the browser directly (this is a private, shared repo, not
    # per-item).
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
    # "markdown" (README.md) and "code" (any other recognized text/script
    # file) are both decoded as text in `content`. "docx"/"xlsx"/"pdf" are
    # binary, base64-encoded in `contentBase64` — the frontend decodes and
    # renders them client-side (mammoth/SheetJS/native browser PDF viewer)
    # instead of the backend converting to HTML, keeping this endpoint
    # format-agnostic.
    kind: str = "markdown"
    content: str | None = None
    contentBase64: str | None = None
    truncated: bool = False
    # True when the caller doesn't own this item and what's being served is
    # a sample (a preview*.pdf the admin uploaded), not the real file — lets
    # the frontend show a "buy to see the rest" banner instead of treating
    # this like full access.
    isPreview: bool = False


class BookDownloadFormatsRead(BaseModel):
    """Which of a book's per-format download buttons have something to
    serve — checked without requiring ownership, so the frontend can gray
    out a format that was never uploaded instead of only discovering that
    after checkout. "zip" is true either for a real pre-made zip, or
    implicitly whenever at least one of pdf/epub/kindle exists (bundled on
    the fly by the download endpoint in that case)."""

    pdf: bool = False
    epub: bool = False
    kindle: bool = False
    zip: bool = False


class AudiobookChapterRead(BaseModel):
    name: str
    index: int


class AudiobookChapterListRead(BaseModel):
    """A book's platform-hosted audiobook — chapters split into separate,
    smaller files under repo_path's "audiolibro" subfolder, unlike
    `audiobookUrl` (a single external link the browser is handed directly).
    Both are optional and independent: a book can offer either, both, or
    neither. Listing chapters requires full ownership, same as download —
    there's no "audio preview" carve-out like the book's PDF."""

    chapters: list[AudiobookChapterRead]


class AudiobookChapterContentRead(BaseModel):
    name: str
    contentBase64: str
    mimeType: str
