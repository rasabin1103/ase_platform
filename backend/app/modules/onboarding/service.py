from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.enums import MembershipStatus, OrganizationStatus, RoleScope
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.modules.onboarding.repository import OnboardingRepository
from app.modules.onboarding.schemas import OnboardingCreateOrganizationRequest


class OnboardingService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OnboardingRepository(db)

    def create_organization(self, *, user: User, payload: OnboardingCreateOrganizationRequest) -> tuple[Organization, OrganizationMember]:
        if self.repo.slug_exists(payload.organization_slug):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")

        role = self.repo.get_role_by_code("org_owner")
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Required role org_owner does not exist",
            )
        if role.scope != RoleScope.organization:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role org_owner must have organization scope",
            )

        now = datetime.now(timezone.utc)

        org = Organization(
            name=payload.organization_name,
            slug=payload.organization_slug,
            type=payload.organization_type,
            owner_user_id=user.id,
            status=OrganizationStatus.active,
        )
        self.repo.add_organization(org)

        member = OrganizationMember(
            organization_id=org.id,
            user_id=user.id,
            membership_status=MembershipStatus.active,
            joined_at=now,
        )
        self.repo.add_member(member)

        self.repo.add_member_role(
            MemberRole(
                organization_member_id=member.id,
                role_id=role.id,
                assigned_by_user_id=user.id,
            )
        )

        self.repo.add_audit_log(
            AuditLog(
                organization_id=org.id,
                actor_user_id=user.id,
                action="onboarding.create_organization",
                entity_type="organization",
                entity_id=org.id,
                metadata_json={
                    "organization_uuid": str(org.uuid),
                    "organization_slug": org.slug,
                    "organization_type": getattr(org.type, "value", str(org.type)),
                    "role_code": role.code,
                },
            )
        )

        self.db.commit()
        self.db.refresh(org)
        self.db.refresh(member)
        return org, member

