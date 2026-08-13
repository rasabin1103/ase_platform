from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.admin_data_reset.domains import DATA_DOMAINS_BY_KEY, MASTER_CONFIRM_PHRASE
from app.modules.admin_data_reset.schemas import (
    DataDomainListResponse,
    DataDomainRead,
    ResetExecuteRequest,
    ResetExecuteResponse,
)
from app.modules.admin_data_reset.service import DataResetError, list_domains, reset_all, reset_domain
from app.modules.auth.dependencies import get_current_user, is_super_admin

router = APIRouter(prefix="/api/v1/admin/data-reset", tags=["admin-data-reset"])


def require_super_admin(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    # Deliberately not `require_permission(...)`: this endpoint must stay
    # reachable only by the literal super_admin role, never delegable to any
    # other role via a custom permission grant.
    if not is_super_admin(db, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el super admin puede acceder.")
    return user


@router.get("/domains", response_model=DataDomainListResponse)
def get_domains(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    infos = list_domains(db, current_user)
    return DataDomainListResponse(
        domains=[
            DataDomainRead(
                key=info.domain.key,
                label=info.domain.label,
                tables=list(info.domain.tables),
                row_count=info.row_count,
                extra_tables=list(info.extra_tables),
                confirm_phrase=info.domain.confirm_phrase,
                is_special=info.domain.special is not None,
            )
            for info in infos
        ],
        master_confirm_phrase=MASTER_CONFIRM_PHRASE,
        super_admin_email=current_user.email,
    )


@router.post("/domain/{domain_key}", response_model=ResetExecuteResponse)
def reset_one_domain(
    domain_key: str,
    payload: ResetExecuteRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    if domain_key not in DATA_DOMAINS_BY_KEY:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dominio desconocido.")
    try:
        result = reset_domain(
            db,
            current_user=current_user,
            domain_key=domain_key,
            confirm_phrase=payload.confirm_phrase,
            password=payload.password,
        )
    except DataResetError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ResetExecuteResponse(
        tables_wiped=list(result.tables_wiped),
        rows_deleted=result.rows_deleted,
        preserved_user_email=result.preserved_user_email,
        message=f"Se eliminaron {result.rows_deleted} filas de {len(result.tables_wiped)} tabla(s).",
    )


@router.post("/all", response_model=ResetExecuteResponse)
def reset_everything(
    payload: ResetExecuteRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    try:
        result = reset_all(
            db,
            current_user=current_user,
            confirm_phrase=payload.confirm_phrase,
            password=payload.password,
        )
    except DataResetError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ResetExecuteResponse(
        tables_wiped=list(result.tables_wiped),
        rows_deleted=result.rows_deleted,
        preserved_user_email=result.preserved_user_email,
        message=(
            f"Plataforma reiniciada: {result.rows_deleted} filas eliminadas. "
            f"Solo se conserva tu usuario ({result.preserved_user_email}) y tu organización."
        ),
    )
