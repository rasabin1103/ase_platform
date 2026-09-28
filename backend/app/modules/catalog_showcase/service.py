from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.media_urls import catalog_cover_image_public_path, catalog_has_stored_image
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus, CatalogItemType
from app.modules.catalog_showcase.schemas import CatalogShowcaseItemRead, CatalogShowcaseListResponse
from app.modules.consumer_catalog.ratings_repository import CatalogItemRatingsRepository
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository

# Anonymous visitors only ever see fully published items — unlike the
# authenticated consumer catalog (CONSUMER_LIST_STATUSES in
# consumer_catalog/service.py), which also surfaces "coming_soon" and
# "request_only" to signed-in users who can act on those states. A visitor
# with no account can't request or wait-list anything yet, so showing those
# here would just be confusing teaser content with no next step attached.
SHOWCASE_LIST_STATUSES = (CatalogItemStatus.published,)


class CatalogShowcaseService:
    """Read-only, unauthenticated catalog browsing — the public "escaparate"
    a visitor sees before creating an account. Deliberately its own module
    rather than reusing consumer_catalog's router: every endpoint here must
    stay reachable with zero auth, so keeping it physically separate from
    the authenticated module makes that boundary obvious at a glance rather
    than relying on remembering which route has no Depends(get_current_user).
    Also kept separate from `public_catalog` (marketing/stats endpoints under
    /api/v1/public — pricing plans, team, testimonials, case studies) so the
    two never collide on module name or route prefix.

    Price is deliberately never included in `CatalogShowcaseItemRead` — an
    anonymous visitor sees what an item is and what it's about, but has to
    create an account before pricing is revealed (see consumer_catalog for
    the authenticated item shape, which does include it)."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ConsumerCatalogRepository(db)
        self.ratings = CatalogItemRatingsRepository(db)

    def _resolve_public_image_url(self, item: CatalogItem) -> str:
        """Unlike the authenticated consumer catalog (resolve_catalog_cover_url
        in media_urls.py), an anonymous visitor has no bearer token, so we
        can't point at the auth-gated /media/catalog/{id}/image or gallery
        endpoints. Reuse the same unauthenticated cover path built for Stripe
        (see public_catalog/router.py's /catalog-cover/{item_id}) — served by
        the now-restored public_catalog module, no auth required either way.
        Falls back to the legacy external image_url, or an empty string if
        the item genuinely has no image at all."""
        if catalog_has_stored_image(item):
            return catalog_cover_image_public_path(item.id)
        return item.image_url or ""

    def _to_read(self, item: CatalogItem, *, review_summary: tuple[float, int] | None) -> CatalogShowcaseItemRead:
        return CatalogShowcaseItemRead(
            slug=item.slug,
            title=item.title,
            titleEn=item.title_en,
            shortDescription=item.short_description,
            shortDescriptionEn=item.short_description_en,
            longDescription=item.long_description,
            longDescriptionEn=item.long_description_en,
            imageUrl=self._resolve_public_image_url(item),
            type=item.type,
            category=item.category,
            tags=item.tags_json or [],
            averageRating=review_summary[0] if review_summary else None,
            reviewCount=review_summary[1] if review_summary else 0,
        )

    def list_items(
        self,
        *,
        limit: int,
        offset: int,
        type_filter: CatalogItemType | None,
        category: str | None,
        search: str | None,
        sort: str | None,
        tags: list[str] | None,
    ) -> CatalogShowcaseListResponse:
        items, total = self.repo.list_for_consumer(
            limit=limit,
            offset=offset,
            type_filter=type_filter,
            category=category,
            search=search,
            statuses=SHOWCASE_LIST_STATUSES,
            sort=sort,
            tags=tags,
        )
        summaries = self.ratings.review_summaries_for_items(catalog_item_ids=[i.id for i in items])
        reads = [self._to_read(i, review_summary=summaries.get(i.id)) for i in items]
        return CatalogShowcaseListResponse(items=reads, limit=limit, offset=offset, total=total)

    def list_tags(self) -> list[str]:
        return self.repo.distinct_tags(statuses=SHOWCASE_LIST_STATUSES)

    def list_categories(self) -> list[str]:
        return self.repo.distinct_categories(statuses=SHOWCASE_LIST_STATUSES)
