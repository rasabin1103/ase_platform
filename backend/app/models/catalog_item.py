from __future__ import annotations

from decimal import Decimal

from typing import Any

from sqlalchemy import Enum, Integer, LargeBinary, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class CatalogItem(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """Marketplace catalog entry for independent consumers (products, courses, books, resources)."""

    __tablename__ = "catalog_items"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    type: Mapped[CatalogItemType] = mapped_column(
        Enum(CatalogItemType, name="catalog_item_type", native_enum=True),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    short_description: Mapped[str] = mapped_column(String(500), nullable=False)
    long_description: Mapped[str] = mapped_column(Text, nullable=False)
    # English mirrors of the three fields above, auto-translated via DeepL
    # on save (same pattern as Plan._en fields — see
    # PlansService._ensure_english_fields and app.core.translation). Always
    # backfilled with the Spanish text when translation is unavailable, so
    # these are never left blank; an admin can still type an explicit
    # override instead of the auto-translation.
    title_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    short_description_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    long_description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    image_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    image_mime: Mapped[str | None] = mapped_column(String(64))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")
    status: Mapped[CatalogItemStatus] = mapped_column(
        Enum(CatalogItemStatus, name="catalog_item_status", native_enum=True),
        nullable=False,
        default=CatalogItemStatus.published,
        index=True,
    )
    level: Mapped[CatalogItemLevel] = mapped_column(
        Enum(CatalogItemLevel, name="catalog_item_level", native_enum=True),
        nullable=False,
        default=CatalogItemLevel.intermediate,
    )
    duration: Mapped[str | None] = mapped_column(String(80))
    author: Mapped[str] = mapped_column(String(200), nullable=False)
    preview_url: Mapped[str | None] = mapped_column(String(2048))
    # Book pillar: external link (Drive, S3, Spotify, ...) for the audio
    # edition — deliberately not another repo_path file, audiobooks are
    # typically hundreds of MB and the GitHub Contents API this platform
    # already uses for resource content/download isn't built for that.
    audiobook_url: Mapped[str | None] = mapped_column(String(2048))
    benefits_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    requirements_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    included_items_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    # Free-form filter tags (e.g. "skill, claude, qa"), entered as a
    # comma-separated field in the admin form and stored as a JSON array —
    # same pattern as benefits/requirements/included_items above. Used by
    # both the admin catalog list and the consumer catalog browser to filter.
    tags_json: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    # Answers to the selected category's custom-field "questionnaire" (see
    # CatalogCategory.fields_json), keyed by field key. Free-form — no FK to
    # a category row, so this stays valid even if the category is later
    # renamed or removed.
    custom_fields_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    # Book repo-access redemption (see BookRepoRedemption): readers enter
    # `repo_redeem_code` (printed inside the book) to reveal `repo_url`.
    repo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    repo_redeem_code: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    # Resources (scripts...): path to this item's specific file inside the
    # repo at `repo_url` — e.g. "resources/scripts/deploy-checklist.sh" in
    # the single shared ASE-Catalog repo. When both repo_url and repo_path
    # are set, the consumer catalog exposes a read-only "view content" +
    # download action, gated by ownership (ConsumerCatalogService — same
    # purchased_slugs() check as everything else), never a GitHub
    # collaborator invite (that would expose the whole shared repo).
    repo_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # --- Pricing engine (see app/core/pricing_engine.py) --------------------
    # Every "subelemento" (subtipo, complejidad, funcionalidad, páginas...)
    # is just a PricingDimensionType for this item's pillar — there is no
    # separate subcategory concept. Selections (a pillar can have several
    # dimension types) live in CatalogItemDimensionSelection, one row per
    # type — see that model.
    # Book pillar only — drives auto-matching against PricingDimensionLevel
    # page-count ranges. Unused (null) for the other three catalog pillars.
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Snapshot of the last calculated recommendation — purely informational,
    # never enforced; `price` above is the actual price and is always set
    # directly by the admin, matching the "advisory suggestion" design.
    recommended_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # --- Test-execution SaaS (product pillar only) --------------------------
    # Turns a "product" catalog item into a runnable test-automation
    # framework: ASE's own GitHub repo hosting the customer's framework code
    # (Pytest, Playwright, Karate, WDIO...), triggered via the GitHub Actions
    # workflow_dispatch API (see app.core.github_client) rather than exposing
    # the repo itself — the buyer never gets repo access, only API-triggered
    # runs, same "we own the credential, they own the entitlement" model as
    # the rest of the catalog. All three are null for every non-runnable
    # catalog item (courses, books, resources, and any product that isn't a
    # test framework); test_execution.service treats a null
    # test_workflow_file as "this item cannot be run".
    test_repo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    # Workflow file name in .github/workflows/ to dispatch, e.g. "run-tests.yml".
    test_workflow_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Runs included per billing period for a purchase/plan-inclusion of this
    # item — the quota enforced by test_execution.service before allowing a
    # new dispatch. Null/0 both mean "not runnable" at the API layer.
    test_included_runs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Schema of the workflow_dispatch inputs this framework's workflow
    # actually declares (e.g. BASE_URL, API_TOKEN) — a list of
    # {key, label, type, required, description} dicts, admin-defined,
    # mirroring CatalogCategory.fields_json's "questionnaire" pattern. Each
    # `key` here must match an input name declared under
    # `on.workflow_dispatch.inputs` in the workflow YAML at test_repo_url,
    # or GitHub silently ignores it. Buyers fill in their own values per
    # framework (see TestExecutionConfig) rather than reusing the admin's
    # own GitHub repo variables — that's what makes this usable by more
    # than one customer against their own target environment.
    test_input_schema_json: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)

    images: Mapped[list["CatalogItemImage"]] = relationship(
        "CatalogItemImage",
        back_populates="catalog_item",
        order_by="CatalogItemImage.display_order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    dimension_selections: Mapped[list["CatalogItemDimensionSelection"]] = relationship(
        "CatalogItemDimensionSelection",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<CatalogItem id={self.id} slug={self.slug!r} type={self.type.value}>"
