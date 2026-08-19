from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ServiceCategory, ServiceKind, ServicePriceType
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.service_feature import ServiceFeature
    from app.models.service_highlight import ServiceHighlight


class Service(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    __tablename__ = "services"

    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)

    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[ServiceCategory] = mapped_column(
        Enum(ServiceCategory, name="service_category", native_enum=True),
        nullable=False,
        index=True,
    )
    service_type: Mapped[ServiceKind] = mapped_column(
        Enum(ServiceKind, name="service_kind", native_enum=True),
        nullable=False,
        index=True,
    )
    price_type: Mapped[ServicePriceType] = mapped_column(
        Enum(ServicePriceType, name="service_price_type", native_enum=True),
        nullable=False,
        default=ServicePriceType.custom,
    )

    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true", index=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0", index=True)

    icon: Mapped[str | None] = mapped_column(String(64), nullable=True)
    hero_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    hero_subtitle: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Services historically had no numeric price (price_type == "custom"
    # meant "contact us for a quote"). This stays optional/nullable so that
    # flow keeps working unchanged — it's populated only when an admin sets
    # a concrete price, typically from the pricing engine's recommendation.
    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # --- Pricing engine (see app/core/pricing_engine.py) --------------------
    # Every "subelemento" (horas, complejidad, especialización...) is just a
    # PricingDimensionType for the service pillar — no separate subcategory
    # concept. Selections live in ServiceDimensionSelection, one row per
    # type — see that model. Drives auto-matching of the range-based "Horas"
    # dimension type, same role as CatalogItem.page_count for books.
    estimated_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recommended_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    features: Mapped[list["ServiceFeature"]] = relationship(
        back_populates="service",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ServiceFeature.display_order",
    )
    highlights: Mapped[list["ServiceHighlight"]] = relationship(
        back_populates="service",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ServiceHighlight.display_order",
    )
    dimension_selections: Mapped[list["ServiceDimensionSelection"]] = relationship(
        "ServiceDimensionSelection",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
