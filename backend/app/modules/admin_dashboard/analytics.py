from __future__ import annotations

import calendar
from collections import Counter
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.access_request import AccessRequest
from app.models.catalog_item import CatalogItem
from app.models.catalog_item_rating import CatalogItemRating
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import (
    AccessRequestStatus,
    CatalogItemType,
    MembershipStatus,
    OrganizationStatus,
    OrganizationType,
    UserStatus,
)
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.subscription import Subscription
from app.models.user import User

# A catalog_purchases row with this source was never an acquisition event of
# its own — it's a side effect of the org's plan already including the item
# (see CatalogPurchase.source), granted automatically by the subscription
# webhook with no user action involved. Every "individual purchases" metric
# below excludes it so a €9.99/mo plan bundling 5 items doesn't get counted
# as "5 purchases" on top of the subscription itself — mirrors the same fix
# applied to the buyer-facing dashboard's "Total invertido" stat.
_PLAN_ENTITLEMENT_SOURCE = "plan_entitlement"


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


def _mtd_comparison_range(now: datetime) -> tuple[datetime, datetime, datetime, datetime]:
    """Month-to-date comparison window: the current month from day 1 through
    now, against the *same day-of-month range* in the previous calendar
    month — not two full calendar months, which would always make an
    in-progress month look artificially behind (e.g. comparing 4 days of
    September against all 31 days of August). The previous-month cutoff is
    capped to that month's actual last day (e.g. "up to day 31" becomes "up
    to day 28" when the previous month is February)."""
    current_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    prev_month_index = now.year * 12 + (now.month - 1) - 1
    prev_year, prev_month0 = divmod(prev_month_index, 12)
    prev_month = prev_month0 + 1
    prev_month_days = calendar.monthrange(prev_year, prev_month)[1]
    day_cutoff = min(now.day, prev_month_days)
    previous_start = datetime(prev_year, prev_month, 1, tzinfo=timezone.utc)
    previous_end = datetime(prev_year, prev_month, day_cutoff, 23, 59, 59, 999999, tzinfo=timezone.utc)
    return current_start, now, previous_start, previous_end


def _change_pct(current: int, previous: int) -> float | None:
    """None when there's no previous-month baseline to compare against
    (division by zero is undefined, and "+∞%" isn't a useful number to show
    an admin) — the frontend shows a "new" badge in that case instead."""
    if previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 1)


def compute_tenure_months(starts_at: datetime, ends_at: datetime | None, *, now: datetime | None = None) -> int:
    """Elapsed calendar months from `starts_at` to `ends_at` (if the
    subscription already ended) or to `now` otherwise — "how many months has
    this org been on this plan" for the admin purchases view's "Planes" tab.
    Calendar-month arithmetic (same idea as `_month_buckets` above), not a
    day-count division, so a subscription that started on the 31st doesn't
    get shorted by landing in a shorter month. Clamped to >= 0."""
    reference = ends_at if ends_at is not None else (now or datetime.now(timezone.utc))
    months = (reference.year - starts_at.year) * 12 + (reference.month - starts_at.month)
    if reference.day < starts_at.day:
        months -= 1
    return max(0, months)


def _shift_month(now: datetime, delta: int) -> tuple[int, int]:
    """(year, month) for `delta` calendar months before `now` — delta=0 is
    the current month, delta=1 is last month, etc. Same exact-month
    arithmetic as `_month_buckets`."""
    total = now.year * 12 + (now.month - 1) - delta
    year, month0 = divmod(total, 12)
    return year, month0 + 1


def _build_trend_series(
    db: Session,
    *,
    time_column,
    value_expr,
    extra_where=None,
    join=None,
    now: datetime | None = None,
) -> dict:
    """One metric's data for the dashboard's "this month vs. last month / vs.
    the last 6 months" line charts (see PremiumTrendCompareChart on the
    frontend). Single query, grouped by (calendar month, day-of-month), then
    sliced in Python into three same-length series so the frontend can swap
    the comparison line with no extra request:

    - `current`: this month, day 1 through today — days after today are left
      null rather than 0, so the line doesn't nosedive into "no data yet".
    - `previous_month`: the immediately preceding calendar month, in full.
    - `avg_6_months`: for each day-of-month, the average of that day's value
      across the 6 months before the current one — a smoothed baseline for
      the "vs. 6 previous months" toggle, using only the months that
      actually have that day (not every month has a 31st).

    `days` always runs 1..31 regardless of how long the relevant months
    actually are, so the chart's x-axis lines up day-for-day across months
    of different lengths — a value simply stays null past a shorter month's
    last day."""
    now = now or datetime.now(timezone.utc)
    cur_year, cur_month = _shift_month(now, 0)
    since_year, since_month = _shift_month(now, 6)
    since = datetime(since_year, since_month, 1, tzinfo=timezone.utc)

    month_key = func.to_char(func.date_trunc("month", time_column), "YYYY-MM")
    day_key = func.extract("day", time_column)

    where_clauses = [time_column >= since]
    if extra_where is not None:
        where_clauses.append(extra_where)

    stmt = select(month_key, day_key, value_expr)
    if join is not None:
        # e.g. (CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
        # — required whenever `value_expr` reaches into a related table
        # (revenue needs CatalogItem.price); without an explicit join
        # condition here, SQLAlchemy would pull that table into the FROM
        # clause with nothing relating it back to the row being grouped, an
        # unintended cross join that would wildly overcount revenue.
        target, condition = join
        stmt = stmt.join(target, condition)
    stmt = stmt.where(*where_clauses).group_by(month_key, day_key)

    rows = db.execute(stmt).all()

    by_month: dict[str, dict[int, float]] = {}
    for mkey, day, value in rows:
        by_month.setdefault(str(mkey), {})[int(day)] = float(value or 0)

    days = list(range(1, 32))
    cur_key = f"{cur_year:04d}-{cur_month:02d}"
    prev_year, prev_month = _shift_month(now, 1)
    prev_key = f"{prev_year:04d}-{prev_month:02d}"
    prev6_keys = [f"{y:04d}-{m:02d}" for y, m in (_shift_month(now, d) for d in range(1, 7))]

    today = now.day
    current = [by_month.get(cur_key, {}).get(d) if d <= today else None for d in days]
    previous_month = [by_month.get(prev_key, {}).get(d) for d in days]
    avg_6_months = []
    for d in days:
        samples = [by_month[k][d] for k in prev6_keys if k in by_month and d in by_month[k]]
        avg_6_months.append(round(sum(samples) / len(samples), 2) if samples else None)

    return {"days": days, "current": current, "previous_month": previous_month, "avg_6_months": avg_6_months}


