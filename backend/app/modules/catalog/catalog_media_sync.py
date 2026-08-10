"""Sync and validation for catalog images and book purchase links."""

from __future__ import annotations

from decimal import Decimal
from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.book_purchase_link import BookPurchaseLink
from app.models.catalog_item import CatalogItem
from app.models.catalog_item_image import CatalogItemImage
from app.models.enums import BookPurchasePlatform, CatalogItemType

MAX_IMAGES_PER_ITEM = 10
MAX_PURCHASE_LINKS_PER_BOOK = 8

PLATFORM_DEFAULT_LABELS: dict[BookPurchasePlatform, str] = {
    BookPurchasePlatform.amazon: "Comprar en Amazon",
    BookPurchasePlatform.ase: "Comprar en ASE",
    BookPurchasePlatform.lulu: "Ver en Lulu",
    BookPurchasePlatform.gumroad: "Comprar en Gumroad",
    BookPurchasePlatform.shopify: "Comprar en Shopify",
    BookPurchasePlatform.hotmart: "Comprar en Hotmart",
    BookPurchasePlatform.other: "Comprar",
}


def is_valid_http_url(value: str | None) -> bool:
    if not value or not value.strip():
        return False
    parsed = urlparse(value.strip())
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def is_internal_media_url(value: str | None) -> bool:
    if not value:
        return False
    return value.startswith("/api/") or "/media/catalog/" in value


def resolve_purchase_label(platform: BookPurchasePlatform, label: str | None) -> str:
    if label and label.strip():
        return label.strip()
    return PLATFORM_DEFAULT_LABELS.get(platform, "Comprar")


def sync_catalog_images(
    db: Session,
    item: CatalogItem,
    images: list[dict] | None,
) -> None:
    if images is None:
        return
    if len(images) > MAX_IMAGES_PER_ITEM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_IMAGES_PER_ITEM} images allowed per catalog item",
        )

    existing = {img.id: img for img in list(item.images)}
    keep_ids: set[int] = set()
    primary_assigned = False

    for idx, payload in enumerate(images):
        image_url = (payload.get("image_url") or "").strip()
        if not is_valid_http_url(image_url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"images[{idx}].image_url must be a valid http(s) URL",
            )
        is_primary = bool(payload.get("is_primary"))
        if is_primary:
            primary_assigned = True

        row_id = payload.get("id")
        if row_id and row_id in existing:
            row = existing[row_id]
            keep_ids.add(row_id)
        else:
            row = CatalogItemImage(catalog_item_id=item.id)
            db.add(row)
            db.flush()

        row.image_url = image_url
        row.alt_text = payload.get("alt_text")
        row.title = payload.get("title")
        row.sort_order = int(payload.get("sort_order", idx))
        row.is_primary = is_primary

    for img_id, img in existing.items():
        if img_id not in keep_ids and images is not None:
            db.delete(img)

    if images and not primary_assigned:
        images_sorted = sorted(item.images, key=lambda i: (i.sort_order, i.created_at))
        if images_sorted:
            images_sorted[0].is_primary = True

    for img in item.images:
        if not img.is_primary:
            continue
        for other in item.images:
            if other.id != img.id:
                other.is_primary = False


def sync_book_purchase_links(
    db: Session,
    item: CatalogItem,
    links: list[dict] | None,
) -> None:
    if links is None:
        return
    if item.type != CatalogItemType.book:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="purchase_links are only supported for books",
        )
    if len(links) > MAX_PURCHASE_LINKS_PER_BOOK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_PURCHASE_LINKS_PER_BOOK} purchase links allowed per book",
        )

    seen: set[tuple[str, str]] = set()
    existing = {link.id: link for link in list(item.purchase_links)}
    keep_ids: set[int] = set()
    primary_assigned = False

    for idx, payload in enumerate(links):
        platform_raw = payload.get("platform")
        try:
            platform = BookPurchasePlatform(platform_raw)
        except (ValueError, TypeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"purchase_links[{idx}].platform is invalid",
            ) from exc

        url = (payload.get("url") or "").strip()
        if not is_valid_http_url(url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"purchase_links[{idx}].url must be a valid http(s) URL",
            )

        label = payload.get("label")
        if platform == BookPurchasePlatform.other and not (label and str(label).strip()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="purchase_links label is required when platform is other",
            )
        resolved_label = resolve_purchase_label(platform, label)

        dedupe_key = (platform.value, url.lower())
        if dedupe_key in seen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate purchase link platform + url in the same book",
            )
        seen.add(dedupe_key)

        is_primary = bool(payload.get("is_primary"))
        if is_primary:
            primary_assigned = True

        price = payload.get("price")
        row_id = payload.get("id")
        if row_id and row_id in existing:
            row = existing[row_id]
            keep_ids.add(row_id)
        else:
            row = BookPurchaseLink(catalog_item_id=item.id)
            db.add(row)
            db.flush()

        row.platform = platform
        row.label = resolved_label
        row.url = url
        row.currency = payload.get("currency")
        row.price = Decimal(str(price)) if price is not None else None
        row.country = payload.get("country")
        row.is_primary = is_primary
        row.is_active = bool(payload.get("is_active", True))
        row.sort_order = int(payload.get("sort_order", idx))

    for link_id, link in existing.items():
        if link_id not in keep_ids:
            db.delete(link)

    if links and not primary_assigned:
        active = [l for l in item.purchase_links if l.is_active]
        if active:
            sorted_links = sorted(active, key=lambda l: (l.sort_order, l.created_at))
            sorted_links[0].is_primary = True

    for link in item.purchase_links:
        if not link.is_primary:
            continue
        for other in item.purchase_links:
            if other.id != link.id:
                other.is_primary = False
