from __future__ import annotations

import base64
from collections.abc import Callable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.github_client import GithubContentError, get_file_content, list_directory
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
    ResourceContentRead,
    ReviewListResponse,
    ReviewRead,
)

# Viewer safety cap — plenty for a script/config file, keeps a huge
# accidental upload from blowing up the response or the browser tab.
_MAX_VIEWER_CHARS = 300_000

# Binary viewer safety cap (.docx/.xlsx) — base64 inflates this by ~33% on
# the wire, still well within reason for a single response; anything bigger
# should just be downloaded instead of previewed inline.
_MAX_BINARY_BYTES = 20 * 1024 * 1024

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
            titleEn=item.title_en,
            shortDescriptionEn=item.short_description_en,
            longDescriptionEn=item.long_description_en,
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
            # True only when the CURRENT user can actually view/download —
            # not just "does this item have a linked file". A free item
            # (price 0) is viewable by anyone without an explicit claim
            # first; a priced item still needs to be in purchased_slugs
            # (permanent purchase or live plan access). Keeps the frontend
            # from having to re-derive this itself from price + isPurchased.
            hasResourceContent=bool(
                item.repo_path
                and self._resolve_repo_url(item)
                and (self._is_free(item) or item.slug in purchased_slugs)
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
            # "My library" views: owned items, plus free items — a free item
            # needs no purchase to use (same rule as resource access and
            # reviews), so it belongs here too even though isPurchased stays
            # false for it (that flag reflects actual purchase history only).
            reads = [r for r in reads if r.isPurchased or r.price is None or r.price <= 0]
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
        counts too, not just direct purchases. A free item (price 0) needs
        no ownership at all, same as resource content/download and the
        free `purchase()` claim — everyone can already see and use it, so
        there's nothing to gate a review behind."""
        if is_super_admin(self.db, self._require_user(user_id)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin accounts do not review catalog items",
            )
        item = self._require_item(slug)
        if not self._is_free(item) and item.slug not in self.purchased_slugs(user_id):
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

    @staticmethod
    def _resolve_repo_url(item: CatalogItem) -> str | None:
        """An item's own repo_url wins if set (an item can still point at a
        different repo); otherwise falls back to the single shared
        ASE-Catalog repo configured once in settings, so the admin form
        only needs repo_path for the common case."""
        return item.repo_url or settings.GITHUB_CATALOG_REPO_URL

    @staticmethod
    def _is_free(item: CatalogItem) -> bool:
        return item.price is None or item.price <= 0

    def _require_resource_access(self, slug: str, *, user_id: int) -> CatalogItem:
        """Ownership gate — except a free item (price 0) needs no ownership
        at all, same as `purchase()` never blocking a free claim. Priced
        items still go through `purchased_slugs`, which already covers
        permanent purchases and live plan-based access (including the
        organization-membership check), so this is the one place that
        needs to know about it too, not a parallel check."""
        item = self._require_item(slug)
        if not item.repo_path or not self._resolve_repo_url(item):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This item has no linked file")
        if not self._is_free(item) and item.slug not in self.purchased_slugs(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must own this item (directly or via your plan) to access its content",
            )
        return item

    @staticmethod
    def _require_github_token() -> str:
        if not settings.GITHUB_ACCESS_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub integration is not configured on this server.",
            )
        return settings.GITHUB_ACCESS_TOKEN

    def _fetch_resource_bytes(self, item: CatalogItem, *, path: str) -> bytes:
        token = self._require_github_token()
        try:
            return get_file_content(repo_url=self._resolve_repo_url(item), path=path, token=token)
        except GithubContentError as exc:
            raise HTTPException(status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    def _list_resource_folder(self, item: CatalogItem) -> list[dict]:
        """repo_path is a folder containing a README.md (rendered by the
        in-platform viewer) and a packaged .zip (served by the download
        button) — this lists that folder so we can find each one's actual
        filename without the admin form needing to know it in advance."""
        token = self._require_github_token()
        try:
            return list_directory(repo_url=self._resolve_repo_url(item), path=item.repo_path, token=token)
        except GithubContentError as exc:
            raise HTTPException(status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    @staticmethod
    def _find_folder_entry(entries: list[dict], *, matcher: Callable[[str], bool], not_found_detail: str) -> dict:
        found = ConsumerCatalogService._find_folder_entry_optional(entries, matcher=matcher)
        if found is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=not_found_detail)
        return found

    @staticmethod
    def _find_folder_entry_optional(entries: list[dict], *, matcher: Callable[[str], bool]) -> dict | None:
        for entry in entries:
            if entry.get("type") == "file" and matcher(str(entry.get("name", ""))):
                return entry
        return None

    def get_resource_content(self, slug: str, *, user_id: int) -> ResourceContentRead:
        """Read-only in-platform viewer for the item's repo_path folder.
        Tries, in order: README.md (rendered as Markdown text), a .docx
        (rendered client-side with mammoth), a .xlsx/.xls (rendered
        client-side with SheetJS) — whichever the admin actually put in the
        folder. Text is decoded as UTF-8 (replacing invalid bytes) and
        truncated past a safety cap; binary files are base64-encoded up to
        a separate, larger cap, past which the caller should use the
        download button instead. The download endpoint always serves the
        exact original bytes regardless of what's previewable here."""
        item = self._require_resource_access(slug, user_id=user_id)
        entries = self._list_resource_folder(item)

        readme = self._find_folder_entry_optional(entries, matcher=lambda name: name.lower() == "readme.md")
        if readme is not None:
            raw = self._fetch_resource_bytes(item, path=readme["path"])
            text = raw.decode("utf-8", errors="replace")
            truncated = len(text) > _MAX_VIEWER_CHARS
            return ResourceContentRead(
                path=readme["path"], kind="markdown", content=text[:_MAX_VIEWER_CHARS], truncated=truncated
            )

        docx_entry = self._find_folder_entry_optional(entries, matcher=lambda name: name.lower().endswith(".docx"))
        if docx_entry is not None:
            return self._binary_resource_content(item, entry=docx_entry, kind="docx")

        xlsx_entry = self._find_folder_entry_optional(
            entries, matcher=lambda name: name.lower().endswith((".xlsx", ".xls"))
        )
        if xlsx_entry is not None:
            return self._binary_resource_content(item, entry=xlsx_entry, kind="xlsx")

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No viewable file (README.md, .docx or .xlsx) was found in this item's configured folder",
        )

    def _binary_resource_content(self, item: CatalogItem, *, entry: dict, kind: str) -> ResourceContentRead:
        raw = self._fetch_resource_bytes(item, path=entry["path"])
        if len(raw) > _MAX_BINARY_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="This file is too large to preview in the browser — use the download button instead",
            )
        return ResourceContentRead(
            path=entry["path"], kind=kind, contentBase64=base64.b64encode(raw).decode("ascii"), truncated=False
        )

    def get_resource_download(self, slug: str, *, user_id: int) -> tuple[bytes, str]:
        """Returns (raw file bytes, filename) for a Content-Disposition
        download. Prefers the packaged .zip inside the item's repo_path
        folder (the original script/resource-bundle convention); falls back
        to a standalone .docx or .xlsx/.xls when that's what the folder
        actually contains (document/spreadsheet resources with no zip) —
        same file the in-platform viewer just previewed. Served exactly as
        stored, no decoding/truncation."""
        item = self._require_resource_access(slug, user_id=user_id)
        entries = self._list_resource_folder(item)
        archive = (
            self._find_folder_entry_optional(entries, matcher=lambda name: name.lower().endswith(".zip"))
            or self._find_folder_entry_optional(entries, matcher=lambda name: name.lower().endswith(".docx"))
            or self._find_folder_entry_optional(entries, matcher=lambda name: name.lower().endswith((".xlsx", ".xls")))
        )
        if archive is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No downloadable file was found in this item's configured folder",
            )
        raw = self._fetch_resource_bytes(item, path=archive["path"])
        return raw, archive["name"]

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
