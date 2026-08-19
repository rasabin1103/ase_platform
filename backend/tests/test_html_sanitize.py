"""Unit tests for app/core/html_sanitize.py — pure HTML cleaning, no DB
needed. Must never trust the frontend TipTap editor alone; this allowlist
is the real security boundary for blog post HTML."""
from __future__ import annotations

from app.core.html_sanitize import sanitize_rich_text


class TestSanitizeRichText:
    def test_empty_string_stays_empty(self):
        assert sanitize_rich_text("") == ""

    def test_none_like_falsy_input_does_not_crash(self):
        assert sanitize_rich_text(None) == ""  # type: ignore[arg-type]

    def test_allowed_tags_pass_through(self):
        html = "<p>Hello <strong>world</strong> and <em>friends</em></p>"
        assert sanitize_rich_text(html) == html

    def test_strips_script_tag_markup_leaving_inert_text(self):
        # bleach strip=True removes the disallowed tag itself but not its
        # text content — the payload survives as plain, non-executable text,
        # which is what actually matters: no <script> element ever reaches
        # the DOM, so nothing executes.
        result = sanitize_rich_text("<p>safe</p><script>alert('xss')</script>")
        assert "<script" not in result
        assert "</script>" not in result
        assert "<p>safe</p>" in result

    def test_strips_disallowed_tags_but_keeps_text(self):
        result = sanitize_rich_text("<div>keep this text</div>")
        assert "<div>" not in result
        assert "keep this text" in result

    def test_strips_style_and_iframe(self):
        result = sanitize_rich_text('<iframe src="evil.com"></iframe><style>body{color:red}</style>')
        assert "<iframe" not in result
        assert "<style" not in result

    def test_allows_safe_link_attributes(self):
        html = '<a href="https://example.com" title="Example" target="_blank" rel="noopener">link</a>'
        result = sanitize_rich_text(html)
        assert 'href="https://example.com"' in result
        assert "link" in result

    def test_strips_javascript_protocol_from_links(self):
        result = sanitize_rich_text('<a href="javascript:alert(1)">click</a>')
        assert "javascript:" not in result

    def test_strips_onerror_attribute_from_img(self):
        result = sanitize_rich_text('<img src="x.png" onerror="alert(1)">')
        assert "onerror" not in result
        assert "x.png" in result

    def test_allows_headings_and_lists(self):
        html = "<h2>Title</h2><ul><li>One</li><li>Two</li></ul>"
        assert sanitize_rich_text(html) == html

    def test_strips_inline_style_attribute(self):
        result = sanitize_rich_text('<p style="color:red">text</p>')
        assert "style=" not in result
        assert "text" in result
