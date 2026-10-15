"""Simulacro de examen de ASE Academy: generación, corrección y certificado.

Ver docs/academy/simulacro.md. Reglas clave:
- Las preguntas salen del banco en código (exam_bank) con el reparto por
  capítulo de cada examen (exam_config) y priorizando las que el usuario
  ha visto menos veces, así los simulacros sucesivos no se repiten.
- Las opciones se barajan por intento; la permutación se guarda y la
  respuesta correcta solo se revela al entregar.
- El tiempo lo controla el servidor: pasado el límite (más un margen) el
  intento se corrige con lo guardado.
- Certificado ASE (no oficial ISTQB) = simulacro aprobado + todas las
  misiones del curso terminadas.
"""

from __future__ import annotations

import random
import secrets
from collections import Counter
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.academy_exam import AcademyCertificate, AcademyExamAttempt
from app.models.academy_run import AcademyRun
from app.models.user import User
from app.modules.academy.exam_bank import (
    BANK_VERSION,
    BY_ID,
    CHAPTER_TITLES,
    CHAPTER_TITLES_EN,
    EN,
    QUESTIONS,
    SECTION_TITLES,
    SECTION_TITLES_EN,
)
from app.modules.academy.exam_config import ExamConfig, get_exam
from app.modules.academy.exam_schemas import (
    CertificateRead,
    ExamAttemptRead,
    ExamAttemptSummary,
    ExamChapterQuota,
    ExamConfigRead,
    ExamMissionsStatus,
    ExamOverviewRead,
    ExamQuestionRead,
    ExamResultRead,
    ExamScoreLine,
)
from app.modules.academy.service import AcademyService

# Margen para respuestas que salen del navegador justo al acabar el tiempo.
GRACE = timedelta(seconds=30)


class ExamNotFound(LookupError):
    pass


class ExamForbidden(PermissionError):
    pass


class ExamConflict(RuntimeError):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def pool_for(config: ExamConfig, chapter: int) -> list[str]:
    return [q.id for q in QUESTIONS if q.chapter == chapter and config.allows(q.section)]


