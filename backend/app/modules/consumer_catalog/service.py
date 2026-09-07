from __future__ import annotations

import base64
import io
import logging
import zipfile
from collections.abc import Callable
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.github_client import GithubContentError, get_file_content, list_directory
from app.core.media_urls import resolve_catalog_cover_url, resolve_catalog_gallery
from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import CatalogItemStatus, CatalogItemType
from app.models.organization import Organization
from app.models.resource_view import ResourceView
from app.models.test_approved_ref import TestApprovedRef
from app.models.user_preferences_profile import UserPreferencesProfile
from app.modules.auth.dependencies import is_super_admin
from app.modules.consumer_catalog.favorites_repository import CatalogFavoritesRepository
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.consumer_catalog.ratings_repository import IMPACT_TAGS, CatalogItemRatingsRepository, RatingSummary
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository
from app.modules.consumer_catalog.schemas import (
    AudiobookChapterContentRead,
    AudiobookChapterListRead,
    AudiobookChapterRead,
    BookDownloadFormatsRead,
    CatalogItemImagePublicRead,
    CatalogItemListResponse,
    CatalogItemRead,
    MyPurchaseDetailRead,
    MyPurchaseListResponse,
    MyPurchaseRead,
    MyRatingRead,
    MyReviewRead,
    ResourceContentRead,
    ResourceDownloadInfoRead,
    ReviewListResponse,
    ReviewRead,
    SeriesItemRead,
    SeriesProgressRead,
)

logger = logging.getLogger(__name__)

# Viewer safety cap — plenty for a script/config file, keeps a huge
# accidental upload from blowing up the response or the browser tab.
_MAX_VIEWER_CHARS = 300_000

# Binary viewer safety cap (.docx/.xlsx) — base64 inflates this by ~33% on
# the wire, still well within reason for a single response; anything bigger
# should just be downloaded instead of previewed inline.
_MAX_BINARY_BYTES = 20 * 1024 * 1024

# Audiobook chapters are their own, more generous cap: splitting a book into
# per-chapter files (rather than one giant audiobook_url-hosted file) is
# exactly what lets them live in this platform's GitHub-backed storage in
# the first place, but a single chapter can still run tens of MB at a
# normal spoken-word bitrate.
_MAX_AUDIO_BYTES = 80 * 1024 * 1024

# Audio extensions recognized inside a book's "audiolibro" subfolder, with
# the MIME type the browser's <audio> element needs to play each back.
_AUDIO_MIME_TYPES: dict[str, str] = {
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".m4b": "audio/mp4",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg",
    ".oga": "audio/ogg",
    ".wav": "audio/wav",
    ".flac": "audio/flac",
}


def _looks_like_audio(name: str) -> bool:
    lower = name.lower()
    return lower.endswith(tuple(_AUDIO_MIME_TYPES))


def _audio_mime_for(name: str) -> str:
    lower = name.lower()
    for ext, mime in _AUDIO_MIME_TYPES.items():
        if lower.endswith(ext):
            return mime
    return "application/octet-stream"

# Extensions previewed as syntax-highlighted text (kind="code") when a
# resource folder has none of README.md/.docx/.xlsx — the original scripts
# (.py, .sh, .js, ...) and config/data files admins actually drop in a
# resource folder. Deliberately an allow-list rather than "any leftover
# file": an unrecognized binary (image, pdf, archive) should fall through to
# the 404 below and be fetched via the Download button instead of being
# decoded as garbled text.
_CODE_EXTENSIONS = (
    ".py", ".ipynb", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd",
    ".rb", ".go", ".java", ".kt", ".php", ".c", ".h", ".cpp", ".hpp", ".cs", ".rs", ".swift", ".r", ".pl", ".lua", ".scala",
    ".sql", ".graphql", ".proto",
    ".yaml", ".yml", ".json", ".jsonc", ".toml", ".ini", ".cfg", ".conf", ".env", ".env.example",
    ".txt", ".css", ".scss", ".html", ".xml", ".dockerfile", ".gitignore", ".editorconfig",
)

# Extensionless filenames that are still plainly code/config, matched
# case-insensitively against the full filename (not a suffix).
_CODE_EXACT_NAMES = ("dockerfile", "makefile", "procfile", "gemfile", "rakefile")


def _looks_like_code(name: str) -> bool:
    lower = name.lower()
    return lower in _CODE_EXACT_NAMES or lower.endswith(_CODE_EXTENSIONS)


# A PDF whose name starts with "preview" (preview.pdf, preview_sample.pdf,
# ...) is the free sample a non-owner is allowed to see — the real book
# stays a plain .pdf with any other name. Same folder, two files, picked
# apart by this one naming convention rather than a separate DB column, so
# the admin just uploads two PDFs the same way they already upload
# README.md/.docx/.xlsx.
def _looks_like_preview_pdf(name: str) -> bool:
    lower = name.lower()
    return lower.endswith(".pdf") and lower.startswith("preview")


def _looks_like_full_pdf(name: str) -> bool:
    lower = name.lower()
    return lower.endswith(".pdf") and not lower.startswith("preview")


