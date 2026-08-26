from __future__ import annotations

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile_token(token: str | None, remote_ip: str | None = None) -> bool:
    """Verify a Cloudflare Turnstile (captcha) token against Cloudflare's
    siteverify endpoint. A no-op returning True when TURNSTILE_SECRET_KEY
    isn't configured, so local dev/tests keep working without an account
    configured — same pattern as Sentry/DeepL elsewhere in this codebase.

    Never raises: a network error talking to Cloudflare is treated as a
    failed verification (logged), not an unhandled exception."""
    if not settings.TURNSTILE_SECRET_KEY:
        return True

    if not token:
        return False

    payload = {"secret": settings.TURNSTILE_SECRET_KEY, "response": token}
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(_TURNSTILE_VERIFY_URL, data=payload)
        response.raise_for_status()
        data = response.json()
        return bool(data.get("success"))
    except Exception:
        logger.exception("Turnstile captcha verification failed (network/response error)")
        return False
