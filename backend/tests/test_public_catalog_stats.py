from fastapi.testclient import TestClient

from app.main import app
from app.modules.public_catalog.service import clear_catalog_stats_cache


def test_catalog_stats_public_no_auth():
    clear_catalog_stats_cache()
    client = TestClient(app)
    res = client.get("/api/v1/public/catalog-stats")
    assert res.status_code == 200
    body = res.json()

    assert "total_items" in body
    assert "by_type" in body
    assert "plans" in body
    assert "platform" in body
    assert "last_updated" in body

    by_type = body["by_type"]
    assert set(by_type.keys()) == {"courses", "templates", "books", "resources", "services"}
    for value in by_type.values():
        assert isinstance(value, int)
        assert value >= 0

    plans = body["plans"]
    assert isinstance(plans["total"], int)
    assert plans["total"] >= 0
    assert isinstance(plans["names"], list)

    platform = body["platform"]
    assert platform["status"] in {"operational", "degraded"}
    assert isinstance(platform["db_connected"], bool)

    assert isinstance(body["last_updated"], str)
    assert body["last_updated"]


def test_catalog_stats_openapi_tag():
    clear_catalog_stats_cache()
    client = TestClient(app)
    res = client.get("/openapi.json")
    assert res.status_code == 200
    spec = res.json()
    path = spec["paths"].get("/api/v1/public/catalog-stats", {})
    get_op = path.get("get", {})
    assert "public-catalog-stats" in get_op.get("tags", [])
