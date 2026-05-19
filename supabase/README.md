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

These files document the schema and can be applied on empty databases. The **complete** schema (phone fields, creator flags, binary images, etc.) is defined in `ase_backend/alembic/versions/` — run Alembic for parity with the app.

## `seed.sql`

Reference / supplemental seed data. For bcrypt-hashed users and idempotent catalog seeding, prefer:

```powershell
.venv\Scripts\python.exe scripts\database\seed_all.py
```

Set `DEMO_SEED_PASSWORD` in `ase_backend/.env` (see `.env.example`).
