from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import PricingBillingInterval, PricingPlanType
from app.modules.pricing.repository import PricingPlansRepository, slugify_name
from app.models.catalog_item import CatalogItem
from app.models.catalog_pricing_plan import CatalogPricingPlan
from app.modules.pricing.schemas import (
    AdminPricingPlanListResponse,
    PricingPlanCreate,
    PricingPlanRead,
    PricingPlanStatusPatch,
    PricingPlanUpdate,
    PricingPlanWithCatalogRead,
    PublicPricingPlanRead,
)
from app.modules.pricing.validation import validate_pricing_plan_fields


class PricingPlansService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PricingPlansRepository(db)

    def _to_read(self, plan: CatalogPricingPlan) -> PricingPlanRead:
        return PricingPlanRead(
            id=plan.id,
            catalog_item_id=plan.catalog_item_id,
            name=plan.name,
            slug=plan.slug,
            description=plan.description,
            plan_type=plan.plan_type,
            billing_interval=plan.billing_interval,
            price=plan.price,
            currency=plan.currency,
            trial_days=plan.trial_days,
            setup_fee=plan.setup_fee,
            discount_percentage=plan.discount_percentage,
            is_active=plan.is_active,
            is_default=plan.is_default,
            max_users=plan.max_users,
            max_downloads=plan.max_downloads,
            access_duration_days=plan.access_duration_days,
            includes_updates=plan.includes_updates,
            includes_support=plan.includes_support,
            support_level=plan.support_level,
            features=list(plan.features or []),
            limitations=list(plan.limitations or []),
            stripe_price_id=plan.stripe_price_id,
            stripe_product_id=plan.stripe_product_id,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )

    def _to_public(self, plan: CatalogPricingPlan) -> PublicPricingPlanRead:
        return PublicPricingPlanRead(
            id=plan.id,
            name=plan.name,
            slug=plan.slug,
            description=plan.description,
            planType=plan.plan_type,
            billingInterval=plan.billing_interval,
            price=plan.price,
            currency=plan.currency,
            trialDays=plan.trial_days,
            setupFee=plan.setup_fee,
            discountPercentage=plan.discount_percentage,
            isDefault=plan.is_default,
            maxUsers=plan.max_users,
            maxDownloads=plan.max_downloads,
            accessDurationDays=plan.access_duration_days,
            includesUpdates=plan.includes_updates,
            includesSupport=plan.includes_support,
            supportLevel=plan.support_level,
            features=list(plan.features or []),
            limitations=list(plan.limitations or []),
        )

    def _ensure_item(self, catalog_item_id: int):
        item = self.repo.get_catalog_item(catalog_item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return item

    def _ensure_plan(self, plan_id: int) -> CatalogPricingPlan:
        plan = self.repo.get_plan(plan_id)
        if plan is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing plan not found")
        return plan

    def _resolve_slug(self, catalog_item_id: int, name: str, slug: str | None, *, exclude_plan_id: int | None = None) -> str:
        base = slugify_name(slug or name)
        candidate = base
        n = 2
        while self.repo.slug_exists(catalog_item_id, candidate, exclude_plan_id=exclude_plan_id):
            candidate = f"{base}-{n}"
            n += 1
        return candidate

    def _to_with_catalog(self, plan: CatalogPricingPlan, item: CatalogItem) -> PricingPlanWithCatalogRead:
        base = self._to_read(plan)
        return PricingPlanWithCatalogRead(
            **base.model_dump(),
            catalog_item_title=item.title,
            catalog_item_slug=item.slug,
            catalog_item_type=item.type,
        )

    def list_all(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        catalog_item_id: int | None = None,
        plan_type: PricingPlanType | None = None,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> AdminPricingPlanListResponse:
        rows, total = self.repo.list_all(
            limit=limit,
            offset=offset,
            catalog_item_id=catalog_item_id,
            plan_type=plan_type,
            is_active=is_active,
            search=search,
        )
        return AdminPricingPlanListResponse(
            items=[self._to_with_catalog(plan, item) for plan, item in rows],
            limit=limit,
            offset=offset,
            total=total,
        )

    def list_for_item(self, catalog_item_id: int) -> list[PricingPlanRead]:
        self._ensure_item(catalog_item_id)
        return [self._to_read(p) for p in self.repo.list_for_item(catalog_item_id)]

    def list_active_for_item(self, catalog_item_id: int) -> list[PublicPricingPlanRead]:
        self._ensure_item(catalog_item_id)
        return [self._to_public(p) for p in self.repo.list_active_for_item(catalog_item_id)]

    def list_active_for_slug(self, slug: str) -> list[PublicPricingPlanRead]:
        from sqlalchemy import select

        from app.models.catalog_item import CatalogItem

        item = self.db.execute(select(CatalogItem).where(CatalogItem.slug == slug)).scalar_one_or_none()
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return self.list_active_for_item(item.id)

    def get_plan(self, plan_id: int) -> PricingPlanRead:
        return self._to_read(self._ensure_plan(plan_id))

    def create_plan(self, catalog_item_id: int, payload: PricingPlanCreate) -> PricingPlanRead:
        self._ensure_item(catalog_item_id)
        validate_pricing_plan_fields(
            plan_type=payload.plan_type,
            billing_interval=payload.billing_interval,
            price=payload.price,
        )
        slug = self._resolve_slug(catalog_item_id, payload.name, payload.slug)
        if payload.is_default:
            self.repo.clear_default_for_item(catalog_item_id)
        plan = self.repo.create_plan(
            catalog_item_id=catalog_item_id,
            name=payload.name.strip(),
            slug=slug,
            description=payload.description,
            plan_type=payload.plan_type,
            billing_interval=payload.billing_interval,
            price=payload.price,
            currency=payload.currency,
            trial_days=payload.trial_days,
            setup_fee=payload.setup_fee,
            discount_percentage=payload.discount_percentage,
            is_active=payload.is_active,
            is_default=payload.is_default,
            max_users=payload.max_users,
            max_downloads=payload.max_downloads,
            access_duration_days=payload.access_duration_days,
            includes_updates=payload.includes_updates,
            includes_support=payload.includes_support,
            support_level=payload.support_level,
            features=payload.features,
            limitations=payload.limitations,
        )
        self.db.commit()
        self.db.refresh(plan)
        return self._to_read(plan)

    def update_plan(self, plan_id: int, payload: PricingPlanUpdate) -> PricingPlanRead:
        plan = self._ensure_plan(plan_id)
        data = payload.model_dump(exclude_unset=True)
        plan_type = data.get("plan_type", plan.plan_type)
        billing_interval = data.get("billing_interval", plan.billing_interval)
        price = data.get("price", plan.price)
        validate_pricing_plan_fields(plan_type=plan_type, billing_interval=billing_interval, price=price)

        if "name" in data and data["name"] is not None:
            plan.name = data["name"].strip()
        if "slug" in data and data["slug"] is not None:
            new_slug = slugify_name(data["slug"])
            if self.repo.slug_exists(plan.catalog_item_id, new_slug, exclude_plan_id=plan.id):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists for this item")
            plan.slug = new_slug
        for key in (
            "description",
            "plan_type",
            "billing_interval",
            "price",
            "trial_days",
            "setup_fee",
            "discount_percentage",
            "is_active",
            "max_users",
            "max_downloads",
            "access_duration_days",
            "includes_updates",
            "includes_support",
            "support_level",
            "features",
            "limitations",
        ):
            if key in data:
                setattr(plan, key, data[key])
        if "currency" in data and data["currency"] is not None:
            plan.currency = data["currency"].upper()

        if data.get("is_default") is True:
            self.repo.clear_default_for_item(plan.catalog_item_id, except_plan_id=plan.id)
            plan.is_default = True
        elif data.get("is_default") is False:
            plan.is_default = False

        self.db.commit()
        self.db.refresh(plan)
        return self._to_read(plan)

    def patch_status(self, plan_id: int, payload: PricingPlanStatusPatch) -> PricingPlanRead:
        plan = self._ensure_plan(plan_id)
        plan.is_active = payload.is_active
        self.db.commit()
        self.db.refresh(plan)
        return self._to_read(plan)

    def delete_plan(self, plan_id: int) -> None:
        plan = self._ensure_plan(plan_id)
        item = self._ensure_item(plan.catalog_item_id)

        # Future: block delete when purchases reference pricing_plan_id.
        active_count = self.repo.count_active_for_item(plan.catalog_item_id, exclude_plan_id=plan.id)
        if plan.is_active and active_count == 0 and not self.repo.item_allows_no_active_plans(item.status):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the only active plan for a published catalog item",
            )

        self.repo.delete_plan(plan)
        self.db.commit()
