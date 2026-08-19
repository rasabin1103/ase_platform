from __future__ import annotations

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# DeepL's official translation API. Free ("Developer") API keys are
# distinguished from paid ones by a ":fx" suffix and must hit the
# api-free.deepl.com host instead of api.deepl.com — see
# https://developers.deepl.com/docs/getting-started/auth for the split.
_DEEPL_FREE_BASE_URL = "https://api-free.deepl.com"
_DEEPL_PRO_BASE_URL = "https://api.deepl.com"


def translation_configured() -> bool:
    """Whether real ES->EN translation can run at all. False means every
    save silently mirrors the Spanish text into the English fields instead
    (see translate_es_to_en) — surfaced to admins in the Plans UI so that
    isn't mistaken for a bug."""
    return bool(settings.DEEPL_API_KEY)


def translate_es_to_en(text: str | None) -> str | None:
    """Best-effort Spanish -> English translation for a single short piece of
    plan marketing copy, via the DeepL API (free "Developer" tier: 1M
    characters, no expiry, no credit card). Never raises: any failure (no
    API key configured, network error, unexpected response shape) just
    returns None, and the caller falls back to mirroring the Spanish text —
    a plan can always be saved even if translation is unavailable."""
    if not text or not text.strip():
        return None
    if not settings.DEEPL_API_KEY:
        return None

    base_url = _DEEPL_FREE_BASE_URL if settings.DEEPL_API_KEY.endswith(":fx") else _DEEPL_PRO_BASE_URL

    try:
        response = httpx.post(
            f"{base_url}/v2/translate",
            headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
            json={
                "text": [text],
                "source_lang": "ES",
                "target_lang": "EN-US",
            },
            timeout=8.0,
        )
        response.raise_for_status()
        data = response.json()
        translations = data.get("translations") or []
        translated = str(translations[0]["text"]).strip() if translations else ""
        return translated or None
    except Exception:
        logger.exception("Plan field translation failed (ES -> EN via DeepL); falling back to Spanish text")
        return None
