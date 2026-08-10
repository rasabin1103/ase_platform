from __future__ import annotations

import hashlib
import secrets


def hash_verification_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def generate_email_token() -> str:
    return secrets.token_urlsafe(32)


def generate_sms_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"
