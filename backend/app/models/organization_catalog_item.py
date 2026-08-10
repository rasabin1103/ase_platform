from __future__ import annotations

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class OrganizationCatalogItem(Base, IdPkMixin, TimestampMixin):
    """A catalog item (product/course/book/resource) associated to an
    organization — the org's curated shortlist for its members/users."""

    __tablename__ = "organization_catalog_items"
    __table_args__ = (
        UniqueConstraint("organization_id", "catalog_item_id", name="uq_org_catalog_items_org_item"),
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    added_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
