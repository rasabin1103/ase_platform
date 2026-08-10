"""Shared mapping of catalog_items ORM rows to API field bundles."""

from __future__ import annotations

from app.core.media_urls import resolve_catalog_display_image_url
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogPurchaseProvider


def catalog_media_fields(item: CatalogItem) -> dict:
    provider = item.purchase_provider or CatalogPurchaseProvider.internal
    return {
        "cover_image_url": item.cover_image_url,
        "thumbnail_url": item.thumbnail_url,
        "amazon_url": item.amazon_url,
        "external_purchase_url": item.external_purchase_url,
        "purchase_provider": provider,
        "pdf_url": item.pdf_url,
        "preview_pdf_url": item.preview_pdf_url,
        "preview_pages": item.preview_pages,
        "sample_download_url": item.sample_download_url,
        "rich_content_markdown": item.rich_content_markdown,
        "book_format": item.book_format,
        "audience": item.audience_json or [],
        "display_image_url": resolve_catalog_display_image_url(item),
    }
