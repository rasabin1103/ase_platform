from __future__ import annotations

from datetime import datetime

from typing import Literal

from pydantic import BaseModel, Field


class NotificationRead(BaseModel):
    id: int
    type: str
    title: str
    body: str | None = None
    link: str | None = None
    is_read: bool
    created_at: datetime
    # Derived from `type` (app.core.notification_categories), not stored.
    category: str = "announcements"

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationRead]
    limit: int
    offset: int
    total: int
    unread_count: int


class UnreadCountRead(BaseModel):
    unread_count: int


DigestFrequency = Literal["off", "daily", "weekly"]
MuteDuration = Literal["off", "1h", "8h", "1d", "7d", "forever"]


class CategoryPreferenceRead(BaseModel):
    key: str
    in_app: bool = True
    email: bool = False
    # Mandatory categories (account/security) can't be switched off.
    mandatory: bool = False


class NotificationPreferencesRead(BaseModel):
    muted_until: datetime | None = None
    is_muted: bool = False
    digest_frequency: DigestFrequency = "off"
    categories: list[CategoryPreferenceRead]


class CategoryPreferenceUpdate(BaseModel):
    in_app: bool | None = None
    email: bool | None = None


class NotificationPreferencesUpdate(BaseModel):
    digest_frequency: DigestFrequency | None = None
    # Server computes the end time so the client clock never matters.
    mute: MuteDuration | None = None
    categories: dict[str, CategoryPreferenceUpdate] = Field(default_factory=dict)
