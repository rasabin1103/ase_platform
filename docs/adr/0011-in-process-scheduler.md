# 0011 — In-process APScheduler for the daily sweep instead of an external job queue

## Context

The account-lifecycle policy (ADR 0002) needs to run on a recurring schedule (daily) without user interaction. The platform has no existing job-queue infrastructure (no Celery/RQ workers, no external scheduler like a managed cron service) at MVP scale.

## Decision

`app/main.py` starts an in-process `BackgroundScheduler` (APScheduler) inside the FastAPI app's `lifespan`, scheduling `_run_account_lifecycle_sweep_job` every 24 hours, with the first run ~1 minute after startup (so the effect is visible without waiting a full day during development/QA). The job opens its own short-lived `SessionLocal()` (the request-scoped session doesn't exist outside a request) and never lets an exception escape — a bug in the sweep logs and moves on rather than crashing the scheduler thread or taking down the API process.

## Alternatives considered

- **External cron hitting an admin endpoint** (e.g. a platform-level scheduled job calling `POST /admin/account-lifecycle/run-sweep`). Considered viable and was in fact *also* built as a manual "run now" fallback — but not chosen as the primary mechanism because it adds an external dependency (something has to be configured on the hosting platform to actually call it) for a feature that should work correctly by default the moment the app is deployed.
- **A real job queue (Celery + Redis/RabbitMQ, or similar).** Rejected for now: significant added infrastructure (broker, worker process management) that the app's current scale doesn't justify — one daily sweep over a modest user table doesn't need a distributed task queue.

## Consequences

- **Single-instance assumption**: if more than one backend worker process is running (multiple Uvicorn workers, multiple container replicas), each one runs its own copy of the scheduler and its own 24h timer — the sweep runs once per worker instead of once total. This is harmless in effect (every check inside the sweep is idempotent — re-suspending an already-suspended account is a no-op) but wasteful, and would need revisiting (e.g. a distributed lock, or moving to an external scheduler hitting the single admin endpoint) before scaling to multiple replicas becomes a real deployment.
- The scheduler's state lives entirely in the running process's memory — a restart resets the "first run in 1 minute" timer but never skips a day's sweep entirely as long as the process is up at least once every 24h period, which is the normal case for a long-running API service.
