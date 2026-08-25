"""At-rest encryption for buyer-supplied test-execution variables (see
app.models.test_execution_config.TestExecutionConfig.values_json).

No dedicated encryption utility existed anywhere in this codebase before
this — ApiCredential.client_secret_hash and the auth password hashes are
all one-way (bcrypt), which is wrong here: a buyer's own BASE_URL/API_TOKEN
values must be recovered in plaintext right before being handed to
github_client.dispatch_workflow as `inputs`.

Rather than adding a new required env var, the Fernet key is deterministically
derived from the existing `settings.JWT_SECRET_KEY` (the only secret-like
setting already present) via SHA-256, which conveniently also produces
exactly the 32 raw bytes Fernet needs before its own urlsafe-base64 encoding
step. This is a key-derivation function, not reuse of the JWT secret's raw
bytes as a signing key elsewhere — a leaked Fernet key does not expose the
JWT signing key and vice versa is not guaranteed either, so treat this as a
convenience over a brand-new secret, not as equivalent isolation to two
fully independent secrets. If that isolation ever matters, promote this to
its own `SECRET_ENCRYPTION_KEY` setting; `_derive_fernet_key` accepts the
seed as a parameter for exactly this reason.
"""
from __future__ import annotations

import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

__all__ = ["encrypt_value", "decrypt_value", "DecryptionError"]


class DecryptionError(Exception):
    """Raised when a stored ciphertext can't be decrypted with the current
    key — e.g. data corruption, or JWT_SECRET_KEY having been rotated
    without a corresponding re-encryption pass over stored values."""


def _derive_fernet_key(seed: str) -> bytes:
    digest = hashlib.sha256(seed.encode("utf-8")).digest()  # 32 raw bytes
    return base64.urlsafe_b64encode(digest)  # Fernet requires b64-encoded 32 bytes


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    return Fernet(_derive_fernet_key(settings.JWT_SECRET_KEY))


def encrypt_value(plaintext: str) -> str:
    """Encrypts a single string value. Returns an opaque token safe to store
    in a JSONB column (str, not bytes)."""
    token = _fernet().encrypt(plaintext.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_value(ciphertext: str) -> str:
    try:
        raw = _fernet().decrypt(ciphertext.encode("utf-8"))
    except InvalidToken as exc:
        raise DecryptionError("Stored value could not be decrypted with the current key.") from exc
    return raw.decode("utf-8")
