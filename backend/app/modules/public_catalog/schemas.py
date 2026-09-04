from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class CatalogByType(BaseModel):
    courses: int = 0
    templates: int = 0
    books: int = 0
    resources: int = 0
    services: int = 0


class CatalogPlans(BaseModel):
    total: int = 0
    names: list[str] = []


class PlatformStatus(BaseModel):
    status: str = "operational"
    db_connected: bool = True


class CatalogStatsResponse(BaseModel):
    total_items: int = 0
    by_type: CatalogByType
    plans: CatalogPlans
    platform: PlatformStatus
    members_count: int = 0
    last_updated: str


class TeamMemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    role_title: str
    bio: str | None = None
    photo_url: str | None = None
    linkedin_url: str | None = None


class TestimonialPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    author_name: str
    author_role: str | None = None
    author_company: str | None = None
    quote: str
    avatar_url: str | None = None
    rating: int | None = None
    is_featured: bool = False


class PlanSavingsRead(BaseModel):
    """Per-plan "buy it all separately vs. subscribe" comparison — powers
    the savings modal shown when a buyer is about to purchase a single
    priced item (see PlanSavingsModal.tsx). Only ever computed for plans
    that are actually sellable (stripe_price_id set) and include at least
    one catalog item, otherwise there's nothing to compare."""

    planId: int
    code: str
    name: str
    price: float
    currency: str
    includedItemCount: int
    includedItemsValue: float
    savings: float


class PlanSavingsListResponse(BaseModel):
    items: list[PlanSavingsRead]


class CaseStudyPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    title: str
    client_label: str
    industry: str | None = None
    summary: str
    challenge: str | None = None
    solution: str | None = None
    results_json: list | None = None
    cover_image_url: str | None = None
