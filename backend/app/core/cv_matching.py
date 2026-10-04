from __future__ import annotations

import re
import unicodedata
from functools import lru_cache
from dataclasses import dataclass

# Small curated ES+EN stopword list — common grammatical words that would
# otherwise dominate the keyword overlap score without saying anything
# about actual fit (articles, pronouns, prepositions, generic connectors).
# Deliberately NOT trying to be exhaustive or linguistically complete: this
# is a cheap keyword-overlap heuristic ("por palabras clave"), not an NLP
# pipeline — good enough to separate "mentions Python, React, 5 years QA"
# from "the and of in on at".
_STOPWORDS = frozenset(
    {
        # Spanish
        "de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las",
        "por", "un", "para", "con", "no", "una", "su", "al", "lo", "como",
        "mas", "pero", "sus", "le", "ya", "o", "este", "si", "porque", "esta",
        "entre", "cuando", "muy", "sin", "sobre", "tambien", "me", "hasta",
        "donde", "quien", "desde", "todo", "nos", "durante", "todos", "uno",
        "les", "ni", "contra", "otros", "ese", "eso", "ante", "ellos", "e",
        "esto", "mi", "antes", "algunos", "que", "unos", "yo", "otro",
        "otras", "otra", "él", "tanto", "esa", "estos", "mucho", "quienes",
        "nada", "muchos", "cual", "sea", "poco", "ella", "estar", "estas",
        "algunas", "algo", "nosotros", "tu", "te", "ti", "son", "es", "ser",
        "está", "están", "fue", "años", "año", "años",
        # English
        "the", "and", "for", "with", "that", "this", "from", "have", "has",
        "are", "was", "were", "will", "would", "could", "should", "been",
        "being", "but", "not", "you", "your", "our", "their", "they", "them",
        "his", "her", "its", "about", "into", "over", "after", "before",
        "than", "then", "there", "here", "which", "who", "whom", "what",
        "when", "where", "why", "how", "all", "any", "each", "few", "more",
        "most", "other", "some", "such", "only", "own", "same", "can", "just",
        "also", "both", "either", "neither", "per", "via", "etc",
    }
)

_TOKEN_RE = re.compile(r"[a-z0-9]+")

