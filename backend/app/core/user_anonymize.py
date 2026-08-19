from __future__ import annotations

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_link import UserLink


def anonymize_user_pii(db: Session, user: User) -> None:
    """Right-to-be-forgotten support (RGPD art. 17): a soft delete keeps the
    row (for referential integrity — purchases, audit logs, etc. still need
    a valid user_id) but scrubs the personal data itself. The placeholder
    domain below is a real one we control rather than an RFC 2606 reserved
    TLD like `.invalid` — that would be the "correct" choice semantically,
    but pydantic's EmailStr (via the email-validator package) actively
    rejects RFC 2606 special-use domains as syntactically invalid, which
    broke every endpoint that returns a deleted user (e.g. DELETE
    /api/v1/users/{uuid} with response_model=UserRead) with a
    ResponseValidationError. Folding in the UUID keeps the anonymized email
    unique so it never collides with another deleted account.

    Shared by both the admin "delete user" action (app/modules/users/service.py)
    and the automated account-lifecycle deletion sweep
    (app/core/account_lifecycle.py) — caller is responsible for setting
    `user.status = UserStatus.deleted` and committing."""
    user.email = f"deleted-{user.uuid}@deleted.arcesabinengineering.com"
    user.first_name = None
    user.last_name = None
    user.display_name = "Deleted user"
    user.phone_e164 = None
    user.phone_verified_at = None
    user.avatar_url = None
    user.avatar_data = None
    user.avatar_mime = None
    db.execute(delete(UserLink).where(UserLink.user_id == user.id))
