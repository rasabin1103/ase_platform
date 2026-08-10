from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenType = Literal["access", "refresh"]


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


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def get_token_subject_uuid(token: str, *, expected_type: TokenType) -> UUID:
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

