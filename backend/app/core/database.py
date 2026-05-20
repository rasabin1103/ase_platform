from __future__ import annotations

# SQLAlchemy engine, session factory, and declarative base.
# Single DATABASE_URL (see app.core.config). Remote poolers disable server-side prepared statements.

import logging
from urllib.parse import urlparse

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings
from app.core.db_url import database_host_label

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _connect_args_for_database_url(url: str) -> dict:
    """PgBouncer (e.g. Supabase pooler :6543) conflicts with psycopg3 server-side prepared statements."""
    try:
        normalized = url.replace("postgresql+psycopg://", "postgresql://", 1)
        host = (urlparse(normalized).hostname or "").lower()
    except Exception:
        return {"prepare_threshold": None}
    if host in ("localhost", "127.0.0.1", "0.0.0.0") or host.endswith(".local"):
        return {}
    return {"prepare_threshold": None}


def get_engine() -> Engine:
    if settings.DATABASE_URL:
        logger.info("[DB] DATABASE_URL detected")
    host = database_host_label(settings.DATABASE_URL)
    logger.info("[DB] Initializing SQLAlchemy engine (host=%s)", host)
    connect_args = _connect_args_for_database_url(settings.DATABASE_URL)
    if connect_args:
        logger.info("[DB] Disabling psycopg prepared statements (PgBouncer / pooler compatibility)")
    return create_engine(settings.DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)


engine = get_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency: one transactional :class:`~sqlalchemy.orm.Session` per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
