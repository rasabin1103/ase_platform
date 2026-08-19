from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.media_urls import resolve_catalog_cover_url, resolve_catalog_gallery
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus, CatalogItemType
from app.modules.auth.dependencies import is_super_admin
from app.modules.consumer_catalog.favorites_repository import CatalogFavoritesRepository
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.consumer_catalog.ratings_repository import IMPACT_TAGS, CatalogItemRatingsRepository, RatingSummary
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository
from app.modules.consumer_catalog.schemas import (
    CatalogItemImagePublicRead,
    CatalogItemListResponse,
    CatalogItemRead,
    MyRatingRead,
    MyReviewRead,
    ReviewListResponse,
    ReviewRead,
)

CONSUMER_LIST_STATUSES = (CatalogItemStatus.published, CatalogItemStatus.coming_soon, CatalogItemStatus.request_only)
CONSUMER_DETAIL_STATUSES = CONSUMER_LIST_STATUSES


class ConsumerCatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ConsumerCatalogRepository(db)
        self.favorites = CatalogFavoritesRepository(db)
        self.purchases = CatalogPurchasesRepository(db)
        self.ratings = CatalogItemRatingsRepository(db)

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
        rating_summaries: dict[int, RatingSummary] | None = None,
        my_ratings: dict[int, object] | None = None,
        review_summaries: dict[int, tuple[float, int]] | None = None,
    ) -> CatalogItemRead:
        summary = (rating_summaries or {}).get(item.id)
        my_rating = (my_ratings or {}).get(item.id)
        review_summary = (review_summaries or {}).get(item.id)
        return CatalogItemRead(
            id=str(item.uuid),
            uuid=item.uuid,
            title=item.title,
            slug=item.slug,
            type=item.type,
            category=item.category,
            shortDescription=item.short_description,
            longDescription=item.long_description,
            imageUrl=resolve_catalog_cover_url(item),
            images=[CatalogItemImagePublicRead(url=g["url"], isCover=g["isCover"]) for g in resolve_catalog_gallery(item)],
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
            tags=item.tags_json or [],
            isFavorite=item.slug in favorite_slugs,
            isPurchased=item.slug in purchased_slugs,
            upvotes=summary.upvotes if summary else 0,
            downvotes=summary.downvotes if summary else 0,
            netScore=summary.net_score if summary else 0,
            topTags=summary.top_tags if summary else [],
            myRating=(
                MyRatingRead(isPositive=my_rating.is_positive, tags=my_rating.tags_json or [])
                if my_rating and my_rating.is_positive is not None
                else None
            ),
            averageRating=review_summary[0] if review_summary else None,
            reviewCount=review_summary[1] if review_summary else 0,
            myReview=(
                MyReviewRead(rating=my_rating.rating, comment=my_rating.comment)
                if my_rating and my_rating.rating is not None
                else None
            ),
            createdAt=item.created_at,
            updatedAt=item.updated_at,
        )

    def _to_reads_with_ratings(
        self,
        items: list[CatalogItem],
        *,
        user_id: int,
        favorite_slugs: set[str],
        purchased_slugs: set[str],
    ) -> list[CatalogItemRead]:
        item_ids = [i.id for i in items]
        summaries = self.ratings.summaries_for_items(catalog_item_ids=item_ids)
        my_ratings = self.ratings.my_ratings_for_items(user_id=user_id, catalog_item_ids=item_ids)
        review_summaries = self.ratings.review_summaries_for_items(catalog_item_ids=item_ids)
        return [
            self._to_read(
                i,
                favorite_slugs=favorite_slugs,
                purchased_slugs=purchased_slugs,
                rating_summaries=summaries,
                my_ratings=my_ratings,
                review_summaries=review_summaries,
            )
            for i in items
        ]

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
        sort: str | None = None,
        tags: list[str] | None = None,
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
            sort=sort,
            tags=tags,
        )
        reads = self._to_reads_with_ratings(items, user_id=user_id, favorite_slugs=fav, purchased_slugs=pur)
        if favorites_only:
            reads = [r for r in reads if r.isFavorite]
            total = len(reads)
        if purchased_only:
            reads = [r for r in reads if r.isPurchased]
            total = len(reads)
        return CatalogItemListResponse(items=reads, limit=limit, offset=offset, total=total)

    def list_tags(self) -> list[str]:
        return self.repo.distinct_tags(statuses=CONSUMER_LIST_STATUSES)

    def get_by_slug(self, slug: str, *, user_id: int) -> CatalogItemRead:
        item = self.repo.get_by_slug(slug)
        if item is None or item.status not in CONSUMER_DETAIL_STATUSES:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        reads = self._to_reads_with_ratings(
            [item],
            user_id=user_id,
            favorite_slugs=self.favorite_slugs(user_id),
            purchased_slugs=self.purchased_slugs(user_id),
        )
        return reads[0]

    def toggle_favorite(self, slug: str, *, user_id: int) -> CatalogItemRead:
        item = self._require_item(slug)
        self.favorites.toggle(user_id, item.id)
        self.db.commit()
        return self.get_by_slug(slug, user_id=user_id)

    def purchase(self, slug: str, *, user_id: int) -> CatalogItemRead:
        """Grants free access. Only valid for items with no price — anything
        with `price > 0` must go through Stripe Checkout instead (see
        BillingService.create_catalog_checkout_session), which is the only
        path that actually charges the card and grants access via the
        checkout.session.completed webhook. This split is what prevents a
        user from getting a priced item for free by hitting this endpoint
        directly."""
        item = self._require_item(slug)
        if item.status == CatalogItemStatus.request_only:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This item requires an access request instead of direct purchase",
            )
        if item.status == CatalogItemStatus.coming_soon:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item is not available for purchase yet")
        if item.price is not None and item.price > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This item has a price and must be purchased via Stripe Checkout, not granted directly.",
            )
        self.purchases.add(user_id, item.id, source="free")
        self.db.commit()
        return self.get_by_slug(slug, user_id=user_id)

    def rate(self, slug: str, *, user_id: int, is_positive: bool, tags: list[str]) -> CatalogItemRead:
        if is_super_admin(self.db, self._require_user(user_id)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin accounts do not rate catalog items",
            )
        item = self._require_item(slug)
        clean_tags = [t for t in dict.fromkeys(tags) if t in IMPACT_TAGS][:3]
        self.ratings.upsert(user_id=user_id, catalog_item_id=item.id, is_positive=is_positive, tags=clean_tags)
        self.db.commit()
        return self.get_by_slug(slug, user_id=user_id)

    def remove_rating(self, slug: str, *, user_id: int) -> CatalogItemRead:
        item = self._require_item(slug)
        self.ratings.remove(user_id=user_id, catalog_item_id=item.id)
        self.db.commit()
        return self.get_by_slug(slug, user_id=user_id)

    def submit_review(self, slug: str, *, user_id: int, rating: int, comment: str | None) -> CatalogItemRead:
        """Star review (1-5 + optional comment). Gated to users who actually
        own the item — same ownership check as billing's catalog checkout
        entitlement, read via `purchased_slugs` so plan-granted access
        counts too, not just direct purchases."""
        if is_super_admin(self.db, self._require_user(user_id)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin accounts do not review catalog items",
            )
        item = self._require_item(slug)
        if item.slug not in self.purchased_slugs(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must own this item before leaving a review",
            )
        clean_comment = comment.strip() if comment and comment.strip() else None
        self.ratings.upsert_review(user_id=user_id, catalog_item_id=item.id, rating=rating, comment=clean_comment)
        self.db.commit()
        return self.get_by_slug(slug, user_id=user_id)

    def remove_review(self, slug: str, *, user_id: int) -> CatalogItemRead:
        item = self._require_item(slug)
        self.ratings.remove_review(user_id=user_id, catalog_item_id=item.id)
        self.db.commit()
        return self.get_by_slug(slug, user_id=user_id)

    def list_reviews(self, slug: str, *, limit: int, offset: int) -> ReviewListResponse:
        """Public, newest-first page of everyone's reviews for one item —
        no ownership check here, reading reviews (unlike writing one) isn't
        gated to purchasers."""
        item = self._require_item(slug)
        rows = self.ratings.reviews_for_item(catalog_item_id=item.id, limit=limit, offset=offset)
        avg, count = self.ratings.review_summaries_for_items(catalog_item_ids=[item.id]).get(item.id, (None, 0))
        reviews = [
            ReviewRead(
                userDisplayName=(
                    display_name or " ".join(p for p in (first, last) if p).strip() or "Usuario ASE"
                ),
                rating=rating_row.rating,
                comment=rating_row.comment,
                createdAt=rating_row.created_at,
            )
            for rating_row, display_name, first, last in rows
        ]
        return ReviewListResponse(items=reviews, averageRating=avg, reviewCount=count, limit=limit, offset=offset)

    def _require_item(self, slug: str) -> CatalogItem:
        item = self.repo.get_by_slug(slug)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return item

    def _require_user(self, user_id: int):
        from app.models.user import User

        user = self.db.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user
