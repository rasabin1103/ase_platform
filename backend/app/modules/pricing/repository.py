from __future__ import annotations

import re
from decimal import Decimal
from typing import Any

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.catalog_plan_subscription import CatalogPlanSubscription
from app.models.catalog_pricing_plan import CatalogPricingPlan
from app.models.enums import CatalogItemStatus, CatalogItemType, PricingBillingInterval, PricingPlanType, PricingSupportLevel
from app.modules.pricing.scope import plan_matches_item, plan_scope_categories, plan_scope_types

PUBLIC_CATALOG_STATUSES = (
    CatalogItemStatus.published,
    CatalogItemStatus.coming_soon,
    CatalogItemStatus.request_only,
)


def slugify_name(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:160] or "plan"


def _scope_types_json(types: list[CatalogItemType]) -> list[str]:
    return [t.value for t in types]


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
    ) -> tuple[list[tuple[CatalogPricingPlan, CatalogItem | None]], int]:
        base = (
            select(CatalogPricingPlan, CatalogItem)
            .outerjoin(CatalogItem, CatalogItem.id == CatalogPricingPlan.catalog_item_id)
            .order_by(
                CatalogPricingPlan.name.asc(),
                CatalogPricingPlan.is_default.desc(),
                CatalogPricingPlan.price.asc(),
                CatalogPricingPlan.created_at.desc(),
            )
        )
        if catalog_item_id is not None:
            base = base.where(
                or_(
                    CatalogPricingPlan.catalog_item_id == catalog_item_id,
                    CatalogPricingPlan.catalog_item_id.is_(None),
                )
            )
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
    ) -> tuple[list[tuple[CatalogPricingPlan, CatalogItem | None]], int]:
        base = (
            select(CatalogPricingPlan, CatalogItem)
            .outerjoin(CatalogItem, CatalogItem.id == CatalogPricingPlan.catalog_item_id)
            .where(CatalogPricingPlan.is_active.is_(True))
            .order_by(
                CatalogPricingPlan.name.asc(),
                CatalogPricingPlan.is_default.desc(),
                CatalogPricingPlan.price.asc(),
                CatalogPricingPlan.created_at.desc(),
            )
        )
        total = int(self.db.scalar(select(func.count()).select_from(base.subquery())) or 0)
        rows = self.db.execute(base.limit(limit).offset(offset)).all()
        return [(plan, item) for plan, item in rows], total

    def list_for_item(self, catalog_item_id: int) -> list[CatalogPricingPlan]:
        item = self.get_catalog_item(catalog_item_id)
        if item is None:
            return []
        stmt = select(CatalogPricingPlan).order_by(
            CatalogPricingPlan.is_default.desc(),
            CatalogPricingPlan.price.asc(),
            CatalogPricingPlan.created_at.desc(),
        )
        plans = list(self.db.scalars(stmt).all())
        return [p for p in plans if plan_matches_item(p, item)]

    def list_active_for_item(self, catalog_item_id: int) -> list[CatalogPricingPlan]:
        item = self.get_catalog_item(catalog_item_id)
        if item is None:
            return []
        return [p for p in self.list_for_item(catalog_item_id) if p.is_active]

    def slug_exists_for_item(
        self,
        catalog_item_id: int,
        slug: str,
        *,
        exclude_plan_id: int | None = None,
    ) -> bool:
        stmt = select(CatalogPricingPlan.id).where(
            CatalogPricingPlan.catalog_item_id == catalog_item_id,
            CatalogPricingPlan.slug == slug,
        )
        if exclude_plan_id is not None:
            stmt = stmt.where(CatalogPricingPlan.id != exclude_plan_id)
        return self.db.scalar(stmt) is not None

    def slug_exists_global(self, slug: str, *, exclude_plan_id: int | None = None) -> bool:
        stmt = select(CatalogPricingPlan.id).where(
            CatalogPricingPlan.catalog_item_id.is_(None),
            CatalogPricingPlan.slug == slug,
        )
        if exclude_plan_id is not None:
            stmt = stmt.where(CatalogPricingPlan.id != exclude_plan_id)
        return self.db.scalar(stmt) is not None

    def count_subscriptions_for_plan(self, plan_id: int) -> int:
        stmt = select(func.count()).select_from(CatalogPlanSubscription).where(
            CatalogPlanSubscription.catalog_pricing_plan_id == plan_id,
        )
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

    def clear_default_for_scope(
        self,
        scope_catalog_types: list[CatalogItemType],
        scope_categories: list[str],
        *,
        except_plan_id: int | None = None,
    ) -> None:
        types_json = _scope_types_json(scope_catalog_types)
        cats_json = scope_categories
        stmt = (
            update(CatalogPricingPlan)
            .where(
                CatalogPricingPlan.catalog_item_id.is_(None),
                CatalogPricingPlan.is_default.is_(True),
                CatalogPricingPlan.scope_catalog_types == types_json,
                CatalogPricingPlan.scope_categories == cats_json,
            )
            .values(is_default=False)
        )
        if except_plan_id is not None:
            stmt = stmt.where(CatalogPricingPlan.id != except_plan_id)
        self.db.execute(stmt)

    def create_plan(
        self,
        *,
        catalog_item_id: int | None,
        scope_catalog_types: list[CatalogItemType],
        scope_categories: list[str],
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
            scope_catalog_types=_scope_types_json(scope_catalog_types),
            scope_categories=scope_categories,
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
