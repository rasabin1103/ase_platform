from __future__ import annotations

import html
import time
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_email
from app.models.case_study import CaseStudy
from app.models.catalog_item import CatalogItem
from app.models.course import Course
from app.models.enums import CatalogItemStatus, CatalogItemType, CourseStatus, JobPostingStatus
from app.models.job_posting import JobPosting
from app.models.plan import Plan
from app.models.service import Service
from app.models.team_member import TeamMember
from app.models.testimonial import Testimonial
from app.models.user import User
from app.modules.plans.service import PlansService
from app.modules.public_catalog.schemas import (
    CatalogByType,
    CatalogPlans,
    CatalogStatsResponse,
    ContactMessageCreate,
    PlanSavingsRead,
    PlatformStatus,
)

_CACHE_TTL_SECONDS = 60
_cache: dict[str, object] = {}


def get_public_pricing_plans(db: Session) -> tuple[list, int]:
    svc = PlansService(db)
    return svc.list(limit=200, offset=0, is_active=True, billing_cycle=None)


def get_plan_savings(db: Session, item_slug: str | None = None) -> list[PlanSavingsRead]:
    plans = db.execute(
        select(Plan).where(Plan.is_active.is_(True), Plan.stripe_price_id.isnot(None))
    ).scalars().all()
    results: list[PlanSavingsRead] = []
    for plan in plans:
        if item_slug is not None and not any(pci.slug == item_slug for pci in plan.included_catalog_items):
            continue
        priced_items = [pci for pci in plan.included_catalog_items if pci.catalog_item.price > 0]
        if not priced_items or plan.price is None:
            continue
        included_value = sum(float(pci.catalog_item.price) for pci in priced_items)
        plan_price = float(plan.price)
        savings = included_value - plan_price
        if savings <= 0:
            continue
        results.append(
            PlanSavingsRead(
                planId=plan.id,
                code=plan.code,
                name=plan.name,
                price=plan_price,
                currency=plan.currency,
                includedItemCount=len(priced_items),
                includedItemsValue=included_value,
                savings=savings,
            )
        )
    results.sort(key=lambda r: r.savings, reverse=True)
    return results


def send_contact_message(payload: ContactMessageCreate) -> bool:
    """Sends the /contact form straight to the admin mailbox — replaces the
    old flow where the primary button just opened the *visitor's* own email
    client (mailto:) with the same effect as the secondary "email us
    directly" link, so the two buttons did the same thing. This one
    actually delivers the message without the visitor needing their own
    mail client configured at all; Reply-To is set to their address so
    replying from the mailbox goes straight back to them. Returns False
    (without raising) if SMTP isn't configured, same best-effort contract
    as every other send_email caller."""
    is_en = payload.language == "en"
    company_line = payload.company.strip() if payload.company else None

    rows = [
        ("Nombre" if not is_en else "Name", html.escape(payload.name)),
        ("Email", html.escape(payload.email)),
    ]
    if company_line:
        rows.append(("Empresa" if not is_en else "Company", html.escape(company_line)))

    rows_html = "".join(
        f'<tr><td style="padding:4px 12px 4px 0;color:#94A3B8;font-size:13px;">{label}</td>'
        f'<td style="padding:4px 0;color:#F8FAFC;font-size:13px;">{value}</td></tr>'
        for label, value in rows
    )
    message_html = html.escape(payload.message).replace("\n", "<br />")

    html_body = f"""\
<div style="background:#020617;padding:32px 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#0B1220;border:1px solid rgba(255,255,255,0.08);border-radius:16px;">
    <tr><td style="padding:28px 28px 8px;">
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#F8FAFC;">
        {"New contact form submission" if is_en else "Nuevo mensaje del formulario de contacto"}
      </h1>
      <table role="presentation" cellpadding="0" cellspacing="0">{rows_html}</table>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);
                  color:#CBD5E1;font-size:14px;line-height:1.6;">{message_html}</div>
    </td></tr>
  </table>
</div>
"""
    text_lines = [f"{label}: {value}" for label, value in [
        ("Nombre" if not is_en else "Name", payload.name),
        ("Email", payload.email),
        *([("Empresa" if not is_en else "Company", company_line)] if company_line else []),
    ]]
    text_body = "\n".join(text_lines) + "\n\n" + payload.message

    subject = (
        f"New contact form message from {payload.name}"
        if is_en
        else f"Nuevo mensaje de contacto de {payload.name}"
    )
    return send_email(
        to_email=settings.SMTP_FROM_EMAIL,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        reply_to=payload.email,
    )


def _safe_count(db: Session, stmt) -> int:
    try:
        return int(db.execute(stmt).scalar_one())
    except Exception:
        try:
            db.rollback()
        except Exception:
            return 0
        return 0


def _count_courses(db: Session) -> int:
    org_courses = _safe_count(
        db, select(func.count()).select_from(Course).where(Course.status == CourseStatus.published)
    )
    catalog_courses = _safe_count(
        db,
        select(func.count())
        .select_from(CatalogItem)
        .where(CatalogItem.type == CatalogItemType.course, CatalogItem.status == CatalogItemStatus.published),
    )
    return org_courses + catalog_courses


def _count_catalog_items(db: Session, item_type: CatalogItemType) -> int:
    return _safe_count(
        db,
        select(func.count())
        .select_from(CatalogItem)
        .where(CatalogItem.type == item_type, CatalogItem.status == CatalogItemStatus.published),
    )


def _count_services(db: Session) -> int:
    return _safe_count(db, select(func.count()).select_from(Service).where(Service.is_active.is_(True)))


def _count_active_job_postings(db: Session) -> int:
    return _safe_count(
        db,
        select(func.count()).select_from(JobPosting).where(JobPosting.status == JobPostingStatus.published),
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
            return False
        return False
    except Exception:
        try:
            db.rollback()
        except Exception:
            return False
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
    total_items = by_type.courses + by_type.templates + by_type.books + by_type.resources + by_type.services
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
        job_postings_active=_count_active_job_postings(db),
        last_updated=last_updated,
    )


def get_catalog_stats(db: Session) -> CatalogStatsResponse:
    now = time.monotonic()
    cached_payload = _cache.get("payload")
    cached_at = float(_cache.get("cached_at", 0.0))
    if isinstance(cached_payload, CatalogStatsResponse) and (now - cached_at) < _CACHE_TTL_SECONDS:
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
            select(TeamMember).where(TeamMember.is_active.is_(True)).order_by(TeamMember.display_order.asc())
        ).scalars().all()
    )


def list_active_testimonials(db: Session) -> list[Testimonial]:
    return list(
        db.execute(
            select(Testimonial).where(Testimonial.is_active.is_(True)).order_by(Testimonial.display_order.asc())
        ).scalars().all()
    )


def get_published_catalog_item_or_404(db: Session, item_id: int) -> CatalogItem:
    """Used by the cover-image endpoint — only a published item's image is
    servable without auth, matching get_published_post_or_404's rationale
    for the blog (no probing/leaking a draft's cover by id)."""
    item = db.execute(
        select(CatalogItem).where(CatalogItem.id == item_id, CatalogItem.status == CatalogItemStatus.published)
    ).scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return item


def list_active_case_studies(db: Session) -> list[CaseStudy]:
    return list(
        db.execute(
            select(CaseStudy).where(CaseStudy.is_active.is_(True)).order_by(CaseStudy.display_order.asc())
        ).scalars().all()
    )
