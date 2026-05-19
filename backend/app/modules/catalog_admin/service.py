from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.media_urls import catalog_has_stored_image, resolve_catalog_image_url
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemType
from app.modules.catalog_admin.schemas import (
    CatalogItemAdminCreate,
    CatalogItemAdminListResponse,
    CatalogItemAdminRead,
    CatalogItemAdminUpdate,
)
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository


class CatalogAdminService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ConsumerCatalogRepository(db)

    def _to_read(self, item: CatalogItem) -> CatalogItemAdminRead:
        return CatalogItemAdminRead(
            id=item.id,
            uuid=item.uuid,
            title=item.title,
            slug=item.slug,
            type=item.type,
            category=item.category,
            short_description=item.short_description,
            long_description=item.long_description,
            image_url=resolve_catalog_image_url(item),
            has_stored_image=catalog_has_stored_image(item),
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
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    def get(self, item_id: int) -> CatalogItemAdminRead:
        item = self.db.get(CatalogItem, item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return self._to_read(item)

    def list(
        self,
        *,
        limit: int,
        offset: int,
        type_filter: CatalogItemType | None = None,
        search: str | None = None,
    ) -> CatalogItemAdminListResponse:
        items, total = self.repo.list(
            limit=limit,
            offset=offset,
            type_filter=type_filter,
            category=None,
            search=search,
            status=None,
        )
        return CatalogItemAdminListResponse(
            items=[self._to_read(i) for i in items],
            limit=limit,
            offset=offset,
            total=total,
        )

    def create(self, payload: CatalogItemAdminCreate) -> CatalogItemAdminRead:
        if self.repo.get_by_slug(payload.slug):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
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
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return self._to_read(item)

    def update(self, item_id: int, payload: CatalogItemAdminUpdate) -> CatalogItemAdminRead:
        item = self.db.get(CatalogItem, item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        data = payload.model_dump(exclude_unset=True)
        if "benefits" in data:
            item.benefits_json = data.pop("benefits")
        if "requirements" in data:
            item.requirements_json = data.pop("requirements")
        if "included_items" in data:
            item.included_items_json = data.pop("included_items")
        for key, value in data.items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return self._to_read(item)

    def delete(self, item_id: int) -> None:
        item = self.db.get(CatalogItem, item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        self.db.delete(item)
        self.db.commit()
