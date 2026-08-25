"""HTTP Basic Auth dependency for the public test-execution API — modeled
after get_current_user in app.modules.auth.dependencies (JWT bearer), but
for machine-to-machine calls authenticated with an ApiCredential's
client_id/client_secret instead of a user session token."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.api_credentials import hash_client_secret, verify_client_secret
from app.core.database import get_db
from app.models.api_credential import ApiCredential
from app.models.enums import ApiCredentialStatus
from app.models.user import User

http_basic = HTTPBasic(auto_error=True)

# A fixed, precomputed hash checked when no matching client_id exists, so a
# lookup miss takes the same code path (and roughly the same time) as a
# wrong-secret failure — otherwise "unknown client_id" would return faster
# than "wrong secret" and let an attacker enumerate valid client_ids by
# timing alone.
_DUMMY_SECRET_HASH = hash_client_secret("no-such-credential")

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid API credentials",
    headers={"WWW-Authenticate": "Basic"},
)


def get_current_api_credential(
    credentials: HTTPBasicCredentials = Depends(http_basic),
    db: Session = Depends(get_db),
) -> ApiCredential:
    credential = db.execute(
        select(ApiCredential).where(ApiCredential.client_id == credentials.username)
    ).scalar_one_or_none()

    if credential is None:
        verify_client_secret(credentials.password, _DUMMY_SECRET_HASH)
        raise _UNAUTHORIZED

    if credential.status != ApiCredentialStatus.active:
        raise _UNAUTHORIZED

    if not verify_client_secret(credentials.password, credential.client_secret_hash):
        raise _UNAUTHORIZED

    credential.last_used_at = datetime.now(timezone.utc)
    db.flush()
    return credential


def get_current_api_user(
    credential: ApiCredential = Depends(get_current_api_credential),
    db: Session = Depends(get_db),
) -> User:
    """The user the calling credential belongs to — quota and ownership
    checks (does this user own/have-plan-access to the requested framework
    CatalogItem) are resolved against this user, not the credential itself."""
    user = db.get(User, credential.user_id)
    if user is None:
        raise _UNAUTHORIZED
    return user
