from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import CatalogItemType, UserStatus
from app.models.user import User
from app.modules.admin_dashboard.counts import user_status_is_not_deleted


def _month_buckets(months: int = 6) -> list[str]:
    now = datetime.now(timezone.utc)
    keys: list[str] = []
    for i in range(months - 1, -1, -1):
        d = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30 * i)
        keys.append(f"{d.year:04d}-{d.month:02d}")
    return keys


def _series_from_rows(rows: list[tuple], buckets: list[str]) -> list[dict]:
    mapping = {str(k): int(v) for k, v in rows}
    return [{"month": m, "value": mapping.get(m, 0)} for m in buckets]


def _monthly_aggregate_query(
    created_at_col: ColumnElement,
    value_expr,
    *filters: ColumnElement[bool],
):
    """Group by month bucket once — avoids PostgreSQL GROUP BY errors."""
    month_bucket = func.date_trunc("month", created_at_col)
    stmt = select(
        func.to_char(month_bucket, "YYYY-MM"),
        value_expr,
    ).group_by(month_bucket).order_by(month_bucket)
    if filters:
        stmt = stmt.where(*filters)
    return stmt


def build_admin_analytics(db: Session, *, months: int = 6) -> dict:
    buckets = _month_buckets(months)
    since = datetime.now(timezone.utc) - timedelta(days=31 * months)

    user_rows = db.execute(
        _monthly_aggregate_query(
            User.created_at,
            func.count(),
            User.created_at >= since,
            user_status_is_not_deleted(),
        )
    ).all()

    catalog_rows = db.execute(
        _monthly_aggregate_query(
            CatalogItem.created_at,
            func.count(),
            CatalogItem.created_at >= since,
        )
    ).all()

    purchase_rows = db.execute(
        _monthly_aggregate_query(
            CatalogPurchase.created_at,
            func.count(),
            CatalogPurchase.created_at >= since,
        )
    ).all()

    purchase_month = func.date_trunc("month", CatalogPurchase.created_at)
    revenue_rows = db.execute(
        select(
            func.to_char(purchase_month, "YYYY-MM"),
            func.coalesce(func.sum(CatalogItem.price), 0),
        )
        .select_from(CatalogPurchase)
        .join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
        .where(CatalogPurchase.created_at >= since)
        .group_by(purchase_month)
        .order_by(purchase_month)
    ).all()

    by_type: dict[str, int] = {}
    for t in CatalogItemType:
        n = int(db.execute(select(func.count()).select_from(CatalogItem).where(CatalogItem.type == t)).scalar_one())
        by_type[t.value] = n

    revenue_total = db.execute(
        select(func.coalesce(func.sum(CatalogItem.price), 0))
        .select_from(CatalogPurchase)
        .join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
    ).scalar_one()
    if isinstance(revenue_total, Decimal):
        revenue_total = float(revenue_total)
    else:
        revenue_total = float(revenue_total or 0)

    top_users_rows = db.execute(
        select(User.email, func.count(CatalogPurchase.id).label("cnt"))
        .select_from(CatalogPurchase)
        .join(User, User.id == CatalogPurchase.user_id)
        .group_by(User.id, User.email)
        .order_by(func.count(CatalogPurchase.id).desc())
        .limit(5)
    ).all()

    return {
        "users_growth": _series_from_rows(user_rows, buckets),
        "catalog_growth": _series_from_rows(catalog_rows, buckets),
        "purchases_growth": _series_from_rows(purchase_rows, buckets),
        "revenue_growth": _series_from_rows(
            [(k, float(v) if v is not None else 0.0) for k, v in revenue_rows],
            buckets,
        ),
        "catalog_by_type": by_type,
        "revenue_total": revenue_total,
        "top_users": [{"email": email, "purchase_count": int(cnt)} for email, cnt in top_users_rows],
    }
