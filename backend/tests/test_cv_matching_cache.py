"""cv_matching memoization must not change results or leak mutation."""

from __future__ import annotations

from app.core.cv_matching import compute_compatibility, extract_keywords


def test_compatibility_scores_matched_and_missing():
    r = compute_compatibility("QA lead python selenium", "Se busca QA con selenium python y cypress")
    assert "selenium" in r.matched_keywords and "python" in r.matched_keywords
    assert "cypress" in r.missing_keywords
    assert 0 < r.percentage < 100


def test_repeated_calls_are_identical():
    a = compute_compatibility("python selenium", "python selenium cypress")
    b = compute_compatibility("python selenium", "python selenium cypress")
    assert a == b


def test_extract_keywords_returns_a_fresh_mutable_set():
    first = extract_keywords("python selenium")
    first.add("injected")
    assert "injected" not in extract_keywords("python selenium")


def test_empty_posting_scores_zero():
    assert compute_compatibility("python", "").percentage == 0
