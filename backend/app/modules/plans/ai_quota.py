from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_analysis_usage_event import AiAnalysisUsageEvent
from app.modules.plans.quota import get_active_subscription_and_plan

"""Monthly cap on AI job-fit analyses, set per plan by the admin
(Plan.monthly_ai_analysis_limit, NULL = unlimited). Users with no active
plan subscription get settings.AI_ANALYSIS_FREE_MONTHLY_LIMIT. Resets on the
1st of each calendar month (UTC); unused analyses never roll over. Only a
freshly computed analysis counts — re-opening an already-analyzed posting is
a cache hit and never costs anything (see AiAnalysisUsageEvent)."""

QUOTA_EXHAUSTED_DETAIL = "monthly_ai_analysis_quota_exhausted"


@dataclass
class AiAnalysisQuotaStatus:
    limit: int | None  # None = unlimited
    used: int
    remaining: int | None  # None = unlimited


def _month_start(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _limit_for_user(db: Session, user_id: int) -> int | None:
    found = get_active_subscription_and_plan(db, user_id)
    if found is None:
        return settings.AI_ANALYSIS_FREE_MONTHLY_LIMIT
    _, plan = found
    return plan.monthly_ai_analysis_limit


def get_ai_analysis_quota_status(db: Session, user_id: int) -> AiAnalysisQuotaStatus:
    now = datetime.now(timezone.utc)
    used = int(
        db.execute(
            select(func.count())
            .select_from(AiAnalysisUsageEvent)
            .where(AiAnalysisUsageEvent.user_id == user_id, AiAnalysisUsageEvent.created_at >= _month_start(now))
        ).scalar_one()
    )
    limit = _limit_for_user(db, user_id)
    remaining = None if limit is None else max(0, limit - used)
    return AiAnalysisQuotaStatus(limit=limit, used=used, remaining=remaining)


def enforce_ai_analysis_quota(db: Session, user_id: int) -> None:
    """Raises 403 when this month's allowance is spent. Call BEFORE the
    billable provider call, and record_ai_analysis_usage only after it
    succeeded, so a failed attempt never burns an analysis."""
    quota = get_ai_analysis_quota_status(db, user_id)
    if quota.remaining is not None and quota.remaining <= 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=QUOTA_EXHAUSTED_DETAIL)


def record_ai_analysis_usage(db: Session, *, user_id: int, job_posting_id: int | None) -> None:
    """Adds the event to the session WITHOUT committing — the caller commits
    it together with the saved analysis so both succeed or fail as one."""
    db.add(AiAnalysisUsageEvent(user_id=user_id, job_posting_id=job_posting_id))
