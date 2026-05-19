from fastapi.testclient import TestClient

from app.main import app


def test_plans_catalog_requires_no_auth():
    client = TestClient(app)
    res = client.get("/api/v1/plans/catalog")
    assert res.status_code == 200
    body = res.json()
    assert "items" in body
    assert isinstance(body["items"], list)
    assert "total" in body
