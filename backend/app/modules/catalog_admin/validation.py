from __future__ import annotations

from urllib.parse import urlparse

from fastapi import HTTPException, status

from app.models.enums import CatalogItemType, CatalogPurchaseProvider


def _is_valid_url(value: str | None) -> bool:
    if not value or not value.strip():
        return False
    parsed = urlparse(value.strip())
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def validate_catalog_fields(
    *,
    plan_type: CatalogItemType | None = None,
    purchase_provider: CatalogPurchaseProvider | None = None,
    amazon_url: str | None = None,
    external_purchase_url: str | None = None,
    preview_pdf_url: str | None = None,
    pdf_url: str | None = None,
    sample_download_url: str | None = None,
    image_url: str | None = None,
    cover_image_url: str | None = None,
    skip_image_url_if_stored: bool = False,
) -> None:
    provider = purchase_provider or CatalogPurchaseProvider.internal
    if provider == CatalogPurchaseProvider.amazon:
        if not _is_valid_url(amazon_url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="amazon_url is required and must be a valid URL when purchase_provider is amazon",
            )
    if provider == CatalogPurchaseProvider.external and not _is_valid_url(external_purchase_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="external_purchase_url is required when purchase_provider is external",
        )
    for label, url in (
        ("amazon_url", amazon_url),
        ("external_purchase_url", external_purchase_url),
        ("preview_pdf_url", preview_pdf_url),
        ("pdf_url", pdf_url),
        ("sample_download_url", sample_download_url),
        ("cover_image_url", cover_image_url),
    ):
        if url and not _is_valid_url(url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{label} must be a valid http(s) URL",
            )
    if image_url and not skip_image_url_if_stored and not _is_valid_url(image_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image_url must be a valid http(s) URL",
        )
