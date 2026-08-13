# Deployment notes

This document describes how to deploy the ASE platform (FastAPI backend + React/Vite frontend) from scratch, including every optional integration added over the course of this engagement (SMTP, Sentry, Redis, 2FA, the account-lifecycle scheduler). Every integration below is designed to degrade gracefully: if you skip its env vars, the app still runs — you just don't get that piece of functionality.

## 1. Prerequisites

- Python 3.11+ and the packages in `backend/requirements.txt` (production) — add `backend/requirements-dev.txt` locally/in CI if you need to run the test suite (it only adds `pytest`).
- Node 20+ and `frontend/package.json` dependencies.
- A PostgreSQL database (managed or self-hosted). Supabase, RDS, and Neon are all known to work.
- Nothing else is required to boot the app. SMTP, Sentry, and Redis are optional — see below.

## 2. Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in real values. `backend/.env.production` is a template of what to set on the production host (no secrets committed).

### Core (required)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string. Takes priority over the individual `POSTGRES_*` vars. |
| `JWT_SECRET_KEY` | Signs access/refresh tokens. Must be a long random value in production — the default is a placeholder and is not safe to deploy with. |
| `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | Token lifetime tuning. Defaults: HS256, 15 min, 30 days. |
| `MVP_MODE` | `true` hides the legacy multi-tenant routes (organizations, roles, subscriptions, etc.) and uses the two-role RBAC seed (super_admin / independent_user). Leave `true` until multi-tenant is actually needed. |
| `FRONTEND_URL` | Base URL used to build links inside transactional emails (password reset, email verification). No trailing slash. Local: `http://localhost:5173`. Production: `https://www.arcesabinengineering.com`. |

### SMTP (transactional email — optional but recommended)

Used for password-reset and email-verification emails (`app/core/email.py`). If `SMTP_HOST` is left empty, sending is skipped and logged only — the app keeps working, but users can never receive those emails, so password reset and email verification become dead ends in practice.

| Variable | Purpose |
|---|---|
| `SMTP_HOST` | Mail server host. Empty = disabled. |
| `SMTP_PORT` | Default `587`. |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | Mail server credentials. |
| `SMTP_USE_TLS` | Default `true`. |
| `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME` | Sender identity shown to recipients. |

Any SMTP provider works — Gmail Workspace, Zoho, your hosting provider's mail, etc. There's no vendor lock-in; it's a plain `smtplib` client.

### Sentry (error monitoring — optional)

