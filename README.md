# ASE — Arce Sabin Engineering

MVP marketplace platform: **independent users** browse catalog, favorites, purchases, and access requests; **super admins** manage catalog, users, and review requests.

## Repository layout

```
ase/
├── frontend/          # React + Vite + TypeScript
├── backend/           # FastAPI + SQLAlchemy + Alembic
├── supabase/
│   ├── migrations/      # Reference SQL (core tables)
│   └── seed.sql         # Optional reference seed
├── docs/                # Database & deployment guides
└── scripts/             # Legacy helpers → prefer backend/scripts/database
```

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

Edit `backend\.env`: set `DATABASE_URL` and a strong `JWT_SECRET_KEY`.

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

- `DATABASE_URL` — **required** PostgreSQL URL (`postgresql+psycopg://…`, or `postgresql://` / `postgres://` from Railway/Supabase)
- `JWT_SECRET_KEY` — strong secret in production
- `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`
- `MVP_MODE` — `true` hides legacy multi-tenant routes

### Frontend (`frontend/.env`)

See [frontend/.env.example](ase_frontend/.env.example):

- `VITE_API_URL` — e.g. `http://localhost:8000/api/v1`

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
.\.venv\Scripts\pytest.exe
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

- **super_admin** — catalog, users, purchases overview, access request review  
- **independent_user** — catalog, favorites, purchases, requests, profile  

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
