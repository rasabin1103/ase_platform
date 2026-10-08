from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from sqlalchemy.orm import Session

from app.core.academy_review import AcademyReviewError, AcademyReviewNotConfigured, review_bug_report
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.user import User
from app.modules.academy.schemas import (
    AcademyCourseAccessRead,
    AcademyReportReviewRead,
    AcademyReportReviewRequest,
    AcademyRunListResponse,
    AcademyRunRead,
    AcademyRunWrite,
)
from app.modules.academy.service import AcademyRunService, AcademyService
from app.modules.auth.dependencies import get_current_active_user, get_current_user_optional

router = APIRouter(prefix="/api/v1/academy", tags=["academy"])


@router.get("/courses/{course_key}/access", response_model=AcademyCourseAccessRead)
def read_course_access(
    course_key: str = Path(min_length=1, max_length=80, pattern=r"^[a-z0-9-]+$"),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> AcademyCourseAccessRead:
    """Which catalog item sells this simulator course and whether the caller
    may play its paid missions. Works anonymously (public course page)."""
    return AcademyService(db).get_access(course_key, user)


# --- Saved progress (authenticated) ----------------------------------------
_KEY = r"^[a-z0-9-]+$"


@router.get("/runs/{course_key}", response_model=AcademyRunListResponse)
def list_my_runs(
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AcademyRunListResponse:
    """Progress summary of the caller's missions in a course (course page)."""
    return AcademyRunService(db).list_for_course(user.id, course_key)


@router.get("/runs/{course_key}/{mission_id}", response_model=AcademyRunRead)
def read_my_run(
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    mission_id: str = Path(min_length=1, max_length=80, pattern=_KEY),
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AcademyRunRead:
    run = AcademyRunService(db).get(user.id, course_key, mission_id)
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No saved progress")
    return run


@router.put("/runs/{course_key}/{mission_id}", response_model=AcademyRunRead)
def save_my_run(
    payload: AcademyRunWrite,
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    mission_id: str = Path(min_length=1, max_length=80, pattern=_KEY),
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AcademyRunRead:
    """Upsert the caller's progress (seed + ordered engine actions). The
    frontend autosaves after each action; restarting sends a new seed with
    an empty action list."""
    return AcademyRunService(db).save(user.id, course_key, mission_id, payload)


# --- AI review of a bug report (optional, Groq) -----------------------------
@router.post("/report-review", response_model=AcademyReportReviewRead)
@limiter.limit("30/hour")
def review_report(
    request: Request,
    payload: AcademyReportReviewRequest,
    user: User = Depends(get_current_active_user),
) -> AcademyReportReviewRead:
    """Qualitative mentor feedback on a simulator bug report. 503 when the AI
    provider is not configured, so the UI can hide the feature."""
    try:
        result = review_bug_report(
            story=payload.story,
            acceptance_criteria=payload.acceptanceCriteria,
            title=payload.title,
            steps=payload.steps,
            expected=payload.expected,
            actual=payload.actual,
            severity=payload.severity,
            actual_bug=payload.actualBug,
        )
    except AcademyReviewNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except AcademyReviewError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return AcademyReportReviewRead(
        score=result.score,
        strengths=result.strengths,
        improvements=result.improvements,
        suggestedTitle=result.suggested_title,
    )
