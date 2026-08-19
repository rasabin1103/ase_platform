from __future__ import annotations

from sqlalchemy import ForeignKey, String, UniqueConstraint
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
    # admin's replace_all()/manual grant). Purely informational — used for
    # admin visibility and metrics, never for access control itself (a row
    # existing at all means access is granted, regardless of source).
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="free", server_default="free")
    # Stripe Checkout Session id, set only when source == "stripe_checkout" —
    # lets support look up the actual payment in the Stripe Dashboard.
    stripe_checkout_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
