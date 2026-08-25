from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.email_verification import issue_and_send_verification_email
from app.core.user_anonymize import anonymize_user_pii
from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import OrganizationStatus, SubscriptionStatus, TestRunConclusion, TestRunStatus, UserStatus
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.test_run import TestRun
from app.models.user import User
from app.modules.auth.dependencies import get_default_organization_id, get_user_role_codes
from app.modules.catalog_admin.schemas import CatalogTestRunConclusionCounts, CatalogTestRunStatusCounts
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import (
    UserCreate,
    UserOrganizationMembershipRead,
    UserPlanRead,
    UserPurchaseRecentRead,
    UserStatsRead,
    UserTestRunRecentRead,
    UserUpdate,
)


_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UsersService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UsersRepository(db)

    def _hash_password(self, plain_password: str) -> str:
        return _pwd_context.hash(plain_password)

    def create_user(self, payload: UserCreate) -> User:
        existing = self.repo.get_by_email(str(payload.email))
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        user = User(
            email=str(payload.email),
            password_hash=self._hash_password(payload.plain_password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            display_name=payload.display_name,
            status=UserStatus.active,
            # Same verify-your-email step as self-registration — an admin
            # typing in an email address doesn't confirm the mailbox exists
            # or is spelled correctly, so this account starts unverified too
            # and gets the same confirmation link sent to it.
            email_verified_at=None,
        )
        self.repo.add(user)
        self.db.commit()
        self.db.refresh(user)

        issue_and_send_verification_email(self.db, user)

        return user

    def list_users(self, *, limit: int, offset: int) -> tuple[list[User], int]:
        return self.repo.list(limit=limit, offset=offset)

    def list_users_for_organization(self, *, organization_id: int, limit: int, offset: int) -> tuple[list[User], int]:
        return self.repo.list_by_organization(organization_id=organization_id, limit=limit, offset=offset)

    def get_user(self, user_uuid: UUID) -> User:
        user = self.repo.get_by_uuid(user_uuid)
        if user is None or user.status == UserStatus.deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    def get_user_for_organization(self, user_uuid: UUID, *, organization_id: int) -> User:
        user = self.repo.get_by_uuid_in_organization(user_uuid=user_uuid, organization_id=organization_id)
        if user is None or user.status == UserStatus.deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    def update_user(self, user_uuid: UUID, payload: UserUpdate) -> User:
        user = self.get_user(user_uuid)

        if payload.email is not None and str(payload.email) != user.email:
            existing = self.repo.get_by_email(str(payload.email))
            if existing is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
            user.email = str(payload.email)

        if payload.plain_password is not None:
            user.password_hash = self._hash_password(payload.plain_password)

        if payload.first_name is not None:
            user.first_name = payload.first_name
        if payload.last_name is not None:
            user.last_name = payload.last_name
        if payload.display_name is not None:
            user.display_name = payload.display_name
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url
        if payload.status is not None:
            user.status = payload.status
        if payload.two_factor_enabled is False and user.two_factor_enabled:
            # Support recovery path for a lost authenticator device — see
            # UserUpdate.two_factor_enabled docstring.
            user.two_factor_enabled = False
            user.two_factor_secret = None

        self.db.commit()
        self.db.refresh(user)
        return user

    def soft_delete_user(self, user_uuid: UUID) -> User:
        user = self.get_user(user_uuid)
        user.status = UserStatus.deleted
        anonymize_user_pii(self.db, user)
        self.db.commit()
        self.db.refresh(user)
        return user

    # --- Per-user usage stats (super admin) ---------------------------------
    # Mirrors CatalogAdminService.get_test_stats' shape and query style
    # (totals + status/conclusion breakdown + a short "recent" list), just
    # pivoted onto one user's activity across the whole platform instead of
    # one catalog item's. Used by the super admin's "view this user's own
    # stats" screen — deliberately not exposed to org_owner/org_admin via
    # `users.read`, since it surfaces spend/plan/org-membership details a
    # tenant admin has no business seeing about their own members.

    def get_user_stats(self, user_uuid: UUID) -> UserStatsRead:
        user = self.get_user(user_uuid)

        org_rows = self.db.execute(
            select(Organization, OrganizationMember)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(
                OrganizationMember.user_id == user.id,
                Organization.status != OrganizationStatus.deleted,
                Organization.is_platform_core.is_(False),
            )
            .order_by(Organization.name.asc())
        ).all()
        organizations = [
            UserOrganizationMembershipRead(
                organization_uuid=org.uuid,
                organization_name=org.name,
                organization_type=org.type.value,
                membership_status=member.membership_status.value,
                role_codes=get_user_role_codes(self.db, user_id=user.id, organization_id=org.id),
            )
            for org, member in org_rows
        ]

        # Same "latest active/trialing Subscription on the user's default
        # workspace" resolution as GET /auth/me's plan badge.
        plan = UserPlanRead()
        plan_org_id = get_default_organization_id(self.db, user)
        if plan_org_id is not None:
            plan_row = self.db.execute(
                select(Plan, Subscription.status)
                .join(Subscription, Subscription.plan_id == Plan.id)
                .where(
                    Subscription.organization_id == plan_org_id,
                    Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.trialing]),
                )
                .order_by(Subscription.created_at.desc())
                .limit(1)
            ).first()
            if plan_row is not None:
                plan_obj, sub_status = plan_row
                plan = UserPlanRead(
                    plan_code=plan_obj.code,
                    plan_name=plan_obj.name,
                    plan_name_en=plan_obj.name_en,
                    subscription_status=sub_status.value,
                )

        purchases_total = int(
            self.db.execute(
                select(func.count()).select_from(CatalogPurchase).where(CatalogPurchase.user_id == user.id)
            ).scalar_one()
        )
        purchase_rows = self.db.execute(
            select(CatalogPurchase, CatalogItem)
            .join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
            .where(CatalogPurchase.user_id == user.id)
            .order_by(CatalogPurchase.created_at.desc())
            .limit(10)
        ).all()
        purchases_recent = [
            UserPurchaseRecentRead(
                catalog_item_title=item.title,
                catalog_item_type=item.type.value,
                source=purchase.source,
                purchased_at=purchase.created_at,
            )
            for purchase, item in purchase_rows
        ]

        test_runs_total = int(
            self.db.execute(
                select(func.count()).select_from(TestRun).where(TestRun.user_id == user.id)
            ).scalar_one()
        )

        status_counts = {s.value: 0 for s in TestRunStatus}
        for s_val, n in self.db.execute(
            select(TestRun.status, func.count()).where(TestRun.user_id == user.id).group_by(TestRun.status)
        ).all():
            status_counts[s_val.value if hasattr(s_val, "value") else s_val] = int(n)

        conclusion_counts = {c.value: 0 for c in TestRunConclusion}
        for c_val, n in self.db.execute(
            select(TestRun.conclusion, func.count())
            .where(TestRun.user_id == user.id, TestRun.conclusion.is_not(None))
            .group_by(TestRun.conclusion)
        ).all():
            conclusion_counts[c_val.value if hasattr(c_val, "value") else c_val] = int(n)

        recent_run_rows = self.db.execute(
            select(TestRun, CatalogItem.title)
            .join(CatalogItem, CatalogItem.id == TestRun.catalog_item_id)
            .where(TestRun.user_id == user.id)
            .order_by(TestRun.created_at.desc())
            .limit(10)
        ).all()
        test_runs_recent = [
            UserTestRunRecentRead(
                uuid=run.uuid,
                catalog_item_title=title,
                status=run.status.value,
                conclusion=run.conclusion.value if run.conclusion else None,
                created_at=run.created_at,
            )
            for run, title in recent_run_rows
        ]

        return UserStatsRead(
            user=user,
            loyalty_tier=user.loyalty_tier.value if user.loyalty_tier else None,
            country=user.country,
            plan=plan,
            organizations=organizations,
            purchases_total=purchases_total,
            purchases_recent=purchases_recent,
            test_runs_total=test_runs_total,
            test_runs_by_status=CatalogTestRunStatusCounts(**status_counts),
            test_runs_by_conclusion=CatalogTestRunConclusionCounts(**conclusion_counts),
            test_runs_recent=test_runs_recent,
        )

