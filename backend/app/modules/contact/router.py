from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import settings
from app.core.rate_limit import check_rate_limit
from app.modules.contact.schemas import ContactSubmitRequest, ContactSubmitResponse
from app.modules.contact.service import ContactService
from app.modules.notifications.exceptions import EmailDeliveryError

router = APIRouter(prefix="/api/v1", tags=["contact"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


@router.post("/contact", response_model=ContactSubmitResponse, status_code=status.HTTP_201_CREATED)
def submit_contact(payload: ContactSubmitRequest, request: Request) -> ContactSubmitResponse:
    ip = _client_ip(request)
    email_key = str(payload.email).strip().lower()[:320]

    check_rate_limit(
        f"contact:ip:{ip}",
        max_attempts=settings.CONTACT_RATE_LIMIT_MAX,
        window_seconds=settings.CONTACT_RATE_LIMIT_WINDOW_SECONDS,
    )
    check_rate_limit(
        f"contact:email:{email_key}",
        max_attempts=max(3, settings.CONTACT_RATE_LIMIT_MAX // 2),
        window_seconds=settings.CONTACT_RATE_LIMIT_WINDOW_SECONDS,
    )

    try:
        ContactService().submit(payload)
    except EmailDeliveryError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send message. Please try again later.",
        ) from None

    return ContactSubmitResponse()
