from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import CatalogItemType
from app.modules.catalog_showcase.schemas import CatalogShowcaseItemDetail, CatalogShowcaseListResponse
from app.modules.catalog_showcase.service import CatalogShowcaseService
from app.modules.consumer_catalog.schemas import ResourceContentRead, ReviewListResponse

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


# Registered after the static /tags and /categories paths above so those
# never risk being shadowed by this dynamic one — a public, shareable URL
# for a single catalog item (linkable from LinkedIn, Google search results,
# campaigns...), matched on (type, slug) rather than slug alone so a wrong
# type in the URL 404s instead of silently resolving to a different item.
@router.get("/{item_type}/{slug}", response_model=CatalogShowcaseItemDetail)
def read_catalog_showcase_item(
    item_type: CatalogItemType,
    slug: str,
    svc: CatalogShowcaseService = Depends(get_service),
):
    item = svc.get_item(item_type, slug)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


# The real "muestra" — a book's repo "preview" subfolder, or another item's
# README.md — fetched fresh from GitHub on each request (see
# CatalogShowcaseService.get_preview_content / ConsumerCatalogService's
# get_public_preview_content). Deliberately NOT the previewUrl field already
# on the item — that's an optional external link the admin can set, this is
# the repo-backed sample every book/resource can already have. 404s both
# when the item itself isn't found/published and when it has no sample
# file to show (no "preview" subfolder, no README.md).
@router.get("/{item_type}/{slug}/preview-content", response_model=ResourceContentRead)
def read_catalog_showcase_preview_content(
    item_type: CatalogItemType,
    slug: str,
    svc: CatalogShowcaseService = Depends(get_service),
):
    content = svc.get_preview_content(item_type, slug)
    if content is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return content


# Public reviews (stars + comment) of a published item — what the showcase
# detail page and the academy course page show to anyone, logged in or not.
# Writing a review stays in consumer_catalog (authenticated, ownership-gated).
@router.get("/{item_type}/{slug}/reviews", response_model=ReviewListResponse)
def list_catalog_showcase_reviews(
    item_type: CatalogItemType,
    slug: str,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    svc: CatalogShowcaseService = Depends(get_service),
):
    reviews = svc.list_reviews(item_type, slug, limit=limit, offset=offset)
    if reviews is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return reviews
