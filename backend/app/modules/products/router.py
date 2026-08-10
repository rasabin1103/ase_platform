from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import ProductStatus
from app.models.user import User
from app.modules.auth.creator_guards import assert_can_activate_product, require_create_product
from app.modules.auth.security_onboarding import require_security_onboarding
from app.core.rbac import expand_permission_codes
from app.modules.auth.dependencies import (
    get_current_user,
    is_super_admin,
    require_permission,
    require_platform_role,
    require_tenant_context,
    user_has_any_permission,
)
from app.modules.products.schemas import ProductCreate, ProductListResponse, ProductRead, ProductUpdate
from app.modules.products.service import ProductsService

router = APIRouter(prefix="/api/v1/products", tags=["products"])


def get_service(db: Session = Depends(get_db)) -> ProductsService:
    return ProductsService(db)


@router.post(
    "",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_create_product()), Depends(require_security_onboarding)],
)
def create_product(
    payload: ProductCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: ProductsService = Depends(get_service),
):
    if not is_super_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        has_own = user_has_any_permission(
            db,
            user_id=current_user.id,
            organization_id=org.id,
            permission_codes=expand_permission_codes("products.create_own"),
        )
        has_manage = user_has_any_permission(
            db,
            user_id=current_user.id,
            organization_id=org.id,
            permission_codes=expand_permission_codes("products.manage"),
        )
        if has_own and not has_manage:
            payload = payload.model_copy(
                update={
                    "owner_user_id": current_user.id,
                    "status": ProductStatus.inactive,
                }
            )
        elif not has_manage:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")

    return svc.create(payload)


@router.get("", response_model=ProductListResponse, dependencies=[Depends(require_permission("products.read"))])
def list_products(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    status_filter: ProductStatus | None = Query(default=None, alias="status"),
    svc: ProductsService = Depends(get_service),
):
    items, total = svc.list(limit=limit, offset=offset, status=status_filter)
    return ProductListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/{product_id}", response_model=ProductRead, dependencies=[Depends(require_permission("products.read"))])
def get_product(product_id: int, svc: ProductsService = Depends(get_service)):
    return svc.get(product_id)


@router.patch(
    "/{product_id}",
    response_model=ProductRead,
)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: ProductsService = Depends(get_service),
):
    product = svc.get(product_id)
    if product.owner_user_id is not None and product.owner_user_id == current_user.id:
        org = require_tenant_context(request, db, current_user)
        if not user_has_any_permission(
            db,
            user_id=current_user.id,
            organization_id=org.id,
            permission_codes=expand_permission_codes("products.update_own"),
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")
        assert_can_activate_product(
            db,
            current_user,
            target_status=payload.status,
            owner_user_id=product.owner_user_id,
            current_user_id=current_user.id,
        )
    elif not is_super_admin(db, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")
    return svc.update(product_id, payload)


@router.delete(
    "/{product_id}",
    response_model=ProductRead,
    dependencies=[Depends(require_platform_role("super_admin")), Depends(require_security_onboarding)],
)
def delete_product(product_id: int, svc: ProductsService = Depends(get_service)):
    return svc.deactivate(product_id)

