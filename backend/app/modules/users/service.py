from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.enums import UserStatus
from app.models.user import User
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import UserCreate, UserUpdate


_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UsersService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UsersRepository(db)

    def _hash_password(self, plain_password: str) -> str:
        return _pwd_context.hash(plain_password)

    def create_user(self, payload: UserCreate) -> User:
        existing = self.repo.get_by_email(str(payload.email))
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        user = User(
            email=str(payload.email),
            password_hash=self._hash_password(payload.plain_password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            display_name=payload.display_name,
            status=UserStatus.active,
        )
        self.repo.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_users(self, *, limit: int, offset: int) -> tuple[list[User], int]:
        return self.repo.list(limit=limit, offset=offset)

    def list_users_for_organization(self, *, organization_id: int, limit: int, offset: int) -> tuple[list[User], int]:
        return self.repo.list_by_organization(organization_id=organization_id, limit=limit, offset=offset)

    def get_user(self, user_uuid: UUID) -> User:
        user = self.repo.get_by_uuid(user_uuid)
        if user is None or user.status == UserStatus.deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    def get_user_for_organization(self, user_uuid: UUID, *, organization_id: int) -> User:
        user = self.repo.get_by_uuid_in_organization(user_uuid=user_uuid, organization_id=organization_id)
        if user is None or user.status == UserStatus.deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    def update_user(self, user_uuid: UUID, payload: UserUpdate) -> User:
        user = self.get_user(user_uuid)

        if payload.email is not None and str(payload.email) != user.email:
            existing = self.repo.get_by_email(str(payload.email))
            if existing is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
            user.email = str(payload.email)

        if payload.plain_password is not None:
            user.password_hash = self._hash_password(payload.plain_password)

        if payload.first_name is not None:
            user.first_name = payload.first_name
        if payload.last_name is not None:
            user.last_name = payload.last_name
        if payload.display_name is not None:
            user.display_name = payload.display_name
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url
        if payload.status is not None:
            user.status = payload.status

        self.db.commit()
        self.db.refresh(user)
        return user

    def soft_delete_user(self, user_uuid: UUID) -> User:
        user = self.get_user(user_uuid)
        user.status = UserStatus.deleted
        self.db.commit()
        self.db.refresh(user)
        return user

