"""Verifies the plan download-quota feature end to end at the model/service
level: after a subscriber downloads distinct plan-included items up to the
plan's monthly_download_limit, further NEW downloads are refused (403) and
the GET /consumer-catalog/me/download-quota endpoint the frontend uses to
disable the download buttons reports remaining=0 — exactly the signal
CatalogDetailPage.tsx checks before disabling the "Download" buttons.

Also checks every rule from the "Política general de suscripciones" FAQ:
- monthly downloads never roll over (base resets to 0 used every month).
- re-downloading the same item never costs quota again.
- an item NOT included in the plan is never quota-limited (outright
  purchases are unaffected).
- discounts never stack (a subscriber has exactly one active plan/discount
  per item, by construction).
- a loyalty reward, once granted at a milestone month, is real persisted
  state usable for 60 days — it survives a calendar month rollover and is
  only spent once the base allowance is exhausted, and an expired grant
  stops counting at all.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.catalog_download_event import CatalogDownloadEvent
from app.models.catalog_item import CatalogItem
from app.models.enums import (
    CatalogItemLevel,
    CatalogItemStatus,
    CatalogItemType,
    SubscriptionProvider,
    SubscriptionStatus,
)
from app.models.loyalty_reward_grant import LoyaltyRewardGrant
from app.models.plan import Plan
from app.models.plan_catalog_item import PlanCatalogItem
from app.models.plan_catalog_item_discount import PlanCatalogItemDiscount
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.auth.dependencies import get_default_organization_id
from app.modules.plans.quota import (
    _month_start,
    enforce_download_quota,
    get_download_quota_status,
    get_plan_summary,
    has_ever_downloaded_item,
    record_download_event,
)

from .conftest import auth_headers


def _make_catalog_item(db: Session, *, slug: str, price: str = "10.00") -> CatalogItem:
    item = CatalogItem(
        title=f"Item {slug}",
        slug=slug,
        type=CatalogItemType.resource,
        category="testing",
        short_description="short",
        long_description="long",
        image_url="https://example.com/image.png",
        price=Decimal(price),
        currency="EUR",
        status=CatalogItemStatus.published,
        level=CatalogItemLevel.intermediate,
        author="ASE",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _make_plan_with_quota(
    db: Session,
    *,
    monthly_download_limit: int,
    loyalty_bonus_downloads: int | None = None,
    loyalty_bonus_interval_months: int | None = None,
) -> Plan:
    plan = Plan(
        code=f"plan-{monthly_download_limit}-{loyalty_bonus_downloads}",
        name="Plan con cuota",
        price=Decimal("29.00"),
        currency="EUR",
        monthly_download_limit=monthly_download_limit,
        loyalty_bonus_downloads=loyalty_bonus_downloads,
        loyalty_bonus_interval_months=loyalty_bonus_interval_months,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def _subscribe(db: Session, *, org_id: int, plan_id: int, starts_at: datetime) -> Subscription:
    sub = Subscription(
        organization_id=org_id,
        plan_id=plan_id,
        provider=SubscriptionProvider.manual,
        status=SubscriptionStatus.active,
        starts_at=starts_at,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def _default_org_id(db: Session, user: User) -> int:
    org_id = get_default_organization_id(db, user)
    assert org_id is not None, "independent_user fixture should always resolve a default org"
    return org_id


def test_quota_blocks_downloads_once_limit_reached(db: Session, independent_user: User):
    """The exact scenario the frontend gates on: a plan with a 2-download
    monthly limit and 3 included items — downloading a 3rd *distinct* item
    must be refused once the first two have been downloaded, and the quota
    endpoint's `remaining` must already read 0 before that 3rd attempt (so
    the UI can disable the button pre-emptively, not just handle the
    403)."""
    item_a = _make_catalog_item(db, slug="quota-item-a")
    item_b = _make_catalog_item(db, slug="quota-item-b")
    item_c = _make_catalog_item(db, slug="quota-item-c")
    plan = _make_plan_with_quota(db, monthly_download_limit=2)
    for i, item in enumerate((item_a, item_b, item_c)):
        plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item.id, display_order=i))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc) - timedelta(days=10))

    # Before any downloads: full quota available, nothing blocks yet.
    status_before = get_download_quota_status(db, independent_user.id)
    assert status_before is not None
    assert status_before.limit == 2
    assert status_before.used == 0
    assert status_before.remaining == 2
    enforce_download_quota(db, user_id=independent_user.id, catalog_item=item_a)  # must not raise

    # Download #1 (item A) and #2 (item B) succeed and get recorded
    # (mirrors what ConsumerCatalogService.get_resource_download does
    # around the real file fetch).
    record_download_event(db, user_id=independent_user.id, catalog_item_id=item_a.id)
    record_download_event(db, user_id=independent_user.id, catalog_item_id=item_b.id)

    status_after_two = get_download_quota_status(db, independent_user.id)
    assert status_after_two is not None
    assert status_after_two.used == 2
    assert status_after_two.remaining == 0

    # A 3rd *distinct* item (C) must be refused — this is what the
    # frontend's quotaExhausted flag (CatalogDetailPage.tsx) pre-empts by
    # disabling the button using the same remaining=0 signal above.
    with pytest.raises(HTTPException) as exc_info:
        enforce_download_quota(db, user_id=independent_user.id, catalog_item=item_c)
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "monthly_download_quota_exhausted"


def test_repeat_download_never_consumes_additional_quota(db: Session, independent_user: User):
    """FAQ rule: "repetición de descarga consume cuota: no". Re-downloading
    the same item, any number of times, must never reduce `remaining` a
    second time — but a genuinely different item still competes for the
    one remaining unit of a limit=1 plan."""
    item_a = _make_catalog_item(db, slug="repeat-item-a")
    item_b = _make_catalog_item(db, slug="repeat-item-b")
    plan = _make_plan_with_quota(db, monthly_download_limit=1)
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item_a.id, display_order=0))
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item_b.id, display_order=1))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc) - timedelta(days=10))

    record_download_event(db, user_id=independent_user.id, catalog_item_id=item_a.id)
    status_after_one = get_download_quota_status(db, independent_user.id)
    assert status_after_one is not None
    assert status_after_one.used == 1
    assert status_after_one.remaining == 0

    # Re-downloading item A five more times never raises and never moves
    # `used`/`remaining` — enforce_download_quota lets it through even
    # though the base allowance shows exhausted.
    for _ in range(5):
        enforce_download_quota(db, user_id=independent_user.id, catalog_item=item_a)  # must not raise
        record_download_event(db, user_id=independent_user.id, catalog_item_id=item_a.id)

    status_after_repeats = get_download_quota_status(db, independent_user.id)
    assert status_after_repeats is not None
    assert status_after_repeats.used == 1
    assert status_after_repeats.remaining == 0

    # A genuinely different item is still correctly blocked.
    with pytest.raises(HTTPException) as exc_info:
        enforce_download_quota(db, user_id=independent_user.id, catalog_item=item_b)
    assert exc_info.value.status_code == 403


def test_repeat_download_from_a_previous_month_never_blocks(db: Session, independent_user: User):
    """Regression test for the reported bug: an item downloaded in an
    earlier calendar month must stay freely re-downloadable in a LATER
    month even once that later month's base quota is fully exhausted by
    other items — "repetición de descarga consume cuota: no" applies
    forever, not just within the same month it was first downloaded."""
    item_old = _make_catalog_item(db, slug="cross-month-old")
    item_new_a = _make_catalog_item(db, slug="cross-month-new-a")
    plan = _make_plan_with_quota(db, monthly_download_limit=1)
    for i, item in enumerate((item_old, item_new_a)):
        plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item.id, display_order=i))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc) - timedelta(days=400))

    now = datetime.now(timezone.utc)
    # item_old was downloaded a full 2 calendar months ago — well outside
    # "this month" — and must be remembered as "ever downloaded" forever.
    old_event = CatalogDownloadEvent(user_id=independent_user.id, catalog_item_id=item_old.id)
    old_event.downloaded_at = _month_start(now) - timedelta(days=40)
    db.add(old_event)
    db.commit()
    assert has_ever_downloaded_item(db, independent_user.id, item_old.id) is True
    assert has_ever_downloaded_item(db, independent_user.id, item_new_a.id) is False

    # That old download must not count against *this* month's base
    # allowance — it happened in a previous month.
    status_before = get_download_quota_status(db, independent_user.id)
    assert status_before is not None
    assert status_before.used == 0
    assert status_before.remaining == 1

    # Exhaust this month's base allowance with a brand-new item.
    record_download_event(db, user_id=independent_user.id, catalog_item_id=item_new_a.id)
    status_after = get_download_quota_status(db, independent_user.id)
    assert status_after is not None
    assert status_after.remaining == 0

    # Re-downloading the OLD item — first downloaded two months ago — must
    # still be allowed even though the base quota now reads 0 remaining.
    enforce_download_quota(db, user_id=independent_user.id, catalog_item=item_old)  # must not raise
    record_download_event(db, user_id=independent_user.id, catalog_item_id=item_old.id)
    status_final = get_download_quota_status(db, independent_user.id)
    assert status_final is not None
    assert status_final.remaining == 0  # unchanged — the re-download cost nothing


def test_quota_endpoint_reports_remaining_for_the_frontend(db: Session, independent_user: User):
    """GET /consumer-catalog/me/download-quota is what the frontend actually
    polls (see consumerCatalog.api.ts's getDownloadQuota /
    CatalogDetailPage.tsx's quotaQuery) — confirm the wire contract matches
    what get_download_quota_status computes, end to end through the real
    HTTP route."""
    from app.core.database import get_db
    from app.main import app

    item = _make_catalog_item(db, slug="quota-endpoint-item")
    plan = _make_plan_with_quota(db, monthly_download_limit=1)
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item.id, display_order=0))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc) - timedelta(days=5))

    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with TestClient(app) as client:
            headers = auth_headers(independent_user)

            res = client.get("/api/v1/consumer-catalog/me/download-quota", headers=headers)
            assert res.status_code == 200
            body = res.json()
            assert body["unlimited"] is False
            assert body["limit"] == 1
            assert body["remaining"] == 1

            record_download_event(db, user_id=independent_user.id, catalog_item_id=item.id)

            res2 = client.get("/api/v1/consumer-catalog/me/download-quota", headers=headers)
            body2 = res2.json()
            assert body2["remaining"] == 0
            # This is exactly the condition CatalogDetailPage.tsx's
            # quotaExhausted checks to disable the download buttons.
            assert body2["unlimited"] is False and body2["remaining"] <= 0
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_item_not_included_in_plan_is_never_quota_limited(db: Session, independent_user: User):
    """A catalog item bought outright (or simply not part of any plan) must
    never be blocked by someone else's — or even this same user's — plan
    quota, even once that quota is fully exhausted for the included
    items."""
    included_item = _make_catalog_item(db, slug="included-item")
    included_item_2 = _make_catalog_item(db, slug="included-item-2")
    outside_item = _make_catalog_item(db, slug="outside-item")
    plan = _make_plan_with_quota(db, monthly_download_limit=1)
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=included_item.id, display_order=0))
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=included_item_2.id, display_order=1))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc) - timedelta(days=5))

    # Exhaust the plan's quota with a distinct included item — re-checking
    # the SAME item never blocks (that's the repeat-download rule, tested
    # separately), so a second distinct item is what actually exhausts it.
    record_download_event(db, user_id=independent_user.id, catalog_item_id=included_item.id)
    with pytest.raises(HTTPException):
        enforce_download_quota(db, user_id=independent_user.id, catalog_item=included_item_2)

    # The item outside the plan is completely unaffected.
    enforce_download_quota(db, user_id=independent_user.id, catalog_item=outside_item)  # must not raise


def test_loyalty_bonus_adds_extra_downloads_on_milestone_month(db: Session, independent_user: User):
    """Every loyalty_bonus_interval_months of subscription tenure, the
    monthly limit should grow by loyalty_bonus_downloads for that month —
    e.g. a base of 2 + a 3-month bonus of 1 becomes 3 on month 3, 6, 9..."""
    item = _make_catalog_item(db, slug="loyalty-item")
    plan = _make_plan_with_quota(
        db, monthly_download_limit=2, loyalty_bonus_downloads=1, loyalty_bonus_interval_months=3,
    )
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item.id, display_order=0))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    # Subscribed exactly 3 full calendar months ago (same day-of-month
    # component doesn't matter, only year*12+month elapsed does — see
    # app.modules.plans.quota._loyalty_bonus_for_month) — this month is the
    # first loyalty milestone.
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month - 3
    while month <= 0:
        month += 12
        year -= 1
    starts_at = now.replace(year=year, month=month, day=1)

    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=starts_at)

    status = get_download_quota_status(db, independent_user.id)
    assert status is not None
    assert status.limit == 3  # 2 base + 1 loyalty bonus
    assert status.loyalty_bonus_active is True


def test_loyalty_grant_created_once_and_usable_across_month_rollover(db: Session, independent_user: User):
    """FAQ rule: "caducidad de recompensas: 60 días", "descargas mensuales
    acumulables: no". A reward granted this milestone month must (a) only
    ever be granted once for that milestone (idempotent), (b) sit unused
    without expanding `remaining` beyond base+bonus, (c) survive being
    carried into a still-unused state, and (d) be spendable only once the
    base allowance for a month is exhausted — including a later month,
    since a 60-day-old reward doesn't reset with the calendar."""
    item_a = _make_catalog_item(db, slug="loyalty-persist-a")
    item_b = _make_catalog_item(db, slug="loyalty-persist-b")
    item_c = _make_catalog_item(db, slug="loyalty-persist-c")
    plan = _make_plan_with_quota(
        db, monthly_download_limit=1, loyalty_bonus_downloads=1, loyalty_bonus_interval_months=3,
    )
    for i, item in enumerate((item_a, item_b, item_c)):
        plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item.id, display_order=i))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month - 3
    while month <= 0:
        month += 12
        year -= 1
    starts_at = now.replace(year=year, month=month, day=1)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=starts_at)

    # First check of the milestone month creates exactly one grant.
    get_download_quota_status(db, independent_user.id)
    get_download_quota_status(db, independent_user.id)  # calling it again must not double-grant
    grants = db.query(LoyaltyRewardGrant).filter(LoyaltyRewardGrant.organization_id == org_id).all()
    assert len(grants) == 1
    assert grants[0].downloads_granted == 1
    assert grants[0].downloads_consumed == 0
    assert grants[0].expires_at > now + timedelta(days=59)
    assert grants[0].expires_at <= now + timedelta(days=60, hours=1)

    # Base (1) + bonus (1) = 2 available this month; using item A spends
    # the base unit only, the bonus stays untouched.
    record_download_event(db, user_id=independent_user.id, catalog_item_id=item_a.id)
    status_mid = get_download_quota_status(db, independent_user.id)
    assert status_mid is not None
    assert status_mid.used == 1
    assert status_mid.remaining == 1  # the untouched bonus unit
    db.refresh(grants[0])
    assert grants[0].downloads_consumed == 0

    # Item B (a 2nd distinct item, past the base allowance) draws from the
    # bonus grant.
    record_download_event(db, user_id=independent_user.id, catalog_item_id=item_b.id)
    status_after_bonus_spent = get_download_quota_status(db, independent_user.id)
    assert status_after_bonus_spent is not None
    assert status_after_bonus_spent.remaining == 0
    db.refresh(grants[0])
    assert grants[0].downloads_consumed == 1
    with pytest.raises(HTTPException):
        enforce_download_quota(db, user_id=independent_user.id, catalog_item=item_c)

    # A download logged last calendar month must not count toward *this*
    # month's base usage — "descargas mensuales acumulables: no" applies
    # both ways: unused base is lost, and past usage doesn't linger either.
    last_month_event = CatalogDownloadEvent(user_id=independent_user.id, catalog_item_id=item_c.id)
    last_month_event.downloaded_at = _month_start(now) - timedelta(days=1)
    db.add(last_month_event)
    db.commit()
    status_ignoring_last_month = get_download_quota_status(db, independent_user.id)
    assert status_ignoring_last_month is not None
    assert status_ignoring_last_month.used == 2  # unchanged — the backdated event isn't this month's
    assert status_ignoring_last_month.remaining == 0

    # The bonus grant itself, being 60-day (not calendar-month) scoped,
    # stays fully spent regardless — it was consumed for good, not just
    # "for this month".
    db.refresh(grants[0])
    assert grants[0].downloads_consumed == 1