# Book download formats — the admin uploads whichever of these they have
# for a title; each maps to the matcher used to find it in the folder.
# "kindle" accepts any of the common Kindle ebook extensions since there's
# no single standard one (KDP itself outputs different formats depending on
# the book type), whichever the admin actually uploaded wins.
_DOWNLOAD_FORMAT_MATCHERS: dict[str, Callable[[str], bool]] = {
    "pdf": _looks_like_full_pdf,
    "epub": lambda name: name.lower().endswith(".epub"),
    "kindle": lambda name: name.lower().endswith((".mobi", ".azw3", ".azw", ".kpf")),
    "zip": lambda name: name.lower().endswith(".zip"),
}

# The per-format subfolder inside a book's repo_path is normally named
# after the format key itself (e.g. "epub", "zip") — but "kindle" as a
# folder name reads oddly to an admin uploading a .kpf file, so "kpf" is
# accepted as an alternate subfolder name for that one format. Tried in
# order; the first one that actually exists (and isn't empty) wins.
_FORMAT_SUBFOLDER_ALIASES: dict[str, tuple[str, ...]] = {
    "kindle": ("kindle", "kpf"),
}

CONSUMER_LIST_STATUSES = (CatalogItemStatus.published, CatalogItemStatus.coming_soon, CatalogItemStatus.request_only)
CONSUMER_DETAIL_STATUSES = CONSUMER_LIST_STATUSES

# --- Recommendation scoring keyword tables ------------------------------
# get_recommendations() below combines the pre-existing "same type as
# something you already own" heuristic with the user's optional preferences
# profile (see app/modules/user_preferences/). Every profile answer comes
# from a small fixed vocabulary (see user_preferences/schemas.py) rather
# than free text specifically so it can be matched here with plain
# substring search against each item's tags_json/category/title — no
# NLP/fuzzy matching, same "simple, explainable heuristic over real data"
# spirit as the strip's original docstring.
_TECHNOLOGY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "selenium": ("selenium",),
    "cypress": ("cypress",),
    "playwright": ("playwright",),
    "appium": ("appium",),
    "postman_api": ("postman", "api"),
    "jmeter_performance": ("jmeter", "performance", "rendimiento", "carga"),
    "python": ("python",),
    "java": ("java",),
    "javascript_typescript": ("javascript", "typescript", " js", " ts"),
    "jira": ("jira",),
}
_IMPROVEMENT_GOAL_KEYWORDS: dict[str, tuple[str, ...]] = {
    "test_automation": ("automat", "selenium", "cypress", "playwright", "appium"),
    "qa_strategy_process": ("estrategia", "strategy", "proceso", "process", "calidad", "quality"),
    "cicd_devops": ("ci/cd", "cicd", "devops", "pipeline", "jenkins", "github actions"),
    "programming_skills": ("programaci", "programming", "código", "code", "python", "java", "javascript"),
    "team_management": ("gestión", "gestion", "management", "liderazgo", "leadership", "equipo", "team"),
    "certifications": ("certificaci", "certification", "istqb"),
}
_ROLE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "qa_manual": ("manual", "qa"),
    "qa_automation": ("automat",),
    "qa_lead_manager": ("gestión", "gestion", "lead", "manager", "liderazgo", "leadership"),
    "developer": ("desarroll", "developer", "programaci", "programming"),
    "devops": ("devops", "ci/cd", "cicd"),
    "product_manager": ("producto", "product"),
}


def _catalog_item_haystack(item: CatalogItem) -> str:
    parts = [item.title or "", item.category or ""]
    if item.tags_json:
        parts.extend(str(tag) for tag in item.tags_json)
    return " ".join(parts).lower()


