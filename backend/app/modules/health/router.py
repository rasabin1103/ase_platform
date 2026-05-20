from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.db_url import database_host_label, public_db_error_hint

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/health/db")
def health_db():
    from app.core.config import settings
    from app.core.database import engine

    host = database_host_label(settings.DATABASE_URL)
    try:
        with engine.connect() as conn:
            value = conn.execute(text("SELECT 1")).scalar_one()
        return {"status": "ok", "db": "ok", "host": host, "result": value}
    except SQLAlchemyError as e:
        hint = public_db_error_hint(e)
        logger.warning("health_db failed for host=%s: %s", host, e.__class__.__name__)
        raise HTTPException(
            status_code=503,
            detail={"error": "database_unavailable", "host": host, "hint": hint},
        ) from e
