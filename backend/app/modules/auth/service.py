from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.config import settings
from app.core.email import send_email
from app.core.email_templates import account_reactivated_email, email_verification_email, password_reset_email
from app.core.totp import build_otpauth_uri, generate_qr_code_data_uri, generate_totp_secret, verify_totp_code
from app.models.enums import SuspensionReason, UserStatus, UserTokenPurpose
from app.models.user import User
from app.modules.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenPair,
    TwoFactorRequiredResponse,
    TwoFactorSetupResponse,
)
from app.modules.auth.security import (
    create_access_token,
    create_refresh_token,
    create_two_factor_pending_token,
    generate_raw_token,
    get_token_subject_uuid,
    hash_action_token,
    hash_password,
    verify_password,
)
from app.modules.auth.tokens_repository import UserTokensRepository
from app.modules.users.repository import UsersRepository

# Link lifetimes — generous enough that a busy person can act on the email
# without racing a timer, short enough that a stale/leaked link stops being
# useful quickly.
PASSWORD_RESET_TOKEN_MINUTES = 60
EMAIL_VERIFICATION_TOKEN_MINUTES = 60 * 24


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UsersRepository(db)
        self.tokens = UserTokensRepository(db)

    def register(self, payload: RegisterRequest) -> User:
        if self.users.get_by_email(str(payload.email)) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

        user = User(
            email=str(payload.email),
            password_hash=hash_password(payload.plain_password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            display_name=payload.display_name,
            status=UserStatus.active,
        )
        self.users.add(user)
        self.db.commit()
        self.db.refresh(user)

        # Best-effort — a broken/unconfigured mail server must never block
        # registration itself; the user can always hit "resend" later.
        self._issue_and_send_verification_email(user)

        return user

    def login(self, payload: LoginRequest) -> TokenPair | TwoFactorRequiredResponse:
        user = self.users.get_by_email(str(payload.email))
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not self._session_allowed(user):
            # Covers: deleted accounts, and manually admin-suspended accounts
            # (suspension_reason is null in that case) — same opaque
            # "Invalid credentials" as before, so this can't be used to
            # enumerate which accounts exist or are suspended.
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        now = datetime.now(timezone.utc)

        # Account-level lockout, independent of the per-IP rate limit on the
        # route itself. Blocks *before* checking the password — while locked,
        # even the correct password is refused, so an attacker can't use
        # response-timing/content to tell a still-locked account from a
        # simply-wrong-password one.
        if user.locked_until is not None and user.locked_until > now:
            retry_after_seconds = max(1, int((user.locked_until - now).total_seconds()))
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account temporarily locked due to too many failed login attempts",
                headers={"Retry-After": str(retry_after_seconds)},
            )

        if not verify_password(payload.password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.LOGIN_MAX_FAILED_ATTEMPTS:
                user.locked_until = now + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
                user.failed_login_attempts = 0
                self.db.commit()
                record_audit_log(
                    self.db,
                    actor_user_id=user.id,
                    action="user.login_locked",
                    entity_type="user",
                    entity_id=str(user.id),
                    metadata={
                        "locked_until": user.locked_until.isoformat(),
                        "lockout_minutes": settings.LOGIN_LOCKOUT_MINUTES,
                    },
                )
            else:
                self.db.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        # Correct password — clear any accumulated failed-attempt count so a
        # legitimate user who fat-fingered their password a few times isn't
        # left one mistake away from a lockout on their next login. Commit
        # immediately: the 2FA branch below returns before the later commit
        # that persists last_login_at, and this reset must survive either way.
        if user.failed_login_attempts or user.locked_until:
            user.failed_login_attempts = 0
            user.locked_until = None
            self.db.commit()

        if user.two_factor_enabled:
            # Password alone isn't enough — hand back a short-lived challenge
            # token instead of a real session; no access/refresh token exists
            # until /auth/2fa/verify-login accepts a valid code.
            return TwoFactorRequiredResponse(challenge_token=create_two_factor_pending_token(user_uuid=user.uuid))

        requires_setup = self._finalize_successful_login(user, now)
        self.db.commit()
        self.db.refresh(user)

        return TokenPair(
            access_token=create_access_token(user_uuid=user.uuid),
            refresh_token=create_refresh_token(user_uuid=user.uuid),
            requires_two_factor_setup=requires_setup,
        )

    def verify_login_two_factor(self, *, challenge_token: str, code: str) -> TokenPair:
        try:
            user_uuid = get_token_subject_uuid(challenge_token, expected_type="two_factor_pending")
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired challenge")

        user = self.users.get_by_uuid(user_uuid)
        # A user only reaches this endpoint with two_factor_enabled already
        # True, so the only suspension reason that can coexist here is
        # inactivity (two_factor_required implies 2FA isn't enabled yet).
        if user is None or not self._session_allowed(user) or not user.two_factor_enabled or not user.two_factor_secret:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired challenge")

        if not verify_totp_code(secret=user.two_factor_secret, code=code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

        self._finalize_successful_login(user, datetime.now(timezone.utc))
        self.db.commit()
        self.db.refresh(user)

        return TokenPair(
            access_token=create_access_token(user_uuid=user.uuid),
            refresh_token=create_refresh_token(user_uuid=user.uuid),
        )

    # --- Account-lifecycle helpers (see app/core/account_lifecycle.py) -----

    @staticmethod
    def _session_allowed(user: User) -> bool:
        """Whether this account may authenticate at all right now. Active
        accounts always can; a suspended account only can if the suspension
        was one of the two automated, self-service-recoverable reasons —
        two_factor_required (must complete 2FA setup to fully unlock) or
        inactivity (a successful login itself reactivates the account).
        A manually admin-suspended account (suspension_reason is null) or a
        deleted account cannot authenticate."""
        if user.status == UserStatus.active:
            return True
        return user.status == UserStatus.suspended and user.suspension_reason in (
            SuspensionReason.two_factor_required.value,
            SuspensionReason.inactivity.value,
        )

    def _finalize_successful_login(self, user: User, now: datetime) -> bool:
        """Shared post-authentication step for both the direct login and the
        2FA-verified login paths: stamps last_login_at, auto-reactivates an
        inactivity-suspended account (logging in successfully *is* the proof
        of continued use), and reports whether the account is still
        suspended pending mandatory 2FA setup."""
        user.last_login_at = now
        if user.status == UserStatus.suspended and user.suspension_reason == SuspensionReason.inactivity.value:
            self._reactivate_account(user, previous_reason=SuspensionReason.inactivity.value)
        return user.status == UserStatus.suspended and user.suspension_reason == SuspensionReason.two_factor_required.value

    def _reactivate_account(self, user: User, *, previous_reason: str) -> None:
        user.status = UserStatus.active
        user.suspension_reason = None
        user.suspended_at = None
        self.db.commit()
        html, text = account_reactivated_email(f"{settings.FRONTEND_URL}/login")
        send_email(
            to_email=user.email,
            subject="Tu cuenta ha sido reactivada — Arce Sabin Engineering",
            html_body=html,
            text_body=text,
        )
        record_audit_log(
            self.db,
            actor_user_id=user.id,
            action="user.auto_reactivated",
            entity_type="user",
            entity_id=str(user.id),
            metadata={"previous_reason": previous_reason},
        )

    # --- Two-factor authentication (TOTP) -------------------------------

    def setup_two_factor(self, user: User) -> TwoFactorSetupResponse:
        if user.two_factor_enabled:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Two-factor authentication is already enabled")

        # A fresh secret on every /setup call — only takes effect once
        # confirmed, so re-scanning the QR simply supersedes an earlier,
        # never-confirmed attempt rather than piling up unused secrets.
        secret = generate_totp_secret()
        user.two_factor_secret = secret
        self.db.commit()

        otpauth_uri = build_otpauth_uri(secret=secret, account_email=user.email)
        return TwoFactorSetupResponse(
            secret=secret,
            otpauth_uri=otpauth_uri,
            qr_code_data_uri=generate_qr_code_data_uri(otpauth_uri),
        )

    def confirm_two_factor(self, user: User, *, code: str) -> None:
        if user.two_factor_enabled:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Two-factor authentication is already enabled")
        if not user.two_factor_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Start setup before confirming a code")
        if not verify_totp_code(secret=user.two_factor_secret, code=code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

        user.two_factor_enabled = True
        was_suspended_for_two_factor = (
            user.status == UserStatus.suspended and user.suspension_reason == SuspensionReason.two_factor_required.value
        )
        self.db.commit()
        record_audit_log(
            self.db, actor_user_id=user.id, action="user.2fa_enabled", entity_type="user", entity_id=str(user.id),
        )
        # Completing 2FA setup is exactly the recovery path for an account
        # suspended for never activating it — unlock immediately.
        if was_suspended_for_two_factor:
            self._reactivate_account(user, previous_reason=SuspensionReason.two_factor_required.value)

    def disable_two_factor(self, user: User, *, password: str) -> None:
        if not user.two_factor_enabled:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Two-factor authentication is not enabled")
        # Require the account password, not a TOTP code, to disable — a lost
        # or reset authenticator device must never be able to lock someone
        # out of turning 2FA back off.
        if not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

        user.two_factor_enabled = False
        user.two_factor_secret = None
        self.db.commit()
        record_audit_log(
            self.db, actor_user_id=user.id, action="user.2fa_disabled", entity_type="user", entity_id=str(user.id),
        )

    def refresh(self, refresh_token: str) -> TokenPair:
        try:
            user_uuid = get_token_subject_uuid(refresh_token, expected_type="refresh")
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        user = self.users.get_by_uuid(user_uuid)
        if user is None or not self._session_allowed(user):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        return TokenPair(
            access_token=create_access_token(user_uuid=user.uuid),
            refresh_token=create_refresh_token(user_uuid=user.uuid),
            requires_two_factor_setup=(
                user.status == UserStatus.suspended
                and user.suspension_reason == SuspensionReason.two_factor_required.value
            ),
        )

    # --- Email verification -------------------------------------------------

    def _issue_and_send_verification_email(self, user: User) -> None:
        raw = generate_raw_token()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=EMAIL_VERIFICATION_TOKEN_MINUTES)
        self.tokens.create(
            user_id=user.id, purpose=UserTokenPurpose.email_verification, token_hash=hash_action_token(raw),
            expires_at=expires_at,
        )
        self.db.commit()
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={raw}"
        html, text = email_verification_email(verify_url, expires_in_minutes=EMAIL_VERIFICATION_TOKEN_MINUTES)
        send_email(to_email=user.email, subject="Confirma tu correo — Arce Sabin Engineering", html_body=html, text_body=text)

    def resend_verification_email(self, user: User) -> None:
        if user.email_verified_at is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified")
        self.tokens.invalidate_outstanding(user_id=user.id, purpose=UserTokenPurpose.email_verification)
        self._issue_and_send_verification_email(user)

    def confirm_email_verification(self, raw_token: str) -> User:
        token_row = self.tokens.find_valid(
            token_hash=hash_action_token(raw_token), purpose=UserTokenPurpose.email_verification,
        )
        if token_row is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification link")
        user = self.users.get_by_id(token_row.user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification link")

        self.tokens.mark_used(token_row)
        user.email_verified_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        record_audit_log(
            self.db, actor_user_id=user.id, action="user.email_verified", entity_type="user", entity_id=str(user.id),
        )
        return user

    # --- Password reset -------------------------------------------------

    def request_password_reset(self, email: str) -> None:
        user = self.users.get_by_email(email)
        # Deliberately silent when the account doesn't exist (or isn't
        # active) — the caller always sees the same "check your email"
        # response either way, so this endpoint can't be used to test which
        # emails are registered.
        if user is None or user.status != UserStatus.active:
            return

        self.tokens.invalidate_outstanding(user_id=user.id, purpose=UserTokenPurpose.password_reset)
        raw = generate_raw_token()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_TOKEN_MINUTES)
        self.tokens.create(
            user_id=user.id, purpose=UserTokenPurpose.password_reset, token_hash=hash_action_token(raw),
            expires_at=expires_at,
        )
        self.db.commit()
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw}"
        html, text = password_reset_email(reset_url, expires_in_minutes=PASSWORD_RESET_TOKEN_MINUTES)
        send_email(to_email=user.email, subject="Restablece tu contraseña — Arce Sabin Engineering", html_body=html, text_body=text)

    def confirm_password_reset(self, *, raw_token: str, new_password: str) -> None:
        token_row = self.tokens.find_valid(
            token_hash=hash_action_token(raw_token), purpose=UserTokenPurpose.password_reset,
        )
        if token_row is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")
        user = self.users.get_by_id(token_row.user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")

        user.password_hash = hash_password(new_password)
        self.tokens.mark_used(token_row)
        # A successful reset invalidates any other outstanding reset link
        # for this account so an older, still-unused email can't be replayed.
        self.tokens.invalidate_outstanding(user_id=user.id, purpose=UserTokenPurpose.password_reset)
        self.db.commit()
        record_audit_log(
            self.db, actor_user_id=user.id, action="user.password_reset", entity_type="user", entity_id=str(user.id),
        )
