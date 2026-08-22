from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemType
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.consumer_catalog.favorites_repository import CatalogFavoritesRepository
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.consumer_catalog.schemas import (
    AudiobookChapterContentRead,
    AudiobookChapterListRead,
    BookDownloadFormatsRead,
    CatalogItemListResponse,
    CatalogItemRead,
    RateItemRequest,
    ResourceContentRead,
    ReviewListResponse,
    ReviewRequest,
    UserCatalogStateRead,
    UserCatalogStateUpdate,
)
from app.modules.consumer_catalog.service import ConsumerCatalogService

router = APIRouter(prefix="/api/v1/consumer-catalog", tags=["consumer-catalog"])


def get_service(db: Session = Depends(get_db)) -> ConsumerCatalogService:
    return ConsumerCatalogService(db)


@router.get("/me/state", response_model=UserCatalogStateRead)
def get_my_catalog_state(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fav = CatalogFavoritesRepository(db).slugs_for_user(user.id)
    pur = CatalogPurchasesRepository(db).slugs_for_user(user.id)
    return UserCatalogStateRead(favorite_slugs=sorted(fav), purchased_slugs=sorted(pur))


@router.put("/me/state", response_model=UserCatalogStateRead)
def update_my_catalog_state(
    payload: UserCatalogStateUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slug_to_id = {
        row[0]: row[1]
        for row in db.execute(select(CatalogItem.slug, CatalogItem.id).where(CatalogItem.slug.in_(payload.favorite_slugs + payload.purchased_slugs))).all()
    }
    CatalogFavoritesRepository(db).replace_all(
        user.id, [slug_to_id[s] for s in payload.favorite_slugs if s in slug_to_id]
    )
    CatalogPurchasesRepository(db).replace_all(
        user.id, [slug_to_id[s] for s in payload.purchased_slugs if s in slug_to_id]
    )
    db.commit()
    return get_my_catalog_state(user, db)


@router.get("", response_model=CatalogItemListResponse, dependencies=[Depends(require_permission("catalog.read"))])
def list_catalog(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    type: CatalogItemType | None = None,
    category: str | None = None,
    search: str | None = None,
    tags: list[str] | None = Query(default=None),
    favorites_only: bool = False,
    purchased_only: bool = False,
    sort: str | None = Query(default=None, description="Set to 'top_rated' to sort by net rating score"),
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
        sort=sort,
        tags=tags,
    )


@router.get("/tags", response_model=list[str], dependencies=[Depends(require_permission("catalog.read"))])
def list_consumer_catalog_tags(svc: ConsumerCatalogService = Depends(get_service)):
    """Distinct tags across visible catalog items — powers the tag-filter
    chips on the consumer catalog browser."""
    return svc.list_tags()


@router.post("/{slug}/favorite", response_model=CatalogItemRead, dependencies=[Depends(require_permission("favorites.manage_own"))])
def toggle_favorite(slug: str, user: User = Depends(get_current_user), svc: ConsumerCatalogService = Depends(get_service)):
    return svc.toggle_favorite(slug, user_id=user.id)


@router.post("/{slug}/purchase", response_model=CatalogItemRead, dependencies=[Depends(require_permission("purchases.manage_own"))])
def purchase_item(slug: str, user: User = Depends(get_current_user), svc: ConsumerCatalogService = Depends(get_service)):
    if user.email_verified_at is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your email before purchasing. Check your inbox or resend the verification email from your profile.",
        )
    return svc.purchase(slug, user_id=user.id)


@router.get("/{slug}", response_model=CatalogItemRead, dependencies=[Depends(require_permission("catalog.read"))])
def get_catalog_item(slug: str, user: User = Depends(get_current_user), svc: ConsumerCatalogService = Depends(get_service)):
    return svc.get_by_slug(slug, user_id=user.id)


@router.get(
    "/{slug}/resource-content",
    response_model=ResourceContentRead,
    dependencies=[Depends(require_permission("purchases.manage_own"))],
)
def get_resource_content(slug: str, user: User = Depends(get_current_user), svc: ConsumerCatalogService = Depends(get_service)):
    """Read-only in-platform viewer. Full content requires owning this item
    (directly or via an active plan); a non-owner still gets a 403 unless
    the folder has a preview*.pdf, in which case that's served instead
    (see ConsumerCatalogService.get_resource_content)."""
    return svc.get_resource_content(slug, user_id=user.id)


@router.get(
    "/{slug}/download-formats",
    response_model=BookDownloadFormatsRead,
    dependencies=[Depends(require_permission("catalog.read"))],
)
def get_book_download_formats(slug: str, svc: ConsumerCatalogService = Depends(get_service)):
    """Which of a book's pdf/epub/kindle/zip download buttons actually have
    a file behind them — no ownership required, this only checks GitHub
    folder metadata, never file contents, so the buttons can render as
    disabled for the right reason before the user ever clicks one."""
    return svc.get_book_download_formats(slug)


@router.get("/{slug}/resource-download", dependencies=[Depends(require_permission("purchases.manage_own"))])
def download_resource(
    slug: str,
    format: str | None = None,
    user: User = Depends(get_current_user),
    svc: ConsumerCatalogService = Depends(get_service),
):
    """`format` picks a specific file out of a multi-format resource folder
    (a book's pdf/epub/kindle/zip) — omit it to get the old permissive
    "whatever's there" behavior every other resource type still relies on."""
    content, filename = svc.get_resource_download(slug, user_id=user.id, format=format)
    return Response(
        content=content,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/{slug}/audiobook/chapters",
    response_model=AudiobookChapterListRead,
    dependencies=[Depends(require_permission("purchases.manage_own"))],
)
def list_audiobook_chapters(slug: str, user: User = Depends(get_current_user), svc: ConsumerCatalogService = Depends(get_service)):
    """Platform-hosted audiobook chapters (repo_path's "audiolibro"
    subfolder) — separate from `audiobookUrl`, which is an external link
    served directly to the browser. Requires full ownership; returns an
    empty list rather than 404 when the book simply has no such folder."""
    return svc.list_audiobook_chapters(slug, user_id=user.id)


@router.get(
    "/{slug}/audiobook/chapter",
    response_model=AudiobookChapterContentRead,
    dependencies=[Depends(require_permission("purchases.manage_own"))],
)
def get_audiobook_chapter(
    slug: str,
    name: str,
    user: User = Depends(get_current_user),
    svc: ConsumerCatalogService = Depends(get_service),
):
    """Serves one chapter's audio, base64-encoded — `name` must match a
    file this book's own "audiolibro" subfolder actually has (checked
    server-side against a fresh listing), so it can't be used to reach
    anything else in the shared repo."""
    return svc.get_audiobook_chapter(slug, user_id=user.id, name=name)


@router.post("/{slug}/rating", response_model=CatalogItemRead, dependencies=[Depends(require_permission("ratings.manage_own"))])
def rate_catalog_item(
    slug: str,
    payload: RateItemRequest,
    user: User = Depends(get_current_user),
    svc: ConsumerCatalogService = Depends(get_service),
):
    return svc.rate(slug, user_id=user.id, is_positive=payload.isPositive, tags=payload.tags)


@router.delete("/{slug}/rating", response_model=CatalogItemRead, dependencies=[Depends(require_permission("ratings.manage_own"))])
def remove_catalog_item_rating(
    slug: str,
    user: User = Depends(get_current_user),
    svc: ConsumerCatalogService = Depends(get_service),
):
    return svc.remove_rating(slug, user_id=user.id)


@router.get("/{slug}/reviews", response_model=ReviewListResponse, dependencies=[Depends(require_permission("catalog.read"))])
def list_catalog_item_reviews(
    slug: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    svc: ConsumerCatalogService = Depends(get_service),
):
    """Public — anyone who can browse the catalog can read what others
    thought of an item, not just the people who bought it."""
    return svc.list_reviews(slug, limit=limit, offset=offset)


@router.post("/{slug}/review", response_model=CatalogItemRead, dependencies=[Depends(require_permission("ratings.manage_own"))])
def submit_catalog_item_review(
    slug: str,
    payload: ReviewRequest,
    user: User = Depends(get_current_user),
    svc: ConsumerCatalogService = Depends(get_service),
):
    return svc.submit_review(slug, user_id=user.id, rating=payload.rating, comment=payload.comment)


@router.delete("/{slug}/review", response_model=CatalogItemRead, dependencies=[Depends(require_permission("ratings.manage_own"))])
def remove_catalog_item_review(
    slug: str,
    user: User = Depends(get_current_user),
    svc: ConsumerCatalogService = Depends(get_service),
):
    return svc.remove_review(slug, user_id=user.id)
