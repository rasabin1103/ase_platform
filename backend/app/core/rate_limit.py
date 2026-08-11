from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

# In-memory limiter (per-process). Good enough for a single backend
# instance; if this ever runs multiple replicas behind a load balancer,
# swap storage_uri for a shared Redis instance so limits are enforced
# consistently across processes.
limiter = Limiter(key_func=get_remote_address)
