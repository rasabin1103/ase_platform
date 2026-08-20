from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import and_, delete, exists, or_, select
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import MembershipStatus, SubscriptionStatus
from app.models.organization_member import OrganizationMember
from app.models.plan_catalog_item import PlanCatalogItem
from app.models.subscription import Subscription

_LIVE_SUBSCRIPTION_STATUSES = (SubscriptionStatus.active, SubscriptionStatus.trialing)


class CatalogPurchasesRepository:
    def __init__(self, db: Session):
        self.db = db

    def slugs_for_user(self, user_id: int) -> set[str]:
        """A row counts as access either if it's permanent (direct purchase,
        admin grant, or free claim — granted for life, stays with the user
        regardless of their organization membership), or, for a
        plan-sourced row, only while BOTH of these are true right now: (1)
        the organization still has an active/trialing subscription to a
        plan that includes this item, and (2) the user is still an active
        member of that organization. Everything the organization bought is
        the organization's — a member who is removed (membership suspended)
        immediately loses plan-granted access even if the subscription
        itself is untouched; a member who stays just keeps it as long as
        the org keeps paying. Nothing is deleted on cancellation/removal —
        access just stops showing up here, and resumes automatically if the
        subscription or the membership is reactivated."""
        live_subscription = exists(
            select(1)
            .select_from(Subscription)
            .join(PlanCatalogItem, PlanCatalogItem.plan_id == Subscription.plan_id)
            .where(
                Subscription.organization_id == CatalogPurchase.organization_id,
                Subscription.status.in_(_LIVE_SUBSCRIPTION_STATUSES),
                PlanCatalogItem.catalog_item_id == CatalogPurchase.catalog_item_id,
            )
        )
        active_membership = exists(
            select(1)
            .select_from(OrganizationMember)
            .where(
                OrganizationMember.organization_id == CatalogPurchase.organization_id,
                OrganizationMember.user_id == CatalogPurchase.user_id,
                OrganizationMember.membership_status == MembershipStatus.active,
            )
        )
        stmt = (
            select(CatalogItem.slug)
            .join(CatalogPurchase, CatalogPurchase.catalog_item_id == CatalogItem.id)
            .where(
                CatalogPurchase.user_id == user_id,
                or_(
                    CatalogPurchase.permanent_access_granted_at.isnot(None),
                    and_(live_subscription, active_membership),
                ),
            )
        )
        return set(self.db.execute(stmt).scalars().all())

    def add(
        self,
        user_id: int,
        catalog_item_id: int,
        *,
        granted_by_user_id: int | None = None,
        organization_id: int | None = None,
        source: str = "free",
        stripe_checkout_session_id: str | None = None,
    ) -> bool:
        """Returns True if a new purchase row was created, or an existing
        plan-only row was upgraded to permanent access. Returns False if the
        user already had this exact grant (already permanent, or already
        plan-entitled and the new grant is itself just another plan
        entitlement — nothing changes either way).

        Every source except "plan_entitlement" grants access for life
        (permanent_access_granted_at is set immediately). A plan-entitlement
        never downgrades an existing permanent grant, but a direct
        grant/purchase arriving for an item the user already had only via a
        plan DOES upgrade that row to permanent — this is what makes a real
        Stripe payment on top of plan-granted access actually count, instead
        of being silently discarded because a row already existed."""
        existing = self.db.execute(
            select(CatalogPurchase).where(
                CatalogPurchase.user_id == user_id,
                CatalogPurchase.catalog_item_id == catalog_item_id,
            )
        ).scalar_one_or_none()

        if existing is None:
            self.db.add(
                CatalogPurchase(
                    user_id=user_id,
                    catalog_item_id=catalog_item_id,
                    granted_by_user_id=granted_by_user_id,
                    organization_id=organization_id,
                    source=source,
                    stripe_checkout_session_id=stripe_checkout_session_id,
                    permanent_access_granted_at=(
                        None if source == "plan_entitlement" else datetime.now(timezone.utc)
                    ),
                )
            )
            self.db.flush()
            return True

        if existing.permanent_access_granted_at is not None:
            return False  # already permanent — never downgraded by a later plan entitlement

        if source == "plan_entitlement":
            return False  # still plan-only, no change

        existing.permanent_access_granted_at = datetime.now(timezone.utc)
        existing.source = source
        existing.granted_by_user_id = granted_by_user_id
        existing.stripe_checkout_session_id = stripe_checkout_session_id
        self.db.flush()
        return True

    def replace_all(self, user_id: int, catalog_item_ids: list[int]) -> None:
        self.db.execute(delete(CatalogPurchase).where(CatalogPurchase.user_id == user_id))
        now = datetime.now(timezone.utc)
        for item_id in catalog_item_ids:
            self.db.add(
                CatalogPurchase(user_id=user_id, catalog_item_id=item_id, permanent_access_granted_at=now)
            )
        self.db.flush()
