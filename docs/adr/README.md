# Architecture Decision Records

Short records of the non-obvious "why" behind decisions made building the ASE platform — the reasoning that otherwise only exists in chat history and would be lost. Format: lightweight (Context / Decision / Alternatives considered / Consequences), one file per decision, numbered in the order they were made.

These are not exhaustive design docs — see [../DEPLOYMENT.md](../DEPLOYMENT.md), [../DATABASE.md](../DATABASE.md), and [../rbac-architecture.md](../rbac-architecture.md) for how things work today. ADRs are for why they work that way, and what else was considered.

| # | Decision |
|---|---|
| [0001](0001-mvp-mode-rbac.md) | Two-role MVP RBAC on top of a full multi-tenant schema |
| [0002](0002-account-lifecycle-policy.md) | Automated account-lifecycle policy (2FA grace → inactivity suspend → soft-delete) |
| [0003](0003-optional-integrations-degrade-gracefully.md) | SMTP / Sentry / Redis are all optional and degrade gracefully when unset |
| [0004](0004-self-hosted-error-log.md) | Self-hosted `error_logs` table independent of Sentry |
| [0005](0005-rate-limiting-and-lockout.md) | Two independent layers of brute-force protection (per-IP + per-account) |
| [0006](0006-http-security-headers-middleware-order.md) | Security headers middleware registered last, CSP exempts `/docs` |
| [0007](0007-blog-server-side-html-sanitization.md) | Blog content is sanitized server-side on every write, not trusted from the editor |
| [0008](0008-catalog-categories-custom-fields.md) | Catalog categories are metadata (custom field schemas) on top of a free-text category, not a foreign key |
| [0009](0009-frontend-route-level-code-splitting.md) | Frontend code-splitting at the route level, three Suspense boundaries |
| [0010](0010-backend-test-isolation-strategy.md) | Backend tests require a disposable `TEST_DATABASE_URL` and truncate rather than rollback |
| [0011](0011-in-process-scheduler.md) | In-process APScheduler for the daily sweep instead of an external job queue |
