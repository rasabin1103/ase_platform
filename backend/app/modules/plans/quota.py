from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalog_download_event import CatalogDownloadEvent
from app.models.catalog_item import CatalogItem
from app.models.enums import SubscriptionStatus
from app.models.loyalty_reward_grant import LoyaltyRewardGrant
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.auth.dependencies import get_default_organization_id

"""Plan-level monthly download quota + loyalty bonus (see Plan model's
"Download quota / loyalty / discounts" fields). This never touches
in-platform viewing/preview — only the actual file-download action
(ConsumerCatalogService.get_resource_download) is gated, per the product
decision: everything included in a plan can always be *viewed*, only
*downloading* is rationed.

General subscription policy this module implements (see the "Política
general de suscripciones" FAQ on the public plans page):
- monthly downloads never roll over — an unused base allowance is simply
  gone once the calendar month ends (see get_download_quota_status).
- re-downloading a file you already downloaded this month never costs
  quota again (see _item_already_downloaded_this_month).
- buying a catalog item outright never draws from any plan's quota (see
  is_item_governed_by_plan_quota).
- a loyalty reward stays usable for exactly 60 days from the moment it's
  granted (LOYALTY_GRANT_VALIDITY), independent of calendar months — see
  LoyaltyRewardGrant and _ensure_current_milestone_grant.
- discounts never stack — a subscriber has exactly one active plan, so
  there is only ever one discount_percent per catalog item to begin with.
"""

LOYALTY_GRANT_VALIDITY = timedelta(days=60)


@dataclass
class DownloadQuotaStatus:
    limit: int
    used: int
    remaining: int
    loyalty_bonus_active: bool


