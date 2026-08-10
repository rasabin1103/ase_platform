from __future__ import annotations

from typing import Any

from sqlalchemy import Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class CatalogItemRating(Base, IdPkMixin, TimestampMixin):
    """Thumbs up/down + impact tags feedback on a catalog item — deliberately
    not a star rating. Used both for qualitative feedback and for ranking
    ("best rated") across the catalog. One vote per user per item."""

    __tablename__ = "catalog_item_ratings"
    __table_args__ = (
        UniqueConstraint("user_id", "catalog_item_id", name="uq_catalog_item_ratings_user_item"),
    )

    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    is_positive: Mapped[bool] = mapped_column(Boolean, nullable=False)
    tags_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
