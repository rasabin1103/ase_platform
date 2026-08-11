from __future__ import annotations

import time

# Set once, the moment this module is first imported (at process start via
# main.py). Used only to report an approximate API process uptime on the
# admin system-status page — not persisted, resets on every deploy/restart.
STARTED_AT: float = time.time()
