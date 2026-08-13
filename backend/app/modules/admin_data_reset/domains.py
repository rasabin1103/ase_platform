from __future__ import annotations

from dataclasses import dataclass

# --------------------------------------------------------------------------
# Pre-launch "danger zone" data reset.
#
# Every table in the schema falls into exactly one of three buckets:
#
# 1. PLAIN data domains (`DATA_DOMAINS` with special=None): pure
#    user-generated/product data. Wiped with `TRUNCATE ... CASCADE`, which
#    also cascades to any other table with a FK pointing at them (that
#    closure is computed live from Postgres' catalogs in service.py, not
#    hand-maintained here, so the UI preview can never drift from reality).
#
# 2. SPECIAL domains ("organizations", "users"): the two tables that make
#    someone a "super admin" in the first place. Wiped via a preserving
#    DELETE (keep one row) instead of TRUNCATE, in a fixed order (see
#    service.py) so the acting super admin's own login, organization and
#    role assignment survive the reset.
#
# 3. PROTECTED tables (never targeted directly, by name, by this feature):
#    roles / permissions / role_permissions define the RBAC system itself
#    (not "data" — wiping them would strip *every* admin, including the one
#    running the reset, of their role). organization_members / member_roles
#    are the join tables that link a user to their organization and role —
#    they're fully governed by the "organizations"/"users" special domains
#    (whatever survives those, survives here too) rather than exposed as
#    their own delete button, precisely to avoid a click that accidentally
#    strips the super admin's own role. alembic_version is schema-migration
#    bookkeeping, not application data, and is never referenced at all.
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class DataDomain:
    key: str
    label: str
    tables: tuple[str, ...]
    special: str | None = None  # None | "preserve_super_admin_org" | "preserve_super_admin_user"

    @property
    def confirm_phrase(self) -> str:
        return f"ELIMINAR {self.label.upper()}"


DATA_DOMAINS: tuple[DataDomain, ...] = (
    DataDomain("catalog_items", "Catálogo (productos, cursos, libros y recursos)", ("catalog_items", "catalog_item_images")),
    DataDomain("catalog_categories", "Categorías de catálogo", ("catalog_categories",)),
    DataDomain(
        "catalog_engagement",
        "Compras, favoritos y valoraciones del catálogo",
        ("catalog_purchases", "catalog_favorites", "catalog_item_ratings"),
    ),
    DataDomain("org_catalog_access", "Acceso de organizaciones al catálogo", ("organization_catalog_items",)),
    DataDomain("courses", "Cursos e inscripciones", ("courses", "course_enrollments")),
    DataDomain("blog", "Blog", ("blog_posts",)),
    DataDomain("plans", "Planes de precios", ("plans", "plan_features", "plan_products", "plan_catalog_items")),
    DataDomain("products", "Productos (acceso a módulos)", ("products",)),
    DataDomain("services", "Servicios", ("services", "service_features", "service_highlights")),
    DataDomain(
        "org_requests",
        "Solicitudes e invitaciones de organización",
        ("organization_join_requests", "organization_member_invites"),
    ),
    DataDomain("access_requests", "Solicitudes de acceso", ("access_requests",)),
    DataDomain("resource_assignments", "Asignaciones de recursos", ("resource_assignments",)),
    DataDomain("invitations", "Invitaciones generales", ("invitations",)),
    DataDomain("subscriptions", "Suscripciones", ("subscriptions",)),
    DataDomain("book_redemptions", "Canjes de libros / repositorios", ("book_repo_redemptions",)),
    DataDomain("notifications", "Notificaciones", ("notifications",)),
    DataDomain("suggestions", "Sugerencias", ("suggestions",)),
    DataDomain("testimonials", "Testimonios", ("testimonials",)),
    DataDomain("case_studies", "Casos de éxito", ("case_studies",)),
    DataDomain("team_members", "Equipo (página pública)", ("team_members",)),
    DataDomain("audit_logs", "Registros de auditoría", ("audit_logs",)),
    DataDomain("error_logs", "Registros de errores", ("error_logs",)),
    DataDomain("user_links", "Enlaces de perfil de usuario", ("user_links",)),
    DataDomain("user_verification_tokens", "Tokens de verificación", ("user_verification_tokens",)),
    DataDomain(
        "organizations",
        "Organizaciones (todas excepto la tuya)",
        ("organizations",),
        special="preserve_super_admin_org",
    ),
    DataDomain(
        "users",
        "Usuarios (todos excepto tú)",
        ("users",),
        special="preserve_super_admin_user",
    ),
)

DATA_DOMAINS_BY_KEY: dict[str, DataDomain] = {d.key: d for d in DATA_DOMAINS}

PLAIN_DOMAINS: tuple[DataDomain, ...] = tuple(d for d in DATA_DOMAINS if d.special is None)

# Tables this feature will never truncate or delete from directly, no matter
# what is requested — see the module docstring above for why each one is here.
PROTECTED_TABLES: frozenset[str] = frozenset(
    {"roles", "permissions", "role_permissions", "organization_members", "member_roles", "alembic_version"}
)

MASTER_CONFIRM_PHRASE = "ELIMINAR TODO"
