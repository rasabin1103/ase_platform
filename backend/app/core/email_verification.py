from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_email
from app.core.email_templates import email_verification_email
from app.models.enums import UserTokenPurpose
from app.models.user import User
from app.modules.auth.security import generate_raw_token, hash_action_token
from app.modules.auth.tokens_repository import UserTokensRepository

# Shared with AuthService — kept here so both self-registration and
# admin-created accounts issue/verify links with identical lifetimes. Short
# on purpose (2h, not 24h): a verification link is meant to be used right
# after signup, not saved for later.
EMAIL_VERIFICATION_TOKEN_MINUTES = 60 * 2


def issue_and_send_verification_email(db: Session, user: User) -> None:
    """Mints a fresh email-verification token and emails the confirmation
    link. Best-effort — send_email() never raises, so a broken/unconfigured
    SMTP server never blocks whatever created the account (self-registration
    or an admin creating the user directly); the account can always request
    a new link via POST /auth/email-verification/resend once mail is fixed.

    Used by both AuthService.register (self-signup) and
    UsersService.create_user (admin-created accounts) — an admin creating a
    user no longer gets to skip verification, since "an admin vouches for
    it" doesn't actually confirm the mailbox exists or is spelled correctly."""
    tokens = UserTokensRepository(db)
    raw = generate_raw_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=EMAIL_VERIFICATION_TOKEN_MINUTES)
    tokens.create(
        user_id=user.id,
        purpose=UserTokenPurpose.email_verification,
        token_hash=hash_action_token(raw),
        expires_at=expires_at,
    )
    db.commit()
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={raw}"
    language = user.preferred_language
    html, text = email_verification_email(
        verify_url, expires_in_hours=EMAIL_VERIFICATION_TOKEN_MINUTES // 60, language=language,
    )
    subject = "Confirm your email — Arce Sabin Engineering" if language == "en" else "Confirma tu correo — Arce Sabin Engineering"
    send_email(to_email=user.email, subject=subject, html_body=html, text_body=text)
