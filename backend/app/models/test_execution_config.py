from __future__ import annotations

from typing import Any

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class TestExecutionConfig(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """A buyer's saved workflow_dispatch input values for one framework
    CatalogItem — e.g. their own BASE_URL and API_TOKEN, filled in against
    the admin-defined test_input_schema_json on that item. Called a
    "scenario" (escenario) in the UI: a buyer can save several named sets
    of values for the same framework (e.g. "Staging", "Production creds")
    rather than just one, so `name` + `is_default` were added on top of the
    original single-row-per-(user, item) design (see the migration that
    introduced them for the backfill of pre-existing rows).

    `is_default` marks the scenario used whenever a trigger call (private
    dashboard or the public client_id/client_secret API) doesn't specify
    which one to run — exactly one row per (user, catalog_item) should have
    this set at any time; TestExecutionService enforces that invariant in
    application code (create_scenario/set_default_scenario/delete_scenario)
    rather than a DB constraint, since "at most one true per group" isn't
    expressible as a plain SQL UNIQUE constraint.

    `values_json` stores every value Fernet-encrypted (see
    app.core.secret_encryption) regardless of whether its schema entry is
    typed "secret" or not — simplest to always encrypt than to track which
    fields need it, and there's no legitimate reason to read these back in
    plaintext from a DB dump. Decrypted only inside test_execution.service
    right before being handed to github_client.dispatch_workflow as
    `inputs`; API reads only ever return non-secret values back to the
    owning user (to prefill the form) and a plain "is this set" boolean for
    secret-typed ones — same one-way-after-creation posture as
    ApiCredential.client_secret."""

    __tablename__ = "test_execution_configs"
    __table_args__ = (
        UniqueConstraint("user_id", "catalog_item_id", "name", name="uq_test_execution_configs_user_item_name"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    # Scenario label the buyer picks, e.g. "Staging" / "Production creds" —
    # pre-existing rows were backfilled as "Predeterminado" when this column
    # was introduced.
    name: Mapped[str] = mapped_column(String(150), nullable=False, default="Predeterminado")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # {key: fernet_ciphertext} — one entry per test_input_schema_json key
    # the user has actually filled in; missing keys just mean "not set yet".
    values_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)

    def __repr__(self) -> str:
        return (
            f"<TestExecutionConfig id={self.id} user_id={self.user_id} "
            f"catalog_item_id={self.catalog_item_id} name={self.name!r}>"
        )