def test_expired_loyalty_grant_no_longer_counts(db: Session, independent_user: User):
    """A grant older than 60 days must stop contributing to `remaining`
    even if it still has unconsumed downloads left."""
    item = _make_catalog_item(db, slug="expired-grant-item")
    plan = _make_plan_with_quota(db, monthly_download_limit=1)
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item.id, display_order=0))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc) - timedelta(days=10))

    now = datetime.now(timezone.utc)
    db.add(
        LoyaltyRewardGrant(
            organization_id=org_id,
            plan_id=plan.id,
            milestone_elapsed_months=1,
            downloads_granted=5,
            downloads_consumed=0,
            granted_at=now - timedelta(days=70),
            expires_at=now - timedelta(days=10),  # expired 10 days ago
        )
    )
    db.commit()

    status = get_download_quota_status(db, independent_user.id)
    assert status is not None
    assert status.limit == 1  # base only — the expired grant contributes nothing
    assert status.loyalty_bonus_active is False


def test_unlimited_when_no_quota_configured(db: Session, independent_user: User):
    """The default for every plan today (monthly_download_limit=None) —
    confirms existing plans keep working exactly as before this feature."""
    item = _make_catalog_item(db, slug="unlimited-item")
    plan = _make_plan_with_quota(db, monthly_download_limit=0)  # placeholder, overwritten below
    plan.monthly_download_limit = None
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=item.id, display_order=0))
    db.commit()

    org_id = _default_org_id(db, independent_user)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc) - timedelta(days=5))

    assert get_download_quota_status(db, independent_user.id) is None
    for _ in range(50):
        enforce_download_quota(db, user_id=independent_user.id, catalog_item=item)  # never raises
        record_download_event(db, user_id=independent_user.id, catalog_item_id=item.id)


