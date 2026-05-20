from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status

from app.models.enums import PricingBillingInterval, PricingPlanType


def validate_pricing_plan_fields(
    *,
    plan_type: PricingPlanType,
    billing_interval: PricingBillingInterval,
    price: Decimal,
) -> None:
    if price < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="price must be >= 0")
    if plan_type == PricingPlanType.free and price != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free plans must have price 0",
        )
    if plan_type == PricingPlanType.subscription and billing_interval == PricingBillingInterval.none:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription plans require a billing interval",
        )
    if plan_type in (PricingPlanType.one_time, PricingPlanType.lifetime) and billing_interval != PricingBillingInterval.none:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One-time and lifetime plans must use billing_interval none",
        )
    if plan_type in (PricingPlanType.free, PricingPlanType.request_quote) and billing_interval != PricingBillingInterval.none:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free and request_quote plans must use billing_interval none",
        )
