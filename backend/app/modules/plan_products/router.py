from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import require_permission
from app.modules.plan_products.schemas import (
    PlanProductCreate,
    PlanProductListResponse,
    PlanProductRead,
    PlanProductUpdate,
)
from app.modules.plan_products.service import PlanProductsService

router = APIRouter(prefix="/api/v1/plan-products", tags=["plan-products"])


def get_service(db: Session = Depends(get_db)) -> PlanProductsService:
    return PlanProductsService(db)


@router.post(
    "",
    response_model=PlanProductRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("products.manage"))],
)
def create_plan_product(payload: PlanProductCreate, svc: PlanProductsService = Depends(get_service)):
    return svc.create(payload)


@router.get(
    "",
    response_model=PlanProductListResponse,
    dependencies=[Depends(require_permission("products.manage"))],
)
def list_plan_products(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    plan_id: int | None = Query(default=None, ge=1),
    product_id: int | None = Query(default=None, ge=1),
    svc: PlanProductsService = Depends(get_service),
):
    items, total = svc.list(limit=limit, offset=offset, plan_id=plan_id, product_id=product_id)
    return PlanProductListResponse(
        items=[PlanProductRead.model_validate(i) for i in items],
        limit=limit,
        offset=offset,
        total=total,
    )


@router.get(
    "/{plan_product_id}",
    response_model=PlanProductRead,
    dependencies=[Depends(require_permission("products.manage"))],
)
def get_plan_product(plan_product_id: int, svc: PlanProductsService = Depends(get_service)):
    return svc.get(plan_product_id)


@router.patch(
    "/{plan_product_id}",
    response_model=PlanProductRead,
    dependencies=[Depends(require_permission("products.manage"))],
)
def update_plan_product(plan_product_id: int, payload: PlanProductUpdate, svc: PlanProductsService = Depends(get_service)):
    return svc.update(plan_product_id, payload)


@router.delete(
    "/{plan_product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("products.manage"))],
)
def delete_plan_product(plan_product_id: int, svc: PlanProductsService = Depends(get_service)):
    svc.delete(plan_product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

