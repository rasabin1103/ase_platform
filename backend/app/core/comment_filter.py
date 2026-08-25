from __future__ import annotations

import re

# Default banned-word list for blog comments (Spanish + English). Deliberately
# a built-in constant rather than an admin-editable table for now — keeps the
# feature shippable without a whole word-management UI; can grow into a real
# admin-managed list later if needed. Matched whole-word, case- and
# accent-insensitive (see _WORD_PATTERN / _strip_accents below).
_BANNED_WORDS: frozenset[str] = frozenset(
    {
        # Spanish
        "puta", "puto", "putas", "putos", "mierda", "gilipollas", "cabron", "cabrona",
        "cabrones", "joder", "coño", "polla", "pollas", "maricon", "marica", "zorra",
        "zorras", "hijoputa", "hijo de puta", "capullo", "subnormal", "retrasado",
        "retrasada", "imbecil", "idiota de mierda",
        # English
        "fuck", "fucking", "fucker", "shit", "bullshit", "bitch", "asshole", "bastard",
        "cunt", "dick", "dickhead", "motherfucker", "prick", "whore", "slut", "retard",
        "faggot", "nigger", "nigga",
    }
)


def _strip_accents(text: str) -> str:
    replacements = str.maketrans("áéíóúÁÉÍÓÚñÑ", "aeiouAEIOUnN")
    return text.translate(replacements)


def _build_pattern() -> re.Pattern[str]:
    # Multi-word entries (e.g. "hijo de puta") use literal spaces; everything
    # else matches on word boundaries so "clasificar" doesn't get flagged for
    # containing "clase" or similar false positives from short fragments.
    escaped = sorted((re.escape(w) for w in _BANNED_WORDS), key=len, reverse=True)
    return re.compile(r"\b(" + "|".join(escaped) + r")\b", flags=re.IGNORECASE)


_PATTERN = _build_pattern()


def contains_banned_words(text: str) -> bool:
    if not text:
        return False
    return _PATTERN.search(_strip_accents(text)) is not None


def censor_text(text: str) -> str:
    """Replaces every banned-word match with asterisks of the same length,
    preserving the rest of the comment untouched. Matching is done against
    an accent-stripped copy so it still lines up 1:1 with the original
    string's character positions (accent stripping never changes length)."""
    if not text:
        return text
    normalized = _strip_accents(text)

    def _replace(match: re.Match[str]) -> str:
        return "*" * len(match.group(0))

    censored = []
    last_end = 0
    for match in _PATTERN.finditer(normalized):
        censored.append(text[last_end:match.start()])
        censored.append("*" * (match.end() - match.start()))
        last_end = match.end()
    censored.append(text[last_end:])
    return "".join(censored)
