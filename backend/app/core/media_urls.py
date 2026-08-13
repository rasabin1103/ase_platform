from __future__ import annotations

from uuid import UUID

from app.models.blog_post import BlogPost
from app.models.catalog_item import CatalogItem
from app.models.catalog_item_image import CatalogItemImage
from app.models.user import User


def user_has_stored_avatar(user: User) -> bool:
    return bool(user.avatar_data)


def catalog_has_stored_image(item: CatalogItem) -> bool:
    return bool(item.image_data)


def catalog_image_api_path(item_id: int) -> str:
    return f"/media/catalog/{item_id}/image"


def catalog_gallery_image_api_path(item_id: int, image_id: int) -> str:
    return f"/media/catalog/{item_id}/images/{image_id}"


def user_avatar_api_path(user_uuid: UUID) -> str:
    return f"/api/v1/auth/users/{user_uuid}/avatar"


def resolve_user_avatar_url(user: User) -> str | None:
    if user_has_stored_avatar(user):
        return "/auth/me/avatar"
    return user.avatar_url


def resolve_catalog_image_url(item: CatalogItem) -> str:
    """Legacy single-image resolver. Used only as a defensive fallback for an
    item with no gallery rows at all (shouldn't happen after the
    ``catalog_item_images`` backfill migration)."""
    if catalog_has_stored_image(item):
        return catalog_image_api_path(item.id)
    return item.image_url


def resolve_gallery_image_url(image: CatalogItemImage) -> str:
    if image.image_data:
        return catalog_gallery_image_api_path(image.catalog_item_id, image.id)
    return image.image_url or ""


def ordered_catalog_images(item: CatalogItem) -> list[CatalogItemImage]:
    images = list(item.images or [])
    return sorted(images, key=lambda img: (0 if img.is_cover else 1, img.display_order, img.id))


def resolve_catalog_gallery(item: CatalogItem) -> list[dict[str, object]]:
    """Ordered gallery for an item — cover image first, then the rest by
    display order. Falls back to the legacy single image field when the item
    has no ``catalog_item_images`` rows yet."""
    ordered = ordered_catalog_images(item)
    if not ordered:
        if item.image_data or item.image_url:
            return [{"url": resolve_catalog_image_url(item), "isCover": True}]
        return []
    return [{"url": resolve_gallery_image_url(img), "isCover": img.is_cover} for img in ordered]


def resolve_catalog_cover_url(item: CatalogItem) -> str:
    """The URL to use for cards/thumbnails — the image marked as cover, or the
    first gallery image, or the legacy single image as a last resort."""
    ordered = ordered_catalog_images(item)
    if ordered:
        return resolve_gallery_image_url(ordered[0])
    return resolve_catalog_image_url(item)


# --- Blog cover image (public, unauthenticated) -----------------------------
# Served from a dedicated public path (not /api/v1/media/...) because that
# router is gated behind `catalog.read`, while the blog is meant to be
# readable by anyone with no login at all.


def blog_has_stored_image(post: BlogPost) -> bool:
    return bool(post.cover_image_data)


def blog_cover_image_api_path(post_id: int) -> str:
    return f"/api/v1/public/blog-cover/{post_id}"


def resolve_blog_cover_url(post: BlogPost) -> str | None:
    if blog_has_stored_image(post):
        return blog_cover_image_api_path(post.id)
    return post.cover_image_url
