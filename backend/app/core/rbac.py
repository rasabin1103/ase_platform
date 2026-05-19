"""Enterprise RBAC constants, role-permission matrix, and permission expansion for legacy codes."""

from __future__ import annotations

from app.core.config import settings
from app.core.rbac_mvp import (
    MVP_PERMISSION_CODES,
    MVP_PRIMARY_ROLE_PRIORITY,
    MVP_ROLE_CODES,
    MVP_ROLE_DEFINITIONS,
    MVP_ROLE_PERMISSIONS,
)
from app.models.enums import RoleScope

OFFICIAL_ROLE_CODES: frozenset[str] = (
    MVP_ROLE_CODES
    if settings.MVP_MODE
    else frozenset(
        {
            "super_admin",
            "org_owner",
            "org_admin",
            "member",
            "independent_user",
            "content_creator",
        }
    )
)

LEGACY_ROLE_CODES: frozenset[str] = frozenset({"viewer"})

_MVP_EXTRA_PERMISSIONS: frozenset[str] = frozenset(
    {
        "catalog.read",
        "catalog.manage",
        "favorites.manage_own",
        "purchases.manage_own",
        "purchases.read_all",
    }
)

ALL_PERMISSION_CODES: frozenset[str] = (
    MVP_PERMISSION_CODES
    if settings.MVP_MODE
    else frozenset(
    {
        "platform.manage",
        "platform.read",
        "organizations.read",
        "organizations.create",
        "organizations.update",
        "organizations.delete",
        "users.read",
        "users.create",
        "users.update",
        "users.delete",
        "roles.assign",
        "products.read",
        "products.assign",
        "products.manage",
        "products.create",
        "products.update",
        "products.delete",
        "products.create_own",
        "products.update_own",
        "courses.read",
        "courses.assign",
        "courses.manage",
        "courses.create",
        "courses.update",
        "courses.delete",
        "courses.create_own",
        "courses.update_own",
        "resources.read",
        "resources.assign",
        "resources.manage",
        "subscriptions.read",
        "subscriptions.manage",
        "subscriptions.manage_own",
        "billing.read",
        "billing.manage",
        "billing.read_own",
        "billing.manage_own",
        "audit.read",
        "requests.read",
        "requests.read_own",
        "requests.create",
        "requests.approve",
        "requests.manage",
        "creator.request",
        "creator.read_own",
        "creator.approve",
        "creator.manage",
        "content.submit_for_review",
        "profile.update_self",
        "users.write",
        "organizations.write",
    }
    ) | _MVP_EXTRA_PERMISSIONS
)

ROLE_DEFINITIONS: dict[str, dict] = {
    "super_admin": {
        "name": "Super Admin",
        "scope": RoleScope.platform,
        "description": "Platform-wide administrator with unrestricted access.",
    },
    "org_owner": {
        "name": "Organization Owner",
        "scope": RoleScope.organization,
        "description": "Owner of a single organization with full org-scoped control.",
    },
    "org_admin": {
        "name": "Organization Admin",
        "scope": RoleScope.organization,
        "description": "Internal operator with limited org administration.",
    },
    "member": {
        "name": "Member",
        "scope": RoleScope.organization,
        "description": "Organization consumer with read and request access.",
    },
    "independent_user": {
        "name": "Independent User",
        "scope": RoleScope.personal_workspace,
        "description": "Personal workspace consumer; may apply to become a content creator.",
    },
    "content_creator": {
        "name": "Content Creator",
        "scope": RoleScope.personal_workspace,
        "description": "Approved creator of own course/product drafts pending platform review.",
    },
    "viewer": {
        "name": "Viewer",
        "scope": RoleScope.organization,
        "description": "Legacy read-only role (deprecated for new assignments).",
    },
}

