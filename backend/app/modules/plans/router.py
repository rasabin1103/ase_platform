from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import BillingCycle
from app.modules.auth.dependencies import require_permission, require_platform_role
from app.modules.plans.schemas import PlanCreate, PlanListResponse, PlanRead, PlanUpdate
from app.modules.plans.service import PlansService

router = APIRouter(prefix="/api/v1/plans", tags=["plans"])


def get_service(db: Session = Depends(get_db)) -> PlansService:
    return PlansService(db)


@router.post(
    "",
    response_model=PlanRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_platform_role("super_admin"))],
)
def create_plan(payload: PlanCreate, svc: PlansService = Depends(get_service)):
    return svc.create(payload)


@router.get("", response_model=PlanListResponse, dependencies=[Depends(require_permission("billing.manage"))])
def list_plans(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    is_active: bool | None = None,
    billing_cycle: BillingCycle | None = None,
    svc: PlansService = Depends(get_service),
):
    items, total = svc.list(limit=limit, offset=offset, is_active=is_active, billing_cycle=billing_cycle)
    return PlanListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/catalog", response_model=PlanListResponse)
def list_plans_public_catalog(
    limit: int = Query(default=200, ge=1, le=200),
    svc: PlansService = Depends(get_service),
):
    """Active plans only, no auth — for public marketing / pricing UI."""
    items, total = svc.list(limit=limit, offset=0, is_active=True, billing_cycle=None)
    return PlanListResponse(items=items, limit=limit, offset=0, total=total)


@router.get("/{plan_id}", response_model=PlanRead, dependencies=[Depends(require_permission("billing.manage"))])
def get_plan(plan_id: int, svc: PlansService = Depends(get_service)):
    return svc.get(plan_id)


@router.patch("/{plan_id}", response_model=PlanRead, dependencies=[Depends(require_platform_role("super_admin"))])
def update_plan(plan_id: int, payload: PlanUpdate, svc: PlansService = Depends(get_service)):
    return svc.update(plan_id, payload)


@router.delete("/{plan_id}", response_model=PlanRead, dependencies=[Depends(require_platform_role("super_admin"))])
def delete_plan(plan_id: int, svc: PlansService = Depends(get_service)):
    return svc.deactivate(plan_id)

