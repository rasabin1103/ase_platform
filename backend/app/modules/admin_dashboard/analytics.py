from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.access_request import AccessRequest
from app.models.catalog_item import CatalogItem
from app.models.catalog_item_rating import CatalogItemRating
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import AccessRequestStatus, CatalogItemType, OrganizationType
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User


def _month_buckets(months: int = 6) -> list[str]:
    """Return the last `months` calendar-month keys ("YYYY-MM"), oldest first,
    ending with the current month. Uses exact month arithmetic (not day-count
    subtraction) so it never drifts into the wrong month regardless of how
    many days each intervening month has."""
    now = datetime.now(timezone.utc)
    keys: list[str] = []
    for i in range(months - 1, -1, -1):
        total_month_index = now.year * 12 + (now.month - 1) - i
        year, month = divmod(total_month_index, 12)
        keys.append(f"{year:04d}-{month + 1:02d}")
    return keys


def _series_from_rows(rows: list[tuple], buckets: list[str]) -> list[dict]:
    mapping = {str(k): float(v) for k, v in rows}
    return [{"month": m, "value": mapping.get(m, 0.0)} for m in buckets]


def build_admin_analytics(db: Session, *, months: int = 6) -> dict:
    buckets = _month_buckets(months)
    since = datetime.now(timezone.utc) - timedelta(days=31 * months)

    def _month_key(column):
        # Postgres requires the GROUP BY / ORDER BY expression to be
        # syntactically identical to the SELECT expression it "covers" — it
        # does not infer that to_char(date_trunc(x)) is functionally
        # determined by date_trunc(x). Building the expression once and
        # reusing the same object in select/group_by/order_by guarantees
        # SQLAlchemy renders identical SQL text in all three places.
        return func.to_char(func.date_trunc("month", column), "YYYY-MM")

    user_month = _month_key(User.created_at)
    user_rows = db.execute(
        select(user_month, func.count())
        .where(User.created_at >= since)
        .group_by(user_month)
        .order_by(user_month)
    ).all()

    catalog_month = _month_key(CatalogItem.created_at)
    catalog_rows = db.execute(
        select(catalog_month, func.count())
        .where(CatalogItem.created_at >= since)
        .group_by(catalog_month)
    ).all()

    purchase_month = _month_key(CatalogPurchase.created_at)
    purchase_rows = db.execute(
        select(purchase_month, func.count())
        .where(CatalogPurchase.created_at >= since)
        .group_by(purchase_month)
    ).all()

    revenue_month = _month_key(CatalogPurchase.created_at)
    revenue_rows = db.execute(
        select(revenue_month, func.coalesce(func.sum(CatalogItem.price), 0))
        .join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
        .where(CatalogPurchase.created_at >= since)
        .group_by(revenue_month)
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

    organizations_by_type: dict[str, int] = {}
    for org_type in OrganizationType:
        n = int(
            db.execute(
                select(func.count()).select_from(Organization).where(Organization.type == org_type)
            ).scalar_one()
        )
        organizations_by_type[org_type.value] = n
    organizations_total = sum(organizations_by_type.values())

    requests_by_status: dict[str, int] = {}
    for req_status in AccessRequestStatus:
        n = int(
            db.execute(
                select(func.count()).select_from(AccessRequest).where(AccessRequest.status == req_status)
            ).scalar_one()
        )
        requests_by_status[req_status.value] = n

    ratings_total = int(db.execute(select(func.count()).select_from(CatalogItemRating)).scalar_one())
    ratings_upvotes = int(
        db.execute(
            select(func.count()).select_from(CatalogItemRating).where(CatalogItemRating.is_positive.is_(True))
        ).scalar_one()
    )
    ratings_downvotes = ratings_total - ratings_upvotes
    tag_rows = db.execute(select(CatalogItemRating.tags_json).where(CatalogItemRating.tags_json.isnot(None))).all()
    tag_counter: Counter[str] = Counter()
    for (tags,) in tag_rows:
        for tag in tags or []:
            tag_counter[str(tag)] += 1
    top_tags = [{"tag": tag, "count": count} for tag, count in tag_counter.most_common(8)]

    users_by_role_rows = db.execute(
        select(Role.code, func.count(func.distinct(OrganizationMember.user_id)))
        .select_from(MemberRole)
        .join(Role, Role.id == MemberRole.role_id)
        .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
        .group_by(Role.code)
    ).all()
    users_by_role = {code: int(cnt) for code, cnt in users_by_role_rows}

    return {
        "users_growth": _series_from_rows(user_rows, buckets),
        "catalog_growth": _series_from_rows(catalog_rows, buckets),
        "purchases_growth": _series_from_rows(purchase_rows, buckets),
        "revenue_growth": _series_from_rows(
            revenue_rows,
            buckets,
        ),
        "catalog_by_type": by_type,
        "revenue_total": revenue_total,
        "top_users": [{"email": email, "purchase_count": int(cnt)} for email, cnt in top_users_rows],
        "organizations_total": organizations_total,
        "organizations_by_type": organizations_by_type,
        "requests_by_status": requests_by_status,
        "ratings_total": ratings_total,
        "ratings_upvotes": ratings_upvotes,
        "ratings_downvotes": ratings_downvotes,
        "ratings_top_tags": top_tags,
        "users_by_role": users_by_role,
    }
