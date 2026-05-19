from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.access_request import AccessRequest
from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import AccessRequestStatus, CatalogItemType, UserStatus
from app.models.user import User
from app.modules.admin_dashboard.analytics import build_admin_analytics
from app.modules.admin_dashboard.schemas import (
    AdminAnalyticsRead,
    AdminPurchaseListResponse,
    AdminPurchaseRead,
    AdminPurchasesSummaryRead,
    AdminStatsRead,
    TopUserPurchases,
)
from app.modules.auth.dependencies import require_permission

router = APIRouter(prefix="/api/v1/admin", tags=["admin-dashboard"])


@router.get("/stats", response_model=AdminStatsRead, dependencies=[Depends(require_permission("platform.read"))])
def admin_stats(db: Session = Depends(get_db)):
    catalog_total = int(db.execute(select(func.count()).select_from(CatalogItem)).scalar_one())
    by_type: dict[str, int] = {}
    for t in CatalogItemType:
        n = int(
            db.execute(select(func.count()).select_from(CatalogItem).where(CatalogItem.type == t)).scalar_one()
        )
        by_type[t.value] = n
    users_total = int(db.execute(select(func.count()).select_from(User)).scalar_one())
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
    db: Session = Depends(get_db),
):
    total = int(db.execute(select(func.count()).select_from(CatalogPurchase)).scalar_one())
    rows = db.execute(
        select(CatalogPurchase, User.email, CatalogItem.title, CatalogItem.type)
        .join(User, User.id == CatalogPurchase.user_id)
        .join(CatalogItem, CatalogItem.id == CatalogPurchase.catalog_item_id)
        .order_by(CatalogPurchase.created_at.desc())
        .limit(limit)
        .offset(offset)
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


@router.get("/analytics", response_model=AdminAnalyticsRead, dependencies=[Depends(require_permission("platform.read"))])
def admin_analytics(db: Session = Depends(get_db)):
    data = build_admin_analytics(db)
    return AdminAnalyticsRead(**data)


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
