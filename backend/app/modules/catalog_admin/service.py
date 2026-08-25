from __future__ import annotations

import logging
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.core.media_urls import (
    catalog_has_stored_image,
    ordered_catalog_images,
    resolve_catalog_cover_url,
    resolve_gallery_image_url,
)
from app.core.pricing_engine import calculate_recommended_price, match_dimension_level_for_quantity
from app.core.translation import translate_es_to_en
from app.models.catalog_item import CatalogItem
from app.models.catalog_item_dimension_selection import CatalogItemDimensionSelection
from app.models.catalog_item_image import CatalogItemImage
from app.models.enums import CatalogItemStatus, CatalogItemType, PricingPillarCode, TestRunConclusion, TestRunStatus
from app.models.pricing_dimension_level import PricingDimensionLevel
from app.models.pricing_dimension_type import PricingDimensionType
from app.models.pricing_pillar import PricingPillar
from app.models.test_run import TestRun
from app.models.user import User
from app.modules.notifications.service import NotificationsService
from app.modules.catalog_admin.schemas import (
    CatalogItemAdminCreate,
    CatalogItemAdminListResponse,
    CatalogItemAdminRead,
    CatalogItemAdminUpdate,
    CatalogItemImageListResponse,
    CatalogItemImageRead,
    CatalogItemTestStatsRead,
    CatalogTestRunConclusionCounts,
    CatalogTestRunRecentRead,
    CatalogTestRunStatusCounts,
    CatalogTestStatsSummaryItem,
    CatalogTestStatsSummaryResponse,
    DimensionSelectionInput,
    DimensionSelectionRead,
    TestInputVariableDef,
)
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository

# English mirrors auto-translated via DeepL — same pattern as
# PlansService._EN_FIELD_PAIRS/_ensure_english_fields.
_EN_FIELD_PAIRS = (
    ("title", "title_en"),
    ("short_description", "short_description_en"),
    ("long_description", "long_description_en"),
)


