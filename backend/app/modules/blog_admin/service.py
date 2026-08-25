from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.html_sanitize import sanitize_rich_text
from app.core.media_urls import blog_has_stored_image, resolve_blog_cover_url
from app.models.blog_post import BlogPost
from app.models.enums import BlogPostStatus
from app.modules.blog_admin.schemas import (
    BlogPostAdminCreate,
    BlogPostAdminListResponse,
    BlogPostAdminRead,
    BlogPostAdminUpdate,
)
from app.modules.blog_engagement.repository import BlogEngagementRepository
from app.modules.public_blog.repository import BlogRepository


class BlogAdminService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = BlogRepository(db)
        self.engagement = BlogEngagementRepository(db)

    def _to_read(self, post: BlogPost, *, stats: dict | None = None) -> BlogPostAdminRead:
        if stats is None:
            stats = self._stats_for_post(post.id)
        return BlogPostAdminRead(
            id=post.id,
            uuid=post.uuid,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            content_html=post.content_html,
            cover_image_url=resolve_blog_cover_url(post),
            has_stored_image=blog_has_stored_image(post),
            author_name=post.author_name,
            tags=post.tags_json or [],
            status=post.status,
            meta_title=post.meta_title,
            meta_description=post.meta_description,
            published_at=post.published_at,
            created_at=post.created_at,
            updated_at=post.updated_at,
            viewsTotal=post.views_total,
            viewsAuthenticated=post.views_authenticated,
            likesCount=stats["likes"],
            dislikesCount=stats["dislikes"],
            commentsCount=stats["comments"],
            sharesTotal=stats["shares_total"],
            sharesByNetwork=stats["shares_by_network"],
        )

    def _stats_for_post(self, post_id: int) -> dict:
        likes, dislikes = self.engagement.reaction_counts_for_post(post_id)
        comments = self.engagement.comment_counts_for_posts([post_id]).get(post_id, 0)
        shares_by_network = self.engagement.share_counts_for_post(post_id)
        return {
            "likes": likes,
            "dislikes": dislikes,
            "comments": comments,
            "shares_total": sum(shares_by_network.values()),
            "shares_by_network": shares_by_network,
        }

    def _batch_stats(self, posts: list[BlogPost]) -> dict[int, dict]:
        post_ids = [p.id for p in posts]
        reactions = self.engagement.reaction_counts_for_posts(post_ids)
        comments = self.engagement.comment_counts_for_posts(post_ids)
        shares_total = self.engagement.share_totals_for_posts(post_ids)
        result: dict[int, dict] = {}
        for post_id in post_ids:
            likes, dislikes = reactions.get(post_id, (0, 0))
            result[post_id] = {
                "likes": likes,
                "dislikes": dislikes,
                "comments": comments.get(post_id, 0),
                "shares_total": shares_total.get(post_id, 0),
                # Per-network breakdown is only fetched for the single-post
                # detail view (_stats_for_post) — the list view would need
                # one more grouped query per post otherwise; the total is
                # enough for the row-level summary.
                "shares_by_network": {},
            }
        return result

    def _require_post(self, post_id: int) -> BlogPost:
        post = self.repo.get_by_id(post_id)
        if post is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
        return post

    def _check_slug_available(self, slug: str, *, exclude_post_id: int | None = None) -> None:
        existing = self.repo.get_by_slug(slug)
        if existing is not None and existing.id != exclude_post_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")

    @staticmethod
    def _maybe_stamp_published_at(post: BlogPost, new_status: BlogPostStatus) -> None:
        """First transition into `published` stamps `published_at` once —
        later draft/republish cycles don't reset it, so the original
        publish date survives edits (matches typical blog behavior)."""
        if new_status == BlogPostStatus.published and post.published_at is None:
            post.published_at = datetime.now(timezone.utc)

    def get(self, post_id: int) -> BlogPostAdminRead:
        return self._to_read(self._require_post(post_id))

    def list(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        tags: list[str] | None = None,
        status_filter: BlogPostStatus | None = None,
    ) -> BlogPostAdminListResponse:
        statuses = (status_filter,) if status_filter is not None else None
        posts, total = self.repo.list(limit=limit, offset=offset, search=search, tags=tags, statuses=statuses)
        stats_by_post = self._batch_stats(posts)
        items = [self._to_read(p, stats=stats_by_post[p.id]) for p in posts]
        return BlogPostAdminListResponse(items=items, limit=limit, offset=offset, total=total)

    def list_tags(self) -> list[str]:
        return self.repo.distinct_tags()

    def create(self, payload: BlogPostAdminCreate) -> BlogPostAdminRead:
        self._check_slug_available(payload.slug)
        post = BlogPost(
            title=payload.title,
            slug=payload.slug,
            excerpt=payload.excerpt,
            content_html=sanitize_rich_text(payload.content_html),
            cover_image_url=payload.cover_image_url,
            author_name=payload.author_name,
            tags_json=payload.tags,
            status=payload.status,
            meta_title=payload.meta_title,
            meta_description=payload.meta_description,
        )
        self._maybe_stamp_published_at(post, payload.status)
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return self._to_read(post)

    def update(self, post_id: int, payload: BlogPostAdminUpdate) -> BlogPostAdminRead:
        post = self._require_post(post_id)
        data = payload.model_dump(exclude_unset=True)
        if "slug" in data and data["slug"] != post.slug:
            self._check_slug_available(data["slug"], exclude_post_id=post.id)
        if "content_html" in data:
            data["content_html"] = sanitize_rich_text(data["content_html"])
        if "tags" in data:
            post.tags_json = data.pop("tags")
        if "status" in data:
            self._maybe_stamp_published_at(post, data["status"])
        for key, value in data.items():
            setattr(post, key, value)
        self.db.commit()
        self.db.refresh(post)
        return self._to_read(post)

    def delete(self, post_id: int) -> None:
        post = self._require_post(post_id)
        self.db.delete(post)
        self.db.commit()

    def upload_cover_image(self, post_id: int, content: bytes, mime: str) -> BlogPostAdminRead:
        post = self._require_post(post_id)
        post.cover_image_data = content
        post.cover_image_mime = mime
        post.cover_image_url = None
        self.db.commit()
        self.db.refresh(post)
        return self._to_read(post)

    def clear_cover_image(self, post_id: int) -> BlogPostAdminRead:
        post = self._require_post(post_id)
        post.cover_image_data = None
        post.cover_image_mime = None
        self.db.commit()
        self.db.refresh(post)
        return self._to_read(post)

    # --- comment moderation -----------------------------------------------
    # Delegates to BlogEngagementService (imported lazily to avoid a
    # module-load cycle: blog_engagement's own service already imports
    # public_blog.repository, and this module sits alongside it). The admin
    # always sees the raw, uncensored comment text (is_admin=True), and can
    # delete anyone's comment, not just their own.

    def list_comments(self, post_id: int):
        from app.modules.blog_engagement.service import BlogEngagementService

        post = self._require_post(post_id)
        return BlogEngagementService(self.db).list_comments(post.slug, viewer_user_id=None, is_admin=True)

    def delete_comment(self, post_id: int, comment_id: int, *, admin_user_id: int) -> None:
        from app.modules.blog_engagement.service import BlogEngagementService

        post = self._require_post(post_id)
        BlogEngagementService(self.db).delete_comment(post.slug, comment_id=comment_id, user_id=admin_user_id, is_admin=True)
