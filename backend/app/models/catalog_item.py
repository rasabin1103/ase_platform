from __future__ import annotations

from decimal import Decimal

from typing import Any

from sqlalchemy import Enum, LargeBinary, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class CatalogItem(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """Marketplace catalog entry for independent consumers (products, courses, books, resources)."""

    __tablename__ = "catalog_items"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    type: Mapped[CatalogItemType] = mapped_column(
        Enum(CatalogItemType, name="catalog_item_type", native_enum=True),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    short_description: Mapped[str] = mapped_column(String(500), nullable=False)
    long_description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    image_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    image_mime: Mapped[str | None] = mapped_column(String(64))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")
    status: Mapped[CatalogItemStatus] = mapped_column(
        Enum(CatalogItemStatus, name="catalog_item_status", native_enum=True),
        nullable=False,
        default=CatalogItemStatus.published,
        index=True,
    )
    level: Mapped[CatalogItemLevel] = mapped_column(
        Enum(CatalogItemLevel, name="catalog_item_level", native_enum=True),
        nullable=False,
        default=CatalogItemLevel.intermediate,
    )
    duration: Mapped[str | None] = mapped_column(String(80))
    author: Mapped[str] = mapped_column(String(200), nullable=False)
    preview_url: Mapped[str | None] = mapped_column(String(2048))
    benefits_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    requirements_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    included_items_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)

    def __repr__(self) -> str:
        return f"<CatalogItem id={self.id} slug={self.slug!r} type={self.type.value}>"
