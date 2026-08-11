from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RedeemCodeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    # Required: without it we cannot invite the reader as a GitHub collaborator.
    github_username: str = Field(min_length=1, max_length=100)


class RedeemedBookRead(BaseModel):
    catalog_item_id: int
    slug: str
    title: str
    image_url: str
    repo_url: str
    github_username: str | None = None
    redeemed_at: datetime


class RedeemResultRead(RedeemedBookRead):
    # 'invited' = a pending GitHub invitation was sent (must be accepted).
    # 'already_collaborator' = the GitHub user already had access.
    invite_status: Literal["invited", "already_collaborator"]


class RedeemedBookListResponse(BaseModel):
    items: list[RedeemedBookRead]
