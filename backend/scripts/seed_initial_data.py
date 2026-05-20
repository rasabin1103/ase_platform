from __future__ import annotations



from dataclasses import dataclass

from decimal import Decimal



import os

import sys



from sqlalchemy import delete, select

from sqlalchemy.orm import Session



_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

if _ROOT not in sys.path:

    sys.path.insert(0, _ROOT)



from app.core.config import settings
from app.core.database import SessionLocal
from app.core.rbac import PERMISSION_METADATA, ROLE_DEFINITIONS, ROLE_PERMISSIONS

from app.models.enums import BillingCycle, ProductStatus

from app.seed_data.services_catalog import apply_services_catalog_seed

from app.models.permission import Permission

from app.models.plan import Plan

from app.models.plan_feature import PlanFeature

from app.models.plan_product import PlanProduct

from app.models.product import Product

from app.models.role import Role

from app.models.role_permission import RolePermission





@dataclass(frozen=True)

class SeedResult:

    created_roles: int = 0

    created_permissions: int = 0

    created_role_permissions: int = 0

    removed_role_permissions: int = 0

    created_plans: int = 0

    created_products: int = 0

    created_plan_products: int = 0

    created_services: int = 0





# Public monthly catalog: idempotent upsert by ``code``; features keyed by ``display_order`` per plan.

PUBLIC_MONTHLY_PLANS: list[dict] = [

    {

        "code": "free_monthly",

        "name": "Free",

        "billing_cycle": BillingCycle.monthly,

        "price": Decimal("0.00"),

        "currency": "EUR",

        "is_active": True,

        "is_recommended": False,

        "display_order": 1,

        "cta_label": "Start free",

        "description": (

            "For individuals exploring automation, QA resources and platform basics."

        ),

        "features": [

            "Personal workspace",

            "Access to free resources",

            "Basic platform preview",

            "Community learning content",

            "Limited product access",

        ],

    },

    {

        "code": "pro_monthly",

        "name": "Pro",

        "billing_cycle": BillingCycle.monthly,

        "price": Decimal("49.00"),

        "currency": "EUR",

        "is_active": True,

        "is_recommended": True,

        "display_order": 2,

        "cta_label": "Start Pro",

        "description": (

            "For professionals and small teams that need frameworks, automation utilities "

            "and structured technical assets."

        ),

        "features": [

            "Everything in Free",

            "QA framework access",

            "Technical templates",

            "Product tools",

            "Training content",

            "Priority updates",

        ],

    },

    {

        "code": "business_monthly",

        "name": "Business",

        "billing_cycle": BillingCycle.monthly,

        "price": Decimal("199.00"),

        "currency": "EUR",

        "is_active": True,

        "is_recommended": False,

        "display_order": 3,

        "cta_label": "Talk to us",

        "description": (

            "For companies that need users, roles, subscriptions, internal tools and automation workflows."

        ),

        "features": [

            "Multi-user organization",

            "Roles and permissions",

            "Product access control",

            "Business dashboards",

            "Audit logs",

            "Automation workflows",

            "Support channel",

        ],

    },

    {

        "code": "enterprise_monthly",

        "name": "Enterprise",

        "billing_cycle": BillingCycle.monthly,

        "price": None,

        "currency": "EUR",

        "is_active": True,

        "is_recommended": False,

        "display_order": 4,

        "cta_label": "Contact sales",

        "description": (

            "For organizations that need custom platforms, integrations, architecture, "

            "QA automation and dedicated engineering support."

        ),

        "features": [

            "Custom SaaS platform",

            "Dedicated architecture support",

            "Private workflows",

            "Enterprise integrations",

            "Custom automation",

            "Security and governance",

            "Technical advisory",

        ],

    },

]



PRODUCTS: dict[str, dict] = {

    "cv_analyzer": {"name": "CV Analyzer", "description": "Analyze CVs and extract structured information."},

    "qa_frameworks": {"name": "QA Frameworks", "description": "Quality assurance frameworks and templates."},

    "training_portal": {"name": "Training Portal", "description": "Course hosting and enrollment portal."},

}



