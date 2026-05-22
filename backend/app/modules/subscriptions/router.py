from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import SubscriptionStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_platform_admin, require_permission, require_tenant_context
from app.modules.auth.security_onboarding import require_security_onboarding
from app.modules.subscriptions.schemas import (
    SubscriptionCreate,
    SubscriptionListResponse,
    SubscriptionRead,
    SubscriptionUpdate,
)
from app.modules.subscriptions.service import SubscriptionsService

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


def get_service(db: Session = Depends(get_db)) -> SubscriptionsService:
    return SubscriptionsService(db)


@router.post(
    "",
    response_model=SubscriptionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("subscriptions.manage")), Depends(require_security_onboarding)],
)
def create_subscription(
    payload: SubscriptionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: SubscriptionsService = Depends(get_service),
):
    if not is_platform_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        payload_org_id = svc.repo.get_organization_id(
            organization_id=payload.organization_id,
            organization_uuid=payload.organization_uuid,
        )
        if payload_org_id != org.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization mismatch")
    return svc.create(payload)


@router.get(
    "",
    response_model=SubscriptionListResponse,
    dependencies=[Depends(require_permission("subscriptions.read"))],
)
def list_subscriptions(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    organization_id: int | None = Query(default=None, ge=1),
    organization_uuid: UUID | None = None,
    plan_id: int | None = Query(default=None, ge=1),
    status_filter: SubscriptionStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: SubscriptionsService = Depends(get_service),
):
    if is_platform_admin(db, current_user) and organization_uuid is not None:
        organization_id = svc.repo.get_organization_id(organization_id=None, organization_uuid=organization_uuid)
        if organization_id is None:
            return SubscriptionListResponse(items=[], limit=limit, offset=offset, total=0)
    elif not is_platform_admin(db, current_user):
        organization_id = require_tenant_context(request, db, current_user).id
    items, total = svc.list(
        limit=limit,
        offset=offset,
        organization_id=organization_id,
        plan_id=plan_id,
        status=status_filter,
    )
    return SubscriptionListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get(
    "/{subscription_id}",
    response_model=SubscriptionRead,
    dependencies=[Depends(require_permission("subscriptions.read"))],
)
def get_subscription(
    subscription_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: SubscriptionsService = Depends(get_service),
):
    sub = svc.get(subscription_id)
    if not is_platform_admin(db, current_user) and sub.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return sub


@router.patch(
    "/{subscription_id}",
    response_model=SubscriptionRead,
    dependencies=[Depends(require_permission("subscriptions.manage")), Depends(require_security_onboarding)],
)
def update_subscription(
    subscription_id: int,
    payload: SubscriptionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: SubscriptionsService = Depends(get_service),
):
    if not is_platform_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        sub = svc.get(subscription_id)
        if sub.organization_id != org.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
        if "organization_id" in payload.model_fields_set or "organization_uuid" in payload.model_fields_set:
            payload_org_id = svc.repo.get_organization_id(
                organization_id=payload.organization_id,
                organization_uuid=payload.organization_uuid,
            )
            if payload_org_id != org.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization mismatch")
    return svc.update(subscription_id, payload)


@router.delete(
    "/{subscription_id}",
    response_model=SubscriptionRead,
    dependencies=[Depends(require_permission("subscriptions.manage")), Depends(require_security_onboarding)],
)
def delete_subscription(
    subscription_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: SubscriptionsService = Depends(get_service),
):
    sub = svc.get(subscription_id)
    if not is_platform_admin(db, current_user) and sub.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return svc.cancel(subscription_id)


