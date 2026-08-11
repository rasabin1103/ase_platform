from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.book_repo_redemption import BookRepoRedemption
from app.models.catalog_item import CatalogItem


class BookRedemptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_book_by_code(self, code: str) -> CatalogItem | None:
        # Exact case-insensitive match (not ILIKE) so literal `%`/`_` in a
        # pasted code are never treated as SQL wildcards.
        normalized = code.strip()
        if not normalized:
            return None
        return self.db.execute(
            select(CatalogItem).where(
                CatalogItem.repo_redeem_code.isnot(None),
                func.lower(CatalogItem.repo_redeem_code) == normalized.lower(),
            )
        ).scalar_one_or_none()

    def get_redemption(self, *, user_id: int, catalog_item_id: int) -> BookRepoRedemption | None:
        """Only meaningful for signed-in users — anonymous redemptions have
        no identity to look up by, so every anonymous call always logs a new
        row instead (see `create_redemption`)."""
        return self.db.execute(
            select(BookRepoRedemption).where(
                BookRepoRedemption.user_id == user_id,
                BookRepoRedemption.catalog_item_id == catalog_item_id,
            )
        ).scalar_one_or_none()

    def create_redemption(
        self, *, user_id: int | None, catalog_item_id: int, github_username: str
    ) -> BookRepoRedemption:
        redemption = BookRepoRedemption(
            user_id=user_id, catalog_item_id=catalog_item_id, github_username=github_username,
        )
        self.db.add(redemption)
        self.db.flush()
        return redemption

    def list_for_user(self, user_id: int) -> list[tuple[BookRepoRedemption, CatalogItem]]:
        rows = self.db.execute(
            select(BookRepoRedemption, CatalogItem)
            .join(CatalogItem, CatalogItem.id == BookRepoRedemption.catalog_item_id)
            .where(BookRepoRedemption.user_id == user_id)
            .order_by(BookRepoRedemption.created_at.desc())
        ).all()
        return [(redemption, item) for redemption, item in rows]
