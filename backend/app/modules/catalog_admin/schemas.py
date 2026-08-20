from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType


def _validate_absolute_url(value: str | None) -> str | None:
    """Guards against saving something like "asd" into a link field — it
    would pass as a non-empty string, then get rendered as a raw <a href>,
    silently resolving to a broken relative route on our own frontend
    instead of failing loudly at save time."""
    if value is None:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
        raise ValueError("Must be a full URL starting with http:// or https://")
    return trimmed


class DimensionSelectionInput(BaseModel):
    """One (dimension type, level) pick — a pillar can have several
    dimension types, so an item's full selection is a list of these. See
    app/core/pricing_engine.py."""

    dimension_type_id: int
    dimension_level_id: int


class DimensionSelectionRead(BaseModel):
    dimension_type_id: int
    dimension_level_id: int

    model_config = {"from_attributes": True}


class CatalogItemAdminBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=160)
    type: CatalogItemType
    category: str = Field(min_length=1, max_length=120)
    short_description: str = Field(min_length=1, max_length=500)
    long_description: str = Field(min_length=1)
    # English mirrors — optional. Left unset (None) on Create/Update means
    # "auto-translate via DeepL from the Spanish text"; a non-null value is
    # an explicit admin override that skips translation for that field. See
    # CatalogAdminService._ensure_english_fields (same pattern as
    # PlansService for Plan.name_en/description_en/...).
    title_en: str | None = Field(default=None, max_length=255)
    short_description_en: str | None = Field(default=None, max_length=500)
    long_description_en: str | None = None
    image_url: str = Field(min_length=1, max_length=2048)
    preview_url: str | None = Field(default=None, max_length=2048)
    price: Decimal = Field(ge=0)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    status: CatalogItemStatus = CatalogItemStatus.draft
    level: CatalogItemLevel = CatalogItemLevel.intermediate
    duration: str | None = Field(default=None, max_length=80)
    author: str = Field(min_length=1, max_length=200)
    benefits: list[str] = []
    requirements: list[str] = []
    included_items: list[str] = []
    # Free-form filter tags — entered as "skill, claude, qa" in the admin
    # form and stored/returned as a plain list of strings.
    tags: list[str] = []
    # Book repo-access redemption: repo_redeem_code is the code printed
    # inside the book; repo_url is revealed once a reader redeems it.
    repo_url: str | None = Field(default=None, max_length=2048)
    repo_redeem_code: str | None = Field(default=None, max_length=64)
    # Resources: path to this item's file inside the repo at repo_url (the
    # shared ASE-Catalog repo) — powers the in-platform read-only viewer +
    # download, gated by ownership, no redeem code involved.
    repo_path: str | None = Field(default=None, max_length=1024)
    # Answers to the selected category's custom-field "questionnaire" (see
    # app/modules/catalog_categories) — free-form key -> value, no
    # server-side schema validation against the category (MVP scope).
    custom_fields: dict[str, Any] = {}
    # --- Pricing engine (see app/core/pricing_engine.py) — all optional; a
    # missing dimension selection just means that "subelemento" doesn't
    # participate (≡ ×1), `price` above always stays the real,
    # admin-controlled price.
    # One entry per dimension type the pillar has (e.g. a course sends its
    # Subtipo, Complejidad, Duración and Especialización picks). The
    # range-based type (book "Páginas") is ignored here even if sent — it's
    # auto-matched from page_count instead — see
    # CatalogAdminService._apply_pricing.
    dimension_selections: list[DimensionSelectionInput] = []
    # Book pillar only.
    page_count: int | None = Field(default=None, ge=1)


class CatalogItemAdminCreate(CatalogItemAdminBase):
    @field_validator("preview_url", "repo_url")
    @classmethod
    def _validate_link_fields(cls, value: str | None) -> str | None:
        return _validate_absolute_url(value)


class CatalogItemAdminUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    short_description: str | None = None
    long_description: str | None = None
    title_en: str | None = None
    short_description_en: str | None = None
    long_description_en: str | None = None
    image_url: str | None = None
    preview_url: str | None = None
    price: Decimal | None = None
    currency: str | None = None
    status: CatalogItemStatus | None = None
    level: CatalogItemLevel | None = None
    duration: str | None = None
    author: str | None = None
    benefits: list[str] | None = None
    requirements: list[str] | None = None
    included_items: list[str] | None = None
    tags: list[str] | None = None
    repo_url: str | None = None
    repo_redeem_code: str | None = None
    repo_path: str | None = None
    custom_fields: dict[str, Any] | None = None
    dimension_selections: list[DimensionSelectionInput] | None = None
    page_count: int | None = Field(default=None, ge=1)

    @field_validator("preview_url", "repo_url")
    @classmethod
    def _validate_link_fields(cls, value: str | None) -> str | None:
        return _validate_absolute_url(value)


class CatalogItemImageRead(BaseModel):
    id: int
    url: str
    is_cover: bool
    display_order: int


class CatalogItemImageListResponse(BaseModel):
    items: list[CatalogItemImageRead]


class AddCatalogItemImageUrlRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


class CatalogItemAdminRead(CatalogItemAdminBase):
    id: int
    uuid: UUID
    has_stored_image: bool = False
    images: list[CatalogItemImageRead] = []
    dimension_selections: list[DimensionSelectionRead] = []
    # Snapshot of the last calculated recommendation — informational only,
    # `price` above stays the real price.
    recommended_price: Decimal | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CatalogItemAdminListResponse(BaseModel):
    items: list[CatalogItemAdminRead]
    limit: int
    offset: int
    total: int


class TranslationStatus(BaseModel):
    """Whether DEEPL_API_KEY is configured — same shape/purpose as
    app.modules.plans.schemas.TranslationStatus, kept as its own copy here
    so catalog_admin doesn't need to import from the plans module."""

    enabled: bool
