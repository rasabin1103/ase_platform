"""Tests for catalog images and book purchase links."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.catalog_item_image import CatalogItemImage
from app.models.book_purchase_link import BookPurchaseLink
from app.models.catalog_item import CatalogItem
from app.models.enums import BookPurchasePlatform, CatalogItemStatus, CatalogItemType
from app.modules.catalog.catalog_media_sync import (
    is_valid_http_url,
    resolve_purchase_label,
    sync_book_purchase_links,
    sync_catalog_images,
)
from decimal import Decimal


def _book_item() -> CatalogItem:
    item = CatalogItem(
        id=1,
        title="Test Book",
        slug="test-book-media",
        type=CatalogItemType.book,
        category="QA",
        short_description="Short",
        long_description="Long",
        image_url="https://example.com/cover.jpg",
        price=Decimal("19.00"),
        currency="EUR",
        status=CatalogItemStatus.published,
        author="ASE",
    )
    item.images = []
    item.purchase_links = []
    return item


def _mock_db(item: CatalogItem):
    db = MagicMock()

    def add(obj):
        if isinstance(obj, CatalogItemImage):
            obj.id = len(item.images) + 1
            item.images.append(obj)
        elif isinstance(obj, BookPurchaseLink):
            obj.id = len(item.purchase_links) + 1
            item.purchase_links.append(obj)

    def delete(obj):
        if obj in item.images:
            item.images.remove(obj)
        if obj in item.purchase_links:
            item.purchase_links.remove(obj)

    db.add.side_effect = add
    db.delete.side_effect = delete
    db.flush = MagicMock()
    return db


def test_valid_url():
    assert is_valid_http_url("https://amazon.com/dp/123")
    assert not is_valid_http_url("/api/v1/media/catalog/1/image")


def test_resolve_purchase_label():
    assert resolve_purchase_label(BookPurchasePlatform.amazon, None) == "Comprar en Amazon"
    assert resolve_purchase_label(BookPurchasePlatform.other, "Mi tienda") == "Mi tienda"


def test_sync_images_primary():
    item = _book_item()
    db = _mock_db(item)
    sync_catalog_images(
        db,
        item,
        [
            {"image_url": "https://cdn.example/a.jpg", "sort_order": 0, "is_primary": False},
            {"image_url": "https://cdn.example/b.jpg", "sort_order": 1, "is_primary": True},
        ],
    )
    assert len(item.images) == 2
    assert sum(1 for i in item.images if i.is_primary) == 1


def test_sync_purchase_links():
    item = _book_item()
    db = _mock_db(item)
    sync_book_purchase_links(
        db,
        item,
        [
            {"platform": "amazon", "url": "https://amazon.com/1", "sort_order": 1, "is_active": True},
            {
                "platform": "ase",
                "url": "https://arcesabinengineering.com/buy",
                "sort_order": 0,
                "is_active": True,
                "is_primary": True,
            },
        ],
    )
    assert len(item.purchase_links) == 2


def test_duplicate_purchase_link_rejected():
    item = _book_item()
    db = _mock_db(item)
    payload = [
        {"platform": "amazon", "url": "https://amazon.com/1", "sort_order": 0},
        {"platform": "amazon", "url": "https://amazon.com/1", "sort_order": 1},
    ]
    with pytest.raises(HTTPException) as exc:
        sync_book_purchase_links(db, item, payload)
    assert exc.value.status_code == 400


def test_other_platform_requires_label():
    item = _book_item()
    db = _mock_db(item)
    with pytest.raises(HTTPException):
        sync_book_purchase_links(
            db,
            item,
            [{"platform": "other", "url": "https://shop.example/buy", "sort_order": 0}],
        )
