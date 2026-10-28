"""Configuración de los exámenes de ASE Academy por curso.

Las misiones de cada curso se repiten aquí (el contenido vive en el
frontend: features/academy/content/courses/<clave>/course.ts) porque el
certificado exige haberlas terminado todas. tests/test_academy_exam_bank.py
comprueba que las dos listas coinciden.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ExamConfig:
    course_key: str
    course_title: str
    course_title_en: str
    title: str
    title_en: str
    certificate_prefix: str
    total: int
    minutes: int
    extended_minutes: int
    pass_mark: int
    distribution: dict[int, int]
    missions: tuple[str, ...]
    sections: frozenset[str] | None = field(default=None)  # None = todo el temario
    # Bloques numerados a partir de 11 en el banco (curso de Karate): se muestran restando esto.
    chapter_offset: int = 0

    def course_title_for(self, lang: str) -> str:
        return self.course_title_en if lang == "en" else self.course_title

    def title_for(self, lang: str) -> str:
        return self.title_en if lang == "en" else self.title

    def allows(self, section: str) -> bool:
        return self.sections is None or section in self.sections

    def chapter_label(self, chapter: int) -> str:
        return str(chapter - self.chapter_offset)

    def section_label(self, section: str) -> str:
        head, _, rest = section.partition(".")
        return f"{int(head) - self.chapter_offset}.{rest}" if rest else section


EXAMS: dict[str, ExamConfig] = {
    "qa-profesional": ExamConfig(
        course_key="qa-profesional",
        course_title="QA Profesional: del testing a la calidad del equipo",
        course_title_en="Professional QA: from testing to team quality",
        title="Simulacro de examen CTFL v4.0",
        title_en="CTFL v4.0 mock exam",
        certificate_prefix="QAP",
        # Formato del examen real: 40 preguntas, 60 min (75 si no es tu
        # idioma nativo), aprobado con 26 (65 %), reparto por capítulo.
        total=40,
        minutes=60,
        extended_minutes=75,
        pass_mark=26,
        distribution={1: 8, 2: 6, 3: 4, 4: 11, 5: 9, 6: 2},
        missions=(
            "m00-equipo",
            "m01-inspeccion",
            "m02-gherkin",
            "m03-cobertura",
            "m04-exploratoria",
            "m05-plan",
            "m06-metricas",
            "m07-configuracion",
            "m08-herramientas",
        ),
    ),
    "testing-fundamentals": ExamConfig(
        course_key="testing-fundamentals",
        course_title="Fundamentos de Testing",
        course_title_en="Testing Fundamentals",
        title="Evaluación final de Fundamentos de Testing",
        title_en="Testing Fundamentals final assessment",
        certificate_prefix="TFU",
        total=20,
        minutes=30,
        extended_minutes=38,
        pass_mark=13,
        distribution={1: 5, 2: 2, 3: 2, 4: 7, 5: 4},
        missions=(
            "m00-primer-dia",
            "m01-historia-ambigua",
            "m02-simulador-prestamos",
            "m03-estados-pago",
            "m04-reportar",
            "m05-release",
            "m06-piramide",
            "m07-incidente",
        ),
        # Secciones que trabaja el curso 1 (docs/academy/qa-profesional/PLAN.md §5).
        sections=frozenset({"1.1", "1.2", "1.3", "2.2", "3.1", "4.1", "4.2", "5.2", "5.5"}),
    ),
    "karate-framework": ExamConfig(
        course_key="karate-framework",
        course_title="Karate Framework: automatización de APIs",
        course_title_en="Karate Framework: API test automation",
        title="Evaluación final teórica de Karate",
        title_en="Karate final theory assessment",
        certificate_prefix="KAR",
        # 30 preguntas (6 por bloque), 45 min (56 con tiempo ampliado), aprobado con 20.
        # El certificado exige además el examen práctico (misión m10-examen),
        # que solo cuenta como terminado si se aprueba (70/100).
        total=30,
        minutes=45,
        extended_minutes=56,
        pass_mark=20,
        distribution={11: 6, 12: 6, 13: 6, 14: 6, 15: 6},
        chapter_offset=10,
        missions=(
            "m00-hola-karate",
            "m01-match",
            "m02-config",
            "m03-payloads",
            "m04-datos",
            "m05-auth",
            "m06-errores",
            "m07-mocks",
            "m08-pipeline",
            "m09-framework",
            "m10-examen",
        ),
    ),
    "gestion-equipos-qa": ExamConfig(
        course_key="gestion-equipos-qa",
        course_title="Gestión de equipos QA: de QA manual a Head of QA",
        course_title_en="Managing QA teams: from manual QA to Head of QA",
        title="Evaluación situacional de gestión de equipos QA",
        title_en="QA team management situational assessment",
        certificate_prefix="GEQ",
        # Juicio situacional: 30 casos (5 por rol), 45 min (56 con tiempo
        # ampliado), aprobado con 21 (70 %). Ver docs/academy/gestion-equipos-qa/PLAN.md §6.
        total=30,
        minutes=45,
        extended_minutes=56,
        pass_mark=21,
        distribution={21: 5, 22: 5, 23: 5, 24: 5, 25: 5, 26: 5},
        chapter_offset=20,
        missions=(
            "m00-la-firma",
            "m01-cuello-botella",
            "m02-suite",
            "m03-junior",
            "m04-estandar",
            "m05-comprar",
            "m06-primer-equipo",
            "m07-conversacion",
            "m08-contratar",
            "m09-recortes",
            "m10-incidente",
            "m11-estrategia",
        ),
    ),
    "sql-iniciacion": ExamConfig(
        course_key="sql-iniciacion",
        course_title="SQL desde cero: consulta los datos de verdad",
        course_title_en="SQL from scratch: query real data",
        title="Test final de SQL desde cero",
        title_en="SQL from scratch final test",
        certificate_prefix="SQL",
        # 30 preguntas (6 por bloque), 40 min (50 con tiempo ampliado), aprobado
        # con 21 (70 %). El certificado exige además el examen práctico (misión
        # m10-examen), que solo cuenta como terminado si se aprueba (70/100).
        # Ver docs/academy/sql-iniciacion/PLAN.md §6.
        total=30,
        minutes=40,
        extended_minutes=50,
        pass_mark=21,
        distribution={31: 6, 32: 6, 33: 6, 34: 6, 35: 6},
        chapter_offset=30,
        missions=(
            "m00-primera-consulta",
            "m01-filtrar",
            "m02-ordenar",
            "m03-nulos",
            "m04-contar",
            "m05-agrupar",
            "m06-join",
            "m07-left-join",
            "m08-modificar",
            "m09-crear-tabla",
            "m10-examen",
        ),
    ),
    "sql-intermedio": ExamConfig(
        course_key="sql-intermedio",
        course_title="SQL intermedio: consultas que responden preguntas de negocio",
        course_title_en="Intermediate SQL: queries that answer business questions",
        title="Test final de SQL intermedio",
        title_en="Intermediate SQL final test",
        certificate_prefix="SQI",
        # 30 preguntas (6 por bloque), 40 min (50 con tiempo ampliado), aprobado
        # con 21 (70 %). El certificado exige además el examen práctico (misión
        # m10-examen), que solo cuenta como terminado si se aprueba (70/100).
        # Ver docs/academy/sql-intermedio/PLAN.md §6.
        total=30,
        minutes=40,
        extended_minutes=50,
        pass_mark=21,
        distribution={41: 6, 42: 6, 43: 6, 44: 6, 45: 6},
        chapter_offset=40,
        missions=(
            "m00-subconsultas",
            "m01-cte",
            "m02-fechas-textos",
            "m03-conjuntos",
            "m04-informes",
            "m05-ranking",
            "m06-tendencias",
            "m07-cruces",
            "m08-calidad",
            "m09-vistas",
            "m10-examen",
        ),
    ),
}


def get_exam(course_key: str) -> ExamConfig | None:
    return EXAMS.get(course_key)
