from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import SubscriptionProvider, SubscriptionStatus
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.plan import Plan


class Subscription(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "subscriptions"

    # Overrides TimestampMixin's plain created_at with an indexed one: the
    # admin dashboard's "plan signups" trend chart and month-over-month
    # comparison both filter/group on this column on every dashboard load.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("plans.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    provider: Mapped[SubscriptionProvider] = mapped_column(
        Enum(SubscriptionProvider, name="subscription_provider", native_enum=True),
        nullable=False,
        default=SubscriptionProvider.manual,
        index=True,
    )
    provider_subscription_id: Mapped[str | None] = mapped_column(String(200), index=True)

    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, name="subscription_status", native_enum=True),
        nullable=False,
        default=SubscriptionStatus.active,
        index=True,
    )

    # Current billing period start — set once at subscription creation and
    # never touched again by the webhook handler (see
    # BillingService._upsert_subscription_from_stripe), so despite the name
    # this stays a stable "subscribed since" date rather than drifting
    # forward on every renewal.
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Only set once Stripe reports a scheduled cancellation (`cancel_at`) —
    # null the whole time a subscription is auto-renewing normally. When
    # set, this is the date access actually stops.
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Stripe's `current_period_end` — refreshed on every webhook update, so
    # this is always "when the next charge happens" for an auto-renewing
    # subscription, or "when access ends" once cancel_at_period_end is set
    # (Stripe sets current_period_end == cancel_at in that case, so ends_at
    # and this converge).
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organization: Mapped["Organization"] = relationship(back_populates="subscriptions")
    plan: Mapped["Plan"] = relationship(back_populates="subscriptions")

    def __repr__(self) -> str:
        return (
            f"<Subscription id={self.id} org_id={self.organization_id} plan_id={self.plan_id} "
            f"status={self.status.value} provider={self.provider.value}>"
        )

