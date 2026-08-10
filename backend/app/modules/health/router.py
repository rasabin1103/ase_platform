from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/health/db")
def health_db():
    from app.core.database import engine

    try:
        with engine.connect() as conn:
            value = conn.execute(text("SELECT 1")).scalar_one()
        return {"status": "ok", "db": "ok", "result": value}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e.__class__.__name__}")
