# Root scripts (compatibility)

Database and seed commands live under **`backend/scripts/database/`**.

```powershell
cd backend
.venv\Scripts\python.exe scripts\database\reset_database.py
.venv\Scripts\python.exe scripts\database\seed_all.py
```

See [backend/scripts/database/README.md](../backend/scripts/database/README.md) and [docs/DATABASE.md](../docs/DATABASE.md).

Legacy helpers in this folder may be moved or removed; prefer `backend/scripts/database` for new work.
