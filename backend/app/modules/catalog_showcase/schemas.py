from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import CatalogItemLevel, CatalogItemType


class CatalogShowcaseItemRead(BaseModel):
    """A public, unauthenticated cut of the catalog — everything a visitor
    needs to evaluate an offer before creating an account: title,
    descriptions, image, category/tags, rating, and price. Deliberately
    still smaller than the authenticated CatalogItemRead (see
    consumer_catalog/schemas.py): no per-user favorite/purchase state, no
    license/resource-content metadata. `slug` (together with `type`) is the
    link target for this item's own public page — see
    CatalogShowcaseItemDetail / GET /api/v1/catalog-showcase/{type}/{slug}."""

    slug: str
    title: str
    titleEn: str | None = None
    shortDescription: str
    shortDescriptionEn: str | None = None
    longDescription: str
    longDescriptionEn: str | None = None
    imageUrl: str
    type: CatalogItemType
    category: str
    tags: list[str] = []
    price: Decimal
    currency: str
    # An optional external link the admin can attach — no longer what
    # drives the "Preview" button (see hasPreview below), kept only in case
    # something else reads it later.
    previewUrl: str | None = None
    # Whether the repo-backed sample (a book's "preview" subfolder, or
    # another item's preview*.pdf / README.md) actually exists — the
    # "Preview" button only renders when this is true, on the card and on
    # the detail page alike, so a visitor is never shown a button that
    # 404s. Cheap check on the list (repo configured or not); confirmed for
    # real (folder actually has something) on the single-item detail page —
    # see CatalogShowcaseService.
    hasPreview: bool = False
    averageRating: float | None = None
    reviewCount: int = 0


class CatalogShowcaseListResponse(BaseModel):
    items: list[CatalogShowcaseItemRead]
    limit: int
    offset: int
    total: int


class CatalogShowcaseItemDetail(CatalogShowcaseItemRead):
    """The public per-item page (linked from LinkedIn, Google, campaigns —
    see catalog_showcase/router.py) — everything on the list card plus the
    extra context that actually helps someone decide before signing up:
    level/duration/author, a free preview link when the admin set one, and
    the benefits/requirements/what's-included bullets. Still no
    license/resource-content/download internals and no per-user state —
    those stay behind auth same as the authenticated detail page."""

    level: CatalogItemLevel
    duration: str | None = None
    author: str
    audiobookUrl: str | None = None
    benefits: list[str] = []
    requirements: list[str] = []
    includedItems: list[str] = []
    # ASE Academy simulator course key — lets the public page offer the
    # free demo mission before signing up.
    academyCourseKey: str | None = None
