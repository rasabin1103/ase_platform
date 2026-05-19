from __future__ import annotations

import re

# E.164: + and 7–15 digits (ITU-T E.164 max 15 digits after country code)
E164_PATTERN = re.compile(r"^\+[1-9]\d{6,14}$")


def normalize_phone_e164(value: str | None) -> str | None:
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    cleaned = re.sub(r"[\s\-().]", "", raw)
    if cleaned.startswith("00"):
        cleaned = f"+{cleaned[2:]}"
    if cleaned.isdigit() and not cleaned.startswith("+"):
        cleaned = f"+{cleaned}"
    if not E164_PATTERN.match(cleaned):
        raise ValueError("Phone must be in international format, e.g. +34600111222")
    return cleaned


def is_valid_phone_e164(value: str | None) -> bool:
    if value is None:
        return True
    try:
        normalize_phone_e164(value)
        return True
    except ValueError:
        return False
