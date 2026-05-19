"""Shared path setup for database scripts."""
from __future__ import annotations

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_SCRIPTS = os.path.join(_ROOT, "scripts")
for path in (_ROOT, _SCRIPTS):
    if path not in sys.path:
        sys.path.insert(0, path)
