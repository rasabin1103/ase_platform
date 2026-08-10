from __future__ import annotations

from typing import Any

from app.models.catalog_item import CatalogItem
from app.models.catalog_pricing_plan import CatalogPricingPlan
from app.models.enums import CatalogItemType


def _parse_types(raw: list[Any] | None) -> list[CatalogItemType]:
    if not raw:
        return []
    out: list[CatalogItemType] = []
    for value in raw:
        if isinstance(value, CatalogItemType):
            out.append(value)
        else:
            out.append(CatalogItemType(str(value)))
    return out


def plan_scope_types(plan: CatalogPricingPlan) -> list[CatalogItemType]:
    return _parse_types(plan.scope_catalog_types)


def plan_scope_categories(plan: CatalogPricingPlan) -> list[str]:
    if not plan.scope_categories:
        return []
    return [str(c).strip() for c in plan.scope_categories if str(c).strip()]


def plan_matches_item(plan: CatalogPricingPlan, item: CatalogItem) -> bool:
    if plan.catalog_item_id is not None and plan.catalog_item_id == item.id:
        return True
    types = plan_scope_types(plan)
    if not types:
        return False
    if item.type not in types:
        return False
    categories = plan_scope_categories(plan)
    if not categories:
        return True
    item_cat = item.category.strip().lower()
    return any(c.strip().lower() == item_cat for c in categories)


def build_scope_summary(
    *,
    scope_catalog_types: list[CatalogItemType],
    scope_categories: list[str],
    catalog_item_title: str | None = None,
) -> str:
    if catalog_item_title and not scope_catalog_types:
        return catalog_item_title
    type_labels = ", ".join(t.value for t in scope_catalog_types) if scope_catalog_types else "—"
    if not scope_categories:
        return f"All ({type_labels})"
    cat_labels = ", ".join(scope_categories)
    return f"{type_labels} · {cat_labels}"
