from __future__ import annotations

import time as time_module
from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.config import settings
from app.core.database import get_db
from app.core.uptime import STARTED_AT
from app.models.access_request import AccessRequest
from app.models.book_repo_redemption import BookRepoRedemption
from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import AccessRequestStatus, CatalogItemType, UserStatus
from app.models.user import User
from app.modules.admin_dashboard.analytics import build_admin_analytics, build_application_map
from app.modules.admin_dashboard.schemas import (
    AdminAnalyticsRead,
    AdminBookRedemptionListResponse,
    AdminBookRedemptionRead,
    AdminBroadcastRequest,
    AdminBroadcastResponse,
    AdminPurchaseListResponse,
    AdminPurchaseRead,
    AdminPurchasesSummaryRead,
    AdminSearchCatalogHit,
    AdminSearchResponse,
    AdminSearchUserHit,
    AdminStatsRead,
    ApplicationMapRead,
    SystemStatusCounts,
    SystemStatusDatabase,
    SchedulerJobRead,
    SystemStatusRead,
    TopUserPurchases,
)
from app.modules.auth.dependencies import get_current_user, require_permission, require_platform_role
from app.modules.notifications.service import NotificationsService

router = APIRouter(prefix="/api/v1/admin", tags=["admin-dashboard"])


@router.get("/stats", response_model=AdminStatsRead, dependencies=[Depends(require_permission("platform.read"))])
def admin_stats(db: Session = Depends(get_db)):
    catalog_total = int(db.execute(select(func.count()).select_from(CatalogItem)).scalar_one())
    by_type: dict[str, int] = {t.value: 0 for t in CatalogItemType}
    for t_val, n in db.execute(select(CatalogItem.type, func.count()).group_by(CatalogItem.type)).all():
        by_type[t_val.value if isinstance(t_val, CatalogItemType) else t_val] = int(n)
    # Deleted accounts are a soft delete (row kept for referential integrity —
    # see app/core/user_anonymize.py) and suspended ones are inactive, so
    # neither should keep inflating "registered accounts" once removed or
    # deactivated.
    users_total = int(
        db.execute(
            select(func.count())
            .select_from(User)
            .where(User.status.notin_([UserStatus.deleted, UserStatus.suspended]))
        ).scalar_one()
    )
    users_active = int(
        db.execute(select(func.count()).select_from(User).where(User.status == UserStatus.active)).scalar_one()
    )
    purchases_total = int(db.execute(select(func.count()).select_from(CatalogPurchase)).scalar_one())
    requests_pending = int(
        db.execute(
            select(func.count()).select_from(AccessRequest).where(AccessRequest.status == AccessRequestStatus.pending)
        ).scalar_one()
    )
    return AdminStatsRead(
        catalog_total=catalog_total,
        catalog_by_type=by_type,
        users_total=users_total,
        users_active=users_active,
        purchases_total=purchases_total,
        requests_pending=requests_pending,
    )


