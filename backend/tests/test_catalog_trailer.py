"""Tráiler opcional de un ítem del catálogo (CatalogItem.trailer_url)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.video_urls import normalize_trailer_url, youtube_video_id

CATALOG_URL = "/api/v1/admin/catalog"
SHOWCASE_URL = "/api/v1/catalog-showcase/course/{slug}"
ACCESS_URL = "/api/v1/academy/courses/{key}/access"
CANONICAL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


@pytest.mark.parametrize(
    "raw",
    [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtube.com/watch?v=dQw4w9WgXcQ&t=12s&list=PL1",
        "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ?si=abc",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
        "  https://www.youtube.com/live/dQw4w9WgXcQ  ",
    ],
)
def test_youtube_links_are_canonicalised(raw: str):
    assert normalize_trailer_url(raw) == CANONICAL


def test_own_video_file_is_kept():
    url = "https://cdn.example.com/trailers/karate.mp4"
    assert normalize_trailer_url(url) == url
    assert youtube_video_id(url) is None


@pytest.mark.parametrize("raw", [None, "", "   "])
def test_empty_means_no_trailer(raw):
    assert normalize_trailer_url(raw) is None


@pytest.mark.parametrize(
    "raw",
    [
        "https://www.youtube.com/channel/UC123",
        "https://www.youtube.com/watch?v=short",
        "http://cdn.example.com/trailer.mp4",
        "https://example.com/page",
        "not a url",
    ],
)
def test_invalid_trailer_is_rejected(raw: str):
    with pytest.raises(ValueError):
        normalize_trailer_url(raw)


def _course(**overrides) -> dict:
    payload = {
        "title": "Karate Framework (simulador)",
        "slug": "karate-framework-simulador",
        "type": "course",
        "category": "Testing",
        "short_description": "Curso-juego de Karate.",
        "long_description": "Automatiza una API real.",
        "image_url": "https://images.example.com/cover.jpg",
        "price": 49.0,
        "currency": "EUR",
        "status": "published",
        "level": "intermediate",
        "author": "ASE",
        "academy_course_key": "karate-framework",
    }
    payload.update(overrides)
    return payload


def test_trailer_is_optional(client: TestClient, super_admin_headers: dict[str, str]):
    resp = client.post(CATALOG_URL, json=_course(), headers=super_admin_headers)
    assert resp.status_code == 201
    assert resp.json()["trailer_url"] is None
    detail = client.get(SHOWCASE_URL.format(slug="karate-framework-simulador")).json()
    assert detail["trailerUrl"] is None


def test_trailer_round_trip_and_clear(client: TestClient, super_admin_headers: dict[str, str]):
    created = client.post(
        CATALOG_URL, json=_course(trailer_url="https://youtu.be/dQw4w9WgXcQ"), headers=super_admin_headers
    )
    assert created.status_code == 201
    item = created.json()
    assert item["trailer_url"] == CANONICAL

    assert client.get(SHOWCASE_URL.format(slug=item["slug"])).json()["trailerUrl"] == CANONICAL
    assert client.get(ACCESS_URL.format(key="karate-framework")).json()["trailerUrl"] == CANONICAL

    cleared = client.patch(f"{CATALOG_URL}/{item['id']}", json={"trailer_url": ""}, headers=super_admin_headers)
    assert cleared.status_code == 200
    assert cleared.json()["trailer_url"] is None


def test_invalid_trailer_returns_422(client: TestClient, super_admin_headers: dict[str, str]):
    resp = client.post(CATALOG_URL, json=_course(trailer_url="https://example.com/page"), headers=super_admin_headers)
    assert resp.status_code == 422
