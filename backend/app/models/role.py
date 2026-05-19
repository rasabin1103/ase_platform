from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import RoleScope
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.invitation import Invitation
    from app.models.member_role import MemberRole
    from app.models.role_permission import RolePermission


class Role(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "roles"

    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    scope: Mapped[RoleScope] = mapped_column(
        Enum(RoleScope, name="role_scope", native_enum=True),
        nullable=False,
        default=RoleScope.organization,
    )
    description: Mapped[str | None] = mapped_column(Text)

    permissions: Mapped[list["RolePermission"]] = relationship(
        back_populates="role",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    member_assignments: Mapped[list["MemberRole"]] = relationship(
        back_populates="role",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    invitations: Mapped[list["Invitation"]] = relationship(back_populates="role")

    def __repr__(self) -> str:
        return f"<Role id={self.id} code={self.code!r} scope={self.scope.value}>"

