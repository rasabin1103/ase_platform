from __future__ import annotations

import html as html_lib
import json

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
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


def _to_detail(
    post: BlogPost,
    *,
    likes_count: int = 0,
    dislikes_count: int = 0,
    my_reaction=None,
    comments_count: int = 0,
    shares_count: int = 0,
) -> BlogPostPublicDetail:
    card = _to_card(post)
    return BlogPostPublicDetail(
        **card.model_dump(),
        content_html=post.content_html,
        meta_title=post.meta_title,
        meta_description=post.meta_description,
        likesCount=likes_count,
        dislikesCount=dislikes_count,
        myReaction=my_reaction,
        commentsCount=comments_count,
        sharesCount=shares_count,
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


def get_public_post_by_slug(db: Session, slug: str, *, viewer_user_id: int | None) -> BlogPostPublicDetail:
    repo = BlogRepository(db)
    post = repo.get_by_slug(slug)
    if post is None or post.status != BlogPostStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    # Local imports avoid a circular import at module load time — blog_engagement
    # doesn't depend on public_blog, but this keeps that one-directional.
    from app.modules.blog_engagement.repository import BlogEngagementRepository

    engagement = BlogEngagementRepository(db)
    likes, dislikes = engagement.reaction_counts_for_post(post.id)
    my_reaction = None
    if viewer_user_id is not None:
        existing = engagement.get_reaction(blog_post_id=post.id, user_id=viewer_user_id)
        my_reaction = existing.reaction if existing is not None else None
    comments_count = engagement.comment_counts_for_posts([post.id]).get(post.id, 0)
    shares_count = engagement.share_totals_for_posts([post.id]).get(post.id, 0)

    repo.increment_views(post, authenticated=viewer_user_id is not None)
    db.commit()
    db.refresh(post)

    return _to_detail(
        post,
        likes_count=likes,
        dislikes_count=dislikes,
        my_reaction=my_reaction,
        comments_count=comments_count,
        shares_count=shares_count,
    )


def get_published_post_or_404(db: Session, post_id: int) -> BlogPost:
    """Used by the cover-image endpoint — only published posts' images are
    servable without auth, so a draft's cover can't be probed/leaked by id."""
    post = BlogRepository(db).get_by_id(post_id)
    if post is None or post.status != BlogPostStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return post


def _abs_url(path_or_url: str, base_url: str) -> str:
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        return path_or_url
    return f"{base_url.rstrip('/')}{path_or_url}"


def render_public_post_preview_html(db: Session, slug: str, *, backend_base_url: str) -> str:
    """Server-rendered HTML with Open Graph / Twitter Card meta tags for a
    single published article.

    Social network crawlers (LinkedIn, Facebook, X, WhatsApp) fetch the raw
    HTML of a shared link and never execute JavaScript, so the SPA's
    client-side <title>/<meta name="description"> (set by the frontend's
    usePageTitle hook, long after hydration) are invisible to them — sharing
    the plain /blog/{slug} SPA route always produces an empty/broken preview
    card. This endpoint is what the share buttons hand to each network
    instead: it renders the article's real title, description, cover image
    and canonical link as static meta tags a crawler can read immediately.
    A human who actually clicks through the resulting card is bounced
    straight back to the real article page via a 0-second meta refresh, so
    they never actually see this page. Does not touch the view counter —
    only the SPA's own detail fetch (get_public_post_by_slug) does that.
    """
    repo = BlogRepository(db)
    post = repo.get_by_slug(slug)
    if post is None or post.status != BlogPostStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    article_url = f"{settings.FRONTEND_URL.rstrip('/')}/blog/{slug}"
    title = post.meta_title or post.title
    description = post.meta_description or post.excerpt or ""

    cover = resolve_blog_cover_url(post)
    image_url = _abs_url(cover, backend_base_url) if cover else None

    def esc(value: str) -> str:
        return html_lib.escape(value, quote=True)

    image_tags = ""
    if image_url:
        image_tags = (
            f'<meta property="og:image" content="{esc(image_url)}" />\n'
            f'<meta name="twitter:image" content="{esc(image_url)}" />\n'
        )

    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Arce Sabin Engineering" />
<meta property="og:title" content="{esc(title)}" />
<meta property="og:description" content="{esc(description)}" />
<meta property="og:url" content="{esc(article_url)}" />
{image_tags}<meta name="twitter:card" content="{'summary_large_image' if image_url else 'summary'}" />
<meta name="twitter:title" content="{esc(title)}" />
<meta name="twitter:description" content="{esc(description)}" />
<link rel="canonical" href="{esc(article_url)}" />
<meta http-equiv="refresh" content="0; url={esc(article_url)}" />
</head>
<body>
<p><a href="{esc(article_url)}">{esc(title)}</a></p>
<script>window.location.replace({json.dumps(article_url)});</script>
</body>
</html>"""
