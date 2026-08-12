from __future__ import annotations

import base64
from io import BytesIO

import pyotp
import qrcode

# Shown as the "issuer" in authenticator apps (Google Authenticator, Authy,
# 1Password, etc.) next to the account email — lets a user tell this entry
# apart from their other 2FA codes.
TOTP_ISSUER = "Arce Sabin Engineering"


def generate_totp_secret() -> str:
    """A fresh random base32 secret — stored on the user row only after
    setup is confirmed with a valid code (see AuthService.confirm_two_factor)."""
    return pyotp.random_base32()


def build_otpauth_uri(*, secret: str, account_email: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=account_email, issuer_name=TOTP_ISSUER)


def verify_totp_code(*, secret: str, code: str) -> bool:
    """`valid_window=1` tolerates the code from one 30s step before/after
    now, which absorbs ordinary clock drift between the user's phone and our
    server without meaningfully widening the guessable window."""
    return pyotp.totp.TOTP(secret).verify(code.strip(), valid_window=1)


def generate_qr_code_data_uri(otpauth_uri: str) -> str:
    """Renders the QR entirely server-side and returns it as a base64 PNG
    data URI — the otpauth:// URI (which embeds the raw secret) never leaves
    our own backend to reach a third-party QR-rendering service."""
    img = qrcode.make(otpauth_uri)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
