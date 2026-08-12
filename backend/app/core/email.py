from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(*, to_email: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Best-effort transactional email via the SMTP server configured in
    .env (bring-your-own SMTP — no third-party email API). Returns True if
    the message was handed off to the SMTP server, False if SMTP isn't
    configured or the send failed.

    Never raises: callers must not let a failed/unconfigured email block the
    primary action — e.g. registration still succeeds even if the
    verification email couldn't be sent; the user can always request a new
    one once SMTP is configured correctly.
    """
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST not configured — skipping email to %s (subject=%r)", to_email, subject)
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message.attach(MIMEText(text_body or html_body, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], message.as_string())
        return True
    except Exception:
        logger.exception("Failed to send email to %s (subject=%r)", to_email, subject)
        return False
