# 0001 — Two-role MVP RBAC on top of a full multi-tenant schema

## Context

The long-term product vision is multi-tenant: organizations, org-scoped roles (`org_owner`, `org_admin`, `member`), a personal-workspace role (`independent_user`), and a creator-application workflow (`content_creator`). The MVP that actually ships only needs two roles: `super_admin` (platform operator) and `independent_user` (self-service consumer).

## Decision

Keep the full RBAC schema (`Organization`, `OrganizationMember`, `Role`, `MemberRole`, `Permission`, `RolePermission`) and the full permission matrix in `app/core/rbac.py`, but gate which roles/routers are actually reachable behind `MVP_MODE` (default `true`):
- `app/core/rbac_mvp.py` defines a restricted `MVP_ROLE_CODES = {"super_admin", "independent_user"}` and its own permission set, used wherever the app checks roles under MVP mode.
- `app/main.py` omits an entire list of routers (`organizations`, `roles`, `subscriptions`, `courses`, `onboarding`, etc. — `_MVP_HIDDEN_ROUTERS`) from the app when `MVP_MODE=true`, rather than just permission-gating them.
- New admin features added later (blog, catalog categories) reuse the existing `catalog.manage` permission code instead of inventing new ones, since `require_permission()` bypasses the specific code for `super_admin` anyway, and no other role needs to reach them under MVP mode.

## Alternatives considered

- **Build a separate, simpler MVP-only schema** and migrate to multi-tenant later. Rejected: guarantees a painful data migration and a second RBAC implementation to keep in sync in the meantime.
- **Permission-gate every route instead of omitting routers.** Rejected as the sole mechanism: a hidden router is a stronger guarantee (the route doesn't exist in OpenAPI, can't be hit even if a permission check has a bug) than relying solely on the permission layer being correct everywhere.

## Consequences

- Turning on the full multi-tenant product later is a config flip (`MVP_MODE=false`) plus re-enabling routers, not a rewrite — the schema and permission matrix already support it.
- Two RBAC sources of truth exist side by side (`rbac.py` full matrix, `rbac_mvp.py` restricted set) — a change to role/permission semantics has to be checked against both, and it's easy to update one and forget the other.
- Anyone reading the RBAC code for the first time needs to know which mode is active to understand what's actually reachable; documented in `docs/rbac-architecture.md`.
