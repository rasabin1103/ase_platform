"""sitemap.xml y robots.txt dinámicos."""

from __future__ import annotations

from datetime import datetime, timezone
from xml.etree import ElementTree

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.blog_post import BlogPost
from app.models.catalog_item import CatalogItem
from app.models.enums import BlogPostStatus, CatalogItemStatus, CatalogItemType

SITE = "https://www.arcesabinengineering.com"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "image": "http://www.google.com/schemas/sitemap-image/1.1"}


def _item(slug: str, status: CatalogItemStatus) -> CatalogItem:
    return CatalogItem(
        title=f"Item {slug} & co",
        slug=slug,
        type=CatalogItemType.book,
        category="Testing",
        short_description="x",
        long_description="x",
        image_url="https://images.example.com/cover.jpg",
        price=19.99,
        currency="EUR",
        status=status,
        author="ASE",
    )


def test_sitemap_lists_public_content_and_updates_with_new_items(client: TestClient, db: Session):
    db.add_all(
        [
            _item("libro-publicado", CatalogItemStatus.published),
            _item("libro-borrador", CatalogItemStatus.draft),
            BlogPost(
                title="Post",
                slug="post-publicado",
                excerpt="x",
                content_html="<p>x</p>",
                status=BlogPostStatus.published,
                published_at=datetime(2026, 10, 1, tzinfo=timezone.utc),
            ),
            BlogPost(title="Draft", slug="post-borrador", excerpt="x", content_html="<p>x</p>", status=BlogPostStatus.draft),
        ]
    )
    db.commit()

    resp = client.get("/sitemap.xml")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/xml")
    root = ElementTree.fromstring(resp.content)
    locs = [el.text for el in root.findall("s:url/s:loc", NS)]
    assert f"{SITE}/" in locs
    assert f"{SITE}/pricing" in locs
    assert f"{SITE}/academy/qa-profesional" in locs
    assert f"{SITE}/academy/testing-fundamentals/simulacro" in locs
    assert f"{SITE}/academy/karate-framework" in locs
    assert f"{SITE}/academy/karate-framework/simulacro" in locs
    assert f"{SITE}/blog/post-publicado" in locs
    assert f"{SITE}/catalog/item/book/libro-publicado" in locs
    assert not any("borrador" in loc for loc in locs)
    assert len(locs) == len(set(locs))
    images = [el.text for el in root.findall("s:url/image:image/image:loc", NS)]
    assert "https://images.example.com/cover.jpg" in images

    db.add(_item("libro-nuevo", CatalogItemStatus.published))
    db.commit()
    assert f"{SITE}/catalog/item/book/libro-nuevo" in client.get("/sitemap.xml").text


def test_robots_blocks_private_areas_and_points_to_sitemap(client: TestClient):
    resp = client.get("/robots.txt")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/plain")
    body = resp.text
    assert f"Sitemap: {SITE}/sitemap.xml" in body
    for line in ("Disallow: /admin", "Disallow: /dashboard", "Disallow: /catalog/", "Allow: /catalog/item/", "Disallow: /academy/certificado/"):
        assert line in body.splitlines()


def test_sitemap_includes_academy_courses_sold_in_the_catalog(client: TestClient, db: Session):
    item = _item("curso-nuevo", CatalogItemStatus.published)
    item.type = CatalogItemType.course
    item.academy_course_key = "curso-sin-examen"
    db.add(item)
    db.commit()
    locs = [el.text for el in ElementTree.fromstring(client.get("/sitemap.xml").content).findall("s:url/s:loc", NS)]
    assert f"{SITE}/academy/curso-sin-examen" in locs
    assert f"{SITE}/academy/curso-sin-examen/simulacro" not in locs
