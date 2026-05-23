"""Monthly/annual pricing math, formatting, and tier consolidation for public API."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP

from app.models.catalog_pricing_plan import CatalogPricingPlan
from app.models.enums import PricingBillingInterval, PricingPlanType

ANNUAL_DISCOUNT_PERCENTAGE = Decimal("10")
_ANNUAL_MULTIPLIER = Decimal("0.9")
_TWOPLACES = Decimal("0.01")

_SLUG_SUFFIXES = ("-monthly", "-yearly", "-quarterly", "-annual")
_NAME_SUFFIXES = (" Monthly", " Yearly", " Quarterly", " Annual")


def round_money(value: Decimal) -> Decimal:
    return value.quantize(_TWOPLACES, rounding=ROUND_HALF_UP)


def format_price_amount(price: Decimal | None, currency: str) -> str:
    if price is None:
        return ""
    amount = float(price)
    if amount == 0:
        return "0"
    return f"{amount:.2f}"


def formatted_price(price: Decimal | None, currency: str) -> str:
    if price is None:
        return ""
    amount = float(price)
    symbol = {"EUR": "€", "USD": "$", "GBP": "£"}.get(currency.upper(), currency.upper())
    if currency.upper() == "EUR":
        return f"{amount:.2f}€"
    return f"{symbol}{amount:,.2f}"


def tier_slug(plan: CatalogPricingPlan) -> str:
    slug = plan.slug.lower().strip()
    for suffix in _SLUG_SUFFIXES:
        if slug.endswith(suffix):
            return slug[: -len(suffix)]
    return slug


def display_plan_name(name: str) -> str:
    for suffix in _NAME_SUFFIXES:
        if name.endswith(suffix):
            return name[: -len(suffix)].strip()
    return name.strip()


def _price_from_plan(plan: CatalogPricingPlan) -> Decimal:
    return round_money(Decimal(str(plan.price)))


def resolve_monthly_price(plan: CatalogPricingPlan) -> Decimal | None:
    if plan.monthly_price is not None:
        return round_money(Decimal(str(plan.monthly_price)))
    if plan.plan_type != PricingPlanType.subscription:
        if plan.plan_type in (PricingPlanType.free, PricingPlanType.request_quote):
            return round_money(Decimal("0"))
        return _price_from_plan(plan)
    interval = plan.billing_interval
    price = _price_from_plan(plan)
    if interval == PricingBillingInterval.monthly:
        return price
    if interval == PricingBillingInterval.quarterly:
        return round_money(price / Decimal("3"))
    if interval == PricingBillingInterval.yearly:
        return round_money(price / Decimal("12"))
    return price


def resolve_annual_price(plan: CatalogPricingPlan, monthly: Decimal | None) -> Decimal | None:
    if plan.annual_price is not None:
        return round_money(Decimal(str(plan.annual_price)))
    if plan.plan_type != PricingPlanType.subscription:
        return None
    if plan.billing_interval == PricingBillingInterval.yearly:
        return _price_from_plan(plan)
    if monthly is None:
        return None
    return round_money(monthly * Decimal("12") * _ANNUAL_MULTIPLIER)


def annual_savings_amount(monthly: Decimal | None, annual: Decimal | None) -> Decimal | None:
    if monthly is None or annual is None:
        return None
    full_year = round_money(monthly * Decimal("12"))
    if full_year <= annual:
        return round_money(Decimal("0"))
    return round_money(full_year - annual)


def tier_group_key(plan: CatalogPricingPlan) -> str:
    item_part = str(plan.catalog_item_id) if plan.catalog_item_id is not None else "platform"
    return f"{item_part}:{tier_slug(plan)}"


@dataclass
class MergedPublicTier:
    primary: CatalogPricingPlan
    monthly_price: Decimal | None = None
    annual_price: Decimal | None = None
    is_popular: bool = False
    order_index: int | None = None
    features: list[str] = field(default_factory=list)
    limitations: list[str] = field(default_factory=list)


def merge_plan_group(plans: list[CatalogPricingPlan]) -> MergedPublicTier:
    plans = sorted(plans, key=lambda p: p.id)
    primary = next((p for p in plans if p.billing_interval == PricingBillingInterval.monthly), plans[0])
    monthly: Decimal | None = None
    annual: Decimal | None = None
    for plan in plans:
        m = resolve_monthly_price(plan)
        if monthly is None and m is not None:
            monthly = m
        a = resolve_annual_price(plan, m or monthly)
        if annual is None and a is not None:
            annual = a
    if monthly is not None and annual is None and primary.plan_type == PricingPlanType.subscription:
        annual = resolve_annual_price(primary, monthly)
    if monthly is None:
        monthly = resolve_monthly_price(primary)
    if annual is None:
        annual = resolve_annual_price(primary, monthly)

    features: list[str] = []
    for plan in plans:
        for feat in list(plan.features or []):
            if feat and feat not in features:
                features.append(str(feat))

    limitations: list[str] = []
    for plan in plans:
        for lim in list(plan.limitations or []):
            if lim and lim not in limitations:
                limitations.append(str(lim))

    order_candidates = [p.order_index for p in plans if p.order_index is not None]
    return MergedPublicTier(
        primary=primary,
        monthly_price=monthly,
        annual_price=annual,
        is_popular=any(p.is_popular or p.is_default for p in plans),
        order_index=min(order_candidates) if order_candidates else None,
        features=features or list(primary.features or []),
        limitations=limitations or list(primary.limitations or []),
    )


def consolidate_public_plans(plans: list[CatalogPricingPlan]) -> list[MergedPublicTier]:
    groups: dict[str, list[CatalogPricingPlan]] = {}
    for plan in plans:
        if plan.plan_type == PricingPlanType.subscription:
            key = tier_group_key(plan)
            groups.setdefault(key, []).append(plan)
        else:
            groups[f"solo:{plan.id}"] = [plan]

    merged = [merge_plan_group(group) for group in groups.values()]
    return sort_public_tiers(merged)


def sort_public_tiers(tiers: list[MergedPublicTier]) -> list[MergedPublicTier]:
    def sort_key(t: MergedPublicTier) -> tuple:
        order = t.order_index if t.order_index is not None else 1_000_000
        monthly = t.monthly_price if t.monthly_price is not None else Decimal("999999999")
        return (order, monthly, t.primary.id)

    return sorted(tiers, key=sort_key)


def build_public_pricing_fields(tier: MergedPublicTier) -> dict:
    plan = tier.primary
    monthly = tier.monthly_price
    annual = tier.annual_price
    savings = annual_savings_amount(monthly, annual)
    currency = plan.currency or "EUR"
    return {
        "monthlyPrice": monthly,
        "annualPrice": annual,
        "annualDiscountPercentage": int(ANNUAL_DISCOUNT_PERCENTAGE),
        "annualSavingsAmount": savings,
        "formattedMonthlyPrice": formatted_price(monthly, currency) if monthly is not None else "",
        "formattedAnnualPrice": formatted_price(annual, currency) if annual is not None else "",
        "isPopular": tier.is_popular,
        "orderIndex": tier.order_index,
        "displayName": display_plan_name(plan.name),
        "features": tier.features,
        "limitations": tier.limitations,
    }