@router.get(
    "/purchases",
    response_model=AdminPurchaseListResponse,
    dependencies=[Depends(require_permission("purchases.read_all"))],
)
def list_admin_purchases(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=200),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    base_query = (
        select(CatalogPurchase, User.email, CatalogItem.title, CatalogItem.type)
        .join(User, User.id == CatalogPurchase.user_id)
        .join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
    )
    count_query = select(func.count()).select_from(CatalogPurchase).join(
        User, User.id == CatalogPurchase.user_id
    ).join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)

    if search:
        needle = f"%{search.strip()}%"
        clause = or_(User.email.ilike(needle), CatalogItem.title.ilike(needle))
        base_query = base_query.where(clause)
        count_query = count_query.where(clause)
    if date_from:
        clause = CatalogPurchase.created_at >= datetime.combine(date_from, time.min)
        base_query = base_query.where(clause)
        count_query = count_query.where(clause)
    if date_to:
        clause = CatalogPurchase.created_at <= datetime.combine(date_to, time.max)
        base_query = base_query.where(clause)
        count_query = count_query.where(clause)

    total = int(db.execute(count_query).scalar_one())
    rows = db.execute(
        base_query.order_by(CatalogPurchase.created_at.desc()).limit(limit).offset(offset)
    ).all()
    items = [
        AdminPurchaseRead(
            id=p.id,
            user_id=p.user_id,
            catalog_item_id=p.catalog_item_id,
            user_email=email,
            item_title=title,
            item_type=itype.value if hasattr(itype, "value") else str(itype),
            created_at=p.created_at,
        )
        for p, email, title, itype in rows
    ]
    return AdminPurchaseListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get(
    "/book-redemptions",
    response_model=AdminBookRedemptionListResponse,
    dependencies=[Depends(require_permission("catalog.manage"))],
)
def list_admin_book_redemptions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=200),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    base_query = (
        select(BookRepoRedemption, User.email, CatalogItem.title)
        .join(CatalogItem, CatalogItem.id == BookRepoRedemption.catalog_item_id)
        .outerjoin(User, User.id == BookRepoRedemption.user_id)
    )
    count_query = (
        select(func.count())
        .select_from(BookRepoRedemption)
        .join(CatalogItem, CatalogItem.id == BookRepoRedemption.catalog_item_id)
        .outerjoin(User, User.id == BookRepoRedemption.user_id)
    )

    if search:
        needle = f"%{search.strip()}%"
        clause = or_(
            User.email.ilike(needle),
            CatalogItem.title.ilike(needle),
            BookRepoRedemption.github_username.ilike(needle),
        )
        base_query = base_query.where(clause)
        count_query = count_query.where(clause)
    if date_from:
        clause = BookRepoRedemption.created_at >= datetime.combine(date_from, time.min)
        base_query = base_query.where(clause)
        count_query = count_query.where(clause)
    if date_to:
        clause = BookRepoRedemption.created_at <= datetime.combine(date_to, time.max)
        base_query = base_query.where(clause)
        count_query = count_query.where(clause)

    total = int(db.execute(count_query).scalar_one())
    rows = db.execute(
        base_query.order_by(BookRepoRedemption.created_at.desc()).limit(limit).offset(offset)
    ).all()
    items = [
        AdminBookRedemptionRead(
            id=r.id,
            user_id=r.user_id,
            user_email=email,
            catalog_item_id=r.catalog_item_id,
            book_title=title,
            github_username=r.github_username,
            created_at=r.created_at,
        )
        for r, email, title in rows
    ]
    return AdminBookRedemptionListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get(
    "/search",
    response_model=AdminSearchResponse,
    dependencies=[Depends(require_permission("platform.read"))],
)
def admin_global_search(
    q: str = Query(min_length=2, max_length=200),
    db: Session = Depends(get_db),
):
    needle = f"%{q.strip()}%"
    user_rows = db.execute(
        select(User)
        .where(or_(User.email.ilike(needle), User.display_name.ilike(needle)))
        .order_by(User.created_at.desc())
        .limit(8)
    ).scalars().all()
    catalog_rows = db.execute(
        select(CatalogItem)
        .where(or_(CatalogItem.title.ilike(needle), CatalogItem.slug.ilike(needle)))
        .order_by(CatalogItem.created_at.desc())
        .limit(8)
    ).scalars().all()
    return AdminSearchResponse(
        users=[
            AdminSearchUserHit(
                uuid=str(u.uuid),
                email=u.email,
                display_name=u.display_name,
                status=u.status.value if hasattr(u.status, "value") else str(u.status),
            )
            for u in user_rows
        ],
        catalog_items=[
            AdminSearchCatalogHit(
                id=c.id,
                slug=c.slug,
                title=c.title,
                type=c.type.value if hasattr(c.type, "value") else str(c.type),
            )
            for c in catalog_rows
        ],
    )


