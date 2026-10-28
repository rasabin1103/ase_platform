"""Banco de preguntas del simulacro de examen CTFL v4.0 de ASE Academy.

Las preguntas están escritas para el curso (nunca copiadas de exámenes
oficiales) y viven en el backend para que las respuestas correctas no
lleguen nunca al navegador antes de entregar el examen.
"""

from __future__ import annotations

from app.modules.academy.exam_bank import ch1, ch1_en, ch2, ch2_en, ch3, ch3_en, ch4, ch4_en, ch5, ch5_en, ch6, ch6_en, gestion, karate, karate_en, sql, sql_intermedio, sql_intermedio_en
from app.modules.academy.exam_bank.model import (
    CHAPTER_TITLES,
    CHAPTER_TITLES_EN,
    SECTION_TITLES,
    SECTION_TITLES_EN,
    BankQuestion,
    BankText,
)

# Cambiarlo cuando se modifique el banco: queda guardado en cada intento.
BANK_VERSION = "2026.10.28-ctfl250+kar60en+geq+sql+sqien"

QUESTIONS: tuple[BankQuestion, ...] = tuple(
    [*ch1.QUESTIONS, *ch2.QUESTIONS, *ch3.QUESTIONS, *ch4.QUESTIONS, *ch5.QUESTIONS, *ch6.QUESTIONS, *karate.QUESTIONS, *gestion.QUESTIONS, *sql.QUESTIONS, *sql_intermedio.QUESTIONS]
)
#: Primer bloque del curso de Karate (los anteriores son capítulos CTFL).
KARATE_FIRST_CHAPTER = 11
#: Primer bloque del curso «Gestión de equipos QA».
GESTION_FIRST_CHAPTER = 21
#: Primer bloque del curso «SQL desde cero».
SQL_FIRST_CHAPTER = 31
#: Primer bloque del curso «SQL intermedio».
SQL_INTERMEDIO_FIRST_CHAPTER = 41
#: Bloques aún sin versión en inglés (su curso está pendiente de traducción):
#: en inglés se muestran en español hasta que se traduzcan.
PENDING_EN_CHAPTERS = frozenset({21, 22, 23, 24, 25, 26, 31, 32, 33, 34, 35})

BY_ID: dict[str, BankQuestion] = {question.id: question for question in QUESTIONS}
EN: dict[str, BankText] = {**ch1_en.EN, **ch2_en.EN, **ch3_en.EN, **ch4_en.EN, **ch5_en.EN, **ch6_en.EN, **karate_en.EN, **sql_intermedio_en.EN}


def validate_bank() -> list[str]:
    """Problemas de coherencia del banco (lo usa el test del banco)."""
    problems: list[str] = []
    if len(BY_ID) != len(QUESTIONS):
        problems.append("ids duplicados")
    for question in QUESTIONS:
        if question.section not in SECTION_TITLES:
            problems.append(f"{question.id}: sección desconocida {question.section}")
        if question.k not in (1, 2, 3):
            problems.append(f"{question.id}: nivel K inválido")
        if len(question.options) != 4:
            problems.append(f"{question.id}: debe tener 4 opciones")
        if len(set(question.options)) != len(question.options):
            problems.append(f"{question.id}: opciones repetidas")
        if not question.text.strip() or not question.explanation.strip():
            problems.append(f"{question.id}: texto o explicación vacíos")
        if not question.id.startswith(f"c{question.chapter}-"):
            problems.append(f"{question.id}: el id no coincide con el capítulo")
        english = EN.get(question.id)
        if english is None and question.chapter in PENDING_EN_CHAPTERS:
            continue
        if english is None:
            problems.append(f"{question.id}: falta la versión en inglés")
            continue
        if len(english.options) != len(question.options) or len(set(english.options)) != len(english.options):
            problems.append(f"{question.id}: opciones en inglés incorrectas")
        if not english.text.strip() or not english.explanation.strip():
            problems.append(f"{question.id}: texto o explicación en inglés vacíos")
        if (english.code is None) != (question.code is None):
            problems.append(f"{question.id}: el pseudocódigo existe solo en un idioma")
    for extra in sorted(set(EN) - set(BY_ID)):
        problems.append(f"{extra}: traducción sin pregunta en español")
    return problems


__all__ = [
    "BANK_VERSION",
    "BY_ID",
    "CHAPTER_TITLES",
    "CHAPTER_TITLES_EN",
    "EN",
    "PENDING_EN_CHAPTERS",
    "QUESTIONS",
    "SECTION_TITLES",
    "SECTION_TITLES_EN",
    "BankQuestion",
    "BankText",
    "validate_bank",
]
