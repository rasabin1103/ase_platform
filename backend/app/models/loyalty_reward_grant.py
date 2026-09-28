from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class LoyaltyRewardGrant(Base, IdPkMixin, TimestampMixin):
    """One loyalty-bonus reward actually granted to an organization's plan
    subscription — created the first time app.modules.plans.quota notices a
    milestone month (Plan.loyalty_bonus_interval_months) has been reached
    for that subscription (see _ensure_current_milestone_grant). Unlike the
    old stateless "recompute the bonus fresh every calendar month" design,
    a grant is real, persisted state: it stays usable for exactly 60 days
    from the moment it's granted (`expires_at`), independent of calendar
    month boundaries — a reward earned on the 28th isn't lost 2 days later
    when the month rolls over.

    `downloads_consumed` only ever increases, one unit at a time, and only
    once the subscription's own monthly_download_limit for the CURRENT
    calendar month has been fully used up (see record_download_event) — a
    grant is a fallback pool, never drawn from while base quota remains.
    """

    __tablename__ = "loyalty_reward_grants"
    __table_args__ = (
        UniqueConstraint(
            "organization_id", "plan_id", "milestone_elapsed_months", name="uq_loyalty_grant_milestone"
        ),
    )

    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("plans.id", ondelete="CASCADE"), index=True, nullable=False)
    # Full months elapsed since the subscription's starts_at at the moment
    # this milestone was reached (see quota._loyalty_bonus_for_month's same
    # math) — the uniqueness key that makes granting idempotent: the same
    # milestone can never be granted twice for one subscription/plan pair,
    # even under concurrent requests (DB unique constraint, not just an
    # app-level check).
    milestone_elapsed_months: Mapped[int] = mapped_column(Integer, nullable=False)
    downloads_granted: Mapped[int] = mapped_column(Integer, nullable=False)
    downloads_consumed: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # granted_at + 60 days, computed once at grant time — a fixed reward
    # window, not tied to any future recalculation.
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    def __repr__(self) -> str:
        return (
            f"<LoyaltyRewardGrant id={self.id} org_id={self.organization_id} plan_id={self.plan_id} "
            f"granted={self.downloads_granted} consumed={self.downloads_consumed} "
            f"expires_at={self.expires_at.isoformat()}>"
        )
