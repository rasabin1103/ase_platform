"""DATABASE_URL helpers (SSL, safe logging)."""

from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


def normalize_database_url(url: str) -> str:
    """Map postgres:// / postgresql:// URLs to the psycopg SQLAlchemy driver."""
    trimmed = url.strip()
    if trimmed.startswith("postgres://"):
        trimmed = "postgresql+psycopg://" + trimmed[len("postgres://") :]
    elif trimmed.startswith("postgresql://") and not trimmed.startswith("postgresql+"):
        trimmed = "postgresql+psycopg://" + trimmed[len("postgresql://") :]
    return ensure_remote_sslmode(trimmed)


def ensure_remote_sslmode(url: str) -> str:
    """Supabase / Railway / cloud Postgres typically require SSL."""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if not host or host in ("localhost", "127.0.0.1") or host.endswith(".local"):
        return url

    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if "sslmode" not in query:
        query["sslmode"] = "require"
        parsed = parsed._replace(query=urlencode(query))
        return urlunparse(parsed)
    return url


def database_host_label(url: str) -> str:
    """Hostname only — safe for logs (no user/password)."""
    try:
        parsed = urlparse(url.replace("postgresql+psycopg://", "postgresql://", 1))
        return parsed.hostname or "unknown"
    except Exception:
        return "unknown"


def public_db_error_hint(exc: BaseException) -> str:
    """User-facing hint without credentials."""
    text = str(getattr(exc, "__cause__", None) or exc).lower()
    if "getaddrinfo" in text or "resolve host" in text or "11001" in text or "11004" in text:
        return (
            "Cannot resolve database host. Check DATABASE_URL in backend/.env — use the exact "
            "URI from Supabase (Settings → Database → Connection string, Session pooler recommended) "
            "or local Docker: postgresql+psycopg://ase:ase@127.0.0.1:5432/ase"
        )
    if "password authentication failed" in text or "invalid authorization" in text:
        return "Database authentication failed. Check user/password in DATABASE_URL."
    if "ssl" in text or "certificate" in text:
        return "SSL connection failed. Ensure DATABASE_URL includes sslmode=require (added automatically for remote hosts)."
    if "connection refused" in text or "could not connect" in text:
        return "Database refused connection. Is PostgreSQL running and is the port correct?"
    return exc.__class__.__name__
