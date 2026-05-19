from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase


class CatalogPurchasesRepository:
    def __init__(self, db: Session):
        self.db = db

    def slugs_for_user(self, user_id: int) -> set[str]:
        stmt = (
            select(CatalogItem.slug)
            .join(CatalogPurchase, CatalogPurchase.catalog_item_id == CatalogItem.id)
            .where(CatalogPurchase.user_id == user_id)
        )
        return set(self.db.execute(stmt).scalars().all())

    def add(self, user_id: int, catalog_item_id: int) -> None:
        existing = self.db.execute(
            select(CatalogPurchase).where(
                CatalogPurchase.user_id == user_id,
                CatalogPurchase.catalog_item_id == catalog_item_id,
            )
        ).scalar_one_or_none()
        if existing:
            return
        self.db.add(CatalogPurchase(user_id=user_id, catalog_item_id=catalog_item_id))
        self.db.flush()

    def replace_all(self, user_id: int, catalog_item_ids: list[int]) -> None:
        self.db.execute(delete(CatalogPurchase).where(CatalogPurchase.user_id == user_id))
        for item_id in catalog_item_ids:
            self.db.add(CatalogPurchase(user_id=user_id, catalog_item_id=item_id))
        self.db.flush()
