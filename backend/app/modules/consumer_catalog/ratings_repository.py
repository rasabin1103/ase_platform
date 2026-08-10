from __future__ import annotations

from collections import Counter

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.catalog_item_rating import CatalogItemRating

# Fixed vocabulary of impact tags — deliberately not stars. Any tag not in
# this set is silently dropped by the service layer before saving.
IMPACT_TAGS: tuple[str, ...] = (
    "saves_time",
    "high_quality",
    "easy_to_apply",
    "great_support",
    "worth_price",
    "too_technical",
    "outdated",
    "not_worth_price",
)


class RatingSummary:
    __slots__ = ("upvotes", "downvotes", "top_tags")

    def __init__(self, upvotes: int = 0, downvotes: int = 0, top_tags: list[str] | None = None):
        self.upvotes = upvotes
        self.downvotes = downvotes
        self.top_tags = top_tags or []

    @property
    def net_score(self) -> int:
        return self.upvotes - self.downvotes


class CatalogItemRatingsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, *, user_id: int, catalog_item_id: int) -> CatalogItemRating | None:
        stmt = select(CatalogItemRating).where(
            CatalogItemRating.user_id == user_id,
            CatalogItemRating.catalog_item_id == catalog_item_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def upsert(self, *, user_id: int, catalog_item_id: int, is_positive: bool, tags: list[str]) -> CatalogItemRating:
        row = self.get(user_id=user_id, catalog_item_id=catalog_item_id)
        if row is None:
            row = CatalogItemRating(
                user_id=user_id,
                catalog_item_id=catalog_item_id,
                is_positive=is_positive,
                tags_json=tags,
            )
            self.db.add(row)
        else:
            row.is_positive = is_positive
            row.tags_json = tags
        self.db.flush()
        return row

    def remove(self, *, user_id: int, catalog_item_id: int) -> bool:
        row = self.get(user_id=user_id, catalog_item_id=catalog_item_id)
        if row is None:
            return False
        self.db.delete(row)
        self.db.flush()
        return True

    def my_ratings_for_items(self, *, user_id: int, catalog_item_ids: list[int]) -> dict[int, CatalogItemRating]:
        if not catalog_item_ids:
            return {}
        stmt = select(CatalogItemRating).where(
            CatalogItemRating.user_id == user_id,
            CatalogItemRating.catalog_item_id.in_(catalog_item_ids),
        )
        return {r.catalog_item_id: r for r in self.db.execute(stmt).scalars().all()}

    def summaries_for_items(self, *, catalog_item_ids: list[int]) -> dict[int, RatingSummary]:
        if not catalog_item_ids:
            return {}
        stmt = (
            select(
                CatalogItemRating.catalog_item_id,
                func.sum(case((CatalogItemRating.is_positive.is_(True), 1), else_=0)),
                func.sum(case((CatalogItemRating.is_positive.is_(False), 1), else_=0)),
            )
            .where(CatalogItemRating.catalog_item_id.in_(catalog_item_ids))
            .group_by(CatalogItemRating.catalog_item_id)
        )
        summaries: dict[int, RatingSummary] = {}
        for item_id, up, down in self.db.execute(stmt).all():
            summaries[item_id] = RatingSummary(upvotes=int(up or 0), downvotes=int(down or 0))

        tags_stmt = select(CatalogItemRating.catalog_item_id, CatalogItemRating.tags_json).where(
            CatalogItemRating.catalog_item_id.in_(catalog_item_ids)
        )
        tag_counters: dict[int, Counter] = {}
        for item_id, tags in self.db.execute(tags_stmt).all():
            if not tags:
                continue
            tag_counters.setdefault(item_id, Counter()).update(tags)
        for item_id, counter in tag_counters.items():
            if item_id in summaries:
                summaries[item_id].top_tags = [tag for tag, _ in counter.most_common(3)]

        return summaries

    def net_score_subquery(self):
        """Subquery of (catalog_item_id, net_score) for ORDER BY use in the main catalog query."""
        return (
            select(
                CatalogItemRating.catalog_item_id.label("catalog_item_id"),
                func.sum(
                    case((CatalogItemRating.is_positive.is_(True), 1), else_=-1)
                ).label("net_score"),
            )
            .group_by(CatalogItemRating.catalog_item_id)
            .subquery()
        )
