from __future__ import annotations

from fastapi.testclient import TestClient

CATALOG_URL = "/api/v1/admin/catalog"


def _item_payload(**overrides) -> dict:
    payload = {
        "title": "Playwright Masterclass",
        "slug": "playwright-masterclass",
        "type": "course",
        "category": "Testing",
        "short_description": "Learn end-to-end testing with Playwright.",
        "long_description": "A full course covering Playwright fundamentals and advanced patterns.",
        "image_url": "https://images.example.com/cover.jpg",
        "price": 49.0,
        "currency": "EUR",
        "status": "draft",
        "level": "intermediate",
        "author": "ASE",
    }
    payload.update(overrides)
    return payload


def test_super_admin_can_create_list_and_delete_a_catalog_item(client: TestClient, super_admin_headers: dict[str, str]):
    create_resp = client.post(CATALOG_URL, json=_item_payload(), headers=super_admin_headers)
    assert create_resp.status_code == 201
    item_id = create_resp.json()["id"]

    list_resp = client.get(CATALOG_URL, headers=super_admin_headers)
    assert list_resp.status_code == 200
    assert any(i["id"] == item_id for i in list_resp.json()["items"])

    delete_resp = client.delete(f"{CATALOG_URL}/{item_id}", headers=super_admin_headers)
    assert delete_resp.status_code == 204

    list_after = client.get(CATALOG_URL, headers=super_admin_headers)
    assert all(i["id"] != item_id for i in list_after.json()["items"])


def test_independent_user_cannot_manage_the_catalog(client: TestClient, independent_headers: dict[str, str]):
    resp = client.post(CATALOG_URL, json=_item_payload(slug="not-allowed"), headers=independent_headers)
    assert resp.status_code == 403


def test_creating_a_duplicate_slug_is_rejected(client: TestClient, super_admin_headers: dict[str, str]):
    first = client.post(CATALOG_URL, json=_item_payload(), headers=super_admin_headers)
    assert first.status_code == 201

    duplicate = client.post(CATALOG_URL, json=_item_payload(), headers=super_admin_headers)
    assert duplicate.status_code == 409
