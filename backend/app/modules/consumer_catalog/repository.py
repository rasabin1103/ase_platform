from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus, CatalogItemType


class ConsumerCatalogRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_slug(self, slug: str) -> CatalogItem | None:
        return self.db.execute(select(CatalogItem).where(CatalogItem.slug == slug)).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        type_filter: CatalogItemType | None,
        category: str | None,
        search: str | None,
        status: CatalogItemStatus | None,
        statuses: tuple[CatalogItemStatus, ...] | None = None,
    ) -> tuple[list[CatalogItem], int]:
        base = select(CatalogItem)
        if type_filter is not None:
            base = base.where(CatalogItem.type == type_filter)
        if category is not None:
            base = base.where(CatalogItem.category == category)
        if statuses is not None:
            base = base.where(CatalogItem.status.in_(statuses))
        elif status is not None:
            base = base.where(CatalogItem.status == status)
        if search:
            q = f"%{search}%"
            base = base.where(
                or_(
                    CatalogItem.title.ilike(q),
                    CatalogItem.short_description.ilike(q),
                    CatalogItem.category.ilike(q),
                )
            )
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = base.order_by(CatalogItem.created_at.desc(), CatalogItem.id.desc()).limit(limit).offset(offset)
        return list(self.db.execute(stmt).scalars().all()), total

    def list_related_published(
        self,
        item_type: CatalogItemType,
        *,
        exclude_slug: str,
        limit: int = 4,
    ) -> list[CatalogItem]:
        stmt = (
            select(CatalogItem)
            .where(
                CatalogItem.type == item_type,
                CatalogItem.slug != exclude_slug,
                CatalogItem.status.in_(
                    (
                        CatalogItemStatus.published,
                        CatalogItemStatus.coming_soon,
                        CatalogItemStatus.request_only,
                    )
                ),
            )
            .order_by(CatalogItem.created_at.desc())
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def list_for_consumer(
        self,
        *,
        limit: int,
        offset: int,
        type_filter: CatalogItemType | None,
        category: str | None,
        search: str | None,
        statuses: tuple[CatalogItemStatus, ...],
    ) -> tuple[list[CatalogItem], int]:
        return self.list(
            limit=limit,
            offset=offset,
            type_filter=type_filter,
            category=category,
            search=search,
            status=None,
            statuses=statuses,
        )
