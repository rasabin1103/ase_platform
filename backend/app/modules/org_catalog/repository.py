from __future__ import annotations

from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import CatalogItemType
from app.models.member_role import MemberRole
from app.models.organization_catalog_item import OrganizationCatalogItem
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User


class OrganizationCatalogRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_org(self, *, organization_id: int, limit: int, offset: int) -> tuple[list[CatalogItem], int]:
        base = (
            select(CatalogItem)
            .join(OrganizationCatalogItem, OrganizationCatalogItem.catalog_item_id == CatalogItem.id)
            .where(OrganizationCatalogItem.organization_id == organization_id)
        )
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = base.order_by(OrganizationCatalogItem.created_at.desc()).limit(limit).offset(offset)
        return list(self.db.execute(stmt).scalars().all()), total

    def is_associated(self, *, organization_id: int, catalog_item_id: int) -> bool:
        stmt = select(OrganizationCatalogItem).where(
            OrganizationCatalogItem.organization_id == organization_id,
            OrganizationCatalogItem.catalog_item_id == catalog_item_id,
        )
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def associate(self, *, organization_id: int, catalog_item_id: int, added_by_user_id: int) -> bool:
        if self.is_associated(organization_id=organization_id, catalog_item_id=catalog_item_id):
            return False
        self.db.add(
            OrganizationCatalogItem(
                organization_id=organization_id,
                catalog_item_id=catalog_item_id,
                added_by_user_id=added_by_user_id,
            )
        )
        self.db.flush()
        return True

    def remove(self, *, organization_id: int, catalog_item_id: int) -> bool:
        row = self.db.execute(
            select(OrganizationCatalogItem).where(
                OrganizationCatalogItem.organization_id == organization_id,
                OrganizationCatalogItem.catalog_item_id == catalog_item_id,
            )
        ).scalar_one_or_none()
        if row is None:
            return False
        self.db.delete(row)
        self.db.flush()
        return True

    def search_org_members(self, *, organization_id: int, search: str | None, limit: int = 20) -> list[User]:
        """Grant targets are restricted to this organization's own members —
        an org can only gift catalog access to people who actually belong to
        it, not to any independent user platform-wide."""
        not_super_admin = (
            select(MemberRole.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(MemberRole.organization_member_id == OrganizationMember.id, Role.code == "super_admin")
            .exists()
        )
        stmt = (
            select(User)
            .join(OrganizationMember, OrganizationMember.user_id == User.id)
            .where(OrganizationMember.organization_id == organization_id)
            .where(~not_super_admin)
            .distinct()
        )
        if search:
            q = f"%{search}%"
            stmt = stmt.where(or_(User.email.ilike(q), User.display_name.ilike(q)))
        stmt = stmt.order_by(User.email.asc()).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def list_org_members(self, *, organization_id: int) -> list[User]:
        not_super_admin = (
            select(MemberRole.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(MemberRole.organization_member_id == OrganizationMember.id, Role.code == "super_admin")
            .exists()
        )
        stmt = (
            select(User)
            .join(OrganizationMember, OrganizationMember.user_id == User.id)
            .where(OrganizationMember.organization_id == organization_id)
            .where(~not_super_admin)
            .order_by(User.email.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def member_catalog_purchases(self, *, user_ids: list[int]) -> list[tuple[CatalogPurchase, CatalogItem]]:
        if not user_ids:
            return []
        stmt = (
            select(CatalogPurchase, CatalogItem)
            .join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
            .where(CatalogPurchase.user_id.in_(user_ids))
        )
        return [(row[0], row[1]) for row in self.db.execute(stmt).all()]

    def spend_breakdown(self, *, organization_id: int) -> list[tuple[str, Decimal, int]]:
        """(type, total_spend, count) for catalog items this org has paid for via grants."""
        stmt = (
            select(CatalogItem.type, func.sum(CatalogItem.price), func.count(CatalogPurchase.id))
            .join(CatalogPurchase, CatalogPurchase.catalog_item_id == CatalogItem.id)
            .where(CatalogPurchase.organization_id == organization_id)
            .group_by(CatalogItem.type)
        )
        return [(row[0].value, row[1] or Decimal("0"), row[2]) for row in self.db.execute(stmt).all()]

    def associated_catalog_by_type(self, *, organization_id: int) -> list[tuple[str, int]]:
        stmt = (
            select(CatalogItem.type, func.count(OrganizationCatalogItem.id))
            .join(OrganizationCatalogItem, OrganizationCatalogItem.catalog_item_id == CatalogItem.id)
            .where(OrganizationCatalogItem.organization_id == organization_id)
            .group_by(CatalogItem.type)
        )
        return [(row[0].value, row[1]) for row in self.db.execute(stmt).all()]

    def course_recipient_counts(self, *, organization_id: int) -> list[tuple[str, str, int]]:
        stmt = (
            select(CatalogItem.slug, CatalogItem.title, func.count(func.distinct(CatalogPurchase.user_id)))
            .join(CatalogPurchase, CatalogPurchase.catalog_item_id == CatalogItem.id)
            .where(CatalogPurchase.organization_id == organization_id, CatalogItem.type == CatalogItemType.course)
            .group_by(CatalogItem.id, CatalogItem.slug, CatalogItem.title)
            .order_by(func.count(func.distinct(CatalogPurchase.user_id)).desc())
        )
        return [(row[0], row[1], row[2]) for row in self.db.execute(stmt).all()]

    def members_by_role(self, *, organization_id: int) -> list[tuple[str, int]]:
        stmt = (
            select(Role.code, func.count(func.distinct(OrganizationMember.id)))
            .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(OrganizationMember.organization_id == organization_id, Role.code != "super_admin")
            .group_by(Role.code)
        )
        return [(row[0], row[1]) for row in self.db.execute(stmt).all()]
