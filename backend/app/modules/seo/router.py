"""sitemap.xml y robots.txt generados al vuelo desde la base de datos.

Se sirven en la raíz del backend y Vercel los publica en el dominio público
(frontend/vercel.json: /sitemap.xml y /robots.txt → backend). Así, cada
entrada nueva del blog, ítem publicado del catálogo o curso de ASE Academy
aparece en el sitemap sin tocar código ni redesplegar.

Rutas públicas: ver frontend/src/app/router.tsx. Al añadir una página
pública nueva, añádela a STATIC_PAGES (y, si es privada, a PRIVATE_PATHS).
"""

from __future__ import annotations

from datetime import datetime, timezone
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.media_urls import catalog_cover_image_public_path, catalog_has_stored_image
from app.models.blog_post import BlogPost
from app.models.catalog_item import CatalogItem
from app.models.enums import BlogPostStatus, CatalogItemStatus
from app.modules.academy.exam_config import EXAMS

router = APIRouter(include_in_schema=False)

# (ruta, changefreq, prioridad). Google ignora changefreq/priority, pero
# otros buscadores los usan; lastmod solo se pone cuando es real.
STATIC_PAGES: list[tuple[str, str, str]] = [
    ("/", "weekly", "1.0"),
    ("/services", "monthly", "0.9"),
    ("/platform", "monthly", "0.8"),
    ("/pricing", "weekly", "0.9"),
    ("/catalog", "daily", "0.9"),
    ("/academy", "weekly", "0.8"),
    ("/blog", "daily", "0.8"),
    ("/about", "monthly", "0.6"),
    ("/story", "yearly", "0.5"),
    ("/contact", "yearly", "0.6"),
    ("/redeem", "yearly", "0.3"),
    ("/privacy-policy", "yearly", "0.2"),
    ("/terms-of-service", "yearly", "0.2"),
]

# Áreas privadas o sin valor para buscadores (robots.txt).
PRIVATE_PATHS: list[str] = [
    "/app",
    "/dashboard",
    "/admin",
    "/profile",
    "/notifications",
    "/organization",
    "/onboarding",
    "/select-organization",
    "/users",
    "/requests",
    "/catalog/",  # el catálogo privado (/catalog/products…, /catalog/:type/:slug)
    "/favorites",
    "/my-",
    "/preferencias",
    "/redeem-code",
    "/test-execution",
    "/booking",
    "/job-postings",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/newsletter/",
    "/academy/certificado/",  # certificados con nombre del titular
    "/api/",
]

# Excepciones dentro de rutas bloqueadas (Google aplica la regla más específica).
ALLOWED_PATHS: list[str] = [
    "/catalog/item/",  # fichas públicas del catálogo
    "/api/v1/public/catalog-cover/",  # portadas que usan los datos estructurados
]


def _site() -> str:
    return settings.PUBLIC_SITE_URL.rstrip("/")


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")


def _absolute(url: str) -> str:
    return url if url.startswith(("http://", "https://")) else f"{_site()}{url if url.startswith('/') else '/' + url}"


def _url(
    path: str,
    *,
    lastmod: datetime | None = None,
    changefreq: str | None = None,
    priority: str | None = None,
    image: str | None = None,
    image_title: str | None = None,
) -> str:
    parts = [f"<loc>{escape(_site() + path)}</loc>"]
    if (stamp := _iso(lastmod)) is not None:
        parts.append(f"<lastmod>{stamp}</lastmod>")
    if changefreq:
        parts.append(f"<changefreq>{changefreq}</changefreq>")
    if priority:
        parts.append(f"<priority>{priority}</priority>")
    if image:
        title = f"<image:title>{escape(image_title)}</image:title>" if image_title else ""
        parts.append(f"<image:image><image:loc>{escape(_absolute(image))}</image:loc>{title}</image:image>")
    return "  <url>" + "".join(parts) + "</url>"


def build_sitemap(db: Session) -> str:
    posts = db.execute(
        select(BlogPost.slug, BlogPost.updated_at, BlogPost.published_at)
        .where(BlogPost.status == BlogPostStatus.published)
        .order_by(BlogPost.published_at.desc().nulls_last())
    ).all()
    items = list(
        db.execute(
            select(CatalogItem)
            .where(CatalogItem.status == CatalogItemStatus.published)
            .order_by(CatalogItem.updated_at.desc())
        ).scalars()
    )
    latest_post = max((p.updated_at for p in posts), default=None)
    latest_item = max((i.updated_at for i in items), default=None)
    lastmod_for = {"/blog": latest_post, "/catalog": latest_item}

    urls = [
        _url(path, lastmod=lastmod_for.get(path), changefreq=freq, priority=prio) for path, freq, prio in STATIC_PAGES
    ]
    # ASE Academy: página de cada curso y de su simulacro.
    for key in EXAMS:
        urls.append(_url(f"/academy/{key}", changefreq="weekly", priority="0.8"))
        urls.append(_url(f"/academy/{key}/simulacro", changefreq="monthly", priority="0.6"))
    for post in posts:
        urls.append(_url(f"/blog/{post.slug}", lastmod=post.updated_at or post.published_at, changefreq="monthly", priority="0.7"))
    for item in items:
        image = catalog_cover_image_public_path(item.id) if catalog_has_stored_image(item) else (item.image_url or None)
        urls.append(
            _url(
                f"/catalog/item/{item.type.value}/{item.slug}",
                lastmod=item.updated_at,
                changefreq="weekly",
                priority="0.8",
                image=image,
                image_title=item.title,
            )
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + "\n".join(urls) + "\n</urlset>\n"
    )


def build_robots() -> str:
    lines = ["User-agent: *", "Allow: /"]
    lines += [f"Allow: {path}" for path in ALLOWED_PATHS]
    lines += [f"Disallow: {path}" for path in PRIVATE_PATHS]
    lines += ["", f"Sitemap: {_site()}/sitemap.xml", ""]
    return "\n".join(lines)


_CACHE = {"Cache-Control": "public, max-age=3600"}


@router.get("/sitemap.xml")
def sitemap(db: Session = Depends(get_db)) -> Response:
    return Response(content=build_sitemap(db), media_type="application/xml", headers=_CACHE)


@router.get("/robots.txt")
def robots() -> Response:
    return Response(content=build_robots(), media_type="text/plain", headers=_CACHE)


__all__ = ["router", "build_sitemap", "build_robots"]
