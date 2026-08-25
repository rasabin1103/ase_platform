from __future__ import annotations

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class BlogComment(Base, IdPkMixin, TimestampMixin):
    """A comment on a published blog post. Requires a logged-in author (no
    guest comments) — `user_id` is always set, the commenter's display name
    comes from the User relation at read time, not stored redundantly here.

    One level of threading: `parent_id` is null for a top-level comment, or
    points at the comment being replied to. Deleting a parent comment nulls
    out its children's `parent_id` (see the migration's ON DELETE SET NULL)
    rather than cascading, so a removed comment doesn't take its replies
    down with it — they just become top-level.

    `content` always stores the raw, uncensored text the user submitted —
    the banned-words filter (app/core/comment_filter.py) is applied only at
    serialization time for public/non-admin readers, so admins moderating
    comments always see exactly what was written.
    """

    __tablename__ = "blog_comments"

    blog_post_id: Mapped[int] = mapped_column(
        ForeignKey("blog_posts.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("blog_comments.id", ondelete="SET NULL"), index=True, nullable=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<BlogComment id={self.id} blog_post_id={self.blog_post_id} user_id={self.user_id}>"
