# ASE — Arce Sabin Engineering

MVP marketplace platform: **independent users** browse the catalog (courses, books, products, resources, services) and the public blog, manage favorites/purchases, and submit access requests; **super admins** manage the catalog (including dynamic categories with custom fields), the blog, users, account lifecycle, and error logs.

## Repository layout

```
ase_platform/
├── frontend/          # React + Vite + TypeScript
├── backend/           # FastAPI + SQLAlchemy + Alembic
├── supabase/
│   ├── migrations/      # Reference SQL (core tables)
│   └── seed.sql         # Optional reference seed
├── docs/                # Database, RBAC & deployment guides
└── scripts/             # Legacy helpers → prefer backend/scripts/database
```

## Feature highlights

- **Catalog** — courses, books, products, resources, services; admin-managed dynamic categories with per-category custom field schemas (`/admin/catalog-categories`).
- **Blog** — public blog with a TipTap-based rich text editor in the admin panel; published content is HTML-sanitized server-side on every write.
- **Auth** — JWT access/refresh tokens, email verification, password reset, optional TOTP-based 2FA, per-account brute-force lockout, and an automated account-lifecycle policy (2FA grace period → inactivity suspension → soft-delete) that runs on a daily in-process scheduler.
- **Observability** — every unhandled backend error is logged to an in-app `error_logs` table (visible from the admin panel) and, if configured, forwarded to Sentry (backend and frontend). Optional Redis-backed rate limiting for multi-replica deploys.
- **Security** — HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options, CSP) on every response.
- **Performance** — the frontend is code-split per route; the main bundle is ~190 KB gzipped rather than one monolithic bundle.
- **Tests** — pytest (backend, isolated `TEST_DATABASE_URL`) and Vitest + React Testing Library (frontend).

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for how to configure SMTP, Sentry, Redis, and the account-lifecycle policy in a real deployment.

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, TypeScript, TanStack Query, Tailwind |
| Backend | FastAPI, SQLAlchemy 2, Alembic, JWT auth |
| Database | PostgreSQL 16 |
| Dev ops | Docker Compose (Postgres + pgAdmin) |

## Prerequisites

- Node.js 20+
- Python 3.12+
- Docker Desktop (for local Postgres)
- Git

## Quick start (local)

### 1. Environment files

```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Edit `backend\.env`: set `JWT_SECRET_KEY` and `POSTGRES_PASSWORD` / `DATABASE_URL` if needed.

### 2. Database (Docker + migrations + seed)

```powershell
cd backend
docker compose up -d
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe scripts\database\seed_all.py
```

Or use the dev script (venv, compose, uvicorn):

```powershell
cd backend
.\dev.ps1
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:8000  
- API docs: http://localhost:8000/docs  

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super admin | `rasabin01@gmail.com` | `DEMO_SEED_PASSWORD` from `.env` (default `ChangeMeDemo123!`) |
| Independent | `rasabin05@gmail.com` | same |

## Environment variables

### Backend (`backend/.env`)

See [backend/.env.example](backend/.env.example):

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET_KEY` — **required** strong secret in production
- `MVP_MODE` — `true` hides legacy multi-tenant routes
- `DEMO_SEED_PASSWORD` — local demo user password for seed scripts only
- `SMTP_*` — transactional email (password reset, email verification, account-lifecycle notices). Optional; sending is skipped if `SMTP_HOST` is empty.
- `SENTRY_DSN` — optional backend error monitoring.
- `REDIS_URL` — optional shared storage for the login/register rate limiter (needed once you run more than one backend replica).
- `TWO_FACTOR_GRACE_DAYS`, `INACTIVITY_SUSPEND_DAYS`, `SUSPENDED_DELETE_DAYS`, `ACCOUNT_LIFECYCLE_SWEEP_ENABLED` — the automated account-lifecycle policy.

Full reference, including what each optional integration does when left unset: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Frontend (`frontend/.env`)

See [frontend/.env.example](frontend/.env.example):

- `VITE_API_URL` — e.g. `http://localhost:8000/api/v1`
- `VITE_SENTRY_DSN` — optional frontend error monitoring.

Never commit `.env` files. Do not put real `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or production DB URLs in the repo.

## Commands

### Frontend

```powershell
cd frontend
npm run dev      # development server
npm run build    # production build → dist/
npm run preview  # preview production build
```

### Backend

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\alembic.exe revision --autogenerate -m "description"
```

### Tests

```powershell
# Backend — requires a disposable TEST_DATABASE_URL (never the real DATABASE_URL,
# the suite truncates every table before each test)
cd backend
$env:TEST_DATABASE_URL = "postgresql+psycopg://ase:ase@localhost:5432/ase_test"
.\.venv\Scripts\pytest.exe

# Frontend — Vitest + React Testing Library, no external services needed
cd frontend
npm test
```

### Docker (Postgres + pgAdmin)

```powershell
cd backend
docker compose up -d
docker compose down
```

pgAdmin: http://localhost:5050 (credentials from `.env`)

### Database scripts

From `backend`:

```powershell
.\.venv\Scripts\python.exe scripts\database\reset_database.py
.\.venv\Scripts\python.exe scripts\database\seed_roles.py
.\.venv\Scripts\python.exe scripts\database\seed_users.py
.\.venv\Scripts\python.exe scripts\database\seed_catalog.py
.\.venv\Scripts\python.exe scripts\database\seed_all.py
```

Details: [backend/scripts/database/README.md](backend/scripts/database/README.md), [docs/DATABASE.md](docs/DATABASE.md).

## MVP roles

- **super_admin** — catalog (incl. categories), blog, users, account lifecycle, error logs, purchases overview, access request review
- **independent_user** — catalog, blog (read-only), favorites, purchases, requests, profile, optional 2FA

Full role/permission matrix (including the legacy multi-tenant roles used when `MVP_MODE=false`): [docs/rbac-architecture.md](docs/rbac-architecture.md).

Legacy organization/multi-tenant code remains in the repo but is disabled when `MVP_MODE=true` (default).

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## First push to GitHub

```powershell
cd d:\workspaces\ase
git init
git add .
git status   # confirm no .env or node_modules
git commit -m "Initial commit: ASE MVP marketplace"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/ase.git
git push -u origin main
```

## License

Proprietary — Arce Sabin Engineering. All rights reserved unless otherwise stated.
