from __future__ import annotations

from uuid import UUID

from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemType
from app.models.user import User


def user_has_stored_avatar(user: User) -> bool:
    return bool(user.avatar_data)


def catalog_has_stored_image(item: CatalogItem) -> bool:
    return bool(item.image_data)


def catalog_image_api_path(item_id: int) -> str:
    return f"/api/v1/media/catalog/{item_id}/image"


def user_avatar_api_path(user_uuid: UUID) -> str:
    return f"/api/v1/auth/users/{user_uuid}/avatar"


def resolve_user_avatar_url(user: User) -> str | None:
    if user_has_stored_avatar(user):
        return "/auth/me/avatar"
    return user.avatar_url


def resolve_catalog_display_image_url(item: CatalogItem) -> str:
    """Primary image for cards/detail. Stored upload wins; books prefer cover URL."""
    if catalog_has_stored_image(item):
        return catalog_image_api_path(item.id)
    if item.type == CatalogItemType.book and item.cover_image_url:
        return item.cover_image_url
    if item.thumbnail_url:
        return item.thumbnail_url
    return item.image_url or ""


def resolve_catalog_image_url(item: CatalogItem) -> str:
    return resolve_catalog_display_image_url(item)
