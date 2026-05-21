from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus, CatalogItemType
from app.modules.catalog.catalog_read_fields import catalog_media_fields
from app.modules.consumer_catalog.favorites_repository import CatalogFavoritesRepository
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository
from app.modules.consumer_catalog.schemas import CatalogItemListResponse, CatalogItemRead, CatalogItemSummaryRead
from app.modules.pricing.service import PricingPlansService

CONSUMER_LIST_STATUSES = (CatalogItemStatus.published, CatalogItemStatus.coming_soon, CatalogItemStatus.request_only)
CONSUMER_DETAIL_STATUSES = CONSUMER_LIST_STATUSES


class ConsumerCatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ConsumerCatalogRepository(db)
        self.favorites = CatalogFavoritesRepository(db)
        self.purchases = CatalogPurchasesRepository(db)

    def favorite_slugs(self, user_id: int) -> set[str]:
        return self.favorites.slugs_for_user(user_id)

    def purchased_slugs(self, user_id: int) -> set[str]:
        return self.purchases.slugs_for_user(user_id)

    def _to_read(
        self,
        item: CatalogItem,
        *,
        favorite_slugs: set[str],
        purchased_slugs: set[str],
        include_pricing: bool = False,
        related: list[CatalogItem] | None = None,
    ) -> CatalogItemRead:
        pricing_plans = []
        if include_pricing:
            pricing_plans = PricingPlansService(self.db).list_active_for_item(item.id)
        media = catalog_media_fields(item)
        related_reads = []
        if related is not None:
            for r in related:
                rm = catalog_media_fields(r)
                related_reads.append(
                    CatalogItemSummaryRead(
                        id=str(r.uuid),
                        title=r.title,
                        slug=r.slug,
                        type=r.type,
                        shortDescription=r.short_description,
                        imageUrl=rm["display_image_url"],
                        author=r.author,
                    )
                )
        return CatalogItemRead(
            id=str(item.uuid),
            uuid=item.uuid,
            title=item.title,
            slug=item.slug,
            type=item.type,
            category=item.category,
            shortDescription=item.short_description,
            longDescription=item.long_description,
            imageUrl=media["display_image_url"],
            price=item.price,
            currency=item.currency,
            status=item.status,
            level=item.level,
            duration=item.duration,
            author=item.author,
            previewUrl=item.preview_url,
            benefits=item.benefits_json or [],
            requirements=item.requirements_json or [],
            includedItems=item.included_items_json or [],
            isFavorite=item.slug in favorite_slugs,
            isPurchased=item.slug in purchased_slugs,
            pricingPlans=pricing_plans,
            coverImageUrl=item.cover_image_url,
            thumbnailUrl=item.thumbnail_url,
            amazonUrl=item.amazon_url,
            externalPurchaseUrl=item.external_purchase_url,
            purchaseProvider=media["purchase_provider"],
            pdfUrl=item.pdf_url,
            previewPdfUrl=item.preview_pdf_url,
            previewPages=item.preview_pages,
            sampleDownloadUrl=item.sample_download_url,
            richContentMarkdown=item.rich_content_markdown,
            bookFormat=item.book_format,
            audience=item.audience_json or [],
            relatedItems=related_reads,
            createdAt=item.created_at,
            updatedAt=item.updated_at,
        )

    def list_items(
        self,
        *,
        user_id: int,
        limit: int,
        offset: int,
        type_filter: CatalogItemType | None,
        category: str | None,
        search: str | None,
        favorites_only: bool = False,
        purchased_only: bool = False,
    ) -> CatalogItemListResponse:
        fav = self.favorite_slugs(user_id)
        pur = self.purchased_slugs(user_id)
        items, total = self.repo.list_for_consumer(
            limit=limit,
            offset=offset,
            type_filter=type_filter,
            category=category,
            search=search,
            statuses=CONSUMER_LIST_STATUSES,
        )
        reads = [self._to_read(i, favorite_slugs=fav, purchased_slugs=pur) for i in items]
        if favorites_only:
            reads = [r for r in reads if r.isFavorite]
            total = len(reads)
        if purchased_only:
            reads = [r for r in reads if r.isPurchased]
            total = len(reads)
        return CatalogItemListResponse(items=reads, limit=limit, offset=offset, total=total)

    def get_by_slug(self, slug: str, *, user_id: int, allow_preview: bool = False) -> CatalogItemRead:
        item = self.repo.get_by_slug(slug)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        if not allow_preview and item.status not in CONSUMER_DETAIL_STATUSES:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        related = self.repo.list_related_published(item.type, exclude_slug=slug, limit=4)
        return self._to_read(
            item,
            favorite_slugs=self.favorite_slugs(user_id),
            purchased_slugs=self.purchased_slugs(user_id),
            include_pricing=True,
            related=related,
        )

    def toggle_favorite(self, slug: str, *, user_id: int) -> CatalogItemRead:
        item = self._require_item(slug)
        self.favorites.toggle(user_id, item.id)
        self.db.commit()
        return self.get_by_slug(slug, user_id=user_id)

    def purchase(self, slug: str, *, user_id: int) -> CatalogItemRead:
        item = self._require_item(slug)
        if item.status == CatalogItemStatus.request_only:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This item requires an access request instead of direct purchase",
            )
        if item.status == CatalogItemStatus.coming_soon:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item is not available for purchase yet")
        self.purchases.add(user_id, item.id)
        self.db.commit()
        return self.get_by_slug(slug, user_id=user_id)

    def _require_item(self, slug: str) -> CatalogItem:
        item = self.repo.get_by_slug(slug)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return item
