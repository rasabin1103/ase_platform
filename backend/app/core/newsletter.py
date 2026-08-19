from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.config import settings
from app.core.email import send_email
from app.core.email_templates import newsletter_email
from app.models.blog_post import BlogPost
from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import (
    BlogPostStatus,
    CatalogItemStatus,
    CatalogItemType,
    MembershipStatus,
    OrganizationStatus,
    UserStatus,
)
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.modules.auth.security import create_newsletter_unsubscribe_token

logger = logging.getLogger(__name__)

# How many "new this week" items (catalog + blog combined) show up in the
# email — enough to feel substantial without turning the digest into a wall
# of text; the newest items win if there are more than this many.
MAX_CONTENT_ITEMS = 6

_TYPE_LABEL_ES: dict[CatalogItemType, str] = {
    CatalogItemType.product: "PRODUCTO",
    CatalogItemType.course: "CURSO",
    CatalogItemType.book: "LIBRO",
    CatalogItemType.resource: "RECURSO",
}
_TYPE_LABEL_EN: dict[CatalogItemType, str] = {
    CatalogItemType.product: "PRODUCT",
    CatalogItemType.course: "COURSE",
    CatalogItemType.book: "BOOK",
    CatalogItemType.resource: "RESOURCE",
}


@dataclass
class WeeklyStats:
    new_users_count: int
    # Same 7-day window, one week earlier — the baseline the digest compares
    # against to show "+18% vs last week" style movement.
    previous_new_users_count: int
    # Platform-wide, not scoped to the week — gives the "size of the
    # community" number the digest leads with, regardless of this week's churn.
    total_active_members: int
    # (type_or_None-for-blog, title), newest first, capped at MAX_CONTENT_ITEMS.
    new_content: list[tuple[CatalogItemType | None, str]]
    # (type_or_None-for-blog, count), one row per type that had at least one
    # new item this week — uncapped, drives the per-type bar chart.
    content_by_type: list[tuple[CatalogItemType | None, int]]
    # (title, type_or_None, purchase_count) for the catalog item bought most
    # often this week, or None if there were no purchases at all.
    top_item: tuple[str, CatalogItemType | None, int] | None


def _weekly_stats(db: Session, *, since: datetime, previous_since: datetime) -> WeeklyStats:
    new_users_count = db.execute(
        select(func.count(User.id)).where(User.created_at >= since, User.status != UserStatus.deleted)
    ).scalar_one()

    previous_new_users_count = db.execute(
        select(func.count(User.id)).where(
            User.created_at >= previous_since, User.created_at < since, User.status != UserStatus.deleted
        )
    ).scalar_one()

    total_active_members = db.execute(
        select(func.count(User.id)).where(User.status == UserStatus.active)
    ).scalar_one()

    catalog_rows = db.execute(
        select(CatalogItem.type, CatalogItem.title, CatalogItem.created_at)
        .where(CatalogItem.status == CatalogItemStatus.published, CatalogItem.created_at >= since)
        .order_by(CatalogItem.created_at.desc())
    ).all()

    blog_rows = db.execute(
        select(BlogPost.title, BlogPost.published_at)
        .where(
            BlogPost.status == BlogPostStatus.published,
            BlogPost.published_at.is_not(None),
            BlogPost.published_at >= since,
        )
        .order_by(BlogPost.published_at.desc())
    ).all()

    combined: list[tuple[datetime, CatalogItemType | None, str]] = [
        (row.created_at, row.type, row.title) for row in catalog_rows
    ] + [(row.published_at, None, row.title) for row in blog_rows]
    combined.sort(key=lambda row: row[0], reverse=True)

    new_content = [(item_type, title) for _when, item_type, title in combined[:MAX_CONTENT_ITEMS]]

    type_counts: dict[CatalogItemType | None, int] = {}
    for _when, item_type, _title in combined:
        type_counts[item_type] = type_counts.get(item_type, 0) + 1
    content_by_type = sorted(type_counts.items(), key=lambda row: row[1], reverse=True)

    top_row = db.execute(
        select(CatalogItem.title, CatalogItem.type, func.count(CatalogPurchase.id).label("purchase_count"))
        .join(CatalogPurchase, CatalogPurchase.catalog_item_id == CatalogItem.id)
        .where(CatalogPurchase.created_at >= since)
        .group_by(CatalogItem.id, CatalogItem.title, CatalogItem.type)
        .order_by(func.count(CatalogPurchase.id).desc())
        .limit(1)
    ).first()
    top_item = (top_row.title, top_row.type, int(top_row.purchase_count)) if top_row else None

    return WeeklyStats(
        new_users_count=int(new_users_count),
        previous_new_users_count=int(previous_new_users_count),
        total_active_members=int(total_active_members),
        new_content=new_content,
        content_by_type=content_by_type,
        top_item=top_item,
    )


