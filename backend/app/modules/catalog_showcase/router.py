from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import CatalogItemType
from app.modules.catalog_showcase.schemas import CatalogShowcaseListResponse
from app.modules.catalog_showcase.service import CatalogShowcaseService

# No auth dependency anywhere in this router, deliberately — this is the
# public "browse before you sign up" surface (see CatalogShowcaseService's
# docstring). Every field it can return is already safe to hand to an
# anonymous visitor; nothing here reads or writes per-user state.
router = APIRouter(prefix="/api/v1/catalog-showcase", tags=["catalog-showcase"])


def get_service(db: Session = Depends(get_db)) -> CatalogShowcaseService:
    return CatalogShowcaseService(db)


@router.get("", response_model=CatalogShowcaseListResponse)
def list_catalog_showcase(
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    type: CatalogItemType | None = None,
    category: str | None = None,
    search: str | None = None,
    tags: list[str] | None = Query(default=None),
    sort: str | None = Query(
        default=None,
        description="newest (default) | top_rated | price_asc | price_desc",
    ),
    svc: CatalogShowcaseService = Depends(get_service),
):
    return svc.list_items(
        limit=limit,
        offset=offset,
        type_filter=type,
        category=category,
        search=search,
        sort=sort,
        tags=tags,
    )


@router.get("/tags", response_model=list[str])
def list_catalog_showcase_tags(svc: CatalogShowcaseService = Depends(get_service)):
    return svc.list_tags()


@router.get("/categories", response_model=list[str])
def list_catalog_showcase_categories(svc: CatalogShowcaseService = Depends(get_service)):
    return svc.list_categories()
