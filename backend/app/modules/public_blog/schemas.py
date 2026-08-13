from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BlogPostPublicCard(BaseModel):
    """Shape used for the public blog listing grid — no full content_html,
    keeps list responses light."""

    uuid: UUID
    title: str
    slug: str
    excerpt: str
    cover_image_url: str | None = None
    author_name: str | None = None
    tags: list[str] = []
    published_at: datetime | None = None

    model_config = {"from_attributes": True}


class BlogPostPublicListResponse(BaseModel):
    items: list[BlogPostPublicCard]
    limit: int
    offset: int
    total: int


class BlogPostPublicDetail(BlogPostPublicCard):
    content_html: str
    meta_title: str | None = None
    meta_description: str | None = None
