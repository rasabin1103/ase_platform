from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin


class CatalogDownloadEvent(Base, IdPkMixin):
    """One row per real file download actually served (never for a preview,
    never for the in-platform viewer — see
    ConsumerCatalogService.download_resource) — a plain append-only log,
    unlike ResourceView's upsert-per-pair "last opened" row, because a
    plan's monthly download quota needs to count events *within the current
    calendar month specifically*, not just a running total. See
    app.modules.plans.quota for how this is counted against
    Plan.monthly_download_limit."""

    __tablename__ = "catalog_download_events"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    catalog_item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False
    )
    downloaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    def __repr__(self) -> str:
        return (
            f"<CatalogDownloadEvent id={self.id} user_id={self.user_id} "
            f"catalog_item_id={self.catalog_item_id} downloaded_at={self.downloaded_at.isoformat()}>"
        )
