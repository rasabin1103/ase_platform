from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ExamChapterQuota(BaseModel):
    chapter: int
    title: str
    count: int


class ExamConfigRead(BaseModel):
    title: str
    courseTitle: str
    total: int
    minutes: int
    extendedMinutes: int
    passMark: int
    distribution: list[ExamChapterQuota]
    bankSize: int
    # Simulacros completos que se pueden generar sin repetir ninguna pregunta.
    distinctExams: int


class ExamMissionsStatus(BaseModel):
    total: int
    finished: int
    missing: list[str]


class CertificateRead(BaseModel):
    code: str
    courseKey: str
    courseTitle: str
    holderName: str
    score: int
    total: int
    issuedAt: datetime


class ExamAttemptSummary(BaseModel):
    id: UUID
    startedAt: datetime
    submittedAt: datetime | None
    score: int | None
    total: int
    passed: bool | None
    timedOut: bool
    extendedTime: bool
    inProgress: bool


class ExamOverviewRead(BaseModel):
    courseKey: str
    config: ExamConfigRead
    authenticated: bool
    hasAccess: bool
    missions: ExamMissionsStatus
    attempts: list[ExamAttemptSummary]
    inProgressId: UUID | None = None
    bestScore: int | None = None
    passed: bool = False
    certificate: CertificateRead | None = None
    certificateEligible: bool = False


class ExamQuestionRead(BaseModel):
    id: str
    number: int
    chapter: int
    section: str
    sectionTitle: str
    k: int
    text: str
    code: str | None = None
    options: list[str]
    selected: int | None = None
    # Solo tras entregar el examen:
    correct: int | None = None
    isCorrect: bool | None = None
    explanation: str | None = None


class ExamScoreLine(BaseModel):
    key: str  # "4" (capítulo) o "4.2" (sección)
    title: str
    correct: int
    total: int


class ExamResultRead(BaseModel):
    score: int
    total: int
    percent: int
    passMark: int
    passed: bool
    timedOut: bool
    chapters: list[ExamScoreLine]
    sections: list[ExamScoreLine]
    certificate: CertificateRead | None = None
    certificateEligible: bool = False
    missingMissions: list[str] = Field(default_factory=list)


class ExamAttemptRead(BaseModel):
    id: UUID
    courseKey: str
    title: str
    status: Literal["in_progress", "submitted"]
    startedAt: datetime
    deadlineAt: datetime
    submittedAt: datetime | None
    serverNow: datetime
    extendedTime: bool
    total: int
    passMark: int
    questions: list[ExamQuestionRead]
    result: ExamResultRead | None = None


class ExamStartRequest(BaseModel):
    extendedTime: bool = False


class ExamAnswersWrite(BaseModel):
    # {id de pregunta: índice de la opción mostrada (0-3) o null}
    answers: dict[str, int | None] = Field(default_factory=dict, max_length=100)
