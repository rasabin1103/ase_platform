from __future__ import annotations

from typing import Any

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, SmallInteger, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class CatalogItemRating(Base, IdPkMixin, TimestampMixin):
    """One row per user per catalog item, holding two independent, optional
    kinds of feedback: the original thumbs up/down + impact tags
    (`is_positive`/`tags_json`, still used for the compact rating widget on
    catalog cards), and a full review — star rating + free-text comment
    (`rating`/`comment`, gated to users who actually own the item — see
    ConsumerCatalogService.submit_review). Either half can be present without
    the other; both share the row purely because they're both "this user's
    feedback on this item" and the (user_id, catalog_item_id) uniqueness
    should only be enforced once."""

    __tablename__ = "catalog_item_ratings"
    __table_args__ = (
        UniqueConstraint("user_id", "catalog_item_id", name="uq_catalog_item_ratings_user_item"),
        CheckConstraint("rating IS NULL OR rating BETWEEN 1 AND 5", name="ck_catalog_item_ratings_rating_range"),
    )

    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    is_positive: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    tags_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    # Star review (1-5) + free-text comment — see class docstring.
    rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