# Generic job-posting/HR filler vocabulary — grammatically valid words (so
# _STOPWORDS above doesn't catch them) that carry no actual skill, tool, or
# role signal. Without this, "experiencia", "equipo", "responsabilidades",
# "candidato"... dominate the keyword set and the % score ends up rewarding
# CVs that happen to repeat boilerplate HR language rather than ones that
# actually match the role's real requirements. Deliberately excludes
# anything that could itself be a real skill/domain term in some posting
# (e.g. "soporte", "support", "calidad" are kept — too easily a genuine
# requirement for support/QA roles to risk dropping).
_FILLER_WORDS = frozenset(
    {
        # Spanish
        "experiencia", "experiencias", "conocimiento", "conocimientos",
        "capacidad", "capacidades", "habilidad", "habilidades", "equipo",
        "equipos", "trabajo", "trabajar", "empresa", "empresas", "cliente",
        "clientes", "puesto", "puestos", "oferta", "ofertas", "candidato",
        "candidatos", "candidata", "candidatas", "perfil", "perfiles",
        "funcion", "funciones", "actividad", "actividades",
        "responsabilidad", "responsabilidades", "requisito", "requisitos",
        "nivel", "niveles", "oportunidad", "oportunidades", "ambiente",
        "lugar", "forma", "formas", "manera", "maneras", "tiempo",
        "completo", "parcial", "importante", "importantes", "buena",
        "bueno", "buenas", "buenos", "alta", "alto", "altos", "altas",
        "general", "generales", "minimo", "minima", "minimos", "minimas",
        "maximo", "maxima", "maximos", "maximas", "resultado",
        "resultados", "objetivo", "objetivos", "valorable", "valorables",
        "deseable", "deseables", "imprescindible", "imprescindibles",
        "flexibilidad", "dinamico", "dinamica", "dinamicos", "dinamicas",
        "sector", "mercado", "usuario", "usuarios", "informacion",
        "ademas", "dentro", "mismo", "misma", "mismos", "mismas",
        "diferentes", "diferente", "nuevas", "nuevos", "nueva", "nuevo",
        "gran", "grandes", "parte", "partes", "zona", "buscamos", "buscando",
        "buscar", "busca", "buscado", "buscada", "busco", "requiere", "requerimos", "solicita",
        "solicitamos", "ofrecemos", "ofrece", "ofrecer", "incorporamos",
        "incorporar", "necesitamos", "necesita", "valora", "valoramos",
        "valorara", "valoraran",
        # English
        "experience", "skill", "skills", "ability", "abilities", "team",
        "teams", "company", "companies", "client", "clients", "role",
        "roles", "position", "positions", "candidate", "candidates",
        "profile", "profiles", "responsibility", "responsibilities",
        "requirement", "requirements", "opportunity", "opportunities",
        "environment", "job", "jobs", "offer", "offers", "strong", "good",
        "excellent", "level", "levels", "result", "results", "goal",
        "goals", "full", "part", "flexible", "dynamic", "market", "user",
        "users", "minimum", "maximum", "preferred", "desirable",
        "required", "nice", "plus", "years", "year", "based", "including",
        "various", "several", "related", "within", "across", "new",
        "area", "areas", "looking", "seeking", "requires", "require",
        "offering", "join", "hiring", "wanted",
        # Round 2 — generic descriptive/procedural prose that shows up in
        # ANY professional job posting regardless of field (reviewing,
        # quality, evaluation-style postings especially, since they're
        # mostly made of sentences like "document issues clearly" rather
        # than a bullet list of tools). None of these say anything about
        # whether a candidate is a fit for THIS specific role.
        "accionable", "actualmente", "asincrona", "atencion", "claramente",
        "claro", "colaborar", "comodidad", "comunicacion", "contrato",
        "criterios", "criterio", "dedicacion", "detalle", "detalles",
        "detectar", "documentar", "encontrados", "entregables", "errores",
        "escrita", "escrito", "especifica", "especificada",
        "especificadas", "especificado", "especificados", "estandares",
        "estandar", "estructurado", "estructurada", "evolucionar",
        "excelente", "frente", "gaps", "haras", "horario", "horarios",
        "horas", "inconsistencias", "internacionales", "internacional",
        "mejora", "mejoras", "mejorar", "metricas", "metrica", "modalidad",
        "ofrecen", "orientado", "orientada", "outputs", "pagos", "pago",
        "patrones", "patron", "plataforma", "problemas", "problema",
        "procesos", "proceso", "propio", "propia", "proporcionar",
        "pueden", "puede", "realizar", "recurrentes", "recurrente",
        "revisar", "revision", "seguimiento", "semana", "semanal",
        "semanales", "similares", "similar", "soporte", "tarifa",
        "tipico", "tipica", "trabajando", "stripe", "wise", "asincrono",
        "clearly", "currently", "attention", "detail", "details",
        "communication", "contract", "criteria", "criterion", "deliverables",
        "errors", "written", "specified", "standards", "standard",
        "structured", "evolve", "evolving", "facing", "schedule",
        "hours", "inconsistencies", "feedback", "metrics", "metric",
        "improve", "improvement", "process", "processes", "own", "provide",
        "actionable", "conduct", "recurring", "tracking", "typical",
    }
)

# Short tech/role acronyms that would otherwise be dropped by the default
# min_length filter below (most real-world acronyms are 2-3 characters —
# QA, UX, UI — and losing "QA" from a QA posting defeats the whole point).
# Checked case-insensitively against the raw text before the main
# tokenizer's length filter runs, so a CV that spells out "control de
# calidad (QA)" or "diseño UX/UI" still gets credit.
_SHORT_ACRONYMS = frozenset(
    {
        "qa", "ux", "ui", "ia", "ai", "ml", "bi", "pm", "hr", "cx", "db",
        "js", "ts", "qc", "ba", "dx", "ci", "cd",
    }
)

# --- Synonym/seniority expansion ("synonym dictionary" engine) -------------
# Pure keyword overlap has a real ceiling for senior/tech roles: a "QA Lead"
# or "Arquitecto de Software" CV rarely re-states "test strategy" or "system
# design" verbatim — those are *implied* by the title/seniority — and a
# posting in Spanish vs. a CV in English (or vice versa) never share the
# literal word even when they mean the same thing ("calidad" / "quality").
# This layer closes both gaps WITHOUT an LLM/embeddings call: still free,
# instant, and fully deterministic — just a bigger, curated lookup table.

# 1) Single-token synonyms: variant spellings that should count as the same
# keyword. Canonical form is the dict key; `tok not in filtered already
# excludes stopwords/filler before this runs, so these only ever fire on
# real content tokens.
_SYNONYM_CANON: dict[str, str] = {}
for _canonical, _variants in [
    ("javascript", {"js"}),
    ("typescript", {"ts"}),
    ("kubernetes", {"k8s"}),
    ("postgresql", {"postgres", "psql"}),
    ("mongodb", {"mongo"}),
    ("nodejs", {"node"}),
    ("automation", {"automatizacion"}),
    ("testing", {"pruebas"}),
    ("quality", {"calidad"}),
    ("architecture", {"arquitectura"}),
    ("architect", {"arquitecto", "arquitecta"}),
    ("leadership", {"liderazgo"}),
    ("management", {"gestion"}),
    ("security", {"seguridad"}),
    ("performance", {"rendimiento"}),
    ("deployment", {"despliegue"}),
    ("mentoring", {"mentoria", "mentorias"}),
    ("monitoring", {"monitoreo"}),
    ("scalability", {"escalabilidad"}),
    ("strategy", {"estrategia"}),
    ("planning", {"planificacion"}),
]:
    for _variant in _variants:
        _SYNONYM_CANON[_variant] = _canonical

