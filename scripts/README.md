# Root scripts (compatibility)

Database and seed commands live under **`ase_backend/scripts/database/`**.

```powershell
cd ase_backend
.venv\Scripts\python.exe scripts\database\reset_database.py
.venv\Scripts\python.exe scripts\database\seed_all.py
```

See [ase_backend/scripts/database/README.md](../ase_backend/scripts/database/README.md) and [docs/DATABASE.md](../docs/DATABASE.md).

Legacy helpers in this folder may be moved or removed; prefer `ase_backend/scripts/database` for new work.
