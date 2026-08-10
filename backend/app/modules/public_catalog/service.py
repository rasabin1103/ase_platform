from __future__ import annotations

import time
from datetime import datetime

from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.case_study import CaseStudy
from app.models.catalog_item import CatalogItem
from app.models.course import Course
from app.models.enums import CatalogItemStatus, CatalogItemType, CourseStatus
from app.models.service import Service
from app.models.team_member import TeamMember
from app.models.testimonial import Testimonial
from app.models.user import User
from app.modules.plans.service import PlansService
from app.modules.public_catalog.schemas import (
    CatalogByType,
    CatalogPlans,
    CatalogStatsResponse,
    PlatformStatus,
)

_CACHE_TTL_SECONDS = 60
_cache: dict[str, object] = {}


def get_public_pricing_plans(db: Session) -> tuple[list, int]:
    """Same active-plan query used by the public pricing catalog endpoint."""
    svc = PlansService(db)
    return svc.list(limit=200, offset=0, is_active=True, billing_cycle=None)


def _safe_count(db: Session, stmt) -> int:
    try:
        return int(db.execute(stmt).scalar_one())
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        return 0


def _count_courses(db: Session) -> int:
    org_courses = _safe_count(
        db,
        select(func.count())
        .select_from(Course)
        .where(Course.status == CourseStatus.published),
    )
    catalog_courses = _safe_count(
        db,
        select(func.count())
        .select_from(CatalogItem)
        .where(
            CatalogItem.type == CatalogItemType.course,
            CatalogItem.status == CatalogItemStatus.published,
        ),
    )
    return org_courses + catalog_courses


def _count_catalog_items(db: Session, item_type: CatalogItemType) -> int:
    return _safe_count(
        db,
        select(func.count())
        .select_from(CatalogItem)
        .where(
            CatalogItem.type == item_type,
            CatalogItem.status == CatalogItemStatus.published,
        ),
    )


def _count_services(db: Session) -> int:
    return _safe_count(
        db,
        select(func.count()).select_from(Service).where(Service.is_active.is_(True)),
    )


def _count_members(db: Session) -> int:
    return _safe_count(db, select(func.count()).select_from(User))


def _check_db_connected(db: Session) -> bool:
    try:
        db.execute(text("SELECT 1")).scalar_one()
        return True
    except SQLAlchemyError:
        try:
            db.rollback()
        except Exception:
            pass
        return False
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        return False


def _build_catalog_stats(db: Session) -> CatalogStatsResponse:
    last_updated = datetime.utcnow().isoformat()

    by_type = CatalogByType(
        courses=_count_courses(db),
        templates=_count_catalog_items(db, CatalogItemType.product),
        books=_count_catalog_items(db, CatalogItemType.book),
        resources=_count_catalog_items(db, CatalogItemType.resource),
        services=_count_services(db),
    )
    total_items = (
        by_type.courses
        + by_type.templates
        + by_type.books
        + by_type.resources
        + by_type.services
    )

    plan_items, plan_total = get_public_pricing_plans(db)
    plan_names = [plan.name for plan in plan_items if getattr(plan, "name", None)]

    db_connected = _check_db_connected(db)
    platform_status = "operational" if db_connected else "degraded"

    return CatalogStatsResponse(
        total_items=total_items,
        by_type=by_type,
        plans=CatalogPlans(total=plan_total, names=plan_names),
        platform=PlatformStatus(status=platform_status, db_connected=db_connected),
        members_count=_count_members(db),
        last_updated=last_updated,
    )


def get_catalog_stats(db: Session) -> CatalogStatsResponse:
    now = time.monotonic()
    cached_payload = _cache.get("payload")
    cached_at = float(_cache.get("cached_at", 0.0))

    if isinstance(cached_payload, CatalogStatsResponse) and now - cached_at < _CACHE_TTL_SECONDS:
        return cached_payload

    payload = _build_catalog_stats(db)
    _cache["payload"] = payload
    _cache["cached_at"] = now
    return payload


def clear_catalog_stats_cache() -> None:
    _cache.clear()


def list_active_team_members(db: Session) -> list[TeamMember]:
    return list(
        db.execute(
            select(TeamMember)
            .where(TeamMember.is_active.is_(True))
            .order_by(TeamMember.display_order.asc())
        )
        .scalars()
        .all()
    )


def list_active_testimonials(db: Session) -> list[Testimonial]:
    return list(
        db.execute(
            select(Testimonial)
            .where(Testimonial.is_active.is_(True))
            .order_by(Testimonial.display_order.asc())
        )
        .scalars()
        .all()
    )


def list_active_case_studies(db: Session) -> list[CaseStudy]:
    return list(
        db.execute(
            select(CaseStudy)
            .where(CaseStudy.is_active.is_(True))
            .order_by(CaseStudy.display_order.asc())
        )
        .scalars()
        .all()
    )
