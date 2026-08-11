from __future__ import annotations

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class BookRepoRedemption(Base, IdPkMixin, TimestampMixin):
    """Tracks redemptions of a book's repo-access code (printed inside the
    book, shared across all copies of that title).

    Redeeming works both logged-out (public) and logged-in (private):
    - Signed-in user: one row per (user, book) — redeeming again just
      re-reveals the link, so ``user_id`` participates in the unique
      constraint.
    - Anonymous: ``user_id`` is NULL and every redemption is logged as its
      own row, so we still have a record of anonymous usage per book
      without tying it to an identity — the GitHub username is then the
      only identifying trace of who was invited.

    The repo itself is private on GitHub; redeeming sends the reader a
    collaborator invitation via the GitHub API (see app/core/github_client.py)
    rather than just handing out a link."""

    __tablename__ = "book_repo_redemptions"
    __table_args__ = (
        UniqueConstraint("user_id", "catalog_item_id", name="uq_book_repo_redemptions_user_item"),
    )

    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    github_username: Mapped[str | None] = mapped_column(String(100), nullable=True)

    def __repr__(self) -> str:
        return f"<BookRepoRedemption id={self.id} user_id={self.user_id} catalog_item_id={self.catalog_item_id}>"