ROLE_PERMISSIONS: dict[str, frozenset[str]] = (
    dict(MVP_ROLE_PERMISSIONS)
    if settings.MVP_MODE
    else {
    "super_admin": ALL_PERMISSION_CODES,
    "org_owner": frozenset(
        {
            "organizations.read",
            "organizations.update",
            "users.read",
            "users.create",
            "users.update",
            "users.delete",
            "roles.assign",
            "products.read",
            "products.assign",
            "products.manage",
            "courses.read",
            "courses.assign",
            "courses.manage",
            "resources.read",
            "resources.assign",
            "resources.manage",
            "subscriptions.read",
            "subscriptions.manage",
            "billing.read",
            "billing.manage",
            "audit.read",
            "requests.read",
            "requests.approve",
            "requests.manage",
            "profile.update_self",
        }
    ),
    "org_admin": frozenset(
        {
            "organizations.read",
            "users.read",
            "users.update",
            "products.read",
            "products.assign",
            "courses.read",
            "courses.assign",
            "resources.read",
            "resources.assign",
            "subscriptions.read",
            "requests.read",
            "requests.create",
            "profile.update_self",
        }
    ),
    "member": frozenset(
        {
            "organizations.read",
            "products.read",
            "courses.read",
            "resources.read",
            "requests.read",
            "requests.create",
            "profile.update_self",
        }
    ),
    "independent_user": frozenset(
        {
            "products.read",
            "courses.read",
            "resources.read",
            "requests.create",
            "requests.read_own",
            "subscriptions.read",
            "subscriptions.manage_own",
            "billing.read_own",
            "billing.manage_own",
            "creator.request",
            "creator.read_own",
            "profile.update_self",
        }
    ),
    "content_creator": frozenset(
        {
            "products.read",
            "products.create_own",
            "products.update_own",
            "courses.read",
            "courses.create_own",
            "courses.update_own",
            "content.submit_for_review",
            "requests.create",
            "requests.read_own",
            "creator.read_own",
            "profile.update_self",
        }
    ),
    "viewer": frozenset(
        {
            "organizations.read",
            "products.read",
            "courses.read",
            "resources.read",
            "audit.read",
            "profile.update_self",
        }
    ),
}
)

if settings.MVP_MODE:
    ROLE_DEFINITIONS.update(MVP_ROLE_DEFINITIONS)

_PERMISSION_EXPANSION: dict[str, frozenset[str]] = {
    "users.write": frozenset({"users.create", "users.update", "users.delete"}),
    "organizations.write": frozenset(
        {"organizations.create", "organizations.update", "organizations.delete"}
    ),
    "users.create": frozenset({"users.write"}),
    "users.update": frozenset({"users.write"}),
    "users.delete": frozenset({"users.write"}),
    "organizations.create": frozenset({"organizations.write"}),
    "organizations.update": frozenset({"organizations.write"}),
    "organizations.delete": frozenset({"organizations.write"}),
    "products.manage": frozenset({"products.assign", "products.create", "products.update", "products.delete"}),
    "products.assign": frozenset({"products.manage"}),
    "products.create": frozenset({"products.manage"}),
    "products.update": frozenset({"products.manage"}),
    "products.delete": frozenset({"products.manage"}),
    "courses.manage": frozenset({"courses.assign", "courses.create", "courses.update", "courses.delete"}),
    "courses.assign": frozenset({"courses.manage"}),
    "courses.create": frozenset({"courses.manage"}),
    "courses.update": frozenset({"courses.manage"}),
    "courses.delete": frozenset({"courses.manage"}),
    "resources.manage": frozenset({"resources.assign"}),
    "resources.assign": frozenset({"resources.manage"}),
    "subscriptions.manage": frozenset({"billing.manage", "subscriptions.manage_own"}),
    "billing.manage": frozenset({"subscriptions.manage", "billing.manage_own"}),
    "subscriptions.read": frozenset({"billing.read", "billing.read_own"}),
    "billing.read": frozenset({"subscriptions.read", "billing.read_own"}),
    "subscriptions.manage_own": frozenset({"subscriptions.manage"}),
    "billing.manage_own": frozenset({"billing.manage"}),
    "billing.read_own": frozenset({"billing.read"}),
    "requests.read": frozenset({"requests.read_own", "creator.read_own"}),
    "requests.read_own": frozenset({"requests.read", "creator.read_own"}),
    "creator.read_own": frozenset({"requests.read_own"}),
    "requests.create": frozenset({"creator.request"}),
    "creator.request": frozenset({"requests.create"}),
    "requests.approve": frozenset({"creator.approve"}),
    "creator.approve": frozenset({"requests.approve", "creator.manage"}),
    "creator.manage": frozenset({"creator.approve"}),
}