Backend: `app/core/monitoring.py`, initialized in `main.py` before the FastAPI app is constructed (so Sentry's Starlette instrumentation wraps every request). Frontend: `frontend/src/monitoring.ts`, initialized in `main.tsx` before the app renders.

| Variable | Where | Purpose |
|---|---|---|
| `SENTRY_DSN` | backend | Empty = Sentry never initializes; no-op, no crash. |
| `SENTRY_ENVIRONMENT` | backend | Tag shown in Sentry (`development`, `production`, etc.). |
| `SENTRY_TRACES_SAMPLE_RATE` | backend | Fraction of requests traced for performance data. Errors are always captured regardless of this value. Default `0.1`. |
| `VITE_SENTRY_DSN` | frontend | Same idea, browser side. Empty = disabled. |
| `VITE_SENTRY_ENVIRONMENT` | frontend | Defaults to `production` on a prod build, `development` otherwise. |

Both are independent — you can enable backend Sentry without frontend Sentry or vice versa. A free Sentry project is enough to start with either.

Separately from Sentry, every unhandled backend exception is also persisted to the `error_logs` table (`app/core/error_logging.py`) and visible from the admin panel (`/admin/error-logs` in the frontend) — this works with or without Sentry configured, so you always have at least in-app visibility into 500s even with no external monitoring set up.

### Redis (shared rate-limiter storage — optional, needed once you run more than one backend replica)

The login/register rate limiter (`slowapi`, `app/core/rate_limit.py`) defaults to in-memory storage, which is correctly enforced only within a single process. If you deploy more than one backend replica behind a load balancer, each replica gets its own independent counter — an attacker spread across replicas could exceed the intended limit. Setting `REDIS_URL` makes `slowapi` share counters across every replica.

| Variable | Purpose |
|---|---|
| `REDIS_URL` | e.g. `redis://default:password@host:6379`. Empty = in-memory (single-process only). |

The admin dashboard (`GET /api/v1/admin/dashboard/...`) surfaces whether Redis is currently configured (`redis_configured` field), so you can confirm this in production without checking env vars directly.

### Two-factor authentication (2FA)

TOTP-based 2FA (`pyotp`) has no separate infrastructure dependency — it stores a per-user secret in the database and needs no extra env vars beyond the account-lifecycle ones below (which control how long a new account has to enable it before being suspended). Endpoints: `POST /api/v1/auth/2fa/setup`, `/2fa/confirm`, `/2fa/disable`, `/2fa/verify-login`.

### Account lifecycle policy + scheduler

An in-process APScheduler job (`app/main.py`, `BackgroundScheduler`) runs `run_full_sweep()` (`app/core/account_lifecycle.py`) every 24 hours, starting ~1 minute after the process boots. It enforces, in order: (1) new accounts that never enable 2FA within the grace period get suspended; (2) accounts inactive past the inactivity threshold get suspended (a later successful login reactivates automatically); (3) accounts still suspended past the delete threshold get soft-deleted (PII anonymized). `super_admin` is always exempt. The same sweep is also exposed as an admin "run now" action (`POST /api/v1/admin/account-lifecycle/run-sweep`) for manual triggering without waiting a day.

| Variable | Purpose |
|---|---|
| `ACCOUNT_LIFECYCLE_SWEEP_ENABLED` | Set `false` to disable the whole policy without redeploying code. Default `true`. |
| `TWO_FACTOR_GRACE_DAYS` | Default `30`. |
| `INACTIVITY_SUSPEND_DAYS` | Default `180`. |
| `SUSPENDED_DELETE_DAYS` | Default `180`. |

**Multi-replica caveat**: the scheduler is in-process and single-instance, like the in-memory rate-limiter fallback. If you run more than one backend worker process, each one runs its own copy of the sweep on its own 24h timer — harmless (every check is idempotent) but redundant. Not a correctness problem at current scale; worth revisiting if you move to a proper job queue later.

Every transition sends a notification email through the SMTP integration above, so `SMTP_HOST` should be configured before relying on this in production — otherwise accounts get suspended/deleted silently with no email to the affected user.

### Login brute-force lockout

Independent of the per-IP rate limit on `POST /auth/login`, `app/core/account_lifecycle`-adjacent logic tracks consecutive wrong-password attempts per account and locks it out for a period regardless of which IP the attempts came from.

| Variable | Purpose |
|---|---|
| `LOGIN_MAX_FAILED_ATTEMPTS` | Default `10`. |
| `LOGIN_LOCKOUT_MINUTES` | Default `15`. |

### Other

| Variable | Purpose |
|---|---|
| `GITHUB_ACCESS_TOKEN` | Only needed for private-repo book redemption (`app/core/github_client.py`) — auto-invites a reader as a collaborator when they redeem a code. Needs a classic PAT with `repo` scope or a fine-grained PAT with Administration: write on the target repos. Redemption of private-repo books fails without it; public-repo books are unaffected. |
| `DEMO_SEED_PASSWORD`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | Used only by `scripts/seed_demo_rbac.py` / `scripts/seed_initial_data.py`. Set real values only in your local/deploy `.env`, never commit them. |

## 3. Database migrations

```bash
cd backend
alembic upgrade head
```

Run this on every deploy after pulling new code. Migrations are hand-written (not autogenerated) and live in `backend/alembic/versions/`; each one has been verified in both directions (`upgrade`/`downgrade`) with `--sql` before merging.

## 4. Frontend build

```bash
cd frontend
npm ci
npm run build
```

Set `VITE_API_URL` to point at your deployed API before building (see `frontend/.env.example`):
- Same-origin/proxied deploy: `VITE_API_URL=/api/v1`.
- Separate host: `VITE_API_URL=https://your-api-host/api/v1`.

`VITE_SITE_URL` (optional) sets the absolute origin used for Open Graph tags. `VITE_SENTRY_DSN` / `VITE_SENTRY_ENVIRONMENT` enable browser-side error monitoring (see above).

The build now code-splits per route (`React.lazy` + `Suspense`) — the main bundle is ~613 KB (~192 KB gzipped), down from the single ~2 MB bundle the app shipped as before; individual heavy pages (the blog editor with TipTap, chart-heavy admin pages with Recharts) load on demand instead of up front.

## 5. CORS

Allowed origins are a hardcoded list in `backend/app/main.py` (`CORSMiddleware(allow_origins=[...])`), not an env var. Add any new frontend domain there before deploying it, or requests from that domain will be blocked by the browser regardless of the backend otherwise working correctly.

## 6. HTTP security headers

Every response gets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a restrictive `Content-Security-Policy` (except on `/docs`/`/redoc`, which need to load their own CDN scripts) via `app/core/security_headers.py`. `Strict-Transport-Security` is added automatically once the app sees it's being served over HTTPS (either directly or via `X-Forwarded-Proto` from a reverse proxy) — no extra configuration needed as long as your proxy forwards that header, which most managed platforms (Railway, Fly.io, etc.) do by default.

## 7. Automated tests

Backend: `pytest` (`backend/tests/`). The newer test suite (`conftest.py`, `test_auth.py`, `test_account_lifecycle.py`, `test_catalog_admin.py`, `test_blog.py`, `test_catalog_categories.py`) requires a disposable `TEST_DATABASE_URL` env var and skips cleanly if it isn't set — it truncates every table before each test, so it must never point at a real/shared database. A second, older set of test files (`test_auth_flows.py`, `test_two_factor.py`, `test_onboarding.py`, `test_purchase_flow.py`, `test_rbac.py`, `test_tenant_context.py`, `test_public_catalog_stats.py`, `test_services_public.py`, `test_plans_catalog.py`, `test_health.py`) predates this round of work, is self-contained (opens its own `SessionLocal`/`TestClient`, no shared fixtures), and runs directly against whichever `DATABASE_URL` is active with randomly-suffixed emails/slugs rather than a disposable database — treat it the same way: never point `DATABASE_URL` at production while running it.

```bash
# safe, isolated:
TEST_DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/ase_test pytest
```

Frontend: `npm test` (Vitest + React Testing Library, `frontend/src/**/*.test.{ts,tsx}`). No external services needed — runs against jsdom.

## 8. Suggested stack

| Layer | Option |
|---|---|
| API | Container (Uvicorn) — Railway, Fly.io, AWS ECS, etc. |
| DB | Managed PostgreSQL (Supabase, RDS, Neon) |
| Web | Static host (Vercel, Netlify, S3+CloudFront) for `frontend/dist` |
| Redis (optional, multi-replica only) | Managed Redis (Upstash, Redis Cloud, etc.) |

## 9. Health checks

- `GET /health` — liveness.
- `GET /health/db` — database connectivity.
- `GET /docs` — OpenAPI (consider disabling or protecting in production; it's exempted from the CSP by design so it keeps working if you do leave it on).

## 10. Pre-production checklist

1. Set a strong, unique `JWT_SECRET_KEY` and `POSTGRES_PASSWORD`/`DATABASE_URL`.
2. Never commit `.env` files — use your platform's secret store. `.env.example` and `.env.production` in this repo are templates only, no real secrets.
3. Set `MVP_MODE=true` until multi-tenant modules are actually required.
4. Run `alembic upgrade head` against the target database.
5. Configure `SMTP_HOST` and related vars — without it, password reset, email verification, and account-lifecycle notification emails all silently no-op.
6. Configure `SENTRY_DSN` (backend) and/or `VITE_SENTRY_DSN` (frontend) if you want external error monitoring; the in-app `error_logs` table works either way.
7. Configure `REDIS_URL` once you run more than one backend replica.
8. Add any new frontend origin to the CORS allowlist in `app/main.py`.
9. Build the frontend with the correct `VITE_API_URL` for the target environment.
10. Confirm `ACCOUNT_LIFECYCLE_SWEEP_ENABLED` and its thresholds match your intended policy — the defaults (30/180/180 days) suspend and eventually delete real accounts automatically.
