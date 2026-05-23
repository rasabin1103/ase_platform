"""Tests for public pricing display (sort, annual discount, consolidation)."""

from __future__ import annotations

from decimal import Decimal

from app.models.catalog_pricing_plan import CatalogPricingPlan
from app.models.enums import PricingBillingInterval, PricingPlanType, PricingSupportLevel
from app.modules.pricing.pricing_display import (
    consolidate_public_plans,
    merge_plan_group,
    resolve_annual_price,
    resolve_monthly_price,
    sort_public_tiers,
)


def _plan(
    *,
    id: int,
    slug: str,
    name: str,
    price: str,
    billing_interval=PricingBillingInterval.monthly,
    plan_type=PricingPlanType.subscription,
    order_index: int | None = None,
    is_popular: bool = False,
    monthly_price: str | None = None,
    annual_price: str | None = None,
) -> CatalogPricingPlan:
    return CatalogPricingPlan(
        id=id,
        catalog_item_id=None,
        scope_catalog_types=[],
        scope_categories=[],
        name=name,
        slug=slug,
        plan_type=plan_type,
        billing_interval=billing_interval,
        price=Decimal(price),
        currency="EUR",
        is_active=True,
        is_default=False,
        is_popular=is_popular,
        order_index=order_index,
        monthly_price=Decimal(monthly_price) if monthly_price else None,
        annual_price=Decimal(annual_price) if annual_price else None,
        includes_updates=False,
        includes_support=False,
        support_level=PricingSupportLevel.none,
        features=["Feature A"],
    )


def test_annual_price_applies_ten_percent_discount():
    plan = _plan(id=1, slug="pro-monthly", name="Professional Monthly", price="79.00")
    monthly = resolve_monthly_price(plan)
    annual = resolve_annual_price(plan, monthly)
    assert monthly == Decimal("79.00")
    assert annual == Decimal("853.20")


def test_sort_plans_cheapest_to_most_expensive():
    starter = _plan(id=1, slug="starter", name="Starter", price="19.00", order_index=1)
    pro = _plan(id=2, slug="professional", name="Professional", price="79.00", order_index=2, is_popular=True)
    enterprise = _plan(id=3, slug="enterprise", name="Enterprise", price="199.00", order_index=3)
    tiers = sort_public_tiers(consolidate_public_plans([enterprise, pro, starter]))
    names = [t.primary.name for t in tiers]
    assert names == ["Starter", "Professional", "Enterprise"]


def test_merge_monthly_and_yearly_subscription_rows():
    monthly = _plan(id=1, slug="pro-monthly", name="Professional Monthly", price="49.00")
    yearly = _plan(
        id=2,
        slug="pro-yearly",
        name="Professional Yearly",
        price="529.20",
        billing_interval=PricingBillingInterval.yearly,
    )
    merged = merge_plan_group([monthly, yearly])
    assert merged.monthly_price == Decimal("49.00")
    assert merged.annual_price == Decimal("529.20")
    assert merged.primary.slug == "pro-monthly"


def test_popular_flag_from_is_popular():
    plan = _plan(id=1, slug="pro", name="Professional", price="79.00", is_popular=True)
    tier = merge_plan_group([plan])
    assert tier.is_popular is True
