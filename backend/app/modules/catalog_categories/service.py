from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog_category import CatalogCategory
from app.modules.catalog_categories.schemas import (
    CatalogCategoryCreate,
    CatalogCategoryListResponse,
    CatalogCategoryRead,
    CatalogCategoryUpdate,
)


class CatalogCategoriesService:
    def __init__(self, db: Session):
        self.db = db

    def _to_read(self, category: CatalogCategory) -> CatalogCategoryRead:
        return CatalogCategoryRead(
            id=category.id,
            uuid=category.uuid,
            name=category.name,
            slug=category.slug,
            description=category.description,
            fields=category.fields_json or [],
            display_order=category.display_order,
            is_active=category.is_active,
            created_at=category.created_at,
            updated_at=category.updated_at,
        )

    def _require_category(self, category_id: int) -> CatalogCategory:
        category = self.db.get(CatalogCategory, category_id)
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category

    def _check_unique(
        self, *, name: str | None = None, slug: str | None = None, exclude_id: int | None = None
    ) -> None:
        if name is not None:
            stmt = select(CatalogCategory.id).where(CatalogCategory.name == name)
            if exclude_id is not None:
                stmt = stmt.where(CatalogCategory.id != exclude_id)
            if self.db.execute(stmt).scalar_one_or_none() is not None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A category with that name already exists")
        if slug is not None:
            stmt = select(CatalogCategory.id).where(CatalogCategory.slug == slug)
            if exclude_id is not None:
                stmt = stmt.where(CatalogCategory.id != exclude_id)
            if self.db.execute(stmt).scalar_one_or_none() is not None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That slug is already in use")

    def get(self, category_id: int) -> CatalogCategoryRead:
        return self._to_read(self._require_category(category_id))

    def list(self, *, active_only: bool = False) -> CatalogCategoryListResponse:
        stmt = select(CatalogCategory).order_by(CatalogCategory.display_order, CatalogCategory.name)
        if active_only:
            stmt = stmt.where(CatalogCategory.is_active.is_(True))
        categories = list(self.db.execute(stmt).scalars().all())
        return CatalogCategoryListResponse(items=[self._to_read(c) for c in categories])

    def create(self, payload: CatalogCategoryCreate) -> CatalogCategoryRead:
        self._check_unique(name=payload.name, slug=payload.slug)
        category = CatalogCategory(
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
            fields_json=[f.model_dump() for f in payload.fields],
            display_order=payload.display_order,
            is_active=payload.is_active,
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return self._to_read(category)

    def update(self, category_id: int, payload: CatalogCategoryUpdate) -> CatalogCategoryRead:
        category = self._require_category(category_id)
        data = payload.model_dump(exclude_unset=True)
        self._check_unique(name=data.get("name"), slug=data.get("slug"), exclude_id=category.id)
        if "fields" in data:
            category.fields_json = data.pop("fields")
        for key, value in data.items():
            setattr(category, key, value)
        self.db.commit()
        self.db.refresh(category)
        return self._to_read(category)

    def delete(self, category_id: int) -> None:
        category = self._require_category(category_id)
        self.db.delete(category)
        self.db.commit()
