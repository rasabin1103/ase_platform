from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class CatalogItemImage(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "catalog_item_images"

    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(500))
    title: Mapped[str | None] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    catalog_item: Mapped["CatalogItem"] = relationship("CatalogItem", back_populates="images")
