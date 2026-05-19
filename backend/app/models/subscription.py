from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import SubscriptionProvider, SubscriptionStatus
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.plan import Plan


class Subscription(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "subscriptions"

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

    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organization: Mapped["Organization"] = relationship(back_populates="subscriptions")
    plan: Mapped["Plan"] = relationship(back_populates="subscriptions")

    def __repr__(self) -> str:
        return (
            f"<Subscription id={self.id} org_id={self.organization_id} plan_id={self.plan_id} "
            f"status={self.status.value} provider={self.provider.value}>"
        )

