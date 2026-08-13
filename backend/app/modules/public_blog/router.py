from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.media_urls import blog_has_stored_image
from app.modules.public_blog.schemas import BlogPostPublicDetail, BlogPostPublicListResponse
from app.modules.public_blog.service import (
    get_public_post_by_slug,
    get_published_post_or_404,
    list_public_posts,
    list_public_tags,
)

router = APIRouter(prefix="/api/v1/public", tags=["public-blog"])


@router.get("/blog", response_model=BlogPostPublicListResponse)
def read_public_blog_list(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str | None = None,
    tags: list[str] | None = Query(default=None),
    db: Session = Depends(get_db),
) -> BlogPostPublicListResponse:
    """Published posts only — no auth."""
    return list_public_posts(db, limit=limit, offset=offset, search=search, tags=tags)


@router.get("/blog/tags", response_model=list[str])
def read_public_blog_tags(db: Session = Depends(get_db)) -> list[str]:
    """Distinct tags across published posts only — no auth."""
    return list_public_tags(db)


@router.get("/blog/{slug}", response_model=BlogPostPublicDetail)
def read_public_blog_post(slug: str, db: Session = Depends(get_db)) -> BlogPostPublicDetail:
    """Full article by slug — 404s for drafts and unknown slugs alike, no auth."""
    return get_public_post_by_slug(db, slug)


@router.get("/blog-cover/{post_id}")
def read_public_blog_cover_image(post_id: int, db: Session = Depends(get_db)):
    """Binary cover image for a published post — no auth. Served from this
    dedicated public path rather than /api/v1/media/... because that router
    requires catalog.read, which the public blog must not need."""
    post = get_published_post_or_404(db, post_id)
    if not blog_has_stored_image(post):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(content=bytes(post.cover_image_data), media_type=post.cover_image_mime or "image/jpeg")
