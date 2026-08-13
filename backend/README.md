# ASE Backend

FastAPI backend for Arce Sabin Engineering: auth (JWT + optional TOTP 2FA), RBAC, catalog + dynamic categories, blog, purchases/favorites, access requests, account-lifecycle automation, and admin tooling (error logs, dashboard).

## Stack

- Python + FastAPI
- PostgreSQL (Docker Compose for local dev)
- SQLAlchemy 2 + Alembic (hand-written migrations)
- APScheduler (in-process daily account-lifecycle sweep)
- Pytest

## Requisitos

- Python 3.11+ recomendado
- Docker Desktop (para PostgreSQL y pgAdmin, opcional en local)

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores. Cubre: conexión a PostgreSQL, `JWT_SECRET_KEY`, `MVP_MODE`, SMTP (email transaccional), Sentry (monitorización de errores), Redis (rate limiter compartido), y los umbrales de la política de ciclo de vida de cuentas (`TWO_FACTOR_GRACE_DAYS`, `INACTIVITY_SUSPEND_DAYS`, `SUSPENDED_DELETE_DAYS`). Referencia completa, incluyendo qué ocurre si dejas cada variable opcional vacía: [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).

## Levantar PostgreSQL + pgAdmin

Desde `backend/`:

```bash
docker compose up -d
```

- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050` (usuario/clave desde `.env`)

## Levantar FastAPI

Crear entorno e instalar dependencias:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Para desarrollo local (incluye pytest, no necesario en producción):

```bash
pip install -r requirements-dev.txt
```

Migraciones:

```bash
alembic upgrade head
```

Arrancar API:

```bash
uvicorn app.main:app --reload
```

Health check:
- `GET http://localhost:8000/health` → `{"status":"ok"}`
- `GET http://localhost:8000/health/db` → comprueba conectividad a la base de datos

## Tests

```bash
pytest -q
```

El conjunto de tests principal (`tests/conftest.py`, `test_auth.py`, `test_account_lifecycle.py`, `test_catalog_admin.py`, `test_blog.py`, `test_catalog_categories.py`) requiere una base de datos desechable vía `TEST_DATABASE_URL` — trunca todas las tablas antes de cada test, así que **nunca debe apuntar a la misma base que `DATABASE_URL`**. Si `TEST_DATABASE_URL` no está definida, esos tests se saltan (skip) en lugar de fallar o correr contra la base equivocada:

```bash
TEST_DATABASE_URL=postgresql+psycopg://ase:ase@localhost:5432/ase_test pytest -q
```

Hay un segundo conjunto de tests (`test_auth_flows.py`, `test_two_factor.py`, `test_onboarding.py`, `test_purchase_flow.py`, `test_rbac.py`, `test_tenant_context.py`, `test_public_catalog_stats.py`, `test_services_public.py`, `test_plans_catalog.py`, `test_health.py`) anterior a este, autocontenido (no usa los fixtures de `conftest.py`), que corre directamente contra la `DATABASE_URL` activa — trátalo con la misma cautela: nunca lo ejecutes con `DATABASE_URL` apuntando a producción.

## Más documentación

- [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) — despliegue, variables de entorno completas, checklist de pre-producción.
- [../docs/DATABASE.md](../docs/DATABASE.md) — migraciones y scripts de seed.
- [../docs/rbac-architecture.md](../docs/rbac-architecture.md) — roles, permisos, modo MVP.
