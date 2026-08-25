from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import BlogReactionType, BlogShareNetwork


class CommentRead(BaseModel):
    id: int
    authorName: str
    content: str
    createdAt: datetime
    parentId: int | None = None
    isOwn: bool = False
    canDelete: bool = False
    replies: list["CommentRead"] = []


CommentRead.model_rebuild()


class CommentListResponse(BaseModel):
    comments: list[CommentRead]
    total: int


class CommentCreateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    parentId: int | None = None


class ReactionCountsRead(BaseModel):
    likesCount: int = 0
    dislikesCount: int = 0
    myReaction: BlogReactionType | None = None


class ReactionSetRequest(BaseModel):
    reaction: BlogReactionType


class ShareRequest(BaseModel):
    network: BlogShareNetwork


class ShareCountRead(BaseModel):
    total: int = 0
