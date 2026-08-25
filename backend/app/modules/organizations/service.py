from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus, OrganizationStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.modules.organizations.repository import OrganizationsRepository
from app.modules.organizations.schemas import OrganizationCreate, OrganizationUpdate


class OrganizationsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrganizationsRepository(db)

    def _would_orphan_a_super_admin(self, organization_id: int) -> bool:
        """True if deleting/suspending this organization would leave any of
        its super_admin-role members with zero *other* active organizations.

        RBAC in this codebase resolves every role — including super_admin —
        through an OrganizationMember row, and `get_default_organization_id`
        (the login-time "which workspace is mine" lookup) only ever
        considers *active* organizations. A super_admin whose only active
        org gets suspended/deleted can no longer resolve a default
        workspace at all and gets bounced to onboarding despite being a
        platform admin — this is exactly the lockout that happened when the
        demo "Acme Demo Enterprise" org (holding the real super_admin's only
        membership) was deleted. Blocking that transition here is cheaper
        and safer than trying to recover from it after the fact."""
        admin_user_ids = self.db.execute(
            select(OrganizationMember.user_id)
            .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.membership_status == MembershipStatus.active,
                Role.code == "super_admin",
            )
        ).scalars().all()

        for user_id in admin_user_ids:
            other_active = self.db.execute(
                select(func.count())
                .select_from(OrganizationMember)
                .join(Organization, Organization.id == OrganizationMember.organization_id)
                .where(
                    OrganizationMember.user_id == user_id,
                    OrganizationMember.organization_id != organization_id,
                    OrganizationMember.membership_status == MembershipStatus.active,
                    Organization.status == OrganizationStatus.active,
                )
            ).scalar_one()
            if other_active == 0:
                return True
        return False

    def create(self, payload: OrganizationCreate) -> Organization:
        if self.repo.get_by_slug(payload.slug) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")

        owner = self.repo.get_owner_by_uuid(payload.owner_user_uuid)
        if owner is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner user not found")

        org = Organization(
            name=payload.name,
            slug=payload.slug,
            type=payload.type,
            owner_user_id=owner.id,
            status=OrganizationStatus.active,
        )

        self.repo.add(org)
        self.db.commit()
        self.db.refresh(org)
        return org

    def list(self, *, limit: int, offset: int, include_suspended: bool = False) -> tuple[list[Organization], int]:
        return self.repo.list(limit=limit, offset=offset, include_suspended=include_suspended)

    def list_for_user(self, *, user_id: int, limit: int, offset: int) -> tuple[list[Organization], int]:
        return self.repo.list_for_user(user_id=user_id, limit=limit, offset=offset)

    def get(self, organization_uuid: UUID) -> Organization:
        org = self.repo.get_by_uuid(organization_uuid)
        if org is None or org.status in (OrganizationStatus.suspended, OrganizationStatus.deleted):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        return org

    def get_for_admin(self, organization_uuid: UUID) -> Organization:
        """Same lookup as `get()` but never hides suspended/deleted orgs —
        used by the admin mutation endpoints (update/deactivate/reactivate/
        delete). `get()` hiding suspended orgs is correct for normal reads,
        but was previously reused inside `update()` too, which made it
        impossible to ever reactivate an org: the moment it was suspended,
        the very endpoint meant to flip it back to active would 404 before
        even loading the row."""
        org = self.repo.get_by_uuid(organization_uuid)
        if org is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        return org

    def update(self, organization_uuid: UUID, payload: OrganizationUpdate) -> Organization:
        org = self.get_for_admin(organization_uuid)

        if payload.slug is not None and payload.slug != org.slug:
            if self.repo.get_by_slug(payload.slug) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")
            org.slug = payload.slug

        if payload.name is not None:
            org.name = payload.name
        if payload.type is not None:
            org.type = payload.type
        if payload.status is not None:
            if payload.status != OrganizationStatus.active and self._would_orphan_a_super_admin(org.id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Cannot suspend or delete this organization — it is the only active organization for a "
                        "super_admin, who would be locked out of their own workspace."
                    ),
                )
            org.status = payload.status

        if payload.owner_user_uuid is not None:
            owner = self.repo.get_owner_by_uuid(payload.owner_user_uuid)
            if owner is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner user not found")
            org.owner_user_id = owner.id

        if payload.newsletter_subscribed is not None:
            org.newsletter_subscribed = payload.newsletter_subscribed

        self.db.commit()
        self.db.refresh(org)
        return org

    def soft_delete(self, organization_uuid: UUID) -> Organization:
        """Distinct from suspending: this is the "borrar" action — sets
        status to `deleted` (hidden from every normal listing, but the row
        and its data survive for referential integrity, same soft-delete
        philosophy as user deletion). Suspending/reactivating an org is a
        separate, reversible action — see `update()` with
        `status=suspended`/`status=active`."""
        org = self.get_for_admin(organization_uuid)
        if self._would_orphan_a_super_admin(org.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Cannot delete this organization — it is the only active organization for a super_admin, "
                    "who would be locked out of their own workspace."
                ),
            )
        org.status = OrganizationStatus.deleted
        self.db.commit()
        self.db.refresh(org)
        return org

