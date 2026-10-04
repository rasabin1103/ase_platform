from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import BillingCycle, PlanStatus
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.plan_catalog_item import PlanCatalogItem
    from app.models.plan_catalog_item_discount import PlanCatalogItemDiscount
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
    # Source of truth the admin edits from now on — is_active above is kept
    # in sync automatically by PlansService (active/coming_soon -> True,
    # inactive -> False) so every existing is_active-based query (public
    # catalog listing, billing checkout guard, admin filters) keeps working
    # unchanged. coming_soon is the only state where the two diverge in
    # meaning: is_active=True (still shown publicly) but not purchasable —
    # see PlanStatus's docstring and BillingService.create_checkout_session.
    status: Mapped[PlanStatus] = mapped_column(
        Enum(PlanStatus, name="plan_status", native_enum=True),
        nullable=False,
        default=PlanStatus.active,
        server_default=PlanStatus.active.value,
    )

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

    # --- Download quota / loyalty / discounts ---------------------------
    # Total downloads/month a subscriber may make across any *included*
    # catalog item — never gates in-platform viewing, only the actual file
    # download (see ConsumerCatalogService.download_resource and
    # app.modules.plans.quota). NULL means no quota is tracked at all
    # (unlimited downloads), which is also what every plan defaults to, so
    # existing plans behave exactly as before until an admin opts in.
    monthly_download_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # AI job-fit analyses a subscriber may run per calendar month (see
    # app.modules.plans.ai_quota). NULL = unlimited. Users with no active
    # subscription fall back to settings.AI_ANALYSIS_FREE_MONTHLY_LIMIT.
    monthly_ai_analysis_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Extra downloads granted on top of monthly_download_limit for whichever
    # calendar month a loyalty milestone falls in — see
    # loyalty_bonus_interval_months and app.modules.plans.quota's
    # _loyalty_bonus_for_month. NULL/0 means no loyalty bonus configured.
    loyalty_bonus_downloads: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Every how many full months of subscription tenure the loyalty bonus
    # above is granted (e.g. 3 = every 3rd month of being subscribed).
    loyalty_bonus_interval_months: Mapped[int | None] = mapped_column(Integer, nullable=True)

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
    # Per-item discounts on catalog items this plan does NOT include — a
    # subscriber benefit for buying other things separately (see
    # BillingService.checkout_catalog_item). Distinct from
    # included_catalog_items, which are already free to the subscriber.
    discounted_catalog_items: Mapped[list["PlanCatalogItemDiscount"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Plan id={self.id} code={self.code!r} billing_cycle={self.billing_cycle.value} active={self.is_active}>"

