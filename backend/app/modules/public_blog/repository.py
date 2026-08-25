from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import array as pg_array
from sqlalchemy.orm import Session

from app.models.blog_post import BlogPost
from app.models.enums import BlogPostStatus


class BlogRepository:
    """Shared read/write access to blog_posts — used directly by the public
    (unauthenticated) blog router and, for writes, by the admin blog service.
    Mirrors ConsumerCatalogRepository's role for catalog items."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, post_id: int) -> BlogPost | None:
        return self.db.get(BlogPost, post_id)

    def get_by_slug(self, slug: str) -> BlogPost | None:
        return self.db.execute(select(BlogPost).where(BlogPost.slug == slug)).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        tags: list[str] | None = None,
        statuses: tuple[BlogPostStatus, ...] | None = None,
    ) -> tuple[list[BlogPost], int]:
        base = select(BlogPost)
        if statuses is not None:
            base = base.where(BlogPost.status.in_(statuses))
        if tags:
            base = base.where(BlogPost.tags_json.has_any(pg_array(tags)))
        if search:
            q = f"%{search}%"
            base = base.where(or_(BlogPost.title.ilike(q), BlogPost.excerpt.ilike(q)))
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = (
            base.order_by(BlogPost.published_at.desc().nulls_last(), BlogPost.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.execute(stmt).scalars().all()), total

    def increment_views(self, post: BlogPost, *, authenticated: bool) -> None:
        """Simple page-view counter, incremented on every successful read of
        the article detail — not deduped per visitor/session, same as most
        basic blog view counters. Caller is responsible for committing."""
        post.views_total += 1
        if authenticated:
            post.views_authenticated += 1

    def distinct_tags(self, *, statuses: tuple[BlogPostStatus, ...] | None = None) -> list[str]:
        stmt = select(BlogPost.tags_json).where(BlogPost.tags_json.is_not(None))
        if statuses is not None:
            stmt = stmt.where(BlogPost.status.in_(statuses))
        rows = self.db.execute(stmt).scalars().all()
        tags: set[str] = set()
        for row in rows:
            if row:
                tags.update(row)
        return sorted(tags, key=str.casefold)
