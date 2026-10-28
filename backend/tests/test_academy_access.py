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


def test_free_course_needs_an_account(client: TestClient, super_admin_headers: dict[str, str]):
    # Gratis con registro: sin sesión solo la primera misión (demo, la decide el frontend).
    client.post(CATALOG_URL, json=_course(price=0), headers=super_admin_headers)
    body = client.get(ACCESS_URL.format(key="testing-fundamentals")).json()
    assert body["isFree"] is True
    assert body["authenticated"] is False
    assert body["hasAccess"] is False


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


SERIES_URL = "/api/v1/academy/courses/{key}/series"


def _sql_series(client: TestClient, headers: dict[str, str]) -> list[dict]:
    """Ruta SQL: el 1 gratis, el 2 de pago, el 3 aún sin curso del simulador."""
    common = {"series_name": "Ruta SQL", "academy_course_key": None}
    specs = [
        {"title": "SQL desde cero", "slug": "sql-desde-cero", "price": 0, "series_order": 1, "academy_course_key": "sql-iniciacion"},
        {"title": "SQL intermedio", "slug": "sql-intermedio", "price": 39, "series_order": 2, "academy_course_key": "sql-intermedio"},
        {"title": "SQL avanzado", "slug": "sql-avanzado", "price": 49, "series_order": 3},
    ]
    created = []
    for spec in reversed(specs):  # orden de creación distinto del de la serie
        resp = client.post(CATALOG_URL, json=_course(**{**common, **spec}), headers=headers)
        assert resp.status_code == 201, resp.text
        created.append(resp.json())
    return created


def test_series_lists_every_course_in_order_for_anonymous(client: TestClient, super_admin_headers: dict[str, str]):
    _sql_series(client, super_admin_headers)
    body = client.get(SERIES_URL.format(key="sql-intermedio")).json()
    assert body["seriesName"] == "Ruta SQL"
    items = body["items"]
    assert [i["catalogSlug"] for i in items] == ["sql-desde-cero", "sql-intermedio", "sql-avanzado"]
    assert [i["isCurrent"] for i in items] == [False, True, False]
    assert [i["courseKey"] for i in items] == ["sql-iniciacion", "sql-intermedio", None]
    assert items[0]["isFree"] is True and items[1]["isFree"] is False
    assert all(i["hasAccess"] is False and i["missionsStarted"] == 0 for i in items)


def test_series_shows_progress_and_access_for_the_user(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    _sql_series(client, super_admin_headers)
    client.put("/api/v1/academy/runs/sql-iniciacion/m00-primera-consulta", json={"seed": 1, "actions": [], "finished": True}, headers=independent_headers)
    client.put("/api/v1/academy/runs/sql-iniciacion/m01-filtrar", json={"seed": 1, "actions": [{"type": "start"}]}, headers=independent_headers)
    items = {i["catalogSlug"]: i for i in client.get(SERIES_URL.format(key="sql-iniciacion"), headers=independent_headers).json()["items"]}
    assert items["sql-desde-cero"]["hasAccess"] is True  # gratis con cuenta
    assert (items["sql-desde-cero"]["missionsStarted"], items["sql-desde-cero"]["missionsFinished"]) == (2, 1)
    assert items["sql-intermedio"]["hasAccess"] is False
    assert items["sql-intermedio"]["missionsStarted"] == 0

    paid = db.query(CatalogItem).filter(CatalogItem.slug == "sql-intermedio").one()
    CatalogPurchasesRepository(db).add(user_id=independent_user.id, catalog_item_id=paid.id)
    db.commit()
    items = {i["catalogSlug"]: i for i in client.get(SERIES_URL.format(key="sql-iniciacion"), headers=independent_headers).json()["items"]}
    assert items["sql-intermedio"]["hasAccess"] is True


def test_series_is_empty_without_series_or_catalog_item(client: TestClient, super_admin_headers: dict[str, str]):
    assert client.get(SERIES_URL.format(key="unknown-course")).json()["items"] == []
    client.post(CATALOG_URL, json=_course(), headers=super_admin_headers)
    body = client.get(SERIES_URL.format(key="testing-fundamentals")).json()
    assert body["seriesName"] is None and body["items"] == []


RECENT_URL = "/api/v1/consumer-catalog/me/recent"


def test_played_academy_courses_show_in_continue_where_you_left_off(
    client: TestClient, super_admin_headers: dict[str, str], independent_headers: dict[str, str]
):
    _sql_series(client, super_admin_headers)
    assert client.get(RECENT_URL, headers=independent_headers).json()["items"] == []

    # Curso gratis, nunca comprado: aparece en cuanto se juega una misión.
    client.put("/api/v1/academy/runs/sql-iniciacion/m00-primera-consulta", json={"seed": 1, "actions": [{"type": "start"}]}, headers=independent_headers)
    items = client.get(RECENT_URL, headers=independent_headers).json()["items"]
    assert [i["slug"] for i in items] == ["sql-desde-cero"]
    assert items[0]["academyCourseKey"] == "sql-iniciacion"

    # El último jugado va primero; el mismo curso no se repite.
    client.put("/api/v1/academy/runs/sql-intermedio/m00-subconsultas", json={"seed": 1, "actions": []}, headers=independent_headers)
    client.put("/api/v1/academy/runs/sql-intermedio/m01-cte", json={"seed": 1, "actions": []}, headers=independent_headers)
    items = client.get(RECENT_URL, headers=independent_headers).json()["items"]
    assert [i["slug"] for i in items] == ["sql-intermedio", "sql-desde-cero"]


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