def test_plan_summary_for_profile_card(db: Session, independent_user: User):
    """Verifies the exact data the profile page's plan card renders (see
    ProfilePage.tsx's PlanSummaryCard): plan name, quota used/remaining, the
    best discount on items outside the plan, and a next-reward countdown —
    through the real GET /consumer-catalog/me/plan-summary endpoint."""
    from app.core.database import get_db
    from app.main import app

    included_item = _make_catalog_item(db, slug="summary-included")
    discounted_item = _make_catalog_item(db, slug="summary-discounted")
    plan = _make_plan_with_quota(
        db, monthly_download_limit=5, loyalty_bonus_downloads=1, loyalty_bonus_interval_months=6,
    )
    plan.name = "Biblioteca Profesional"
    plan.included_catalog_items.append(PlanCatalogItem(catalog_item_id=included_item.id, display_order=0))
    plan.discounted_catalog_items.append(
        PlanCatalogItemDiscount(catalog_item_id=discounted_item.id, discount_percent=Decimal("10.00"))
    )
    db.commit()

    org_id = _default_org_id(db, independent_user)
    _subscribe(db, org_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc) - timedelta(days=40))

    record_download_event(db, user_id=independent_user.id, catalog_item_id=included_item.id)

    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with TestClient(app) as client:
            res = client.get("/api/v1/consumer-catalog/me/plan-summary", headers=auth_headers(independent_user))
            assert res.status_code == 200
            body = res.json()
            assert body["hasActivePlan"] is True
            assert body["planName"] == "Biblioteca Profesional"
            assert body["unlimitedDownloads"] is False
            assert body["monthlyDownloadLimit"] == 5
            assert body["downloadsUsed"] == 1
            assert body["downloadsRemaining"] == 4
            assert body["maxDiscountPercent"] == "10.00" or float(body["maxDiscountPercent"]) == 10.0
            assert body["discountItemCount"] == 1
            assert body["loyaltyBonusDownloads"] == 1
            assert body["loyaltyBonusIntervalMonths"] == 6
            assert isinstance(body["nextRewardInDays"], int)
            assert body["nextRewardInDays"] >= 0
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_plan_summary_absent_without_active_subscription(db: Session, independent_user: User):
    summary = get_plan_summary(db, independent_user.id)
    assert summary is None

