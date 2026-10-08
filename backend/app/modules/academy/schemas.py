from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import CatalogItemStatus, CatalogItemType


class AcademyCourseAccessRead(BaseModel):
    """Commercial/entitlement view of an ASE Academy simulator course.

    The simulator content lives in the frontend (features/academy); the
    catalog item linked through `CatalogItem.academy_course_key` is what is
    sold. `linked=False` means no visible catalog item points to this course
    key yet — the simulator still serves its free missions."""

    courseKey: str
    linked: bool
    catalogSlug: str | None = None
    catalogType: CatalogItemType | None = None
    catalogStatus: CatalogItemStatus | None = None
    title: str | None = None
    price: Decimal | None = None
    currency: str | None = None
    isFree: bool = False
    authenticated: bool = False
    # Full access to every mission: free published item (for everyone, even
    # anonymous), purchased/plan-included, or super admin. The first mission
    # is always open as a demo and never needs this.
    hasAccess: bool = False


# --- Saved progress ---------------------------------------------------------
# Generous upper bound: a full mission day is a few hundred actions.
MAX_ACTIONS = 5000


class AcademyRunWrite(BaseModel):
    seed: int = Field(ge=0, le=2**31 - 1)
    # Engine actions ({type: ..., ...}); opaque to the backend — the
    # deterministic frontend engine replays them.
    actions: list[dict[str, Any]] = Field(default_factory=list, max_length=MAX_ACTIONS)
    finished: bool = False


class AcademyRunRead(BaseModel):
    courseKey: str
    missionId: str
    seed: int
    actions: list[dict[str, Any]]
    finished: bool
    finishedAt: datetime | None = None
    updatedAt: datetime


class AcademyRunSummary(BaseModel):
    missionId: str
    finished: bool
    actionsCount: int
    updatedAt: datetime


class AcademyRunListResponse(BaseModel):
    courseKey: str
    items: list[AcademyRunSummary]


# --- AI review of bug reports ------------------------------------------------
class AcademyReportReviewRequest(BaseModel):
    story: str = Field(default="", max_length=2000)
    acceptanceCriteria: list[str] = Field(default_factory=list, max_length=20)
    title: str = Field(max_length=300)
    steps: str = Field(default="", max_length=3000)
    expected: str = Field(default="", max_length=1000)
    actual: str = Field(default="", max_length=1000)
    severity: str = Field(max_length=20)
    actualBug: str | None = Field(default=None, max_length=500)


class AcademyReportReviewRead(BaseModel):
    score: int
    strengths: list[str]
    improvements: list[str]
    suggestedTitle: str
