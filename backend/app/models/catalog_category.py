from __future__ import annotations

from typing import Any

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class CatalogCategory(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """A managed catalog category — purely organizational (no purchase/
    enrollment/redemption logic of its own; items in any category still go
    through the same generic catalog item flow). Each category can define a
    small custom-field schema (``fields_json``) that the admin catalog-item
    creation form renders and fills in per item when that category is
    selected (see CatalogItem.custom_fields_json).

    ``CatalogItem.category`` stays a free-text column for backward
    compatibility with existing rows — new items created via the admin UI
    store this category's ``name`` there, but there's no FK/constraint
    tying them together, so renaming or deleting a category never breaks
    existing items."""

    __tablename__ = "catalog_categories"

    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # List of field-definition dicts: {"key": str, "label": str,
    # "type": "text"|"textarea"|"number"|"boolean"|"url"|"select",
    # "required": bool, "options": list[str] | None}. Rendered as the
    # per-category "questionnaire" on the admin item-creation form.
    fields_json: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    def __repr__(self) -> str:
        return f"<CatalogCategory id={self.id} slug={self.slug!r}>"
