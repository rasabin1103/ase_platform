# 0010 — Backend tests require a disposable `TEST_DATABASE_URL` and truncate rather than rollback

## Context

The backend had no test-writing convention that guaranteed isolation from the real database. `DATABASE_URL` in this project's `.env` is a real, configured Postgres/Supabase connection — any test suite that opens `SessionLocal()` and writes data risks polluting real data if pointed at it, whether by a misconfigured environment or by a test author not realizing the risk.

Note (discovered, not designed): a pre-existing, separate set of test files (`test_auth_flows.py`, `test_two_factor.py`, `test_onboarding.py`, `test_purchase_flow.py`, `test_rbac.py`, `test_tenant_context.py`, `test_public_catalog_stats.py`, `test_services_public.py`, `test_plans_catalog.py`, `test_health.py`) already existed in `backend/tests/` before this decision was made, predating this round of work. It takes the opposite approach — self-contained, opens `SessionLocal()`/`TestClient(app)` directly against whichever `DATABASE_URL` is active, relies on randomly-suffixed emails/slugs to avoid collisions rather than a disposable database, and performs no cleanup. It was left as-is (not migrated to the new pattern) — see Consequences.

## Decision

New tests (`conftest.py` and everything that uses its fixtures: `test_auth.py`, `test_account_lifecycle.py`, `test_catalog_admin.py`, `test_blog.py`, `test_catalog_categories.py`) require an explicit `TEST_DATABASE_URL` env var. If it's unset, the DB-dependent fixtures call `pytest.skip(...)` with a clear message — the suite skips cleanly rather than either failing confusingly or, worse, silently falling back to the real `DATABASE_URL`. The `db` fixture `TRUNCATE TABLE ... RESTART IDENTITY CASCADE`s every table before each test (chosen over a nested-transaction/savepoint rollback strategy) because the application's service layer calls `db.commit()` internally throughout its normal request handling — a savepoint-based rollback strategy would be silently broken by those internal commits, since a commit inside a savepoint releases it. Schema is created via `Base.metadata.create_all()`/`drop_all()` directly from the current ORM models, bypassing Alembic migration history entirely — standard practice for test schemas, and it always mirrors current model state regardless of migration history gaps.

## Alternatives considered

- **Savepoint/rollback-per-test isolation** (wrap each test in a transaction, roll back instead of truncating). Rejected for the reason above: the app's own service layer commits mid-request, which breaks this strategy's core assumption.
- **Point tests at the real `DATABASE_URL` with cleanup logic.** Rejected outright — too easy to get cleanup wrong and leave orphaned or, worse, delete real data; the truncate-everything approach must never run against a database that has anything worth keeping.
- **Migrate the pre-existing test files to the new `TEST_DATABASE_URL` fixtures.** Not done in this pass — out of scope for the "cobertura básica" ask, which was to add a real foundation, not rewrite what already existed. Flagged as a known follow-up instead.

## Consequences

- Two backend test suites now coexist with fundamentally different risk profiles: the new one is safe by construction (skips without `TEST_DATABASE_URL`, truncates a disposable DB); the older one is not — it writes directly to whatever `DATABASE_URL` is configured wherever it's run, with no cleanup. Anyone running `pytest` needs to know this before pointing `DATABASE_URL` at anything that matters. This should be called out to whoever next runs CI against this repo, and is documented in `docs/DEPLOYMENT.md` and `backend/README.md`.
- `conftest.py` fixtures are all non-`autouse` (except a file-local `_no_real_email` fixture in `test_account_lifecycle.py`), which means the old test files never invoke them — confirmed by reading all ten pre-existing files before this decision was finalized, specifically to verify adding the new `conftest.py` couldn't silently change the old suite's behavior.
- This sandbox environment has no Postgres available at all, so neither suite could actually be executed end-to-end here — verification was limited to `py_compile` and `pytest --collect-only` for the new suite. Actually running either suite (with a real disposable database for the new one) is a prerequisite for trusting this work in CI.
