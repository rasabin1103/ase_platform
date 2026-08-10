"""Admin book endpoints — thin wrapper over catalog admin for type=book."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import CatalogItemType
from app.modules.auth.dependencies import require_permission
from app.modules.auth.security_onboarding import require_security_onboarding
from app.modules.catalog_admin.schemas import CatalogItemAdminCreate, CatalogItemAdminRead, CatalogItemAdminUpdate
from app.modules.catalog_admin.service import CatalogAdminService

router = APIRouter(prefix="/api/v1/admin/books", tags=["books-admin"])


def get_service(db: Session = Depends(get_db)) -> CatalogAdminService:
    return CatalogAdminService(db)


@router.post("", response_model=CatalogItemAdminRead, status_code=201, dependencies=[Depends(require_permission("catalog.manage")), Depends(require_security_onboarding)])
def create_book(payload: CatalogItemAdminCreate, svc: CatalogAdminService = Depends(get_service)):
    payload.type = CatalogItemType.book
    return svc.create(payload)


@router.put("/{item_id}", response_model=CatalogItemAdminRead, dependencies=[Depends(require_permission("catalog.manage")), Depends(require_security_onboarding)])
def update_book(item_id: int, payload: CatalogItemAdminUpdate, svc: CatalogAdminService = Depends(get_service)):
    item = svc._load_item(item_id)
    if item.type != CatalogItemType.book:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Book not found")
    return svc.update(item_id, payload)
