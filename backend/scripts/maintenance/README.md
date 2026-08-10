Non-destructive checks and smoke tests. Safe to run in CI with a read-only or disposable database URL.

- `check_db_connection.py` — `SELECT 1` via SQLAlchemy engine.
- `check_rbac_consistency.py` — compares MVP RBAC matrices to frontend route expectations.

Run from repository `backend/` directory:

```bash
python scripts/maintenance/check_db_connection.py
python scripts/maintenance/check_rbac_consistency.py
```
