# Deployment notes

## Before production

1. Set strong `JWT_SECRET_KEY` and a private `DATABASE_URL` on the host (Railway, Supabase, etc.).
2. Never commit `.env` files; use platform secret stores.
3. Set `MVP_MODE=true` until multi-tenant modules are required.
4. Run `alembic upgrade head` on the target database.
5. Build frontend with production `VITE_API_URL` pointing to your API (same host you use for login).
6. Set backend `CORS_ALLOW_ORIGINS` to a comma-separated list that includes your SPA origin (e.g. `https://app.example.com`). The browser must be allowed to send `Authorization: Bearer …` to the API.

## Auth / JWT (not Supabase Auth)

The API issues its own JWTs (`POST /api/v1/auth/login`). **Supabase is only the Postgres host** unless you integrate Supabase Auth separately.

- **Access token** expires after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60). The SPA stores it in `localStorage` and sends it on every request.
- **Refresh token** lasts `REFRESH_TOKEN_EXPIRE_DAYS` (default 30). The SPA calls `POST /api/v1/auth/refresh` automatically when a request returns **401** (see `frontend/src/api/client.ts`).
- Use one **stable `JWT_SECRET_KEY`** for all API replicas; otherwise tokens from one instance fail on another.

## CORS

Set `CORS_ALLOW_ORIGINS` in backend `.env` (comma-separated). Example:

```env
CORS_ALLOW_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

The previous hard-coded localhost list is now the default when this variable is unset.

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
