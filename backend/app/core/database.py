from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def get_engine() -> Engine:
    # Supabase's transaction pooler (port 6543, pgbouncer) does not support
    # server-side prepared statements. psycopg3 auto-prepares repeated
    # queries by default, which causes "prepared statement already exists"
    # errors under this pooler. Disable autoprepare to avoid it.
    return create_engine(
        settings.sqlalchemy_database_url,
        pool_pre_ping=True,
        connect_args={"prepare_threshold": None},
    )


engine = get_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
