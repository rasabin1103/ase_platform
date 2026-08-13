from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

FieldType = Literal["text", "textarea", "number", "boolean", "url", "select"]


class CategoryFieldDef(BaseModel):
    """One entry in a category's custom-field "questionnaire" — rendered on
    the admin catalog-item creation form when this category is selected."""

    key: str = Field(min_length=1, max_length=60, pattern=r"^[a-z0-9_]+$")
    label: str = Field(min_length=1, max_length=150)
    type: FieldType = "text"
    required: bool = False
    # Only meaningful when type == "select".
    options: list[str] | None = None


class CatalogCategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=500)
    fields: list[CategoryFieldDef] = []
    display_order: int = 0
    is_active: bool = True


class CatalogCategoryCreate(CatalogCategoryBase):
    pass


class CatalogCategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    fields: list[CategoryFieldDef] | None = None
    display_order: int | None = None
    is_active: bool | None = None


class CatalogCategoryRead(CatalogCategoryBase):
    id: int
    uuid: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CatalogCategoryListResponse(BaseModel):
    items: list[CatalogCategoryRead]
