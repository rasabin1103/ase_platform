from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class CatalogPurchase(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "catalog_purchases"
    __table_args__ = (UniqueConstraint("user_id", "catalog_item_id", name="uq_catalog_purchases_user_item"),)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    # Set when this purchase was granted (and paid for) by an organization admin
    # on behalf of the user, instead of a self-service purchase.
    granted_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True,
    )
    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="SET NULL"), index=True, nullable=True,
    )
    # How this access was obtained — "free" (item has no price, or a manual
    # admin grant with no organization_id), "stripe_checkout" (paid via a
    # one-time Stripe Checkout, see app/modules/billing), "plan_entitlement"
    # (included in the user's active paid subscription plan, granted
    # automatically by the subscription webhook), or "admin_grant" (an org
    # admin's replace_all()/manual grant). Informational, but also decides
    # what `permanent_access_granted_at` gets set to when the row is first
    # created — see that column.
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="free", server_default="free")
    # Stripe Checkout Session id, set only when source == "stripe_checkout" —
    # lets support look up the actual payment in the Stripe Dashboard.
    stripe_checkout_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # NULL means this row's access is plan-sourced only ("plan_entitlement")
    # and therefore live — CatalogPurchasesRepository.slugs_for_user() only
    # honors it while BOTH `organization_id` currently has an active/trialing
    # Subscription to a plan that still includes this item AND the user is
    # still an active member of that organization (removed members lose it
    # immediately, since it's the organization's purchase, not theirs). Any
    # other source (free, stripe_checkout, admin_grant) sets this at
    # creation time and grants access for life, independent of any
    # subscription or membership. Also set the moment a direct purchase/
    # grant arrives for an item the user already had via a plan — see
    # CatalogPurchasesRepository.add(). Product decision from Roberto
    # (2026-08-20): direct/individual catalog purchases are permanent;
    # plan-based access ends when the plan is cancelled or the member is
    # removed from the organization, so users are encouraged to download
    # what they want to keep.
    permanent_access_granted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
