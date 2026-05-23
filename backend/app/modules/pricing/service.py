from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.catalog_pricing_plan import CatalogPricingPlan
from app.models.enums import CatalogItemType, PricingBillingInterval, PricingPlanType
from app.modules.pricing.repository import PricingPlansRepository, slugify_name
from app.modules.pricing.schemas import (
    AdminPricingPlanListResponse,
    PricingPlanCreate,
    PricingPlanRead,
    PricingPlanStatusPatch,
    PricingPlanUpdate,
    PricingPlanWithCatalogRead,
    PublicCatalogPricingPlanListResponse,
    PublicCatalogPricingPlanRead,
    PublicPricingPlanRead,
)
from app.modules.pricing.scope import build_scope_summary, plan_scope_categories, plan_scope_types
from app.modules.pricing.pricing_display import build_public_pricing_fields, consolidate_public_plans
from app.modules.pricing.validation import validate_pricing_plan_fields


class PricingPlansService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PricingPlansRepository(db)

    def _scope_types_from_payload(
        self,
        payload: PricingPlanCreate | PricingPlanUpdate,
        *,
        item: CatalogItem | None = None,
    ) -> list[CatalogItemType]:
        types = getattr(payload, "scope_catalog_types", None)
        if types is not None and len(types) > 0:
            return list(types)
        if item is not None:
            return [item.type]
        return []

    def _scope_categories_from_payload(
        self,
        payload: PricingPlanCreate | PricingPlanUpdate,
        *,
        item: CatalogItem | None = None,
    ) -> list[str]:
        cats = getattr(payload, "scope_categories", None)
        if cats is not None:
            return [c.strip() for c in cats if c.strip()]
        return []

    def _validate_scope(
        self,
        *,
        catalog_item_id: int | None,
        scope_catalog_types: list[CatalogItemType],
    ) -> None:
        if catalog_item_id is None and not scope_catalog_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Select at least one catalog type for the plan scope",
            )

    def _to_read(self, plan: CatalogPricingPlan, item: CatalogItem | None = None) -> PricingPlanRead:
        types = plan_scope_types(plan)
        categories = plan_scope_categories(plan)
        return PricingPlanRead(
            id=plan.id,
            catalog_item_id=plan.catalog_item_id,
            scope_catalog_types=types,
            scope_categories=categories,
            scope_summary=build_scope_summary(
                scope_catalog_types=types,
                scope_categories=categories,
                catalog_item_title=item.title if item else None,
            ),
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
            is_popular=bool(getattr(plan, "is_popular", False)),
            order_index=plan.order_index,
            monthly_price=plan.monthly_price,
            annual_price=plan.annual_price,
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
        from app.modules.pricing.pricing_display import (
            ANNUAL_DISCOUNT_PERCENTAGE,
            annual_savings_amount,
            display_plan_name,
            formatted_price,
            resolve_annual_price,
            resolve_monthly_price,
        )

        monthly = resolve_monthly_price(plan)
        annual = resolve_annual_price(plan, monthly)
        savings = annual_savings_amount(monthly, annual)
        currency = plan.currency or "EUR"
        return PublicPricingPlanRead(
            id=plan.id,
            name=display_plan_name(plan.name),
            slug=plan.slug,
            displayName=display_plan_name(plan.name),
            description=plan.description,
            planType=plan.plan_type,
            billingInterval=plan.billing_interval,
            price=monthly if monthly is not None else plan.price,
            currency=currency,
            monthlyPrice=monthly,
            annualPrice=annual,
            annualDiscountPercentage=int(ANNUAL_DISCOUNT_PERCENTAGE),
            annualSavingsAmount=savings,
            formattedMonthlyPrice=formatted_price(monthly, currency) if monthly is not None else "",
            formattedAnnualPrice=formatted_price(annual, currency) if annual is not None else "",
            isPopular=bool(getattr(plan, "is_popular", False) or plan.is_default),
            orderIndex=plan.order_index,
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
            features=[str(f) for f in list(plan.features or []) if f],
            limitations=[str(x) for x in list(plan.limitations or []) if x],
        )

    def _to_public_from_tier(self, tier) -> PublicPricingPlanRead:
        from app.modules.pricing.pricing_display import MergedPublicTier

        assert isinstance(tier, MergedPublicTier)
        plan = tier.primary
        fields = build_public_pricing_fields(tier)
        base = self._to_public(plan)
        return base.model_copy(
            update={
                **fields,
                "name": fields["displayName"] or base.name,
                "price": fields["monthlyPrice"] or base.price,
                "features": fields["features"],
                "limitations": fields["limitations"],
            }
        )

    def _ensure_item(self, catalog_item_id: int) -> CatalogItem:
        item = self.repo.get_catalog_item(catalog_item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return item

    def _ensure_plan(self, plan_id: int) -> CatalogPricingPlan:
        plan = self.repo.get_plan(plan_id)
        if plan is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing plan not found")
        return plan

    def _resolve_slug(
        self,
        name: str,
        slug: str | None,
        *,
        catalog_item_id: int | None,
        exclude_plan_id: int | None = None,
    ) -> str:
        base = slugify_name(slug or name)
        candidate = base
        n = 2
        while True:
            exists = (
                self.repo.slug_exists_for_item(catalog_item_id, candidate, exclude_plan_id=exclude_plan_id)
                if catalog_item_id is not None
                else self.repo.slug_exists_global(candidate, exclude_plan_id=exclude_plan_id)
            )
            if not exists:
                return candidate
            candidate = f"{base}-{n}"
            n += 1

    def _to_with_catalog(
        self,
        plan: CatalogPricingPlan,
        item: CatalogItem | None,
    ) -> PricingPlanWithCatalogRead:
        base = self._to_read(plan, item)
        return PricingPlanWithCatalogRead(
            **base.model_dump(),
            catalog_item_title=item.title if item else None,
            catalog_item_slug=item.slug if item else None,
            catalog_item_type=item.type if item else None,
        )

    def _to_public_catalog(
        self,
        plan: CatalogPricingPlan,
        item: CatalogItem | None,
        *,
        public: PublicPricingPlanRead | None = None,
    ) -> PublicCatalogPricingPlanRead:
        base = public or self._to_public(plan)
        return PublicCatalogPricingPlanRead(
            **base.model_dump(),
            catalogItemId=item.id if item else 0,
            catalogItemTitle=item.title if item else base.displayName or base.name,
            catalogItemSlug=item.slug if item else plan.slug,
            catalogItemType=item.type if item else CatalogItemType.product,
            catalogItemCategory=item.category if item else "",
        )

    def list_public_active(self, *, limit: int = 100, offset: int = 0) -> PublicCatalogPricingPlanListResponse:
        rows, _ = self.repo.list_public_active(limit=500, offset=0)
        plan_to_item = {plan.id: item for plan, item in rows}
        tiers = consolidate_public_plans([plan for plan, _ in rows])
        items: list[PublicCatalogPricingPlanRead] = []
        for tier in tiers:
            plan = tier.primary
            item = plan_to_item.get(plan.id)
            pub = self._to_public_from_tier(tier)
            items.append(self._to_public_catalog(plan, item, public=pub))
        total = len(items)
        page = items[offset : offset + limit]
        return PublicCatalogPricingPlanListResponse(
            items=page,
            limit=limit,
            offset=offset,
            total=total,
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
        item = self._ensure_item(catalog_item_id)
        return [self._to_read(p, item) for p in self.repo.list_for_item(catalog_item_id)]

    def list_active_for_item(self, catalog_item_id: int) -> list[PublicPricingPlanRead]:
        self._ensure_item(catalog_item_id)
        plans = self.repo.list_active_for_item(catalog_item_id)
        return [self._to_public_from_tier(t) for t in consolidate_public_plans(plans)]

    def list_active_for_slug(self, slug: str) -> list[PublicPricingPlanRead]:
        from sqlalchemy import select

        item = self.db.execute(select(CatalogItem).where(CatalogItem.slug == slug)).scalar_one_or_none()
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return self.list_active_for_item(item.id)

    def get_plan(self, plan_id: int) -> PricingPlanRead:
        plan = self._ensure_plan(plan_id)
        item = self.repo.get_catalog_item(plan.catalog_item_id) if plan.catalog_item_id else None
        return self._to_read(plan, item)

    def create_plan(self, payload: PricingPlanCreate, *, catalog_item_id: int | None = None) -> PricingPlanRead:
        item: CatalogItem | None = None
        resolved_item_id = catalog_item_id if catalog_item_id is not None else payload.catalog_item_id
        if resolved_item_id is not None:
            item = self._ensure_item(resolved_item_id)

        scope_types = self._scope_types_from_payload(payload, item=item)
        scope_categories = self._scope_categories_from_payload(payload, item=item)
        self._validate_scope(catalog_item_id=resolved_item_id, scope_catalog_types=scope_types)

        validate_pricing_plan_fields(
            plan_type=payload.plan_type,
            billing_interval=payload.billing_interval,
            price=payload.price,
        )
        slug = self._resolve_slug(payload.name, payload.slug, catalog_item_id=resolved_item_id)
        if payload.is_default:
            if resolved_item_id is not None:
                self.repo.clear_default_for_item(resolved_item_id)
            else:
                self.repo.clear_default_for_scope(scope_types, scope_categories)

        plan = self.repo.create_plan(
            catalog_item_id=resolved_item_id,
            scope_catalog_types=scope_types,
            scope_categories=scope_categories,
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
            is_popular=payload.is_popular,
            order_index=payload.order_index,
            monthly_price=payload.monthly_price,
            annual_price=payload.annual_price,
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
        return self._to_read(plan, item)

    def create_plan_for_item(self, catalog_item_id: int, payload: PricingPlanCreate) -> PricingPlanRead:
        return self.create_plan(payload, catalog_item_id=catalog_item_id)

    def update_plan(self, plan_id: int, payload: PricingPlanUpdate) -> PricingPlanRead:
        plan = self._ensure_plan(plan_id)
        data = payload.model_dump(exclude_unset=True)
        item = self.repo.get_catalog_item(plan.catalog_item_id) if plan.catalog_item_id else None

        if "scope_catalog_types" in data or "scope_categories" in data or "catalog_item_id" in data:
            merged_types = (
                data["scope_catalog_types"]
                if "scope_catalog_types" in data
                else plan_scope_types(plan)
            )
            merged_cats = (
                [c.strip() for c in data["scope_categories"] if c.strip()]
                if "scope_categories" in data
                else plan_scope_categories(plan)
            )
            resolved_item_id = data.get("catalog_item_id", plan.catalog_item_id)
            self._validate_scope(catalog_item_id=resolved_item_id, scope_catalog_types=merged_types)
            plan.scope_catalog_types = [t.value for t in merged_types]
            plan.scope_categories = merged_cats
            if "catalog_item_id" in data:
                plan.catalog_item_id = data["catalog_item_id"]
                if plan.catalog_item_id:
                    item = self._ensure_item(plan.catalog_item_id)

        plan_type = data.get("plan_type", plan.plan_type)
        billing_interval = data.get("billing_interval", plan.billing_interval)
        price = data.get("price", plan.price)
        validate_pricing_plan_fields(plan_type=plan_type, billing_interval=billing_interval, price=price)

        if "name" in data and data["name"] is not None:
            plan.name = data["name"].strip()
        if "slug" in data and data["slug"] is not None:
            new_slug = slugify_name(data["slug"])
            item_id = plan.catalog_item_id
            exists = (
                self.repo.slug_exists_for_item(item_id, new_slug, exclude_plan_id=plan.id)
                if item_id is not None
                else self.repo.slug_exists_global(new_slug, exclude_plan_id=plan.id)
            )
            if exists:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
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
            if plan.catalog_item_id is not None:
                self.repo.clear_default_for_item(plan.catalog_item_id, except_plan_id=plan.id)
            else:
                self.repo.clear_default_for_scope(
                    plan_scope_types(plan),
                    plan_scope_categories(plan),
                    except_plan_id=plan.id,
                )
            plan.is_default = True
        elif data.get("is_default") is False:
            plan.is_default = False

        self.db.commit()
        self.db.refresh(plan)
        if plan.catalog_item_id:
            item = self.repo.get_catalog_item(plan.catalog_item_id)
        return self._to_read(plan, item)

    def patch_status(self, plan_id: int, payload: PricingPlanStatusPatch) -> PricingPlanRead:
        plan = self._ensure_plan(plan_id)
        plan.is_active = payload.is_active
        self.db.commit()
        self.db.refresh(plan)
        item = self.repo.get_catalog_item(plan.catalog_item_id) if plan.catalog_item_id else None
        return self._to_read(plan, item)

    def delete_plan(self, plan_id: int) -> None:
        plan = self._ensure_plan(plan_id)
        subscriber_count = self.repo.count_subscriptions_for_plan(plan.id)
        if subscriber_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "pricing_plan_delete_blocked",
                    "reasons": ["has_subscribers"],
                    "subscriber_count": subscriber_count,
                    "plan_name": plan.name,
                },
            )
        self.repo.delete_plan(plan)
        self.db.commit()
