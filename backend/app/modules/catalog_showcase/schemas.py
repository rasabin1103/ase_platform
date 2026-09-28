from __future__ import annotations

from pydantic import BaseModel

from app.models.enums import CatalogItemType


class CatalogShowcaseItemRead(BaseModel):
    """Deliberately a much smaller cut of the catalog than CatalogItemRead
    (see consumer_catalog/schemas.py) — this is served with no
    authentication at all, so it carries only what an anonymous visitor
    needs to get a sense of an item before signing up: no license/resource/
    download metadata, no per-user favorite/purchase state, and no price —
    pricing is only revealed once the visitor has an account (see
    CatalogShowcaseService docstring). `slug` is included for a stable React
    key, not as a link target — there is deliberately no public per-item
    detail page. `longDescription` is included (unlike the rest of the
    gated fields) specifically so the card's "show more" can expand into
    the full description without a detail page to link to."""

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
    averageRating: float | None = None
    reviewCount: int = 0


class CatalogShowcaseListResponse(BaseModel):
    items: list[CatalogShowcaseItemRead]
    limit: int
    offset: int
    total: int
