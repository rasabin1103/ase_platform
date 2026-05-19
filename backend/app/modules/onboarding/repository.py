from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role


class OnboardingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_role_by_code(self, code: str) -> Role | None:
        return self.db.execute(select(Role).where(Role.code == code)).scalar_one_or_none()

    def slug_exists(self, slug: str) -> bool:
        return self.db.execute(select(Organization.id).where(Organization.slug == slug)).scalar_one_or_none() is not None

    def add_organization(self, org: Organization) -> Organization:
        self.db.add(org)
        self.db.flush()
        return org

    def add_member(self, member: OrganizationMember) -> OrganizationMember:
        self.db.add(member)
        self.db.flush()
        return member

    def add_member_role(self, mr: MemberRole) -> MemberRole:
        self.db.add(mr)
        self.db.flush()
        return mr

    def add_audit_log(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.flush()
        return log

