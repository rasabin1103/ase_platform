from __future__ import annotations

import logging
from abc import ABC, abstractmethod

import httpx

from app.core.config import settings
from app.modules.notifications.exceptions import EmailDeliveryError

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


class EmailProvider(ABC):
    @abstractmethod
    def send_email(
        self,
        *,
        to: str,
        subject: str,
        html: str,
        text: str | None = None,
        reply_to: str | None = None,
    ) -> None:
        ...


class ConsoleEmailProvider(EmailProvider):
    """Local development: log only in backend (never returned to clients)."""

    def send_email(
        self,
        *,
        to: str,
        subject: str,
        html: str,
        text: str | None = None,
        reply_to: str | None = None,
    ) -> None:
        verify_url = _extract_verify_url(html)
        logger.info("[EMAIL DEV] to=%s subject=%r reply_to=%s", to, subject, reply_to or "—")
        if text:
            logger.info("[EMAIL DEV] text_preview=%s", text[:200])
        if verify_url:
            logger.info("[EMAIL DEV] Verification URL: %s", verify_url)


class ResendEmailProvider(EmailProvider):
    def send_email(
        self,
        *,
        to: str,
        subject: str,
        html: str,
        text: str | None = None,
        reply_to: str | None = None,
    ) -> None:
        api_key = (settings.RESEND_API_KEY or "").strip()
        if not api_key:
            raise EmailDeliveryError("RESEND_API_KEY is not configured")

        payload: dict[str, object] = {
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        if text:
            payload["text"] = text
        if reply_to:
            payload["reply_to"] = [reply_to]
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(RESEND_API_URL, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            logger.error("resend_request_failed to=%s error=%s", to, type(exc).__name__)
            raise EmailDeliveryError("Failed to send email") from exc

        if response.status_code >= 400:
            logger.error(
                "resend_send_failed to=%s status=%s body=%s",
                to,
                response.status_code,
                response.text[:500],
            )
            raise EmailDeliveryError("Email provider rejected the message")

        logger.info(
            "resend_send_ok to=%s from=%s status=%s",
            to,
            settings.EMAIL_FROM,
            response.status_code,
        )


def get_email_provider() -> EmailProvider:
    provider = (settings.EMAIL_PROVIDER or "console").strip().lower()
    if provider == "resend":
        return ResendEmailProvider()
    return ConsoleEmailProvider()


def _extract_verify_url(html: str) -> str | None:
    marker = 'href="'
    idx = html.find(marker)
    if idx == -1:
        return None
    start = idx + len(marker)
    end = html.find('"', start)
    if end == -1:
        return None
    url = html[start:end]
    return url if "/verify-email" in url else None
