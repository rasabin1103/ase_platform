# ASE database scripts (MVP)

Scripts to reset and seed the MVP database (roles: `super_admin`, `independent_user`).

## Prerequisites

- PostgreSQL running and `DATABASE_URL` (or `POSTGRES_*`) set in `ase_backend/.env`
- Virtualenv with dependencies: `ase_backend/.venv`

## Commands

From `ase_backend`:

```powershell
# 1. Drop & recreate schema (destructive)
.venv\Scripts\python.exe scripts\database\reset_database.py

# 1b. Truncate data only (keeps schema)
.venv\Scripts\python.exe scripts\database\truncate_data.py

# 2. Apply migrations only (if DB already exists)
.venv\Scripts\alembic.exe upgrade head

# 3. Seed roles & permissions (idempotent)
.venv\Scripts\python.exe scripts\database\seed_roles.py

# 4. Seed demo users (super admin + independent)
.venv\Scripts\python.exe scripts\database\seed_users.py

# 5. Seed demo catalog (product, course, book, resource)
.venv\Scripts\python.exe scripts\database\seed_catalog.py

# All-in-one (after reset + upgrade)
.venv\Scripts\python.exe scripts\database\seed_all.py
```

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `rasabin01@gmail.com` | value of `DEMO_SEED_PASSWORD` in `.env` | `super_admin` |
| `rasabin05@gmail.com` | value of `DEMO_SEED_PASSWORD` in `.env` | `independent_user` |

Default password in `.env.example`: `ChangeMeDemo123!`

## Full fresh setup

```powershell
cd ase_backend
.venv\Scripts\python.exe scripts\database\reset_database.py
.venv\Scripts\python.exe scripts\database\seed_all.py
```
