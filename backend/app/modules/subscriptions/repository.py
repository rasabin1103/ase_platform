from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import SubscriptionStatus
from app.models.organization import Organization
from app.models.plan import Plan
from app.models.subscription import Subscription


class SubscriptionsRepository:
    def __init__(self, db: Session):
        self.db = db

    def organization_exists(self, organization_id: int) -> bool:
        stmt = select(func.count()).select_from(Organization).where(Organization.id == organization_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def get_organization_id(self, *, organization_id: int | None, organization_uuid: UUID | None) -> int | None:
        if organization_id is not None:
            return organization_id
        if organization_uuid is None:
            return None
        stmt = select(Organization.id).where(Organization.uuid == organization_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def plan_exists(self, plan_id: int) -> bool:
        stmt = select(func.count()).select_from(Plan).where(Plan.id == plan_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def get(self, subscription_id: int) -> Subscription | None:
        stmt = select(Subscription).where(Subscription.id == subscription_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        plan_id: int | None = None,
        status: SubscriptionStatus | None = None,
    ) -> tuple[list[Subscription], int]:
        base = select(Subscription)
        if organization_id is not None:
            base = base.where(Subscription.organization_id == organization_id)
        if plan_id is not None:
            base = base.where(Subscription.plan_id == plan_id)
        if status is not None:
            base = base.where(Subscription.status == status)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(Subscription.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, sub: Subscription) -> Subscription:
        self.db.add(sub)
        self.db.flush()
        return sub

