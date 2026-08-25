from __future__ import annotations

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import BlogShareNetwork
from app.models.mixins import IdPkMixin, TimestampMixin


class BlogShare(Base, IdPkMixin, TimestampMixin):
    """One row per share-button click on a blog post — insert-only, no auth
    required (sharing shouldn't be gated behind login), so `user_id` is
    always null; this is purely a counter log, not tied to an account."""

    __tablename__ = "blog_post_shares"

    blog_post_id: Mapped[int] = mapped_column(
        ForeignKey("blog_posts.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    network: Mapped[BlogShareNetwork] = mapped_column(
        Enum(BlogShareNetwork, name="blog_share_network", native_enum=True),
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<BlogShare id={self.id} blog_post_id={self.blog_post_id} network={self.network.value}>"
