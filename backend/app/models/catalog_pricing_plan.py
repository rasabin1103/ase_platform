from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import PricingBillingInterval, PricingPlanType, PricingSupportLevel
from app.models.mixins import IdPkMixin, TimestampMixin


class CatalogPricingPlan(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "catalog_pricing_plans"
    __table_args__ = (
        UniqueConstraint("catalog_item_id", "slug", name="uq_catalog_pricing_plans_item_slug"),
        CheckConstraint("price >= 0", name="ck_catalog_pricing_plans_price_nonneg"),
        CheckConstraint("setup_fee >= 0", name="ck_catalog_pricing_plans_setup_fee_nonneg"),
        CheckConstraint(
            "discount_percentage >= 0 AND discount_percentage <= 100",
            name="ck_catalog_pricing_plans_discount_pct",
        ),
    )

    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    plan_type: Mapped[PricingPlanType] = mapped_column(
        Enum(PricingPlanType, name="pricing_plan_type", native_enum=True),
        nullable=False,
        index=True,
    )
    billing_interval: Mapped[PricingBillingInterval] = mapped_column(
        Enum(PricingBillingInterval, name="pricing_billing_interval", native_enum=True),
        nullable=False,
        default=PricingBillingInterval.none,
    )
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")
    trial_days: Mapped[int | None] = mapped_column(Integer)
    setup_fee: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    discount_percentage: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    max_users: Mapped[int | None] = mapped_column(Integer)
    max_downloads: Mapped[int | None] = mapped_column(Integer)
    access_duration_days: Mapped[int | None] = mapped_column(Integer)
    includes_updates: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    includes_support: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    support_level: Mapped[PricingSupportLevel] = mapped_column(
        Enum(PricingSupportLevel, name="pricing_support_level", native_enum=True),
        nullable=False,
        default=PricingSupportLevel.none,
    )
    features: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    limitations: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    stripe_price_id: Mapped[str | None] = mapped_column(String(255))
    stripe_product_id: Mapped[str | None] = mapped_column(String(255))

    catalog_item: Mapped["CatalogItem"] = relationship("CatalogItem", back_populates="pricing_plans")

    def __repr__(self) -> str:
        return f"<CatalogPricingPlan id={self.id} slug={self.slug!r} item_id={self.catalog_item_id}>"
