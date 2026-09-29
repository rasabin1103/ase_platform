"""Verifies the PUBLIC (unauthenticated) catalog showcase's "Vista previa"
gating — the same bug as the private catalog's (see
test_catalog_preview_gating.py), but in CatalogShowcaseService, which is a
separate module for anonymous visitors and had its own copy of the
"hasPreview = bool(repo_path configured)" shortcut.

Also verifies the follow-up product decision: a README.md alone must never
be enough to show the button — only a real, dedicated preview asset (a
preview*.pdf, or a book's non-empty "preview" subfolder) counts.
"""

from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.github_client import GithubContentError
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType
from app.modules.catalog_showcase.service import _SHOWCASE_PREVIEW_EXISTS_CACHE, CatalogShowcaseService


def _make_item(db: Session, *, slug: str, item_type: CatalogItemType = CatalogItemType.resource) -> CatalogItem:
    item = CatalogItem(
        title=f"Item {slug}",
        slug=slug,
        type=item_type,
        category="testing",
        short_description="short",
        long_description="long",
        image_url="https://example.com/image.png",
        price=Decimal("19.99"),
        currency="EUR",
        status=CatalogItemStatus.published,
        level=CatalogItemLevel.intermediate,
        author="ASE",
        repo_url="https://github.com/ase/catalog-repo",
        repo_path=f"resources/{slug}",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def test_item_with_only_a_readme_hides_the_button(db: Session, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="showcase-readme-only")
    svc = CatalogShowcaseService(db)
    _SHOWCASE_PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch(
        "app.modules.consumer_catalog.service.list_directory",
        return_value=[{"type": "file", "name": "README.md"}],
    ):
        resp = svc.list_items(limit=10, offset=0, type_filter=None, category=None, search=None, sort=None, tags=None)

    assert resp.items[0].hasPreview is False


def test_item_with_a_dedicated_preview_file_shows_the_button(db: Session, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="showcase-real-preview")
    svc = CatalogShowcaseService(db)
    _SHOWCASE_PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch(
        "app.modules.consumer_catalog.service.list_directory",
        return_value=[{"type": "file", "name": "README.md"}, {"type": "file", "name": "preview-sample.pdf"}],
    ):
        resp = svc.list_items(limit=10, offset=0, type_filter=None, category=None, search=None, sort=None, tags=None)

    assert resp.items[0].hasPreview is True


def test_item_with_no_repo_content_hides_the_button(db: Session, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="showcase-no-content")
    svc = CatalogShowcaseService(db)
    _SHOWCASE_PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch(
        "app.modules.consumer_catalog.service.list_directory",
        side_effect=GithubContentError("not found", status_code=404),
    ):
        resp = svc.list_items(limit=10, offset=0, type_filter=None, category=None, search=None, sort=None, tags=None)

    assert resp.items[0].hasPreview is False


def test_book_with_a_non_empty_preview_subfolder_shows_the_button(db: Session, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="showcase-book-preview", item_type=CatalogItemType.book)
    svc = CatalogShowcaseService(db)
    _SHOWCASE_PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch(
        "app.modules.consumer_catalog.service.list_directory",
        return_value=[{"type": "file", "name": "sample-chapter.pdf"}],
    ):
        resp = svc.list_items(limit=10, offset=0, type_filter=None, category=None, search=None, sort=None, tags=None)

    assert resp.items[0].hasPreview is True


def test_preview_check_result_is_cached_across_list_calls(db: Session, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="showcase-cached")
    svc = CatalogShowcaseService(db)
    _SHOWCASE_PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch(
        "app.modules.consumer_catalog.service.list_directory",
        return_value=[{"type": "file", "name": "preview.pdf"}],
    ) as mock_list_dir:
        svc.list_items(limit=10, offset=0, type_filter=None, category=None, search=None, sort=None, tags=None)
        svc.list_items(limit=10, offset=0, type_filter=None, category=None, search=None, sort=None, tags=None)

    # A second list render for the same item must reuse the cached result
    # instead of calling GitHub again.
    mock_list_dir.assert_called_once()
