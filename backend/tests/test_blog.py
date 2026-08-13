from __future__ import annotations

from fastapi.testclient import TestClient

ADMIN_BLOG_URL = "/api/v1/admin/blog"
PUBLIC_BLOG_URL = "/api/v1/public/blog"


def _post_payload(**overrides) -> dict:
    payload = {
        "title": "Why we invest in QA automation",
        "slug": "why-we-invest-in-qa-automation",
        "excerpt": "A short look at the ROI of automated testing.",
        "content_html": "<p>Automated testing pays for itself.</p>",
        "status": "draft",
    }
    payload.update(overrides)
    return payload


def test_draft_post_is_admin_only_not_public(client: TestClient, super_admin_headers: dict[str, str]):
    create_resp = client.post(ADMIN_BLOG_URL, json=_post_payload(), headers=super_admin_headers)
    assert create_resp.status_code == 201
    slug = create_resp.json()["slug"]

    public_list = client.get(PUBLIC_BLOG_URL)
    assert public_list.status_code == 200
    assert all(p["slug"] != slug for p in public_list.json()["items"])

    public_detail = client.get(f"{PUBLIC_BLOG_URL}/{slug}")
    assert public_detail.status_code == 404


def test_publishing_a_post_makes_it_public(client: TestClient, super_admin_headers: dict[str, str]):
    create_resp = client.post(ADMIN_BLOG_URL, json=_post_payload(), headers=super_admin_headers)
    post_id = create_resp.json()["id"]
    slug = create_resp.json()["slug"]

    update_resp = client.patch(f"{ADMIN_BLOG_URL}/{post_id}", json={"status": "published"}, headers=super_admin_headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["published_at"] is not None

    public_detail = client.get(f"{PUBLIC_BLOG_URL}/{slug}")
    assert public_detail.status_code == 200
    assert public_detail.json()["title"] == "Why we invest in QA automation"

    public_list = client.get(PUBLIC_BLOG_URL)
    assert any(p["slug"] == slug for p in public_list.json()["items"])


def test_content_html_is_sanitized_on_write(client: TestClient, super_admin_headers: dict[str, str]):
    malicious = "<script>alert(1)</script><p onclick=\"evil()\">hello</p>"
    create_resp = client.post(
        ADMIN_BLOG_URL,
        json=_post_payload(content_html=malicious, status="published"),
        headers=super_admin_headers,
    )
    assert create_resp.status_code == 201
    stored_html = create_resp.json()["content_html"]
    assert "<script" not in stored_html
    assert "onclick" not in stored_html

    public_detail = client.get(f"{PUBLIC_BLOG_URL}/{_post_payload()['slug']}")
    assert "<script" not in public_detail.json()["content_html"]


def test_independent_user_cannot_manage_the_blog(client: TestClient, independent_headers: dict[str, str]):
    resp = client.post(ADMIN_BLOG_URL, json=_post_payload(), headers=independent_headers)
    assert resp.status_code == 403
