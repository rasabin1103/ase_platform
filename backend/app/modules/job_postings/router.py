from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.database import get_db
from app.core.media_storage import process_image_upload
from app.models.enums import JobContractType, JobPostingStatus, JobScheduleType, JobWorkMode
from app.models.job_posting import JobPosting
from app.models.user import User
from app.modules.auth.dependencies import get_current_active_user, get_current_user, require_permission
from app.modules.job_postings.schemas import (
    AiAnalysisQuotaRead,
    CvProfileRead,
    JobPostingAdminCreate,
    JobPostingAdminListResponse,
    JobPostingAdminRead,
    JobPostingAdminUpdate,
    JobPostingCompatibilityRead,
    JobPostingListResponse,
    JobPostingRead,
    SemanticCompatibilityRead,
)
from app.modules.job_postings.service import JobPostingAdminService, JobPostingConsumerService

# Same rationale as blog_admin/booking: this platform runs in MVP mode with
# only super_admin / independent_user roles, and require_permission()
# bypasses the specific code entirely for super_admin, so reusing
# "catalog.manage" here is equivalent to a dedicated "job_postings.manage"
# code without adding one.
_MANAGE = Depends(require_permission("catalog.manage"))

admin_router = APIRouter(prefix="/api/v1/admin/job-postings", tags=["job-postings-admin"])
router = APIRouter(prefix="/api/v1/job-postings", tags=["job-postings"])


def get_admin_service(db: Session = Depends(get_db)) -> JobPostingAdminService:
    return JobPostingAdminService(db)


def get_consumer_service(db: Session = Depends(get_db)) -> JobPostingConsumerService:
    return JobPostingConsumerService(db)


# --- Admin (super admin only) ------------------------------------------------


@admin_router.get("", response_model=JobPostingAdminListResponse, dependencies=[_MANAGE])
def list_job_postings_admin(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str | None = None,
    status_filter: JobPostingStatus | None = Query(default=None, alias="status"),
    svc: JobPostingAdminService = Depends(get_admin_service),
):
    return svc.list(limit=limit, offset=offset, search=search, status_filter=status_filter)


@admin_router.get("/{posting_id}", response_model=JobPostingAdminRead, dependencies=[_MANAGE])
def get_job_posting_admin(posting_id: int, svc: JobPostingAdminService = Depends(get_admin_service)):
    return svc.get(posting_id)


@admin_router.post("", response_model=JobPostingAdminRead, status_code=201, dependencies=[_MANAGE])
def create_job_posting(
    payload: JobPostingAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: JobPostingAdminService = Depends(get_admin_service),
):
    posting = svc.create(payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="job_posting.create",
        entity_type="job_posting",
        entity_id=str(posting.id),
        metadata={"title": posting.title, "status": posting.status.value},
    )
    return posting


@admin_router.patch("/{posting_id}", response_model=JobPostingAdminRead, dependencies=[_MANAGE])
def update_job_posting(
    posting_id: int,
    payload: JobPostingAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: JobPostingAdminService = Depends(get_admin_service),
):
    posting = svc.update(posting_id, payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="job_posting.update",
        entity_type="job_posting",
        entity_id=str(posting.id),
        metadata={"fields": sorted(payload.model_dump(exclude_unset=True).keys())},
    )
    return posting


@admin_router.delete("/{posting_id}", status_code=204, dependencies=[_MANAGE])
def delete_job_posting(
    posting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: JobPostingAdminService = Depends(get_admin_service),
):
    posting = svc.get(posting_id)
    svc.delete(posting_id)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="job_posting.delete",
        entity_type="job_posting",
        entity_id=str(posting_id),
        metadata={"title": posting.title},
    )


