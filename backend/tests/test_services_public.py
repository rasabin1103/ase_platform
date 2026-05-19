from fastapi.testclient import TestClient

from app.main import app


def test_list_services_public_ok():
    client = TestClient(app)
    res = client.get("/api/v1/services")
    assert res.status_code == 200
    body = res.json()
    assert "items" in body
    assert isinstance(body["items"], list)
    assert "total" in body
    if body["items"]:
        row = body["items"][0]
        assert "uuid" in row
        assert "features" in row
        assert "highlights" in row
