from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import BookPurchasePlatform
from app.models.mixins import IdPkMixin, TimestampMixin


class BookPurchaseLink(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "book_purchase_links"
    __table_args__ = (
        UniqueConstraint("catalog_item_id", "platform", "url", name="uq_book_purchase_platform_url"),
    )

    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform: Mapped[BookPurchasePlatform] = mapped_column(
        Enum(BookPurchasePlatform, name="book_purchase_platform", native_enum=True),
        nullable=False,
    )
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    currency: Mapped[str | None] = mapped_column(String(3))
    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    country: Mapped[str | None] = mapped_column(String(2))
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    catalog_item: Mapped["CatalogItem"] = relationship("CatalogItem", back_populates="purchase_links")
