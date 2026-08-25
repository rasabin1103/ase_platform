from __future__ import annotations

import bleach

# Allowlist matching what the TipTap admin editor (frontend/src/components/
# admin/premium/RichTextEditor.tsx) can actually produce — kept deliberately
# narrow. Anything outside this list is stripped, not escaped, so pasted
# HTML from other sources can't smuggle in scripts/styles/iframes.
_ALLOWED_TAGS = [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "h2",
    "h3",
    "img",
]

_ALLOWED_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title"],
}

_ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def sanitize_rich_text(html: str) -> str:
    """Strip any tag/attribute/protocol not explicitly allowed above before a
    blog post's TipTap-generated HTML is persisted. Must run on every write
    (create + update) — never trust the frontend alone."""
    cleaned = bleach.clean(
        html or "",
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        protocols=_ALLOWED_PROTOCOLS,
        strip=True,
    )
    return cleaned


def sanitize_plain_text(text: str) -> str:
    """Strips every HTML tag, leaving only plain text — used for blog
    comments, which are plain text (no rich formatting), so any markup a
    commenter pastes in is removed rather than rendered."""
    return bleach.clean(text or "", tags=[], attributes={}, strip=True).strip()
