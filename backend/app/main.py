# ASE FastAPI application (uvicorn app.main:app). Routers: health, auth, MVP catalog bundle, access flows, etc.
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

_startup_log = logging.getLogger("app.main")
_startup_log.info(
    "jwt_startup algorithm=%s secret_key_length=%d",
    settings.JWT_ALGORITHM,
    len(settings.JWT_SECRET_KEY or ""),
)

# Side effect: emit [DB] logs once at import time.
from app.core.database import engine  # noqa: F401

from app.modules.access_requests.router import router as access_requests_router
from app.modules.admin_dashboard.router import router as admin_dashboard_router
from app.modules.admin_users.router import router as admin_users_router
from app.modules.audit_logs.router import router as audit_logs_router
from app.modules.auth.router import router as auth_router
from app.modules.catalog.router import router as catalog_router
from app.modules.course_enrollments.router import router as course_enrollments_router
from app.modules.courses.router import router as courses_router
from app.modules.health.router import router as health_router
from app.modules.invitations.router import router as invitations_router
from app.modules.media.router import router as media_router
from app.modules.pricing.router import router as pricing_router
from app.modules.member_roles.router import router as member_roles_router
from app.modules.mvp_access_requests.router_admin import router as admin_access_requests_router
from app.modules.mvp_access_requests.router_me import router as me_access_requests_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.organization_members.router import router as organization_members_router
from app.modules.organizations.router import router as organizations_router
from app.modules.permissions.router import router as permissions_router
from app.modules.plan_products.router import router as plan_products_router
from app.modules.plans.router import router as plans_router
from app.modules.products.router import router as products_router
from app.modules.resource_assignments.router import router as resource_assignments_router
from app.modules.role_permissions.router import router as role_permissions_router
from app.modules.roles.router import router as roles_router
from app.modules.services.router import router as services_router
from app.modules.subscriptions.router import router as subscriptions_router
from app.modules.users.router import router as users_router


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
)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME)
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(services_router)
    app.include_router(access_requests_router)
    app.include_router(me_access_requests_router)
    app.include_router(admin_access_requests_router)
    app.include_router(audit_logs_router)
    app.include_router(catalog_router)
    app.include_router(admin_dashboard_router)
    app.include_router(admin_users_router)
    app.include_router(pricing_router)
    app.include_router(media_router)

    if not settings.MVP_MODE:
        app.include_router(organizations_router)
        app.include_router(roles_router)
        app.include_router(permissions_router)
        app.include_router(organization_members_router)
        app.include_router(role_permissions_router)
        app.include_router(member_roles_router)
        app.include_router(plans_router)
        app.include_router(products_router)
        app.include_router(plan_products_router)
        app.include_router(subscriptions_router)
        app.include_router(courses_router)
        app.include_router(course_enrollments_router)
        app.include_router(invitations_router)
        app.include_router(onboarding_router)
        app.include_router(resource_assignments_router)
    return app


app = create_app()

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
