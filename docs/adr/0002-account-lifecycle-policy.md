# 0002 — Automated account-lifecycle policy

## Context

Self-service accounts (`independent_user`) can register without ever completing security hardening (2FA) or ever coming back. Left unmanaged, the user table accumulates dormant, unverified accounts indefinitely — a growing attack surface and a compliance liability (indefinite retention of personal data for accounts nobody uses).

## Decision

A three-stage automated policy (`app/core/account_lifecycle.py`), run as a daily sweep and also exposed as an admin "run now" action:

1. **2FA grace period** (`TWO_FACTOR_GRACE_DAYS`, default 30): an account that never enables 2FA within this window is suspended. Login still works just enough to reach `/auth/2fa/setup` + `/auth/2fa/confirm` — confirming 2FA reactivates immediately.
2. **Inactivity suspension** (`INACTIVITY_SUSPEND_DAYS`, default 180): an active account with no login in this window is suspended. A later successful login reactivates it automatically — the login itself is treated as proof of continued use, no separate reactivation flow needed.
3. **Suspended-account deletion** (`SUSPENDED_DELETE_DAYS`, default 180): an account still suspended (either reason) this long after being suspended is soft-deleted — PII anonymized in place (`anonymize_user_pii`), row kept for referential integrity (purchases, audit logs) but no longer identifying.

`super_admin` accounts are unconditionally exempt at every stage — locking out or deleting the only administrator via an unattended sweep is a worse failure mode than leaving one admin account without 2FA. Every transition sends a notification email (via the SMTP integration, ADR 0003) so an affected user isn't surprised.

## Alternatives considered

- **Hard delete instead of anonymize-in-place.** Rejected: breaks foreign keys from purchases/audit logs, and removes the ability to explain "why did this account disappear" during support.
- **No grace period on 2FA, require it at registration.** Rejected for MVP: raises signup friction; a grace period gets the security benefit without blocking first-time signup.
- **Manual admin review instead of automatic suspension/deletion.** Rejected as the sole mechanism: doesn't scale past a handful of admins manually checking a dashboard; kept the manual "run sweep now" action as a supplement, not a replacement.

## Consequences

- The policy silently changes real user state (suspends, eventually deletes) on a timer — the defaults are conservative (30/180/180 days) but a misconfigured `.env` (or an operator not realizing `ACCOUNT_LIFECYCLE_SWEEP_ENABLED=true` is the default) can surprise-suspend a batch of accounts. Documented prominently in `docs/DEPLOYMENT.md`.
- Depends on SMTP being configured to actually notify affected users — without it, transitions still happen, just silently (`send_email` no-ops safely, see ADR 0003).
- Depends on the in-process scheduler (ADR 0011) — a scaling caveat inherited from that decision.
