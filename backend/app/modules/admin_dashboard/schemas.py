from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


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
    reviews_total: int = 0
    reviews_average_rating: float | None = None
    reviews_distribution: dict[str, int] = {}


class AdminPurchasesSummaryRead(BaseModel):
    purchases_total: int
    revenue_total: float
    top_users: list[TopUserPurchases]


class AdminBookRedemptionRead(BaseModel):
    id: int
    user_id: int | None
    user_email: str | None
    catalog_item_id: int
    book_title: str
    github_username: str | None
    created_at: datetime


class AdminBookRedemptionListResponse(BaseModel):
    items: list[AdminBookRedemptionRead]
    limit: int
    offset: int
    total: int


class AdminSearchUserHit(BaseModel):
    uuid: str
    email: str
    display_name: str | None = None
    status: str


class AdminSearchCatalogHit(BaseModel):
    id: int
    slug: str
    title: str
    type: str


class AdminSearchResponse(BaseModel):
    users: list[AdminSearchUserHit]
    catalog_items: list[AdminSearchCatalogHit]


class AdminBroadcastRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=2000)
    link: str | None = Field(default=None, max_length=500)


class AdminBroadcastResponse(BaseModel):
    recipients: int


class SystemStatusDatabase(BaseModel):
    status: str
    latency_ms: float | None = None
    message: str | None = None


class SystemStatusCounts(BaseModel):
    users_total: int
    catalog_total: int
    requests_pending: int


class SystemStatusRead(BaseModel):
    api_status: str
    uptime_seconds: float
    environment: str
    mvp_mode: bool
    database: SystemStatusDatabase
    github_integration_configured: bool
    rate_limiting_enabled: bool
    smtp_configured: bool
    sentry_configured: bool
    redis_configured: bool
    email_verified_pct: float
    two_factor_adoption_pct: float
    counts: SystemStatusCounts
    checked_at: datetime
