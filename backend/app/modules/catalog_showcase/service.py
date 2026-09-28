from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.media_urls import catalog_cover_image_public_path, catalog_has_stored_image
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus, CatalogItemType
from app.modules.catalog_showcase.schemas import (
    CatalogShowcaseItemDetail,
    CatalogShowcaseItemRead,
    CatalogShowcaseListResponse,
)
from app.modules.consumer_catalog.ratings_repository import CatalogItemRatingsRepository
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository
from app.modules.consumer_catalog.schemas import ResourceContentRead
from app.modules.consumer_catalog.service import ConsumerCatalogService

# Anonymous visitors only ever see fully published items — unlike the
# authenticated consumer catalog (CONSUMER_LIST_STATUSES in
# consumer_catalog/service.py), which also surfaces "coming_soon" and
# "request_only" to signed-in users who can act on those states. A visitor
# with no account can't request or wait-list anything yet, so showing those
# here would just be confusing teaser content with no next step attached.
SHOWCASE_LIST_STATUSES = (CatalogItemStatus.published,)


class CatalogShowcaseService:
    """Read-only, unauthenticated catalog browsing — the public "escaparate"
    a visitor sees before creating an account, including price. Deliberately
    its own module rather than reusing consumer_catalog's router: every
    endpoint here must stay reachable with zero auth, so keeping it
    physically separate from the authenticated module makes that boundary
    obvious at a glance rather than relying on remembering which route has
    no Depends(get_current_user). Also kept separate from `public_catalog`
    (marketing/stats endpoints under /api/v1/public — pricing plans, team,
    testimonials, case studies) so the two never collide on module name or
    route prefix.

    Price IS included here on purpose (unlike an earlier version of this
    module) — showing it up front lets a visitor evaluate the offer before
    deciding whether creating an account is even worth it, rather than
    forcing a signup just to see a number. Per-user state (favorites,
    purchase status, reviews written) stays out regardless, since none of
    that exists yet for someone with no account."""

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
        the restored public_catalog module, no auth required either way.
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
            price=item.price,
            currency=item.currency,
            previewUrl=item.preview_url,
            # Cheap flag only — proves repo_path + a resolvable repo are
            # configured, not that the folder actually has a sample file in
            # it. Good enough for a list of cards; the single-item page
            # confirms for real (see get_item below), same two-tier
            # approach as consumer_catalog's hasResourceContent.
            hasPreview=bool(item.repo_path and ConsumerCatalogService._resolve_repo_url(item)),
            averageRating=review_summary[0] if review_summary else None,
            reviewCount=review_summary[1] if review_summary else 0,
        )

    def _to_detail(self, item: CatalogItem, *, review_summary: tuple[float, int] | None) -> CatalogShowcaseItemDetail:
        base = self._to_read(item, review_summary=review_summary)
        return CatalogShowcaseItemDetail(
            **base.model_dump(),
            level=item.level,
            duration=item.duration,
            author=item.author,
            audiobookUrl=item.audiobook_url,
            benefits=item.benefits_json or [],
            requirements=item.requirements_json or [],
            includedItems=item.included_items_json or [],
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

    def get_item(self, item_type: CatalogItemType, slug: str) -> CatalogShowcaseItemDetail | None:
        """The public per-item page's data — matched on (type, slug) rather
        than slug alone so a stale/guessed URL with the wrong type 404s
        instead of silently rendering a different item. Only a published
        item is servable, same rule as the list endpoint (see
        SHOWCASE_LIST_STATUSES) and as public_catalog's cover-image
        endpoint — nothing here ever exposes a draft/coming-soon item's
        detail to an anonymous visitor."""
        item = self.db.execute(
            select(CatalogItem).where(
                CatalogItem.slug == slug,
                CatalogItem.type == item_type,
                CatalogItem.status.in_(SHOWCASE_LIST_STATUSES),
            )
        ).scalar_one_or_none()
        if item is None:
            return None
        summaries = self.ratings.review_summaries_for_items(catalog_item_ids=[item.id])
        detail = self._to_detail(item, review_summary=summaries.get(item.id))
        # hasPreview from _to_read only proves repo_path + a resolvable repo
        # are configured, not that the folder actually has a sample file in
        # it (an admin could type a repo_path and never upload anything) —
        # confirm it for real here, single-item page only, same reasoning
        # as consumer_catalog's own hasResourceContent/_resource_content_exists.
        if detail.hasPreview and not ConsumerCatalogService(self.db).has_public_preview(item):
            detail = detail.model_copy(update={"hasPreview": False})
        return detail

    def get_preview_content(self, item_type: CatalogItemType, slug: str) -> ResourceContentRead | None:
        """The actual "muestra" file — a book's repo "preview" subfolder, or
        another item's README.md — for a fully anonymous visitor, no
        account needed. This is NOT the `previewUrl` external-link field on
        CatalogShowcaseItemRead (that's an optional admin-supplied link);
        this reads the same GitHub-repo content the authenticated resource
        viewer uses, via ConsumerCatalogService.get_public_preview_content,
        which never checks ownership and always takes the safe
        "non-owner preview" path. Re-validates (type, slug, published) with
        the exact same query as get_item so this never leaks a
        draft/coming-soon item's content just because its slug is known."""
        item = self.db.execute(
            select(CatalogItem).where(
                CatalogItem.slug == slug,
                CatalogItem.type == item_type,
                CatalogItem.status.in_(SHOWCASE_LIST_STATUSES),
            )
        ).scalar_one_or_none()
        if item is None:
            return None
        return ConsumerCatalogService(self.db).get_public_preview_content(item)
