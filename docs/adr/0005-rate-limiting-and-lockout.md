# 0005 — Two independent layers of brute-force protection

## Context

Login and registration endpoints need protection against credential-stuffing and brute-force attacks. A single per-IP rate limit is the common first defense but has a known gap: an attacker who spreads guesses across many IPs (botnet, rotating proxies) or simply waits out the window never trips it, while still exhausting a specific account's password space over time.

## Decision

Two independent, stacked mechanisms:

1. **Per-IP rate limiting** (`slowapi`, `app/core/rate_limit.py`): `POST /auth/login` limited to 10/minute, `POST /auth/register` to 5/hour, keyed by remote address.
2. **Per-account lockout** (`LOGIN_MAX_FAILED_ATTEMPTS` / `LOGIN_LOCKOUT_MINUTES`, default 10 attempts / 15 minutes): tracks consecutive wrong-password attempts against a specific account regardless of source IP, independent of and in addition to the per-IP limit.

## Alternatives considered

- **Per-IP limiting alone.** Rejected: leaves the distributed-attack gap described above open.
- **CAPTCHA after N failures.** Not implemented (would require a third-party CAPTCHA service and frontend integration); left as a possible future addition if the two current layers prove insufficient in practice.

## Consequences

- Two separate rate-limit-like mechanisms exist with different scopes and different storage (IP-limiter uses `slowapi`'s pluggable storage — memory or Redis, ADR 0003; the account lockout is a DB-backed counter on the user row) — a developer debugging "why can't I log in" needs to know both exist and check both.
- The per-IP limiter's in-memory default doesn't share state across backend replicas (see ADR 0003) — the account-level lockout, being DB-backed, doesn't have this gap regardless of replica count.
