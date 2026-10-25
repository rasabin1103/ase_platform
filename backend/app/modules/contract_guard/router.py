from __future__ import annotations

import json
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.contract_guard.client import ContractGuardError, ContractGuardUnavailable
from app.modules.contract_guard.service import MAX_UPLOAD_BYTES, ContractGuardService

router = APIRouter(prefix="/api/v1/product-tools/contract-guard", tags=["product-tools"])


def get_service(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ContractGuardService:
    return ContractGuardService(db, user)


def get_authorized_service(svc: ContractGuardService = Depends(get_service)) -> ContractGuardService:
    try:
        svc.assert_product_access()
    except ContractGuardError as exc:
        _raise(exc)
    return svc


def _detail(code: str, message: str, details: Any = None) -> dict:
    out: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        out["details"] = details
    return out


def _raise(exc: Exception) -> None:
    """Convierte los errores del servicio en el formato de error de ASE."""
    if isinstance(exc, ContractGuardUnavailable):
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=_detail(exc.code, str(exc))) from exc
    if isinstance(exc, ContractGuardError):
        raise HTTPException(exc.status_code, detail=_detail(exc.code, exc.message, exc.details)) from exc
    raise exc


async def _read_capped(upload: UploadFile) -> bytes:
    data = await upload.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise ContractGuardError(413, "upload_too_large", "The file exceeds the 2 MiB limit")
    return data


def _passthrough(call) -> JSONResponse:
    try:
        return JSONResponse(content=call())
    except (ContractGuardError, ContractGuardUnavailable) as exc:
        _raise(exc)


# --- estado ------------------------------------------------------------------

@router.get("/status")
def tool_status(svc: ContractGuardService = Depends(get_authorized_service)):
    return svc.status()


# --- proyectos ---------------------------------------------------------------

@router.get("/projects")
def list_projects(svc: ContractGuardService = Depends(get_authorized_service)):
    return _passthrough(svc.list_projects)


@router.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(body: dict = Body(...), svc: ContractGuardService = Depends(get_authorized_service)):
    try:
        return JSONResponse(content=svc.create_project(body), status_code=status.HTTP_201_CREATED)
    except (ContractGuardError, ContractGuardUnavailable) as exc:
        _raise(exc)


@router.get("/projects/{project_id}")
def get_project(project_id: UUID, svc: ContractGuardService = Depends(get_authorized_service)):
    return _passthrough(lambda: svc.get_project(project_id))


@router.patch("/projects/{project_id}")
def update_project(project_id: UUID, body: dict = Body(...), svc: ContractGuardService = Depends(get_authorized_service)):
    return _passthrough(lambda: svc.update_project(project_id, body))


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    confirm_name: str = Query(..., min_length=1, max_length=160),
    svc: ContractGuardService = Depends(get_authorized_service),
):
    try:
        svc.delete_project(project_id, confirm_name)
    except (ContractGuardError, ContractGuardUnavailable) as exc:
        _raise(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- contratos ---------------------------------------------------------------

@router.post("/projects/{project_id}/contracts", status_code=status.HTTP_201_CREATED)
async def import_contract(
    project_id: UUID,
    version_label: str = Form(..., min_length=1, max_length=100),
    file: UploadFile = File(...),
    svc: ContractGuardService = Depends(get_authorized_service),
):
    try:
        content = await _read_capped(file)
        created = svc.import_contract(
            project_id, version_label=version_label, filename=file.filename or "contract.json", content=content
        )
        return JSONResponse(content=created, status_code=status.HTTP_201_CREATED)
    except (ContractGuardError, ContractGuardUnavailable) as exc:
        _raise(exc)


@router.get("/projects/{project_id}/contracts")
def list_contracts(
    project_id: UUID,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: ContractGuardService = Depends(get_authorized_service),
):
    return _passthrough(lambda: svc.list_contracts(project_id, offset=offset, limit=limit))


@router.get("/projects/{project_id}/contracts/{version_id}")
def get_contract(project_id: UUID, version_id: UUID, svc: ContractGuardService = Depends(get_authorized_service)):
    return _passthrough(lambda: svc.get_contract(project_id, version_id))


# --- comparaciones -----------------------------------------------------------

@router.post("/projects/{project_id}/comparisons", status_code=status.HTTP_201_CREATED)
def create_comparison(project_id: UUID, body: dict = Body(...), svc: ContractGuardService = Depends(get_authorized_service)):
    try:
        return JSONResponse(content=svc.create_comparison(project_id, body), status_code=status.HTTP_201_CREATED)
    except (ContractGuardError, ContractGuardUnavailable) as exc:
        _raise(exc)


@router.get("/projects/{project_id}/comparisons")
def list_comparisons(
    project_id: UUID,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: ContractGuardService = Depends(get_authorized_service),
):
    return _passthrough(lambda: svc.list_comparisons(project_id, offset=offset, limit=limit))


@router.get("/comparisons/{comparison_id}")
def get_comparison(comparison_id: UUID, svc: ContractGuardService = Depends(get_authorized_service)):
    return _passthrough(lambda: svc.get_comparison(comparison_id))


@router.get("/comparisons/{comparison_id}/export")
def export_comparison(comparison_id: UUID, svc: ContractGuardService = Depends(get_authorized_service)):
    try:
        report = svc.get_comparison(comparison_id, export=True)
    except (ContractGuardError, ContractGuardUnavailable) as exc:
        _raise(exc)
    return Response(
        content=json.dumps(report, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="comparison-{comparison_id}.json"'},
    )


# --- validaciones ------------------------------------------------------------

@router.post("/projects/{project_id}/contracts/{version_id}/validate-response")
def validate_response(
    project_id: UUID, version_id: UUID, body: dict = Body(...), svc: ContractGuardService = Depends(get_authorized_service)
):
    return _passthrough(lambda: svc.validate_response(project_id, version_id, body))


@router.post("/validations/schema")
def validate_schema(body: dict = Body(...), svc: ContractGuardService = Depends(get_authorized_service)):
    return _passthrough(lambda: svc.validate_schema(body))


@router.post("/validations/schema/files")
async def validate_schema_files(
    schema_file: UploadFile = File(...),
    response_file: UploadFile = File(...),
    svc: ContractGuardService = Depends(get_authorized_service),
):
    try:
        schema = (schema_file.filename or "schema.json", await _read_capped(schema_file))
        response = (response_file.filename or "response.json", await _read_capped(response_file))
        return JSONResponse(content=svc.validate_schema_files(schema=schema, response=response))
    except (ContractGuardError, ContractGuardUnavailable) as exc:
        _raise(exc)
