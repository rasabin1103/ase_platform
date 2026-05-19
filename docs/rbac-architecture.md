# ASE RBAC Architecture

Enterprise multi-tenant RBAC for the ASE platform. Roles and permissions are stored in PostgreSQL and enforced on the API; the SPA uses the same matrix for navigation and action visibility.

## Scopes

| Scope | Description |
|-------|-------------|
| `platform` | Global operations (`super_admin`). Not limited by tenant header. |
| `organization` | Enterprise tenant (`org_owner`, `org_admin`, `member`, legacy `viewer`). |
| `personal_workspace` | Individual workspace (`independent_user`). |

## Official roles

| Code | Scope | Summary |
|------|-------|---------|
| `super_admin` | platform | Full platform access, all tenants, global catalog and audit. |
| `org_owner` | organization | Owner of one organization: users, billing, products, courses, requests approval. |
| `org_admin` | organization | Operator: assign products/courses, read users, create requests. No user create/delete or critical billing. |
| `member` | organization | Consumer: read assigned resources, create access requests, update own profile. |
| `independent_user` | personal_workspace | Consumer in personal workspace: read catalog, request access, manage own billing; **cannot** create products/courses. May apply to become `content_creator`. |
| `content_creator` | personal_workspace | Approved creator: draft own courses/products; publication requires super admin review. |
| `viewer` | organization | **Legacy only** — not assigned by new seeds; kept for existing data. |

Source of truth: `ase_backend/app/core/rbac.py` (`ROLE_PERMISSIONS`, `ROLE_DEFINITIONS`).

## Permissions

Granular codes follow `module.action` (e.g. `users.create`, `products.assign`). Legacy codes `users.write` and `organizations.write` remain in the database and are expanded at check time for backward compatibility.

Categories: platform, organizations, users, roles, products, courses, resources, subscriptions, billing, audit, requests, profile.

## Tenant isolation

1. API calls from the SPA send `X-Organization-UUID` (see `auth.store`).
2. `require_permission` resolves organization from header/path/query and checks `member_roles` → `role_permissions` for that org only.
3. `super_admin` bypasses permission checks but should still pass org context for tenant-scoped list endpoints when impersonation is not active.
4. `require_same_organization` / `require_tenant_context` block cross-tenant row access.

## Creator application workflow

1. `independent_user` submits `POST /api/v1/access-requests/creator-application` (`creator.request`).
2. Request types: `creator_application`, `product_creator_application`, `course_creator_application`.
3. `super_admin` approves via `POST /api/v1/access-requests/{id}/approve` (`creator.approve`).
4. On approval, role `content_creator` is assigned on the user's personal workspace membership.
5. `content_creator` may create courses (owner_user, `draft`) and products (`inactive` draft) via `courses.create_own` / `products.create_own`.
6. Setting `published` / `active` without super admin returns **403**.

## Requests workflow

Table: `access_requests`

- **Create**: `requests.create` (member, org_admin).
- **List/read**: `requests.read`.
- **Approve/reject**: `requests.approve` (org_owner).
- **Manage**: `requests.manage` (org_owner).

Statuses: `pending`, `approved`, `rejected`, `cancelled`.

## Resource assignments

Table: `resource_assignments`

Generic assignments (`resource_type`, `resource_id`) to users within an organization (or personal workspace when `organization_id` is null).

- **Assign/revoke**: `resources.assign` (and `products.assign` / `courses.assign` where applicable).
- **Read**: `resources.read`.

## Frontend

- `ase_frontend/src/rbac/config.ts` — nav routes per role, action → permission map.
- `useRbac()` — exposes `can(action)`, filtered `navGroups`, `primary_role` from `/auth/me`.
- `<Can action="…">` — hides buttons without permission.

`/auth/me` returns `role_codes`, `permissions`, `primary_role`, `is_superuser`, `is_independent_user`.

## Demo seed

```bash
cd ase_backend
python scripts/seed_initial_data.py
python scripts/seed_demo_rbac.py
```

Demo users (password from `DEMO_SEED_PASSWORD` in `.env`, default `ChangeMeDemo123!`):

| Email | Role |
|-------|------|
| rasabin01@gmail.com | super_admin |
| rasabin02@gmail.com | org_owner |
| rasabin03@gmail.com | org_admin |
| rasabin04@gmail.com | member |
| rasabin05@gmail.com | independent_user |

## Validation

```bash
python scripts/check_rbac_consistency.py
```

Checks role/permission matrix sync, required roles, and documents expected nav/actions per role.
