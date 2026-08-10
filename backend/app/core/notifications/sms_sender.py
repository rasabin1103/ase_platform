from __future__ import annotations

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_verification_sms(*, to_e164: str, code: str) -> None:
    message = f"Your ASE verification code is {code}. It expires in {settings.VERIFICATION_SMS_EXPIRE_MINUTES} minutes."

    if settings.SMS_DEV_LOG_ONLY or not settings.TWILIO_ACCOUNT_SID:
        logger.info("verification_sms to=%s code=%s", to_e164, code)
        return

    url = (
        f"https://api.twilio.com/2010-04-01/Accounts/"
        f"{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    )
    data = {
        "To": to_e164,
        "From": settings.TWILIO_FROM_NUMBER,
        "Body": message,
    }
    with httpx.Client(timeout=30) as client:
        response = client.post(
            url,
            data=data,
            auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN or ""),
        )
        response.raise_for_status()