def _type_label(item_type: CatalogItemType | None, *, language: str) -> str:
    labels = _TYPE_LABEL_EN if language == "en" else _TYPE_LABEL_ES
    return labels[item_type] if item_type is not None else "BLOG"


def _labeled_content(items: list[tuple[CatalogItemType | None, str]], *, language: str) -> list[tuple[str, str]]:
    return [(_type_label(item_type, language=language), title) for item_type, title in items]


def _labeled_content_by_type(
    items: list[tuple[CatalogItemType | None, int]], *, language: str
) -> list[tuple[str, int]]:
    return [(_type_label(item_type, language=language), count) for item_type, count in items]


def _labeled_top_item(
    top_item: tuple[str, CatalogItemType | None, int] | None, *, language: str
) -> tuple[str, str, int] | None:
    if top_item is None:
        return None
    title, item_type, count = top_item
    return title, _type_label(item_type, language=language), count


def _recipients(db: Session) -> list[User]:
    """Union of: individually opted-in active users, and active members of
    organizations that opted in as a whole — deduplicated, since someone
    could qualify both ways."""
    subscribed_users = db.execute(
        select(User).where(User.newsletter_subscribed.is_(True), User.status == UserStatus.active)
    ).scalars().all()

    org_member_users = db.execute(
        select(User)
        .join(OrganizationMember, OrganizationMember.user_id == User.id)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .where(
            Organization.newsletter_subscribed.is_(True),
            Organization.status == OrganizationStatus.active,
            OrganizationMember.membership_status == MembershipStatus.active,
            User.status == UserStatus.active,
        )
    ).scalars().all()

    by_id: dict[int, User] = {u.id: u for u in subscribed_users}
    for u in org_member_users:
        by_id.setdefault(u.id, u)
    return list(by_id.values())


def run_weekly_newsletter(db: Session) -> int:
    """Builds and sends the Friday-morning digest. Best-effort per
    recipient — one bad address or a transient SMTP hiccup never stops the
    rest of the run. Returns how many emails were actually sent."""
    if not settings.NEWSLETTER_SWEEP_ENABLED:
        return 0

    now = datetime.now(timezone.utc)
    since = now - timedelta(days=7)
    previous_since = now - timedelta(days=14)
    stats = _weekly_stats(db, since=since, previous_since=previous_since)
    recipients = _recipients(db)
    explore_url = f"{settings.FRONTEND_URL}/catalog/products"

    sent = 0
    for user in recipients:
        try:
            language = user.preferred_language
            unsubscribe_token = create_newsletter_unsubscribe_token(user_uuid=user.uuid)
            unsubscribe_url = f"{settings.FRONTEND_URL}/newsletter/unsubscribe?token={unsubscribe_token}"
            html, text = newsletter_email(
                new_users_count=stats.new_users_count,
                previous_new_users_count=stats.previous_new_users_count,
                total_active_members=stats.total_active_members,
                new_content=_labeled_content(stats.new_content, language=language),
                content_by_type=_labeled_content_by_type(stats.content_by_type, language=language),
                top_item=_labeled_top_item(stats.top_item, language=language),
                explore_url=explore_url,
                unsubscribe_url=unsubscribe_url,
                language=language,
            )
            subject = (
                "Your weekly digest — Arce Sabin Engineering"
                if language == "en"
                else "Tu resumen semanal — Arce Sabin Engineering"
            )
            send_email(to_email=user.email, subject=subject, html_body=html, text_body=text)
            sent += 1
        except Exception:
            logger.exception("Failed to send weekly newsletter to user %s", user.id)

    record_audit_log(
        db,
        actor_user_id=None,
        action="newsletter.sent",
        entity_type="newsletter",
        entity_id="weekly",
        metadata={
            "recipients": sent,
            "new_users_count": stats.new_users_count,
            "previous_new_users_count": stats.previous_new_users_count,
            "total_active_members": stats.total_active_members,
            "new_content_count": len(stats.new_content),
            "top_item": stats.top_item[0] if stats.top_item else None,
        },
    )
    return sent
