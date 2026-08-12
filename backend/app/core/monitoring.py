from __future__ import annotations

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """Initialize Sentry error monitoring — a no-op if SENTRY_DSN isn't set,
    so local dev and any deploy without a Sentry project keep working
    unchanged. Call this once, before the FastAPI app is created."""
    if not settings.SENTRY_DSN:
        logger.info("SENTRY_DSN not set — error monitoring disabled.")
        return

    try:
        import sentry_sdk
    except ImportError:
        logger.warning("sentry-sdk is not installed — cannot enable error monitoring.")
        return

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        # Fraction of requests traced for performance monitoring — kept low
        # by default; errors are always captured regardless of this value.
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
    )
