from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.database import get_db
from app.models.enums import PricingPillarCode
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.pricing_admin.schemas import (
    PricingConfigResponse,
    PricingDimensionLevelCreate,
    PricingDimensionLevelListResponse,
    PricingDimensionLevelRead,
    PricingDimensionLevelUpdate,
    PricingDimensionTypeCreate,
    PricingDimensionTypeListResponse,
    PricingDimensionTypeRead,
    PricingDimensionTypeUpdate,
    PricingPillarUpdate,
)
from app.modules.pricing_admin.service import PricingAdminService

# Reuses "catalog.manage" — same rationale as catalog_categories/blog admin:
# this platform's role set only needs a coarse content-management gate, and
# require_permission() bypasses it entirely for super_admin anyway.
router = APIRouter(prefix="/api/v1/admin/pricing", tags=["pricing-admin"])
_MANAGE = Depends(require_permission("catalog.manage"))


def get_service(db: Session = Depends(get_db)) -> PricingAdminService:
    return PricingAdminService(db)


@router.get("/config", response_model=PricingConfigResponse, dependencies=[_MANAGE])
def get_pricing_config(svc: PricingAdminService = Depends(get_service)):
    """Everything the admin management page and the catalog-item/service
    creation forms need in one call: all 5 pillars with their base price
    and dimension types (each with its own levels)."""
    return svc.get_config()


@router.patch("/pillars/{pillar_code}", response_model=PricingConfigResponse, dependencies=[_MANAGE])
def update_pillar_base_price(
    pillar_code: PricingPillarCode,
    payload: PricingPillarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: PricingAdminService = Depends(get_service),
):
    svc.update_pillar_base_price(pillar_code, payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="pricing_pillar.update",
        entity_type="pricing_pillar",
        entity_id=pillar_code.value,
        metadata={"base_price": str(payload.base_price)},
    )
    return svc.get_config()


@router.get("/dimension-types", response_model=PricingDimensionTypeListResponse, dependencies=[_MANAGE])
def list_dimension_types(
    pillar_code: PricingPillarCode | None = Query(default=None),
    svc: PricingAdminService = Depends(get_service),
):
    return svc.list_dimension_types(pillar_code=pillar_code)


@router.post("/dimension-types", response_model=PricingDimensionTypeRead, status_code=201, dependencies=[_MANAGE])
def create_dimension_type(
    payload: PricingDimensionTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: PricingAdminService = Depends(get_service),
):
    row = svc.create_dimension_type(payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="pricing_dimension_type.create",
        entity_type="pricing_dimension_type",
        entity_id=str(row.id),
        metadata={"pillar_code": row.pillar_code.value, "code": row.code, "label": row.label},
    )
    return row


@router.patch("/dimension-types/{dimension_type_id}", response_model=PricingDimensionTypeRead, dependencies=[_MANAGE])
def update_dimension_type(
    dimension_type_id: int,
    payload: PricingDimensionTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: PricingAdminService = Depends(get_service),
):
    row = svc.update_dimension_type(dimension_type_id, payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="pricing_dimension_type.update",
        entity_type="pricing_dimension_type",
        entity_id=str(dimension_type_id),
        metadata={"fields": sorted(payload.model_dump(exclude_unset=True).keys())},
    )
    return row


@router.delete("/dimension-types/{dimension_type_id}", status_code=204, dependencies=[_MANAGE])
def delete_dimension_type(
    dimension_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: PricingAdminService = Depends(get_service),
):
    svc.delete_dimension_type(dimension_type_id)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="pricing_dimension_type.delete",
        entity_type="pricing_dimension_type",
        entity_id=str(dimension_type_id),
        metadata={},
    )


@router.get("/dimension-levels", response_model=PricingDimensionLevelListResponse, dependencies=[_MANAGE])
def list_dimension_levels(
    dimension_type_id: int | None = Query(default=None),
    svc: PricingAdminService = Depends(get_service),
):
    return svc.list_dimension_levels(dimension_type_id=dimension_type_id)


@router.post("/dimension-levels", response_model=PricingDimensionLevelRead, status_code=201, dependencies=[_MANAGE])
def create_dimension_level(
    payload: PricingDimensionLevelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: PricingAdminService = Depends(get_service),
):
    row = svc.create_dimension_level(payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="pricing_dimension_level.create",
        entity_type="pricing_dimension_level",
        entity_id=str(row.id),
        metadata={"dimension_type_id": row.dimension_type_id, "label": row.label},
    )
    return row


@router.patch("/dimension-levels/{level_id}", response_model=PricingDimensionLevelRead, dependencies=[_MANAGE])
def update_dimension_level(
    level_id: int,
    payload: PricingDimensionLevelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: PricingAdminService = Depends(get_service),
):
    row = svc.update_dimension_level(level_id, payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="pricing_dimension_level.update",
        entity_type="pricing_dimension_level",
        entity_id=str(level_id),
        metadata={"fields": sorted(payload.model_dump(exclude_unset=True).keys())},
    )
    return row


@router.delete("/dimension-levels/{level_id}", status_code=204, dependencies=[_MANAGE])
def delete_dimension_level(
    level_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: PricingAdminService = Depends(get_service),
):
    svc.delete_dimension_level(level_id)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="pricing_dimension_level.delete",
        entity_type="pricing_dimension_level",
        entity_id=str(level_id),
        metadata={},
    )
