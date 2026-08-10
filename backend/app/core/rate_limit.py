"""In-process sliding-window rate limits for sensitive auth actions."""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, status

_lock = Lock()
_buckets: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(
    key: str,
    *,
    max_attempts: int = 8,
    window_seconds: int = 300,
) -> None:
    """Raise 429 when too many attempts in the window."""
    now = time.monotonic()
    cutoff = now - window_seconds
    with _lock:
        attempts = [t for t in _buckets[key] if t >= cutoff]
        if len(attempts) >= max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again later.",
            )
        attempts.append(now)
        _buckets[key] = attempts


def reset_rate_limit(key: str) -> None:
    with _lock:
        _buckets.pop(key, None)
