"""Verifies the catalog list/card "Vista previa" gating fix: a priced item
a viewer doesn't own must only report hasResourceContent=True when a real
preview actually exists (a preview*.pdf, or — for a book — anything inside
its "preview" subfolder) — never just because an admin configured a
repo_path. Free items and items the viewer already owns always report
hasResourceContent=True once a repo is configured, since they always have
something real to show (the content endpoint decides full vs preview
either way) and must never trigger a GitHub call at all.

See ConsumerCatalogService._non_owner_preview_exists_cached /
_PREVIEW_EXISTS_CACHE — this used to always be `bool(item.repo_path and
resolvable repo)`, which is what let the catalog cards show "Vista previa"
for an item with a repo configured but nothing actually uploaded to it.
"""

from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.github_client import GithubContentError
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType
from app.models.user import User
from app.modules.consumer_catalog.service import _PREVIEW_EXISTS_CACHE, ConsumerCatalogService


def _make_item(db: Session, *, slug: str, price: str, item_type: CatalogItemType = CatalogItemType.resource) -> CatalogItem:
    item = CatalogItem(
        title=f"Item {slug}",
        slug=slug,
        type=item_type,
        category="testing",
        short_description="short",
        long_description="long",
        image_url="https://example.com/image.png",
        price=Decimal(price),
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


def test_priced_unowned_item_without_a_real_preview_hides_the_button(db: Session, independent_user: User, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="no-preview-item", price="29.99")
    svc = ConsumerCatalogService(db)
    _PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch(
        "app.modules.consumer_catalog.service.list_directory",
        side_effect=GithubContentError("not found", status_code=404),
    ):
        reads = svc._to_reads_with_ratings(
            [item], user_id=independent_user.id, favorite_slugs=set(), purchased_slugs=set()
        )

    assert reads[0].hasResourceContent is False


def test_priced_unowned_item_with_a_real_preview_shows_the_button(db: Session, independent_user: User, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="has-preview-item", price="29.99")
    svc = ConsumerCatalogService(db)
    _PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch(
        "app.modules.consumer_catalog.service.list_directory",
        return_value=[{"type": "file", "name": "preview-sample.pdf"}],
    ):
        reads = svc._to_reads_with_ratings(
            [item], user_id=independent_user.id, favorite_slugs=set(), purchased_slugs=set()
        )

    assert reads[0].hasResourceContent is True


def test_free_item_never_triggers_a_github_call(db: Session, independent_user: User, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="free-item", price="0.00")
    svc = ConsumerCatalogService(db)
    _PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch("app.modules.consumer_catalog.service.list_directory") as mock_list_dir:
        reads = svc._to_reads_with_ratings(
            [item], user_id=independent_user.id, favorite_slugs=set(), purchased_slugs=set()
        )

    assert reads[0].hasResourceContent is True
    mock_list_dir.assert_not_called()


def test_purchased_item_never_triggers_a_github_call(db: Session, independent_user: User, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="owned-item", price="29.99")
    svc = ConsumerCatalogService(db)
    _PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch("app.modules.consumer_catalog.service.list_directory") as mock_list_dir:
        reads = svc._to_reads_with_ratings(
            [item], user_id=independent_user.id, favorite_slugs=set(), purchased_slugs={item.slug}
        )

    assert reads[0].hasResourceContent is True
    mock_list_dir.assert_not_called()


def test_preview_check_result_is_cached_across_calls(db: Session, independent_user: User, monkeypatch):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "fake-token")
    item = _make_item(db, slug="cached-preview-item", price="29.99")
    svc = ConsumerCatalogService(db)
    _PREVIEW_EXISTS_CACHE.pop(item.id, None)

    with patch(
        "app.modules.consumer_catalog.service.list_directory",
        return_value=[{"type": "file", "name": "preview.pdf"}],
    ) as mock_list_dir:
        svc._to_reads_with_ratings([item], user_id=independent_user.id, favorite_slugs=set(), purchased_slugs=set())
        svc._to_reads_with_ratings([item], user_id=independent_user.id, favorite_slugs=set(), purchased_slugs=set())

    # A second list render for the same item must reuse the cached result
    # instead of calling GitHub again — this is what keeps a catalog list
    # page from firing one GitHub call per row on every load.
    mock_list_dir.assert_called_once()
