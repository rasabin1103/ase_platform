"""Store and load TOTP secrets at rest.

TODO: When application-level encryption is available, replace ``plain:`` storage with
``enc:`` ciphertext using a dedicated data-encryption key. Never log or return secrets.
"""

from __future__ import annotations

_PLAIN_PREFIX = "plain:"


def store_totp_secret(raw_secret: str) -> str:
    return f"{_PLAIN_PREFIX}{raw_secret}"


def load_totp_secret(stored: str | None) -> str | None:
    if not stored:
        return None
    if stored.startswith(_PLAIN_PREFIX):
        return stored[len(_PLAIN_PREFIX) :]
    # Future: if stored.startswith("enc:"): decrypt(...)
    return None
