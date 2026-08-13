from __future__ import annotations

import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.core.media_urls import (
    catalog_has_stored_image,
    ordered_catalog_images,
    resolve_catalog_cover_url,
    resolve_gallery_image_url,
)
from app.models.catalog_item import CatalogItem
from app.models.catalog_item_image import CatalogItemImage
from app.models.enums import CatalogItemStatus, CatalogItemType
from app.modules.notifications.service import NotificationsService
from app.modules.catalog_admin.schemas import (
    CatalogItemAdminCreate,
    CatalogItemAdminListResponse,
    CatalogItemAdminRead,
    CatalogItemAdminUpdate,
    CatalogItemImageListResponse,
    CatalogItemImageRead,
)
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository


class CatalogAdminService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ConsumerCatalogRepository(db)

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
            image_url=resolve_catalog_cover_url(item),
            has_stored_image=catalog_has_stored_image(item),
            images=[self._image_to_read(img) for img in ordered],
            preview_url=item.preview_url,
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
            custom_fields=item.custom_fields_json or {},
            created_at=item.created_at,
            updated_at=item.updated_at,
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
            custom_fields_json=payload.custom_fields,
        )
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
        if "repo_redeem_code" in data:
            data["repo_redeem_code"] = (data["repo_redeem_code"] or "").strip() or None
            self._check_redeem_code_available(data["repo_redeem_code"], exclude_item_id=item.id)
        for key, value in data.items():
            setattr(item, key, value)
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
