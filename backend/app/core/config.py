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
    # Also used (read-only Contents API) to serve the in-platform resource
    # viewer/download — no extra permission needed beyond repo read access.
    GITHUB_ACCESS_TOKEN: str | None = None

    # Default repo for resource items (scripts...) that don't set their own
    # repo_url — the single shared "ASE-Catalog" repo, organized by subtype
    # folders. Set once here instead of retyping the same URL on every
    # resource in the admin form; an item can still override it with its
    # own repo_url if it ever needs a different repo.
    GITHUB_CATALOG_REPO_URL: str | None = None

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

    # Daily sweep that thanks users for every 6-month tenure milestone (see
    # app/core/anniversary.py). Independent of ACCOUNT_LIFECYCLE_SWEEP_ENABLED.
    ANNIVERSARY_SWEEP_ENABLED: bool = True

    # Daily sweep that promotes subscribers to their next loyalty tier
    # (Silver/Gold/Platinum/Infinite — see app/core/loyalty.py). Independent
    # of the other sweeps; issuing Stripe discount codes on upgrade still
    # requires STRIPE_SECRET_KEY to be configured (skipped, not blocked, if
    # it's missing).
    LOYALTY_SWEEP_ENABLED: bool = True

    # Weekly Friday-morning digest (see app/core/newsletter.py) — new
    # signups, new catalog/blog content, thank-you note. Only reaches
    # opted-in users/organizations regardless of this flag; this just turns
    # the whole feature off without redeploying code.
    NEWSLETTER_SWEEP_ENABLED: bool = True

    # Frequent poll (every 45s, not a daily sweep like the others above) that
    # syncs pending/queued/in_progress TestRun rows against the GitHub
    # Actions API (see app/core/test_run_polling.py) — no webhook is
    # configured on this backend today, so this is how run status/conclusion
    # ever gets updated after the initial dispatch.
    TEST_RUN_POLL_SWEEP_ENABLED: bool = True

    # Stripe billing (subscriptions on Plans only, for now). If
    # STRIPE_SECRET_KEY is left empty, the billing module's endpoints return
    # a clear "not configured" error instead of failing with an unclear
    # Stripe SDK exception — so local dev/tests keep working without an
    # account configured. STRIPE_WEBHOOK_SECRET verifies that incoming
    # webhook requests genuinely came from Stripe (signature check) — get it
    # from the webhook endpoint's settings in the Stripe Dashboard.
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None

    # Auto-translates plan marketing copy (name/description/CTA) from
    # Spanish to English on create/update via the DeepL API — see
    # app/core/translation.py. Free "Developer" API keys (from
    # deepl.com/pro-api, no credit card needed) end in ":fx" and are
    # auto-routed to the free endpoint. If left empty, English fields
    # simply mirror the Spanish text instead of failing, so plan creation
    # always works with or without this key.
    DEEPL_API_KEY: str | None = None

    # Cloudflare Turnstile (captcha) on POST /auth/register — see
    # app/core/turnstile.py. Get the secret key from the Cloudflare Turnstile
    # dashboard (dash.cloudflare.com -> Turnstile). If left empty, captcha
    # verification is skipped entirely, so local dev/tests keep working
    # without an account configured.
    TURNSTILE_SECRET_KEY: str | None = None

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
