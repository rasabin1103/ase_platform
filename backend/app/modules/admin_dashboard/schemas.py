from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AdminStatsRead(BaseModel):
    catalog_total: int
    catalog_by_type: dict[str, int]
    users_total: int
    users_active: int
    purchases_total: int
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


class RatingTagCount(BaseModel):
    tag: str
    count: int


class AdminAnalyticsRead(BaseModel):
    users_growth: list[TimeSeriesPoint]
    catalog_growth: list[TimeSeriesPoint]
    purchases_growth: list[TimeSeriesPoint]
    revenue_growth: list[TimeSeriesPoint]
    catalog_by_type: dict[str, int]
    revenue_total: float
    top_users: list[TopUserPurchases]
    organizations_total: int = 0
    organizations_by_type: dict[str, int] = {}
    requests_by_status: dict[str, int] = {}
    ratings_total: int = 0
    ratings_upvotes: int = 0
    ratings_downvotes: int = 0
    ratings_top_tags: list[RatingTagCount] = []
    users_by_role: dict[str, int] = {}


class AdminPurchasesSummaryRead(BaseModel):
    purchases_total: int
    revenue_total: float
    top_users: list[TopUserPurchases]
