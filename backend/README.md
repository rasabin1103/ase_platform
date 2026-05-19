# ASE Backend (fase 1)

Backend mínimo para Arce Sabin Engineering.

## Stack
- Python + FastAPI
- PostgreSQL (Docker Compose)
- SQLAlchemy (sin modelos todavía)
- Pytest

## Requisitos
- Python 3.11+ recomendado
- Docker Desktop (para PostgreSQL y pgAdmin)

## Variables de entorno
El archivo `.env` ya contiene valores de ejemplo para esta fase:
- `POSTGRES_*` (app y contenedor de postgres)
- `PGADMIN_DEFAULT_*` (login de pgAdmin)

## Levantar PostgreSQL + pgAdmin
Desde `ase_backend/`:

```bash
docker compose up -d
```

- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050` (usuario/clave desde `.env`)

En pgAdmin, al crear el servidor:
- **Host name/address**: `postgres`
- **Port**: `5432`
- **Maintenance database**: `ase`
- **Username/Password**: `ase` / `ase`

## Levantar FastAPI
Crear entorno e instalar dependencias:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Arrancar API:

```bash
uvicorn app.main:app --reload
```

Health check:
- `GET http://localhost:8000/health` → `{"status":"ok"}`

## Tests

```bash
pytest -q
```
