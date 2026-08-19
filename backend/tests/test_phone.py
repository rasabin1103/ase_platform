"""Unit tests for app/core/phone.py — pure string normalization/validation,
no DB needed."""
from __future__ import annotations

import pytest

from app.core.phone import is_valid_phone_e164, normalize_phone_e164


class TestNormalizePhoneE164:
    def test_none_returns_none(self):
        assert normalize_phone_e164(None) is None

    def test_blank_string_returns_none(self):
        assert normalize_phone_e164("   ") is None

    def test_already_e164_passes_through(self):
        assert normalize_phone_e164("+34600111222") == "+34600111222"

    def test_strips_spaces_dashes_dots_and_parens(self):
        assert normalize_phone_e164("+34 600-111.222") == "+34600111222"
        assert normalize_phone_e164("+34 (600) 111 222") == "+34600111222"

    def test_00_prefix_converted_to_plus(self):
        assert normalize_phone_e164("0034600111222") == "+34600111222"

    def test_bare_digits_get_a_leading_plus(self):
        assert normalize_phone_e164("34600111222") == "+34600111222"

    def test_rejects_too_short(self):
        with pytest.raises(ValueError):
            normalize_phone_e164("+1234")

    def test_rejects_leading_zero_country_code(self):
        with pytest.raises(ValueError):
            normalize_phone_e164("+0600111222")

    def test_rejects_non_numeric_junk(self):
        with pytest.raises(ValueError):
            normalize_phone_e164("not-a-phone")

    def test_rejects_too_long(self):
        with pytest.raises(ValueError):
            normalize_phone_e164("+123456789012345678")


class TestIsValidPhoneE164:
    def test_none_is_valid(self):
        assert is_valid_phone_e164(None) is True

    def test_valid_number(self):
        assert is_valid_phone_e164("+34600111222") is True

    def test_invalid_number(self):
        assert is_valid_phone_e164("not-a-phone") is False

    def test_never_raises(self):
        # Must swallow ValueError from normalize_phone_e164 internally.
        assert is_valid_phone_e164("+0") is False
