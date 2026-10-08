from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus
from app.models.member_role import MemberRole
from app.core.notification_categories import MANDATORY_KEYS, category_for_type, types_for_category
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User


class NotificationsRepository:
    def __init__(self, db: Session):
        self.db = db

    def deliverable_user_ids(self, user_ids: list[int], notification_type: str) -> list[int]:
        """Drops recipients who shouldn't get this notification at all: a
        mandatory category (account/security) always goes through; otherwise
        a user is skipped while their global mute is active or when they've
        switched that category's in-app delivery off. Muted notifications are
        never created (not hidden) — one batched preference lookup, not one
        query per recipient."""
        category = category_for_type(notification_type)
        if category in MANDATORY_KEYS or not user_ids:
            return list(user_ids)
        prefs = {
            p.user_id: p
            for p in self.db.execute(
                select(NotificationPreference).where(NotificationPreference.user_id.in_(user_ids))
            ).scalars()
        }
        now = datetime.now(timezone.utc)
        allowed: list[int] = []
        for uid in user_ids:
            pref = prefs.get(uid)
            if pref is not None:
                if pref.muted_until is not None and pref.muted_until > now:
                    continue
                if (pref.categories or {}).get(category, {}).get("in_app", True) is False:
                    continue
            allowed.append(uid)
        return allowed

    def list_for_user(
        self,
        *,
        user_id: int,
        limit: int,
        offset: int,
        category: str | None = None,
        unread_only: bool = False,
    ) -> tuple[list[Notification], int]:
        base = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            base = base.where(Notification.is_read.is_(False))
        if category:
            known = list(self.db.execute(select(Notification.type).where(Notification.user_id == user_id).distinct()).scalars())
            base = base.where(Notification.type.in_(types_for_category(category, known) or ["__none__"]))
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

    def create_for_user(
        self, *, user_id: int, type: str, title: str, body: str | None, link: str | None,
    ) -> Notification:
        item = Notification(user_id=user_id, type=type, title=title, body=body, link=link)
        if not self.deliverable_user_ids([user_id], type):
            return item  # recipient muted this category — built but never persisted
        self.db.add(item)
        return item

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
    ) -> int:
        """Insert one notification per non-superadmin account — used for
        broadcast events like "new catalog item published" that every
        independent user and every organization member/owner/admin should see.
        Returns the number of recipients notified."""
        superadmin_ids = self._superadmin_user_ids_subquery()
        user_ids = self.deliverable_user_ids(
            list(self.db.execute(select(User.id).where(User.id.notin_(superadmin_ids))).scalars().all()), type,
        )
        for uid in user_ids:
            self.db.add(Notification(user_id=uid, type=type, title=title, body=body, link=link))
        return len(user_ids)

    def bulk_create_for_superadmins(
        self, *, type: str, title: str, body: str | None, link: str | None,
    ) -> None:
        """Insert one notification per super_admin account — used for events the
        platform team should react to (new access request, new suggestion)."""
        user_ids = self.deliverable_user_ids(
            list(self.db.execute(select(User.id).where(User.id.in_(self._superadmin_user_ids_subquery()))).scalars().all()),
            type,
        )
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
        admin_ids = self.org_admin_user_ids(organization_id=organization_id)
        for uid in self.deliverable_user_ids(admin_ids, type):
            self.db.add(Notification(user_id=uid, type=type, title=title, body=body, link=link))
        # True = the org HAS admins (even if some muted it) — callers use
        # False only to fall back to another target when there are none.
        return len(admin_ids) > 0

    def delete_for_user(self, notification_id: int, *, user_id: int) -> bool:
        item = self.db.get(Notification, notification_id)
        if item is None or item.user_id != user_id:
            return False
        self.db.delete(item)
        return True

    def delete_read_for_user(self, *, user_id: int) -> int:
        rows = self.db.execute(
            select(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(True))
        ).scalars().all()
        for row in rows:
            self.db.delete(row)
        return len(rows)

    # --- preferences -------------------------------------------------------

    def get_preference(self, user_id: int) -> NotificationPreference | None:
        return self.db.execute(
            select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        ).scalar_one_or_none()

    def get_or_create_preference(self, user_id: int) -> NotificationPreference:
        pref = self.get_preference(user_id)
        if pref is None:
            pref = NotificationPreference(user_id=user_id, digest_frequency="off", categories={})
            self.db.add(pref)
            self.db.flush()
        return pref