# Baseline plan → product access (codes must match PUBLIC_MONTHLY_PLANS).

PLAN_PRODUCTS: dict[str, list[tuple[str, str]]] = {

    "free_monthly": [("training_portal", "read")],

    "pro_monthly": [

        ("cv_analyzer", "write"),

        ("qa_frameworks", "write"),

        ("training_portal", "admin"),

    ],

    "business_monthly": [

        ("cv_analyzer", "write"),

        ("qa_frameworks", "write"),

        ("training_portal", "admin"),

    ],

    "enterprise_monthly": [

        ("cv_analyzer", "full"),

        ("qa_frameworks", "full"),

        ("training_portal", "full"),

    ],

}





def _sync_plan_features(db: Session, plan: Plan, lines: list[str]) -> None:

    """One row per ``display_order`` slot; update text in place; drop slots beyond seed length."""

    n = len(lines)

    for order, text in enumerate(lines):

        row = db.execute(

            select(PlanFeature).where(

                PlanFeature.plan_id == plan.id,

                PlanFeature.display_order == order,

            )

        ).scalar_one_or_none()

        if row is None:

            db.add(

                PlanFeature(

                    plan_id=plan.id,

                    blurb=text,

                    display_order=order,

                    is_active=True,

                )

            )

        else:

            if row.blurb != text:

                row.blurb = text

            if not row.is_active:

                row.is_active = True

    db.execute(delete(PlanFeature).where(PlanFeature.plan_id == plan.id, PlanFeature.display_order >= n))

    db.flush()





def _upsert_public_monthly_plan(db: Session, spec: dict) -> bool:

    """Insert or update plan by ``code``. Returns True if a new row was inserted."""

    code = spec["code"]

    plan = db.execute(select(Plan).where(Plan.code == code)).scalar_one_or_none()

    common = dict(

        name=spec["name"],

        billing_cycle=spec["billing_cycle"],

        price=spec["price"],

        currency=spec["currency"],

        is_active=spec["is_active"],

        description=spec["description"],

        short_description=None,

        display_order=spec["display_order"],

        is_recommended=spec["is_recommended"],

        cta_label=spec["cta_label"],

    )

    if plan is None:

        plan = Plan(code=code, **common)

        db.add(plan)

        db.flush()

        created = True

    else:

        for key, value in common.items():

            setattr(plan, key, value)

        db.flush()

        created = False



    _sync_plan_features(db, plan, spec["features"])

    return created





def _sync_role_permissions(db: Session) -> tuple[int, int]:

    """Ensure each role has exactly the permissions defined in ROLE_PERMISSIONS."""

    created = 0

    removed = 0

    roles_by_code = {r.code: r for r in db.execute(select(Role)).scalars().all()}

    perms_by_code = {p.code: p for p in db.execute(select(Permission)).scalars().all()}



    for role_code, perm_codes in ROLE_PERMISSIONS.items():

        role = roles_by_code.get(role_code)

        if role is None:

            continue

        desired_perm_ids = {perms_by_code[c].id for c in perm_codes if c in perms_by_code}

        existing = list(

            db.execute(select(RolePermission).where(RolePermission.role_id == role.id)).scalars().all()

        )

        existing_perm_ids = {rp.permission_id for rp in existing}

        for rp in existing:

            if rp.permission_id not in desired_perm_ids:

                db.delete(rp)

                removed += 1

        for perm_id in desired_perm_ids - existing_perm_ids:

            db.add(RolePermission(role_id=role.id, permission_id=perm_id))

            created += 1

    db.flush()

    return created, removed





