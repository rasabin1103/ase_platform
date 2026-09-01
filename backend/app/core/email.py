from __future__ import annotations

import logging
import smtplib
import socket
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


class _IPv4OnlySMTP(smtplib.SMTP):
    """Plain smtplib.SMTP, except socket creation is forced to IPv4.

    Some container platforms (Railway included) have no outbound IPv6
    route, but the default `socket.create_connection` used by
    `smtplib.SMTP.connect()` still tries whatever address `getaddrinfo`
    returns first — for a host like smtp.hostinger.com that publishes an
    AAAA record, that's IPv6, and the connection fails with
    "OSError: [Errno 101] Network is unreachable" even though the exact
    same host is reachable over IPv4 on the exact same port. Overriding
    `_get_socket` (smtplib's own extension point — SMTP_SSL does the same)
    to only ever resolve/dial `AF_INET` addresses sidesteps that without
    changing anything else about how the connection is used."""

    def _get_socket(self, host, port, timeout):
        if timeout is not None and not timeout:
            raise ValueError("Non-blocking socket (timeout=0) is not supported")
        last_exc: OSError | None = None
        for family, socktype, proto, _canonname, sockaddr in socket.getaddrinfo(
            host, port, socket.AF_INET, socket.SOCK_STREAM
        ):
            sock: socket.socket | None = None
            try:
                sock = socket.socket(family, socktype, proto)
                if timeout is not socket._GLOBAL_DEFAULT_TIMEOUT:
                    sock.settimeout(timeout)
                if self.source_address:
                    sock.bind(self.source_address)
                sock.connect(sockaddr)
                return sock
            except OSError as exc:
                last_exc = exc
                if sock is not None:
                    sock.close()
        raise last_exc or OSError(f"getaddrinfo returned no IPv4 address for {host!r}")


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
        with _IPv4OnlySMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], message.as_string())
        return True
    except Exception:
        logger.exception("Failed to send email to %s (subject=%r)", to_email, subject)
        return False
