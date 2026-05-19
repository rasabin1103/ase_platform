from __future__ import annotations

"""
Idempotent demo seed for subscriptions.

Rules:
- Does NOT delete existing data.
- Creates demo organizations if missing (by slug); new orgs use the lowest ``users.id`` as ``owner_user_id``.
- Uses existing plans by code (must exist) and errors clearly if missing.
- Inserts demo subscriptions only if an identical (org, plan, provider) record doesn't exist yet.
"""

import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.core.database import SessionLocal
from app.models.enums import OrganizationStatus, OrganizationType, SubscriptionProvider, SubscriptionStatus
from app.models.organization import Organization
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User


@dataclass(frozen=True)
class DemoSubSpec:
    org_name: str
    org_slug: str
    org_type: OrganizationType
    plan_code: str
    provider: SubscriptionProvider
    status: SubscriptionStatus


DEMO: list[DemoSubSpec] = [
    DemoSubSpec(
        org_name="Acme Corporation",
        org_slug="acme-corporation",
        org_type=OrganizationType.business,
        plan_code="pro_monthly",
        provider=SubscriptionProvider.manual,
        status=SubscriptionStatus.active,
    ),
    DemoSubSpec(
        org_name="Globex Solutions",
        org_slug="globex-solutions",
        org_type=OrganizationType.business,
        plan_code="business_monthly",
        provider=SubscriptionProvider.stripe,
        status=SubscriptionStatus.active,
    ),
    DemoSubSpec(
        org_name="Initech",
        org_slug="initech",
        org_type=OrganizationType.business,
        plan_code="pro_monthly",
        provider=SubscriptionProvider.manual,
        status=SubscriptionStatus.trialing,
    ),
    DemoSubSpec(
        org_name="Soylent Corp",
        org_slug="soylent-corp",
        org_type=OrganizationType.enterprise,
        plan_code="enterprise_monthly",
        provider=SubscriptionProvider.stripe,
        status=SubscriptionStatus.active,
    ),
    DemoSubSpec(
        org_name="Umbrella Corp",
        org_slug="umbrella-corp",
        org_type=OrganizationType.enterprise,
        plan_code="business_monthly",
        provider=SubscriptionProvider.manual,
        status=SubscriptionStatus.canceled,
    ),
]


def _first_user_id(db: Session) -> int:
    """Organizations require ``owner_user_id``. Use the first user in the DB as demo owner."""
    uid = db.execute(select(User.id).order_by(User.id.asc()).limit(1)).scalar_one_or_none()
    if uid is None:
        raise RuntimeError("No users found in the database. Register/login once to create a user, then re-run this seed.")
    return int(uid)


def _get_or_create_org(db: Session, *, name: str, slug: str, org_type: OrganizationType, owner_user_id: int) -> Organization:
    org = db.execute(select(Organization).where(Organization.slug == slug)).scalar_one_or_none()
    if org is not None:
        return org
    org = Organization(
        name=name,
        slug=slug,
        type=org_type,
        owner_user_id=owner_user_id,
        status=OrganizationStatus.active,
    )
    db.add(org)
    db.flush()
    return org


def _get_plan_by_code(db: Session, code: str) -> Plan | None:
    return db.execute(select(Plan).where(Plan.code == code)).scalar_one_or_none()


def _subscription_exists(db: Session, *, org_id: int, plan_id: int, provider: SubscriptionProvider) -> bool:
    stmt = (
        select(Subscription.id)
        .where(Subscription.organization_id == org_id)
        .where(Subscription.plan_id == plan_id)
        .where(Subscription.provider == provider)
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none() is not None


def seed_demo_subscriptions(db: Session, specs: Iterable[DemoSubSpec]) -> int:
    now = datetime.now(timezone.utc)
    created = 0
    owner_user_id = _first_user_id(db)

    # Validate required plans exist first (clear error).
    required_plan_codes = sorted({s.plan_code for s in specs})
    missing = [c for c in required_plan_codes if _get_plan_by_code(db, c) is None]
    if missing:
        raise RuntimeError(
            "Missing plans required by demo seed: "
            + ", ".join(missing)
            + ". Run scripts/seed_initial_data.py first or create these plans."
        )

    for i, spec in enumerate(specs):
        org = _get_or_create_org(db, name=spec.org_name, slug=spec.org_slug, org_type=spec.org_type, owner_user_id=owner_user_id)
        plan = _get_plan_by_code(db, spec.plan_code)
        assert plan is not None

        if _subscription_exists(db, org_id=org.id, plan_id=plan.id, provider=spec.provider):
            continue

        # Stagger timelines slightly for nicer dashboards.
        starts_at = now - timedelta(days=14 + i * 3)
        trial_ends_at = (now + timedelta(days=7 - i)) if spec.status == SubscriptionStatus.trialing else None
        ends_at = None
        if spec.status in (SubscriptionStatus.canceled, SubscriptionStatus.expired):
            ends_at = now - timedelta(days=1 + i)
        elif spec.status == SubscriptionStatus.active:
            ends_at = now + timedelta(days=10 + i * 5)

        sub = Subscription(
            organization_id=org.id,
            plan_id=plan.id,
            provider=spec.provider,
            provider_subscription_id=f"demo_{spec.provider.value}_{org.slug}_{plan.code}",
            status=spec.status,
            starts_at=starts_at,
            ends_at=ends_at,
            trial_ends_at=trial_ends_at,
        )
        db.add(sub)
        db.flush()
        created += 1

    return created


def main() -> None:
    db = SessionLocal()
    try:
        created = seed_demo_subscriptions(db, DEMO)
        db.commit()
        print(f"Demo subscriptions seed completed. created={created}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

