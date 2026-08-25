from __future__ import annotations

from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import BlogReactionType
from app.models.mixins import IdPkMixin, TimestampMixin


class BlogReaction(Base, IdPkMixin, TimestampMixin):
    """A logged-in user's like/dislike on a blog post — one row per
    (blog_post_id, user_id), enforced by the unique constraint below.
    Setting the opposite reaction updates the row in place; unsetting it
    deletes the row (see BlogEngagementService.set_reaction/remove_reaction)."""

    __tablename__ = "blog_post_reactions"
    __table_args__ = (
        UniqueConstraint("blog_post_id", "user_id", name="uq_blog_post_reactions_post_user"),
    )

    blog_post_id: Mapped[int] = mapped_column(
        ForeignKey("blog_posts.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    reaction: Mapped[BlogReactionType] = mapped_column(
        Enum(BlogReactionType, name="blog_reaction_type", native_enum=True),
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<BlogReaction id={self.id} blog_post_id={self.blog_post_id} user_id={self.user_id} reaction={self.reaction.value}>"
