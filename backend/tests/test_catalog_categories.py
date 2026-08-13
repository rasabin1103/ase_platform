from __future__ import annotations

from fastapi.testclient import TestClient

CATEGORIES_URL = "/api/v1/admin/catalog-categories"
CATALOG_URL = "/api/v1/admin/catalog"


def _category_payload(**overrides) -> dict:
    payload = {
        "name": "Frameworks",
        "slug": "frameworks",
        "description": "Reusable test automation frameworks.",
        "fields": [
            {"key": "language", "label": "Language", "type": "text", "required": True},
            {"key": "has_ci_template", "label": "Includes CI template", "type": "boolean", "required": False},
        ],
        "is_active": True,
    }
    payload.update(overrides)
    return payload


def test_super_admin_can_create_a_category_with_custom_fields(client: TestClient, super_admin_headers: dict[str, str]):
    resp = client.post(CATEGORIES_URL, json=_category_payload(), headers=super_admin_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Frameworks"
    assert [f["key"] for f in body["fields"]] == ["language", "has_ci_template"]


def test_independent_user_cannot_create_a_category(client: TestClient, independent_headers: dict[str, str]):
    resp = client.post(CATEGORIES_URL, json=_category_payload(), headers=independent_headers)
    assert resp.status_code == 403


def test_creating_a_category_with_a_duplicate_slug_is_rejected(client: TestClient, super_admin_headers: dict[str, str]):
    first = client.post(CATEGORIES_URL, json=_category_payload(), headers=super_admin_headers)
    assert first.status_code == 201
    duplicate = client.post(CATEGORIES_URL, json=_category_payload(name="Frameworks 2"), headers=super_admin_headers)
    assert duplicate.status_code == 409


def test_catalog_item_round_trips_custom_fields_from_its_category(client: TestClient, super_admin_headers: dict[str, str]):
    client.post(CATEGORIES_URL, json=_category_payload(), headers=super_admin_headers)

    item_payload = {
        "title": "ASE QA Framework",
        "slug": "ase-qa-framework",
        "type": "resource",
        "category": "Frameworks",
        "short_description": "A ready-to-use QA automation framework.",
        "long_description": "Playwright + pytest scaffolding with CI templates.",
        "image_url": "https://images.example.com/framework.jpg",
        "price": 0,
        "currency": "EUR",
        "status": "draft",
        "author": "ASE",
        "custom_fields": {"language": "Python", "has_ci_template": True},
    }
    create_resp = client.post(CATALOG_URL, json=item_payload, headers=super_admin_headers)
    assert create_resp.status_code == 201
    item_id = create_resp.json()["id"]
    assert create_resp.json()["custom_fields"] == {"language": "Python", "has_ci_template": True}

    get_resp = client.get(f"{CATALOG_URL}/{item_id}", headers=super_admin_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["custom_fields"] == {"language": "Python", "has_ci_template": True}
