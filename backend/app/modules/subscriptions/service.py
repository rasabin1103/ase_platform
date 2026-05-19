from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import SubscriptionStatus
from app.models.subscription import Subscription
from app.modules.subscriptions.repository import SubscriptionsRepository
from app.modules.subscriptions.schemas import SubscriptionCreate, SubscriptionUpdate


class SubscriptionsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SubscriptionsRepository(db)

    def create(self, payload: SubscriptionCreate) -> Subscription:
        org_id = self.repo.get_organization_id(
            organization_id=payload.organization_id, organization_uuid=payload.organization_uuid
        )
        if org_id is None or not self.repo.organization_exists(org_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization not found")
        if not self.repo.plan_exists(payload.plan_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan not found")

        sub = Subscription(
            organization_id=org_id,
            plan_id=payload.plan_id,
            provider=payload.provider,
            provider_subscription_id=payload.provider_subscription_id,
            status=payload.status,
            starts_at=payload.starts_at,
            ends_at=payload.ends_at,
            trial_ends_at=payload.trial_ends_at,
        )

        self.repo.add(sub)
        self.db.commit()
        self.db.refresh(sub)
        return sub

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None,
        plan_id: int | None,
        status: SubscriptionStatus | None,
    ) -> tuple[list[Subscription], int]:
        return self.repo.list(
            limit=limit,
            offset=offset,
            organization_id=organization_id,
            plan_id=plan_id,
            status=status,
        )

    def get(self, subscription_id: int) -> Subscription:
        sub = self.repo.get(subscription_id)
        if sub is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
        return sub

    def update(self, subscription_id: int, payload: SubscriptionUpdate) -> Subscription:
        sub = self.get(subscription_id)
        fields_set = payload.model_fields_set

        if "organization_id" in fields_set or "organization_uuid" in fields_set:
            org_id = self.repo.get_organization_id(
                organization_id=payload.organization_id, organization_uuid=payload.organization_uuid
            )
            if org_id is None or not self.repo.organization_exists(org_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization not found")
            sub.organization_id = org_id

        if payload.plan_id is not None and payload.plan_id != sub.plan_id:
            if not self.repo.plan_exists(payload.plan_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan not found")
            sub.plan_id = payload.plan_id

        if payload.provider is not None:
            sub.provider = payload.provider
        if "provider_subscription_id" in fields_set:
            sub.provider_subscription_id = payload.provider_subscription_id
        if payload.status is not None:
            sub.status = payload.status
        if payload.starts_at is not None:
            sub.starts_at = payload.starts_at
        if "ends_at" in fields_set:
            sub.ends_at = payload.ends_at
        if "trial_ends_at" in fields_set:
            sub.trial_ends_at = payload.trial_ends_at

        self.db.commit()
        self.db.refresh(sub)
        return sub

    def cancel(self, subscription_id: int) -> Subscription:
        sub = self.get(subscription_id)
        sub.status = SubscriptionStatus.canceled
        self.db.commit()
        self.db.refresh(sub)
        return sub

