from __future__ import annotations

import re
from decimal import Decimal

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.catalog_pricing_plan import CatalogPricingPlan
from app.models.enums import CatalogItemStatus, PricingBillingInterval, PricingPlanType, PricingSupportLevel

PUBLIC_CATALOG_STATUSES = (
    CatalogItemStatus.published,
    CatalogItemStatus.coming_soon,
    CatalogItemStatus.request_only,
)


def slugify_name(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:160] or "plan"


class PricingPlansRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_catalog_item(self, catalog_item_id: int) -> CatalogItem | None:
        return self.db.get(CatalogItem, catalog_item_id)

    def get_plan(self, plan_id: int) -> CatalogPricingPlan | None:
        return self.db.get(CatalogPricingPlan, plan_id)

    def list_all(
        self,
        *,
        limit: int,
        offset: int,
        catalog_item_id: int | None = None,
        plan_type: PricingPlanType | None = None,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[tuple[CatalogPricingPlan, CatalogItem]], int]:
        base = (
            select(CatalogPricingPlan, CatalogItem)
            .join(CatalogItem, CatalogItem.id == CatalogPricingPlan.catalog_item_id)
            .order_by(
                CatalogItem.title.asc(),
                CatalogPricingPlan.is_default.desc(),
                CatalogPricingPlan.price.asc(),
                CatalogPricingPlan.created_at.desc(),
            )
        )
        if catalog_item_id is not None:
            base = base.where(CatalogPricingPlan.catalog_item_id == catalog_item_id)
        if plan_type is not None:
            base = base.where(CatalogPricingPlan.plan_type == plan_type)
        if is_active is not None:
            base = base.where(CatalogPricingPlan.is_active.is_(is_active))
        if search:
            q = f"%{search.strip()}%"
            base = base.where(
                or_(
                    CatalogPricingPlan.name.ilike(q),
                    CatalogPricingPlan.slug.ilike(q),
                    CatalogItem.title.ilike(q),
                    CatalogItem.slug.ilike(q),
                )
            )
        total = int(self.db.scalar(select(func.count()).select_from(base.subquery())) or 0)
        rows = self.db.execute(base.limit(limit).offset(offset)).all()
        return [(plan, item) for plan, item in rows], total

    def list_public_active(
        self,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[tuple[CatalogPricingPlan, CatalogItem]], int]:
        base = (
            select(CatalogPricingPlan, CatalogItem)
            .join(CatalogItem, CatalogItem.id == CatalogPricingPlan.catalog_item_id)
            .where(
                CatalogPricingPlan.is_active.is_(True),
                CatalogItem.status.in_(PUBLIC_CATALOG_STATUSES),
            )
            .order_by(
                CatalogItem.title.asc(),
                CatalogPricingPlan.is_default.desc(),
                CatalogPricingPlan.price.asc(),
                CatalogPricingPlan.created_at.desc(),
            )
        )
        total = int(self.db.scalar(select(func.count()).select_from(base.subquery())) or 0)
        rows = self.db.execute(base.limit(limit).offset(offset)).all()
        return [(plan, item) for plan, item in rows], total

    def list_for_item(self, catalog_item_id: int) -> list[CatalogPricingPlan]:
        stmt = (
            select(CatalogPricingPlan)
            .where(CatalogPricingPlan.catalog_item_id == catalog_item_id)
            .order_by(
                CatalogPricingPlan.is_default.desc(),
                CatalogPricingPlan.price.asc(),
                CatalogPricingPlan.created_at.desc(),
            )
        )
        return list(self.db.scalars(stmt).all())

    def list_active_for_item(self, catalog_item_id: int) -> list[CatalogPricingPlan]:
        stmt = (
            select(CatalogPricingPlan)
            .where(
                CatalogPricingPlan.catalog_item_id == catalog_item_id,
                CatalogPricingPlan.is_active.is_(True),
            )
            .order_by(
                CatalogPricingPlan.is_default.desc(),
                CatalogPricingPlan.price.asc(),
                CatalogPricingPlan.created_at.desc(),
            )
        )
        return list(self.db.scalars(stmt).all())

    def slug_exists(self, catalog_item_id: int, slug: str, *, exclude_plan_id: int | None = None) -> bool:
        stmt = select(CatalogPricingPlan.id).where(
            CatalogPricingPlan.catalog_item_id == catalog_item_id,
            CatalogPricingPlan.slug == slug,
        )
        if exclude_plan_id is not None:
            stmt = stmt.where(CatalogPricingPlan.id != exclude_plan_id)
        return self.db.scalar(stmt) is not None

    def count_active_for_item(self, catalog_item_id: int, *, exclude_plan_id: int | None = None) -> int:
        stmt = select(func.count()).select_from(CatalogPricingPlan).where(
            CatalogPricingPlan.catalog_item_id == catalog_item_id,
            CatalogPricingPlan.is_active.is_(True),
        )
        if exclude_plan_id is not None:
            stmt = stmt.where(CatalogPricingPlan.id != exclude_plan_id)
        return int(self.db.scalar(stmt) or 0)

    def clear_default_for_item(self, catalog_item_id: int, *, except_plan_id: int | None = None) -> None:
        stmt = (
            update(CatalogPricingPlan)
            .where(CatalogPricingPlan.catalog_item_id == catalog_item_id, CatalogPricingPlan.is_default.is_(True))
            .values(is_default=False)
        )
        if except_plan_id is not None:
            stmt = stmt.where(CatalogPricingPlan.id != except_plan_id)
        self.db.execute(stmt)

    def create_plan(
        self,
        *,
        catalog_item_id: int,
        name: str,
        slug: str,
        description: str | None,
        plan_type: PricingPlanType,
        billing_interval: PricingBillingInterval,
        price: Decimal,
        currency: str,
        trial_days: int | None,
        setup_fee: Decimal | None,
        discount_percentage: Decimal | None,
        is_active: bool,
        is_default: bool,
        max_users: int | None,
        max_downloads: int | None,
        access_duration_days: int | None,
        includes_updates: bool,
        includes_support: bool,
        support_level: PricingSupportLevel,
        features: list[str] | None,
        limitations: list[str] | None,
    ) -> CatalogPricingPlan:
        plan = CatalogPricingPlan(
            catalog_item_id=catalog_item_id,
            name=name,
            slug=slug,
            description=description,
            plan_type=plan_type,
            billing_interval=billing_interval,
            price=price,
            currency=currency.upper(),
            trial_days=trial_days,
            setup_fee=setup_fee,
            discount_percentage=discount_percentage,
            is_active=is_active,
            is_default=is_default,
            max_users=max_users,
            max_downloads=max_downloads,
            access_duration_days=access_duration_days,
            includes_updates=includes_updates,
            includes_support=includes_support,
            support_level=support_level,
            features=features or [],
            limitations=limitations or [],
        )
        self.db.add(plan)
        self.db.flush()
        return plan

    def delete_plan(self, plan: CatalogPricingPlan) -> None:
        self.db.delete(plan)

    @staticmethod
    def item_allows_no_active_plans(status: CatalogItemStatus) -> bool:
        return status in (
            CatalogItemStatus.draft,
            CatalogItemStatus.coming_soon,
            CatalogItemStatus.request_only,
        )
