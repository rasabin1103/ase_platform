from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.cv_extraction import extract_cv_text, validate_cv_upload
from app.core.cv_matching import compute_compatibility
from app.core.media_urls import resolve_job_posting_image_url
from app.core.semantic_match import SemanticMatchError, analyze_semantic_compatibility
from app.core.translation import translate_batch_es_to_en, translate_es_to_en
from app.modules.plans.ai_quota import (
    AiAnalysisQuotaStatus,
    enforce_ai_analysis_quota,
    get_ai_analysis_quota_status,
    record_ai_analysis_usage,
)
from app.models.enums import JobContractType, JobPostingStatus, JobScheduleType, JobWorkMode
from app.models.job_posting import JobPosting
from app.models.job_posting_semantic_analysis import JobPostingSemanticAnalysis
from app.models.user import User
from app.modules.job_postings.schemas import (
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


# English mirrors auto-translated via DeepL — same pattern as
# CatalogAdminService._EN_FIELD_PAIRS/_ensure_english_fields.
_EN_FIELD_PAIRS = (
    ("title", "title_en"),
    ("description", "description_en"),
)


class JobPostingAdminService:
    """Mirrors BlogAdminService's shape (see app/modules/blog_admin/service.py)
    — same create/update/image/delete flow, minus comments/reactions since
    job postings don't have those."""

    def __init__(self, db: Session):
        self.db = db

    def _require_posting(self, posting_id: int) -> JobPosting:
        posting = self.db.get(JobPosting, posting_id)
        if posting is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
        return posting

    def _ensure_english_fields(
        self, posting: JobPosting, payload: JobPostingAdminCreate | JobPostingAdminUpdate, *, changed_es: dict[str, bool]
    ) -> None:
        """Fills posting.<field>_en for every field where either (a) the
        admin passed an explicit English override, or (b) the Spanish
        source text changed in this call and needs a fresh translation.
        Falls back to mirroring the Spanish text when translation is
        unavailable (no DEEPL_API_KEY configured, or the API call fails) so
        the English listing is never left blank — saving a posting can
        never fail because of this step. Same pattern as
        CatalogAdminService._ensure_english_fields."""
        for es_field, en_field in _EN_FIELD_PAIRS:
            override = getattr(payload, en_field, None)
            if override is not None:
                setattr(posting, en_field, override)
                continue
            if not changed_es.get(es_field, False):
                continue
            es_value = getattr(posting, es_field, None)
            translated = translate_es_to_en(es_value)
            setattr(posting, en_field, translated if translated is not None else es_value)

    @staticmethod
    def _to_read(posting: JobPosting) -> JobPostingAdminRead:
        return JobPostingAdminRead(
            id=posting.id,
            uuid=posting.uuid,
            title=posting.title,
            description=posting.description,
            title_en=posting.title_en,
            description_en=posting.description_en,
            has_stored_image=bool(posting.image_data),
            link_url=posting.link_url,
            salary_type=posting.salary_type,
            salary_amount=posting.salary_amount,
            salary_amount_max=posting.salary_amount_max,
            contract_type=posting.contract_type,
            work_mode=posting.work_mode,
            schedule_type=posting.schedule_type,
            category=posting.category,
            status=posting.status,
            published_at=posting.published_at,
            created_at=posting.created_at,
            updated_at=posting.updated_at,
            viewsTotal=posting.views_total,
            clicksTotal=posting.clicks_total,
        )

    @staticmethod
    def _maybe_stamp_published_at(posting: JobPosting, new_status: JobPostingStatus) -> None:
        if new_status == JobPostingStatus.published and posting.published_at is None:
            posting.published_at = datetime.now(timezone.utc)

    def get(self, posting_id: int) -> JobPostingAdminRead:
        return self._to_read(self._require_posting(posting_id))

    def list(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        status_filter: JobPostingStatus | None = None,
    ) -> JobPostingAdminListResponse:
        stmt = select(JobPosting)
        count_stmt = select(func.count()).select_from(JobPosting)
        if status_filter is not None:
            stmt = stmt.where(JobPosting.status == status_filter)
            count_stmt = count_stmt.where(JobPosting.status == status_filter)
        if search:
            like = f"%{search.strip()}%"
            stmt = stmt.where(JobPosting.title.ilike(like))
            count_stmt = count_stmt.where(JobPosting.title.ilike(like))
        total = self.db.scalar(count_stmt) or 0
        postings = (
            self.db.execute(stmt.order_by(JobPosting.created_at.desc()).limit(limit).offset(offset))
            .scalars()
            .all()
        )
        return JobPostingAdminListResponse(
            items=[self._to_read(p) for p in postings], limit=limit, offset=offset, total=total
        )

    def create(self, payload: JobPostingAdminCreate) -> JobPostingAdminRead:
        posting = JobPosting(
            title=payload.title,
            description=payload.description,
            link_url=payload.link_url,
            salary_type=payload.salary_type,
            salary_amount=payload.salary_amount,
            salary_amount_max=payload.salary_amount_max,
            contract_type=payload.contract_type,
            work_mode=payload.work_mode,
            schedule_type=payload.schedule_type,
            category=payload.category.strip(),
            status=payload.status,
        )
        self._maybe_stamp_published_at(posting, payload.status)
        self._ensure_english_fields(posting, payload, changed_es={"title": True, "description": True})
        self.db.add(posting)
        self.db.commit()
        self.db.refresh(posting)
        return self._to_read(posting)

    def update(self, posting_id: int, payload: JobPostingAdminUpdate) -> JobPostingAdminRead:
        posting = self._require_posting(posting_id)
        data = payload.model_dump(exclude_unset=True)
        # Handled exclusively by _ensure_english_fields below (needs to see
        # None as "no override, maybe auto-translate" vs the generic loop
        # here which would instead just blindly overwrite with whatever was
        # sent — including a stray null wiping a prior translation on an
        # edit that didn't touch these fields at all).
        for en_field in ("title_en", "description_en"):
            data.pop(en_field, None)
        if "category" in data and data["category"] is not None:
            data["category"] = data["category"].strip()
        if "status" in data and data["status"] is not None:
            self._maybe_stamp_published_at(posting, data["status"])
        for key, value in data.items():
            setattr(posting, key, value)
        self._ensure_english_fields(
            posting,
            payload,
            changed_es={"title": payload.title is not None, "description": payload.description is not None},
        )
        self.db.commit()
        self.db.refresh(posting)
        return self._to_read(posting)

    def delete(self, posting_id: int) -> None:
        posting = self._require_posting(posting_id)
        self.db.delete(posting)
        self.db.commit()

    def upload_image(self, posting_id: int, content: bytes, mime: str) -> JobPostingAdminRead:
        posting = self._require_posting(posting_id)
        posting.image_data = content
        posting.image_mime = mime
        self.db.commit()
        self.db.refresh(posting)
        return self._to_read(posting)

    def clear_image(self, posting_id: int) -> JobPostingAdminRead:
        posting = self._require_posting(posting_id)
        posting.image_data = None
        posting.image_mime = None
        self.db.commit()
        self.db.refresh(posting)
        return self._to_read(posting)


def _posting_match_text(posting: JobPosting) -> str:
    """Everything about a posting that's fair game for the keyword
    analyzer — free-text fields plus the human-readable typology labels
    (e.g. "remote", "permanent") so a CV that literally says "remote QA
    engineer" picks those up too."""
    return " ".join(
        [
            posting.title,
            posting.description,
            posting.category,
            posting.contract_type.value,
            posting.work_mode.value,
            posting.schedule_type.value,
        ]
    )


class JobPostingConsumerService:
    """Listing/detail for any authenticated user — published postings only,
    with optional filters across the four typologies plus free-text search
    and category. View/click counters increment here, not in the admin
    service (consumer reads are the only ones that should count). Also owns
    the CV-upload / compatibility-analyzer surface: the CV itself lives on
    `User` (see app/models/user.py), but matching it against postings is
    this service's job, not the admin side's."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _to_read(posting: JobPosting, *, cv_text: str | None = None) -> JobPostingRead:
        compatibility = None
        if cv_text:
            compatibility = compute_compatibility(cv_text, _posting_match_text(posting)).percentage
        return JobPostingRead(
            id=posting.id,
            uuid=posting.uuid,
            title=posting.title,
            description=posting.description,
            title_en=posting.title_en,
            description_en=posting.description_en,
            image_url=resolve_job_posting_image_url(posting),
            link_url=posting.link_url,
            salary_type=posting.salary_type,
            salary_amount=posting.salary_amount,
            salary_amount_max=posting.salary_amount_max,
            contract_type=posting.contract_type,
            work_mode=posting.work_mode,
            schedule_type=posting.schedule_type,
            category=posting.category,
            published_at=posting.published_at,
            compatibility=compatibility,
        )

    def _require_published(self, posting_id: int) -> JobPosting:
        posting = self.db.get(JobPosting, posting_id)
        if posting is None or posting.status != JobPostingStatus.published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
        return posting

    def list(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        category: str | None = None,
        contract_type: JobContractType | None = None,
        work_mode: JobWorkMode | None = None,
        schedule_type: JobScheduleType | None = None,
        sort: str | None = None,
        cv_text: str | None = None,
    ) -> JobPostingListResponse:
        stmt = select(JobPosting).where(JobPosting.status == JobPostingStatus.published)
        count_stmt = select(func.count()).select_from(JobPosting).where(JobPosting.status == JobPostingStatus.published)
        if search:
            like = f"%{search.strip()}%"
            stmt = stmt.where(JobPosting.title.ilike(like))
            count_stmt = count_stmt.where(JobPosting.title.ilike(like))
        if category:
            stmt = stmt.where(JobPosting.category == category)
            count_stmt = count_stmt.where(JobPosting.category == category)
        if contract_type:
            stmt = stmt.where(JobPosting.contract_type == contract_type)
            count_stmt = count_stmt.where(JobPosting.contract_type == contract_type)
        if work_mode:
            stmt = stmt.where(JobPosting.work_mode == work_mode)
            count_stmt = count_stmt.where(JobPosting.work_mode == work_mode)
        if schedule_type:
            stmt = stmt.where(JobPosting.schedule_type == schedule_type)
            count_stmt = count_stmt.where(JobPosting.schedule_type == schedule_type)
        total = self.db.scalar(count_stmt) or 0
        postings = (
            self.db.execute(stmt.order_by(JobPosting.published_at.desc()).limit(limit).offset(offset))
            .scalars()
            .all()
        )
        items = [self._to_read(p, cv_text=cv_text) for p in postings]
        # Sorting by compatibility only makes sense once a CV is on file —
        # with no cv_text, every item's `compatibility` is None and the sort
        # would be a no-op anyway, so this only triggers the reorder when
        # there's something meaningful to reorder by.
        if sort == "compatibility" and cv_text:
            items.sort(key=lambda it: it.compatibility or 0, reverse=True)
        return JobPostingListResponse(items=items, limit=limit, offset=offset, total=total)

    def list_categories(self) -> list[str]:
        """Distinct categories across *published* postings only — powers the
        consumer filter chips; an admin-only draft category shouldn't appear
        as a filter option nobody can actually match."""
        rows = self.db.execute(
            select(JobPosting.category)
            .where(JobPosting.status == JobPostingStatus.published)
            .distinct()
            .order_by(JobPosting.category.asc())
        ).all()
        return [r[0] for r in rows]

    def get(self, posting_id: int, *, cv_text: str | None = None) -> JobPostingRead:
        posting = self._require_published(posting_id)
        return self._to_read(posting, cv_text=cv_text)

    def get_image(self, posting_id: int) -> JobPosting:
        """Separate from `get` because the image route needs the raw ORM
        object (bytes + mime), not the serialized read schema."""
        return self._require_published(posting_id)

    def get_compatibility(self, posting_id: int, user: User) -> JobPostingCompatibilityRead:
        """The "individual analysis" surface — matched/missing keywords for
        one specific posting, computed on demand (not shipped on every list
        item) since the arrays can be sizeable for a long description."""
        posting = self._require_published(posting_id)
        if not user.cv_text:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No CV uploaded yet")
        result = compute_compatibility(user.cv_text, _posting_match_text(posting))
        return JobPostingCompatibilityRead(
            percentage=result.percentage,
            matched_keywords=result.matched_keywords,
            missing_keywords=result.missing_keywords,
            total=len(result.matched_keywords) + len(result.missing_keywords),
        )

    @staticmethod
    def _to_semantic_read(record: JobPostingSemanticAnalysis) -> SemanticCompatibilityRead:
        return SemanticCompatibilityRead(
            percentage=record.percentage,
            summary=record.summary,
            strengths=record.strengths,
            gaps=record.gaps,
            summary_en=record.summary_en,
            strengths_en=record.strengths_en,
            gaps_en=record.gaps_en,
            interview_tips=record.interview_tips,
            interview_tips_en=record.interview_tips_en,
        )

    def _find_semantic_analysis(self, posting_id: int, user: User) -> JobPostingSemanticAnalysis | None:
        return self.db.scalar(
            select(JobPostingSemanticAnalysis).where(
                JobPostingSemanticAnalysis.user_id == user.id,
                JobPostingSemanticAnalysis.job_posting_id == posting_id,
            )
        )

    def get_semantic_compatibility(self, posting_id: int, user: User) -> SemanticCompatibilityRead | None:
        """Peek only — returns the cached AI analysis for this (user,
        posting) pair if one already exists, without calling Groq. None
        means "not analyzed yet" (the frontend shows the Analyze button in
        that case). Used so a page can display an already-computed result
        automatically on load without re-triggering the API call."""
        self._require_published(posting_id)
        record = self._find_semantic_analysis(posting_id, user)
        return self._to_semantic_read(record) if record else None

    def get_ai_quota(self, user: User) -> AiAnalysisQuotaStatus:
        return get_ai_analysis_quota_status(self.db, user.id)

    def compute_semantic_compatibility(self, posting_id: int, user: User) -> SemanticCompatibilityRead:
        """The on-demand AI ("Análisis semántico") action — a real call to
        Groq's free-tier API, strictly separate from the free keyword
        heuristic above (that one stays instant/no-cost on the list).
        Computed at most once per (user, posting): if a cached result
        already exists, it's returned as-is instead of calling Groq again —
        the frontend never offers a way to re-trigger this for the same
        posting once it has a result."""
        posting = self._require_published(posting_id)
        if not user.cv_text:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No CV uploaded yet")

        existing = self._find_semantic_analysis(posting_id, user)
        if existing is not None:
            return self._to_semantic_read(existing)

        # Plan-level monthly cap: checked only here, after the cache lookup
        # above, so re-opening an already-analyzed posting never costs (or is
        # blocked by) quota. Raises 403 monthly_ai_analysis_quota_exhausted.
        enforce_ai_analysis_quota(self.db, user.id)

        try:
            result = analyze_semantic_compatibility(
                cv_text=user.cv_text,
                posting_title=posting.title,
                posting_text=_posting_match_text(posting),
            )
        except SemanticMatchError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

        # Groq answers in the posting's language (see semantic_match.py's
        # system prompt), so this needs the same ES->EN mirroring as job
        # posting title/description. One batched DeepL call covers summary
        # + strengths + gaps together; falls back to mirroring the Spanish
        # text (never leaves the English fields blank) if translation is
        # unavailable or fails.
        all_texts = [result.summary, *result.strengths, *result.gaps, *result.interview_tips]
        translated = translate_batch_es_to_en(all_texts)
        if translated is None:
            summary_en, strengths_en, gaps_en = result.summary, result.strengths, result.gaps
            tips_en = result.interview_tips
        else:
            n_s, n_g = len(result.strengths), len(result.gaps)
            summary_en = translated[0]
            strengths_en = translated[1 : 1 + n_s]
            gaps_en = translated[1 + n_s : 1 + n_s + n_g]
            tips_en = translated[1 + n_s + n_g :]

        record = JobPostingSemanticAnalysis(
            user_id=user.id,
            job_posting_id=posting_id,
            percentage=result.percentage,
            summary=result.summary,
            strengths=result.strengths,
            gaps=result.gaps,
            summary_en=summary_en,
            strengths_en=strengths_en,
            gaps_en=gaps_en,
            interview_tips=result.interview_tips,
            interview_tips_en=tips_en,
        )
        self.db.add(record)
        # Logged in the same transaction as the saved analysis. If a race
        # loses (IntegrityError below), the rollback drops this event too, so
        # the loser isn't charged for a result it didn't keep.
        record_ai_analysis_usage(self.db, user_id=user.id, job_posting_id=posting_id)
        try:
            self.db.commit()
        except IntegrityError:
            # Two requests raced to analyze the same (user, posting) pair —
            # the other one won and inserted first. Discard this Groq
            # result (already spent, nothing to do about that) and return
            # whatever the winner saved, so the user still gets a single,
            # consistent percentage instead of a 500.
            self.db.rollback()
            existing = self._find_semantic_analysis(posting_id, user)
            if existing is not None:
                return self._to_semantic_read(existing)
            raise
        self.db.refresh(record)
        return self._to_semantic_read(record)

    def track_view(self, posting_id: int) -> None:
        posting = self._require_published(posting_id)
        posting.views_total += 1
        self.db.commit()

    def track_click(self, posting_id: int) -> None:
        posting = self._require_published(posting_id)
        posting.clicks_total += 1
        self.db.commit()

    # --- CV profile (stored on User, matched against postings above) ------

    def get_cv_profile(self, user: User) -> CvProfileRead:
        return CvProfileRead(has_cv=bool(user.cv_data), filename=user.cv_filename, uploaded_at=user.cv_uploaded_at)

    def _clear_semantic_analyses(self, user: User) -> None:
        """A cached AI analysis is scored against a specific CV — once that
        CV is replaced or removed, every stored result for this user is
        stale and must go, so the next "Analyze" click recomputes against
        the new (or absent) CV rather than silently showing an outdated
        percentage."""
        self.db.execute(delete(JobPostingSemanticAnalysis).where(JobPostingSemanticAnalysis.user_id == user.id))

    def upload_cv(self, user: User, content: bytes, content_type: str | None, filename: str) -> CvProfileRead:
        mime = validate_cv_upload(content, content_type)
        user.cv_data = content
        user.cv_mime = mime
        user.cv_filename = filename[:255]
        user.cv_text = extract_cv_text(content, content_type)
        user.cv_uploaded_at = datetime.now(timezone.utc)
        self._clear_semantic_analyses(user)
        self.db.commit()
        return self.get_cv_profile(user)

    def delete_cv(self, user: User) -> None:
        user.cv_data = None
        user.cv_mime = None
        user.cv_filename = None
        user.cv_text = None
        user.cv_uploaded_at = None
        self._clear_semantic_analyses(user)
        self.db.commit()
