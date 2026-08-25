from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import ApiCredentialStatus
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class ApiCredential(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """A client_id/client_secret pair identifying a user for the
    test-execution SaaS API (see app.modules.test_execution) — one user can
    hold several, e.g. "CI pipeline" and "local testing", each independently
    creatable/renameable/revocable. Only `client_secret_hash` is ever
    persisted; the raw secret is generated once at creation time and never
    stored or retrievable again (same one-time-visible pattern as
    UserVerificationToken, but bcrypt-hashed via pwd_context like a password
    rather than SHA-256, since it's checked far more often, on every API
    call, and bcrypt is the project's existing convention for anything
    compared on every request).

    Not scoped to a single CatalogItem: which framework(s) it can trigger,
    and how many runs remain, is resolved per-request against the owning
    user's purchases/plan (ConsumerCatalogService.purchased_slugs) and each
    CatalogItem's own test_included_runs quota — the credential is just an
    identity, not an entitlement."""

    __tablename__ = "api_credentials"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    # User-chosen label so they can tell their credentials apart in the
    # management UI, e.g. "CI pipeline (prod)" — purely descriptive.
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    client_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    client_secret_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ApiCredentialStatus] = mapped_column(
        Enum(ApiCredentialStatus, name="api_credential_status", native_enum=True),
        nullable=False,
        default=ApiCredentialStatus.active,
        index=True,
    )
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<ApiCredential id={self.id} client_id={self.client_id!r} status={self.status.value}>"
