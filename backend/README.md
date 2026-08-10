# ASE Backend

FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL. **MVP mode** (`MVP_MODE=true`) exposes auth, users, catalog, access requests, audit logs, health, and related routes; full multi-tenant routers load when `MVP_MODE=false`.

## Layered layout

| Layer | Responsibility |
|-------|----------------|
| **`app/core/`** | Settings (`config.py`), DB engine (`database.py`), URL helpers (`db_url.py`), RBAC constants (`rbac*.py`), media helpers, **`security.py`** (JWT + bcrypt), **`exceptions.py`**. |
| **`app/modules/<domain>/router.py`** | HTTP routes only — dependencies, status codes, thin orchestration. |
| **`app/modules/<domain>/service.py`** | Business rules (when present). |
| **`app/modules/<domain>/repository.py`** | SQLAlchemy queries (when present). |
| **`app/modules/<domain>/schemas.py`** | Pydantic request/response models. |
| **`app/modules/auth/dependencies.py`** | `get_current_user`, RBAC helpers, `require_permission`, etc. |
| **`app/models/`** | ORM models shared across modules. |

**Catalog:** `app/modules/catalog/router.py` composes consumer + admin catalog routers (same URL prefixes as before). Implementations remain in `consumer_catalog/` and `catalog_admin/` until a deeper merge.

**Access requests (MVP):** `app/modules/mvp_access_requests/` (`router_me`, `router_admin`, service, repository, schemas).

## Environment

Copy `.env.example` → `.env`. The application reads **only `DATABASE_URL`** for Postgres (local Docker, Railway, Supabase pooler, etc.). Do **not** commit `.env`.

Important variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLAlchemy URL (`postgresql+psycopg://…`). `postgres://` is normalized automatically. |
| `JWT_SECRET_KEY` | HS256 signing secret — **must be identical** on every API replica. |
| `JWT_ALGORITHM` | Default `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | JWT lifetimes. |
| `CORS_ALLOW_ORIGINS` | Comma-separated SPA origins (required for browser clients on another host). |
| `MVP_MODE` | `true` = slim router set. |
| `DEMO_SEED_PASSWORD` | Optional; used only by seed scripts for demo users. |

Logs never print secrets or full JWTs.

## Local run

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

- OpenAPI: `http://127.0.0.1:8000/docs`
- Health: `GET /health`, `GET /health/db`

## Supabase (PostgreSQL)

1. In Supabase: **Project Settings → Database → Connection string** — prefer **Session pooler** (port `6543`) on Windows if direct `5432` fails.
2. Set `DATABASE_URL` in `.env` to that URI (SSL is enforced automatically for remote hosts in `app/core/db_url.py`).
3. JWTs are **issued by this API**, not Supabase Auth, unless you integrate that separately.

## Seeds & scripts

See **[scripts/README.md](scripts/README.md)** and **[scripts/database/README.md](scripts/database/README.md)**.

Quick MVP seed (from `backend/`):

```powershell
.\.venv\Scripts\python.exe scripts\database\seed_all.py
```

## Docker

```bash
docker build -t ase-api ./backend
docker run --env-file backend/.env -p 8000:8000 ase-api
```

`Dockerfile` is minimal; add migration steps in your deploy pipeline if needed (`alembic upgrade head` before traffic).

## Railway

1. Set the same env vars as in `.env.example` (use Railway **Variables** / secrets).
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (Railway sets `PORT`).
3. Run Alembic migrations as a **release phase** or one-off job against the same `DATABASE_URL`.
4. Set `CORS_ALLOW_ORIGINS` to your Vercel / production frontend origin.

## Primary API prefixes (MVP)

| Area | Prefix |
|------|--------|
| Health | `/health`, `/health/db` |
| Auth | `/api/v1/auth` (login, refresh, `/me`, workspaces, …) |
| Users | `/api/v1/users` |
| Consumer catalog | `/api/v1/consumer-catalog` |
| Admin catalog | `/api/v1/admin/catalog` |
| Me access requests | `/api/v1/me/access-requests` |
| Admin access requests | `/api/v1/admin/access-requests` |

## Tests

```powershell
cd backend
.\.venv\Scripts\pytest.exe -q
```
