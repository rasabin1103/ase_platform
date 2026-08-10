"""Application-wide password hashing and JWT helpers.

JWTs are issued only by this API (not Supabase Auth). Payload rules:

- ``sub``: user UUID string (never email).
- ``typ``: ``"access"`` or ``"refresh"`` so refresh tokens are not accepted as access tokens.

Secrets and algorithms come from :mod:`app.core.config` (``JWT_SECRET_KEY``, ``JWT_ALGORITHM``).
Passwords use bcrypt via passlib.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenType = Literal["access", "refresh", "2fa_pending"]


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_token(*, token_type: TokenType, user_uuid: UUID, expires_delta: timedelta) -> str:
    now = _now()
    payload: dict[str, Any] = {
        "sub": str(user_uuid),
        "typ": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(*, user_uuid: UUID) -> str:
    return create_token(
        token_type="access",
        user_uuid=user_uuid,
        expires_delta=timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES)),
    )


def create_refresh_token(*, user_uuid: UUID) -> str:
    return create_token(
        token_type="refresh",
        user_uuid=user_uuid,
        expires_delta=timedelta(days=int(settings.REFRESH_TOKEN_EXPIRE_DAYS)),
    )


def create_2fa_pending_token(*, user_uuid: UUID) -> str:
    return create_token(
        token_type="2fa_pending",
        user_uuid=user_uuid,
        expires_delta=timedelta(minutes=int(settings.TWO_FACTOR_PENDING_TOKEN_EXPIRE_MINUTES)),
    )


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def sanitize_client_access_token(raw: str | None) -> str:
    """Strip whitespace and accidental nested ``Bearer `` from client-stored tokens."""
    if raw is None:
        return ""
    t = str(raw).strip()
    if not t or t.lower() in ("null", "undefined", "none"):
        return ""
    if t.lower().startswith("bearer "):
        t = t[7:].strip()
    return t


def peek_unverified_token_sub_and_typ(token: str) -> dict[str, str | None]:
    """Decode JWT payload without verification — logging only when validation fails."""
    out: dict[str, str | None] = {"sub_hint": None, "typ_hint": None}
    if not token:
        return out
    try:
        claims = jwt.get_unverified_claims(token)
        sub = claims.get("sub")
        out["sub_hint"] = str(sub)[:48] if sub is not None else None
        typ = claims.get("typ")
        out["typ_hint"] = str(typ) if typ is not None else None
    except Exception:
        pass
    return out


def get_token_subject_uuid(token: str, *, expected_type: TokenType) -> UUID:
    token = sanitize_client_access_token(token)
    if not token:
        raise ValueError("Missing token")
    try:
        payload = decode_token(token)
    except JWTError as e:
        raise ValueError("Invalid token") from e

    if payload.get("typ") != expected_type:
        raise ValueError("Invalid token type")

    sub = payload.get("sub")
    if not sub:
        raise ValueError("Missing subject")

    try:
        return UUID(str(sub))
    except Exception as e:
        raise ValueError("Invalid subject") from e
