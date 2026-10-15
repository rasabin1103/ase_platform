"""Aviso por email al emitirse un certificado de ASE Academy (con el PDF adjunto)."""

from __future__ import annotations

import logging

from app.core.config import settings
from app.core.email import send_email
from app.core.email_templates import academy_certificate_email
from app.modules.academy.certificate_pdf import render_certificate_pdf, verify_url
from app.modules.academy.exam_schemas import CertificateRead

logger = logging.getLogger(__name__)


def send_certificate_email(to_email: str, cert: CertificateRead, lang: str) -> bool:
    """Best effort (nunca lanza): el certificado ya está emitido y visible en
    la web aunque el correo falle."""
    try:
        url = verify_url(settings.FRONTEND_URL, cert.code)
        pdf = render_certificate_pdf(cert, lang=lang, base_url=settings.FRONTEND_URL)
        html, text = academy_certificate_email(
            url,
            holder_name=cert.holderName,
            course_title=cert.courseTitle,
            score=cert.score,
            total=cert.total,
            code=cert.code,
            language=lang,
        )
        subject = (
            "Your ASE Academy certificate is ready" if lang == "en" else "Tu certificado de ASE Academy ya está listo"
        )
        return send_email(
            to_email=to_email,
            subject=subject,
            html_body=html,
            text_body=text,
            attachments=[(f"{cert.code}.pdf", pdf, "application/pdf")],
        )
    except Exception:  # noqa: BLE001
        logger.exception("Failed to send the academy certificate email for %s", cert.code)
        return False
