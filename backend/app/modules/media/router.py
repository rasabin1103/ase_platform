from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.media_urls import catalog_has_stored_image
from app.models.catalog_item import CatalogItem
from app.modules.auth.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/api/v1/media", tags=["media"])


@router.get("/catalog/{item_id}/image", dependencies=[Depends(require_permission("catalog.read"))])
def get_catalog_item_image(item_id: int, db: Session = Depends(get_db)):
    item = db.get(CatalogItem, item_id)
    if item is None or not catalog_has_stored_image(item):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(content=bytes(item.image_data), media_type=item.image_mime or "image/jpeg")
