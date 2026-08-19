from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.creator import ensure_personal_workspace
from app.models.enums import SubscriptionProvider, SubscriptionStatus, UserStatus
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.admin_demo_data.schemas import DemoAccountRead, SeedDemoUsersResponse
from app.modules.auth.security import hash_password
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository

# Fixed, well-known password for every demo account — these are throwaway
# test accounts meant for the super admin to log in as and see what a
# paying user sees, never real customer data. Clearly labeled email domain
# so they're trivially identifiable (and excludable) anywhere in the admin
# panel or in a data export.
DEMO_PASSWORD = "DemoASE-2026!"
DEMO_PAID_ACCOUNTS: tuple[tuple[str, str, str], ...] = (
    # (email, display_name, plan_code)
    ("demo.pro@arcesabinengineering.com", "Demo Usuario Pro", "pro_monthly"),
    ("demo.business@arcesabinengineering.com", "Demo Usuario Business", "business_monthly"),
)
# Independent users with no subscription at all — lets the super admin log
# in and see the private area exactly as a free/unconverted signup does,
# including the "subscribe to a plan" upsell (see ProfilePage's billing
# card and IndependentDashboardPage).
DEMO_FREE_ACCOUNTS: tuple[tuple[str, str], ...] = (
    # (email, display_name)
    ("demo.free@arcesabinengineering.com", "Demo Usuario Independiente"),
)


def _grant_entitlements_for_plan(db: Session, *, user_id: int, organization_id: int, plan: Plan) -> int:
    purchases = CatalogPurchasesRepository(db)
    granted = 0
    for pci in plan.included_catalog_items:
        if purchases.add(user_id, pci.catalog_item_id, organization_id=organization_id, source="plan_entitlement"):
            granted += 1
    return granted


def _get_or_create_demo_user(db: Session, *, email: str, display_name: str) -> tuple[User, bool]:
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    already_existed = user is not None
    if user is None:
        user = User(
            email=email,
            password_hash=hash_password(DEMO_PASSWORD),
            display_name=display_name,
            country="ES",
            status=UserStatus.active,
            # Pre-verified like every other demo account — these are
            # throwaway internal accounts, not real signups, so there's no
            # value in making the super admin click a confirmation email
            # (which, unlike UsersService.create_user's real accounts,
            # doesn't need to prove anything here).
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.flush()
    return user, already_existed


def _seed_demo_paid_account(db: Session, *, email: str, display_name: str, plan_code: str) -> DemoAccountRead | None:
    plan = db.execute(select(Plan).where(Plan.code == plan_code)).scalar_one_or_none()
    if plan is None:
        return None

    user, already_existed = _get_or_create_demo_user(db, email=email, display_name=display_name)
    member = ensure_personal_workspace(db, user_id=user.id)
    db.commit()

    sub = (
        db.execute(
            select(Subscription).where(
                Subscription.organization_id == member.organization_id,
                Subscription.plan_id == plan.id,
            )
        )
        .scalar_one_or_none()
    )
    if sub is None:
        sub = Subscription(
            organization_id=member.organization_id,
            plan_id=plan.id,
            provider=SubscriptionProvider.manual,
            status=SubscriptionStatus.active,
            starts_at=datetime.now(timezone.utc),
        )
        db.add(sub)
    else:
        sub.status = SubscriptionStatus.active
    db.commit()

    granted = _grant_entitlements_for_plan(
        db, user_id=user.id, organization_id=member.organization_id, plan=plan
    )
    db.commit()

    return DemoAccountRead(
        email=email,
        plan_code=plan.code,
        plan_name=plan.name,
        already_existed=already_existed,
        catalog_items_granted=granted,
    )


def _seed_demo_free_account(db: Session, *, email: str, display_name: str) -> DemoAccountRead:
    """Independent user with no subscription and no entitlements — just a
    personal workspace, same as any brand-new free signup."""
    user, already_existed = _get_or_create_demo_user(db, email=email, display_name=display_name)
    ensure_personal_workspace(db, user_id=user.id)
    db.commit()

    return DemoAccountRead(
        email=email,
        plan_code=None,
        plan_name=None,
        already_existed=already_existed,
        catalog_items_granted=0,
    )


def seed_demo_users(db: Session) -> SeedDemoUsersResponse:
    """Idempotent: re-running this only tops up anything missing (a plan
    was added to a demo account, a new catalog item got added to a plan
    since the last run, etc.) — it never duplicates users or subscriptions.
    Uses the exact same building blocks as a real signup + real paid
    subscription (ensure_personal_workspace, the same entitlement-grant
    logic the Stripe webhook uses) so what the super admin sees when
    logging in as a demo account is representative of the real thing.
    Covers both paid accounts (Pro/Business, DEMO_PAID_ACCOUNTS) and plain
    independent accounts with no plan at all (DEMO_FREE_ACCOUNTS), so the
    super admin can preview both the paying and the free/upsell experience."""
    accounts: list[DemoAccountRead] = []

    for email, display_name, plan_code in DEMO_PAID_ACCOUNTS:
        account = _seed_demo_paid_account(db, email=email, display_name=display_name, plan_code=plan_code)
        if account is not None:
            accounts.append(account)

    for email, display_name in DEMO_FREE_ACCOUNTS:
        accounts.append(_seed_demo_free_account(db, email=email, display_name=display_name))

    return SeedDemoUsersResponse(
        accounts=accounts,
        demo_password=DEMO_PASSWORD,
        note=(
            "Inicia sesión con estos emails y la contraseña indicada para ver la plataforma "
            "exactamente como la ve un usuario que ya pagó un plan, o uno que todavía no lo ha hecho."
        ),
    )
