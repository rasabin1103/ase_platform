from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class ContractGuardProject(Base, IdPkMixin, TimestampMixin):
    """Qué proyectos de ASE API Contract Guard pertenecen a cada usuario.

    Contract Guard es monousuario y no tiene noción de dueño: sin esta tabla
    cualquier usuario de ASE podría leer los contratos de otro conociendo (o
    listando) un UUID. ASE solo reenvía una petición si el proyecto figura
    aquí para el usuario que la hace."""

    __tablename__ = "contract_guard_projects"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    # UUID del proyecto en Contract Guard (único: un proyecto, un dueño).
    project_uuid: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)

    @property
    def project_id(self) -> UUID:
        return UUID(self.project_uuid)
