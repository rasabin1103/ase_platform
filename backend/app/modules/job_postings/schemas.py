from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.enums import JobContractType, JobPostingStatus, JobScheduleType, JobSalaryType, JobWorkMode


class JobPostingAdminBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    # Auto-translated (DeepL) on save when left unset — see
    # JobPostingAdminService._ensure_english_fields. Passing a non-null
    # value here sets an explicit override instead.
    title_en: str | None = Field(default=None, max_length=255)
    description_en: str | None = None
    link_url: str = Field(min_length=1, max_length=2048)
    salary_type: JobSalaryType
    salary_amount: Decimal = Field(gt=0)
    salary_amount_max: Decimal | None = Field(default=None, gt=0)
    contract_type: JobContractType
    work_mode: JobWorkMode
    schedule_type: JobScheduleType
    category: str = Field(min_length=1, max_length=100)
    status: JobPostingStatus = JobPostingStatus.draft

    @model_validator(mode="after")
    def _check_salary_range(self) -> "JobPostingAdminBase":
        if self.salary_amount_max is not None and self.salary_amount_max < self.salary_amount:
            raise ValueError("salary_amount_max must be greater than or equal to salary_amount")
        return self


class JobPostingAdminCreate(JobPostingAdminBase):
    pass


class JobPostingAdminUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    title_en: str | None = Field(default=None, max_length=255)
    description_en: str | None = None
    link_url: str | None = Field(default=None, min_length=1, max_length=2048)
    salary_type: JobSalaryType | None = None
    salary_amount: Decimal | None = Field(default=None, gt=0)
    salary_amount_max: Decimal | None = Field(default=None, gt=0)
    contract_type: JobContractType | None = None
    work_mode: JobWorkMode | None = None
    schedule_type: JobScheduleType | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    status: JobPostingStatus | None = None


class JobPostingAdminRead(JobPostingAdminBase):
    id: int
    uuid: UUID
    has_stored_image: bool = False
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    viewsTotal: int = 0
    clicksTotal: int = 0

    model_config = {"from_attributes": True}


class JobPostingAdminListResponse(BaseModel):
    items: list[JobPostingAdminRead]
    limit: int
    offset: int
    total: int


# --- Consumer-facing (any authenticated user) --------------------------------


class JobPostingRead(BaseModel):
    """What a logged-in user browsing the listing sees — no raw counters
    (those are admin-only context), no draft status (drafts never reach
    this schema at all, see JobPostingService.list_public)."""

    id: int
    uuid: UUID
    title: str
    description: str
    # Auto-translated (DeepL) mirrors — null only if the posting predates
    # translation support or DeepL was unreachable on save. The frontend
    # picks whichever matches the active language (see
    # utils/localizedCatalogText.ts), falling back to the Spanish fields.
    title_en: str | None = None
    description_en: str | None = None
    image_url: str | None = None
    link_url: str
    salary_type: JobSalaryType
    salary_amount: Decimal
    salary_amount_max: Decimal | None = None
    contract_type: JobContractType
    work_mode: JobWorkMode
    schedule_type: JobScheduleType
    category: str
    published_at: datetime | None = None
    # Only populated when the requesting user has a CV on file (see
    # JobPostingConsumerService._to_read) — a keyword-overlap percentage
    # against this specific posting's title/description/typologies. None
    # (not 0) means "no CV uploaded yet", so the frontend can tell "no
    # data" apart from "genuinely 0% match".
    compatibility: int | None = None

    model_config = {"from_attributes": True}


class JobPostingListResponse(BaseModel):
    items: list[JobPostingRead]
    limit: int
    offset: int
    total: int


class CvProfileRead(BaseModel):
    has_cv: bool
    filename: str | None = None
    uploaded_at: datetime | None = None


class JobPostingCompatibilityRead(BaseModel):
    """Per-posting detailed breakdown — the "individual analysis" surface,
    separate from the lightweight `compatibility` int on JobPostingRead so
    the list endpoint doesn't ship two keyword arrays per item on every
    page load."""

    percentage: int
    matched_keywords: list[str]
    missing_keywords: list[str]
    total: int


class AiAnalysisQuotaRead(BaseModel):
    """This month's AI-analysis allowance — set per plan by the admin.
    limit/remaining are null when the plan is unlimited."""

    limit: int | None = None
    used: int = 0
    remaining: int | None = None

    model_config = {"from_attributes": True}


class SemanticCompatibilityRead(BaseModel):
    """On-demand AI analysis (Groq, see app/core/semantic_match.py) — richer
    than the free keyword heuristic above: understands seniority, implied
    skills, and cross-language synonyms. Only ever computed when the user
    explicitly asks for it (never on the list), since it costs a real API
    call even though Groq's free tier makes that call itself free."""

    percentage: int
    summary: str
    strengths: list[str]
    gaps: list[str]
    # Auto-translated (DeepL) mirrors — Groq itself answers in the posting's
    # language, so these cover the case where the UI's active language
    # doesn't match it. Null only if translation failed; the frontend falls
    # back to the fields above (see utils/localizedCatalogText.ts).
    summary_en: str | None = None
    strengths_en: list[str] | None = None
    gaps_en: list[str] | None = None
    # 5 tailored interview-prep suggestions. Null/empty for analyses saved
    # before this existed.
    interview_tips: list[str] | None = None
    interview_tips_en: list[str] | None = None
