"""Campos de tipo «file» de «Probar mis productos».

El navegador envía el archivo como `file:<nombre>:<base64>`. Antes de lanzar el
workflow, el backend lo comprime (gzip) y lo reenvía como `gz64:<nombre>:<base64>`
dentro del propio `workflow_dispatch` — solo hace falta el token de GitHub que
ya se usa para lanzar el workflow, sin enlaces públicos ni almacenamiento.

GitHub limita el total de entradas de un workflow_dispatch a ~65 000
caracteres, por eso se comprime y se comprueba el presupuesto."""

from __future__ import annotations

import base64
import binascii
import gzip
import re
from urllib.parse import quote, unquote

MAX_FILE_BYTES = 2 * 1024 * 1024
ALLOWED_EXTENSIONS = (".json", ".yaml", ".yml")
FILE_PREFIX = "file:"
ENCODED_PREFIX = "gz64:"
# Límite de GitHub: 65 535 caracteres en total entre todas las entradas.
INPUTS_BUDGET = 60_000


class UploadError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 422):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def _safe_filename(name: str) -> str:
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", (name or "").replace("\\", "/").rsplit("/", 1)[-1]).strip("._")
    return (base or "file.json")[:120]


def encode_file_value(value: str) -> str:
    """`file:<nombre>:<base64>` -> `gz64:<nombre>:<base64 de gzip>`."""
    try:
        _, name, b64 = value.split(":", 2)
    except ValueError as exc:
        raise UploadError("invalid_file", "The attached file is not valid") from exc
    name = _safe_filename(unquote(name))
    if not name.lower().endswith(ALLOWED_EXTENSIONS):
        raise UploadError("unsupported_format", "Only .json, .yaml and .yml files are accepted")
    try:
        raw = base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise UploadError("invalid_file", "The attached file is not valid") from exc
    if not raw:
        raise UploadError("empty_file", "The file is empty")
    if len(raw) > MAX_FILE_BYTES:
        raise UploadError("upload_too_large", "The file exceeds the 2 MiB limit", 413)
    packed = base64.b64encode(gzip.compress(raw, 9)).decode("ascii")
    return f"{ENCODED_PREFIX}{quote(name)}:{packed}"


def check_budget(inputs: dict[str, str]) -> None:
    total = sum(len(k) + len(v) for k, v in inputs.items())
    if total > INPUTS_BUDGET:
        raise UploadError(
            "inputs_too_large",
            "The attached files are too large for a single run (GitHub limits workflow inputs to ~60 000 "
            "characters once compressed). Use smaller contracts or split them.",
        )
