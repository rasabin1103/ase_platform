from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.user import User
from app.modules.academy.certificate_notify import send_certificate_email
from app.modules.academy.certificate_pdf import render_certificate_pdf
from app.modules.academy.exam_schemas import (
    CertificateRead,
    ExamAnswersWrite,
    ExamAttemptRead,
    ExamOverviewRead,
    ExamStartRequest,
)
from app.modules.academy.exam_service import AcademyExamService, ExamConflict, ExamForbidden, ExamNotFound
from app.modules.auth.dependencies import get_current_active_user, get_current_user_optional

router = APIRouter(prefix="/api/v1/academy", tags=["academy"])

_KEY = r"^[a-z0-9-]+$"
_CODE = r"^[A-Za-z0-9-]+$"
# Idioma de preguntas, títulos y explicaciones (el intento es el mismo en ambos).
Lang = Query("es", pattern="^(es|en)$")


def _http(exc: Exception) -> HTTPException:
    if isinstance(exc, ExamNotFound):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, ExamForbidden):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    if isinstance(exc, ExamConflict):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(status_code=422, detail=str(exc))
    raise exc


def _notify(service: AcademyExamService, user: User | None, tasks: BackgroundTasks) -> None:
    """Si esta petición ha emitido un certificado, avisa por email (con el PDF)."""
    if service.issued is not None and user is not None:
        tasks.add_task(send_certificate_email, user.email, service.certificate_read(service.issued), service.lang)


@router.get("/exams/{course_key}", response_model=ExamOverviewRead)
def exam_overview(
    tasks: BackgroundTasks,
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    lang: str = Lang,
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ExamOverviewRead:
    """Formato del examen, acceso, misiones pendientes, intentos y certificado.
    Funciona sin sesión (solo el formato)."""
    service = AcademyExamService(db, lang=lang)
    try:
        result = service.overview(user, course_key)
    except Exception as exc:  # noqa: BLE001
        raise _http(exc) from exc
    _notify(service, user, tasks)
    return result


@router.post("/exams/{course_key}/attempts", response_model=ExamAttemptRead)
@limiter.limit("20/hour")
def start_exam(
    request: Request,
    response: Response,
    payload: ExamStartRequest,
    tasks: BackgroundTasks,
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    lang: str = Lang,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ExamAttemptRead:
    """Empieza un simulacro (201) o reanuda el que esté en curso (200)."""
    service = AcademyExamService(db, lang=lang)
    try:
        attempt, created = service.start(user, course_key, payload.extendedTime)
    except Exception as exc:  # noqa: BLE001
        raise _http(exc) from exc
    _notify(service, user, tasks)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return attempt


@router.get("/exams/{course_key}/attempts/{attempt_id}", response_model=ExamAttemptRead)
def read_exam_attempt(
    attempt_id: UUID,
    tasks: BackgroundTasks,
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    lang: str = Lang,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ExamAttemptRead:
    service = AcademyExamService(db, lang=lang)
    try:
        result = service.get(user, course_key, attempt_id)
    except Exception as exc:  # noqa: BLE001
        raise _http(exc) from exc
    _notify(service, user, tasks)
    return result


@router.put("/exams/{course_key}/attempts/{attempt_id}/answers", response_model=ExamAttemptRead)
def save_exam_answers(
    payload: ExamAnswersWrite,
    attempt_id: UUID,
    tasks: BackgroundTasks,
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    lang: str = Lang,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ExamAttemptRead:
    """Autoguardado. Si el tiempo ya se agotó, el intento se corrige y se
    devuelve entregado."""
    service = AcademyExamService(db, lang=lang)
    try:
        result = service.save_answers(user, course_key, attempt_id, payload.answers)
    except Exception as exc:  # noqa: BLE001
        raise _http(exc) from exc
    _notify(service, user, tasks)
    return result


@router.post("/exams/{course_key}/attempts/{attempt_id}/submit", response_model=ExamAttemptRead)
def submit_exam(
    payload: ExamAnswersWrite,
    attempt_id: UUID,
    tasks: BackgroundTasks,
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    lang: str = Lang,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ExamAttemptRead:
    service = AcademyExamService(db, lang=lang)
    try:
        result = service.submit(user, course_key, attempt_id, payload.answers)
    except Exception as exc:  # noqa: BLE001
        raise _http(exc) from exc
    _notify(service, user, tasks)
    return result


@router.post("/certificates/{course_key}", response_model=CertificateRead)
def claim_certificate(
    tasks: BackgroundTasks,
    course_key: str = Path(min_length=1, max_length=80, pattern=_KEY),
    lang: str = Lang,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> CertificateRead:
    """Emite el certificado si ya se cumplen las condiciones (por ejemplo,
    se aprobó el simulacro antes de terminar las misiones)."""
    service = AcademyExamService(db, lang=lang)
    try:
        result = service.claim_certificate(user, course_key)
    except Exception as exc:  # noqa: BLE001
        raise _http(exc) from exc
    _notify(service, user, tasks)
    return result


@router.get("/certificates/verify/{code}", response_model=CertificateRead)
@limiter.limit("60/minute")
def verify_certificate(
    request: Request,
    code: str = Path(min_length=8, max_length=32, pattern=_CODE),
    lang: str = Lang,
    db: Session = Depends(get_db),
) -> CertificateRead:
    """Verificación pública de un certificado por su código."""
    try:
        return AcademyExamService(db, lang=lang).verify(code)
    except Exception as exc:  # noqa: BLE001
        raise _http(exc) from exc


@router.get("/certificates/verify/{code}/pdf")
@limiter.limit("30/minute")
def certificate_pdf(
    request: Request,
    code: str = Path(min_length=8, max_length=32, pattern=_CODE),
    lang: str = Lang,
    db: Session = Depends(get_db),
) -> Response:
    """PDF público del certificado (A4 apaisado), generado en el servidor."""
    service = AcademyExamService(db, lang=lang)
    try:
        cert = service.verify(code)
    except Exception as exc:  # noqa: BLE001
        raise _http(exc) from exc
    pdf = render_certificate_pdf(cert, lang=service.lang, base_url=settings.FRONTEND_URL)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{cert.code}.pdf"', "Cache-Control": "private, max-age=300"},
    )