class CatalogAdminService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ConsumerCatalogRepository(db)

    def _ensure_english_fields(
        self, item: CatalogItem, payload: CatalogItemAdminCreate | CatalogItemAdminUpdate, *, changed_es: dict[str, bool]
    ) -> None:
        """Fills item.<field>_en for every field where either (a) the admin
        passed an explicit English override, or (b) the Spanish source text
        changed in this call and needs a fresh translation. Falls back to
        mirroring the Spanish text when translation is unavailable (no
        DEEPL_API_KEY configured, or the API call fails) so the English
        catalog is never left blank — saving an item can never fail because
        of this step. Same pattern as PlansService._ensure_english_fields."""
        for es_field, en_field in _EN_FIELD_PAIRS:
            override = getattr(payload, en_field, None)
            if override is not None:
                setattr(item, en_field, override)
                continue
            if not changed_es.get(es_field, False):
                continue
            es_value = getattr(item, es_field, None)
            translated = translate_es_to_en(es_value)
            setattr(item, en_field, translated if translated is not None else es_value)

    def _image_to_read(self, image: CatalogItemImage) -> CatalogItemImageRead:
        return CatalogItemImageRead(
            id=image.id,
            url=resolve_gallery_image_url(image),
            is_cover=image.is_cover,
            display_order=image.display_order,
        )

    def _to_read(self, item: CatalogItem) -> CatalogItemAdminRead:
        ordered = ordered_catalog_images(item)
        return CatalogItemAdminRead(
            id=item.id,
            uuid=item.uuid,
            title=item.title,
            slug=item.slug,
            type=item.type,
            category=item.category,
            short_description=item.short_description,
            long_description=item.long_description,
            title_en=item.title_en,
            short_description_en=item.short_description_en,
            long_description_en=item.long_description_en,
            image_url=resolve_catalog_cover_url(item),
            has_stored_image=catalog_has_stored_image(item),
            images=[self._image_to_read(img) for img in ordered],
            preview_url=item.preview_url,
            audiobook_url=item.audiobook_url,
            price=item.price,
            currency=item.currency,
            status=item.status,
            level=item.level,
            duration=item.duration,
            author=item.author,
            benefits=item.benefits_json or [],
            requirements=item.requirements_json or [],
            included_items=item.included_items_json or [],
            tags=item.tags_json or [],
            repo_url=item.repo_url,
            repo_redeem_code=item.repo_redeem_code,
            repo_path=item.repo_path,
            custom_fields=item.custom_fields_json or {},
            dimension_selections=[
                DimensionSelectionRead(dimension_type_id=s.dimension_type_id, dimension_level_id=s.dimension_level_id)
                for s in item.dimension_selections
            ],
            page_count=item.page_count,
            test_repo_url=item.test_repo_url,
            test_workflow_file=item.test_workflow_file,
            test_included_runs=item.test_included_runs,
            test_input_schema=[TestInputVariableDef(**v) for v in (item.test_input_schema_json or [])],
            recommended_price=item.recommended_price,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    def _sync_dimension_selections(self, item: CatalogItem, selections: list[DimensionSelectionInput]) -> None:
        """Replaces the item's manually-picked dimension selections with
        `selections` — one per dimension type of the item's pillar, at most.
        Range-based types (book "Páginas") are never accepted here; those
        are auto-matched from page_count in _apply_pricing instead."""
        try:
            pillar_code = PricingPillarCode(item.type.value if hasattr(item.type, "value") else item.type)
        except ValueError:
            return
        valid_type_ids = {
            t.id
            for t in self.db.execute(
                select(PricingDimensionType).where(
                    PricingDimensionType.pillar_code == pillar_code,
                    PricingDimensionType.is_range_based.is_(False),
                )
            ).scalars().all()
        }
        item.dimension_selections = [
            sel for sel in item.dimension_selections if sel.dimension_type_id not in valid_type_ids
        ]
        seen: set[int] = set()
        for inp in selections:
            if inp.dimension_type_id not in valid_type_ids or inp.dimension_type_id in seen:
                continue
            seen.add(inp.dimension_type_id)
            item.dimension_selections.append(
                CatalogItemDimensionSelection(
                    dimension_type_id=inp.dimension_type_id, dimension_level_id=inp.dimension_level_id
                )
            )

    def _apply_pricing(self, item: CatalogItem) -> None:
        """Recomputes and snapshots `recommended_price` from whatever
        dimension_selections/page_count are currently set on `item` —
        best-effort: any missing/invalid reference just clears the
        recommendation instead of blocking the save, since the
        recommended price is purely advisory. Every "subelemento" (subtipo,
        complejidad, funcionalidad, páginas...) is a PricingDimensionType;
        every selected level's multiplier that resolves participates in
        the product — see app/core/pricing_engine.py."""
        item.recommended_price = None
        try:
            pillar_code = PricingPillarCode(item.type.value if hasattr(item.type, "value") else item.type)
        except ValueError:
            return

        pillar = self.db.execute(
            select(PricingPillar).where(PricingPillar.code == pillar_code)
        ).scalar_one_or_none()
        if pillar is None:
            return

        dimension_types = list(
            self.db.execute(
                select(PricingDimensionType).where(PricingDimensionType.pillar_code == pillar_code)
            ).scalars().all()
        )

        # Range-based types (book "Páginas") auto-match from page_count,
        # overriding whatever the client selected for that type.
        if item.page_count:
            for dtype in dimension_types:
                if not dtype.is_range_based:
                    continue
                levels = list(
                    self.db.execute(
                        select(PricingDimensionLevel)
                        .where(PricingDimensionLevel.dimension_type_id == dtype.id, PricingDimensionLevel.is_active.is_(True))
                        .order_by(PricingDimensionLevel.min_value)
                    ).scalars().all()
                )
                matched = match_dimension_level_for_quantity(levels, item.page_count)
                item.dimension_selections = [
                    sel for sel in item.dimension_selections if sel.dimension_type_id != dtype.id
                ]
                if matched is not None:
                    item.dimension_selections.append(
                        CatalogItemDimensionSelection(dimension_type_id=dtype.id, dimension_level_id=matched.id)
                    )

        dimension_multipliers: list[Decimal] = []
        for sel in item.dimension_selections:
            level = self.db.get(PricingDimensionLevel, sel.dimension_level_id)
            if level is not None and level.is_active:
                dimension_multipliers.append(level.multiplier)

        item.recommended_price = calculate_recommended_price(
            base_price=pillar.base_price,
            dimension_multipliers=dimension_multipliers,
        )

    def _require_item(self, item_id: int) -> CatalogItem:
        item = self.db.get(CatalogItem, item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return item

    def _check_redeem_code_available(self, code: str | None, *, exclude_item_id: int | None = None) -> None:
        if not code:
            return
        stmt = select(CatalogItem.id).where(CatalogItem.repo_redeem_code == code)
        if exclude_item_id is not None:
            stmt = stmt.where(CatalogItem.id != exclude_item_id)
        if self.db.execute(stmt).scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Redeem code already in use")

    def _sync_cover_image(self, item: CatalogItem) -> None:
        """Mirror the legacy single-image fields (``image_data``/``image_mime``
        or ``image_url``) into the ``catalog_item_images`` gallery table, so
        the gallery is always the single source of truth for display —
        without requiring any change to the existing create/edit flow."""
        cover = next((img for img in item.images if img.is_cover), None)
        if item.image_data:
            if cover is None:
                cover = CatalogItemImage(catalog_item_id=item.id, is_cover=True, display_order=0)
                self.db.add(cover)
                item.images.append(cover)
            cover.image_data = item.image_data
            cover.image_mime = item.image_mime
            cover.image_url = None
        elif item.image_url:
            if cover is None:
                cover = CatalogItemImage(catalog_item_id=item.id, is_cover=True, display_order=0)
                self.db.add(cover)
                item.images.append(cover)
            cover.image_url = item.image_url
            cover.image_data = None
            cover.image_mime = None

    def get(self, item_id: int) -> CatalogItemAdminRead:
        return self._to_read(self._require_item(item_id))

    def list(
        self,
        *,
        limit: int,
        offset: int,
        type_filter: CatalogItemType | None = None,
        search: str | None = None,
        tags: list[str] | None = None,
    ) -> CatalogItemAdminListResponse:
        items, total = self.repo.list(
            limit=limit,
            offset=offset,
            type_filter=type_filter,
            category=None,
            search=search,
            status=None,
            tags=tags,
        )
        return CatalogItemAdminListResponse(
            items=[self._to_read(i) for i in items],
            limit=limit,
            offset=offset,
            total=total,
        )

    def list_tags(self) -> list[str]:
        return self.repo.distinct_tags()

    def create(self, payload: CatalogItemAdminCreate) -> CatalogItemAdminRead:
        if self.repo.get_by_slug(payload.slug):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
        # Normalize blank -> NULL so the DB unique constraint never treats two
        # "no code set" books as a conflicting pair of empty strings.
        payload.repo_redeem_code = (payload.repo_redeem_code or "").strip() or None
        self._check_redeem_code_available(payload.repo_redeem_code)
        item = CatalogItem(
            title=payload.title,
            slug=payload.slug,
            type=payload.type,
            category=payload.category,
            short_description=payload.short_description,
            long_description=payload.long_description,
            image_url=payload.image_url,
            preview_url=payload.preview_url,
            audiobook_url=payload.audiobook_url,
            price=payload.price,
            currency=payload.currency,
            status=payload.status,
            level=payload.level,
            duration=payload.duration,
            author=payload.author,
            benefits_json=payload.benefits,
            requirements_json=payload.requirements,
            included_items_json=payload.included_items,
            tags_json=payload.tags,
            repo_url=payload.repo_url,
            repo_redeem_code=payload.repo_redeem_code,
            repo_path=payload.repo_path,
            custom_fields_json=payload.custom_fields,
            page_count=payload.page_count,
            test_repo_url=payload.test_repo_url,
            test_workflow_file=payload.test_workflow_file,
            test_included_runs=payload.test_included_runs,
            test_input_schema_json=[v.model_dump() for v in payload.test_input_schema],
        )
        self._ensure_english_fields(
            item,
            payload,
            changed_es={"title": True, "short_description": True, "long_description": True},
        )
        self._sync_dimension_selections(item, payload.dimension_selections)
        self._apply_pricing(item)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        # Gallery sync and notifications are secondary effects — never let a
        # problem there (e.g. a pending migration) block saving the item.
        try:
            self._sync_cover_image(item)
            self.db.commit()
            self.db.refresh(item)
        except Exception:
            self.db.rollback()
            logger.exception("Failed to sync cover image for catalog item %s", item.id)
        if self._is_visible_status(item.status):
            try:
                self._notify_new_catalog_item(item)
            except Exception:
                self.db.rollback()
                logger.exception("Failed to notify users about new catalog item %s", item.id)
        return self._to_read(item)

    @staticmethod
    def _status_value(item_status) -> str:
        return item_status.value if hasattr(item_status, "value") else str(item_status)

    def _is_visible_status(self, item_status) -> bool:
        """Only published / coming_soon / request_only items should trigger a
        broadcast notification — a draft is not yet visible to users."""
        return self._status_value(item_status) != CatalogItemStatus.draft.value

    def _notify_new_catalog_item(self, item: CatalogItem) -> None:
        type_labels = {"product": "Producto", "course": "Curso", "book": "Libro", "resource": "Recurso"}
        label = type_labels.get(item.type.value if hasattr(item.type, "value") else str(item.type), "Elemento")
        NotificationsService(self.db).notify_all_non_superadmin(
            type="catalog_item_added",
            title=f"Nuevo {label.lower()} en el catálogo: {item.title}",
            body=item.short_description,
            link=f"/catalog/{item.type.value if hasattr(item.type, 'value') else item.type}/{item.slug}",
        )

    def update(self, item_id: int, payload: CatalogItemAdminUpdate) -> CatalogItemAdminRead:
        item = self._require_item(item_id)
        was_visible = self._is_visible_status(item.status)
        data = payload.model_dump(exclude_unset=True)
        # Handled exclusively by _ensure_english_fields below (needs to see
        # None as "no override, maybe auto-translate" vs the generic loop
        # below which would instead just blindly overwrite with whatever
        # was sent — including a stray null wiping a prior translation on
        # an edit that didn't touch these fields at all).
        for en_field in ("title_en", "short_description_en", "long_description_en"):
            data.pop(en_field, None)
        if "benefits" in data:
            item.benefits_json = data.pop("benefits")
        if "requirements" in data:
            item.requirements_json = data.pop("requirements")
        if "included_items" in data:
            item.included_items_json = data.pop("included_items")
        if "tags" in data:
            item.tags_json = data.pop("tags")
        if "custom_fields" in data:
            item.custom_fields_json = data.pop("custom_fields")
        if "test_input_schema" in data:
            item.test_input_schema_json = data.pop("test_input_schema")
        if "dimension_selections" in data:
            data.pop("dimension_selections")
            self._sync_dimension_selections(item, payload.dimension_selections or [])
        if "repo_redeem_code" in data:
            data["repo_redeem_code"] = (data["repo_redeem_code"] or "").strip() or None
            self._check_redeem_code_available(data["repo_redeem_code"], exclude_item_id=item.id)
        for key, value in data.items():
            setattr(item, key, value)
        self._ensure_english_fields(
            item,
            payload,
            changed_es={
                "title": payload.title is not None,
                "short_description": payload.short_description is not None,
                "long_description": payload.long_description is not None,
            },
        )
        self._apply_pricing(item)
        self.db.commit()
        self.db.refresh(item)
        try:
            self._sync_cover_image(item)
            self.db.commit()
            self.db.refresh(item)
        except Exception:
            self.db.rollback()
            logger.exception("Failed to sync cover image for catalog item %s", item.id)
        # If the item just became visible (draft -> published/coming_soon/
        # request_only), notify users the same way a brand-new item would.
        now_visible = self._is_visible_status(item.status)
        if not was_visible and now_visible:
            try:
                self._notify_new_catalog_item(item)
            except Exception:
                self.db.rollback()
                logger.exception("Failed to notify users about catalog item %s becoming visible", item.id)
        return self._to_read(item)

    def delete(self, item_id: int) -> None:
        item = self._require_item(item_id)
        self.db.delete(item)
        self.db.commit()

    def upload_cover_image(self, item_id: int, content: bytes, mime: str) -> CatalogItemAdminRead:
        item = self._require_item(item_id)
        item.image_data = content
        item.image_mime = mime
        self.db.commit()
        self.db.refresh(item)
        try:
            self._sync_cover_image(item)
            self.db.commit()
            self.db.refresh(item)
        except Exception:
            self.db.rollback()
            logger.exception("Failed to sync cover image for catalog item %s", item.id)
        return self._to_read(item)

    # --- Gallery management (additional, non-cover images) ---------------

    def list_images(self, item_id: int) -> CatalogItemImageListResponse:
        item = self._require_item(item_id)
        ordered = ordered_catalog_images(item)
        return CatalogItemImageListResponse(items=[self._image_to_read(img) for img in ordered])

    def add_image_upload(self, item_id: int, content: bytes, mime: str) -> CatalogItemImageRead:
        item = self._require_item(item_id)
        is_first = len(item.images) == 0
        next_order = max((img.display_order for img in item.images), default=-1) + 1
        image = CatalogItemImage(
            catalog_item_id=item.id,
            image_data=content,
            image_mime=mime,
            is_cover=is_first,
            display_order=next_order,
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return self._image_to_read(image)

    def add_image_url(self, item_id: int, url: str) -> CatalogItemImageRead:
        item = self._require_item(item_id)
        is_first = len(item.images) == 0
        next_order = max((img.display_order for img in item.images), default=-1) + 1
        image = CatalogItemImage(
            catalog_item_id=item.id,
            image_url=url,
            is_cover=is_first,
            display_order=next_order,
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return self._image_to_read(image)

    def set_cover(self, item_id: int, image_id: int) -> CatalogItemImageRead:
        item = self._require_item(item_id)
        target = next((img for img in item.images if img.id == image_id), None)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        for img in item.images:
            img.is_cover = img.id == image_id
        self.db.commit()
        self.db.refresh(target)
        return self._image_to_read(target)

    def delete_image(self, item_id: int, image_id: int) -> None:
        item = self._require_item(item_id)
        target = next((img for img in item.images if img.id == image_id), None)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        was_cover = target.is_cover
        item.images.remove(target)
        self.db.flush()
        if was_cover:
            remaining = sorted(item.images, key=lambda img: (img.display_order, img.id))
            if remaining:
                remaining[0].is_cover = True
        self.db.commit()

    # --- Test-execution usage stats (admin) ---------------------------------
    # Read-only reporting over app.modules.test_execution's TestRun rows —
    # kept here rather than in that module since this is purely an admin
    # "how much is this product being used" view, not part of the
    # buyer-facing trigger/quota flow itself.

    def get_test_stats(self, item_id: int) -> CatalogItemTestStatsRead:
        item = self._require_item(item_id)
        if not item.test_repo_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="This item has no test framework configured",
            )

        total_runs = int(
            self.db.execute(
                select(func.count()).select_from(TestRun).where(TestRun.catalog_item_id == item.id)
            ).scalar_one()
        )
        unique_users = int(
            self.db.execute(
                select(func.count(func.distinct(TestRun.user_id))).where(TestRun.catalog_item_id == item.id)
            ).scalar_one()
        )

        status_counts = {s.value: 0 for s in TestRunStatus}
        for s_val, n in self.db.execute(
            select(TestRun.status, func.count())
            .where(TestRun.catalog_item_id == item.id)
            .group_by(TestRun.status)
        ).all():
            status_counts[s_val.value if hasattr(s_val, "value") else s_val] = int(n)

        conclusion_counts = {c.value: 0 for c in TestRunConclusion}
        for c_val, n in self.db.execute(
            select(TestRun.conclusion, func.count())
            .where(TestRun.catalog_item_id == item.id, TestRun.conclusion.is_not(None))
            .group_by(TestRun.conclusion)
        ).all():
            conclusion_counts[c_val.value if hasattr(c_val, "value") else c_val] = int(n)

        last_run_at = self.db.execute(
            select(func.max(TestRun.created_at)).where(TestRun.catalog_item_id == item.id)
        ).scalar_one()

        recent_rows = self.db.execute(
            select(TestRun, User.email)
            .join(User, User.id == TestRun.user_id)
            .where(TestRun.catalog_item_id == item.id)
            .order_by(TestRun.created_at.desc())
            .limit(10)
        ).all()
        recent_runs = [
            CatalogTestRunRecentRead(
                uuid=r.uuid,
                user_email=email,
                status=r.status.value,
                conclusion=r.conclusion.value if r.conclusion else None,
                created_at=r.created_at,
            )
            for r, email in recent_rows
        ]

        return CatalogItemTestStatsRead(
            item_id=item.id,
            item_title=item.title,
            item_slug=item.slug,
            included_runs=item.test_included_runs,
            total_runs=total_runs,
            unique_users=unique_users,
            by_status=CatalogTestRunStatusCounts(**status_counts),
            by_conclusion=CatalogTestRunConclusionCounts(**conclusion_counts),
            last_run_at=last_run_at,
            recent_runs=recent_runs,
        )

    def list_test_stats_summary(self) -> CatalogTestStatsSummaryResponse:
        """Lightweight per-product execution totals — powers the admin
        dashboard's 'ejecuciones por producto' section. Only items with a
        test framework configured are included; items nobody has ever run
        just show total_runs=0 rather than being omitted, so the dashboard
        reads as a complete roster of test-enabled products."""
        items = list(
            self.db.execute(select(CatalogItem).where(CatalogItem.test_repo_url.is_not(None))).scalars().all()
        )
        if not items:
            return CatalogTestStatsSummaryResponse(items=[])

        item_ids = [i.id for i in items]
        counts_rows = self.db.execute(
            select(TestRun.catalog_item_id, func.count(), func.max(TestRun.created_at))
            .where(TestRun.catalog_item_id.in_(item_ids))
            .group_by(TestRun.catalog_item_id)
        ).all()
        counts_by_item = {cid: (int(n), last) for cid, n, last in counts_rows}

        return CatalogTestStatsSummaryResponse(
            items=[
                CatalogTestStatsSummaryItem(
                    item_id=i.id,
                    item_title=i.title,
                    item_slug=i.slug,
                    included_runs=i.test_included_runs,
                    total_runs=counts_by_item.get(i.id, (0, None))[0],
                    last_run_at=counts_by_item.get(i.id, (0, None))[1],
                )
                for i in items
            ]
        )
