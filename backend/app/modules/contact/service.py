from __future__ import annotations

import logging
from datetime import UTC, datetime

from app.core.config import settings
from app.modules.contact.sanitize import escape_for_html, sanitize_contact_field
from app.modules.contact.schemas import ContactSubmitRequest
from app.modules.notifications.email_provider import get_email_provider
from app.modules.notifications.exceptions import EmailDeliveryError

logger = logging.getLogger(__name__)


def _build_contact_email(payload: ContactSubmitRequest) -> tuple[str, str, str]:
    name = sanitize_contact_field(payload.name, max_length=200)
    email = sanitize_contact_field(str(payload.email), max_length=320)
    company = sanitize_contact_field(payload.company, max_length=200) or "—"
    inquiry_type = sanitize_contact_field(payload.inquiry_type, max_length=120) or "—"
    subject = sanitize_contact_field(payload.subject, max_length=300)
    message = sanitize_contact_field(payload.message, max_length=5000)
    sent_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")

    email_subject = f"Nuevo mensaje desde la web de ASE: {subject}"

    text_body = "\n".join(
        [
            "Nombre:",
            name,
            "",
            "Email:",
            email,
            "",
            "Empresa:",
            company,
            "",
            "Tipo de consulta:",
            inquiry_type,
            "",
            "Asunto:",
            subject,
            "",
            "Mensaje:",
            message,
            "",
            "Fecha de envío:",
            sent_at,
            "",
            "Origen: Web ASE",
        ]
    )

    html_body = (
        "<div style=\"font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;\">"
        f"<p><strong>Nombre:</strong><br>{escape_for_html(name)}</p>"
        f"<p><strong>Email:</strong><br>{escape_for_html(email)}</p>"
        f"<p><strong>Empresa:</strong><br>{escape_for_html(company)}</p>"
        f"<p><strong>Tipo de consulta:</strong><br>{escape_for_html(inquiry_type)}</p>"
        f"<p><strong>Asunto:</strong><br>{escape_for_html(subject)}</p>"
        f"<p><strong>Mensaje:</strong><br>{escape_for_html(message).replace(chr(10), '<br>')}</p>"
        f"<p><strong>Fecha de envío:</strong><br>{escape_for_html(sent_at)}</p>"
        "<p><strong>Origen:</strong> Web ASE</p>"
        "</div>"
    )

    return email_subject, html_body, text_body


class ContactService:
    def submit(self, payload: ContactSubmitRequest) -> None:
        inbox = (settings.CONTACT_INBOX_EMAIL or settings.EMAIL_FROM).strip()
        subject, html_body, text_body = _build_contact_email(payload)
        provider = get_email_provider()
        user_email = sanitize_contact_field(str(payload.email), max_length=320)

        try:
            provider.send_email(
                to=inbox,
                subject=subject,
                html=html_body,
                text=text_body,
                reply_to=user_email,
            )
        except EmailDeliveryError:
            logger.warning("contact_email_failed inbox=%s", inbox)
            raise

        logger.info(
            "contact_message_sent inbox=%s subject_len=%d message_len=%d",
            inbox,
            len(payload.subject),
            len(payload.message),
        )
