from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import CatalogItemType
from app.models.user import User


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


def build_admin_analytics(db: Session, *, months: int = 6) -> dict:
    buckets = _month_buckets(months)
    since = datetime.now(timezone.utc) - timedelta(days=31 * months)

    user_rows = db.execute(
        select(
            func.to_char(func.date_trunc("month", User.created_at), "YYYY-MM"),
            func.count(),
        )
        .where(User.created_at >= since)
        .group_by(func.date_trunc("month", User.created_at))
        .order_by(func.date_trunc("month", User.created_at))
    ).all()

    catalog_rows = db.execute(
        select(
            func.to_char(func.date_trunc("month", CatalogItem.created_at), "YYYY-MM"),
            func.count(),
        )
        .where(CatalogItem.created_at >= since)
        .group_by(func.date_trunc("month", CatalogItem.created_at))
    ).all()

    purchase_rows = db.execute(
        select(
            func.to_char(func.date_trunc("month", CatalogPurchase.created_at), "YYYY-MM"),
            func.count(),
        )
        .where(CatalogPurchase.created_at >= since)
        .group_by(func.date_trunc("month", CatalogPurchase.created_at))
    ).all()

    revenue_rows = db.execute(
        select(
            func.to_char(func.date_trunc("month", CatalogPurchase.created_at), "YYYY-MM"),
            func.coalesce(func.sum(CatalogItem.price), 0),
        )
        .join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
        .where(CatalogPurchase.created_at >= since)
        .group_by(func.date_trunc("month", CatalogPurchase.created_at))
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
        .join(CatalogPurchase, CatalogPurchase.user_id == User.id)
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
