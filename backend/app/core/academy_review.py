"""AI review of ASE Academy bug reports (Groq, same provider as semantic_match).

Optional and on-demand: if GROQ_API_KEY is not set the endpoint answers 503
and the simulator simply hides the feature (see ADR 0003, optional
integrations degrade gracefully). The deterministic engine keeps deciding
whether a report is accepted; the AI only adds qualitative feedback on
clarity and reproducibility that the length-based heuristic cannot judge.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.core.semantic_match import _MODELS

logger = logging.getLogger(__name__)

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_TIMEOUT_SECONDS = 20.0

_SYSTEM_PROMPT = """Eres Laura, QA Lead y mentora de una persona recién graduada que hace su \
primer día como QA Junior. Revisas un bug report que ha escrito. Evalúa con criterio profesional:
- Título: ¿dice qué falla y dónde?
- Pasos: ¿alguien podría reproducirlo sin preguntar? ¿Incluye los datos exactos usados?
- Resultado esperado: ¿se basa en el criterio de aceptación, no en una opinión?
- Resultado obtenido: ¿describe con precisión lo que pasó?
- Severidad: ¿está justificada por el impacto real (en banca, dinero mal movido es crítico)?
Sé concreta, amable y breve, en español. No inventes datos que no estén en el report.
Responde SOLO con JSON: {"score": 0-5 (entero), "strengths": [máx 3 frases], \
"improvements": [máx 3 frases accionables], "suggested_title": "título mejorado"}"""


class AcademyReviewError(Exception):
    pass


class AcademyReviewNotConfigured(AcademyReviewError):
    pass


@dataclass
class AcademyReviewResult:
    score: int
    strengths: list[str]
    improvements: list[str]
    suggested_title: str


def _call(model: str, user_prompt: str) -> dict:
    response = httpx.post(
        _GROQ_URL,
        headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "max_tokens": 700,
        },
        timeout=_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return json.loads(response.json()["choices"][0]["message"]["content"])


def review_bug_report(
    *,
    story: str,
    acceptance_criteria: list[str],
    title: str,
    steps: str,
    expected: str,
    actual: str,
    severity: str,
    actual_bug: str | None,
) -> AcademyReviewResult:
    if not settings.GROQ_API_KEY:
        raise AcademyReviewNotConfigured("AI review is not configured (missing GROQ_API_KEY).")
    criteria = "\n".join(f"- {c}" for c in acceptance_criteria[:12])
    user_prompt = (
        f"Historia: {story[:500]}\nCriterios de aceptación:\n{criteria}\n\n"
        f"Bug real que el report intenta describir (contexto para ti, no lo cites literalmente): {actual_bug or 'desconocido'}\n\n"
        f"REPORT DEL ALUMNO\nTítulo: {title[:300]}\nPasos:\n{steps[:1500]}\n"
        f"Esperado: {expected[:600]}\nObtenido: {actual[:600]}\nSeveridad: {severity}"
    )
    last_error: Exception | None = None
    for model in _MODELS:
        try:
            data = _call(model, user_prompt)
            return AcademyReviewResult(
                score=max(0, min(5, int(data["score"]))),
                strengths=[str(s).strip() for s in data.get("strengths", []) if str(s).strip()][:3],
                improvements=[str(s).strip() for s in data.get("improvements", []) if str(s).strip()][:3],
                suggested_title=str(data.get("suggested_title", "")).strip()[:200],
            )
        except (httpx.HTTPError, KeyError, ValueError, TypeError) as exc:
            last_error = exc
            logger.warning("Groq model %s failed for academy review (%s), trying next", model, exc)
    raise AcademyReviewError("AI review temporarily unavailable.") from last_error
