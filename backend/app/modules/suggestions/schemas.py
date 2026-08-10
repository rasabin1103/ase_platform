from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.suggestion import SUGGESTION_STATUSES, SUGGESTION_TARGETS


class SuggestionCreate(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    target: str = Field(default="platform")


class SuggestionUpdate(BaseModel):
    status: str | None = Field(default=None)
    admin_note: str | None = Field(default=None, max_length=4000)


class SuggestionRead(BaseModel):
    id: int
    user_id: int
    user_email: str | None = None
    organization_id: int | None = None
    organization_name: str | None = None
    message: str
    target: str
    status: str
    admin_note: str | None = None
    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class SuggestionListResponse(BaseModel):
    items: list[SuggestionRead]
    limit: int
    offset: int
    total: int


__all__ = [
    "SuggestionCreate",
    "SuggestionUpdate",
    "SuggestionRead",
    "SuggestionListResponse",
    "SUGGESTION_STATUSES",
    "SUGGESTION_TARGETS",
]
