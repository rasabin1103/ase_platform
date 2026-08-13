import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.account_lifecycle import run_full_sweep
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.error_logging import record_error_log
from app.core.monitoring import init_sentry
from app.core.rate_limit import limiter
from app.core.security_headers import install_security_headers

logger = logging.getLogger(__name__)


def _run_account_lifecycle_sweep_job() -> None:
    """Daily job body — opens its own short-lived session (the request-scoped
    `get_db` session doesn't exist outside a request) and never lets a
    failure escape, so a bug here can never crash the scheduler thread or
    take down the API process."""
    db = SessionLocal()
    try:
        counts = run_full_sweep(db)
        logger.info("Account lifecycle sweep completed: %s", counts)
    except Exception:
        logger.exception("Account lifecycle sweep failed")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler(timezone="UTC")
    if settings.ACCOUNT_LIFECYCLE_SWEEP_ENABLED:
        # First run shortly after startup (so it's visible without waiting a
        # full day), then every 24h. In-process and single-instance, like
        # the in-memory rate-limiter fallback — fine for this app's current
        # deployment; running with multiple worker processes would run the
        # sweep once per worker (harmless, since every check is idempotent,
        # just redundant).
        scheduler.add_job(
            _run_account_lifecycle_sweep_job,
            "interval",
            hours=24,
            next_run_time=datetime.now(timezone.utc) + timedelta(minutes=1),
            id="account_lifecycle_sweep",
        )
        scheduler.start()
    yield
    if scheduler.running:
        scheduler.shutdown(wait=False)

# Must run before the FastAPI app (and its routers) are constructed so
# Sentry's ASGI/Starlette instrumentation wraps every request. No-ops when
# SENTRY_DSN isn't configured.
init_sentry()

# Routers kept for future multi-tenant; omitted from app when MVP_MODE is on.
_MVP_HIDDEN_ROUTERS: tuple[str, ...] = (
    "organizations",
    "roles",
    "permissions",
    "organization_members",
    "role_permissions",
    "member_roles",
    "plans",
    "products",
    "plan_products",
    "subscriptions",
    "courses",
    "course_enrollments",
    "invitations",
    "resource_assignments",
    "onboarding",
    "org_catalog",
    "org_membership",
)
from app.modules.health.router import router as health_router
from app.modules.users.router import router as users_router
from app.modules.organizations.router import router as organizations_router
from app.modules.roles.router import router as roles_router
from app.modules.permissions.router import router as permissions_router
from app.modules.organization_members.router import router as organization_members_router
from app.modules.role_permissions.router import router as role_permissions_router
from app.modules.member_roles.router import router as member_roles_router
from app.modules.plans.router import router as plans_router
from app.modules.products.router import router as products_router
from app.modules.plan_products.router import router as plan_products_router
from app.modules.subscriptions.router import router as subscriptions_router
from app.modules.courses.router import router as courses_router
from app.modules.course_enrollments.router import router as course_enrollments_router
from app.modules.invitations.router import router as invitations_router
from app.modules.audit_logs.router import router as audit_logs_router
from app.modules.auth.router import router as auth_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.org_catalog.router import router as org_catalog_router
from app.modules.org_membership.router import router as org_membership_router
from app.modules.services.router import router as services_router
from app.modules.access_requests.router import router as access_requests_router
from app.modules.mvp_access_requests.router_admin import router as admin_access_requests_router
from app.modules.mvp_access_requests.router_me import router as me_access_requests_router
from app.modules.resource_assignments.router import router as resource_assignments_router
from app.modules.consumer_catalog.router import router as consumer_catalog_router
from app.modules.catalog_admin.router import router as catalog_admin_router
from app.modules.admin_dashboard.router import router as admin_dashboard_router
from app.modules.admin_error_logs.router import router as admin_error_logs_router
from app.modules.media.router import router as media_router
from app.modules.public_catalog.router import router as public_catalog_router
from app.modules.notifications.router import router as notifications_router
from app.modules.suggestions.router import router as suggestions_router
from app.modules.book_redemption.router import router as book_redemption_router
from app.modules.admin_account_lifecycle.router import router as admin_account_lifecycle_router
from app.modules.blog_admin.router import router as blog_admin_router
from app.modules.public_blog.router import router as public_blog_router
from app.modules.catalog_categories.router import router as catalog_categories_router
from app.modules.admin_data_reset.router import router as admin_data_reset_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(services_router)
    app.include_router(access_requests_router)
    app.include_router(me_access_requests_router)
    app.include_router(admin_access_requests_router)
    app.include_router(audit_logs_router)
    app.include_router(consumer_catalog_router)
    app.include_router(catalog_admin_router)
    app.include_router(admin_dashboard_router)
    app.include_router(admin_error_logs_router)
    app.include_router(admin_account_lifecycle_router)
    app.include_router(media_router)
    app.include_router(public_catalog_router)
    app.include_router(blog_admin_router)
    app.include_router(public_blog_router)
    app.include_router(catalog_categories_router)
    app.include_router(notifications_router)
    app.include_router(suggestions_router)
    app.include_router(book_redemption_router)
    app.include_router(admin_data_reset_router)

    # Public pricing catalog must work in MVP mode (GET /plans/catalog is unauthenticated).
    app.include_router(plans_router)

    if not settings.MVP_MODE:
        app.include_router(organizations_router)
        app.include_router(roles_router)
        app.include_router(permissions_router)
        app.include_router(organization_members_router)
        app.include_router(role_permissions_router)
        app.include_router(member_roles_router)
        app.include_router(products_router)
        app.include_router(plan_products_router)
        app.include_router(subscriptions_router)
        app.include_router(courses_router)
        app.include_router(course_enrollments_router)
        app.include_router(invitations_router)
        app.include_router(onboarding_router)
        app.include_router(resource_assignments_router)
        app.include_router(org_catalog_router)
        app.include_router(org_membership_router)
    return app


app = create_app()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for anything not already handled by a more specific
    handler (HTTPException, RequestValidationError, RateLimitExceeded —
    Starlette resolves those first via the exception's MRO, so this only
    ever fires for genuine bugs). Keeps the same console traceback the team
    is used to seeing in local logs, and additionally persists a row to
    error_logs so it's visible from the admin panel without needing shell
    access to whichever machine is running uvicorn."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    record_error_log(request=request, exc=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:3000",
            "https://project-ou4wr.vercel.app",
            "https://arcesabinengineering.com",
            "https://www.arcesabinengineering.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registered last so it's the outermost middleware — every response
# (including CORS preflights and rate-limit 429s) gets the security headers.
install_security_headers(app)
