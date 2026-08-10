from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import UserStatus
from app.models.user import User
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenPair
from app.modules.auth.security import create_access_token, create_refresh_token, hash_password, verify_password, get_token_subject_uuid
from app.modules.users.repository import UsersRepository


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UsersRepository(db)

    def register(self, payload: RegisterRequest) -> User:
        if self.users.get_by_email(str(payload.email)) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

        user = User(
            email=str(payload.email),
            password_hash=hash_password(payload.plain_password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            display_name=payload.display_name,
            status=UserStatus.active,
        )
        self.users.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, payload: LoginRequest) -> TokenPair:
        user = self.users.get_by_email(str(payload.email))
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if user.status != UserStatus.active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)

        return TokenPair(
            access_token=create_access_token(user_uuid=user.uuid),
            refresh_token=create_refresh_token(user_uuid=user.uuid),
        )

    def refresh(self, refresh_token: str) -> TokenPair:
        try:
            user_uuid = get_token_subject_uuid(refresh_token, expected_type="refresh")
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        user = self.users.get_by_uuid(user_uuid)
        if user is None or user.status != UserStatus.active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        return TokenPair(
            access_token=create_access_token(user_uuid=user.uuid),
            refresh_token=create_refresh_token(user_uuid=user.uuid),
        )