def build_trend_comparisons(db: Session, *, now: datetime | None = None) -> dict:
    """The three "this month vs. last month / vs. 6-month average" charts on
    the dashboard: individual-product revenue, new plan signups, new users.
    See `_build_trend_series` for the shared shape."""
    now = now or datetime.now(timezone.utc)

    individual_revenue = _build_trend_series(
        db,
        time_column=CatalogPurchase.created_at,
        value_expr=func.coalesce(func.sum(CatalogItem.price), 0),
        extra_where=CatalogPurchase.source != _PLAN_ENTITLEMENT_SOURCE,
        join=(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id),
        now=now,
    )

    plan_signups = _build_trend_series(
        db,
        time_column=Subscription.created_at,
        value_expr=func.count(),
        now=now,
    )

    users = _build_trend_series(
        db,
        time_column=User.created_at,
        value_expr=func.count(),
        extra_where=User.status.notin_([UserStatus.deleted, UserStatus.suspended]),
        now=now,
    )

    return {
        "individual_revenue": individual_revenue,
        "plan_signups": plan_signups,
        "users": users,
    }


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

    # "vs last month" headline comparison for the three metrics an admin
    # cares most about tracking week to week — see _mtd_comparison_range for
    # why this is a fair (same day-of-month) window rather than two full
    # calendar months.
    now = datetime.now(timezone.utc)
    cur_start, cur_end, prev_start, prev_end = _mtd_comparison_range(now)

    trends = build_trend_comparisons(db, now=now)

    users_current = int(
        db.execute(
            select(func.count())
            .select_from(User)
            .where(
                User.created_at >= cur_start,
                User.created_at <= cur_end,
                User.status.notin_([UserStatus.deleted, UserStatus.suspended]),
            )
        ).scalar_one()
    )
    users_previous = int(
        db.execute(
            select(func.count())
            .select_from(User)
            .where(
                User.created_at >= prev_start,
                User.created_at <= prev_end,
                User.status.notin_([UserStatus.deleted, UserStatus.suspended]),
            )
        ).scalar_one()
    )

    individual_purchases_current = int(
        db.execute(
            select(func.count())
            .select_from(CatalogPurchase)
            .where(
                CatalogPurchase.created_at >= cur_start,
                CatalogPurchase.created_at <= cur_end,
                CatalogPurchase.source != _PLAN_ENTITLEMENT_SOURCE,
            )
        ).scalar_one()
    )
    individual_purchases_previous = int(
        db.execute(
            select(func.count())
            .select_from(CatalogPurchase)
            .where(
                CatalogPurchase.created_at >= prev_start,
                CatalogPurchase.created_at <= prev_end,
                CatalogPurchase.source != _PLAN_ENTITLEMENT_SOURCE,
            )
        ).scalar_one()
    )

    plan_signups_current = int(
        db.execute(
            select(func.count())
            .select_from(Subscription)
            .where(Subscription.created_at >= cur_start, Subscription.created_at <= cur_end)
        ).scalar_one()
    )
    plan_signups_previous = int(
        db.execute(
            select(func.count())
            .select_from(Subscription)
            .where(Subscription.created_at >= prev_start, Subscription.created_at <= prev_end)
        ).scalar_one()
    )

    month_comparison = {
        "users": {
            "current": users_current,
            "previous": users_previous,
            "change_pct": _change_pct(users_current, users_previous),
        },
        "individual_purchases": {
            "current": individual_purchases_current,
            "previous": individual_purchases_previous,
            "change_pct": _change_pct(individual_purchases_current, individual_purchases_previous),
        },
        "plan_signups": {
            "current": plan_signups_current,
            "previous": plan_signups_previous,
            "change_pct": _change_pct(plan_signups_current, plan_signups_previous),
        },
    }

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

    # Same fix as the user-growth chart above: deleted/suspended
    # organizations shouldn't keep padding this breakdown forever — this one
    # was missed when that fix originally shipped (task #76), which is why
    # deleting an org never budged this chart. is_platform_core is excluded
    # too — the seed script's "ASE Platform" org is only an RBAC anchor for
    # the super_admin, not a real tenant (see Organization.is_platform_core).
    organizations_by_type: dict[str, int] = {ot.value: 0 for ot in OrganizationType}
    org_type_rows = db.execute(
        select(Organization.type, func.count())
        .where(
            Organization.status.notin_([OrganizationStatus.deleted, OrganizationStatus.suspended]),
            Organization.is_platform_core.is_(False),
        )
        .group_by(Organization.type)
    ).all()
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
        "trends": trends,
        "month_comparison": month_comparison,
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


