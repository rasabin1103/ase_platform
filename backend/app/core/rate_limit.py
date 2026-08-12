from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# In-memory storage (per-process) by default — fine for a single backend
# instance. Once you run more than one replica behind a load balancer, each
# replica would count independently and an attacker spread across replicas
# could slip past the limit unnoticed. Set REDIS_URL to share counters
# across every process instead; slowapi/limits picks a Redis-backed storage
# automatically from a redis:// URI.
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL or "memory://",
)
