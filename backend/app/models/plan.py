from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import BillingCycle
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.plan_catalog_item import PlanCatalogItem
    from app.models.plan_feature import PlanFeature
    from app.models.plan_product import PlanProduct
    from app.models.subscription import Subscription


class Plan(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "plans"

    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # English mirror of name/short_description/description/cta_label, so the
    # public site can show a real translation instead of Spanish text when
    # the visitor's language is English. Auto-filled by app.core.translation
    # (DeepL API, free "Developer" tier) on create/update when
    # DEEPL_API_KEY is configured — see PlansService._ensure_english_fields;
    # the admin can always override any of them by hand from the Plans edit
    # form.
    name_en: Mapped[str | None] = mapped_column(String(200), nullable=True)

    billing_cycle: Mapped[BillingCycle] = mapped_column(
        Enum(BillingCycle, name="billing_cycle", native_enum=True),
        nullable=False,
        default=BillingCycle.monthly,
    )

    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    short_description_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0", index=True)
    is_recommended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    cta_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cta_label_en: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Stripe Price id (e.g. "price_...") this plan's subscription checkout
    # should use. Null means the plan isn't (yet) sellable via Stripe — the
    # billing module falls back to a clear error rather than guessing.
    stripe_price_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="plan")
    products: Mapped[list["PlanProduct"]] = relationship(
        back_populates="plan",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )
    features: Mapped[list["PlanFeature"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PlanFeature.display_order",
    )
    # What the plan includes, as real catalog items — replaces the old
    # free-text features bullets for anything created going forward.
    # `features` above is kept only so any pre-existing plan data still
    # reads back without breaking.
    included_catalog_items: Mapped[list["PlanCatalogItem"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PlanCatalogItem.display_order",
    )

    def __repr__(self) -> str:
        return f"<Plan id={self.id} code={self.code!r} billing_cycle={self.billing_cycle.value} active={self.is_active}>"