# 2) Role/seniority → implied skill cluster, plus a few bilingual tech-term
# phrases. Each key is matched as a whole-word substring against the CV's
# (or posting's) own text — if present, the whole implied set is added to
# that side's keywords, same as if the CV/posting had spelled them out. A
# QA Lead CV and a posting asking for "test strategy, automation, mentoring"
# now match even though the CV just says "QA Lead" once.
_QA_LEAD_SKILLS = frozenset(
    {"strategy", "automation", "mentoring", "leadership", "planning", "risk management", "ci", "cd", "quality metrics"}
)
_ARCHITECT_SKILLS = frozenset(
    {"architecture", "system design", "scalability", "design patterns", "strategy", "leadership"}
)
_TECH_LEAD_SKILLS = frozenset(
    {"leadership", "mentoring", "architecture", "code review", "strategy"}
)

_PHRASE_IMPLIES: dict[str, frozenset[str]] = {
    # QA / test leadership
    "qa lead": _QA_LEAD_SKILLS,
    "lider de qa": _QA_LEAD_SKILLS,
    "lider qa": _QA_LEAD_SKILLS,
    "test lead": _QA_LEAD_SKILLS,
    "lider de testing": _QA_LEAD_SKILLS,
    "lider de pruebas": _QA_LEAD_SKILLS,
    "qa manager": _QA_LEAD_SKILLS | {"management"},
    "test manager": _QA_LEAD_SKILLS | {"management"},
    "gerente de qa": _QA_LEAD_SKILLS | {"management"},
    "sdet": frozenset({"automation", "scripting", "ci", "cd", "test framework"}),
    # Architecture
    "qa architect": _ARCHITECT_SKILLS | {"automation", "ci", "cd"},
    "arquitecto de calidad": _ARCHITECT_SKILLS | {"automation", "ci", "cd"},
    "arquitecto de testing": _ARCHITECT_SKILLS | {"automation", "ci", "cd"},
    "test architect": _ARCHITECT_SKILLS | {"automation", "ci", "cd"},
    "software architect": _ARCHITECT_SKILLS,
    "arquitecto de software": _ARCHITECT_SKILLS,
    "solution architect": _ARCHITECT_SKILLS | {"stakeholder management"},
    "arquitecto de soluciones": _ARCHITECT_SKILLS | {"stakeholder management"},
    "solutions architect": _ARCHITECT_SKILLS | {"stakeholder management"},
    # Tech / engineering leadership
    "tech lead": _TECH_LEAD_SKILLS,
    "lider tecnico": _TECH_LEAD_SKILLS,
    "technical lead": _TECH_LEAD_SKILLS,
    "engineering manager": frozenset({"leadership", "management", "mentoring", "hiring", "roadmap"}),
    "gerente de ingenieria": frozenset({"leadership", "management", "mentoring", "hiring", "roadmap"}),
    # Specific engineering roles
    "automation engineer": frozenset({"automation", "scripting", "ci", "cd", "test framework"}),
    "ingeniero de automatizacion": frozenset({"automation", "scripting", "ci", "cd", "test framework"}),
    "devops engineer": frozenset({"ci", "cd", "automation", "infrastructure", "monitoring", "cloud"}),
    "ingeniero devops": frozenset({"ci", "cd", "automation", "infrastructure", "monitoring", "cloud"}),
    "scrum master": frozenset({"agile", "facilitation", "leadership"}),
    "product owner": frozenset({"agile", "roadmap", "stakeholder management"}),
    "full stack developer": frozenset({"frontend", "backend", "api", "database"}),
    "desarrollador full stack": frozenset({"frontend", "backend", "api", "database"}),
    "fullstack developer": frozenset({"frontend", "backend", "api", "database"}),
    "backend developer": frozenset({"api", "database", "server"}),
    "desarrollador backend": frozenset({"api", "database", "server"}),
    "frontend developer": frozenset({"ui", "ux", "javascript"}),
    "desarrollador frontend": frozenset({"ui", "ux", "javascript"}),
    "data scientist": frozenset({"machine learning", "statistics", "python"}),
    "cientifico de datos": frozenset({"machine learning", "statistics", "python"}),
    # Bilingual tech-term phrases (so a Spanish posting and an English CV —
    # or vice versa — still line up on the underlying concept)
    "machine learning": frozenset({"ml"}),
    "aprendizaje automatico": frozenset({"ml"}),
    "inteligencia artificial": frozenset({"ia", "ai"}),
    "artificial intelligence": frozenset({"ia", "ai"}),
    "control de calidad": frozenset({"qa"}),
    "aseguramiento de calidad": frozenset({"qa"}),
    "quality assurance": frozenset({"qa"}),
    "integracion continua": frozenset({"ci"}),
    "continuous integration": frozenset({"ci"}),
    "entrega continua": frozenset({"cd"}),
    "despliegue continuo": frozenset({"cd"}),
    "continuous delivery": frozenset({"cd"}),
    "continuous deployment": frozenset({"cd"}),
    "control de versiones": frozenset({"git"}),
    "version control": frozenset({"git"}),
}


