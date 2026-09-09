"""Tests for app.modules.book_redemption — redeeming a printed-in-book code
for GitHub collaborator access to the book's private repo. Works both
logged-out (anonymous, keyed by GitHub username) and logged-in (tied to the
account, idempotent per user+book). invite_collaborator (a real GitHub API
call) is mocked throughout — this project has a real GITHUB_ACCESS_TOKEN in
its .env, so without the mock these tests would hit the actual GitHub API."""

from __future__ import annotations

import secrets
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.github_client import GithubInviteError
from app.core.rate_limit import limiter
from app.models.book_repo_redemption import BookRepoRedemption
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType
from app.models.user import User


@pytest.fixture(autouse=True)
def _github_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", "ghp_fake_token_for_tests")


@pytest.fixture(autouse=True)
def _reset_rate_limiter() -> None:
    """POST /book-redemption/redeem is rate-limited to 10/minute (real
    abuse protection, since it's the one public, logged-out-friendly
    endpoint in this module). slowapi's limiter storage is process-global,
    not reset by the db/client fixtures, so without this every test past
    the 10th call in this file would 429 instead of exercising the
    behavior it's actually testing — see the identical caution in
    test_auth.py's module docstring for /auth/register and /auth/login."""
    limiter.reset()


def _make_book(
    db: Session,
    *,
    repo_url: str | None = "https://github.com/arce-sabin/qa-book-code",
    repo_redeem_code: str | None = None,
    status: CatalogItemStatus = CatalogItemStatus.published,
) -> CatalogItem:
    book = CatalogItem(
        title="Test Book",
        slug=f"test-book-{secrets.token_hex(6)}",
        type=CatalogItemType.book,
        category="testing",
        short_description="Short description",
        long_description="Long description",
        image_url="https://example.com/cover.png",
        price=Decimal("0"),
        currency="EUR",
        status=status,
        level=CatalogItemLevel.beginner,
        author="ASE",
        repo_url=repo_url,
        repo_redeem_code=repo_redeem_code or f"CODE-{secrets.token_hex(4).upper()}",
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def test_redeem_invalid_code_returns_404(client: TestClient):
    res = client.post(
        "/api/v1/book-redemption/redeem", json={"code": "NOT-A-REAL-CODE", "github_username": "octocat"},
    )
    assert res.status_code == 404


def test_redeem_draft_book_code_returns_404(db: Session, client: TestClient):
    book = _make_book(db, status=CatalogItemStatus.draft)
    res = client.post(
        "/api/v1/book-redemption/redeem",
        json={"code": book.repo_redeem_code, "github_username": "octocat"},
    )
    assert res.status_code == 404


def test_redeem_code_without_repo_url_returns_409(db: Session, client: TestClient):
    book = _make_book(db, repo_url=None)
    res = client.post(
        "/api/v1/book-redemption/redeem",
        json={"code": book.repo_redeem_code, "github_username": "octocat"},
    )
    assert res.status_code == 409


def test_redeem_fails_when_github_not_configured(
    db: Session, client: TestClient, monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(settings, "GITHUB_ACCESS_TOKEN", None)
    book = _make_book(db)
    res = client.post(
        "/api/v1/book-redemption/redeem",
        json={"code": book.repo_redeem_code, "github_username": "octocat"},
    )
    assert res.status_code == 503


def test_redeem_code_is_case_insensitive(db: Session, client: TestClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        "app.modules.book_redemption.service.invite_collaborator", lambda **kw: "invited",
    )
    _make_book(db, repo_redeem_code="MixedCase123")
    res = client.post(
        "/api/v1/book-redemption/redeem",
        json={"code": "mixedcase123", "github_username": "octocat"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["invite_status"] == "invited"


def test_redeem_anonymous_succeeds_and_logs_a_row(
    db: Session, client: TestClient, monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(
        "app.modules.book_redemption.service.invite_collaborator", lambda **kw: "invited",
    )
    book = _make_book(db)
    res = client.post(
        "/api/v1/book-redemption/redeem",
        json={"code": book.repo_redeem_code, "github_username": "octocat"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["slug"] == book.slug
    assert body["invite_status"] == "invited"

    redemption = db.query(BookRepoRedemption).filter(BookRepoRedemption.catalog_item_id == book.id).one()
    assert redemption.user_id is None
    assert redemption.github_username == "octocat"


def test_redeem_logged_in_ties_redemption_to_account(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(
        "app.modules.book_redemption.service.invite_collaborator", lambda **kw: "already_collaborator",
    )
    book = _make_book(db)
    res = client.post(
        "/api/v1/book-redemption/redeem",
        json={"code": book.repo_redeem_code, "github_username": "octo-reader"},
        headers=independent_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["invite_status"] == "already_collaborator"

    redemption = db.query(BookRepoRedemption).filter(
        BookRepoRedemption.catalog_item_id == book.id, BookRepoRedemption.user_id == independent_user.id,
    ).one()
    assert redemption.github_username == "octo-reader"

    me_res = client.get("/api/v1/book-redemption/me", headers=independent_headers)
    assert me_res.status_code == 200
    items = me_res.json()["items"]
    assert len(items) == 1
    assert items[0]["slug"] == book.slug


def test_redeem_logged_in_twice_updates_same_row_instead_of_duplicating(
    db: Session, client: TestClient, independent_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(
        "app.modules.book_redemption.service.invite_collaborator", lambda **kw: "invited",
    )
    book = _make_book(db)
    for username in ("first-username", "updated-username"):
        res = client.post(
            "/api/v1/book-redemption/redeem",
            json={"code": book.repo_redeem_code, "github_username": username},
            headers=independent_headers,
        )
        assert res.status_code == 200, res.text

    rows = db.query(BookRepoRedemption).filter(BookRepoRedemption.catalog_item_id == book.id).all()
    assert len(rows) == 1
    assert rows[0].github_username == "updated-username"


def test_redeem_maps_github_username_not_found_to_422(
    db: Session, client: TestClient, monkeypatch: pytest.MonkeyPatch,
):
    def _raise(**kw):
        raise GithubInviteError("Not Found", status_code=404)

    monkeypatch.setattr("app.modules.book_redemption.service.invite_collaborator", _raise)
    book = _make_book(db)
    res = client.post(
        "/api/v1/book-redemption/redeem",
        json={"code": book.repo_redeem_code, "github_username": "this-user-does-not-exist"},
    )
    assert res.status_code == 422


def test_redeem_maps_other_github_errors_to_502(db: Session, client: TestClient, monkeypatch: pytest.MonkeyPatch):
    def _raise(**kw):
        raise GithubInviteError("Server error", status_code=500)

    monkeypatch.setattr("app.modules.book_redemption.service.invite_collaborator", _raise)
    book = _make_book(db)
    res = client.post(
        "/api/v1/book-redemption/redeem",
        json={"code": book.repo_redeem_code, "github_username": "octocat"},
    )
    assert res.status_code == 502


def test_list_my_redemptions_empty_for_new_user(client: TestClient, independent_headers: dict[str, str]):
    res = client.get("/api/v1/book-redemption/me", headers=independent_headers)
    assert res.status_code == 200
    assert res.json()["items"] == []
