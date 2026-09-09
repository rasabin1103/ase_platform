"""Tests for app.modules.billing — the Stripe checkout/subscription module.

This module had zero test coverage before this file even though it's the
single highest-risk area in the app: real money changes hands through
create_checkout_session/create_catalog_checkout_session, and the webhook
handler is what actually grants access after payment. Every test here mocks
the `stripe` SDK itself (no network calls, no real Stripe account needed) so
the suite stays fast and deterministic — we're testing OUR logic (what we
send Stripe, how we react to what it returns) not Stripe's API.

Follows this suite's Postgres-backed `db`/`client` fixtures from conftest.py
(TEST_DATABASE_URL) rather than the older direct-SessionLocal() style used
by a few pre-existing test files.
"""

from __future__ import annotations

import asyncio
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
import stripe
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.catalog_item import CatalogItem
from app.models.enums import (
    CatalogItemLevel,
    CatalogItemStatus,
    CatalogItemType,
    PlanStatus,
    SubscriptionProvider,
    SubscriptionStatus,
)
from app.models.organization import Organization
from app.models.plan import Plan
from app.models.plan_catalog_item import PlanCatalogItem
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.billing.service import BillingService


class _FakeStripeObject(dict):
    """Minimal stand-in for stripe-python's StripeObject: real Stripe SDK
    responses support both `obj["key"]`/`"key" in obj` (dict-style, used by
    service.py's `_field()` helper) AND `obj.key` (attribute access, used
    directly for things like `session.url` / `customer.id`). A plain dict
    only gives us the first, so tests that need attribute access wrap their
    fake responses in this instead."""

    def __getattr__(self, name: str) -> object:
        try:
            return self[name]
        except KeyError:
            raise AttributeError(name) from None


@pytest.fixture(autouse=True)
def _stripe_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    """Every test in this file exercises the "Stripe is configured" path by
    default — the handful that specifically test the unconfigured-server
    503 override this back to None/empty inside the test itself."""
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_fake")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_fake")


def _get_org(db: Session, user: User) -> Organization:
    return db.execute(select(Organization).where(Organization.owner_user_id == user.id)).scalar_one()


