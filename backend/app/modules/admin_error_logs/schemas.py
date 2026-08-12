from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ErrorLogRead(BaseModel):
    id: int
    occurred_at: datetime
    method: str
    path: str
    status_code: int
    error_type: str
    message: str
    traceback: str
    user_id: int | None
    user_email: str | None = None
    ip_address: str | None

    model_config = {"from_attributes": True}


class ErrorLogListResponse(BaseModel):
    items: list[ErrorLogRead]
    limit: int
    offset: int
    total: int


class ErrorLogSummary(BaseModel):
    """Lightweight counts for the System status page — the full table with
    filters lives on its own admin page (/admin/error-logs)."""

    last_24h: int
    last_7d: int
