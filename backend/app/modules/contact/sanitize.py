from __future__ import annotations

import html
import re

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_contact_field(value: str | None, *, max_length: int) -> str:
    if not value:
        return ""
    cleaned = _CONTROL_CHARS.sub("", value.strip())
    return cleaned[:max_length]


def escape_for_html(value: str) -> str:
    return html.escape(value, quote=True)
