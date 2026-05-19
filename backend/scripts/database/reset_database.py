"""Drop and recreate schema via Alembic (destructive)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

_SCRIPTS_DIR = Path(__file__).resolve().parent
_BACKEND_ROOT = _SCRIPTS_DIR.parent.parent


def main() -> None:
    alembic = _BACKEND_ROOT / ".venv" / "Scripts" / "alembic.exe"
    if not alembic.exists():
        alembic = "alembic"
    for args in (["downgrade", "base"], ["upgrade", "head"]):
        print(f"Running: alembic {' '.join(args)}")
        subprocess.check_call([str(alembic), *args], cwd=_BACKEND_ROOT)
    print("Database reset complete.")


if __name__ == "__main__":
    main()
    sys.exit(0)
