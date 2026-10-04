"""Plan-level monthly cap on AI job-fit analyses.

Covers the quota module (free fallback, per-plan limit, unlimited), the
rule that cached results never cost quota, the 403 once the allowance is
spent, that re-uploading a CV can't refund quota, and the GET /ai-quota
endpoint the frontend reads. Groq is stubbed — nothing here calls out.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.semantic_match import SemanticAnalysisResult
from app.models.ai_analysis_usage_event import AiAnalysisUsageEvent
from app.models.enums import (
    JobContractType,
    JobPostingStatus,
    JobSalaryType,
    JobScheduleType,
    JobWorkMode,
    SubscriptionProvider,
    SubscriptionStatus,
)
from app.models.job_posting import JobPosting
from app.models.job_posting_semantic_analysis import JobPostingSemanticAnalysis
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.auth.dependencies import get_default_organization_id
from app.modules.job_postings import service as jp_service
from app.modules.job_postings.service import JobPostingConsumerService
from app.modules.plans.ai_quota import (
    enforce_ai_analysis_quota,
    get_ai_analysis_quota_status,
    record_ai_analysis_usage,
)

from .conftest import auth_headers


def _make_posting(db: Session, n: int) -> JobPosting:
    posting = JobPosting(
        title=f"QA Engineer {n}",
        description="Automation with Selenium and Python",
        link_url="https://example.com/apply",
        salary_type=JobSalaryType.gross_yearly,
        salary_amount=Decimal("30000"),
        contract_type=JobContractType.permanent,
        work_mode=JobWorkMode.remote,
        schedule_type=JobScheduleType.full_time,
        category="QA",
        status=JobPostingStatus.published,
        published_at=datetime.now(timezone.utc),
    )
    db.add(posting)
    db.commit()
    db.refresh(posting)
    return posting


def _subscribe_to_plan(db: Session, user: User, *, ai_limit: int | None) -> Plan:
    plan = Plan(code=f"ai-{ai_limit}", name="AI plan", price=Decimal("9.00"), currency="EUR", monthly_ai_analysis_limit=ai_limit)
    db.add(plan)
    db.commit()
    org_id = get_default_organization_id(db, user)
    db.add(
        Subscription(
            organization_id=org_id,
            plan_id=plan.id,
            provider=SubscriptionProvider.manual,
            status=SubscriptionStatus.active,
            starts_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    return plan


@pytest.fixture()
def stub_groq(monkeypatch):
    """Replaces the Groq call; counts how many times it was really invoked."""
    calls = {"n": 0}

    def fake(*, cv_text: str, posting_title: str, posting_text: str) -> SemanticAnalysisResult:
        calls["n"] += 1
        return SemanticAnalysisResult(
            percentage=70, summary="ok", strengths=["python"], gaps=["cypress"], interview_tips=["a", "b", "c", "d", "e"]
        )

    monkeypatch.setattr(jp_service, "analyze_semantic_compatibility", fake)
    monkeypatch.setattr(jp_service, "translate_batch_es_to_en", lambda texts: None)
    return calls


def test_user_without_plan_gets_the_free_default(db: Session, independent_user: User):
    status_ = get_ai_analysis_quota_status(db, independent_user.id)
    assert status_.limit == settings.AI_ANALYSIS_FREE_MONTHLY_LIMIT
    assert status_.used == 0
    assert status_.remaining == settings.AI_ANALYSIS_FREE_MONTHLY_LIMIT


def test_plan_limit_is_enforced_and_counts_down(db: Session, independent_user: User):
    _subscribe_to_plan(db, independent_user, ai_limit=2)
    for _ in range(2):
        enforce_ai_analysis_quota(db, independent_user.id)  # must not raise
        record_ai_analysis_usage(db, user_id=independent_user.id, job_posting_id=None)
        db.commit()

    status_ = get_ai_analysis_quota_status(db, independent_user.id)
    assert (status_.limit, status_.used, status_.remaining) == (2, 2, 0)
    with pytest.raises(HTTPException) as exc:
        enforce_ai_analysis_quota(db, independent_user.id)
    assert exc.value.status_code == 403
    assert exc.value.detail == "monthly_ai_analysis_quota_exhausted"


def test_plan_without_limit_is_unlimited(db: Session, independent_user: User):
    _subscribe_to_plan(db, independent_user, ai_limit=None)
    for _ in range(10):
        record_ai_analysis_usage(db, user_id=independent_user.id, job_posting_id=None)
    db.commit()
    status_ = get_ai_analysis_quota_status(db, independent_user.id)
    assert status_.limit is None and status_.remaining is None
    enforce_ai_analysis_quota(db, independent_user.id)  # never raises


def test_only_this_months_usage_counts(db: Session, independent_user: User):
    _subscribe_to_plan(db, independent_user, ai_limit=1)
    db.add(AiAnalysisUsageEvent(user_id=independent_user.id, created_at=datetime(2020, 1, 15, tzinfo=timezone.utc)))
    db.commit()
    status_ = get_ai_analysis_quota_status(db, independent_user.id)
    assert status_.used == 0 and status_.remaining == 1


def test_analysis_consumes_one_and_cache_hit_is_free(db: Session, independent_user: User, stub_groq):
    _subscribe_to_plan(db, independent_user, ai_limit=1)
    independent_user.cv_text = "python selenium qa"
    db.commit()
    posting = _make_posting(db, 1)
    svc = JobPostingConsumerService(db)

    first = svc.compute_semantic_compatibility(posting.id, independent_user)
    assert first.percentage == 70 and len(first.interview_tips or []) == 5
    assert stub_groq["n"] == 1
    assert get_ai_analysis_quota_status(db, independent_user.id).remaining == 0

    # Quota is now spent, but the same posting is a cache hit: no error, no
    # second Groq call, no extra usage row.
    again = svc.compute_semantic_compatibility(posting.id, independent_user)
    assert again.percentage == 70
    assert stub_groq["n"] == 1
    assert len(db.scalars(select(AiAnalysisUsageEvent)).all()) == 1


def test_new_posting_is_blocked_when_quota_is_spent(db: Session, independent_user: User, stub_groq):
    _subscribe_to_plan(db, independent_user, ai_limit=1)
    independent_user.cv_text = "python selenium qa"
    db.commit()
    p1, p2 = _make_posting(db, 1), _make_posting(db, 2)
    svc = JobPostingConsumerService(db)

    svc.compute_semantic_compatibility(p1.id, independent_user)
    with pytest.raises(HTTPException) as exc:
        svc.compute_semantic_compatibility(p2.id, independent_user)
    assert exc.value.status_code == 403
    assert stub_groq["n"] == 1  # the blocked attempt never reached Groq


def test_reuploading_the_cv_does_not_refund_quota(db: Session, independent_user: User, stub_groq):
    _subscribe_to_plan(db, independent_user, ai_limit=1)
    independent_user.cv_text = "python selenium qa"
    db.commit()
    posting = _make_posting(db, 1)
    svc = JobPostingConsumerService(db)

    svc.compute_semantic_compatibility(posting.id, independent_user)
    svc.delete_cv(independent_user)  # clears cached analyses
    assert db.scalars(select(JobPostingSemanticAnalysis)).all() == []
    assert get_ai_analysis_quota_status(db, independent_user.id).remaining == 0


def test_ai_quota_endpoint_reports_remaining(client, db: Session, independent_user: User):
    _subscribe_to_plan(db, independent_user, ai_limit=5)
    record_ai_analysis_usage(db, user_id=independent_user.id, job_posting_id=None)
    db.commit()
    r = client.get("/api/v1/job-postings/ai-quota", headers=auth_headers(independent_user))
    assert r.status_code == 200
    assert r.json() == {"limit": 5, "used": 1, "remaining": 4}


def test_admin_can_set_and_clear_a_plans_ai_limit(client, super_admin_headers):
    """The per-plan value is set from the admin Plans form and must come back
    on the public catalog (that's what the pricing card renders)."""
    created = client.post(
        "/api/v1/plans",
        headers=super_admin_headers,
        json={"code": "ai-admin", "name": "AI admin", "price": "10.00", "currency": "EUR", "monthly_ai_analysis_limit": 7},
    )
    assert created.status_code == 201, created.text
    plan_id = created.json()["id"]
    assert created.json()["monthly_ai_analysis_limit"] == 7

    catalog = client.get("/api/v1/plans/catalog").json()["items"]
    assert next(p for p in catalog if p["id"] == plan_id)["monthly_ai_analysis_limit"] == 7

    cleared = client.patch(
        f"/api/v1/plans/{plan_id}", headers=super_admin_headers, json={"clear_monthly_ai_analysis_limit": True}
    )
    assert cleared.status_code == 200, cleared.text
    assert cleared.json()["monthly_ai_analysis_limit"] is None
