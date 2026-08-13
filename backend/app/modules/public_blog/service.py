from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.media_urls import resolve_blog_cover_url
from app.models.blog_post import BlogPost
from app.models.enums import BlogPostStatus
from app.modules.public_blog.repository import BlogRepository
from app.modules.public_blog.schemas import (
    BlogPostPublicCard,
    BlogPostPublicDetail,
    BlogPostPublicListResponse,
)

_PUBLIC_STATUSES = (BlogPostStatus.published,)


def _to_card(post: BlogPost) -> BlogPostPublicCard:
    return BlogPostPublicCard(
        uuid=post.uuid,
        title=post.title,
        slug=post.slug,
        excerpt=post.excerpt,
        cover_image_url=resolve_blog_cover_url(post),
        author_name=post.author_name,
        tags=post.tags_json or [],
        published_at=post.published_at,
    )


def _to_detail(post: BlogPost) -> BlogPostPublicDetail:
    card = _to_card(post)
    return BlogPostPublicDetail(
        **card.model_dump(),
        content_html=post.content_html,
        meta_title=post.meta_title,
        meta_description=post.meta_description,
    )


def list_public_posts(
    db: Session,
    *,
    limit: int,
    offset: int,
    search: str | None = None,
    tags: list[str] | None = None,
) -> BlogPostPublicListResponse:
    repo = BlogRepository(db)
    posts, total = repo.list(limit=limit, offset=offset, search=search, tags=tags, statuses=_PUBLIC_STATUSES)
    return BlogPostPublicListResponse(items=[_to_card(p) for p in posts], limit=limit, offset=offset, total=total)


def list_public_tags(db: Session) -> list[str]:
    return BlogRepository(db).distinct_tags(statuses=_PUBLIC_STATUSES)


def get_public_post_by_slug(db: Session, slug: str) -> BlogPostPublicDetail:
    post = BlogRepository(db).get_by_slug(slug)
    if post is None or post.status != BlogPostStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    return _to_detail(post)


def get_published_post_or_404(db: Session, post_id: int) -> BlogPost:
    """Used by the cover-image endpoint — only published posts' images are
    servable without auth, so a draft's cover can't be probed/leaked by id."""
    post = BlogRepository(db).get_by_id(post_id)
    if post is None or post.status != BlogPostStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return post
