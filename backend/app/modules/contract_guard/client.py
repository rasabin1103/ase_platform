"""Cliente HTTP de ASE API Contract Guard.

Contract Guard es un servicio monousuario sin autenticación: nunca se
expone al navegador. ASE lo llama desde el backend, tras comprobar acceso
al producto y propiedad del proyecto (ver service.py). Los errores se
traducen a dos excepciones para que el router los convierta en respuestas
coherentes."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class ContractGuardUnavailable(Exception):
    """No configurado o inalcanzable (→ 503)."""

    def __init__(self, message: str, *, code: str = "contract_guard_unavailable"):
        super().__init__(message)
        self.code = code


class ContractGuardError(Exception):
    """Respuesta de error del servicio (4xx/5xx) ya normalizada."""

    def __init__(self, status_code: int, code: str, message: str, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


def is_configured() -> bool:
    return bool((settings.CONTRACT_GUARD_BASE_URL or "").strip())


def _base_url() -> str:
    base = (settings.CONTRACT_GUARD_BASE_URL or "").strip().rstrip("/")
    if not base:
        raise ContractGuardUnavailable("CONTRACT_GUARD_BASE_URL is not configured")
    return base


def _normalize_error(response: httpx.Response) -> ContractGuardError:
    """El servicio responde {"error": {"code", "message", "details"?}}."""
    code, message, details = "upstream_error", f"Contract Guard returned HTTP {response.status_code}", None
    try:
        payload = response.json()
    except ValueError:
        payload = None
    if isinstance(payload, dict) and isinstance(payload.get("error"), dict):
        err = payload["error"]
        code = str(err.get("code") or code)
        message = str(err.get("message") or message)
        details = err.get("details")
    return ContractGuardError(response.status_code, code, message, details)


def call(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json: Any = None,
    data: dict[str, str] | None = None,
    files: dict[str, tuple[str, bytes, str]] | None = None,
) -> Any:
    """Llama al servicio y devuelve el JSON (o None en 204)."""
    url = f"{_base_url()}{path}"
    try:
        with httpx.Client(timeout=settings.CONTRACT_GUARD_TIMEOUT_SECONDS) as client:
            response = client.request(method, url, params=params, json=json, data=data, files=files)
    except httpx.TimeoutException as exc:
        raise ContractGuardError(504, "contract_guard_timeout", "Contract Guard took too long to respond") from exc
    except httpx.HTTPError as exc:
        logger.warning("Contract Guard unreachable: %s", exc.__class__.__name__)
        raise ContractGuardUnavailable("Contract Guard is unreachable") from exc

    if response.status_code == 204:
        return None
    if response.status_code >= 400:
        raise _normalize_error(response)
    try:
        return response.json()
    except ValueError as exc:
        raise ContractGuardError(502, "invalid_upstream_response", "Contract Guard returned a non-JSON body") from exc