def distinct_exams(config: ExamConfig) -> int:
    return min(len(pool_for(config, chapter)) // count for chapter, count in config.distribution.items())


def draw_questions(config: ExamConfig, seen: Counter[str], rng: random.Random) -> list[dict]:
    """Elige las preguntas del intento con el reparto del examen: dentro de
    cada capítulo, primero las menos vistas por el usuario y, a igualdad, al
    azar. Devuelve [{"id", "order"}] con las opciones barajadas."""
    picked: list[str] = []
    for chapter in sorted(config.distribution):
        count = config.distribution[chapter]
        pool = pool_for(config, chapter)
        if len(pool) < count:
            raise RuntimeError(f"Banco insuficiente para el capítulo {chapter} de {config.course_key}")
        rng.shuffle(pool)
        pool.sort(key=lambda qid: seen[qid])
        picked.extend(pool[:count])
    return [{"id": qid, "order": rng.sample(range(len(BY_ID[qid].options)), len(BY_ID[qid].options))} for qid in picked]


def holder_name(user: User) -> str:
    full = " ".join(part for part in (user.first_name, user.last_name) if part).strip()
    return (full or (user.display_name or "").strip() or user.email.split("@")[0])[:200]


ExamLang = str  # "es" | "en"


def normalize_lang(lang: str | None) -> ExamLang:
    return "en" if (lang or "").lower().startswith("en") else "es"


class AcademyExamService:
    def __init__(self, db: Session, rng: random.Random | None = None, lang: str | None = None):
        self.db = db
        self.rng = rng or random.Random(secrets.randbits(64))
        self.lang = normalize_lang(lang)
        # Certificado emitido en esta petición (para enviar el aviso por email).
        self.issued: AcademyCertificate | None = None

    def _chapter_title(self, chapter: int) -> str:
        return (CHAPTER_TITLES_EN if self.lang == "en" else CHAPTER_TITLES)[chapter]

    def _section_title(self, section: str) -> str:
        return (SECTION_TITLES_EN if self.lang == "en" else SECTION_TITLES)[section]

    # ------------------------------------------------------------------ util
    @staticmethod
    def config_or_404(course_key: str) -> ExamConfig:
        config = get_exam(course_key)
        if config is None:
            raise ExamNotFound("Este curso no tiene examen")
        return config

    def _attempts(self, user_id: int, course_key: str) -> list[AcademyExamAttempt]:
        return list(
            self.db.execute(
                select(AcademyExamAttempt)
                .where(AcademyExamAttempt.user_id == user_id, AcademyExamAttempt.course_key == course_key)
                .order_by(AcademyExamAttempt.started_at.desc())
            ).scalars()
        )

    def _attempt(self, user: User, course_key: str, attempt_id: UUID) -> AcademyExamAttempt:
        attempt = self.db.execute(
            select(AcademyExamAttempt).where(
                AcademyExamAttempt.uuid == attempt_id,
                AcademyExamAttempt.user_id == user.id,
                AcademyExamAttempt.course_key == course_key,
            )
        ).scalar_one_or_none()
        if attempt is None:
            raise ExamNotFound("Intento no encontrado")
        return attempt

    def _missions(self, user_id: int, config: ExamConfig) -> ExamMissionsStatus:
        finished = set(
            self.db.execute(
                select(AcademyRun.mission_id).where(
                    AcademyRun.user_id == user_id,
                    AcademyRun.course_key == config.course_key,
                    AcademyRun.finished.is_(True),
                )
            ).scalars()
        )
        missing = [m for m in config.missions if m not in finished]
        return ExamMissionsStatus(total=len(config.missions), finished=len(config.missions) - len(missing), missing=missing)

    def _certificate(self, user_id: int, course_key: str) -> AcademyCertificate | None:
        return self.db.execute(
            select(AcademyCertificate).where(
                AcademyCertificate.user_id == user_id, AcademyCertificate.course_key == course_key
            )
        ).scalar_one_or_none()

    @staticmethod
    def _expired(attempt: AcademyExamAttempt, now: datetime) -> bool:
        return attempt.submitted_at is None and now > _aware(attempt.deadline_at) + GRACE

    def _config_read(self, config: ExamConfig) -> ExamConfigRead:
        return ExamConfigRead(
            title=config.title_for(self.lang),
            courseTitle=config.course_title_for(self.lang),
            total=config.total,
            minutes=config.minutes,
            extendedMinutes=config.extended_minutes,
            passMark=config.pass_mark,
            distribution=[
                ExamChapterQuota(chapter=c, title=self._chapter_title(c), count=n) for c, n in sorted(config.distribution.items())
            ],
            bankSize=sum(len(pool_for(config, c)) for c in config.distribution),
            distinctExams=distinct_exams(config),
        )

    def certificate_read(self, cert: AcademyCertificate) -> CertificateRead:
        config = get_exam(cert.course_key)
        return CertificateRead(
            code=cert.code,
            courseKey=cert.course_key,
            courseTitle=config.course_title_for(self.lang) if config else cert.course_key,
            holderName=cert.holder_name,
            score=cert.score,
            total=cert.total,
            issuedAt=cert.issued_at,
        )

    # -------------------------------------------------------------- overview
    def overview(self, user: User | None, course_key: str) -> ExamOverviewRead:
        config = self.config_or_404(course_key)
        has_access = AcademyService(self.db).get_access(course_key, user).hasAccess
        if user is None:
            return ExamOverviewRead(
                courseKey=course_key,
                config=self._config_read(config),
                authenticated=False,
                hasAccess=has_access,
                missions=ExamMissionsStatus(total=len(config.missions), finished=0, missing=list(config.missions)),
                attempts=[],
            )
        self._close_expired(user.id, course_key)
        attempts = self._attempts(user.id, course_key)
        missions = self._missions(user.id, config)
        cert = self._certificate(user.id, course_key)
        scores = [a.score for a in attempts if a.score is not None]
        passed = any(a.passed for a in attempts)
        in_progress = next((a for a in attempts if a.submitted_at is None), None)
        return ExamOverviewRead(
            courseKey=course_key,
            config=self._config_read(config),
            authenticated=True,
            hasAccess=has_access,
            missions=missions,
            attempts=[
                ExamAttemptSummary(
                    id=a.uuid,
                    startedAt=a.started_at,
                    submittedAt=a.submitted_at,
                    score=a.score,
                    total=a.total,
                    passed=a.passed,
                    timedOut=a.timed_out,
                    extendedTime=a.extended_time,
                    inProgress=a.submitted_at is None,
                )
                for a in attempts
            ],
            inProgressId=in_progress.uuid if in_progress else None,
            bestScore=max(scores) if scores else None,
            passed=passed,
            certificate=self.certificate_read(cert) if cert else None,
            certificateEligible=cert is None and passed and not missions.missing,
        )

    # ----------------------------------------------------------------- start
    def start(self, user: User, course_key: str, extended_time: bool) -> tuple[ExamAttemptRead, bool]:
        """Devuelve (intento, creado). Si hay uno en curso, lo reanuda."""
        config = self.config_or_404(course_key)
        if not AcademyService(self.db).get_access(course_key, user).hasAccess:
            raise ExamForbidden("El simulacro está incluido en el curso completo")
        self._close_expired(user.id, course_key)
        current = next((a for a in self._attempts(user.id, course_key) if a.submitted_at is None), None)
        if current is not None:
            return self._read(current, config), False

        seen: Counter[str] = Counter()
        for previous in self._attempts(user.id, course_key):
            seen.update(item["id"] for item in previous.questions_json or [])
        now = _now()
        minutes = config.extended_minutes if extended_time else config.minutes
        attempt = AcademyExamAttempt(
            user_id=user.id,
            course_key=course_key,
            bank_version=BANK_VERSION,
            extended_time=extended_time,
            started_at=now,
            deadline_at=now + timedelta(minutes=minutes),
            questions_json=draw_questions(config, seen, self.rng),
            answers_json={},
            total=config.total,
            pass_mark=config.pass_mark,
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return self._read(attempt, config), True

    # ------------------------------------------------------------ read/save
    def get(self, user: User, course_key: str, attempt_id: UUID) -> ExamAttemptRead:
        config = self.config_or_404(course_key)
        attempt = self._attempt(user, course_key, attempt_id)
        if self._expired(attempt, _now()):
            self._finalize(attempt, config, user, timed_out=True)
        return self._read(attempt, config)

    def save_answers(self, user: User, course_key: str, attempt_id: UUID, answers: dict[str, int | None]) -> ExamAttemptRead:
        config = self.config_or_404(course_key)
        attempt = self._attempt(user, course_key, attempt_id)
        if attempt.submitted_at is not None:
            raise ExamConflict("Este intento ya está entregado")
        if self._expired(attempt, _now()):
            self._finalize(attempt, config, user, timed_out=True)
            return self._read(attempt, config)
        self._merge_answers(attempt, answers)
        self.db.commit()
        self.db.refresh(attempt)
        return self._read(attempt, config)

    def submit(self, user: User, course_key: str, attempt_id: UUID, answers: dict[str, int | None]) -> ExamAttemptRead:
        config = self.config_or_404(course_key)
        attempt = self._attempt(user, course_key, attempt_id)
        if attempt.submitted_at is not None:
            return self._read(attempt, config)
        expired = self._expired(attempt, _now())
        if not expired:
            self._merge_answers(attempt, answers)
        self._finalize(attempt, config, user, timed_out=expired)
        return self._read(attempt, config)

    def _merge_answers(self, attempt: AcademyExamAttempt, answers: dict[str, int | None]) -> None:
        valid = {item["id"]: len(item["order"]) for item in attempt.questions_json or []}
        merged = dict(attempt.answers_json or {})
        for qid, choice in answers.items():
            if qid not in valid:
                raise ValueError(f"La pregunta {qid} no pertenece a este intento")
            if choice is None:
                merged.pop(qid, None)
            elif not 0 <= choice < valid[qid]:
                raise ValueError(f"Opción no válida para {qid}")
            else:
                merged[qid] = choice
        attempt.answers_json = merged

    def _close_expired(self, user_id: int, course_key: str) -> None:
        config = get_exam(course_key)
        if config is None:
            return
        now = _now()
        for attempt in self._attempts(user_id, course_key):
            if self._expired(attempt, now):
                user = self.db.get(User, user_id)
                if user is not None:
                    self._finalize(attempt, config, user, timed_out=True)

    # --------------------------------------------------------------- grading
    @staticmethod
    def _grade(attempt: AcademyExamAttempt) -> int:
        answers = attempt.answers_json or {}
        score = 0
        for item in attempt.questions_json or []:
            if item["id"] in BY_ID and answers.get(item["id"]) is not None:
                if item["order"][answers[item["id"]]] == 0:
                    score += 1
        return score

    def _finalize(self, attempt: AcademyExamAttempt, config: ExamConfig, user: User, *, timed_out: bool) -> None:
        now = _now()
        attempt.submitted_at = min(now, _aware(attempt.deadline_at) + GRACE) if timed_out else now
        attempt.timed_out = timed_out
        attempt.score = self._grade(attempt)
        attempt.passed = attempt.score >= attempt.pass_mark
        self.db.commit()
        self.db.refresh(attempt)
        if attempt.passed:
            self._issue_if_eligible(user, config, attempt)

    # ------------------------------------------------------------ certificate
    def _issue_if_eligible(self, user: User, config: ExamConfig, attempt: AcademyExamAttempt) -> AcademyCertificate | None:
        existing = self._certificate(user.id, config.course_key)
        if existing is not None:
            return existing
        if self._missions(user.id, config).missing:
            return None
        for _ in range(5):
            cert = AcademyCertificate(
                user_id=user.id,
                course_key=config.course_key,
                code=f"ASE-{config.certificate_prefix}-{secrets.token_hex(2).upper()}-{secrets.token_hex(2).upper()}",
                holder_name=holder_name(user),
                score=attempt.score or 0,
                total=attempt.total,
                attempt_id=attempt.id,
                issued_at=_now(),
            )
            self.db.add(cert)
            try:
                self.db.commit()
            except IntegrityError:
                self.db.rollback()
                existing = self._certificate(user.id, config.course_key)
                if existing is not None:
                    return existing
                continue
            self.db.refresh(cert)
            self.issued = cert
            return cert
        raise RuntimeError("No se pudo generar un código de certificado único")

    def claim_certificate(self, user: User, course_key: str) -> CertificateRead:
        config = self.config_or_404(course_key)
        existing = self._certificate(user.id, course_key)
        if existing is not None:
            return self.certificate_read(existing)
        best = next(
            iter(
                sorted(
                    (a for a in self._attempts(user.id, course_key) if a.passed),
                    key=lambda a: (a.score or 0),
                    reverse=True,
                )
            ),
            None,
        )
        if best is None:
            raise ExamConflict("Necesitas aprobar el simulacro")
        missing = self._missions(user.id, config).missing
        if missing:
            raise ExamConflict(f"Te faltan {len(missing)} misiones por terminar")
        cert = self._issue_if_eligible(user, config, best)
        assert cert is not None
        return self.certificate_read(cert)

    def find_certificate(self, code: str) -> AcademyCertificate:
        cert = self.db.execute(
            select(AcademyCertificate).where(AcademyCertificate.code == code.strip().upper())
        ).scalar_one_or_none()
        if cert is None:
            raise ExamNotFound("Certificado no encontrado")
        return cert

    def verify(self, code: str) -> CertificateRead:
        return self.certificate_read(self.find_certificate(code))

    # ------------------------------------------------------------------ read
    def _read(self, attempt: AcademyExamAttempt, config: ExamConfig) -> ExamAttemptRead:
        submitted = attempt.submitted_at is not None
        answers = attempt.answers_json or {}
        questions: list[ExamQuestionRead] = []
        chapter_totals: dict[int, list[int]] = {}
        section_totals: dict[str, list[int]] = {}
        for number, item in enumerate(attempt.questions_json or [], start=1):
            bank = BY_ID.get(item["id"])
            if bank is None:  # pregunta retirada del banco: cuenta como no acertada
                continue
            english = EN.get(bank.id) if self.lang == "en" else None
            source = english or bank
            order: list[int] = item["order"]
            selected = answers.get(item["id"])
            correct_pos = order.index(0)
            is_correct = selected is not None and selected == correct_pos
            questions.append(
                ExamQuestionRead(
                    id=bank.id,
                    number=number,
                    chapter=bank.chapter,
                    section=bank.section,
                    sectionTitle=self._section_title(bank.section),
                    k=bank.k,
                    text=source.text,
                    code=source.code,
                    options=[source.options[i] for i in order],
                    selected=selected,
                    correct=correct_pos if submitted else None,
                    isCorrect=is_correct if submitted else None,
                    explanation=source.explanation if submitted else None,
                )
            )
            for bucket, key in ((chapter_totals, bank.chapter), (section_totals, bank.section)):
                line = bucket.setdefault(key, [0, 0])  # type: ignore[arg-type]
                line[0] += int(is_correct)
                line[1] += 1

        result: ExamResultRead | None = None
        if submitted:
            cert = self._certificate(attempt.user_id, attempt.course_key)
            missing = self._missions(attempt.user_id, config).missing
            score = attempt.score or 0
            result = ExamResultRead(
                score=score,
                total=attempt.total,
                percent=round(100 * score / attempt.total) if attempt.total else 0,
                passMark=attempt.pass_mark,
                passed=bool(attempt.passed),
                timedOut=attempt.timed_out,
                chapters=[
                    ExamScoreLine(key=str(c), title=self._chapter_title(c), correct=v[0], total=v[1])
                    for c, v in sorted(chapter_totals.items())
                ],
                # Primero las secciones con peor porcentaje: son las que hay que repasar.
                sections=sorted(
                    (
                        ExamScoreLine(key=s, title=self._section_title(s), correct=v[0], total=v[1])
                        for s, v in section_totals.items()
                    ),
                    key=lambda line: (line.correct / line.total, line.key),
                ),
                certificate=self.certificate_read(cert) if cert else None,
                certificateEligible=cert is None and bool(attempt.passed) and not missing,
                missingMissions=missing,
            )
        return ExamAttemptRead(
            id=attempt.uuid,
            courseKey=attempt.course_key,
            title=config.title_for(self.lang),
            status="submitted" if submitted else "in_progress",
            startedAt=attempt.started_at,
            deadlineAt=attempt.deadline_at,
            submittedAt=attempt.submitted_at,
            serverNow=_now(),
            extendedTime=attempt.extended_time,
            total=attempt.total,
            passMark=attempt.pass_mark,
            questions=questions,
            result=result,
        )
