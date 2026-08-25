from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import BlogReactionType


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
    # Engagement summary — always present, so the article page never has to
    # make a second round-trip just to render the like/dislike counts and
    # comment count under the title.
    likesCount: int = 0
    dislikesCount: int = 0
    myReaction: BlogReactionType | None = None
    commentsCount: int = 0
    sharesCount: int = 0
