"""client_id / client_secret generation and verification for the
test-execution SaaS API (see app.modules.test_execution).

Mirrors two existing conventions rather than inventing a third: the
random-token generation from app.modules.auth.security
(generate_raw_token/hash_action_token, used for one-time email links), and
password hashing via the module-level `pwd_context` (bcrypt) also in that
file, used here because a client_secret is checked on every API call —
same access pattern as a login password, unlike an email link's token
which is only ever checked once.
"""
from __future__ import annotations

import secrets

from app.modules.auth.security import pwd_context

# Prefixed like Stripe/GitHub API keys so a credential is recognizable at a
# glance (in logs, in a customer's CI config) without decoding it — the
# prefix carries no secret information, it's just a label.
CLIENT_ID_PREFIX = "ase_client_"


def generate_client_id() -> str:
    """Public identifier — safe to display in the UI and in the customer's
    own CI/CD config after creation, unlike the secret."""
    return f"{CLIENT_ID_PREFIX}{secrets.token_hex(16)}"


def generate_client_secret() -> str:
    """High-entropy secret — shown to the user exactly once, at creation
    time, immediately after this call. Never stored in raw form; only
    `hash_client_secret(...)` is persisted."""
    return f"ase_secret_{secrets.token_urlsafe(32)}"


def hash_client_secret(raw_secret: str) -> str:
    return pwd_context.hash(raw_secret)


def verify_client_secret(raw_secret: str, secret_hash: str) -> bool:
    return pwd_context.verify(raw_secret, secret_hash)
