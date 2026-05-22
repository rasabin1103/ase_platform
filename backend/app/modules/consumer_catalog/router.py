from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemType
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_super_admin, require_permission
from app.modules.auth.security_onboarding import require_security_onboarding
from app.modules.consumer_catalog.favorites_repository import CatalogFavoritesRepository
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.consumer_catalog.schemas import (
    CatalogItemListResponse,
    CatalogItemRead,
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


@router.post("/{slug}/favorite", response_model=CatalogItemRead, dependencies=[Depends(require_permission("favorites.manage_own")), Depends(require_security_onboarding)])
def toggle_favorite(slug: str, user: User = Depends(get_current_user), svc: ConsumerCatalogService = Depends(get_service)):
    return svc.toggle_favorite(slug, user_id=user.id)


@router.post("/{slug}/purchase", response_model=CatalogItemRead, dependencies=[Depends(require_permission("purchases.manage_own")), Depends(require_security_onboarding)])
def purchase_item(slug: str, user: User = Depends(get_current_user), svc: ConsumerCatalogService = Depends(get_service)):
    return svc.purchase(slug, user_id=user.id)


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

