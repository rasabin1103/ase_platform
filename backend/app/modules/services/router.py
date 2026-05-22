from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import ServiceCategory, ServiceKind
from app.modules.auth.dependencies import require_permission
from app.modules.auth.security_onboarding import require_security_onboarding
from app.modules.services.schemas import ServiceCreate, ServiceListResponse, ServiceRead, ServiceUpdate
from app.modules.services.service_layer import ServicesService

router = APIRouter(prefix="/api/v1/services", tags=["services"])


def get_service(db: Session = Depends(get_db)) -> ServicesService:
    return ServicesService(db)


@router.get("", response_model=ServiceListResponse)
def list_services_public(
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    category: ServiceCategory | None = None,
    service_type: ServiceKind | None = None,
    svc: ServicesService = Depends(get_service),
):
    """Public catalog: active services only, ordered by ``display_order``."""
    items, total = svc.list_public(
        limit=limit,
        offset=offset,
        category=category,
        service_type=service_type,
    )
    return ServiceListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/manage", response_model=ServiceListResponse, dependencies=[Depends(require_permission("products.manage"))])
def list_services_manage(
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    is_active: bool | None = None,
    category: ServiceCategory | None = None,
    svc: ServicesService = Depends(get_service),
):
    items, total = svc.list_manage(limit=limit, offset=offset, is_active=is_active, category=category)
    return ServiceListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/{service_uuid}", response_model=ServiceRead)
def get_service_public(service_uuid: UUID, svc: ServicesService = Depends(get_service)):
    return svc.get_public(service_uuid)


@router.post(
    "",
    response_model=ServiceRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("products.manage")), Depends(require_security_onboarding)],
)
def create_service(payload: ServiceCreate, svc: ServicesService = Depends(get_service)):
    return svc.create(payload)


@router.patch(
    "/{service_uuid}",
    response_model=ServiceRead,
    dependencies=[Depends(require_permission("products.manage")), Depends(require_security_onboarding)],
)
def update_service(service_uuid: UUID, payload: ServiceUpdate, svc: ServicesService = Depends(get_service)):
    return svc.update(service_uuid, payload)


@router.delete(
    "/{service_uuid}",
    response_model=ServiceRead,
    dependencies=[Depends(require_permission("products.manage")), Depends(require_security_onboarding)],
)
def delete_service(service_uuid: UUID, svc: ServicesService = Depends(get_service)):
    return svc.deactivate(service_uuid)

