from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class ResourceView(Base, IdPkMixin, TimestampMixin):
    """One row per (user, catalog_item) the user has actually opened —
    upserted every time they view the in-platform content, download it, or
    play an audiobook chapter (see ConsumerCatalogService._record_resource_view).
    Powers the "continue where you left off" strip on the independent
    dashboard: `last_opened_at` is bumped on every open, so ordering by it
    descending gives the user's most recently used items. Never created for
    a non-owner's preview — only counts real access to owned content."""

    __tablename__ = "resource_views"
    __table_args__ = (UniqueConstraint("user_id", "catalog_item_id", name="uq_resource_views_user_item"),)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False
    )
    last_opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    open_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
