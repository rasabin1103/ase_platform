"""
Reset local application data and seed a deterministic role matrix.

Development/local only. This preserves schema and Alembic migrations, truncates
application tables, restarts identities when supported, and creates users,
organizations, RBAC, catalog, subscriptions, invitations, courses, and audit logs.

Usage from repository root:
  python scripts/reset_and_seed_role_matrix.py
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "ase_backend"
SCRIPTS_ROOT = REPO_ROOT / "scripts"

os.chdir(BACKEND_ROOT)
for path in (BACKEND_ROOT, SCRIPTS_ROOT):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import app.models  # noqa: E402, F401
from app.core.database import SessionLocal  # noqa: E402
from app.models.audit_log import AuditLog  # noqa: E402
from app.models.course import Course  # noqa: E402
from app.models.enums import (  # noqa: E402
    AccessLevel,
    BillingCycle,
    CourseStatus,
    InvitationStatus,
    MembershipStatus,
    OrganizationStatus,
    OrganizationType,
    ProductStatus,
    RoleScope,
    SubscriptionProvider,
    SubscriptionStatus,
    UserStatus,
)
from app.models.invitation import Invitation  # noqa: E402
from app.models.member_role import MemberRole  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.organization_member import OrganizationMember  # noqa: E402
from app.models.permission import Permission  # noqa: E402
from app.models.plan import Plan  # noqa: E402
from app.models.plan_feature import PlanFeature  # noqa: E402
from app.models.plan_product import PlanProduct  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.role_permission import RolePermission  # noqa: E402
from app.models.subscription import Subscription  # noqa: E402
from app.models.user import User  # noqa: E402
from app.modules.auth.security import hash_password  # noqa: E402
from reset_database import truncate_application_tables  # noqa: E402

PASSWORD = os.environ.get("DEMO_SEED_PASSWORD", "ChangeMeDemo123!")


@dataclass(frozen=True)
class UserSpec:
    email: str
    first_name: str
    last_name: str
    display_name: str
    status: UserStatus
    expected_access: str


ROLE_SPECS: dict[str, tuple[str, RoleScope]] = {
    "super_admin": ("Super Admin", RoleScope.platform),
    "org_owner": ("Organization Owner", RoleScope.organization),
    "org_admin": ("Organization Admin", RoleScope.organization),
    "member": ("Member", RoleScope.organization),
    "viewer": ("Viewer", RoleScope.organization),
}

PERMISSION_CODES = (
    "users.read",
    "users.write",
    "organizations.read",
    "organizations.write",
    "billing.read",
    "billing.manage",
    "products.read",
    "products.manage",
    "courses.read",
    "courses.manage",
    "audit.read",
    "audit.write",
    "subscriptions.read",
    "subscriptions.manage",
    "plans.read",
    "plans.manage",
    "platform.read",
    "platform.manage",
)

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "super_admin": set(PERMISSION_CODES),
    "org_owner": {
        "organizations.read",
        "organizations.write",
        "users.read",
        "users.write",
        "billing.read",
        "billing.manage",
        "products.read",
        "products.manage",
        "courses.read",
        "courses.manage",
        "audit.read",
        "subscriptions.read",
        "subscriptions.manage",
        "plans.read",
    },
    "org_admin": {
        "organizations.read",
        "users.read",
        "users.write",
        "products.read",
        "products.manage",
        "courses.read",
        "courses.manage",
        "audit.read",
        "subscriptions.read",
        "plans.read",
    },
    "member": {
        "organizations.read",
        "products.read",
        "courses.read",
        "subscriptions.read",
    },
    "viewer": {
        "organizations.read",
        "products.read",
        "courses.read",
    },
}

USERS: tuple[UserSpec, ...] = (
    UserSpec("rasabin01@gmail.com", "Roberto", "SuperAdmin", "Roberto Super Admin", UserStatus.active, "Platform super admin; can see everything."),
    UserSpec("rasabin02@gmail.com", "Roberto", "Owner", "Roberto Org Owner", UserStatus.active, "Owner of Acme Corporation; can manage the organization."),
    UserSpec("rasabin03@gmail.com", "Roberto", "Admin", "Roberto Org Admin", UserStatus.active, "Admin in Acme Corporation; tenant operations without global platform access."),
    UserSpec("rasabin04@gmail.com", "Roberto", "Member", "Roberto Member", UserStatus.active, "Member in Acme Corporation; limited access."),
    UserSpec("rasabin05@gmail.com", "Roberto", "Viewer", "Roberto Viewer", UserStatus.active, "Viewer in Acme Corporation; read-only access."),
    UserSpec("rasabin06@gmail.com", "Roberto", "NoOrg", "Roberto Sin Organizacion", UserStatus.active, "No organization; should see onboarding/create organization/accept invitation paths."),
    UserSpec("rasabin07@gmail.com", "Roberto", "Invited", "Roberto Invitado", UserStatus.active, "Invited member in Globex Solutions; pending membership behavior."),
    UserSpec("rasabin08@gmail.com", "Roberto", "Suspended", "Roberto Suspendido", UserStatus.suspended, "Suspended user and membership; access should be blocked."),
    UserSpec("rasabin09@gmail.com", "Roberto", "OwnerTwo", "Roberto Owner Two", UserStatus.active, "Owner of Globex Solutions; second tenant validation."),
    UserSpec("rasabin10@gmail.com", "Roberto", "MultiTenant", "Roberto Multi Tenant", UserStatus.active, "Acme org_admin and Globex viewer; validates tenant switching."),
)

ORGANIZATION_SPECS = (
    ("Arce Sabin Engineering", "arce-sabin-engineering", OrganizationType.enterprise, OrganizationStatus.active, "rasabin01@gmail.com"),
    ("Acme Corporation", "acme-corporation", OrganizationType.business, OrganizationStatus.active, "rasabin02@gmail.com"),
    ("Globex Solutions", "globex-solutions", OrganizationType.business, OrganizationStatus.active, "rasabin09@gmail.com"),
    ("Suspended Corp", "suspended-corp", OrganizationType.business, OrganizationStatus.suspended, "rasabin01@gmail.com"),
)

MEMBERSHIP_SPECS = (
    ("rasabin01@gmail.com", "arce-sabin-engineering", MembershipStatus.active, "super_admin"),
    ("rasabin02@gmail.com", "acme-corporation", MembershipStatus.active, "org_owner"),
    ("rasabin03@gmail.com", "acme-corporation", MembershipStatus.active, "org_admin"),
    ("rasabin04@gmail.com", "acme-corporation", MembershipStatus.active, "member"),
    ("rasabin05@gmail.com", "acme-corporation", MembershipStatus.active, "viewer"),
    ("rasabin07@gmail.com", "globex-solutions", MembershipStatus.invited, "member"),
    ("rasabin08@gmail.com", "acme-corporation", MembershipStatus.suspended, "member"),
    ("rasabin09@gmail.com", "globex-solutions", MembershipStatus.active, "org_owner"),
    ("rasabin10@gmail.com", "acme-corporation", MembershipStatus.active, "org_admin"),
    ("rasabin10@gmail.com", "globex-solutions", MembershipStatus.active, "viewer"),
)

PLAN_SPECS = (
    ("free_monthly", "Free", Decimal("0.00"), "For individuals exploring the platform.", 1, False),
    ("pro_monthly", "Pro", Decimal("49.00"), "For professionals and small teams.", 2, True),
    ("business_monthly", "Business", Decimal("199.00"), "For organizations managing teams and products.", 3, False),
    ("enterprise_monthly", "Enterprise", None, "For companies requiring governance and custom support.", 4, False),
)

PRODUCT_SPECS = (
    ("qa_frameworks", "QA Frameworks", "Quality assurance frameworks and templates."),
    ("cv_analyzer", "CV Analyzer", "Analyze CVs and extract structured insights."),
    ("training_portal", "Training Portal", "Course hosting and enrollment portal."),
    ("audit_center", "Audit Center", "Enterprise audit and traceability module."),
    ("automation_hub", "Automation Hub", "Automation workflows and operational accelerators."),
)

PLAN_PRODUCT_ACCESS: dict[str, dict[str, AccessLevel]] = {
    "free_monthly": {"training_portal": AccessLevel.read},
    "pro_monthly": {
        "qa_frameworks": AccessLevel.write,
        "cv_analyzer": AccessLevel.write,
        "training_portal": AccessLevel.admin,
    },
    "business_monthly": {
        "qa_frameworks": AccessLevel.write,
        "cv_analyzer": AccessLevel.write,
        "training_portal": AccessLevel.admin,
        "audit_center": AccessLevel.admin,
        "automation_hub": AccessLevel.write,
    },
    "enterprise_monthly": {
        "qa_frameworks": AccessLevel.full,
        "cv_analyzer": AccessLevel.full,
        "training_portal": AccessLevel.full,
        "audit_center": AccessLevel.full,
        "automation_hub": AccessLevel.full,
    },
}

COURSE_SPECS = (
    ("intro-playwright", "Introduccion a Playwright", "Automatizacion end-to-end con Playwright.", "Automatizacion"),
    ("ia-qa-engineers", "IA para QA Engineers", "Uso responsable de IA en estrategias de QA.", "IA"),
    ("api-testing-postman", "API Testing con Postman", "Colecciones, aserciones y regresion API.", "APIs"),
)

SUBSCRIPTION_SPECS = (
    ("acme-corporation", "business_monthly"),
    ("globex-solutions", "pro_monthly"),
    ("arce-sabin-engineering", "enterprise_monthly"),
)

AUDIT_EVENTS = (
    ("role-matrix-login-success", "LOGIN", "Auth", "rasabin01@gmail.com", "arce-sabin-engineering", "Login exitoso de Roberto Super Admin."),
    ("role-matrix-organization-created", "CREATED", "Organization", "rasabin02@gmail.com", "acme-corporation", "Organizacion Acme Corporation creada para pruebas."),
    ("role-matrix-user-invited", "CREATED", "User", "rasabin02@gmail.com", "globex-solutions", "Usuario rasabin07@gmail.com invitado a Globex Solutions."),
    ("role-matrix-plan-updated", "UPDATED", "Plan", "rasabin01@gmail.com", "arce-sabin-engineering", "Plan Business actualizado para pruebas de permisos."),
    ("role-matrix-product-activated", "UPDATED", "Product", "rasabin03@gmail.com", "acme-corporation", "Producto Audit Center activado."),
    ("role-matrix-course-published", "UPDATED", "Course", "rasabin03@gmail.com", "acme-corporation", "Curso Introduccion a Playwright publicado."),
    ("role-matrix-subscription-created", "CREATED", "Subscription", "rasabin09@gmail.com", "globex-solutions", "Suscripcion Pro creada para Globex Solutions."),
)


def permission_name(code: str) -> str:
    return code.replace(".", " ").replace("_", " ").title()


def permission_module(code: str) -> str:
    return code.split(".", 1)[0]


def seed_roles_permissions(db: Session) -> dict[str, int]:
    counts = {"roles": 0, "permissions": 0, "role_permissions": 0}

    for code, (name, scope) in ROLE_SPECS.items():
        role = Role(code=code, name=name, scope=scope)
        db.add(role)
        counts["roles"] += 1
    db.flush()

    for code in PERMISSION_CODES:
        db.add(Permission(code=code, name=permission_name(code), module=permission_module(code)))
        counts["permissions"] += 1
    db.flush()

    roles = {r.code: r for r in db.execute(select(Role)).scalars().all()}
    permissions = {p.code: p for p in db.execute(select(Permission)).scalars().all()}
    for role_code, perm_codes in ROLE_PERMISSIONS.items():
        for perm_code in sorted(perm_codes):
            db.add(RolePermission(role_id=roles[role_code].id, permission_id=permissions[perm_code].id))
            counts["role_permissions"] += 1
    db.flush()
    return counts


def seed_users(db: Session) -> dict[str, User]:
    users: dict[str, User] = {}
    for spec in USERS:
        user = User(
            email=spec.email,
            password_hash=hash_password(PASSWORD),
            first_name=spec.first_name,
            last_name=spec.last_name,
            display_name=spec.display_name,
            status=spec.status,
            email_verified_at=datetime.now(timezone.utc) if spec.status == UserStatus.active else None,
        )
        db.add(user)
        users[spec.email] = user
    db.flush()
    return users


def seed_organizations(db: Session, users: dict[str, User]) -> dict[str, Organization]:
    organizations: dict[str, Organization] = {}
    for name, slug, org_type, status, owner_email in ORGANIZATION_SPECS:
        org = Organization(
            name=name,
            slug=slug,
            type=org_type,
            owner_user_id=users[owner_email].id,
            status=status,
        )
        db.add(org)
        organizations[slug] = org
    db.flush()
    return organizations


def seed_memberships(db: Session, users: dict[str, User], organizations: dict[str, Organization]) -> int:
    roles = {r.code: r for r in db.execute(select(Role)).scalars().all()}
    assigned_by_id = users["rasabin01@gmail.com"].id
    created = 0
    for email, org_slug, status, role_code in MEMBERSHIP_SPECS:
        member = OrganizationMember(
            organization_id=organizations[org_slug].id,
            user_id=users[email].id,
            membership_status=status,
            joined_at=datetime.now(timezone.utc) if status == MembershipStatus.active else None,
        )
        db.add(member)
        db.flush()
        db.add(MemberRole(organization_member_id=member.id, role_id=roles[role_code].id, assigned_by_user_id=assigned_by_id))
        created += 1
    db.flush()
    return created


def seed_plans_products(db: Session) -> dict[str, int]:
    counts = {"plans": 0, "plan_features": 0, "products": 0, "plan_products": 0}
    for code, name, price, description, display_order, is_recommended in PLAN_SPECS:
        plan = Plan(
            code=code,
            name=name,
            billing_cycle=BillingCycle.monthly,
            price=price,
            currency="EUR",
            is_active=True,
            description=description,
            short_description=description,
            display_order=display_order,
            is_recommended=is_recommended,
            cta_label="Start" if code != "enterprise_monthly" else "Contact sales",
        )
        db.add(plan)
        counts["plans"] += 1
    db.flush()

    plans = {p.code: p for p in db.execute(select(Plan)).scalars().all()}
    for plan in plans.values():
        for order, text in enumerate(("Role-based access", "Demo catalog", "Audit-ready workflows")):
            db.add(PlanFeature(plan_id=plan.id, blurb=text, display_order=order, is_active=True))
            counts["plan_features"] += 1

    for code, name, description in PRODUCT_SPECS:
        db.add(Product(code=code, name=name, description=description, status=ProductStatus.active))
        counts["products"] += 1
    db.flush()

    products = {p.code: p for p in db.execute(select(Product)).scalars().all()}
    for plan_code, access_by_product in PLAN_PRODUCT_ACCESS.items():
        for product_code, access_level in access_by_product.items():
            db.add(PlanProduct(plan_id=plans[plan_code].id, product_id=products[product_code].id, access_level=access_level))
            counts["plan_products"] += 1
    db.flush()
    return counts


def seed_courses(db: Session, organizations: dict[str, Organization]) -> int:
    created = 0
    for slug, title, description, category in COURSE_SPECS:
        db.add(
            Course(
                organization_id=organizations["acme-corporation"].id,
                owner_user_id=None,
                title=title,
                slug=slug,
                description=description,
                category=category,
                cover_image_url=None,
                status=CourseStatus.published,
            )
        )
        created += 1
    db.flush()
    return created


def seed_subscriptions(db: Session, organizations: dict[str, Organization]) -> int:
    plans = {p.code: p for p in db.execute(select(Plan)).scalars().all()}
    now = datetime.now(timezone.utc)
    created = 0
    for org_slug, plan_code in SUBSCRIPTION_SPECS:
        db.add(
            Subscription(
                organization_id=organizations[org_slug].id,
                plan_id=plans[plan_code].id,
                provider=SubscriptionProvider.manual,
                provider_subscription_id=f"role_matrix_{org_slug}_{plan_code}",
                status=SubscriptionStatus.active,
                starts_at=now - timedelta(days=15),
                ends_at=now + timedelta(days=365),
                trial_ends_at=None,
            )
        )
        created += 1
    db.flush()
    return created


def seed_invitation(db: Session, users: dict[str, User], organizations: dict[str, Organization]) -> int:
    role = db.execute(select(Role).where(Role.code == "member")).scalar_one()
    db.add(
        Invitation(
            organization_id=organizations["globex-solutions"].id,
            email="rasabin07@gmail.com",
            role_id=role.id,
            token="role-matrix-rasabin07-token",
            status=InvitationStatus.pending,
            expires_at=datetime.now(timezone.utc) + timedelta(days=14),
            invited_by_user_id=users["rasabin09@gmail.com"].id,
        )
    )
    db.flush()
    return 1


def seed_audit_logs(db: Session, users: dict[str, User], organizations: dict[str, Organization]) -> int:
    now = datetime.now(timezone.utc).replace(microsecond=0)
    created = 0
    for index, (key, action, entity_type, actor_email, org_slug, detail) in enumerate(AUDIT_EVENTS):
        db.add(
            AuditLog(
                organization_id=organizations[org_slug].id,
                actor_user_id=users[actor_email].id,
                action=action,
                entity_type=entity_type,
                entity_id=key,
                metadata_json={"demo_seed_key": key, "detail": detail, "source": "role_matrix_seed"},
                created_at=now - timedelta(hours=index + 1),
            )
        )
        created += 1
    db.flush()
    return created


def print_summary(db: Session) -> None:
    rows = []
    roles_by_member = {}
    memberships = db.execute(select(OrganizationMember)).scalars().all()
    for member in memberships:
        role_codes = [
            db.execute(select(Role.code).where(Role.id == mr.role_id)).scalar_one()
            for mr in db.execute(select(MemberRole).where(MemberRole.organization_member_id == member.id)).scalars().all()
        ]
        roles_by_member[member.id] = ", ".join(role_codes) or "none"

    for spec in USERS:
        user = db.execute(select(User).where(User.email == spec.email)).scalar_one()
        user_memberships = db.execute(select(OrganizationMember).where(OrganizationMember.user_id == user.id)).scalars().all()
        if not user_memberships:
            rows.append((user.email, "none", "none", "none", spec.expected_access))
            continue
        for member in user_memberships:
            org = db.execute(select(Organization).where(Organization.id == member.organization_id)).scalar_one()
            rows.append((user.email, roles_by_member[member.id], org.name, member.membership_status.value, spec.expected_access))

    print("\nRole matrix users")
    print("-" * 148)
    print(f"{'email':<24} {'role':<18} {'organization':<28} {'membership':<12} expected_access")
    print("-" * 148)
    for email, role, org, membership, expected in rows:
        print(f"{email:<24} {role:<18} {org:<28} {membership:<12} {expected}")


def main() -> None:
    db = SessionLocal()
    try:
        truncate_application_tables(db)
        counts: dict[str, int] = {}
        counts.update(seed_roles_permissions(db))
        users = seed_users(db)
        organizations = seed_organizations(db, users)
        counts["users"] = len(users)
        counts["organizations"] = len(organizations)
        counts["organization_members"] = seed_memberships(db, users, organizations)
        counts.update(seed_plans_products(db))
        counts["courses"] = seed_courses(db, organizations)
        counts["subscriptions"] = seed_subscriptions(db, organizations)
        counts["invitations"] = seed_invitation(db, users, organizations)
        counts["audit_logs"] = seed_audit_logs(db, users, organizations)

        db.commit()
        print("Role matrix reset + seed completed.")
        for key in sorted(counts):
            print(f"  {key}: {counts[key]}")
        print(f"  password for all demo users: {PASSWORD}")
        print_summary(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
