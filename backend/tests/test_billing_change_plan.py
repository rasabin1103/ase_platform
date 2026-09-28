"""Verifies BillingService.change_plan implements the "upgrade inmediato /
downgrade próximo ciclo" policy for real: an upgrade modifies the existing
Stripe subscription in place with an immediate prorated charge, while a
downgrade is scheduled via a Stripe Subscription Schedule so the price
change only takes effect at the next billing cycle — never a second,
competing subscription either way.

Stripe itself is mocked throughout (no real network/API key needed) — what
these tests check is that BillingService calls the Stripe SDK with the
right shape of request for each direction, and updates (or deliberately
does NOT update) the local Subscription row accordingly.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import patch

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import SubscriptionProvider, SubscriptionStatus
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.auth.dependencies import get_default_organization_id
from app.modules.billing.service import BillingService


def _make_plan(db: Session, *, code: str, price: str, stripe_price_id: str) -> Plan:
    plan = Plan(code=code, name=code, price=Decimal(price), currency="EUR", stripe_price_id=stripe_price_id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def _subscribe_stripe(db: Session, *, org_id: int, plan_id: int, provider_subscription_id: str) -> Subscription:
    sub = Subscription(
        organization_id=org_id,
        plan_id=plan_id,
        provider=SubscriptionProvider.stripe,
        provider_subscription_id=provider_subscription_id,
        status=SubscriptionStatus.active,
        starts_at=datetime.now(timezone.utc),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def test_change_plan_upgrade_is_immediate(db: Session, independent_user: User, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_fake")
    basic = _make_plan(db, code="basic-up", price="9.00", stripe_price_id="price_basic_up")
    pro = _make_plan(db, code="pro-up", price="29.00", stripe_price_id="price_pro_up")
    org_id = get_default_organization_id(db, independent_user)
    assert org_id is not None
    sub = _subscribe_stripe(db, org_id=org_id, plan_id=basic.id, provider_subscription_id="sub_upgrade_1")

    svc = BillingService(db)
    fake_stripe_sub = {"items": {"data": [{"id": "si_1", "current_period_end": 1999999999}]}}

    with (
        patch("app.modules.billing.service.stripe.Subscription.retrieve", return_value=fake_stripe_sub),
        patch("app.modules.billing.service.stripe.Subscription.modify") as mock_modify,
    ):
        result = svc.change_plan(current_user=independent_user, new_plan_id=pro.id)

    assert result["direction"] == "upgrade"
    assert result["effective"] == "immediate"
    assert result["effective_at"] is None
    assert result["new_plan_id"] == pro.id

    mock_modify.assert_called_once()
    _, kwargs = mock_modify.call_args
    assert kwargs["proration_behavior"] == "always_invoice"
    assert kwargs["items"] == [{"id": "si_1", "price": "price_pro_up"}]

    # Reflected locally right away — an upgrade takes effect immediately.
    db.refresh(sub)
    assert sub.plan_id == pro.id


def test_change_plan_downgrade_is_scheduled_for_next_cycle(db: Session, independent_user: User, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_fake")
    pro = _make_plan(db, code="pro-down", price="29.00", stripe_price_id="price_pro_down")
    basic = _make_plan(db, code="basic-down", price="9.00", stripe_price_id="price_basic_down")
    org_id = get_default_organization_id(db, independent_user)
    assert org_id is not None
    sub = _subscribe_stripe(db, org_id=org_id, plan_id=pro.id, provider_subscription_id="sub_downgrade_1")

    svc = BillingService(db)
    period_end_ts = 1999999999
    fake_stripe_sub = {
        "items": {"data": [{"id": "si_2", "current_period_end": period_end_ts}]},
        "current_period_end": period_end_ts,
    }
    fake_schedule = {
        "id": "sub_sched_1",
        "phases": [{"start_date": 1000000000, "items": [{"price": "price_pro_down"}]}],
    }

    with (
        patch("app.modules.billing.service.stripe.Subscription.retrieve", return_value=fake_stripe_sub),
        patch(
            "app.modules.billing.service.stripe.SubscriptionSchedule.create", return_value=fake_schedule
        ) as mock_create,
        patch("app.modules.billing.service.stripe.SubscriptionSchedule.modify") as mock_modify,
    ):
        result = svc.change_plan(current_user=independent_user, new_plan_id=basic.id)

    assert result["direction"] == "downgrade"
    assert result["effective"] == "next_cycle"
    assert result["effective_at"] == datetime.fromtimestamp(period_end_ts, tz=timezone.utc)
    assert result["new_plan_id"] == basic.id

    mock_create.assert_called_once_with(from_subscription="sub_downgrade_1")
    mock_modify.assert_called_once()
    _, kwargs = mock_modify.call_args
    phases = kwargs["phases"]
    assert phases[0]["items"] == [{"price": "price_pro_down", "quantity": 1}]
    assert phases[0]["end_date"] == period_end_ts
    assert phases[1]["items"] == [{"price": "price_basic_down", "quantity": 1}]

    # NOT reflected locally yet — a downgrade only takes effect at the next
    # billing cycle, so the subscriber keeps today's plan/benefits for now.
    db.refresh(sub)
    assert sub.plan_id == pro.id


def test_change_plan_rejects_same_plan(db: Session, independent_user: User, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_fake")
    plan = _make_plan(db, code="same-plan", price="19.00", stripe_price_id="price_same")
    org_id = get_default_organization_id(db, independent_user)
    assert org_id is not None
    _subscribe_stripe(db, org_id=org_id, plan_id=plan.id, provider_subscription_id="sub_same_1")

    svc = BillingService(db)
    from app.modules.billing.service import BillingError
    import pytest

    with pytest.raises(BillingError):
        svc.change_plan(current_user=independent_user, new_plan_id=plan.id)
