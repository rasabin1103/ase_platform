from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class CatalogItemImage(Base, IdPkMixin, TimestampMixin):
    """One image belonging to a catalog item's gallery.

    Exactly one image per catalog item should have ``is_cover=True`` — that is
    the thumbnail shown on cards/lists. All other images are shown as a
    carousel on the item's detail view. An image is either an uploaded blob
    (``image_data``/``image_mime``) or an external URL (``image_url``) — never
    both, mirroring the legacy single-image fields on ``CatalogItem``.
    """

    __tablename__ = "catalog_item_images"

    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    image_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    image_mime: Mapped[str | None] = mapped_column(String(64), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    is_cover: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    catalog_item: Mapped["CatalogItem"] = relationship("CatalogItem", back_populates="images")

    def __repr__(self) -> str:
        return f"<CatalogItemImage id={self.id} catalog_item_id={self.catalog_item_id} is_cover={self.is_cover}>"