def _strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def _normalized_token_stream(text: str) -> str:
    """Accent-stripped/lowercased tokens of `text`, rejoined with single
    spaces — used for multi-word phrase matching (`_PHRASE_IMPLIES`), where
    the source text's real punctuation/line breaks/double spaces would
    otherwise break a substring match like "qa lead" split across a
    line-wrap or written "QA-Lead"."""
    if not text:
        return ""
    normalized = _strip_accents(text.lower())
    return " ".join(_TOKEN_RE.findall(normalized))


def _implied_keywords(token_stream: str) -> set[str]:
    """Scans `token_stream` for every known role/seniority/bilingual phrase
    and unions in whatever skill cluster it implies — see _PHRASE_IMPLIES'
    docstring above. Whole-word matched (``\\b``) so "sdet" doesn't fire
    inside an unrelated longer token."""
    implied: set[str] = set()
    for phrase, extra in _PHRASE_IMPLIES.items():
        if re.search(rf"\b{re.escape(phrase)}\b", token_stream):
            implied |= extra
    return implied


@lru_cache(maxsize=512)
def _extract_keywords_cached(text: str, min_length: int) -> frozenset[str]:
    """Memoized core of extract_keywords. The postings list scores one CV
    against every posting, so without this the same CV text would be
    re-tokenized (and re-expanded through the synonym tables) once per
    posting on every list request. Immutable result so cache hits can be
    shared safely."""
    return frozenset(_extract_keywords_uncached(text, min_length))


def extract_keywords(text: str, *, min_length: int = 3) -> set[str]:
    """Cached wrapper — returns a fresh mutable set (see
    _extract_keywords_uncached for the actual rules)."""
    return set(_extract_keywords_cached(text, min_length))


def _extract_keywords_uncached(text: str, min_length: int = 3) -> set[str]:
    """Lowercase, accent-strip, tokenize, drop stopwords/filler words/short
    tokens/pure numbers, then (a) fold spelling/language variants onto one
    canonical keyword and (b) add whatever skill cluster is implied by any
    role/seniority phrase present (see _SYNONYM_CANON / _PHRASE_IMPLIES
    above) — a senior candidate's CV rarely re-states every skill their
    title already implies, and a posting in one language shouldn't lose a
    match to a CV written in the other. Returns a set (not a ranked list) —
    this heuristic only cares whether a term appears at all, not how often.
    Short tokens (e.g. "qa", "ux") are dropped by `min_length` UNLESS
    they're in `_SHORT_ACRONYMS` — otherwise a "QA" job posting would lose
    its own defining keyword."""
    if not text:
        return set()
    token_stream = _normalized_token_stream(text)
    tokens = token_stream.split(" ") if token_stream else []
    keywords = {
        _SYNONYM_CANON.get(tok, tok)
        for tok in tokens
        if (len(tok) >= min_length or tok in _SHORT_ACRONYMS)
        and tok not in _STOPWORDS
        and tok not in _FILLER_WORDS
        and not tok.isdigit()
    }
    keywords |= _implied_keywords(token_stream)
    return keywords


@dataclass(frozen=True)
class CompatibilityResult:
    percentage: int
    matched_keywords: list[str]
    missing_keywords: list[str]


def compute_compatibility(cv_text: str, posting_text: str) -> CompatibilityResult:
    """What fraction of the job posting's own significant keywords also
    show up somewhere in the CV — a coverage score, not a symmetric
    similarity: a CV that's a superset of the posting's vocabulary still
    scores 100%, and a posting with no extractable keywords (freak case —
    empty description) scores 0% rather than dividing by zero."""
    posting_keywords = _extract_keywords_cached(posting_text, 3)
    if not posting_keywords:
        return CompatibilityResult(percentage=0, matched_keywords=[], missing_keywords=[])

    cv_keywords = _extract_keywords_cached(cv_text, 3)
    matched = sorted(posting_keywords & cv_keywords)
    missing = sorted(posting_keywords - cv_keywords)
    percentage = round(len(matched) / len(posting_keywords) * 100)
    return CompatibilityResult(percentage=percentage, matched_keywords=matched, missing_keywords=missing)
