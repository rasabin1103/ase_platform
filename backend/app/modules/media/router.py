from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.media_urls import catalog_has_stored_image
from app.models.catalog_item import CatalogItem
from app.models.catalog_item_image import CatalogItemImage
from app.modules.auth.dependencies import require_permission

router = APIRouter(prefix="/api/v1/media", tags=["media"])


@router.get("/catalog/{item_id}/image", dependencies=[Depends(require_permission("catalog.read"))])
def get_catalog_item_image(item_id: int, db: Session = Depends(get_db)):
    item = db.get(CatalogItem, item_id)
    if item is None or not catalog_has_stored_image(item):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(content=bytes(item.image_data), media_type=item.image_mime or "image/jpeg")


@router.get("/catalog/{item_id}/images/{image_id}", dependencies=[Depends(require_permission("catalog.read"))])
def get_catalog_item_gallery_image(item_id: int, image_id: int, db: Session = Depends(get_db)):
    image = db.get(CatalogItemImage, image_id)
    if image is None or image.catalog_item_id != item_id or not image.image_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(content=bytes(image.image_data), media_type=image.image_mime or "image/jpeg")
