"""Tipos del banco de preguntas del simulacro (ver docs/academy/simulacro.md).

Convención: en el banco la opción correcta va SIEMPRE la primera. El
servidor baraja las opciones de cada pregunta en cada intento y guarda la
permutación, así que el orden del banco nunca llega al navegador.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BankQuestion:
    id: str
    section: str  # "4.2" (sección del temario CTFL v4.0)
    k: int  # nivel K: 1 recordar, 2 entender, 3 aplicar
    text: str
    options: tuple[str, ...]  # options[0] es la correcta
    explanation: str
    code: str | None = None  # pseudocódigo opcional, se muestra en monoespaciada

    @property
    def chapter(self) -> int:
        return int(self.section.split(".")[0])


@dataclass(frozen=True)
class BankText:
    """Versión en inglés de una pregunta (misma convención: la correcta primero)."""

    text: str
    options: tuple[str, ...]
    explanation: str
    code: str | None = None


def en(text: str, correct: str, distractors: list[str], explanation: str, code: str | None = None) -> BankText:
    return BankText(text=text, options=(correct, *distractors), explanation=explanation, code=code)


def q(
    id: str,
    section: str,
    k: int,
    text: str,
    correct: str,
    distractors: list[str],
    explanation: str,
    code: str | None = None,
) -> BankQuestion:
    return BankQuestion(
        id=id,
        section=section,
        k=k,
        text=text,
        options=(correct, *distractors),
        explanation=explanation,
        code=code,
    )


CHAPTER_TITLES: dict[int, str] = {
    1: "Fundamentos de las pruebas",
    2: "Pruebas a lo largo del ciclo de vida",
    3: "Pruebas estáticas",
    4: "Análisis y diseño de pruebas",
    5: "Gestión de las pruebas",
    6: "Herramientas de prueba",
}

CHAPTER_TITLES_EN: dict[int, str] = {
    1: "Fundamentals of testing",
    2: "Testing throughout the software development lifecycle",
    3: "Static testing",
    4: "Test analysis and design",
    5: "Managing the test activities",
    6: "Test tools",
}

SECTION_TITLES_EN: dict[str, str] = {
    "1.1": "What is testing?",
    "1.2": "Why is testing necessary?",
    "1.3": "Testing principles",
    "1.4": "Test activities, testware and test roles",
    "1.5": "Essential skills and good practices",
    "2.1": "Testing in the context of an SDLC",
    "2.2": "Test levels and test types",
    "2.3": "Maintenance testing",
    "3.1": "Static testing basics",
    "3.2": "Feedback and review process",
    "4.1": "Test techniques overview",
    "4.2": "Black-box test techniques",
    "4.3": "White-box test techniques",
    "4.4": "Experience-based test techniques",
    "4.5": "Collaboration-based test approaches",
    "5.1": "Test planning",
    "5.2": "Risk management",
    "5.3": "Test monitoring, control and completion",
    "5.4": "Configuration management",
    "5.5": "Defect management",
    "6.1": "Tool support for testing",
    "6.2": "Benefits and risks of test automation",
}

SECTION_TITLES: dict[str, str] = {
    "1.1": "Qué es probar",
    "1.2": "Por qué es necesario probar",
    "1.3": "Principios de las pruebas",
    "1.4": "Actividades, testware y roles",
    "1.5": "Habilidades y buenas prácticas",
    "2.1": "Pruebas en el ciclo de vida",
    "2.2": "Niveles y tipos de prueba",
    "2.3": "Pruebas de mantenimiento",
    "3.1": "Fundamentos de la prueba estática",
    "3.2": "Feedback y proceso de revisión",
    "4.1": "Técnicas de prueba",
    "4.2": "Técnicas de caja negra",
    "4.3": "Técnicas de caja blanca",
    "4.4": "Técnicas basadas en la experiencia",
    "4.5": "Enfoques basados en la colaboración",
    "5.1": "Planificación de las pruebas",
    "5.2": "Gestión de riesgos",
    "5.3": "Seguimiento, control y cierre",
    "5.4": "Gestión de la configuración",
    "5.5": "Gestión de defectos",
    "6.1": "Herramientas de prueba",
    "6.2": "Beneficios y riesgos de la automatización",
}
