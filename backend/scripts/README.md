# ASE backend scripts

Scripts here are **not** part of the FastAPI runtime. They are operated manually or in CI.

## Layout

| Path | Purpose |
|------|---------|
| `database/` | Idempotent DB seeds and helpers (see `database/README.md`). Run with `cd scripts/database` unless noted. |
| `maintenance/` | Safe checks and one-off maintenance (e.g. `check_db_connection.py`, RBAC consistency). |
| `archive/` | Old one-off generators / UI fix scripts kept for history — **do not run** in production. |
| `seeds/` | Reserved for future consolidation; official seed entrypoints still live in `scripts/` and `scripts/database/` today. |

## Official flows (local / staging)

- **Roles & permissions (MVP):** `cd scripts/database` → `python seed_roles.py`
- **Demo users / orgs:** `cd scripts/database` → `python seed_users.py`
- **Consumer catalog items:** `cd scripts/database` → `python seed_catalog.py` (or `python ../seed_consumer_catalog.py` from `database/` depending on layout — prefer `seed_all.py`)
- **All MVP seeds:** `cd scripts/database` → `python seed_all.py`
- **Full role matrix + demo (from `backend/`):** `python scripts/reset_and_seed_role_matrix.py`

## Do **not** run in production without review

- `database/reset_database.py`, `database/truncate_data.py` — destructive.
- `database/apply_missing_columns.py` — schema drift helper; run only when you understand the diff.
- Anything under `archive/`.

## Smoke checks

From `backend/` (with `.env` loaded via app config):

```bash
python scripts/maintenance/check_db_connection.py
python scripts/maintenance/check_rbac_consistency.py
```

## Environment

All app and scripts that talk to Postgres use **`DATABASE_URL` only** (see `app/core/config.py`). Docker Compose may still define `POSTGRES_*` for the **container** only; the Python app does not read those variables.
