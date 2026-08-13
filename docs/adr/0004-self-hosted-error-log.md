# 0004 — Self-hosted `error_logs` table independent of Sentry

## Context

Sentry (ADR 0003) is optional and may not be configured, especially early in a deployment's life or in a cost-sensitive setup. Without any error visibility, diagnosing a production 500 means SSHing into whichever machine is running uvicorn and grepping logs — often not actually possible depending on the hosting platform (e.g. ephemeral containers).

## Decision

A global FastAPI exception handler (`app/main.py: unhandled_exception_handler`) persists every unhandled exception to an `error_logs` table (`app/core/error_logging.py`) — method, path, exception type/message/traceback, best-effort user attribution (decoded from the bearer token if present, `user_id=None` otherwise), and IP — visible from the admin panel without any third-party account. This runs unconditionally, independent of whether Sentry is configured; if `SENTRY_DSN` is set, Sentry captures the same exception separately via its own ASGI middleware — the two are not mutually exclusive.

The write uses its own short-lived `SessionLocal()` rather than the request's `get_db` session, because by the time the global handler runs, the request-scoped session may already be in a broken/rolled-back state.

## Alternatives considered

- **Rely on Sentry alone.** Rejected: makes error visibility contingent on an integration being configured, which defeats the goal of always having a baseline; also, per ADR 0003, Sentry is deliberately optional.
- **Log to stdout/file only.** Rejected: not queryable from the admin panel, and depends on the hosting platform actually persisting/exposing logs — not guaranteed.

## Consequences

- Every 500 leaves a permanent row (truncated to 4000/20000 chars for message/traceback) — this table needs its own retention/cleanup policy eventually if error volume is ever high; none exists yet.
- The user-attribution lookup silently swallows any decode failure (expired/malformed/missing token) — this is deliberate (diagnostics, not an auth check) but means `user_id` being `None` doesn't distinguish "anonymous request" from "token present but invalid."
