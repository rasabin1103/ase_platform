from __future__ import annotations

import io
import logging

from docx import Document
from pypdf import PdfReader

logger = logging.getLogger(__name__)

MAX_CV_BYTES = 5 * 1024 * 1024
ALLOWED_CV_MIMES = frozenset(
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
)


def validate_cv_upload(content: bytes, content_type: str | None) -> str:
    if len(content) > MAX_CV_BYTES:
        raise ValueError("CV exceeds 5 MB limit")
    mime = (content_type or "application/octet-stream").split(";")[0].strip().lower()
    if mime not in ALLOWED_CV_MIMES:
        raise ValueError("Unsupported CV type. Use PDF or Word (.docx).")
    return mime


def extract_cv_text(content: bytes, content_type: str | None) -> str:
    """Validates the upload (same rules as `validate_cv_upload`), then pulls
    out plain text for the keyword-matching analyzer (app/core/cv_matching.py)
    — this never needs to preserve layout/formatting, just the words. Falls
    back to an empty string (rather than failing the whole upload) if the
    file claims to be a valid PDF/DOCX but can't actually be parsed — the
    file itself is still stored either way, it just won't contribute to any
    compatibility score until replaced with a readable one."""
    mime = validate_cv_upload(content, content_type)
    try:
        if mime == "application/pdf":
            reader = PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        document = Document(io.BytesIO(content))
        return "\n".join(p.text for p in document.paragraphs)
    except Exception:
        logger.exception("Failed to extract text from uploaded CV, storing file without text")
        return ""
