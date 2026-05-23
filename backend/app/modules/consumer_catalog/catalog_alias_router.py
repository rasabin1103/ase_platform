"""Catalog alias routes — same payloads as consumer-catalog under /api/v1/catalog."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import CatalogItemType
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_super_admin, require_permission
from app.modules.consumer_catalog.schemas import CatalogItemListResponse, CatalogItemRead
from app.modules.consumer_catalog.service import ConsumerCatalogService

router = APIRouter(prefix="/api/v1/catalog", tags=["catalog"])


def get_service(db: Session = Depends(get_db)) -> ConsumerCatalogService:
    return ConsumerCatalogService(db)


@router.get("", response_model=CatalogItemListResponse, dependencies=[Depends(require_permission("catalog.read"))])
def list_catalog(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    type: CatalogItemType | None = None,
    category: str | None = None,
    search: str | None = None,
    favorites_only: bool = False,
    purchased_only: bool = False,
    user: User = Depends(get_current_user),
    svc: ConsumerCatalogService = Depends(get_service),
):
    return svc.list_items(
        user_id=user.id,
        limit=limit,
        offset=offset,
        type_filter=type,
        category=category,
        search=search,
        favorites_only=favorites_only,
        purchased_only=purchased_only,
    )


@router.get("/{slug}", response_model=CatalogItemRead, dependencies=[Depends(require_permission("catalog.read"))])
def get_catalog_item(
    slug: str,
    preview: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: ConsumerCatalogService = Depends(get_service),
):
    allow_preview = preview and is_super_admin(db, user)
    return svc.get_by_slug(slug, user_id=user.id, allow_preview=allow_preview)
