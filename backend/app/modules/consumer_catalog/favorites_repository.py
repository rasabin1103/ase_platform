from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.catalog_favorite import CatalogFavorite
from app.models.catalog_item import CatalogItem


class CatalogFavoritesRepository:
    def __init__(self, db: Session):
        self.db = db

    def slugs_for_user(self, user_id: int) -> set[str]:
        stmt = (
            select(CatalogItem.slug)
            .join(CatalogFavorite, CatalogFavorite.catalog_item_id == CatalogItem.id)
            .where(CatalogFavorite.user_id == user_id)
        )
        return set(self.db.execute(stmt).scalars().all())

    def toggle(self, user_id: int, catalog_item_id: int) -> bool:
        existing = self.db.execute(
            select(CatalogFavorite).where(
                CatalogFavorite.user_id == user_id,
                CatalogFavorite.catalog_item_id == catalog_item_id,
            )
        ).scalar_one_or_none()
        if existing:
            self.db.delete(existing)
            self.db.flush()
            return False
        self.db.add(CatalogFavorite(user_id=user_id, catalog_item_id=catalog_item_id))
        self.db.flush()
        return True

    def replace_all(self, user_id: int, catalog_item_ids: list[int]) -> None:
        self.db.execute(delete(CatalogFavorite).where(CatalogFavorite.user_id == user_id))
        for item_id in catalog_item_ids:
            self.db.add(CatalogFavorite(user_id=user_id, catalog_item_id=item_id))
        self.db.flush()
