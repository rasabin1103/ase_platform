"""Regression tests for the private-area audit fixes."""

from __future__ import annotations

import pytest

from app.modules.billing.service import _safe_return_path


@pytest.mark.parametrize(
    "value,expected",
    [
        (None, "/pricing"),
        ("/pricing", "/pricing"),
        ("/catalog/course/foo", "/catalog/course/foo"),
        ("//evil.com", "/pricing"),
        ("https://evil.com", "/pricing"),
        ("/\\evil.com", "/pricing"),
        ("/a?x=1", "/pricing"),
        ("/a#frag", "/pricing"),
        ("/" + "a" * 250, "/pricing"),
        ("", "/pricing"),
    ],
)
def test_safe_return_path(value, expected):
    assert _safe_return_path(value) == expected


def test_plan_included_item_grants_access_without_purchase_row(db, independent_user):
    """U01: an item included in the member's live plan is accessible even
    when no plan_entitlement CatalogPurchase row was ever written."""
    from datetime import datetime, timezone
    from decimal import Decimal

    from app.models.catalog_item import CatalogItem
    from app.models.enums import SubscriptionProvider, SubscriptionStatus
    from app.models.plan import Plan
    from app.models.plan_catalog_item import PlanCatalogItem
    from app.models.subscription import Subscription
    from app.modules.auth.dependencies import get_default_organization_id
    from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository

    item = db.query(CatalogItem).first()
    if item is None:
        pytest.skip("no catalog item fixture available")
    plan = Plan(code="u01-plan", name="U01", price=Decimal("9.00"), currency="EUR")
    db.add(plan)
    db.commit()
    db.add(PlanCatalogItem(plan_id=plan.id, catalog_item_id=item.id))
    db.add(
        Subscription(
            organization_id=get_default_organization_id(db, independent_user),
            plan_id=plan.id,
            provider=SubscriptionProvider.manual,
            status=SubscriptionStatus.active,
            starts_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    assert item.slug in CatalogPurchasesRepository(db).slugs_for_user(independent_user.id)
