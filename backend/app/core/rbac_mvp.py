"""MVP RBAC: only super_admin and independent_user are active in the product."""

from __future__ import annotations

from app.models.enums import RoleScope

MVP_ROLE_CODES: frozenset[str] = frozenset({"super_admin", "independent_user"})

MVP_PERMISSION_CODES: frozenset[str] = frozenset(
    {
        "platform.read",
        "users.read",
        "users.create",
        "users.update",
        "catalog.read",
        "catalog.manage",
        "favorites.manage_own",
        "purchases.manage_own",
        "purchases.read_all",
        "requests.read",
        "requests.read_own",
        "requests.create",
        "requests.approve",
        "profile.update_self",
    }
)

MVP_ROLE_DEFINITIONS: dict[str, dict] = {
    "super_admin": {
        "name": "Super Admin",
        "scope": RoleScope.platform,
        "description": "Platform administrator: catalog, users, requests, metrics.",
    },
    "independent_user": {
        "name": "Independent User",
        "scope": RoleScope.personal_workspace,
        "description": "Consumer: browse catalog, favorites, purchases, and access requests.",
    },
}

MVP_ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "super_admin": MVP_PERMISSION_CODES,
    "independent_user": frozenset(
        {
            "catalog.read",
            "favorites.manage_own",
            "purchases.manage_own",
            "requests.create",
            "requests.read_own",
            "profile.update_self",
        }
    ),
}

MVP_PRIMARY_ROLE_PRIORITY: tuple[str, ...] = ("super_admin", "independent_user")