def seed_db(db: Session) -> SeedResult:

    """Insert/update baseline RBAC and monetization rows; caller commits and manages rollback."""

    created_roles = 0

    created_permissions = 0

    created_plans = 0

    created_products = 0

    created_plan_products = 0

    created_services = 0



    for code, data in ROLE_DEFINITIONS.items():

        role = db.execute(select(Role).where(Role.code == code)).scalar_one_or_none()

        if role is None:

            role = Role(

                code=code,

                name=data["name"],

                scope=data["scope"],

                description=data.get("description"),

            )

            db.add(role)

            db.flush()

            created_roles += 1

        else:

            updated = False

            if role.name != data["name"]:

                role.name = data["name"]

                updated = True

            if role.scope != data["scope"]:

                role.scope = data["scope"]

                updated = True

            desc = data.get("description")

            if role.description != desc:

                role.description = desc

                updated = True

            if updated:

                db.flush()



    for code, data in PERMISSION_METADATA.items():

        perm = db.execute(select(Permission).where(Permission.code == code)).scalar_one_or_none()

        if perm is None:

            perm = Permission(code=code, name=data["name"], module=data["module"])

            db.add(perm)

            db.flush()

            created_permissions += 1

        else:

            if perm.name != data["name"] or perm.module != data["module"]:

                perm.name = data["name"]

                perm.module = data["module"]

                db.flush()



    created_role_permissions, removed_role_permissions = _sync_role_permissions(db)

    if settings.MVP_MODE:
        return SeedResult(
            created_roles=created_roles,
            created_permissions=created_permissions,
            created_role_permissions=created_role_permissions,
            removed_role_permissions=removed_role_permissions,
            created_plans=0,
            created_products=0,
            created_plan_products=0,
            created_services=0,
        )

    for spec in sorted(PUBLIC_MONTHLY_PLANS, key=lambda s: s["display_order"]):

        if _upsert_public_monthly_plan(db, spec):

            created_plans += 1



    for code, data in PRODUCTS.items():

        product = db.execute(select(Product).where(Product.code == code)).scalar_one_or_none()

        if product is None:

            product = Product(

                code=code,

                name=data["name"],

                description=data.get("description"),

                status=ProductStatus.active,

            )

            db.add(product)

            db.flush()

            created_products += 1



    plans_by_code = {p.code: p for p in db.execute(select(Plan)).scalars().all()}

    products_by_code = {p.code: p for p in db.execute(select(Product)).scalars().all()}

    for plan_code, entries in PLAN_PRODUCTS.items():

        plan = plans_by_code.get(plan_code)

        if plan is None:

            continue

        for product_code, access_level in entries:

            product = products_by_code.get(product_code)

            if product is None:

                continue

            exists = (

                db.execute(

                    select(PlanProduct.id).where(

                        PlanProduct.plan_id == plan.id,

                        PlanProduct.product_id == product.id,

                    )

                ).scalar_one_or_none()

                is not None

            )

            if not exists:

                db.add(

                    PlanProduct(

                        plan_id=plan.id,

                        product_id=product.id,

                        access_level=access_level,

                    )

                )

                db.flush()

                created_plan_products += 1



    created_services = apply_services_catalog_seed(db)



    return SeedResult(

        created_roles=created_roles,

        created_permissions=created_permissions,

        created_role_permissions=created_role_permissions,

        removed_role_permissions=removed_role_permissions,

        created_plans=created_plans,

        created_products=created_products,

        created_plan_products=created_plan_products,

        created_services=created_services,

    )





def seed() -> SeedResult:

    db = SessionLocal()

    try:

        result = seed_db(db)

        db.commit()

        return result

    except Exception:

        db.rollback()

        raise

    finally:

        db.close()





def main() -> None:

    result = seed()

    print("Seed completed")

    print(

        f"created_roles={result.created_roles} "

        f"created_permissions={result.created_permissions} "

        f"created_role_permissions={result.created_role_permissions} "

        f"removed_role_permissions={result.removed_role_permissions} "

        f"created_plans={result.created_plans} "

        f"created_products={result.created_products} "

        f"created_plan_products={result.created_plan_products} "

        f"created_services={result.created_services}"

    )





if __name__ == "__main__":

    main()

