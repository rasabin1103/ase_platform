from __future__ import annotations

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class CatalogFavorite(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "catalog_favorites"
    __table_args__ = (UniqueConstraint("user_id", "catalog_item_id", name="uq_catalog_favorites_user_item"),)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