def build_application_map(db: Session, *, individual_users_limit: int = 150) -> dict:
    """Powers the admin dashboard's "application map" tree: real
    organizations (with their active members) on one branch, unaffiliated
    individual users on the other. A user only ever shows up once — either
    nested under the organization(s) they actively belong to, or in the
    individual-users branch if they don't belong to any.

    "Real organization" here means business/enterprise/academy — the same
    exclusions as `organizations_by_type` above (no deleted/suspended, no
    `is_platform_core` seed anchor), plus `individual`-type orgs are
    intentionally left out too: those are personal workspaces auto-created
    for independent users, not actual teams, so their "member" (the owner)
    belongs on the individual-users branch instead of appearing as a
    one-person "organization".
    """
    real_org_types = [OrganizationType.business, OrganizationType.enterprise, OrganizationType.academy]

    org_rows = db.execute(
        select(Organization)
        .where(
            Organization.type.in_(real_org_types),
            Organization.status.notin_([OrganizationStatus.deleted, OrganizationStatus.suspended]),
            Organization.is_platform_core.is_(False),
        )
        .order_by(Organization.name)
    ).scalars().all()

    org_ids = [o.id for o in org_rows]
    members_by_org: dict[int, list[dict]] = {oid: [] for oid in org_ids}
    covered_user_ids: set[int] = set()

    if org_ids:
        member_rows = db.execute(
            select(OrganizationMember.organization_id, User)
            .join(User, User.id == OrganizationMember.user_id)
            .where(
                OrganizationMember.organization_id.in_(org_ids),
                OrganizationMember.membership_status == MembershipStatus.active,
                User.status.notin_([UserStatus.deleted, UserStatus.suspended]),
            )
        ).all()

        member_user_ids = list({u.id for _, u in member_rows})
        roles_by_member_user: dict[tuple[int, int], list[str]] = {}
        if member_user_ids:
            role_rows = db.execute(
                select(OrganizationMember.organization_id, OrganizationMember.user_id, Role.code)
                .select_from(MemberRole)
                .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
                .join(Role, Role.id == MemberRole.role_id)
                .where(
                    OrganizationMember.organization_id.in_(org_ids),
                    OrganizationMember.user_id.in_(member_user_ids),
                )
            ).all()
            for oid, uid, code in role_rows:
                roles_by_member_user.setdefault((oid, uid), []).append(code)

        for oid, u in member_rows:
            covered_user_ids.add(u.id)
            members_by_org[oid].append(
                {
                    "uuid": str(u.uuid),
                    "email": u.email,
                    "display_name": u.display_name,
                    "role_codes": sorted(roles_by_member_user.get((oid, u.id), [])),
                }
            )

        for oid in members_by_org:
            members_by_org[oid].sort(key=lambda m: (m["display_name"] or m["email"]).lower())

    organizations = [
        {
            "uuid": str(o.uuid),
            "name": o.name,
            "type": o.type.value if hasattr(o.type, "value") else str(o.type),
            "members": members_by_org.get(o.id, []),
        }
        for o in org_rows
    ]

    # Individual users = active accounts not covered above — includes users
    # whose only organization is their personal `individual`-type workspace,
    # as well as any account with no organization membership at all.
    individual_total_query = select(func.count()).select_from(User).where(User.status == UserStatus.active)
    individual_list_query = (
        select(User).where(User.status == UserStatus.active).order_by(User.created_at.desc()).limit(individual_users_limit)
    )
    if covered_user_ids:
        individual_total_query = individual_total_query.where(User.id.notin_(covered_user_ids))
        individual_list_query = individual_list_query.where(User.id.notin_(covered_user_ids))

    individual_users_total = int(db.execute(individual_total_query).scalar_one())
    individual_rows = db.execute(individual_list_query).scalars().all()
    individual_users = [
        {"uuid": str(u.uuid), "email": u.email, "display_name": u.display_name} for u in individual_rows
    ]

    return {
        "organizations": organizations,
        "organizations_total": len(organizations),
        "individual_users": individual_users,
        "individual_users_total": individual_users_total,
        "individual_users_truncated": individual_users_total > len(individual_users),
    }
