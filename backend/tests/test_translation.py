"""DeepL ES->EN translation: request shape, fallback and catalog wiring (HTTP mocked)."""

from __future__ import annotations

from types import SimpleNamespace

import httpx

from app.core import translation
from app.modules.catalog_admin.service import CatalogAdminService


def _fake_post(captured: dict, *, fail: bool = False):
    def post(url, headers=None, json=None, timeout=None):
        captured.update(url=url, headers=headers, json=json, timeout=timeout)
        if fail:
            raise httpx.ConnectError("boom")
        return httpx.Response(
            200,
            json={"translations": [{"text": f"EN::{json['text'][0]}"}]},
            request=httpx.Request("POST", url),
        )

    return post


def test_translate_calls_deepl_with_spanish_source(monkeypatch):
    captured: dict = {}
    monkeypatch.setattr(translation.settings, "DEEPL_API_KEY", "abc:fx")
    monkeypatch.setattr(translation.httpx, "post", _fake_post(captured))

    out = translation.translate_es_to_en("## Hola\n\n- **Mundo** con `SELECT`")

    assert out == "EN::## Hola\n\n- **Mundo** con `SELECT`"
    assert captured["url"] == "https://api-free.deepl.com/v2/translate"
    assert captured["headers"]["Authorization"] == "DeepL-Auth-Key abc:fx"
    assert captured["json"]["source_lang"] == "ES"
    assert captured["json"]["target_lang"] == "EN-US"


def test_long_text_gets_longer_timeout(monkeypatch):
    captured: dict = {}
    monkeypatch.setattr(translation.settings, "DEEPL_API_KEY", "abc")
    monkeypatch.setattr(translation.httpx, "post", _fake_post(captured))

    translation.translate_es_to_en("a" * 3000)

    assert captured["url"].startswith("https://api.deepl.com")
    assert captured["timeout"] >= 30


def test_translate_falls_back_to_none_without_key_or_on_error(monkeypatch):
    monkeypatch.setattr(translation.settings, "DEEPL_API_KEY", None)
    assert translation.translate_es_to_en("hola") is None

    monkeypatch.setattr(translation.settings, "DEEPL_API_KEY", "abc")
    monkeypatch.setattr(translation.httpx, "post", _fake_post({}, fail=True))
    assert translation.translate_es_to_en("hola") is None


def test_catalog_item_gets_deepl_translation_when_spanish_changes(monkeypatch):
    monkeypatch.setattr(translation.settings, "DEEPL_API_KEY", "abc")
    monkeypatch.setattr(translation.httpx, "post", _fake_post({}))
    monkeypatch.setattr("app.modules.catalog_admin.service.translate_es_to_en", translation.translate_es_to_en)

    item = SimpleNamespace(
        title="Curso", short_description="Corto", long_description="Largo", title_en="Curso", short_description_en="Corto", long_description_en="Largo"
    )
    payload = SimpleNamespace(title_en=None, short_description_en=None, long_description_en=None)
    service = CatalogAdminService.__new__(CatalogAdminService)
    service._ensure_english_fields(item, payload, changed_es={"title": True, "short_description": True, "long_description": True})

    assert (item.title_en, item.short_description_en, item.long_description_en) == ("EN::Curso", "EN::Corto", "EN::Largo")

    # An edit that doesn't touch the Spanish text leaves a real English alone.
    item.title_en = "Manual"
    service._ensure_english_fields(item, payload, changed_es={})
    assert item.title_en == "Manual"

    # ...but retries a mirror that was never translated (e.g. expired key).
    item.title_en = item.title
    service._ensure_english_fields(item, payload, changed_es={})
    assert item.title_en == "EN::Curso"
