from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.media_storage import validate_image_upload
from app.core.media_urls import catalog_has_stored_image
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemType
from app.modules.auth.dependencies import require_permission
from app.modules.catalog_admin.schemas import (
    CatalogItemAdminCreate,
    CatalogItemAdminListResponse,
    CatalogItemAdminRead,
    CatalogItemAdminUpdate,
)
from app.modules.catalog_admin.service import CatalogAdminService

router = APIRouter(prefix="/api/v1/admin/catalog", tags=["catalog-admin"])


def get_service(db: Session = Depends(get_db)) -> CatalogAdminService:
    return CatalogAdminService(db)


@router.get("", response_model=CatalogItemAdminListResponse, dependencies=[Depends(require_permission("catalog.manage"))])
def list_catalog_admin(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    type: CatalogItemType | None = None,
    search: str | None = None,
    svc: CatalogAdminService = Depends(get_service),
):
    return svc.list(limit=limit, offset=offset, type_filter=type, search=search)


@router.post("/{item_id}/image", dependencies=[Depends(require_permission("catalog.manage"))])
async def upload_catalog_image(
    item_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    item = db.get(CatalogItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
    content = await file.read()
    try:
        mime = validate_image_upload(content, file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    item.image_data = content
    item.image_mime = mime
    db.commit()
    return {"ok": True}


@router.get("/{item_id}/image", dependencies=[Depends(require_permission("catalog.manage"))])
def get_catalog_image_admin(item_id: int, db: Session = Depends(get_db)):
    item = db.get(CatalogItem, item_id)
    if item is None or not catalog_has_stored_image(item):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(content=bytes(item.image_data), media_type=item.image_mime or "image/jpeg")


@router.get("/{item_id}", response_model=CatalogItemAdminRead, dependencies=[Depends(require_permission("catalog.manage"))])
def get_catalog_admin_item(item_id: int, svc: CatalogAdminService = Depends(get_service)):
    return svc.get(item_id)


@router.post("", response_model=CatalogItemAdminRead, status_code=201, dependencies=[Depends(require_permission("catalog.manage"))])
def create_catalog_item(payload: CatalogItemAdminCreate, svc: CatalogAdminService = Depends(get_service)):
    return svc.create(payload)


@router.patch("/{item_id}", response_model=CatalogItemAdminRead, dependencies=[Depends(require_permission("catalog.manage"))])
def update_catalog_item(item_id: int, payload: CatalogItemAdminUpdate, svc: CatalogAdminService = Depends(get_service)):
    return svc.update(item_id, payload)


@router.delete("/{item_id}", status_code=204, dependencies=[Depends(require_permission("catalog.manage"))])
def delete_catalog_item(item_id: int, svc: CatalogAdminService = Depends(get_service)):
    svc.delete(item_id)
