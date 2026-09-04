from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AdminStatsRead(BaseModel):
    catalog_total: int
    catalog_by_type: dict[str, int]
    users_total: int
    users_active: int
    # Individual acquisitions only — excludes plan_entitlement rows (items
    # auto-granted by a subscription). See plan_subscriptions_total below
    # for the parallel "Planes" figure.
    purchases_total: int
    plan_subscriptions_total: int = 0
    requests_pending: int


class AdminPurchaseRead(BaseModel):
    id: int
    user_id: int
    catalog_item_id: int
    user_email: str
    item_title: str
    item_type: str
    # "free", "stripe_checkout" or "admin_grant" — never "plan_entitlement",
    # which this list excludes entirely (see the router). Lets the UI badge
    # a real Stripe payment differently from a free claim or an admin grant.
    source: str
    created_at: datetime


class AdminPurchaseListResponse(BaseModel):
    items: list[AdminPurchaseRead]
    limit: int
    offset: int
    total: int


class AdminSubscriptionRead(BaseModel):
    """One organization's plan subscription — the "Planes" side of the
    admin purchases view, kept separate from AdminPurchaseRead's individual
    item acquisitions (see the /admin/purchases router comment)."""

    id: int
    organization_id: int
    organization_name: str
    owner_email: str
    plan_id: int
    plan_name: str
    plan_code: str
    plan_price: float | None = None
    plan_currency: str = "EUR"
    status: str
    provider: str
    starts_at: datetime
    ends_at: datetime | None
    # Elapsed calendar months since starts_at (capped at ends_at if the
    # subscription has already ended) — "cuántos meses de antigüedad
    # tienen los usuarios" on this plan. See build_tenure_months.
    tenure_months: int


class AdminSubscriptionListResponse(BaseModel):
    items: list[AdminSubscriptionRead]
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


class MonthComparisonItem(BaseModel):
    """Month-to-date vs. the same day-of-month range last month — see
    analytics._mtd_comparison_range. `change_pct` is null when `previous` is
    zero (no baseline to compare against)."""

    current: int
    previous: int
    change_pct: float | None = None


class MonthComparisonRead(BaseModel):
    users: MonthComparisonItem
    individual_purchases: MonthComparisonItem
    plan_signups: MonthComparisonItem


class TrendSeriesRead(BaseModel):
    """One metric's data for the "this month vs. last month / vs. 6-month
    average" line chart (PremiumTrendCompareChart on the frontend) — see
    analytics._build_trend_series. All four lists are the same length
    (`days`, always 1..31) and index-aligned, so the frontend just swaps
    which comparison list it plots without needing another request. A null
    entry means "no data for that day" (future days in the current month,
    or a day past a shorter month's end) — not zero."""

    days: list[int]
    current: list[float | None]
    previous_month: list[float | None]
    avg_6_months: list[float | None]


class TrendComparisonsRead(BaseModel):
    individual_revenue: TrendSeriesRead
    plan_signups: TrendSeriesRead
    users: TrendSeriesRead


class AdminAnalyticsRead(BaseModel):
    users_growth: list[TimeSeriesPoint]
    catalog_growth: list[TimeSeriesPoint]
    purchases_growth: list[TimeSeriesPoint]
    revenue_growth: list[TimeSeriesPoint]
    # The dashboard's three toggleable "this month vs. last month / vs. 6
    # previous months" line charts — see TrendComparisonsRead.
    trends: TrendComparisonsRead | None = None
    month_comparison: MonthComparisonRead | None = None
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


class ApplicationMapMemberRead(BaseModel):
    uuid: str
    email: str
    display_name: str | None = None
    role_codes: list[str] = []


class ApplicationMapOrganizationRead(BaseModel):
    uuid: str
    name: str
    type: str
    members: list[ApplicationMapMemberRead] = []


class ApplicationMapIndividualUserRead(BaseModel):
    uuid: str
    email: str
    display_name: str | None = None


class ApplicationMapRead(BaseModel):
    organizations: list[ApplicationMapOrganizationRead] = []
    organizations_total: int = 0
    individual_users: list[ApplicationMapIndividualUserRead] = []
    individual_users_total: int = 0
    individual_users_truncated: bool = False


class AdminPurchasesSummaryRead(BaseModel):
    purchases_total: int
    plan_subscriptions_total: int = 0
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


class SchedulerJobRead(BaseModel):
    """One APScheduler background job (account lifecycle sweep, newsletter,
    test-run polling, etc.) — surfaced so an admin can confirm the scheduler
    is actually running without needing shell/log access to the Railway
    instance (see docs/OBSERVABILITY.md)."""

    id: str
    next_run_time: datetime | None
    pending: bool


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
    scheduler_running: bool
    scheduler_jobs: list[SchedulerJobRead]
    checked_at: datetime