PERMISSION_METADATA: dict[str, dict[str, str]] = {
    "platform.manage": {"name": "Manage platform", "module": "platform"},
    "platform.read": {"name": "Read platform", "module": "platform"},
    "organizations.read": {"name": "Read organizations", "module": "organizations"},
    "organizations.create": {"name": "Create organizations", "module": "organizations"},
    "organizations.update": {"name": "Update organizations", "module": "organizations"},
    "organizations.delete": {"name": "Delete organizations", "module": "organizations"},
    "users.read": {"name": "Read users", "module": "users"},
    "users.create": {"name": "Create users", "module": "users"},
    "users.update": {"name": "Update users", "module": "users"},
    "users.delete": {"name": "Delete users", "module": "users"},
    "roles.assign": {"name": "Assign roles", "module": "roles"},
    "products.read": {"name": "Read products", "module": "products"},
    "products.assign": {"name": "Assign products", "module": "products"},
    "products.manage": {"name": "Manage products", "module": "products"},
    "products.create": {"name": "Create products (catalog)", "module": "products"},
    "products.update": {"name": "Update products (catalog)", "module": "products"},
    "products.delete": {"name": "Delete products (catalog)", "module": "products"},
    "products.create_own": {"name": "Create own products (draft)", "module": "products"},
    "products.update_own": {"name": "Update own products", "module": "products"},
    "courses.read": {"name": "Read courses", "module": "courses"},
    "courses.assign": {"name": "Assign courses", "module": "courses"},
    "courses.manage": {"name": "Manage courses", "module": "courses"},
    "courses.create": {"name": "Create courses (org)", "module": "courses"},
    "courses.update": {"name": "Update courses (org)", "module": "courses"},
    "courses.delete": {"name": "Delete courses (org)", "module": "courses"},
    "courses.create_own": {"name": "Create own courses (draft)", "module": "courses"},
    "courses.update_own": {"name": "Update own courses", "module": "courses"},
    "resources.read": {"name": "Read resources", "module": "resources"},
    "resources.assign": {"name": "Assign resources", "module": "resources"},
    "resources.manage": {"name": "Manage resources", "module": "resources"},
    "subscriptions.read": {"name": "Read subscriptions", "module": "subscriptions"},
    "subscriptions.manage": {"name": "Manage subscriptions", "module": "subscriptions"},
    "subscriptions.manage_own": {"name": "Manage own subscriptions", "module": "subscriptions"},
    "billing.read": {"name": "Read billing", "module": "billing"},
    "billing.manage": {"name": "Manage billing", "module": "billing"},
    "billing.read_own": {"name": "Read own billing", "module": "billing"},
    "billing.manage_own": {"name": "Manage own billing", "module": "billing"},
    "audit.read": {"name": "Read audit logs", "module": "audit"},
    "requests.read": {"name": "Read all requests", "module": "requests"},
    "requests.read_own": {"name": "Read own requests", "module": "requests"},
    "requests.create": {"name": "Create requests", "module": "requests"},
    "requests.approve": {"name": "Approve requests", "module": "requests"},
    "requests.manage": {"name": "Manage requests", "module": "requests"},
    "creator.request": {"name": "Request creator status", "module": "creator"},
    "creator.read_own": {"name": "Read own creator applications", "module": "creator"},
    "creator.approve": {"name": "Approve creator applications", "module": "creator"},
    "creator.manage": {"name": "Manage creator program", "module": "creator"},
    "content.submit_for_review": {"name": "Submit content for review", "module": "content"},
    "profile.update_self": {"name": "Update own profile", "module": "profile"},
    "catalog.read": {"name": "Read catalog", "module": "catalog"},
    "catalog.manage": {"name": "Manage catalog", "module": "catalog"},
    "favorites.manage_own": {"name": "Manage own favorites", "module": "catalog"},
    "purchases.manage_own": {"name": "Manage own purchases", "module": "catalog"},
    "purchases.read_all": {"name": "Read all purchases", "module": "catalog"},
    "users.write": {"name": "Write users (legacy)", "module": "users"},
    "organizations.write": {"name": "Write organizations (legacy)", "module": "organizations"},
}


def expand_permission_codes(permission_code: str) -> frozenset[str]:
    expanded: set[str] = {permission_code}
    expanded.update(_PERMISSION_EXPANSION.get(permission_code, frozenset()))
    for alt in expanded.copy():
        expanded.update(_PERMISSION_EXPANSION.get(alt, frozenset()))
    return frozenset(expanded)


def resolve_primary_role(role_codes: list[str]) -> str | None:
    priority = MVP_PRIMARY_ROLE_PRIORITY if settings.MVP_MODE else (
        "super_admin",
        "org_owner",
        "org_admin",
        "content_creator",
        "independent_user",
        "member",
        "viewer",
    )
    codes = set(role_codes)
    for code in priority:
        if code in codes:
            return code
    return role_codes[0] if role_codes else None
