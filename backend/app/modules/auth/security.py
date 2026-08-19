from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenType = Literal["access", "refresh", "two_factor_pending", "newsletter_unsubscribe"]


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_token(
    *, token_type: TokenType, user_uuid: UUID, expires_delta: timedelta, extra_claims: dict[str, Any] | None = None,
) -> str:
    now = _now()
    payload: dict[str, Any] = {
        "sub": str(user_uuid),
        "typ": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(*, user_uuid: UUID) -> str:
    return create_token(
        token_type="access",
        user_uuid=user_uuid,
        expires_delta=timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES)),
    )


# Support/admin "login as user" tokens: short-lived (30 min, not renewable —
# there is no matching refresh token, so the session simply expires and the
# admin has to re-issue one) and tagged with `imp_by` so it's traceable back
# to the admin who started the session if ever inspected.
IMPERSONATION_TOKEN_MINUTES = 30


def create_impersonation_token(*, target_user_uuid: UUID, actor_user_uuid: UUID) -> str:
    return create_token(
        token_type="access",
        user_uuid=target_user_uuid,
        expires_delta=timedelta(minutes=IMPERSONATION_TOKEN_MINUTES),
        extra_claims={"imp_by": str(actor_user_uuid)},
    )


def create_refresh_token(*, user_uuid: UUID) -> str:
    return create_token(
        token_type="refresh",
        user_uuid=user_uuid,
        expires_delta=timedelta(days=int(settings.REFRESH_TOKEN_EXPIRE_DAYS)),
    )


def create_newsletter_unsubscribe_token(*, user_uuid: UUID) -> str:
    """A one-click unsubscribe link must work indefinitely (someone opening
    a 6-month-old email should still be able to opt out), so this is
    deliberately long-lived rather than a short expiring window like the
    other action tokens — 10 years, i.e. effectively "doesn't expire" in
    practice without adding no-expiry special-casing to `create_token`."""
    return create_token(
        token_type="newsletter_unsubscribe",
        user_uuid=user_uuid,
        expires_delta=timedelta(days=3650),
    )


# A password check that passes for a 2FA-enabled account doesn't issue real
# access/refresh tokens yet — only this short-lived, single-purpose token,
# which is only ever accepted by /auth/2fa/verify-login and nothing else
# (distinct `typ` claim), so it can't be replayed as a real session token
# even if intercepted.
TWO_FACTOR_PENDING_TOKEN_MINUTES = 5


def create_two_factor_pending_token(*, user_uuid: UUID) -> str:
    return create_token(
        token_type="two_factor_pending",
        user_uuid=user_uuid,
        expires_delta=timedelta(minutes=TWO_FACTOR_PENDING_TOKEN_MINUTES),
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


# --- One-time action tokens (password reset / email verification) ---------
# Deliberately NOT JWTs: these back a single-use link emailed to the user, so
# they need to be individually revocable and checkable against "already
# used" — a stateless JWT can't do that without extra bookkeeping anyway, so
# a plain random token, stored only as a hash, is simpler and just as safe.


def generate_raw_token() -> str:
    """A high-entropy, URL-safe token — only ever transmitted once, inside
    the emailed link. Never stored in the database in this form."""
    return secrets.token_urlsafe(32)


def hash_action_token(raw_token: str) -> str:
    """One-way hash used to look the token up in the DB, so a database leak
    alone never yields a usable reset/verification link."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

