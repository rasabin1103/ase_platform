"""ASE Academy ↔ catalog link: a course catalog item can point to a
simulator course (academy_course_key) and owning it grants access."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.user import User
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository

CATALOG_URL = "/api/v1/admin/catalog"
ACCESS_URL = "/api/v1/academy/courses/{key}/access"


def _course(**overrides) -> dict:
    payload = {
        "title": "Fundamentos de Testing (simulador)",
        "slug": "fundamentos-testing-simulador",
        "type": "course",
        "category": "Testing",
        "short_description": "Curso-juego de testing.",
        "long_description": "Vive tus primeras semanas como QA Junior.",
        "image_url": "https://images.example.com/cover.jpg",
        "price": 49.0,
        "currency": "EUR",
        "status": "published",
        "level": "beginner",
        "author": "ASE",
        "academy_course_key": "testing-fundamentals",
    }
    payload.update(overrides)
    return payload


def test_admin_links_a_course_and_anonymous_access_shows_catalog_item(
    client: TestClient, super_admin_headers: dict[str, str]
):
    resp = client.post(CATALOG_URL, json=_course(academy_course_key="  Testing-Fundamentals "), headers=super_admin_headers)
    assert resp.status_code == 201
    assert resp.json()["academy_course_key"] == "testing-fundamentals"

    access = client.get(ACCESS_URL.format(key="testing-fundamentals"))
    assert access.status_code == 200
    body = access.json()
    assert body["linked"] is True
    assert body["catalogSlug"] == "fundamentos-testing-simulador"
    assert body["authenticated"] is False
    assert body["hasAccess"] is False


def test_invalid_course_key_is_rejected(client: TestClient, super_admin_headers: dict[str, str]):
    resp = client.post(CATALOG_URL, json=_course(academy_course_key="Bad key!"), headers=super_admin_headers)
    assert resp.status_code == 422


def test_unlinked_course_key_reports_not_linked(client: TestClient):
    body = client.get(ACCESS_URL.format(key="unknown-course")).json()
    assert body["linked"] is False
    assert body["hasAccess"] is False


def test_purchase_grants_access(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    created = client.post(CATALOG_URL, json=_course(), headers=super_admin_headers).json()
    url = ACCESS_URL.format(key="testing-fundamentals")
    assert client.get(url, headers=independent_headers).json()["hasAccess"] is False

    CatalogPurchasesRepository(db).add(user_id=independent_user.id, catalog_item_id=created["id"])
    db.commit()
    body = client.get(url, headers=independent_headers).json()
    assert body["authenticated"] is True
    assert body["hasAccess"] is True


def test_free_course_is_open_even_without_login(client: TestClient, super_admin_headers: dict[str, str]):
    client.post(CATALOG_URL, json=_course(price=0), headers=super_admin_headers)
    body = client.get(ACCESS_URL.format(key="testing-fundamentals")).json()
    assert body["isFree"] is True
    assert body["authenticated"] is False
    assert body["hasAccess"] is True


def test_free_draft_course_does_not_open_access(client: TestClient, super_admin_headers: dict[str, str]):
    client.post(CATALOG_URL, json=_course(price=0, status="draft"), headers=super_admin_headers)
    assert client.get(ACCESS_URL.format(key="testing-fundamentals")).json()["hasAccess"] is False


def test_free_course_is_open_to_any_logged_in_user(
    client: TestClient, super_admin_headers: dict[str, str], independent_headers: dict[str, str]
):
    client.post(CATALOG_URL, json=_course(price=0), headers=super_admin_headers)
    body = client.get(ACCESS_URL.format(key="testing-fundamentals"), headers=independent_headers).json()
    assert body["isFree"] is True
    assert body["hasAccess"] is True


def test_update_can_unlink_the_course(client: TestClient, db: Session, super_admin_headers: dict[str, str]):
    created = client.post(CATALOG_URL, json=_course(), headers=super_admin_headers).json()
    resp = client.patch(f"{CATALOG_URL}/{created['id']}", json={"academy_course_key": ""}, headers=super_admin_headers)
    assert resp.status_code == 200
    assert resp.json()["academy_course_key"] is None
    assert db.get(CatalogItem, created["id"]).academy_course_key is None


# --- Saved progress ---------------------------------------------------------
RUN_URL = "/api/v1/academy/runs/testing-fundamentals/m00-primer-dia"


def test_progress_requires_login(client: TestClient):
    assert client.get(RUN_URL).status_code == 401
    assert client.put(RUN_URL, json={"seed": 1, "actions": []}).status_code == 401


def test_progress_round_trip_and_isolation(
    client: TestClient, independent_headers: dict[str, str], super_admin_headers: dict[str, str]
):
    assert client.get(RUN_URL, headers=independent_headers).status_code == 404

    actions = [{"type": "start"}, {"type": "wait", "minutes": 30}]
    saved = client.put(RUN_URL, json={"seed": 42, "actions": actions}, headers=independent_headers)
    assert saved.status_code == 200

    body = client.get(RUN_URL, headers=independent_headers).json()
    assert body["seed"] == 42
    assert body["actions"] == actions
    assert body["finished"] is False

    finished = client.put(
        RUN_URL, json={"seed": 42, "actions": [*actions, {"type": "endDay"}], "finished": True}, headers=independent_headers
    ).json()
    assert finished["finished"] is True and finished["finishedAt"]

    listing = client.get("/api/v1/academy/runs/testing-fundamentals", headers=independent_headers).json()
    assert listing["items"][0]["missionId"] == "m00-primer-dia"
    assert listing["items"][0]["actionsCount"] == 3

    # Another user does not see it.
    assert client.get(RUN_URL, headers=super_admin_headers).status_code == 404


def test_progress_restart_overwrites(client: TestClient, independent_headers: dict[str, str]):
    client.put(RUN_URL, json={"seed": 1, "actions": [{"type": "start"}], "finished": True}, headers=independent_headers)
    client.put(RUN_URL, json={"seed": 2, "actions": []}, headers=independent_headers)
    body = client.get(RUN_URL, headers=independent_headers).json()
    assert body == {**body, "seed": 2, "actions": [], "finished": False, "finishedAt": None}


# --- AI review ----------------------------------------------------------------
REVIEW_URL = "/api/v1/academy/report-review"
_REVIEW_BODY = {
    "story": "Transferencias",
    "acceptanceCriteria": ["El importe debe ser válido."],
    "title": "Transferencia acepta importes negativos",
    "steps": "1. Importe -50\n2. Confirmar",
    "expected": "Error",
    "actual": "Se envía",
    "severity": "critical",
}


def test_ai_review_requires_login(client: TestClient):
    assert client.post(REVIEW_URL, json=_REVIEW_BODY).status_code == 401


def test_ai_review_returns_503_when_not_configured(client: TestClient, independent_headers: dict[str, str], monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "GROQ_API_KEY", None)
    assert client.post(REVIEW_URL, json=_REVIEW_BODY, headers=independent_headers).status_code == 503


def test_ai_review_maps_provider_result(client: TestClient, independent_headers: dict[str, str], monkeypatch):
    from app.core import academy_review, config

    monkeypatch.setattr(config.settings, "GROQ_API_KEY", "test-key")
    monkeypatch.setattr(
        academy_review,
        "_call",
        lambda model, prompt: {"score": 7, "strengths": ["Pasos claros"], "improvements": ["Añade el saldo"], "suggested_title": "T"},
    )
    body = client.post(REVIEW_URL, json=_REVIEW_BODY, headers=independent_headers).json()
    assert body == {"score": 5, "strengths": ["Pasos claros"], "improvements": ["Añade el saldo"], "suggestedTitle": "T"}
