# Deployment notes

## Before production

1. Set strong `JWT_SECRET_KEY` and unique `POSTGRES_PASSWORD`.
2. Never commit `.env` files; use platform secret stores.
3. Set `MVP_MODE=true` until multi-tenant modules are required.
4. Run `alembic upgrade head` on the target database.
5. Build frontend with production `VITE_API_URL` pointing to your API.

## Suggested stack

| Layer | Option |
|-------|--------|
| API | Container (Uvicorn) — Railway, Fly.io, AWS ECS, etc. |
| DB | Managed PostgreSQL (Supabase, RDS, Neon) |
| Web | Static host (Vercel, Netlify, S3+CloudFront) for `ase_frontend/dist` |

## Health checks

- `GET /health` — liveness
- `GET /health/db` — database connectivity
- `GET /docs` — OpenAPI (disable or protect in production if desired)

## CORS

Configure allowed origins in the FastAPI app when the frontend is on a different domain (see `app/main.py` CORS middleware).