def _make_plan(
    db: Session,
    *,
    status: PlanStatus = PlanStatus.active,
    is_active: bool = True,
    stripe_price_id: str | None = "price_test_123",
) -> Plan:
    plan = Plan(
        code=f"plan-{secrets.token_hex(6)}",
        name="Test Plan",
        price=Decimal("19.00"),
        currency="EUR",
        is_active=is_active,
        status=status,
        stripe_price_id=stripe_price_id,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def _make_catalog_item(
    db: Session,
    *,
    status: CatalogItemStatus = CatalogItemStatus.published,
    price: Decimal | None = Decimal("29.00"),
) -> CatalogItem:
    item = CatalogItem(
        title="Test Product",
        slug=f"test-product-{secrets.token_hex(6)}",
        type=CatalogItemType.product,
        category="testing",
        short_description="Short description",
        long_description="Long description",
        image_url="https://example.com/image.png",
        price=price,
        currency="EUR",
        status=status,
        level=CatalogItemLevel.beginner,
        author="ASE",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _make_subscription(
    db: Session,
    *,
    organization_id: int,
    plan_id: int,
    status: SubscriptionStatus = SubscriptionStatus.active,
    provider_subscription_id: str = "sub_test_123",
    ends_at: datetime | None = None,
) -> Subscription:
    sub = Subscription(
        organization_id=organization_id,
        plan_id=plan_id,
        provider=SubscriptionProvider.stripe,
        provider_subscription_id=provider_subscription_id,
        status=status,
        starts_at=datetime.now(timezone.utc),
        ends_at=ends_at,
        current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


# --- create_checkout_session (subscription plans) --------------------------


def test_checkout_session_created_for_valid_plan(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    plan = _make_plan(db)

    fake_customer = _FakeStripeObject({"id": "cus_test_1"})
    fake_session = _FakeStripeObject({"id": "cs_test_1", "url": "https://checkout.stripe.com/pay/cs_test_1"})
    monkeypatch.setattr(stripe.Customer, "create", lambda **kw: fake_customer)
    monkeypatch.setattr(stripe.checkout.Session, "create", lambda **kw: fake_session)

    res = client.post(
        "/api/v1/billing/checkout-session", json={"plan_id": plan.id}, headers=independent_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["checkout_url"] == "https://checkout.stripe.com/pay/cs_test_1"

    org = _get_org(db, independent_user)
    db.refresh(org)
    assert org.stripe_customer_id == "cus_test_1"


def test_checkout_session_rejects_unknown_plan(client: TestClient, independent_headers: dict[str, str]):
    res = client.post("/api/v1/billing/checkout-session", json={"plan_id": 999999}, headers=independent_headers)
    assert res.status_code == 400
    assert "not found" in res.text.lower()


def test_checkout_session_rejects_inactive_plan(
    db: Session, client: TestClient, independent_headers: dict[str, str],
):
    plan = _make_plan(db, is_active=False)
    res = client.post("/api/v1/billing/checkout-session", json={"plan_id": plan.id}, headers=independent_headers)
    assert res.status_code == 400


def test_checkout_session_rejects_coming_soon_plan(
    db: Session, client: TestClient, independent_headers: dict[str, str],
):
    plan = _make_plan(db, status=PlanStatus.coming_soon)
    res = client.post("/api/v1/billing/checkout-session", json={"plan_id": plan.id}, headers=independent_headers)
    assert res.status_code == 400
    assert "coming soon" in res.text.lower()


def test_checkout_session_rejects_plan_without_stripe_price(
    db: Session, client: TestClient, independent_headers: dict[str, str],
):
    plan = _make_plan(db, stripe_price_id=None)
    res = client.post("/api/v1/billing/checkout-session", json={"plan_id": plan.id}, headers=independent_headers)
    assert res.status_code == 400
    assert "stripe price" in res.text.lower()


def test_checkout_session_fails_when_stripe_not_configured(
    db: Session, client: TestClient, independent_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", None)
    plan = _make_plan(db)
    res = client.post("/api/v1/billing/checkout-session", json={"plan_id": plan.id}, headers=independent_headers)
    assert res.status_code == 503


def test_checkout_session_reuses_existing_stripe_customer(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    """A retrieve() that resolves cleanly (not deleted) should never call
    Customer.create — hitting create for every purchase would spawn a fresh
    Stripe customer record per checkout instead of one per organization."""
    org = _get_org(db, independent_user)
    org.stripe_customer_id = "cus_existing"
    db.commit()

    plan = _make_plan(db)
    create_calls = []
    monkeypatch.setattr(stripe.Customer, "retrieve", lambda cid: _FakeStripeObject({"id": cid, "deleted": False}))
    monkeypatch.setattr(stripe.Customer, "create", lambda **kw: create_calls.append(kw) or _FakeStripeObject({"id": "cus_new"}))
    monkeypatch.setattr(
        stripe.checkout.Session, "create", lambda **kw: _FakeStripeObject({"id": "cs_1", "url": "https://x/y"})
    )

    res = client.post("/api/v1/billing/checkout-session", json={"plan_id": plan.id}, headers=independent_headers)
    assert res.status_code == 200
    assert create_calls == []


def test_checkout_session_mints_new_customer_when_stored_id_is_stale(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    """A stored stripe_customer_id that no longer resolves (test/live key
    mismatch, or deleted in the Stripe Dashboard) must not break checkout —
    the service mints a fresh customer instead of raising."""
    org = _get_org(db, independent_user)
    org.stripe_customer_id = "cus_stale"
    db.commit()

    plan = _make_plan(db)

    def _retrieve(cid):
        raise stripe.InvalidRequestError("No such customer", param="id")

    monkeypatch.setattr(stripe.Customer, "retrieve", _retrieve)
    monkeypatch.setattr(stripe.Customer, "create", lambda **kw: _FakeStripeObject({"id": "cus_fresh"}))
    monkeypatch.setattr(
        stripe.checkout.Session, "create", lambda **kw: _FakeStripeObject({"id": "cs_1", "url": "https://x/y"})
    )

    res = client.post("/api/v1/billing/checkout-session", json={"plan_id": plan.id}, headers=independent_headers)
    assert res.status_code == 200
    org2 = _get_org(db, independent_user)
    assert org2.stripe_customer_id == "cus_fresh"


# --- create_catalog_checkout_session (one-time item purchases) -------------


def test_catalog_checkout_session_created_for_priced_item(
    db: Session, client: TestClient, independent_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch,
):
    item = _make_catalog_item(db)
    monkeypatch.setattr(stripe.Customer, "create", lambda **kw: _FakeStripeObject({"id": "cus_1"}))
    monkeypatch.setattr(
        stripe.checkout.Session,
        "create",
        lambda **kw: _FakeStripeObject({"id": "cs_1", "url": "https://checkout.stripe.com/pay/cs_1"}),
    )

    res = client.post(
        "/api/v1/billing/catalog-checkout-session",
        json={"item_slug": item.slug, "language": "es"},
        headers=independent_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["checkout_url"] == "https://checkout.stripe.com/pay/cs_1"


def test_catalog_checkout_session_rejects_unknown_item(client: TestClient, independent_headers: dict[str, str]):
    res = client.post(
        "/api/v1/billing/catalog-checkout-session",
        json={"item_slug": "does-not-exist"},
        headers=independent_headers,
    )
    assert res.status_code == 400


def test_catalog_checkout_session_rejects_coming_soon_item(
    db: Session, client: TestClient, independent_headers: dict[str, str],
):
    item = _make_catalog_item(db, status=CatalogItemStatus.coming_soon)
    res = client.post(
        "/api/v1/billing/catalog-checkout-session", json={"item_slug": item.slug}, headers=independent_headers,
    )
    assert res.status_code == 400


def test_catalog_checkout_session_rejects_request_only_item(
    db: Session, client: TestClient, independent_headers: dict[str, str],
):
    item = _make_catalog_item(db, status=CatalogItemStatus.request_only)
    res = client.post(
        "/api/v1/billing/catalog-checkout-session", json={"item_slug": item.slug}, headers=independent_headers,
    )
    assert res.status_code == 400
    assert "access request" in res.text.lower()


def test_catalog_checkout_session_rejects_free_item(
    db: Session, client: TestClient, independent_headers: dict[str, str],
):
    item = _make_catalog_item(db, price=None)
    res = client.post(
        "/api/v1/billing/catalog-checkout-session", json={"item_slug": item.slug}, headers=independent_headers,
    )
    assert res.status_code == 400
    assert "free" in res.text.lower()


# --- list_invoices -----------------------------------------------------


def test_list_invoices_empty_when_org_has_no_stripe_customer(client: TestClient, independent_headers: dict[str, str]):
    res = client.get("/api/v1/billing/invoices", headers=independent_headers)
    assert res.status_code == 200
    assert res.json()["items"] == []


def test_list_invoices_returns_empty_list_when_stripe_customer_id_is_stale(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    org = _get_org(db, independent_user)
    org.stripe_customer_id = "cus_stale"
    db.commit()

    def _list(**kw):
        raise stripe.InvalidRequestError("No such customer", param="customer")

    monkeypatch.setattr(stripe.Invoice, "list", _list)
    res = client.get("/api/v1/billing/invoices", headers=independent_headers)
    assert res.status_code == 200
    assert res.json()["items"] == []


def test_list_invoices_reshapes_stripe_response(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    org = _get_org(db, independent_user)
    org.stripe_customer_id = "cus_1"
    db.commit()

    now_ts = int(datetime.now(timezone.utc).timestamp())
    fake_invoice = {
        "id": "in_1",
        "number": "ASE-0001",
        "status": "paid",
        "amount_paid": 1900,
        "currency": "eur",
        "created": now_ts,
        "period_start": now_ts,
        "period_end": now_ts,
        "hosted_invoice_url": "https://invoice.stripe.com/i/in_1",
        "invoice_pdf": "https://invoice.stripe.com/i/in_1.pdf",
        "lines": {"data": [{"description": "Test Plan"}]},
    }
    monkeypatch.setattr(stripe.Invoice, "list", lambda **kw: _FakeStripeObject({"data": [fake_invoice]}))

    res = client.get("/api/v1/billing/invoices", headers=independent_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["amount_paid"] == 19.0
    assert items[0]["currency"] == "EUR"
    assert items[0]["plan_name"] == "Test Plan"


# --- create_portal_session -----------------------------------------------


def test_portal_session_requires_existing_stripe_customer(client: TestClient, independent_headers: dict[str, str]):
    res = client.post("/api/v1/billing/portal-session", headers=independent_headers)
    assert res.status_code == 400
    assert "subscribe" in res.text.lower()


def test_portal_session_created_for_existing_customer(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    org = _get_org(db, independent_user)
    org.stripe_customer_id = "cus_1"
    db.commit()

    monkeypatch.setattr(
        stripe.billing_portal.Session, "create", lambda **kw: _FakeStripeObject({"url": "https://billing.stripe.com/p/1"})
    )
    res = client.post("/api/v1/billing/portal-session", headers=independent_headers)
    assert res.status_code == 200
    assert res.json()["portal_url"] == "https://billing.stripe.com/p/1"


# --- cancel_subscription / resume_subscription -----------------------------


def test_cancel_subscription_requires_active_subscription(client: TestClient, independent_headers: dict[str, str]):
    res = client.post("/api/v1/billing/cancel-subscription", headers=independent_headers)
    assert res.status_code == 400
    assert "no active subscription" in res.text.lower()


def test_cancel_subscription_schedules_cancellation_at_period_end(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    org = _get_org(db, independent_user)
    plan = _make_plan(db)
    sub = _make_subscription(db, organization_id=org.id, plan_id=plan.id)

    cancel_at_ts = int((datetime.now(timezone.utc) + timedelta(days=12)).timestamp())
    monkeypatch.setattr(
        stripe.Subscription, "modify", lambda sub_id, **kw: _FakeStripeObject({"cancel_at": cancel_at_ts})
    )

    res = client.post("/api/v1/billing/cancel-subscription", headers=independent_headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["ends_at"] is not None

    db.refresh(sub)
    assert sub.ends_at is not None


def test_resume_subscription_requires_a_scheduled_cancellation(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
):
    org = _get_org(db, independent_user)
    plan = _make_plan(db)
    _make_subscription(db, organization_id=org.id, plan_id=plan.id, ends_at=None)

    res = client.post("/api/v1/billing/resume-subscription", headers=independent_headers)
    assert res.status_code == 400
    assert "not scheduled" in res.text.lower()


def test_resume_subscription_clears_scheduled_cancellation(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
):
    org = _get_org(db, independent_user)
    plan = _make_plan(db)
    sub = _make_subscription(
        db, organization_id=org.id, plan_id=plan.id, ends_at=datetime.now(timezone.utc) + timedelta(days=5),
    )

    monkeypatch.setattr(stripe.Subscription, "modify", lambda sub_id, **kw: None)
    res = client.post("/api/v1/billing/resume-subscription", headers=independent_headers)
    assert res.status_code == 200, res.text
    assert res.json()["ends_at"] is None

    db.refresh(sub)
    assert sub.ends_at is None


# --- handle_webhook ---------------------------------------------------------
#
# The webhook endpoint has no auth dependency (Stripe calls it directly, see
# router.py's comment), so these hit BillingService.handle_webhook directly
# through a lightweight fake Request rather than going through the real
# HTTP signature dance — stripe.Webhook.construct_event is mocked to hand
# back whatever event dict the test wants, exactly like the other stripe.*
# calls above.
#
# handle_webhook is async (it awaits request.body()), but the test suite has
# no async pytest plugin wired up (no asyncio_mode/anyio config in
# pytest.ini) — rather than take on that dependency just for this one
# module, each test drives the coroutine with plain asyncio.run() from an
# ordinary sync `def test_...`.


class _FakeRequest:
    def __init__(self, body: bytes = b"{}"):
        self._body = body
        self.headers = {"stripe-signature": "t=1,v1=fake"}

    async def body(self) -> bytes:
        return self._body


def _run_webhook(db: Session, event: dict, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(stripe.Webhook, "construct_event", lambda payload, sig, secret: event)
    asyncio.run(BillingService(db).handle_webhook(_FakeRequest()))  # type: ignore[arg-type]


def test_webhook_rejects_invalid_signature(db: Session, monkeypatch: pytest.MonkeyPatch):
    def _raise(*a, **kw):
        raise stripe.SignatureVerificationError("bad sig", sig_header="x")

    monkeypatch.setattr(stripe.Webhook, "construct_event", _raise)
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(BillingService(db).handle_webhook(_FakeRequest()))  # type: ignore[arg-type]
    assert exc_info.value.status_code == 400


def test_webhook_fails_when_secret_not_configured(db: Session, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", None)
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(BillingService(db).handle_webhook(_FakeRequest()))  # type: ignore[arg-type]
    assert exc_info.value.status_code == 503


def test_webhook_checkout_completed_payment_mode_grants_catalog_purchase(
    db: Session, independent_user: User, monkeypatch: pytest.MonkeyPatch,
):
    item = _make_catalog_item(db)
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "mode": "payment",
                "id": "cs_1",
                "metadata": {"catalog_item_id": str(item.id), "user_id": str(independent_user.id)},
            }
        },
    }
    _run_webhook(db, event, monkeypatch)

    from app.models.catalog_purchase import CatalogPurchase

    purchase = db.execute(
        select(CatalogPurchase).where(
            CatalogPurchase.user_id == independent_user.id, CatalogPurchase.catalog_item_id == item.id,
        )
    ).scalar_one()
    assert purchase.source == "stripe_checkout"
    assert purchase.stripe_checkout_session_id == "cs_1"
    assert purchase.permanent_access_granted_at is not None


def test_webhook_checkout_completed_subscription_mode_upserts_subscription(
    db: Session, independent_user: User, monkeypatch: pytest.MonkeyPatch,
):
    org = _get_org(db, independent_user)
    plan = _make_plan(db)
    now_ts = int(datetime.now(timezone.utc).timestamp())

    fake_sub = {
        "id": "sub_new_1",
        "status": "active",
        "metadata": {"organization_id": str(org.id), "plan_id": str(plan.id)},
        "current_period_start": now_ts,
        "current_period_end": now_ts + 2592000,
    }
    monkeypatch.setattr(stripe.Subscription, "retrieve", lambda sub_id: fake_sub)

    event = {
        "type": "checkout.session.completed",
        "data": {"object": {"mode": "subscription", "subscription": "sub_new_1"}},
    }
    _run_webhook(db, event, monkeypatch)

    sub = db.execute(
        select(Subscription).where(Subscription.provider_subscription_id == "sub_new_1")
    ).scalar_one()
    assert sub.status == SubscriptionStatus.active
    assert sub.organization_id == org.id
    assert sub.plan_id == plan.id


def test_webhook_subscription_updated_grants_plan_entitlements_to_active_members(
    db: Session, independent_user: User, monkeypatch: pytest.MonkeyPatch,
):
    """Whatever a plan includes must become accessible to every active
    member of the subscribing organization the moment the subscription
    goes active — this is the core value proposition of a plan purchase,
    so a regression here would silently leave paying customers locked out
    of the content they subscribed for."""
    org = _get_org(db, independent_user)
    plan = _make_plan(db)
    included_item = _make_catalog_item(db)
    db.add(PlanCatalogItem(plan_id=plan.id, catalog_item_id=included_item.id))
    db.commit()

    now_ts = int(datetime.now(timezone.utc).timestamp())
    event = {
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_1",
                "status": "active",
                "metadata": {"organization_id": str(org.id), "plan_id": str(plan.id)},
                "current_period_start": now_ts,
                "current_period_end": now_ts + 2592000,
            }
        },
    }
    _run_webhook(db, event, monkeypatch)

    from app.models.catalog_purchase import CatalogPurchase

    purchase = db.execute(
        select(CatalogPurchase).where(
            CatalogPurchase.user_id == independent_user.id, CatalogPurchase.catalog_item_id == included_item.id,
        )
    ).scalar_one()
    assert purchase.source == "plan_entitlement"
    # Plan-sourced access is live-checked, not permanent — see
    # CatalogPurchase.permanent_access_granted_at's docstring.
    assert purchase.permanent_access_granted_at is None


def test_webhook_subscription_deleted_marks_subscription_canceled(
    db: Session, independent_user: User, monkeypatch: pytest.MonkeyPatch,
):
    org = _get_org(db, independent_user)
    plan = _make_plan(db)
    sub = _make_subscription(db, organization_id=org.id, plan_id=plan.id, provider_subscription_id="sub_del_1")

    event = {"type": "customer.subscription.deleted", "data": {"object": {"id": "sub_del_1"}}}
    _run_webhook(db, event, monkeypatch)

    db.refresh(sub)
    assert sub.status == SubscriptionStatus.canceled
    assert sub.ends_at is not None


def test_webhook_invoice_payment_failed_marks_subscription_past_due(
    db: Session, independent_user: User, monkeypatch: pytest.MonkeyPatch,
):
    org = _get_org(db, independent_user)
    plan = _make_plan(db)
    sub = _make_subscription(db, organization_id=org.id, plan_id=plan.id, provider_subscription_id="sub_pf_1")

    event = {
        "type": "invoice.payment_failed",
        "data": {"object": {"subscription": "sub_pf_1"}},
    }
    _run_webhook(db, event, monkeypatch)

    db.refresh(sub)
    assert sub.status == SubscriptionStatus.past_due


def test_webhook_ignores_unhandled_event_types_without_raising(db: Session, monkeypatch: pytest.MonkeyPatch):
    event = {"type": "customer.created", "data": {"object": {"id": "cus_whatever"}}}
    # Should simply log and return — no exception, no side effect to assert
    # beyond "this didn't blow up".
    _run_webhook(db, event, monkeypatch)
