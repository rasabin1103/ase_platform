from __future__ import annotations

import logging
import traceback as traceback_module

from starlette.requests import Request

logger = logging.getLogger(__name__)


def _resolve_user_id_best_effort(db, request: Request) -> int | None:
    """Decode the bearer token if present, purely to attribute the error log
    to a user for triage. Never raises — an expired/malformed/missing token
    just means the row is logged with user_id=None, which is fine; this is
    diagnostics, not an auth check."""
    from uuid import UUID

    from app.modules.auth.security import decode_token
    from app.modules.users.repository import UsersRepository

    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None
    try:
        payload = decode_token(auth_header[7:])
        sub = payload.get("sub")
        if not sub:
            return None
        user = UsersRepository(db).get_by_uuid(UUID(str(sub)))
        return user.id if user else None
    except Exception:
        return None


def record_error_log(*, request: Request, exc: Exception) -> None:
    """Best-effort persistence of an unhandled exception — mirrors
    app.core.audit.record_audit_log: never raises, uses its own short-lived
    DB session (this runs from the global exception handler, outside the
    normal Depends(get_db) request lifecycle, and the request's own session
    may already be in a broken/rolled-back state by the time we get here).

    This is the self-hosted substitute for Sentry described to the user:
    good enough to see and triage 5xx bugs from the admin panel without any
    third-party account. If SENTRY_DSN *is* configured, Sentry captures the
    same exception independently via its ASGI middleware — this is not
    mutually exclusive with it."""
    from app.core.database import SessionLocal
    from app.models.error_log import ErrorLog

    # Built from exc.__traceback__ directly rather than traceback.format_exc()
    # (which reads the *ambient* sys.exc_info()) — this function may be
    # called from a context where that ambient state isn't reliable, so take
    # the traceback explicitly from the exception object we were handed.
    tb = "".join(traceback_module.format_exception(type(exc), exc, exc.__traceback__))

    db = SessionLocal()
    try:
        user_id = _resolve_user_id_best_effort(db, request)
        db.add(
            ErrorLog(
                method=request.method,
                path=request.url.path,
                status_code=500,
                error_type=exc.__class__.__name__,
                message=str(exc)[:4000],
                traceback=tb[:20000],
                user_id=user_id,
                ip_address=request.client.host if request.client else None,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to record error log for %s %s", request.method, request.url.path)
    finally:
        db.close()
