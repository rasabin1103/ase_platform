from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus
from app.models.enums import OrganizationStatus
from app.models.enums import OrganizationType
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User


class OrganizationsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_uuid(self, organization_uuid: UUID) -> Organization | None:
        stmt = select(Organization).where(Organization.uuid == organization_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_slug(self, slug: str) -> Organization | None:
        stmt = select(Organization).where(Organization.slug == slug)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_owner_by_uuid(self, owner_user_uuid: UUID) -> User | None:
        stmt = select(User).where(User.uuid == owner_user_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, *, limit: int, offset: int, include_suspended: bool = False) -> tuple[list[Organization], int]:
        # Deleted orgs are excluded unconditionally, regardless of
        # `include_suspended` — soft-delete is meant to hide the org from
        # every normal listing permanently (see `soft_delete()`'s
        # docstring), whereas suspension is a reversible state the super
        # admin still needs to see (and act on) via `include_suspended`.
        # Previously both were lumped into the same `include_suspended`
        # flag, so the super-admin listing (which always passes
        # `include_suspended=True` to be able to show/reactivate suspended
        # orgs) also kept showing deleted orgs forever.
        #
        # is_platform_core is excluded unconditionally too — that row (the
        # seed script's "ASE Platform" org) only exists as an anchor for the
        # super_admin's RBAC role assignment, not a real tenant, so it has
        # no business appearing in any admin-facing organization list.
        #
        # `individual`-type orgs are excluded too — every independent user
        # gets one auto-created as their personal workspace (see
        # OrganizationsService / onboarding), it's not a team anyone
        # actually manages. This admin listing is for real multi-member
        # tenants an admin would look at "their org's" data for; the same
        # exclusion already applies to the dashboard's application map (see
        # admin_dashboard.analytics.build_application_map).
        base = select(Organization).where(
            Organization.status != OrganizationStatus.deleted,
            Organization.is_platform_core.is_(False),
            Organization.type != OrganizationType.individual,
        )
        if not include_suspended:
            base = base.where(Organization.status != OrganizationStatus.suspended)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(Organization.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def list_for_user(self, *, user_id: int, limit: int, offset: int) -> tuple[list[Organization], int]:
        base = (
            select(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(
                OrganizationMember.user_id == user_id,
                OrganizationMember.membership_status.in_((MembershipStatus.active, MembershipStatus.invited)),
                Organization.status == OrganizationStatus.active,
            )
        )

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(Organization.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, org: Organization) -> Organization:
        self.db.add(org)
        self.db.flush()
        return org

