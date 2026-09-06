from __future__ import annotations

from sqlalchemy import case, func, or_, select
from sqlalchemy.dialects.postgresql import array as pg_array
from sqlalchemy.orm import Session, selectinload

from app.models.catalog_item import CatalogItem
from app.models.catalog_item_rating import CatalogItemRating
from app.models.enums import CatalogItemStatus, CatalogItemType
from app.models.resource_view import ResourceView


class ConsumerCatalogRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_slug(self, slug: str) -> CatalogItem | None:
        return self.db.execute(
            select(CatalogItem).options(selectinload(CatalogItem.images)).where(CatalogItem.slug == slug)
        ).scalar_one_or_none()

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
        sort: str | None = None,
        tags: list[str] | None = None,
    ) -> tuple[list[CatalogItem], int]:
        base = select(CatalogItem).options(selectinload(CatalogItem.images))
        if type_filter is not None:
            base = base.where(CatalogItem.type == type_filter)
        if category is not None:
            base = base.where(CatalogItem.category == category)
        if statuses is not None:
            base = base.where(CatalogItem.status.in_(statuses))
        elif status is not None:
            base = base.where(CatalogItem.status == status)
        if tags:
            # JSONB "any key exists" (?|): tags_json must include at least
            # one of the selected tags (OR semantics across the selection).
            base = base.where(CatalogItem.tags_json.has_any(pg_array(tags)))
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

        if sort == "top_rated":
            net_score = (
                select(
                    CatalogItemRating.catalog_item_id.label("catalog_item_id"),
                    func.sum(case((CatalogItemRating.is_positive.is_(True), 1), else_=-1)).label("net_score"),
                )
                .group_by(CatalogItemRating.catalog_item_id)
                .subquery()
            )
            stmt = (
                base.outerjoin(net_score, net_score.c.catalog_item_id == CatalogItem.id)
                .order_by(func.coalesce(net_score.c.net_score, 0).desc(), CatalogItem.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
        else:
            stmt = base.order_by(CatalogItem.created_at.desc(), CatalogItem.id.desc()).limit(limit).offset(offset)
        return list(self.db.execute(stmt).scalars().all()), total

    def list_for_consumer(
        self,
        *,
        limit: int,
        offset: int,
        type_filter: CatalogItemType | None,
        category: str | None,
        search: str | None,
        statuses: tuple[CatalogItemStatus, ...],
        sort: str | None = None,
        tags: list[str] | None = None,
    ) -> tuple[list[CatalogItem], int]:
        return self.list(
            limit=limit,
            offset=offset,
            type_filter=type_filter,
            category=category,
            search=search,
            status=None,
            statuses=statuses,
            sort=sort,
            tags=tags,
        )

    def recent_items_for_user(self, user_id: int, *, limit: int = 6) -> list[CatalogItem]:
        """Catalog items this user has actually opened (viewer, download, or
        an audiobook chapter — see ConsumerCatalogService._record_resource_view),
        newest-opened first. Powers the "continue where you left off" strip
        on the independent dashboard."""
        rows = self.db.execute(
            select(CatalogItem)
            .join(ResourceView, ResourceView.catalog_item_id == CatalogItem.id)
            .where(ResourceView.user_id == user_id)
            .order_by(ResourceView.last_opened_at.desc())
            .limit(limit)
        ).scalars().all()
        return list(rows)

    def series_siblings(
        self, series_name: str, *, statuses: tuple[CatalogItemStatus, ...] | None = None
    ) -> list[CatalogItem]:
        """Every item sharing this series_name, ordered by series_order (nulls
        last, so an admin who forgot to set an order still sees something
        sane rather than a query error) then id as a stable tiebreaker.
        Powers ConsumerCatalogService.get_series_progress."""
        stmt = select(CatalogItem).where(CatalogItem.series_name == series_name)
        if statuses is not None:
            stmt = stmt.where(CatalogItem.status.in_(statuses))
        stmt = stmt.order_by(CatalogItem.series_order.is_(None), CatalogItem.series_order, CatalogItem.id)
        return list(self.db.execute(stmt).scalars().all())

    def distinct_tags(self, *, statuses: tuple[CatalogItemStatus, ...] | None = None, limit: int = 10) -> list[str]:
        """Flatten every catalog item's tags_json into a short, de-duplicated
        list — powers the tag-filter chips on both the admin and consumer
        catalog listings. Cheap enough to compute on demand at this scale
        (a handful of hundred items at most).

        Two things this guards against, both real issues an admin typing
        free-text tags will eventually hit: (1) "Python" and "python" (or
        stray leading/trailing whitespace) being treated as two different
        tags just because a `set` compares strings exactly — normalized
        case-insensitively here, keeping the first-seen casing as the
        display form; (2) an unbounded number of distinct tags turning the
        filter bar into a wall of chips — capped to the `limit` most-used
        tags (ties broken alphabetically) rather than an arbitrary alphabetic
        slice, so the chips shown are the ones actually worth filtering by.
        """
        stmt = select(CatalogItem.tags_json).where(CatalogItem.tags_json.is_not(None))
        if statuses is not None:
            stmt = stmt.where(CatalogItem.status.in_(statuses))
        rows = self.db.execute(stmt).scalars().all()

        display_form: dict[str, str] = {}  # casefolded tag -> first-seen display casing
        counts: dict[str, int] = {}
        for row in rows:
            if not row:
                continue
            for raw in row:
                tag = raw.strip() if isinstance(raw, str) else ""
                if not tag:
                    continue
                key = tag.casefold()
                display_form.setdefault(key, tag)
                counts[key] = counts.get(key, 0) + 1

        ranked = sorted(counts.keys(), key=lambda k: (-counts[k], k))[:limit]
        return sorted((display_form[k] for k in ranked), key=str.casefold)
