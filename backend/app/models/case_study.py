from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class CaseStudy(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """Real (or explicitly anonymized) delivery case studies for the public site.

    ``is_active`` defaults to False. This table replaces the hardcoded fake
    civil-engineering "proyectos" that were previously hardcoded in
    AboutPage.tsx (unrelated business, broken images) — every row here must
    describe an actual ASE engagement before it goes live, even if the
    client name is anonymized (e.g. "Fintech Serie A").
    """

    __tablename__ = "case_studies"

    title: Mapped[str] = mapped_column(String(220), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    client_label: Mapped[str] = mapped_column(String(200), nullable=False)  # real or anonymized label
    industry: Mapped[str | None] = mapped_column(String(120), nullable=True)

    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    challenge: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    results_json: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # list[str] of measurable outcomes

    cover_image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false", index=True)

    def __repr__(self) -> str:
        return f"<CaseStudy id={self.id} slug={self.slug!r} is_active={self.is_active}>"
