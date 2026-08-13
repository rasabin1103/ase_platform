from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, LargeBinary, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import BlogPostStatus
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class BlogPost(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """Public blog article, written and published from the admin section.

    Content is authored as rich text (TipTap, frontend) and stored here as
    sanitized HTML (see app/core/html_sanitize.py) — the public blog router
    renders it as-is, no further processing needed at read time.
    """

    __tablename__ = "blog_posts"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    excerpt: Mapped[str] = mapped_column(String(500), nullable=False)
    content_html: Mapped[str] = mapped_column(Text, nullable=False)
    # Cover image: either an uploaded binary (image_data/image_mime, same
    # storage pattern as CatalogItem's legacy single-image fields) or an
    # external URL — mutually exclusive in practice, resolved at read time.
    cover_image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    cover_image_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    cover_image_mime: Mapped[str | None] = mapped_column(String(64), nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    tags_json: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[BlogPostStatus] = mapped_column(
        Enum(BlogPostStatus, name="blog_post_status", native_enum=True),
        nullable=False,
        default=BlogPostStatus.draft,
        index=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta_title: Mapped[str | None] = mapped_column(String(160), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(300), nullable=True)

    def __repr__(self) -> str:
        return f"<BlogPost id={self.id} slug={self.slug!r} status={self.status.value}>"
