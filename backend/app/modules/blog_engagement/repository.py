from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.blog_comment import BlogComment
from app.models.blog_reaction import BlogReaction
from app.models.blog_share import BlogShare
from app.models.enums import BlogReactionType, BlogShareNetwork
from app.models.user import User


class BlogEngagementRepository:
    """Comments, like/dislike reactions, and share-click logging for blog
    posts — kept separate from BlogRepository (blog_posts CRUD itself) since
    this is reader interaction data, not content."""

    def __init__(self, db: Session):
        self.db = db

    # --- comments ---------------------------------------------------------

    def comments_for_post(self, blog_post_id: int) -> list[tuple[BlogComment, str | None, str | None, str | None]]:
        """All comments for a post (top-level and replies together, oldest
        first) — the service layer groups them into a tree by parent_id.
        Joined with the author's name fields, same pattern as catalog
        review display names."""
        stmt = (
            select(BlogComment, User.display_name, User.first_name, User.last_name)
            .join(User, User.id == BlogComment.user_id)
            .where(BlogComment.blog_post_id == blog_post_id)
            .order_by(BlogComment.created_at.asc())
        )
        return list(self.db.execute(stmt).all())

    def comment_counts_for_posts(self, blog_post_ids: list[int]) -> dict[int, int]:
        if not blog_post_ids:
            return {}
        stmt = (
            select(BlogComment.blog_post_id, func.count())
            .where(BlogComment.blog_post_id.in_(blog_post_ids))
            .group_by(BlogComment.blog_post_id)
        )
        return dict(self.db.execute(stmt).all())

    def get_comment(self, comment_id: int) -> BlogComment | None:
        return self.db.get(BlogComment, comment_id)

    def add_comment(self, *, blog_post_id: int, user_id: int, content: str, parent_id: int | None) -> BlogComment:
        comment = BlogComment(blog_post_id=blog_post_id, user_id=user_id, content=content, parent_id=parent_id)
        self.db.add(comment)
        self.db.flush()
        return comment

    def delete_comment(self, comment: BlogComment) -> None:
        self.db.delete(comment)

    # --- reactions ----------------------------------------------------------

    def get_reaction(self, *, blog_post_id: int, user_id: int) -> BlogReaction | None:
        stmt = select(BlogReaction).where(
            BlogReaction.blog_post_id == blog_post_id, BlogReaction.user_id == user_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def upsert_reaction(self, *, blog_post_id: int, user_id: int, reaction: BlogReactionType) -> BlogReaction:
        existing = self.get_reaction(blog_post_id=blog_post_id, user_id=user_id)
        if existing is not None:
            existing.reaction = reaction
            self.db.flush()
            return existing
        row = BlogReaction(blog_post_id=blog_post_id, user_id=user_id, reaction=reaction)
        self.db.add(row)
        self.db.flush()
        return row

    def delete_reaction(self, reaction: BlogReaction) -> None:
        self.db.delete(reaction)

    def reaction_counts_for_post(self, blog_post_id: int) -> tuple[int, int]:
        stmt = (
            select(BlogReaction.reaction, func.count())
            .where(BlogReaction.blog_post_id == blog_post_id)
            .group_by(BlogReaction.reaction)
        )
        counts = dict(self.db.execute(stmt).all())
        return counts.get(BlogReactionType.like, 0), counts.get(BlogReactionType.dislike, 0)

    def reaction_counts_for_posts(self, blog_post_ids: list[int]) -> dict[int, tuple[int, int]]:
        if not blog_post_ids:
            return {}
        stmt = (
            select(BlogReaction.blog_post_id, BlogReaction.reaction, func.count())
            .where(BlogReaction.blog_post_id.in_(blog_post_ids))
            .group_by(BlogReaction.blog_post_id, BlogReaction.reaction)
        )
        result: dict[int, tuple[int, int]] = {pid: (0, 0) for pid in blog_post_ids}
        for post_id, reaction, count in self.db.execute(stmt).all():
            likes, dislikes = result[post_id]
            if reaction == BlogReactionType.like:
                result[post_id] = (count, dislikes)
            else:
                result[post_id] = (likes, count)
        return result

    # --- shares ---------------------------------------------------------

    def log_share(self, *, blog_post_id: int, network: BlogShareNetwork) -> BlogShare:
        row = BlogShare(blog_post_id=blog_post_id, network=network)
        self.db.add(row)
        self.db.flush()
        return row

    def share_counts_for_post(self, blog_post_id: int) -> dict[str, int]:
        stmt = (
            select(BlogShare.network, func.count())
            .where(BlogShare.blog_post_id == blog_post_id)
            .group_by(BlogShare.network)
        )
        return {network.value: count for network, count in self.db.execute(stmt).all()}

    def share_totals_for_posts(self, blog_post_ids: list[int]) -> dict[int, int]:
        if not blog_post_ids:
            return {}
        stmt = (
            select(BlogShare.blog_post_id, func.count())
            .where(BlogShare.blog_post_id.in_(blog_post_ids))
            .group_by(BlogShare.blog_post_id)
        )
        return dict(self.db.execute(stmt).all())
