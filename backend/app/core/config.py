from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Arce Sabin Engineering (ASE) Backend"

    # Prefer DATABASE_URL from .env; fallback to POSTGRES_* if not provided.
    DATABASE_URL: str | None = None

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ase"
    POSTGRES_USER: str = "ase"
    POSTGRES_PASSWORD: str = "ase"

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # MVP: hide multi-tenant org routes and use two-role RBAC seeds.
    MVP_MODE: bool = True

    # Personal access token used to auto-invite readers as collaborators on
    # private book repos when they redeem a code (see app/core/github_client.py).
    # Needs admin rights on the target repos: a classic PAT with the `repo`
    # scope, or a fine-grained PAT with "Administration: write" on those repos.
    GITHUB_ACCESS_TOKEN: str | None = None

    # Base URL of the frontend app — used to build links inside transactional
    # emails (password reset, email verification). No trailing slash.
    FRONTEND_URL: str = "http://localhost:5173"

    # Transactional email (password reset, email verification) via a plain
    # SMTP server — bring your own (Gmail Workspace, cPanel mail, Zoho,
    # your hosting provider's mail, etc.). If SMTP_HOST is left empty, email
    # sending is skipped (logged, never raises) so local dev keeps working
    # without a mail server configured.
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_USE_TLS: bool = True
    SMTP_FROM_EMAIL: str = "contact@arcesabinengineering.com"
    SMTP_FROM_NAME: str = "Arce Sabin Engineering"

    # Error monitoring — bring your own Sentry project (free tier is enough
    # to start). If SENTRY_DSN is left empty, Sentry is never initialized, so
    # local dev keeps working without an account configured.
    SENTRY_DSN: str | None = None
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1

    # Shared cache / rate-limiter backend. If REDIS_URL is left empty, the
    # rate limiter falls back to in-memory storage (fine for a single
    # backend process; required once you run more than one replica).
    REDIS_URL: str | None = None

    # Account-level brute-force lockout — independent of (and in addition
    # to) the per-IP rate limit already on POST /auth/login. This one tracks
    # consecutive wrong-password attempts against a specific account, so an
    # attacker who spreads guesses across many IPs (or waits out the 10/min
    # window) still gets locked out after enough wrong passwords.
    LOGIN_MAX_FAILED_ATTEMPTS: int = 10
    LOGIN_LOCKOUT_MINUTES: int = 15

    # Automated account-lifecycle policy (app/core/account_lifecycle.py),
    # run daily by an in-process scheduler and also exposed as an admin
    # "run now" action. super_admin accounts are always exempt. In order:
    #  1. A new account that never activates 2FA within this many days is
    #     suspended (login still works just enough to complete 2FA setup).
    #  2. Any active account that hasn't logged in for this many days is
    #     suspended for inactivity (a later successful login reactivates it
    #     automatically — logging in again is the proof of continued use).
    #  3. Any suspended account (either reason) still not reactivated this
    #     many days after being suspended is soft-deleted (PII anonymized,
    #     same as a manual admin delete).
    # Set ACCOUNT_LIFECYCLE_SWEEP_ENABLED=false to turn the whole policy off
    # without redeploying code.
    ACCOUNT_LIFECYCLE_SWEEP_ENABLED: bool = True
    TWO_FACTOR_GRACE_DAYS: int = 30
    INACTIVITY_SUSPEND_DAYS: int = 180
    SUSPENDED_DELETE_DAYS: int = 180

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
