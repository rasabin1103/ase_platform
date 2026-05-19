# Database

## Source of truth (local dev)

Schema migrations are managed with **Alembic** in `ase_backend/alembic/versions/`.

```powershell
cd ase_backend
.venv\Scripts\alembic.exe upgrade head
```

## Scripts (`ase_backend/scripts/database`)

| Script | Purpose |
|--------|---------|
| `reset_database.py` | Drop schema via Alembic downgrade + upgrade |
| `seed_roles.py` | MVP roles & permissions |
| `seed_users.py` | Demo users (super_admin, independent_user) |
| `seed_catalog.py` | Demo catalog items |
| `seed_all.py` | Roles → users → catalog |

Fresh setup:

```powershell
cd ase_backend
.venv\Scripts\python.exe scripts\database\reset_database.py
.venv\Scripts\python.exe scripts\database\seed_all.py
```

Set `DEMO_SEED_PASSWORD` in `.env` before seeding (default in `.env.example`: `ChangeMeDemo123!`).

## Supabase SQL (`supabase/`)

The `supabase/migrations/` folder contains **reference SQL** for core MVP tables (users, RBAC, catalog, favorites, purchases, access_requests).

For a full schema matching the running app, always run Alembic. Use Supabase SQL when deploying to Supabase Postgres without Alembic, or as documentation.

`supabase/seed.sql` provides optional reference data; **recommended seed path** remains Python `seed_all.py` (bcrypt passwords, idempotent logic).
