from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import BlogPostStatus


class BlogPostAdminBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=180)
    excerpt: str = Field(min_length=1, max_length=500)
    # Rich-text HTML from the admin TipTap editor — sanitized server-side
    # before storage (see app/core/html_sanitize.py), so what's persisted may
    # differ slightly from what was submitted.
    content_html: str = Field(min_length=1)
    cover_image_url: str | None = Field(default=None, max_length=2048)
    author_name: str | None = Field(default=None, max_length=150)
    tags: list[str] = []
    status: BlogPostStatus = BlogPostStatus.draft
    meta_title: str | None = Field(default=None, max_length=160)
    meta_description: str | None = Field(default=None, max_length=300)


class BlogPostAdminCreate(BlogPostAdminBase):
    pass


class BlogPostAdminUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content_html: str | None = None
    cover_image_url: str | None = None
    author_name: str | None = None
    tags: list[str] | None = None
    status: BlogPostStatus | None = None
    meta_title: str | None = None
    meta_description: str | None = None


class BlogPostAdminRead(BlogPostAdminBase):
    id: int
    uuid: UUID
    has_stored_image: bool = False
    cover_image_url: str | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    # Engagement stats — always populated for the admin's eyes only. Split
    # views by logged-in vs anonymous readers (anonymous = viewsTotal -
    # viewsAuthenticated) per the requirement that the admin sees this
    # breakdown, not just a single number.
    viewsTotal: int = 0
    viewsAuthenticated: int = 0
    likesCount: int = 0
    dislikesCount: int = 0
    commentsCount: int = 0
    sharesTotal: int = 0
    sharesByNetwork: dict[str, int] = {}

    model_config = {"from_attributes": True}


class BlogPostAdminListResponse(BaseModel):
    items: list[BlogPostAdminRead]
    limit: int
    offset: int
    total: int