@admin_router.post("/{posting_id}/image", dependencies=[_MANAGE])
async def upload_job_posting_image(
    posting_id: int,
    file: UploadFile = File(...),
    svc: JobPostingAdminService = Depends(get_admin_service),
):
    content = await file.read()
    try:
        content, mime = process_image_upload(content, file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    svc.upload_image(posting_id, content, mime)
    return {"ok": True}


@admin_router.delete("/{posting_id}/image", dependencies=[_MANAGE])
def clear_job_posting_image(posting_id: int, svc: JobPostingAdminService = Depends(get_admin_service)):
    svc.clear_image(posting_id)
    return {"ok": True}


@admin_router.get("/{posting_id}/image", dependencies=[_MANAGE])
def get_job_posting_image_admin(posting_id: int, db: Session = Depends(get_db)):
    posting = db.get(JobPosting, posting_id)
    if posting is None or not posting.image_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(
        content=bytes(posting.image_data),
        media_type=posting.image_mime or "image/jpeg",
        headers={"Cache-Control": "private, max-age=86400"},
    )


# --- Consumer (any authenticated user — independent or organization) --------


@router.get("", response_model=JobPostingListResponse)
def list_job_postings(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str | None = None,
    category: str | None = None,
    contract_type: JobContractType | None = None,
    work_mode: JobWorkMode | None = None,
    schedule_type: JobScheduleType | None = None,
    sort: str | None = Query(default=None, pattern="^compatibility$"),
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    return svc.list(
        limit=limit,
        offset=offset,
        search=search,
        category=category,
        contract_type=contract_type,
        work_mode=work_mode,
        schedule_type=schedule_type,
        sort=sort,
        cv_text=user.cv_text,
    )


@router.get("/categories", response_model=list[str])
def list_job_posting_categories(
    _user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    return svc.list_categories()


# --- CV profile (own CV only — upload/view/remove; matched against postings
# below). Placed before "/{posting_id}" routes so the literal path "/cv"
# isn't swallowed by the int path-param route. -------------------------------


@router.get("/ai-quota", response_model=AiAnalysisQuotaRead)
def get_my_ai_quota(
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    """This month's AI-analysis allowance for the signed-in user (limit/used/
    remaining; null limit & remaining = unlimited). Declared before
    /{posting_id} so "ai-quota" isn't parsed as an id."""
    return svc.get_ai_quota(user)


@router.get("/cv", response_model=CvProfileRead)
def get_my_cv_profile(
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    return svc.get_cv_profile(user)


@router.post("/cv", response_model=CvProfileRead)
async def upload_my_cv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    content = await file.read()
    try:
        return svc.upload_cv(user, content, file.content_type, file.filename or "cv")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/cv", status_code=204)
def delete_my_cv(
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    svc.delete_cv(user)


@router.get("/{posting_id}", response_model=JobPostingRead)
def get_job_posting(
    posting_id: int,
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    return svc.get(posting_id, cv_text=user.cv_text)


@router.get("/{posting_id}/compatibility", response_model=JobPostingCompatibilityRead)
def get_job_posting_compatibility(
    posting_id: int,
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    return svc.get_compatibility(posting_id, user)


@router.get("/{posting_id}/compatibility/semantic", response_model=SemanticCompatibilityRead | None)
def get_job_posting_semantic_compatibility(
    posting_id: int,
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    """Read-only peek — returns the cached AI analysis if this (user,
    posting) pair was already analyzed, or null otherwise. Never calls
    Groq; safe to call automatically on page load so an already-computed
    result shows up without the user re-clicking Analyze."""
    return svc.get_semantic_compatibility(posting_id, user)


@router.post("/{posting_id}/compatibility/semantic", response_model=SemanticCompatibilityRead)
def analyze_job_posting_semantic_compatibility(
    posting_id: int,
    user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    """On-demand only — triggered strictly by the user clicking Analyze,
    never automatically. Calls Groq's API at most once per (user, posting);
    see app/core/semantic_match.py and JobPostingSemanticAnalysis."""
    return svc.compute_semantic_compatibility(posting_id, user)


@router.get("/{posting_id}/image")
def get_job_posting_image(
    posting_id: int,
    _user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    posting = svc.get_image(posting_id)
    if not posting.image_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(
        content=bytes(posting.image_data),
        media_type=posting.image_mime or "image/jpeg",
        headers={"Cache-Control": "private, max-age=86400"},
    )


@router.post("/{posting_id}/view", status_code=204)
def track_job_posting_view(
    posting_id: int,
    _user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    svc.track_view(posting_id)


@router.post("/{posting_id}/click", status_code=204)
def track_job_posting_click(
    posting_id: int,
    _user: User = Depends(get_current_active_user),
    svc: JobPostingConsumerService = Depends(get_consumer_service),
):
    svc.track_click(posting_id)
