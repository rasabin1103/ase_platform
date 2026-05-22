# Supabase / PostgreSQL reference

This folder supports **optional** Supabase or raw PostgreSQL workflows.

## Recommended (ASE backend)

Use Alembic + Python seeds in `ase_backend/`:

```powershell
cd ase_backend
.venv\Scripts\alembic.exe upgrade head
.venv\Scripts\python.exe scripts\database\seed_all.py
```

## `migrations/`

Ordered SQL snapshots for core MVP entities:

1. Users & RBAC (roles, permissions, organizations, members)
2. Catalog items
3. Favorites & purchases
4. Access requests
5. Catalog pricing plans
6. Catalog media / external links
7. **user_platform_roles** (independent users without org on register)

These files document the schema and can be applied on empty databases. The **complete** schema is defined in `backend/alembic/versions/` — **always run Alembic against production `DATABASE_URL`** after deploy:

```powershell
cd backend
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe scripts\maintenance\show_db_target.py
```

If production was updated only via SQL files here and not Alembic, you can apply `00007_user_platform_roles.sql` in the Supabase SQL editor instead.

## `seed.sql`

Reference / supplemental seed data. For bcrypt-hashed users and idempotent catalog seeding, prefer:

```powershell
.venv\Scripts\python.exe scripts\database\seed_all.py
```

Set `DEMO_SEED_PASSWORD` in `ase_backend/.env` (see `.env.example`).
