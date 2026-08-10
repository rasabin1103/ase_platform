from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission, require_tenant_context
from app.modules.org_catalog.schemas import (
    GrantProductRequest,
    GrantProductResponse,
    GrantTargetListResponse,
    MemberCatalogStatsListResponse,
    OrganizationAnalyticsResponse,
    OrgCatalogItemListResponse,
)
from app.modules.org_catalog.service import OrgCatalogService

router = APIRouter(prefix="/api/v1/organizations/me", tags=["org-catalog"])


def get_service(db: Session = Depends(get_db)) -> OrgCatalogService:
    return OrgCatalogService(db)


@router.get("/catalog-items", response_model=OrgCatalogItemListResponse, dependencies=[Depends(require_permission("catalog.read"))])
def list_org_catalog_items(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    svc: OrgCatalogService = Depends(get_service),
):
    org = require_tenant_context(request, db, user)
    return svc.list_org_catalog(organization_id=org.id, requester_user_id=user.id, limit=limit, offset=offset)


@router.post(
    "/catalog-items/{slug}",
    dependencies=[Depends(require_permission("products.assign"))],
)
def associate_catalog_item(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    svc: OrgCatalogService = Depends(get_service),
):
    org = require_tenant_context(request, db, user)
    return svc.associate(organization_id=org.id, slug=slug, added_by_user_id=user.id)


@router.delete(
    "/catalog-items/{slug}",
    dependencies=[Depends(require_permission("products.assign"))],
)
def remove_catalog_item(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    svc: OrgCatalogService = Depends(get_service),
):
    org = require_tenant_context(request, db, user)
    return svc.remove(organization_id=org.id, slug=slug)


@router.get(
    "/grant-targets",
    response_model=GrantTargetListResponse,
    dependencies=[Depends(require_permission("users.read"))],
)
def search_grant_targets(
    request: Request,
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    svc: OrgCatalogService = Depends(get_service),
):
    org = require_tenant_context(request, db, user)
    return GrantTargetListResponse(items=svc.search_grant_targets(organization_id=org.id, search=search))


@router.post(
    "/grant",
    response_model=GrantProductResponse,
    dependencies=[Depends(require_permission("products.assign"))],
)
def grant_product(
    payload: GrantProductRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    svc: OrgCatalogService = Depends(get_service),
):
    org = require_tenant_context(request, db, user)
    target = db.query(User).filter(User.uuid == payload.userUuid).one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")
    return svc.grant(
        organization_id=org.id,
        granted_by_user_id=user.id,
        catalog_item_slug=payload.catalogItemSlug,
        target_user=target,
    )


@router.get(
    "/member-catalog-stats",
    response_model=MemberCatalogStatsListResponse,
    dependencies=[Depends(require_permission("purchases.read_all"))],
)
def member_catalog_stats(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    svc: OrgCatalogService = Depends(get_service),
):
    org = require_tenant_context(request, db, user)
    return MemberCatalogStatsListResponse(items=svc.member_catalog_stats(organization_id=org.id))


@router.get(
    "/analytics",
    response_model=OrganizationAnalyticsResponse,
    dependencies=[Depends(require_permission("purchases.read_all"))],
)
def organization_analytics(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    svc: OrgCatalogService = Depends(get_service),
):
    org = require_tenant_context(request, db, user)
    return svc.analytics(organization_id=org.id)