def _month_start(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _elapsed_months(subscription_starts_at: datetime, now: datetime) -> int:
    return (now.year - subscription_starts_at.year) * 12 + (now.month - subscription_starts_at.month)


def _next_loyalty_milestone_days(plan: Plan, subscription_starts_at: datetime, now: datetime) -> int | None:
    """Days from `now` until the first day of the next loyalty-bonus
    calendar month — None when no loyalty bonus is configured. Always
    points at the next month a grant will be created for (see
    _ensure_current_milestone_grant), even when this month already is one
    (in which case it looks ahead to the *following* milestone, since this
    month's grant was already made)."""
    if not plan.loyalty_bonus_downloads or not plan.loyalty_bonus_interval_months:
        return None
    interval = plan.loyalty_bonus_interval_months
    elapsed_months = _elapsed_months(subscription_starts_at, now)
    next_elapsed = ((max(elapsed_months, 0) // interval) + 1) * interval
    total_months = (subscription_starts_at.month - 1) + next_elapsed
    target_year = subscription_starts_at.year + total_months // 12
    target_month = total_months % 12 + 1
    target_date = datetime(target_year, target_month, 1, tzinfo=timezone.utc)
    return max(0, (target_date - now).days)


def _ensure_current_milestone_grant(db: Session, sub: Subscription, plan: Plan, now: datetime) -> None:
    """Idempotently creates this month's LoyaltyRewardGrant the first time
    anything checks quota status during a milestone month — no scheduled
    job needed. Uniqueness is enforced by the DB (organization_id, plan_id,
    milestone_elapsed_months), so a race between two concurrent requests
    can never double-grant the same milestone."""
    if not plan.loyalty_bonus_downloads or not plan.loyalty_bonus_interval_months:
        return
    elapsed_months = _elapsed_months(sub.starts_at, now)
    if elapsed_months <= 0 or elapsed_months % plan.loyalty_bonus_interval_months != 0:
        return
    exists = db.execute(
        select(LoyaltyRewardGrant.id).where(
            LoyaltyRewardGrant.organization_id == sub.organization_id,
            LoyaltyRewardGrant.plan_id == plan.id,
            LoyaltyRewardGrant.milestone_elapsed_months == elapsed_months,
        )
    ).scalar_one_or_none()
    if exists is not None:
        return
    db.add(
        LoyaltyRewardGrant(
            organization_id=sub.organization_id,
            plan_id=plan.id,
            milestone_elapsed_months=elapsed_months,
            downloads_granted=plan.loyalty_bonus_downloads,
            granted_at=now,
            expires_at=now + LOYALTY_GRANT_VALIDITY,
        )
    )
    try:
        db.commit()
    except Exception:
        # Lost a race with a concurrent request granting the same
        # milestone — the unique constraint did its job, nothing to do.
        db.rollback()


def _bonus_remaining_live(db: Session, *, organization_id: int, plan_id: int, now: datetime) -> int:
    """Sum of (granted - consumed) across every not-yet-expired grant for
    this org/plan — live, decrements permanently as grants are consumed,
    independent of calendar month resets."""
    total = db.execute(
        select(func.coalesce(func.sum(LoyaltyRewardGrant.downloads_granted - LoyaltyRewardGrant.downloads_consumed), 0))
        .where(
            LoyaltyRewardGrant.organization_id == organization_id,
            LoyaltyRewardGrant.plan_id == plan_id,
            LoyaltyRewardGrant.expires_at > now,
        )
    ).scalar_one()
    return int(total)


def _consume_bonus_grant(db: Session, *, organization_id: int, plan_id: int, now: datetime) -> bool:
    """Consumes one unit from whichever active grant expires soonest (use
    it before it's lost). Returns False when there's nothing left to
    consume. Row-locked so two concurrent downloads can't both claim the
    same last unit."""
    grant = db.execute(
        select(LoyaltyRewardGrant)
        .where(
            LoyaltyRewardGrant.organization_id == organization_id,
            LoyaltyRewardGrant.plan_id == plan_id,
            LoyaltyRewardGrant.expires_at > now,
            LoyaltyRewardGrant.downloads_consumed < LoyaltyRewardGrant.downloads_granted,
        )
        .order_by(LoyaltyRewardGrant.expires_at.asc())
        .limit(1)
        .with_for_update()
    ).scalar_one_or_none()
    if grant is None:
        return False
    grant.downloads_consumed += 1
    db.commit()
    return True


@dataclass
class PlanSummaryStatus:
    """Powers the "your plan" card on the profile page — plan name/cycle,
    the same download-quota numbers as DownloadQuotaStatus, the best
    discount currently available on items outside the plan, and a
    countdown to the next loyalty-bonus month. None of this is invented:
    every field is read straight off the active Subscription/Plan, same
    source as the enforcement logic above."""

    plan_name: str
    billing_cycle: str
    unlimited: bool
    monthly_download_limit: int | None
    used: int
    remaining: int | None
    loyalty_bonus_downloads: int | None
    loyalty_bonus_interval_months: int | None
    loyalty_bonus_active: bool
    next_reward_in_days: int | None
    max_discount_percent: Decimal | None
    discount_item_count: int


def get_plan_summary(db: Session, user_id: int) -> PlanSummaryStatus | None:
    """None means "no active plan subscription to summarize" — the profile
    page simply omits the card in that case."""
    found = get_active_subscription_and_plan(db, user_id)
    if found is None:
        return None
    sub, plan = found
    now = datetime.now(timezone.utc)
    quota = get_download_quota_status(db, user_id)
    discounts = plan.discounted_catalog_items
    max_discount = max((d.discount_percent for d in discounts), default=None)
    return PlanSummaryStatus(
        plan_name=plan.name,
        billing_cycle=plan.billing_cycle.value,
        unlimited=quota is None,
        monthly_download_limit=quota.limit if quota else None,
        used=quota.used if quota else 0,
        remaining=quota.remaining if quota else None,
        loyalty_bonus_downloads=plan.loyalty_bonus_downloads,
        loyalty_bonus_interval_months=plan.loyalty_bonus_interval_months,
        loyalty_bonus_active=quota.loyalty_bonus_active if quota else False,
        next_reward_in_days=_next_loyalty_milestone_days(plan, sub.starts_at, now),
        max_discount_percent=max_discount,
        discount_item_count=len(discounts),
    )


def get_active_subscription_and_plan(db: Session, user_id: int) -> tuple[Subscription, Plan] | None:
    """The subscription/plan pair whose quota governs this user's
    downloads right now — their default organization's most recent active
    subscription. None if the user has no organization or no active
    subscription (e.g. on the Free plan, or between plans)."""
    user = db.get(User, user_id)
    if user is None:
        return None
    org_id = get_default_organization_id(db, user)
    if org_id is None:
        return None
    sub = db.execute(
        select(Subscription)
        .where(Subscription.organization_id == org_id, Subscription.status == SubscriptionStatus.active)
        .order_by(Subscription.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if sub is None:
        return None
    plan = db.get(Plan, sub.plan_id)
    if plan is None:
        return None
    return sub, plan


def is_item_governed_by_plan_quota(plan: Plan, catalog_item_id: int) -> bool:
    """Only items the plan actually *includes* draw from its shared
    monthly quota — an item bought outright (or included in no plan at
    all) is never rationed, plan or no plan."""
    return any(pci.catalog_item_id == catalog_item_id for pci in plan.included_catalog_items)


def _item_already_downloaded_this_month(db: Session, user_id: int, catalog_item_id: int, now: datetime) -> bool:
    """True if this exact item already has a download event logged this
    calendar month — a repeat download of it never costs quota again."""
    return (
        db.execute(
            select(func.count())
            .select_from(CatalogDownloadEvent)
            .where(
                CatalogDownloadEvent.user_id == user_id,
                CatalogDownloadEvent.catalog_item_id == catalog_item_id,
                CatalogDownloadEvent.downloaded_at >= _month_start(now),
            )
        ).scalar_one()
        > 0
    )


def _distinct_items_downloaded_this_month(db: Session, user_id: int, plan: Plan, now: datetime) -> int:
    """Count of *distinct* plan-included items downloaded this calendar
    month — the base monthly allowance is spent per distinct item, not per
    download event, so downloading the same file five times still counts
    as one."""
    included_ids = [pci.catalog_item_id for pci in plan.included_catalog_items]
    if not included_ids:
        return 0
    return int(
        db.execute(
            select(func.count(func.distinct(CatalogDownloadEvent.catalog_item_id)))
            .where(
                CatalogDownloadEvent.user_id == user_id,
                CatalogDownloadEvent.catalog_item_id.in_(included_ids),
                CatalogDownloadEvent.downloaded_at >= _month_start(now),
            )
        ).scalar_one()
    )


def get_download_quota_status(db: Session, user_id: int) -> DownloadQuotaStatus | None:
    """None means "no quota tracked for this user right now" — no active
    plan subscription, or the plan has monthly_download_limit unset
    (unlimited, the default for every plan until an admin opts in).
    Never raises.

    `remaining` = whatever's left of this month's base allowance (never
    rolls over) + whatever's left of any still-valid (< 60 days old)
    loyalty grant (which DOES roll over, by design, until it expires or is
    fully used). `limit`/`used` are derived so "X of Y" always reads
    consistently with `remaining`."""
    found = get_active_subscription_and_plan(db, user_id)
    if found is None:
        return None
    sub, plan = found
    if plan.monthly_download_limit is None:
        return None

    now = datetime.now(timezone.utc)
    _ensure_current_milestone_grant(db, sub, plan, now)

    monthly_used = _distinct_items_downloaded_this_month(db, user_id, plan, now)
    bonus_remaining = _bonus_remaining_live(db, organization_id=sub.organization_id, plan_id=plan.id, now=now)
    remaining = max(0, plan.monthly_download_limit - monthly_used) + bonus_remaining
    limit = monthly_used + remaining

    return DownloadQuotaStatus(
        limit=limit, used=monthly_used, remaining=remaining, loyalty_bonus_active=bonus_remaining > 0,
    )


def enforce_download_quota(db: Session, *, user_id: int, catalog_item: CatalogItem) -> None:
    """Raises 403 if downloading `catalog_item` right now would exceed the
    buyer's active plan's monthly quota. A no-op for anyone not governed by
    a quota at all — no active plan, the plan has no limit configured, or
    this specific item isn't one the plan includes (an outright purchase
    is never quota-limited, plan or no plan) — or if this exact item was
    already downloaded this month (a repeat download never costs quota).
    Purely a read-only check: it never mutates loyalty-grant state itself
    (see record_download_event for that), so a download that's allowed
    here but then fails to actually serve never wastes a bonus unit.
    Called from ConsumerCatalogService.get_resource_download, right
    alongside its own ownership check — this is a second, independent
    gate, not a replacement for it."""
    found = get_active_subscription_and_plan(db, user_id)
    if found is None:
        return
    sub, plan = found
    if plan.monthly_download_limit is None or not is_item_governed_by_plan_quota(plan, catalog_item.id):
        return
    now = datetime.now(timezone.utc)
    _ensure_current_milestone_grant(db, sub, plan, now)
    if _item_already_downloaded_this_month(db, user_id, catalog_item.id, now):
        return
    quota = get_download_quota_status(db, user_id)
    if quota is not None and quota.remaining <= 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="monthly_download_quota_exhausted")


def record_download_event(db: Session, *, user_id: int, catalog_item_id: int) -> None:
    """Logs the actual download (always, regardless of plan/quota — this
    log is also what powers "my library" recency elsewhere), then — only
    for a genuinely new distinct item this month, past the plan's base
    allowance — consumes one unit from the oldest-expiring active loyalty
    grant. Deliberately mutates grant state here (after the file was
    already served), not in enforce_download_quota (a pre-check), so a
    download that's approved but then fails downstream never burns a
    reward for nothing."""
    now = datetime.now(timezone.utc)
    already = _item_already_downloaded_this_month(db, user_id, catalog_item_id, now)

    db.add(CatalogDownloadEvent(user_id=user_id, catalog_item_id=catalog_item_id))
    db.commit()

    if already:
        return

    found = get_active_subscription_and_plan(db, user_id)
    if found is None:
        return
    sub, plan = found
    if plan.monthly_download_limit is None or not is_item_governed_by_plan_quota(plan, catalog_item_id):
        return

    _ensure_current_milestone_grant(db, sub, plan, now)
    distinct_used_after = _distinct_items_downloaded_this_month(db, user_id, plan, now)
    used_before_this_download = distinct_used_after - 1
    if used_before_this_download >= plan.monthly_download_limit:
        _consume_bonus_grant(db, organization_id=sub.organization_id, plan_id=plan.id, now=now)
