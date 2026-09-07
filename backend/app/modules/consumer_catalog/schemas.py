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
    # Loose series grouping (see CatalogItem.series_name/series_order) —
    # null means this item isn't part of a series. When set, the frontend
    # can call GET .../series for the full progress/recommendation view
    # (see SeriesProgressRead below).
    seriesName: str | None = None
    seriesOrder: int | None = None
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
    # --- Version & changelog — populated only for type="resource" items
    # that have a current_version set (see CatalogItem docstring); null/[]
    # for every other item.
    currentVersion: str | None = None
    versionUpdatedAt: datetime | None = None
    changelog: list[str] = []
    compatibility: list[str] = []
    # When the current user has acquired this item, the timestamp of their
    # earliest purchase row (see CatalogPurchasesRepository.purchased_at_by_slug) —
    # "fecha de adquisición" on the resource detail page. Null if not
    # purchased (or free/never explicitly acquired).
    purchasedAt: datetime | None = None
    # True when versionUpdatedAt is newer than the user's own purchasedAt —
    # "hay una nueva versión disponible desde que la adquiriste". Always
    # false when either date is missing.
    hasNewVersion: bool = False
    # --- License disclosure, shown before purchase ------------------------
    licenseScope: list[str] = []
    licenseRedistribution: str | None = None
    licenseUpdatesIncluded: bool = False
    licenseSupportIncluded: bool = False
    # Null means "use the platform's standard digital-content refund
    # clause" — the frontend falls back to that copy rather than claiming a
    # per-item policy that was never actually set.
    licenseRefundPolicy: str | None = None
    # Admin-written setup/usage instructions — resource type only (see
    # CatalogItem.getting_started), null for every other item.
    gettingStarted: str | None = None
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


class ResourceDownloadInfoRead(BaseModel):
    """What's actually inside the downloadable package — shown before
    purchase so "what am I buying" doesn't stay a mystery until after
    checkout. Metadata only (file names/sizes via the GitHub Contents API),
    never file bytes, so — like BookDownloadFormatsRead — this never
    requires ownership. `available` is False only when the item has no
    linked repo_path/repo_url at all; a configured-but-empty folder still
    returns available=True with fileCount=0 rather than 404ing, since that's
    an admin-visible data problem, not something to hide from a shopper."""

    available: bool = True
    fileCount: int = 0
    totalSizeBytes: int = 0
    formats: list[str] = []


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


class MyPurchaseRead(BaseModel):
    """One row of "Mis compras" — a real CatalogPurchase transaction, not
    just "do I own this" (see CatalogItemRead.isPurchased, which is what
    the catalog/library views use instead). Deliberately separate from the
    library: this is about the purchase record itself (when, how, what it
    cost), the library is about the content you can open."""

    item: CatalogItemRead
    purchased_at: datetime
    # "free" | "stripe_checkout" | "plan_entitlement" | "admin_grant" — see
    # CatalogPurchase.source. The frontend maps this to a human label.
    source: str
    organization_name: str | None = None
    # Whether GET .../detail can pull live Stripe data for this row (only
    # true for source == "stripe_checkout" with a stored session id).
    has_payment_detail: bool = False


class MyPurchaseListResponse(BaseModel):
    items: list[MyPurchaseRead]


class MyPurchaseDetailRead(BaseModel):
    """Lazily-fetched detail for one purchase — kept separate from
    MyPurchaseRead so listing purchases never has to wait on a live Stripe
    API round trip; only fetched when the buyer actually opens "más
    información" for that item (see ConsumerCatalogService.get_purchase_detail)."""

    amount_paid: Decimal | None = None
    currency: str | None = None
    discount_amount: Decimal | None = None
    payment_status: str | None = None
    receipt_url: str | None = None
    # Repo-testable products only: the specific approved git ref this buyer
    # is allowed to run, if any (see TestApprovedRef) — otherwise "standard"
    # (there is no other versioning concept for non-testable items today).
    acquired_version: str = "standard"


class SeriesItemRead(BaseModel):
    """One entry in a series' ordered item list — deliberately lighter than
    the full CatalogItemRead (this is a compact rail/list, not a catalog
    grid), see SeriesProgressRead."""

    slug: str
    type: CatalogItemType
    title: str
    titleEn: str | None = None
    imageUrl: str
    seriesOrder: int | None = None
    isPurchased: bool = False


class SeriesProgressRead(BaseModel):
    """Powers the "you're N/M through this series" panel + "up next"
    recommendation on an item's detail page (see
    ConsumerCatalogService.get_series_progress). `nextItem` is the
    lowest-order item in the series the buyer doesn't yet own — null once
    every item is owned, or if the series has only one item."""

    seriesName: str
    items: list[SeriesItemRead]
    ownedCount: int
    totalCount: int
    nextItem: SeriesItemRead | None = None
