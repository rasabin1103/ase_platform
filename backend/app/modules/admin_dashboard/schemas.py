from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AdminStatsRead(BaseModel):
    catalog_total: int
    catalog_by_type: dict[str, int]
    users_total: int
    users_active: int
    users_inactive: int
    purchases_total: int
    revenue_total: float
    requests_pending: int


class AdminPurchaseRead(BaseModel):
    id: int
    user_id: int
    catalog_item_id: int
    user_email: str
    item_title: str
    item_type: str
    created_at: datetime


class AdminPurchaseListResponse(BaseModel):
    items: list[AdminPurchaseRead]
    limit: int
    offset: int
    total: int


class TimeSeriesPoint(BaseModel):
    month: str
    value: float


class TopUserPurchases(BaseModel):
    email: str
    purchase_count: int


class AdminAnalyticsRead(BaseModel):
    users_growth: list[TimeSeriesPoint]
    catalog_growth: list[TimeSeriesPoint]
    purchases_growth: list[TimeSeriesPoint]
    revenue_growth: list[TimeSeriesPoint]
    catalog_by_type: dict[str, int]
    revenue_total: float
    top_users: list[TopUserPurchases]


class AdminPurchasesSummaryRead(BaseModel):
    purchases_total: int
    revenue_total: float
    top_users: list[TopUserPurchases]
