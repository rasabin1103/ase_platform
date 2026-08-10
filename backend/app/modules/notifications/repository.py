from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus
from app.models.member_role import MemberRole
from app.models.notification import Notification
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User


class NotificationsRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, *, user_id: int, limit: int, offset: int) -> tuple[list[Notification], int]:
        base = select(Notification).where(Notification.user_id == user_id)
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = base.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def unread_count(self, *, user_id: int) -> int:
        return int(
            self.db.execute(
                select(func.count())
                .select_from(Notification)
                .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            ).scalar_one()
        )

    def get(self, notification_id: int) -> Notification | None:
        return self.db.get(Notification, notification_id)

    def mark_all_read(self, *, user_id: int) -> None:
        rows = self.db.execute(
            select(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(False))
        ).scalars().all()
        for row in rows:
            row.is_read = True

    @staticmethod
    def _superadmin_user_ids_subquery():
        """Sub-select of user ids holding the super_admin role, resolved via the
        RBAC role tables (MemberRole/Role) — the platform has no boolean
        ``is_superuser`` column on ``users``, super_admin is a role assignment."""
        return (
            select(OrganizationMember.user_id)
            .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(Role.code == "super_admin")
            .distinct()
        )

    def bulk_create_for_all_non_superadmin(
        self, *, type: str, title: str, body: str | None, link: str | None,
    ) -> None:
        """Insert one notification per non-superadmin account — used for
        broadcast events like "new catalog item published" that every
        independent user and every organization member/owner/admin should see."""
        superadmin_ids = self._superadmin_user_ids_subquery()
        user_ids = self.db.execute(select(User.id).where(User.id.notin_(superadmin_ids))).scalars().all()
        for uid in user_ids:
            self.db.add(Notification(user_id=uid, type=type, title=title, body=body, link=link))

    def bulk_create_for_superadmins(
        self, *, type: str, title: str, body: str | None, link: str | None,
    ) -> None:
        """Insert one notification per super_admin account — used for events the
        platform team should react to (new access request, new suggestion)."""
        user_ids = self.db.execute(select(User.id).where(User.id.in_(self._superadmin_user_ids_subquery()))).scalars().all()
        for uid in user_ids:
            self.db.add(Notification(user_id=uid, type=type, title=title, body=body, link=link))

    def org_admin_user_ids(self, *, organization_id: int) -> list[int]:
        """Return the distinct user ids of the org_owner/org_admin members of a
        given organization (active memberships only) — used to route suggestion
        notifications to the right people when a user targets their own org."""
        rows = self.db.execute(
            select(User.id)
            .join(OrganizationMember, OrganizationMember.user_id == User.id)
            .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.membership_status == MembershipStatus.active,
                Role.code.in_(["org_owner", "org_admin"]),
            )
            .distinct()
        ).scalars().all()
        return list(rows)

    def bulk_create_for_org_admins(
        self, *, organization_id: int, type: str, title: str, body: str | None, link: str | None,
    ) -> bool:
        """Insert one notification per org_owner/org_admin of the given
        organization. Returns False (no rows inserted) if the org has no
        owner/admin members, so callers can fall back to another target."""
        user_ids = self.org_admin_user_ids(organization_id=organization_id)
        for uid in user_ids:
            self.db.add(Notification(user_id=uid, type=type, title=title, body=body, link=link))
        return len(user_ids) > 0
