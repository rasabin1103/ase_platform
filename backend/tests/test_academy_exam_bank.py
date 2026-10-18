"""Banco de preguntas y generación de simulacros (sin base de datos)."""

from __future__ import annotations

import random
import re
from collections import Counter
from pathlib import Path

import pytest

from app.modules.academy.exam_bank import BY_ID, QUESTIONS, validate_bank
from app.modules.academy.exam_config import EXAMS
from app.modules.academy.exam_service import distinct_exams, draw_questions, pool_for


def test_bank_is_consistent():
    assert validate_bank() == []
    assert len(QUESTIONS) >= 120


def test_every_exam_can_be_drawn_several_times_without_repeating():
    assert distinct_exams(EXAMS["qa-profesional"]) >= 3
    assert distinct_exams(EXAMS["testing-fundamentals"]) >= 2
    for config in EXAMS.values():
        assert sum(config.distribution.values()) == config.total
        for chapter, count in config.distribution.items():
            assert len(pool_for(config, chapter)) >= count


def test_draw_respects_distribution_and_shuffles_options():
    config = EXAMS["qa-profesional"]
    drawn = draw_questions(config, Counter(), random.Random(7))
    assert len(drawn) == config.total
    per_chapter = Counter(BY_ID[item["id"]].chapter for item in drawn)
    assert dict(per_chapter) == config.distribution
    for item in drawn:
        assert sorted(item["order"]) == list(range(len(BY_ID[item["id"]].options)))
    # La correcta (índice 0 en el banco) no aparece siempre en la misma posición.
    assert len({item["order"].index(0) for item in drawn}) > 1


def test_successive_exams_prefer_unseen_questions():
    config = EXAMS["qa-profesional"]
    rng = random.Random(3)
    seen: Counter[str] = Counter()
    batches = []
    for _ in range(3):
        drawn = draw_questions(config, seen, rng)
        ids = {item["id"] for item in drawn}
        batches.append(ids)
        seen.update(ids)
    assert batches[0].isdisjoint(batches[1])
    assert batches[2].isdisjoint(batches[0] | batches[1])


def test_course_one_exam_only_uses_its_sections():
    config = EXAMS["testing-fundamentals"]
    drawn = draw_questions(config, Counter(), random.Random(1))
    assert len(drawn) == config.total
    assert all(BY_ID[item["id"]].section in config.sections for item in drawn)


_FRONTEND_COURSES = Path(__file__).resolve().parents[2] / "frontend/src/features/academy/content/courses"


@pytest.mark.skipif(not _FRONTEND_COURSES.exists(), reason="frontend no disponible (imagen solo backend)")
def test_certificate_missions_match_frontend_courses():
    for key, config in EXAMS.items():
        source = (_FRONTEND_COURSES / key / "course.ts").read_text(encoding="utf-8")
        missions = re.findall(r"\{ id: '([a-z0-9-]+)', title:", source)
        assert tuple(missions) == config.missions, key


def test_karate_exam_uses_its_own_blocks_and_labels():
    config = EXAMS["karate-framework"]
    assert distinct_exams(config) >= 2
    drawn = draw_questions(config, Counter(), random.Random(5))
    assert len(drawn) == config.total
    assert {BY_ID[item["id"]].chapter for item in drawn} == {11, 12, 13, 14, 15}
    assert config.chapter_label(11) == "1" and config.section_label("14.2") == "4.2"
    # Los simulacros CTFL nunca sacan preguntas de Karate.
    for key in ("qa-profesional", "testing-fundamentals"):
        drawn = draw_questions(EXAMS[key], Counter(), random.Random(2))
        assert all(BY_ID[item["id"]].chapter < 11 for item in drawn)
