from __future__ import annotations

import json
import logging
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Tried in order. Groq retired llama-3.3-70b-versatile and
# llama-3.1-8b-instant on the free/developer tier on 2026-08-16. These are
# their recommended replacements: openai/gpt-oss-120b for the best reasoning
# quality (used for "does this CV's seniority/role imply what this posting
# needs"), falling back to the smaller/faster openai/gpt-oss-20b if the
# primary model is rate-limited or erroring, rather than failing the whole
# feature outright. If Groq changes its lineup again, the current list is
# at https://api.groq.com/openai/v1/models (requires the API key) or
# https://console.groq.com/docs/models.
_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]

_TIMEOUT_SECONDS = 20.0

_SYSTEM_PROMPT = """You are a technical recruiter assistant. You compare a candidate's CV \
against a job posting and judge the REAL fit, including skills implied by seniority or job \
titles (a "QA Lead" or "Architect" implies leadership, strategy, mentoring, automation, etc. \
even if the CV doesn't spell every one of those words out). Do not penalize the CV for not \
literally repeating the posting's wording if the underlying skill is clearly implied by the \
CV's stated experience, role, or seniority.

Respond with ONLY a JSON object (no markdown, no prose outside the JSON) with this exact shape:
{
  "percentage": <integer 0-100, overall fit>,
  "summary": "<1-2 sentence verdict, written in the SAME language as the job posting>",
  "strengths": ["<short phrase>", ...up to 6],
  "gaps": ["<short phrase>", ...up to 6],
  "interview_tips": ["<one actionable sentence>", ...EXACTLY 5]
}
"strengths" are concrete things the CV already covers that matter for this posting. "gaps" are \
concrete things the posting needs that the CV doesn't show evidence of, even considering implied \
seniority skills. Keep every strengths/gaps phrase short (a few words), specific, and in the \
posting's language.
"interview_tips" are EXACTLY 5 concrete, actionable suggestions for how THIS candidate should \
prepare for an interview for THIS posting: e.g. which strengths/projects from the CV to highlight \
with examples, how to address the biggest gaps honestly, what to research about the role, and \
what to be ready to demonstrate. One sentence each, specific to this CV and posting (no generic \
advice like "be on time"), written in the posting's language."""


@dataclass(frozen=True)
class SemanticAnalysisResult:
    percentage: int
    summary: str
    strengths: list[str]
    gaps: list[str]
    interview_tips: list[str]


class SemanticMatchError(Exception):
    """Raised when the semantic analysis couldn't be produced — missing API
    key, every model rate-limited/erroring, or a malformed response. The
    caller (router) turns this into a clear 4xx/5xx; the free keyword-based
    analyzer keeps working regardless, since this is a separate on-demand
    feature, not a dependency of the main compatibility score."""


def _build_user_prompt(cv_text: str, posting_title: str, posting_text: str) -> str:
    # Both texts are truncated generously but boundedly — a CV or a posting
    # with pathologically long text shouldn't blow past Groq's context
    # window or balloon token usage against the free-tier daily cap.
    cv_excerpt = cv_text.strip()[:6000]
    posting_excerpt = posting_text.strip()[:4000]
    return (
        f"JOB POSTING TITLE: {posting_title}\n\n"
        f"JOB POSTING DESCRIPTION:\n{posting_excerpt}\n\n"
        f"CANDIDATE CV:\n{cv_excerpt}"
    )


def _call_groq(model: str, system_prompt: str, user_prompt: str) -> dict:
    response = httpx.post(
        _GROQ_URL,
        headers={
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "max_tokens": 1400,
        },
        timeout=_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    payload = response.json()
    content = payload["choices"][0]["message"]["content"]
    return json.loads(content)


def analyze_semantic_compatibility(
    *, cv_text: str, posting_title: str, posting_text: str
) -> SemanticAnalysisResult:
    """Calls Groq's free-tier chat completions API (OpenAI-compatible) to
    judge CV-vs-posting fit with real language understanding — seniority,
    implied skills, cross-language synonyms — rather than the deterministic
    keyword-overlap heuristic in cv_matching.py. Strictly on-demand (never
    called from the postings list), since it costs a real API call even
    though that call itself is free within Groq's rate limits."""
    if not settings.GROQ_API_KEY:
        raise SemanticMatchError("AI semantic analysis is not configured (missing GROQ_API_KEY).")
    if not cv_text.strip():
        raise SemanticMatchError("No CV text to analyze.")

    user_prompt = _build_user_prompt(cv_text, posting_title, posting_text)
    last_error: Exception | None = None
    for model in _MODELS:
        try:
            data = _call_groq(model, _SYSTEM_PROMPT, user_prompt)
            percentage = max(0, min(100, int(data["percentage"])))
            summary = str(data.get("summary", "")).strip()
            strengths = [str(s).strip() for s in data.get("strengths", []) if str(s).strip()][:6]
            gaps = [str(g).strip() for g in data.get("gaps", []) if str(g).strip()][:6]
            tips = [str(x).strip() for x in data.get("interview_tips", []) if str(x).strip()][:5]
            return SemanticAnalysisResult(
                percentage=percentage, summary=summary, strengths=strengths, gaps=gaps, interview_tips=tips,
            )
        except httpx.HTTPStatusError as exc:
            # 429 (rate limited) or a transient 5xx on this model — try the
            # next one in _MODELS rather than failing immediately.
            last_error = exc
            logger.warning("Groq model %s failed (%s), trying next fallback", model, exc.response.status_code)
            continue
        except (httpx.HTTPError, KeyError, ValueError, TypeError) as exc:
            last_error = exc
            logger.warning("Groq model %s failed (%s), trying next fallback", model, exc)
            continue

    logger.exception("All Groq models failed for semantic compatibility analysis", exc_info=last_error)
    raise SemanticMatchError("AI semantic analysis is temporarily unavailable. Please try again shortly.") from last_error
