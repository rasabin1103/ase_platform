from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.catalog_categories.schemas import (
    CatalogCategoryCreate,
    CatalogCategoryListResponse,
    CatalogCategoryRead,
    CatalogCategoryUpdate,
)
from app.modules.catalog_categories.service import CatalogCategoriesService

# Reuses the existing "catalog.manage" permission — same rationale as the
# blog admin router: this platform's MVP role set only needs a coarse
# content-management gate, and require_permission() bypasses the specific
# code entirely for super_admin anyway.
router = APIRouter(prefix="/api/v1/admin/catalog-categories", tags=["catalog-categories"])
_MANAGE = Depends(require_permission("catalog.manage"))


def get_service(db: Session = Depends(get_db)) -> CatalogCategoriesService:
    return CatalogCategoriesService(db)


@router.get("", response_model=CatalogCategoryListResponse, dependencies=[_MANAGE])
def list_catalog_categories(
    active_only: bool = Query(default=False),
    svc: CatalogCategoriesService = Depends(get_service),
):
    return svc.list(active_only=active_only)


@router.get("/{category_id}", response_model=CatalogCategoryRead, dependencies=[_MANAGE])
def get_catalog_category(category_id: int, svc: CatalogCategoriesService = Depends(get_service)):
    return svc.get(category_id)


@router.post("", response_model=CatalogCategoryRead, status_code=201, dependencies=[_MANAGE])
def create_catalog_category(
    payload: CatalogCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CatalogCategoriesService = Depends(get_service),
):
    category = svc.create(payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="catalog_category.create",
        entity_type="catalog_category",
        entity_id=str(category.id),
        metadata={"name": category.name},
    )
    return category


@router.patch("/{category_id}", response_model=CatalogCategoryRead, dependencies=[_MANAGE])
def update_catalog_category(
    category_id: int,
    payload: CatalogCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CatalogCategoriesService = Depends(get_service),
):
    category = svc.update(category_id, payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="catalog_category.update",
        entity_type="catalog_category",
        entity_id=str(category.id),
        metadata={"fields": sorted(payload.model_dump(exclude_unset=True).keys())},
    )
    return category


@router.delete("/{category_id}", status_code=204, dependencies=[_MANAGE])
def delete_catalog_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CatalogCategoriesService = Depends(get_service),
):
    category = svc.get(category_id)
    svc.delete(category_id)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="catalog_category.delete",
        entity_type="catalog_category",
        entity_id=str(category_id),
        metadata={"name": category.name},
    )
