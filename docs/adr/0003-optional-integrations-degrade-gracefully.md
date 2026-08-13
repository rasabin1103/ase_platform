# 0003 — SMTP / Sentry / Redis are all optional and degrade gracefully when unset

## Context

Three external integrations were added: transactional email (SMTP), error monitoring (Sentry), and shared rate-limiter storage (Redis). None of them are available by default in local dev, and requiring any of them to be configured before the app boots would make local setup harder for no benefit during development.

## Decision

Every one of these checks its own config at startup/call-time and no-ops (logs, returns a sentinel, skips initialization) rather than raising, if unconfigured:

- `send_email()` (`app/core/email.py`): returns `False` and logs a warning if `SMTP_HOST` is empty, instead of raising. Callers never let a failed/unconfigured send block the primary action — e.g. registration succeeds even if the verification email couldn't be sent.
- `init_sentry()` (`app/core/monitoring.py`) / `initSentry()` (frontend `monitoring.ts`): both are no-ops if `SENTRY_DSN`/`VITE_SENTRY_DSN` is empty.
- The rate limiter (`app/core/rate_limit.py`): `storage_uri=settings.REDIS_URL or "memory://"` — falls back to in-memory storage (correct for a single process, not shared across replicas) rather than failing to start.

## Alternatives considered

- **Fail fast if these aren't configured**, forcing every environment (including local dev) to stand up real SMTP/Sentry/Redis. Rejected: makes local dev and low-stakes deploys unnecessarily heavy for integrations that are genuinely optional at that stage.
- **Feature-flag them explicitly** (e.g. `SMTP_ENABLED=true/false`) instead of inferring from whether the connection var is set. Rejected as redundant — an empty `SMTP_HOST` already unambiguously means "not configured"; a separate boolean is one more thing to keep in sync.

## Consequences

- It's easy to forget to configure one of these in a real deployment, since the app never complains — `docs/DEPLOYMENT.md` and the pre-production checklist exist specifically to catch this before go-live (e.g. "SMTP not configured" silently means password reset and account-lifecycle notices never reach users, not an error anyone sees).
- The admin dashboard surfaces `redis_configured` so at least Redis's status is checkable at runtime without reading env vars directly; there's no equivalent runtime indicator yet for SMTP or Sentry being configured — worth adding if this keeps causing confusion in practice.
