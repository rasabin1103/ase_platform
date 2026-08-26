"""Shared password strength rule, used by every schema that accepts a new
plaintext password (self-registration, password reset, and admin-side user
create/update). Kept in one place so the rule can never drift between entry
points — the length bound (`Field(min_length=8, max_length=72)`) already
lives on each schema field individually since Pydantic needs it there for
its own error message, but the *complexity* check (uppercase + lowercase +
digit + symbol) is identical everywhere and belongs in one function.

Requires all four character classes — uppercase, lowercase, digit, and a
symbol — on top of the 8-72 char length bound already enforced by each
schema field.
"""

import re

_UPPERCASE_RE = re.compile(r"[A-ZÁÉÍÓÚÑÜ]")
_LOWERCASE_RE = re.compile(r"[a-záéíóúñü]")
_DIGIT_RE = re.compile(r"\d")
# Anything that isn't a letter, digit, or whitespace counts as a symbol —
# deliberately broad so punctuation from any keyboard layout qualifies,
# rather than hardcoding a specific ASCII symbol set.
_SYMBOL_RE = re.compile(r"[^\w\s]", re.UNICODE)


def validate_password_strength(value: str) -> str:
    """Raise ValueError if `value` doesn't contain at least one uppercase
    letter, one lowercase letter, one digit, and one symbol. Returns the
    value unchanged otherwise, so it can be used directly as a Pydantic
    `field_validator` body."""
    if not _UPPERCASE_RE.search(value):
        raise ValueError("Password must contain at least one uppercase letter")
    if not _LOWERCASE_RE.search(value):
        raise ValueError("Password must contain at least one lowercase letter")
    if not _DIGIT_RE.search(value):
        raise ValueError("Password must contain at least one digit")
    if not _SYMBOL_RE.search(value):
        raise ValueError("Password must contain at least one symbol")
    return value
