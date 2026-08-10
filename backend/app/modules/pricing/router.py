from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_super_admin
from app.modules.auth.security_onboarding import require_security_onboarding
from app.models.enums import PricingPlanType
from app.modules.pricing.schemas import (
    AdminPricingPlanListResponse,
    PricingPlanCreate,
    PricingPlanListResponse,
    PricingPlanRead,
    PricingPlanStatusPatch,
    PricingPlanUpdate,
)
from app.modules.pricing.service import PricingPlansService

router = APIRouter(tags=["admin-pricing-plans"])


def require_super_admin(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> User:
    if not is_super_admin(db, user):
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")
    return user


def get_service(db: Session = Depends(get_db)) -> PricingPlansService:
    return PricingPlansService(db)


@router.get("/api/v1/admin/pricing-plans", response_model=AdminPricingPlanListResponse)
def list_all_pricing_plans(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    catalog_item_id: int | None = None,
    plan_type: PricingPlanType | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    _actor: User = Depends(require_super_admin),
    svc: PricingPlansService = Depends(get_service),
):
    return svc.list_all(
        limit=limit,
        offset=offset,
        catalog_item_id=catalog_item_id,
        plan_type=plan_type,
        is_active=is_active,
        search=search,
    )


@router.get(
    "/api/v1/admin/catalog/{catalog_item_id}/pricing-plans",
    response_model=PricingPlanListResponse,
)
def list_item_pricing_plans(
    catalog_item_id: int,
    _actor: User = Depends(require_super_admin),
    svc: PricingPlansService = Depends(get_service),
):
    items = svc.list_for_item(catalog_item_id)
    return PricingPlanListResponse(items=items, catalog_item_id=catalog_item_id)


@router.post(
    "/api/v1/admin/catalog/{catalog_item_id}/pricing-plans",
    response_model=PricingPlanRead,
    status_code=status.HTTP_201_CREATED,
)
def create_item_pricing_plan(
    catalog_item_id: int,
    payload: PricingPlanCreate,
    _actor: User = Depends(require_super_admin),
    svc: PricingPlansService = Depends(get_service),
):
    return svc.create_plan_for_item(catalog_item_id, payload)


@router.post(
    "/api/v1/admin/pricing-plans",
    response_model=PricingPlanRead,
    status_code=status.HTTP_201_CREATED,
)
def create_pricing_plan(
    payload: PricingPlanCreate,
    _actor: User = Depends(require_super_admin),
    svc: PricingPlansService = Depends(get_service),
):
    return svc.create_plan(payload)


@router.get("/api/v1/admin/pricing-plans/{plan_id}", response_model=PricingPlanRead)
def get_pricing_plan(
    plan_id: int,
    _actor: User = Depends(require_super_admin),
    svc: PricingPlansService = Depends(get_service),
):
    return svc.get_plan(plan_id)


@router.put("/api/v1/admin/pricing-plans/{plan_id}", response_model=PricingPlanRead)
def update_pricing_plan(
    plan_id: int,
    payload: PricingPlanUpdate,
    _actor: User = Depends(require_super_admin),
    svc: PricingPlansService = Depends(get_service),
):
    return svc.update_plan(plan_id, payload)


@router.patch("/api/v1/admin/pricing-plans/{plan_id}/status", response_model=PricingPlanRead)
def patch_pricing_plan_status(
    plan_id: int,
    payload: PricingPlanStatusPatch,
    _actor: User = Depends(require_super_admin),
    svc: PricingPlansService = Depends(get_service),
):
    return svc.patch_status(plan_id, payload)


@router.delete("/api/v1/admin/pricing-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pricing_plan(
    plan_id: int,
    _actor: User = Depends(require_super_admin),
    svc: PricingPlansService = Depends(get_service),
):
    svc.delete_plan(plan_id)