@router.post(
    "/announcements/broadcast",
    response_model=AdminBroadcastResponse,
    dependencies=[Depends(require_permission("platform.read"))],
)
def broadcast_announcement(
    payload: AdminBroadcastRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sends an in-app notification to every non-superadmin account
    (independent users and every organization member/owner/admin)."""
    recipients = NotificationsService(db).notify_all_non_superadmin(
        type="announcement", title=payload.title, body=payload.body, link=payload.link,
    )
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="announcement.broadcast",
        entity_type="announcement",
        metadata={"title": payload.title, "recipients": recipients},
    )
    return AdminBroadcastResponse(recipients=recipients)


@router.get(
    "/system-status",
    response_model=SystemStatusRead,
    dependencies=[Depends(require_permission("platform.read"))],
)
def system_status(request: Request, db: Session = Depends(get_db)):
    db_start = time_module.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
        db_message = None
    except SQLAlchemyError as exc:
        db_status = "error"
        db_message = exc.__class__.__name__
    db_latency_ms = round((time_module.perf_counter() - db_start) * 1000, 1)

    users_total = int(db.execute(select(func.count()).select_from(User)).scalar_one())
    catalog_total = int(db.execute(select(func.count()).select_from(CatalogItem)).scalar_one())
    requests_pending = int(
        db.execute(
            select(func.count()).select_from(AccessRequest).where(AccessRequest.status == AccessRequestStatus.pending)
        ).scalar_one()
    )

    # Adoption metrics are computed over non-deleted users only — a deleted
    # account's PII (including email_verified_at/two_factor_enabled state)
    # is irrelevant noise for a "how ready is this platform" reading.
    active_users_total = int(
        db.execute(select(func.count()).select_from(User).where(User.status != UserStatus.deleted)).scalar_one()
    )
    email_verified_count = int(
        db.execute(
            select(func.count())
            .select_from(User)
            .where(User.status != UserStatus.deleted, User.email_verified_at.is_not(None))
        ).scalar_one()
    )
    two_factor_count = int(
        db.execute(
            select(func.count())
            .select_from(User)
            .where(User.status != UserStatus.deleted, User.two_factor_enabled.is_(True))
        ).scalar_one()
    )
    email_verified_pct = round(100 * email_verified_count / active_users_total, 1) if active_users_total else 0.0
    two_factor_adoption_pct = round(100 * two_factor_count / active_users_total, 1) if active_users_total else 0.0

    # Surfaces the APScheduler in-process scheduler (account lifecycle,
    # newsletter, test-run polling, etc.) so an admin can confirm background
    # jobs are actually registered/running without shell access to the
    # Railway instance — see docs/OBSERVABILITY.md.
    scheduler = getattr(request.app.state, "scheduler", None)
    scheduler_running = bool(scheduler and scheduler.running)
    scheduler_jobs = [
        SchedulerJobRead(id=job.id, next_run_time=job.next_run_time, pending=job.pending)
        for job in (scheduler.get_jobs() if scheduler else [])
    ]

    return SystemStatusRead(
        api_status="ok",
        uptime_seconds=round(time_module.time() - STARTED_AT, 1),
        environment="production" if settings.DATABASE_URL else "local",
        mvp_mode=settings.MVP_MODE,
        database=SystemStatusDatabase(status=db_status, latency_ms=db_latency_ms, message=db_message),
        github_integration_configured=bool(settings.GITHUB_ACCESS_TOKEN),
        rate_limiting_enabled=True,
        smtp_configured=bool(settings.SMTP_HOST),
        sentry_configured=bool(settings.SENTRY_DSN),
        redis_configured=bool(settings.REDIS_URL),
        email_verified_pct=email_verified_pct,
        two_factor_adoption_pct=two_factor_adoption_pct,
        counts=SystemStatusCounts(
            users_total=users_total, catalog_total=catalog_total, requests_pending=requests_pending
        ),
        scheduler_running=scheduler_running,
        scheduler_jobs=scheduler_jobs,
        checked_at=datetime.utcnow(),
    )


@router.get("/analytics", response_model=AdminAnalyticsRead, dependencies=[Depends(require_permission("platform.read"))])
def admin_analytics(db: Session = Depends(get_db)):
    data = build_admin_analytics(db)
    return AdminAnalyticsRead(**data)


@router.get(
    "/application-map",
    response_model=ApplicationMapRead,
    dependencies=[Depends(require_platform_role("super_admin"))],
)
def admin_application_map(db: Session = Depends(get_db)):
    """Tree data for the dashboard's "application map": real organizations
    (business/enterprise/academy, excluding the platform-core seed anchor
    and deleted/suspended orgs) each with their active members, plus every
    other active user on a separate "individual users" branch. Restricted to
    super_admin — it lists membership details across every tenant, which is
    beyond what the generic `platform.read` permission should expose to an
    org_owner/org_admin scoped to their own organization."""
    data = build_application_map(db)
    return ApplicationMapRead(**data)


@router.get(
    "/purchases/summary",
    response_model=AdminPurchasesSummaryRead,
    dependencies=[Depends(require_permission("purchases.read_all"))],
)
def admin_purchases_summary(db: Session = Depends(get_db)):
    data = build_admin_analytics(db)
    purchases_total = int(db.execute(select(func.count()).select_from(CatalogPurchase)).scalar_one())
    return AdminPurchasesSummaryRead(
        purchases_total=purchases_total,
        revenue_total=data["revenue_total"],
        top_users=[TopUserPurchases(**u) for u in data["top_users"]],
    )
