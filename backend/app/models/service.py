from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, Integer, String, Text
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