def _score_item_for_profile(
    item: CatalogItem,
    *,
    preferred_types: set[CatalogItemType],
    profile: "UserPreferencesProfile | None",
) -> int:
    score = 1 if item.type in preferred_types else 0
    if profile is None:
        return score
    haystack = _catalog_item_haystack(item)
    if profile.level and item.level is not None and profile.level == item.level.value:
        score += 3
    for tech in profile.technologies or []:
        if any(kw in haystack for kw in _TECHNOLOGY_KEYWORDS.get(tech, (tech,))):
            score += 2
    for goal in profile.improvement_goals or []:
        if any(kw in haystack for kw in _IMPROVEMENT_GOAL_KEYWORDS.get(goal, ())):
            score += 2
    if profile.role and any(kw in haystack for kw in _ROLE_KEYWORDS.get(profile.role, ())):
        score += 1
    return score


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

    def permanently_owned_slugs(self, user_id: int) -> set[str]:
        return self.purchases.permanently_owned_slugs_for_user(user_id)

    def list_my_purchases(self, user_id: int) -> MyPurchaseListResponse:
        """"Mis compras" — the transaction record, separate from the
        library (see MyPurchaseRead's docstring). One row per
        CatalogPurchase, newest first."""
        rows = self.purchases.list_for_user(user_id)
        if not rows:
            return MyPurchaseListResponse(items=[])

        item_ids = [r.catalog_item_id for r in rows]
        items_by_id = {
            i.id: i for i in self.db.execute(select(CatalogItem).where(CatalogItem.id.in_(item_ids))).scalars().all()
        }
        org_ids = [r.organization_id for r in rows if r.organization_id is not None]
        org_names: dict[int, str] = {}
        if org_ids:
            org_names = {
                o.id: o.name
                for o in self.db.execute(select(Organization).where(Organization.id.in_(org_ids))).scalars().all()
            }

        favorite_slugs = self.favorite_slugs(user_id)
        purchased_slugs = self.purchased_slugs(user_id)
        permanently_owned = self.permanently_owned_slugs(user_id)
        summaries = self.ratings.summaries_for_items(catalog_item_ids=item_ids)
        my_ratings = self.ratings.my_ratings_for_items(user_id=user_id, catalog_item_ids=item_ids)
        review_summaries = self.ratings.review_summaries_for_items(catalog_item_ids=item_ids)
        purchased_at_by_slug = self.purchases.purchased_at_by_slug(user_id)

        results: list[MyPurchaseRead] = []
        for row in rows:
            item = items_by_id.get(row.catalog_item_id)
            if item is None:
                continue  # soft-deleted/orphaned row — nothing sane to show
            read = self._to_read(
                item,
                favorite_slugs=favorite_slugs,
                purchased_slugs=purchased_slugs,
                permanently_owned_slugs=permanently_owned,
                rating_summaries=summaries,
                my_ratings=my_ratings,
                review_summaries=review_summaries,
                purchased_at_by_slug=purchased_at_by_slug,
            )
            results.append(
                MyPurchaseRead(
                    item=read,
                    purchased_at=row.created_at,
                    source=row.source,
                    organization_name=org_names.get(row.organization_id) if row.organization_id else None,
                    has_payment_detail=bool(row.source == "stripe_checkout" and row.stripe_checkout_session_id),
                )
            )
        return MyPurchaseListResponse(items=results)

    def get_purchase_detail(self, *, user_id: int, slug: str) -> MyPurchaseDetailRead:
        """Lazily-fetched "más información" for one purchase — only hits
        Stripe's API for a stripe_checkout row (see MyPurchaseDetailRead),
        so listing purchases (list_my_purchases) never waits on it. A
        stale/deleted Stripe session degrades to the same "no payment
        detail available" response rather than a 500 — this is informational,
        never something that should block the page."""
        item = self._require_item(slug)
        row = self.db.execute(
            select(CatalogPurchase).where(
                CatalogPurchase.user_id == user_id, CatalogPurchase.catalog_item_id == item.id
            )
        ).scalar_one_or_none()
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No purchase found for this item")

        acquired_version = "standard"
        approved_ref = self.db.execute(
            select(TestApprovedRef)
            .where(TestApprovedRef.user_id == user_id, TestApprovedRef.catalog_item_id == item.id)
            .order_by(TestApprovedRef.approved_at.desc())
        ).scalars().first()
        if approved_ref is not None:
            acquired_version = approved_ref.ref

        detail = MyPurchaseDetailRead(acquired_version=acquired_version)

        if row.source != "stripe_checkout" or not row.stripe_checkout_session_id:
            # No live payment data to fetch — free claim, admin grant, or
            # plan entitlement never went through Stripe checkout at all.
            detail.payment_status = "not_applicable"
            return detail

        try:
            from app.modules.billing.service import _require_stripe_configured

            _require_stripe_configured()
            import stripe

            session = stripe.checkout.Session.retrieve(
                row.stripe_checkout_session_id, expand=["payment_intent.latest_charge"]
            )
        except Exception:
            logger.exception("Failed to fetch Stripe checkout session %s for purchase detail", row.stripe_checkout_session_id)
            detail.payment_status = "unknown"
            return detail

        amount_total = session.get("amount_total")
        currency = session.get("currency")
        detail.amount_paid = Decimal(amount_total) / 100 if amount_total is not None else None
        detail.currency = currency.upper() if currency else None
        detail.payment_status = session.get("payment_status")

        total_details = session.get("total_details") or {}
        amount_discount = total_details.get("amount_discount")
        if amount_discount:
            detail.discount_amount = Decimal(amount_discount) / 100

        payment_intent = session.get("payment_intent")
        if isinstance(payment_intent, dict):
            latest_charge = payment_intent.get("latest_charge")
            if isinstance(latest_charge, dict):
                detail.receipt_url = latest_charge.get("receipt_url")

        return detail

    def _to_read(
        self,
        item: CatalogItem,
        *,
        favorite_slugs: set[str],
        purchased_slugs: set[str],
        permanently_owned_slugs: set[str] | None = None,
        rating_summaries: dict[int, RatingSummary] | None = None,
        my_ratings: dict[int, object] | None = None,
        review_summaries: dict[int, tuple[float, int]] | None = None,
        purchased_at_by_slug: dict[str, datetime] | None = None,
    ) -> CatalogItemRead:
        summary = (rating_summaries or {}).get(item.id)
        my_rating = (my_ratings or {}).get(item.id)
        review_summary = (review_summaries or {}).get(item.id)
        purchased_at = (purchased_at_by_slug or {}).get(item.slug)
        has_new_version = bool(
            item.version_updated_at is not None and purchased_at is not None and item.version_updated_at > purchased_at
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
            audiobookUrl=item.audiobook_url,
            benefits=item.benefits_json or [],
            requirements=item.requirements_json or [],
            includedItems=item.included_items_json or [],
            tags=item.tags_json or [],
            seriesName=item.series_name,
            seriesOrder=item.series_order,
            isFavorite=item.slug in favorite_slugs,
            isPurchased=item.slug in purchased_slugs,
            isPlanIncluded=(
                item.slug in purchased_slugs
                and permanently_owned_slugs is not None
                and item.slug not in permanently_owned_slugs
            ),
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
            # Just "does this item have a linked resource folder at all" —
            # NOT "can the current user see something in it". It used to
            # also require ownership, which hid the "Ver contenido" button
            # entirely for a priced item's non-owners; now that a resource
            # folder can carry a free preview*.pdf (see
            # get_resource_content), a non-owner should still see the
            # button and let the content endpoint decide preview vs a 403
            # with a clear "buy to unlock" message. Ownership itself is
            # still fully enforced there and in resource-download — this
            # flag only ever gates whether the button renders.
            hasResourceContent=bool(item.repo_path and self._resolve_repo_url(item)),
            currentVersion=item.current_version,
            versionUpdatedAt=item.version_updated_at,
            changelog=item.changelog_json or [],
            compatibility=item.compatibility_json or [],
            purchasedAt=purchased_at,
            hasNewVersion=has_new_version,
            licenseScope=item.license_scope_json or [],
            licenseRedistribution=item.license_redistribution,
            licenseUpdatesIncluded=item.license_updates_included,
            licenseSupportIncluded=item.license_support_included,
            licenseRefundPolicy=item.license_refund_policy,
            gettingStarted=item.getting_started,
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
        permanently_owned = self.permanently_owned_slugs(user_id)
        purchased_at_by_slug = self.purchases.purchased_at_by_slug(user_id)
        return [
            self._to_read(
                i,
                favorite_slugs=favorite_slugs,
                purchased_slugs=purchased_slugs,
                permanently_owned_slugs=permanently_owned,
                rating_summaries=summaries,
                my_ratings=my_ratings,
                review_summaries=review_summaries,
                purchased_at_by_slug=purchased_at_by_slug,
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

    def get_recommendations(self, *, user_id: int, limit: int = 8) -> CatalogItemListResponse:
        """Server-side "recommended for you": ranks unpurchased catalog items
        by (a) sharing a type with something the user already owns — the
        original client-only heuristic (see RecommendedForYouStrip.tsx) —
        plus (b), when the user has answered the optional preferences survey
        (see app/modules/user_preferences/), keyword-matching their level,
        technologies, improvement goals and role against each item's
        level/tags_json/category/title (see _score_item_for_profile above).
        No fabricated score beyond that — items tie-break by recency, same
        as before."""
        fav = self.favorite_slugs(user_id)
        pur = self.purchased_slugs(user_id)

        all_items, _ = self.repo.list_for_consumer(
            limit=500,
            offset=0,
            type_filter=None,
            category=None,
            search=None,
            statuses=CONSUMER_LIST_STATUSES,
            sort=None,
            tags=None,
        )
        unpurchased = [i for i in all_items if i.slug not in pur]
        preferred_types = {i.type for i in all_items if i.slug in pur}

        profile = self.db.execute(
            select(UserPreferencesProfile).where(UserPreferencesProfile.user_id == user_id)
        ).scalar_one_or_none()
        if profile is not None and not profile.is_resolved:
            # Skipped-but-never-answered / brand-new row — nothing to score with.
            profile = None

        ranked = sorted(
            unpurchased,
            key=lambda i: (
                -_score_item_for_profile(i, preferred_types=preferred_types, profile=profile),
                -i.created_at.timestamp(),
            ),
        )
        top = ranked[:limit]
        reads = self._to_reads_with_ratings(top, user_id=user_id, favorite_slugs=fav, purchased_slugs=pur)
        return CatalogItemListResponse(items=reads, limit=limit, offset=0, total=len(reads))

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
        read = reads[0]
        # _to_read's hasResourceContent only proves repo_path + a resolvable
        # repo are configured, not that this specific viewer has anything to
        # actually see — confirm it for real here, single-item page only
        # (see _resource_content_exists).
        if read.hasResourceContent:
            owns = self._owns_resource(item, user_id=user_id)
            if not self._resource_content_exists(item, owns=owns):
                read = read.model_copy(update={"hasResourceContent": False})
        return read

    def get_series_progress(self, slug: str, *, user_id: int) -> SeriesProgressRead:
        """"You're N/M through this series" + "recommended next" — see
        SeriesProgressRead. 404s for an item that isn't part of a series at
        all, same as browsing a slug that doesn't exist; the frontend only
        calls this when CatalogItemRead.seriesName is already set, so that
        case is a caller bug, not a normal empty state."""
        item = self._require_item(slug)
        if not item.series_name:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This item is not part of a series")
        siblings = self.repo.series_siblings(item.series_name, statuses=CONSUMER_DETAIL_STATUSES)
        purchased = self.purchased_slugs(user_id)
        series_items = [
            SeriesItemRead(
                slug=sib.slug,
                type=sib.type,
                title=sib.title,
                titleEn=sib.title_en,
                imageUrl=resolve_catalog_cover_url(sib),
                seriesOrder=sib.series_order,
                isPurchased=sib.slug in purchased,
            )
            for sib in siblings
        ]
        owned_count = sum(1 for si in series_items if si.isPurchased)
        next_item = next((si for si in series_items if not si.isPurchased), None)
        return SeriesProgressRead(
            seriesName=item.series_name,
            items=series_items,
            ownedCount=owned_count,
            totalCount=len(series_items),
            nextItem=next_item,
        )

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

    def _require_resource_item(self, slug: str) -> CatalogItem:
        """Existence + repo_path/repo_url configured — no ownership check.
        Ownership is evaluated separately by each caller: download always
        requires it (see `_require_resource_access`); the in-platform
        viewer only requires it for the full file — a preview*.pdf is open
        to anyone once the admin has uploaded one (see
        `get_resource_content`)."""
        item = self._require_item(slug)
        if not item.repo_path or not self._resolve_repo_url(item):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This item has no linked file")
        return item

    def _owns_resource(self, item: CatalogItem, *, user_id: int) -> bool:
        """A free item (price 0) needs no ownership at all, same as
        `purchase()` never blocking a free claim. Priced items go through
        `purchased_slugs`, which already covers permanent purchases and
        live plan-based access (including the organization-membership
        check)."""
        return self._is_free(item) or item.slug in self.purchased_slugs(user_id)

    def _require_resource_access(self, slug: str, *, user_id: int) -> CatalogItem:
        """Full ownership gate — used by download, which always serves the
        real file (a preview is for viewing only, never for saving)."""
        item = self._require_resource_item(slug)
        if not self._owns_resource(item, user_id=user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must own this item (directly or via your plan) to access its content",
            )
        return item

    def _record_resource_view(self, item: CatalogItem, *, user_id: int) -> None:
        """Upserts this user's resource_views row for `item` — bumps
        last_opened_at to now and increments open_count, or inserts a new
        row on the first open. Powers the "continue where you left off"
        strip on the independent dashboard (see recent_items_for_user).

        Only ever called from a path that already confirmed ownership (a
        non-owner's preview never counts as "opening" the item for this
        purpose) — and deliberately best-effort: a logging failure here
        must never break the actual viewer/download/audio response it's
        piggybacking on.
        """
        try:
            now = datetime.now(timezone.utc)
            stmt = pg_insert(ResourceView).values(
                user_id=user_id,
                catalog_item_id=item.id,
                last_opened_at=now,
                open_count=1,
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=[ResourceView.user_id, ResourceView.catalog_item_id],
                set_={"last_opened_at": now, "open_count": ResourceView.open_count + 1},
            )
            self.db.execute(stmt)
            self.db.commit()
        except Exception:
            logger.exception("Failed to record resource view for user_id=%s catalog_item_id=%s", user_id, item.id)
            self.db.rollback()

    def list_recently_opened(self, *, user_id: int, limit: int = 6) -> CatalogItemListResponse:
        """Items this user has actually opened, most-recent-first — see
        _record_resource_view. Used by the independent dashboard's
        "continue where you left off" section."""
        items = self.repo.recent_items_for_user(user_id, limit=limit)
        reads = self._to_reads_with_ratings(
            items,
            user_id=user_id,
            favorite_slugs=self.favorite_slugs(user_id),
            purchased_slugs=self.purchased_slugs(user_id),
        )
        return CatalogItemListResponse(items=reads, limit=limit, offset=0, total=len(reads))

    def _resource_content_exists(self, item: CatalogItem, *, owns: bool) -> bool:
        """Live check used only on the single-item detail page (never on the
        list — one GitHub call per browsed item is fine, one per catalog row
        is not) to catch the case an admin has typed a repo_path but never
        actually uploaded anything there: hasResourceContent from _to_read
        only proves repo_path + a resolvable repo are both set, not that
        *this viewer* has anything to actually see.

        Ownership-aware, because get_resource_content itself is: an owner
        can see whatever's in the main folder, so "the folder isn't empty"
        is close enough to every one of that method's owner-branch matchers
        without duplicating all of them here. A non-owner of a priced item
        can only ever be served a preview — a preview*.pdf sitting directly
        in the folder (or, for a book, anything inside its "preview"
        subfolder) — never the owner's full content, so hasResourceContent
        must check for exactly that, or "Ver muestra" renders for every
        priced item with *any* content at all and then 403s "you must own
        this item" on click for anyone who hasn't bought it and the admin
        never uploaded a preview for.

        A clean 404 (path doesn't exist) means nothing to show — hide the
        button. Any other failure (missing token, GitHub outage) fails open
        (assume content exists) so a transient/config issue never wrongly
        hides a button that's actually fine; the content endpoint itself
        still errors clearly if someone does click through during an
        outage."""
        if not settings.GITHUB_ACCESS_TOKEN:
            return True
        repo_url = self._resolve_repo_url(item)
        is_book = item.type == CatalogItemType.book
        path = f"{item.repo_path.rstrip('/')}/preview" if (not owns and is_book) else item.repo_path
        try:
            entries = list_directory(repo_url=repo_url, path=path, token=settings.GITHUB_ACCESS_TOKEN)
        except GithubContentError as exc:
            if exc.status_code == 404:
                return False
            return True
        if owns or is_book:
            return bool(entries)
        return any(
            entry.get("type") == "file" and _looks_like_preview_pdf(str(entry.get("name", "")))
            for entry in entries
        )

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

    def _list_resource_subfolder(self, item: CatalogItem, subfolder: str) -> list[dict]:
        """Books nest one level deeper than the flat resource convention:
        repo_path (e.g. "books/scraping") holds one subfolder per edition —
        "pdf", "epub", "kindle", "zip" — so the admin only ever types the
        book's own folder, never a full path per format. Tolerant of the
        subfolder not existing (a book need not offer every format): a 404
        here just means "nothing in that format yet", not a real error."""
        token = self._require_github_token()
        try:
            return list_directory(
                repo_url=self._resolve_repo_url(item),
                path=f"{item.repo_path.rstrip('/')}/{subfolder}",
                token=token,
            )
        except GithubContentError as exc:
            if exc.status_code == 404:
                return []
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

        Books (type == 'book') use the folder-per-format convention: their
        repo_path (e.g. "books/scraping") holds one subfolder per edition —
        "pdf" (the full book), "preview" (a short free sample, any file
        inside it), "epub"/"kindle"/"zip" (download-only, never previewed
        here). A non-owner of a *priced, unpurchased* book — this never
        applies to a free item, see `_owns_resource` — gets whatever is in
        "preview" instead of the full "pdf" folder, flagged `isPreview` so
        the frontend can show a "buy to unlock" banner; if there's no
        preview folder, they get the old hard 403 instead. An owner always
        gets the "pdf" folder, falling back to the flat repo_path listing
        (extension/prefix-matched) for books uploaded before this
        subfolder convention existed.

        Non-book resources keep the original flat convention: README.md
        (rendered as Markdown text), a .docx (rendered client-side with
        mammoth), a .xlsx/.xls (rendered client-side with SheetJS), a .pdf
        (rendered client-side in a native browser viewer), then the first
        recognized script/config/text file (rendered with line numbers +
        light syntax highlighting) — whichever the admin actually put in
        the folder. A non-owner still gets a legacy preview*.pdf if one is
        sitting directly in that flat folder.

        Text is decoded as UTF-8 (replacing invalid bytes) and truncated
        past a safety cap; binary files are base64-encoded up to a
        separate, larger cap, past which the caller should use the download
        button instead. The download endpoint always serves the exact
        original bytes regardless of what's previewable here, and — unlike
        this method — never serves anything to a non-owner, preview
        included."""
        item = self._require_resource_item(slug)
        is_book = item.type == CatalogItemType.book
        owns = self._owns_resource(item, user_id=user_id)
        if owns:
            self._record_resource_view(item, user_id=user_id)

        if is_book:
            if not owns:
                preview_entries = self._list_resource_subfolder(item, "preview")
                preview_entry = self._find_folder_entry_optional(preview_entries, matcher=lambda _name: True)
                if preview_entry is not None:
                    return self._binary_resource_content(item, entry=preview_entry, kind="pdf", is_preview=True)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must own this item (directly or via your plan) to access its content",
                )

            entries = self._list_resource_subfolder(item, "pdf")
            if not entries:
                entries = self._list_resource_folder(item)  # legacy flat layout
            pdf_entry = self._find_folder_entry_optional(
                entries, matcher=lambda name: name.lower().endswith(".pdf")
            )
            if pdf_entry is not None:
                return self._binary_resource_content(item, entry=pdf_entry, kind="pdf")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No viewable PDF was found in this book's 'pdf' folder",
            )

        entries = self._list_resource_folder(item)

        if not owns:
            preview_entry = self._find_folder_entry_optional(entries, matcher=_looks_like_preview_pdf)
            if preview_entry is not None:
                return self._binary_resource_content(item, entry=preview_entry, kind="pdf", is_preview=True)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must own this item (directly or via your plan) to access its content",
            )

        readme = self._find_folder_entry_optional(entries, matcher=lambda name: name.lower() == "readme.md")
        if readme is not None:
            return self._text_resource_content(item, entry=readme, kind="markdown")

        docx_entry = self._find_folder_entry_optional(entries, matcher=lambda name: name.lower().endswith(".docx"))
        if docx_entry is not None:
            return self._binary_resource_content(item, entry=docx_entry, kind="docx")

        xlsx_entry = self._find_folder_entry_optional(
            entries, matcher=lambda name: name.lower().endswith((".xlsx", ".xls"))
        )
        if xlsx_entry is not None:
            return self._binary_resource_content(item, entry=xlsx_entry, kind="xlsx")

        pdf_entry = self._find_folder_entry_optional(entries, matcher=_looks_like_full_pdf)
        if pdf_entry is not None:
            return self._binary_resource_content(item, entry=pdf_entry, kind="pdf")

        # Last resort: the folder's actual deliverable is a script/config
        # file rather than a README/docx/xlsx/pdf (e.g. a standalone .py or
        # .sh tool) — preview it as highlighted text instead of forcing a
        # download for something the browser can perfectly well show.
        code_entry = self._find_folder_entry_optional(entries, matcher=_looks_like_code)
        if code_entry is not None:
            return self._text_resource_content(item, entry=code_entry, kind="code")

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No viewable file was found in this item's configured folder",
        )

    def _text_resource_content(self, item: CatalogItem, *, entry: dict, kind: str) -> ResourceContentRead:
        raw = self._fetch_resource_bytes(item, path=entry["path"])
        text = raw.decode("utf-8", errors="replace")
        truncated = len(text) > _MAX_VIEWER_CHARS
        return ResourceContentRead(path=entry["path"], kind=kind, content=text[:_MAX_VIEWER_CHARS], truncated=truncated)

    def _binary_resource_content(
        self, item: CatalogItem, *, entry: dict, kind: str, is_preview: bool = False
    ) -> ResourceContentRead:
        raw = self._fetch_resource_bytes(item, path=entry["path"])
        if len(raw) > _MAX_BINARY_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="This file is too large to preview in the browser — use the download button instead",
            )
        return ResourceContentRead(
            path=entry["path"],
            kind=kind,
            contentBase64=base64.b64encode(raw).decode("ascii"),
            truncated=False,
            isPreview=is_preview,
        )

    def _find_book_format_entry(self, item: CatalogItem, fmt: str) -> dict | None:
        """Looks up the one file for a book's single-format download
        button (pdf/epub/kindle/zip) inside its own per-format subfolder —
        trying each name in `_FORMAT_SUBFOLDER_ALIASES` (or just `fmt`
        itself) until one actually has something in it. Never falls back
        to the flat legacy layout — callers that need that do it
        themselves, since it's a different, book-agnostic code path shared
        with non-book resources."""
        matcher = _DOWNLOAD_FORMAT_MATCHERS[fmt]
        for subfolder_name in _FORMAT_SUBFOLDER_ALIASES.get(fmt, (fmt,)):
            entries = self._list_resource_subfolder(item, subfolder_name)
            if not entries:
                continue
            target = self._find_folder_entry_optional(
                entries, matcher=matcher
            ) or self._find_folder_entry_optional(entries, matcher=lambda _name: True)
            if target is not None:
                return target
        return None

    def _build_all_formats_zip(self, item: CatalogItem) -> bytes | None:
        """Bundles whichever of pdf/epub/kindle this book actually has into
        one zip built on the fly, for the "All formats" download button —
        so an admin who already uploaded the individual editions doesn't
        also have to maintain a separate, pre-zipped copy in a "zip"
        subfolder just to keep that one button working. Returns None if
        the book has none of those three at all (nothing to bundle)."""
        buffer = io.BytesIO()
        added_any = False
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for fmt in ("pdf", "epub", "kindle"):
                target = self._find_book_format_entry(item, fmt)
                if target is None:
                    continue
                raw = self._fetch_resource_bytes(item, path=target["path"])
                zf.writestr(target["name"], raw)
                added_any = True
        return buffer.getvalue() if added_any else None

    def get_book_download_formats(self, slug: str) -> BookDownloadFormatsRead:
        """Which of a book's per-format download buttons should render as
        enabled — checked without requiring ownership (existence/shape
        only, GitHub metadata never file contents) so the frontend can
        gray out a format for the honest reason "not uploaded yet" instead
        of only discovering that after the user clicks it. "zip" ("All
        formats") counts as available either as a real pre-made zip, or
        implicitly whenever at least one of pdf/epub/kindle exists, since
        that case is bundled on the fly — see `_build_all_formats_zip`."""
        item = self._require_resource_item(slug)
        if item.type != CatalogItemType.book:
            return BookDownloadFormatsRead()
        available = {fmt: self._find_book_format_entry(item, fmt) is not None for fmt in ("pdf", "epub", "kindle")}
        has_zip = self._find_book_format_entry(item, "zip") is not None or any(available.values())
        return BookDownloadFormatsRead(**available, zip=has_zip)

    @staticmethod
    def _is_download_worthy(entry: dict) -> bool:
        """Filters out README.md and any preview*.* file from a folder
        listing — those are for on-page reading/sampling, not part of what
        `get_resource_download` actually hands the buyer, so they shouldn't
        count toward "how many files / how large is the package" either."""
        if entry.get("type") != "file":
            return False
        name = str(entry.get("name", "")).lower()
        return name != "readme.md" and not name.startswith("preview")

    def get_download_info(self, slug: str) -> ResourceDownloadInfoRead:
        """File count / total size / format list for the package the buyer
        would actually receive — shown on the item page before purchase so
        "what am I buying" doesn't stay a mystery until after checkout.
        Metadata only, straight off the GitHub Contents API's own file
        listing (which already includes each entry's size) — never fetches
        file bytes, so, like `get_book_download_formats`, this never
        requires ownership.

        Best-effort: a GitHub/config error here degrades to
        `available=False` (the frontend just hides the panel) rather than
        breaking the whole item page over what's a nice-to-have, not the
        purchase-critical path."""
        item = self._require_item(slug)
        if not item.repo_path or not self._resolve_repo_url(item):
            return ResourceDownloadInfoRead(available=False)

        try:
            if item.type == CatalogItemType.book:
                seen_paths: set[str] = set()
                entries: list[dict] = []
                for fmt in ("pdf", "epub", "kindle", "zip"):
                    target = self._find_book_format_entry(item, fmt)
                    if target is not None and target["path"] not in seen_paths:
                        seen_paths.add(target["path"])
                        entries.append(target)
                if not entries:
                    # Legacy flat layout, same fallback get_resource_download uses.
                    entries = [e for e in self._list_resource_folder(item) if self._is_download_worthy(e)]
            else:
                entries = [e for e in self._list_resource_folder(item) if self._is_download_worthy(e)]
        except HTTPException:
            return ResourceDownloadInfoRead(available=False)

        total_size = sum(int(e.get("size") or 0) for e in entries)
        formats = sorted(
            {name.rsplit(".", 1)[-1].lower() for e in entries if "." in (name := str(e.get("name", "")))}
        )
        return ResourceDownloadInfoRead(
            available=True, fileCount=len(entries), totalSizeBytes=total_size, formats=formats
        )

    def get_resource_download(self, slug: str, *, user_id: int, format: str | None = None) -> tuple[bytes, str]:
        """Returns (raw file bytes, filename) for a Content-Disposition
        download — always requires full ownership (see
        `_require_resource_access`), a preview is for viewing only.

        Without `format`: prefers the packaged .zip inside the item's
        repo_path folder (the original script/resource-bundle convention);
        falls back to a standalone .docx or .xlsx/.xls when that's what the
        folder actually contains, then to any other single file (e.g. a
        bare .py/.sh script or a book's lone .pdf) — same file the
        in-platform viewer just previewed, or the only thing in the folder
        if the viewer declined to preview it. Deliberately more permissive
        than the viewer's kind detection: get the admin's file, whatever it
        is, rather than 404 just because it isn't one of the previewable
        formats.

        With `format` (a book's multi-format download menu — "pdf" |
        "epub" | "kindle" | "zip"): for books, looks inside repo_path's
        subfolder named after the format (e.g. "books/scraping/epub") —
        same folder-per-format convention as the viewer's "pdf" subfolder —
        falling back to the old flat, extension-matched lookup directly in
        repo_path for books uploaded before this convention. "zip" ("All
        formats") prefers a pre-made zip if the admin uploaded one, but
        otherwise builds one on the fly out of whichever of pdf/epub/kindle
        actually exist (see `_build_all_formats_zip`) — no admin step
        required beyond uploading the individual editions. Non-book
        resources never had subfolders, so they keep the flat lookup
        unconditionally. 404s with a clear message if that particular
        format was never uploaded — this is a query, not a cascade, since
        the caller explicitly asked for one thing.

        Served exactly as stored, no decoding/truncation."""
        item = self._require_resource_access(slug, user_id=user_id)
        self._record_resource_view(item, user_id=user_id)
        is_book = item.type == CatalogItemType.book

        if format is not None:
            if format not in _DOWNLOAD_FORMAT_MATCHERS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown format '{format}' — expected one of: {', '.join(_DOWNLOAD_FORMAT_MATCHERS)}",
                )

            if is_book:
                if format == "zip":
                    prebuilt = self._find_book_format_entry(item, "zip")
                    if prebuilt is not None:
                        raw = self._fetch_resource_bytes(item, path=prebuilt["path"])
                        return raw, prebuilt["name"]
                    built = self._build_all_formats_zip(item)
                    if built is not None:
                        return built, f"{item.slug}-all-formats.zip"
                else:
                    target = self._find_book_format_entry(item, format)
                    if target is not None:
                        raw = self._fetch_resource_bytes(item, path=target["path"])
                        return raw, target["name"]

            # Legacy flat layout fallback — books uploaded before the
            # per-format-subfolder convention, extension-matched directly
            # in repo_path (never reached for a properly subfoldered book).
            flat_entries = self._list_resource_folder(item)
            target = self._find_folder_entry_optional(flat_entries, matcher=_DOWNLOAD_FORMAT_MATCHERS[format])
            if target is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"This item has no '{format}' file in its configured folder",
                )
            raw = self._fetch_resource_bytes(item, path=target["path"])
            return raw, target["name"]

        entries = self._list_resource_folder(item)
        target = (
            self._find_folder_entry_optional(entries, matcher=lambda name: name.lower().endswith(".zip"))
            or self._find_folder_entry_optional(entries, matcher=lambda name: name.lower().endswith(".docx"))
            or self._find_folder_entry_optional(entries, matcher=lambda name: name.lower().endswith((".xlsx", ".xls")))
            or self._find_folder_entry_optional(entries, matcher=lambda _name: True)
        )
        if target is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No downloadable file was found in this item's configured folder",
            )
        raw = self._fetch_resource_bytes(item, path=target["path"])
        return raw, target["name"]

    def list_audiobook_chapters(self, slug: str, *, user_id: int) -> AudiobookChapterListRead:
        """A book's platform-hosted audiobook: repo_path's "audiolibro"
        subfolder holds one audio file per chapter — smaller and cheaper to
        store than a single full-length file, and playable only inside the
        platform (each chapter is fetched through the same ownership-gated
        endpoint the PDF/download flows already use, never handed out as a
        raw shareable link like `audiobookUrl`). Requires full ownership,
        same as download — there is no audio equivalent of the book's PDF
        preview. Returns an empty list (not a 404) when the book simply
        doesn't have this subfolder, since `audiobookUrl` may be all it
        offers."""
        item = self._require_resource_access(slug, user_id=user_id)
        if item.type != CatalogItemType.book:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This item has no audiobook")
        entries = self._list_resource_subfolder(item, "audiolibro")
        names = sorted(
            str(entry.get("name", ""))
            for entry in entries
            if entry.get("type") == "file" and _looks_like_audio(str(entry.get("name", "")))
        )
        return AudiobookChapterListRead(
            chapters=[AudiobookChapterRead(name=name, index=i) for i, name in enumerate(names)]
        )

    def get_audiobook_chapter(self, slug: str, *, user_id: int, name: str) -> AudiobookChapterContentRead:
        """Serves one chapter's audio bytes, base64-encoded like the other
        binary viewers. `name` is matched against a fresh listing of this
        item's own "audiolibro" subfolder — never used to build a path
        directly — so a client can't use it to reach any file outside that
        one folder."""
        item = self._require_resource_access(slug, user_id=user_id)
        self._record_resource_view(item, user_id=user_id)
        if item.type != CatalogItemType.book:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This item has no audiobook")
        entries = self._list_resource_subfolder(item, "audiolibro")
        target = self._find_folder_entry_optional(entries, matcher=lambda entry_name: entry_name == name)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
        raw = self._fetch_resource_bytes(item, path=target["path"])
        if len(raw) > _MAX_AUDIO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="This chapter is too large to stream in the browser",
            )
        return AudiobookChapterContentRead(
            name=target["name"],
            contentBase64=base64.b64encode(raw).decode("ascii"),
            mimeType=_audio_mime_for(target["name"]),
        )

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
