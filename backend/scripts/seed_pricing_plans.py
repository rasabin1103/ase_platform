"""Idempotent seed for demo catalog pricing plans."""

from __future__ import annotations

import os
import sys
from decimal import Decimal

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.catalog_item import CatalogItem
from app.models.catalog_pricing_plan import CatalogPricingPlan
from app.models.enums import PricingBillingInterval, PricingPlanType, PricingSupportLevel

DEMO_PLANS: dict[str, list[dict]] = {
    "ase-qa-platform-saas": [
        {
            "name": "Free Preview",
            "slug": "free-preview",
            "plan_type": PricingPlanType.free,
            "billing_interval": PricingBillingInterval.none,
            "price": Decimal("0"),
            "is_default": True,
            "features": ["Read-only sandbox", "1 project", "Community forum"],
            "limitations": ["No CI integrations", "No audit export"],
        },
        {
            "name": "Professional Monthly",
            "slug": "professional-monthly",
            "plan_type": PricingPlanType.subscription,
            "billing_interval": PricingBillingInterval.monthly,
            "price": Decimal("49.00"),
            "trial_days": 14,
            "includes_support": True,
            "support_level": PricingSupportLevel.basic,
            "features": ["Unlimited projects", "RBAC", "CI integrations", "Email support"],
        },
        {
            "name": "Enterprise Quote",
            "slug": "enterprise-quote",
            "plan_type": PricingPlanType.request_quote,
            "billing_interval": PricingBillingInterval.none,
            "price": Decimal("0"),
            "support_level": PricingSupportLevel.enterprise,
            "features": ["SSO", "Dedicated SLA", "Custom contracts"],
        },
    ],
    "playwright-mastery-course": [
        {
            "name": "Standard Access",
            "slug": "standard-access",
            "plan_type": PricingPlanType.one_time,
            "billing_interval": PricingBillingInterval.none,
            "price": Decimal("99.00"),
            "is_default": True,
            "access_duration_days": 365,
            "features": ["Full course videos", "Labs", "Certificate"],
        },
        {
            "name": "Premium Access",
            "slug": "premium-access",
            "plan_type": PricingPlanType.one_time,
            "billing_interval": PricingBillingInterval.none,
            "price": Decimal("129.00"),
            "includes_support": True,
            "support_level": PricingSupportLevel.priority,
            "features": ["Everything in Standard", "1:1 office hours", "Capstone review"],
        },
    ],
    "architecture-patterns-book": [
        {
            "name": "Digital Edition",
            "slug": "digital-edition",
            "plan_type": PricingPlanType.one_time,
            "billing_interval": PricingBillingInterval.none,
            "price": Decimal("24.90"),
            "is_default": True,
            "features": ["PDF + ePub", "Lifetime updates"],
        },
        {
            "name": "Full Bundle",
            "slug": "full-bundle",
            "plan_type": PricingPlanType.lifetime,
            "billing_interval": PricingBillingInterval.none,
            "price": Decimal("34.90"),
            "includes_updates": True,
            "features": ["Print + digital", "Bonus appendix", "Checklists pack"],
        },
    ],
    "ci-pipeline-starter-kit": [
        {
            "name": "Free Download",
            "slug": "free-download",
            "plan_type": PricingPlanType.free,
            "billing_interval": PricingBillingInterval.none,
            "price": Decimal("0"),
            "is_default": True,
            "max_downloads": 3,
            "features": ["Basic workflow templates", "Docs"],
        },
        {
            "name": "Professional Template Pack",
            "slug": "professional-template-pack",
            "plan_type": PricingPlanType.one_time,
            "billing_interval": PricingBillingInterval.none,
            "price": Decimal("19.00"),
            "features": ["Full workflow suite", "Security scanning job", "Upgrade guide"],
        },
    ],
}


def main() -> None:
    db = SessionLocal()
    try:
        created = 0
        for item_slug, specs in DEMO_PLANS.items():
            item = db.execute(select(CatalogItem).where(CatalogItem.slug == item_slug)).scalar_one_or_none()
            if item is None:
                print(f"Skip {item_slug}: catalog item missing (run seed_consumer_catalog first)")
                continue
            for spec in specs:
                slug = spec["slug"]
                exists = db.execute(
                    select(CatalogPricingPlan).where(
                        CatalogPricingPlan.catalog_item_id == item.id,
                        CatalogPricingPlan.slug == slug,
                    )
                ).scalar_one_or_none()
                if exists:
                    continue
                plan = CatalogPricingPlan(
                    catalog_item_id=item.id,
                    name=spec["name"],
                    slug=slug,
                    description=spec.get("description"),
                    plan_type=spec["plan_type"],
                    billing_interval=spec.get("billing_interval", PricingBillingInterval.none),
                    price=spec.get("price", Decimal("0")),
                    currency="EUR",
                    trial_days=spec.get("trial_days"),
                    setup_fee=spec.get("setup_fee"),
                    is_active=True,
                    is_default=spec.get("is_default", False),
                    max_users=spec.get("max_users"),
                    max_downloads=spec.get("max_downloads"),
                    access_duration_days=spec.get("access_duration_days"),
                    includes_updates=spec.get("includes_updates", False),
                    includes_support=spec.get("includes_support", False),
                    support_level=spec.get("support_level", PricingSupportLevel.none),
                    features=spec.get("features", []),
                    limitations=spec.get("limitations", []),
                )
                db.add(plan)
                created += 1
        db.commit()
        print(f"Pricing plans seed done. Created {created} plan(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
