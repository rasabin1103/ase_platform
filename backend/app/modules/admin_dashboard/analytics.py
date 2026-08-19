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
from app.models.enums import AccessRequestStatus, CatalogItemType, OrganizationType, UserStatus
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

    # Deleted (soft-delete, row kept for referential integrity) and
    # suspended accounts shouldn't keep showing up in the growth chart once
    # removed or deactivated.
    user_month = _month_key(User.created_at)
    user_rows = db.execute(
        select(user_month, func.count())
        .where(User.created_at >= since, User.status.notin_([UserStatus.deleted, UserStatus.suspended]))
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

    by_type: dict[str, int] = {t.value: 0 for t in CatalogItemType}
    type_rows = db.execute(select(CatalogItem.type, func.count()).group_by(CatalogItem.type)).all()
    for t_val, n in type_rows:
        by_type[t_val.value if isinstance(t_val, CatalogItemType) else t_val] = int(n)

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

    organizations_by_type: dict[str, int] = {ot.value: 0 for ot in OrganizationType}
    org_type_rows = db.execute(select(Organization.type, func.count()).group_by(Organization.type)).all()
    for ot_val, n in org_type_rows:
        organizations_by_type[ot_val.value if isinstance(ot_val, OrganizationType) else ot_val] = int(n)
    organizations_total = sum(organizations_by_type.values())

    requests_by_status: dict[str, int] = {rs.value: 0 for rs in AccessRequestStatus}
    req_status_rows = db.execute(select(AccessRequest.status, func.count()).group_by(AccessRequest.status)).all()
    for rs_val, n in req_status_rows:
        requests_by_status[rs_val.value if isinstance(rs_val, AccessRequestStatus) else rs_val] = int(n)

    # Thumbs up/down + tags is one independent half of CatalogItemRating;
    # star reviews (rating/comment) are the other — a row can have either,
    # both, or (after this feature) just the review half, so every count
    # here must filter on is_positive explicitly rather than counting all
    # rows, or a review-only row would silently inflate the thumbs totals.
    ratings_upvotes = int(
        db.execute(
            select(func.count()).select_from(CatalogItemRating).where(CatalogItemRating.is_positive.is_(True))
        ).scalar_one()
    )
    ratings_downvotes = int(
        db.execute(
            select(func.count()).select_from(CatalogItemRating).where(CatalogItemRating.is_positive.is_(False))
        ).scalar_one()
    )
    ratings_total = ratings_upvotes + ratings_downvotes
    tag_rows = db.execute(select(CatalogItemRating.tags_json).where(CatalogItemRating.tags_json.isnot(None))).all()
    tag_counter: Counter[str] = Counter()
    for (tags,) in tag_rows:
        for tag in tags or []:
            tag_counter[str(tag)] += 1
    top_tags = [{"tag": tag, "count": count} for tag, count in tag_counter.most_common(8)]

    # Star reviews (1-5 + comment) — separate from the thumbs data above.
    reviews_total = int(
        db.execute(
            select(func.count()).select_from(CatalogItemRating).where(CatalogItemRating.rating.isnot(None))
        ).scalar_one()
    )
    reviews_average_rating = db.execute(
        select(func.avg(CatalogItemRating.rating)).where(CatalogItemRating.rating.isnot(None))
    ).scalar_one()
    reviews_average_rating = round(float(reviews_average_rating), 1) if reviews_average_rating is not None else None
    review_distribution_rows = db.execute(
        select(CatalogItemRating.rating, func.count())
        .where(CatalogItemRating.rating.isnot(None))
        .group_by(CatalogItemRating.rating)
    ).all()
    reviews_distribution = {str(stars): 0 for stars in range(1, 6)}
    for stars, count in review_distribution_rows:
        reviews_distribution[str(int(stars))] = int(count)

    users_by_role_rows = db.execute(
        select(Role.code, func.count(func.distinct(OrganizationMember.user_id)))
        .select_from(MemberRole)
        .join(Role, Role.id == MemberRole.role_id)
        .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
        # Join back to User so a deleted/suspended account's leftover
        # membership rows don't keep counting toward its role's total.
        .join(User, User.id == OrganizationMember.user_id)
        .where(User.status.notin_([UserStatus.deleted, UserStatus.suspended]))
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
        "reviews_total": reviews_total,
        "reviews_average_rating": reviews_average_rating,
        "reviews_distribution": reviews_distribution,
    }
