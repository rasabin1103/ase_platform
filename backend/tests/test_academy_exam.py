"""Simulacro de examen: acceso, intentos, corrección en servidor, tiempo
límite y certificado verificable."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.user_anonymize import anonymize_user_pii
from app.models.academy_exam import AcademyCertificate, AcademyExamAttempt
from app.models.academy_run import AcademyRun
from app.models.user import User
from app.modules.academy.exam_bank import BY_ID, SECTION_TITLES_EN
from app.modules.academy.exam_bank.karate_en import EN as KARATE_EN
from app.modules.academy.exam_config import EXAMS

CATALOG_URL = "/api/v1/admin/catalog"
EXAM_URL = "/api/v1/academy/exams/qa-profesional"


def _link_free_course(client: TestClient, headers: dict[str, str]) -> None:
    resp = client.post(
        CATALOG_URL,
        json={
            "title": "QA Profesional (simulador)",
            "slug": "qa-profesional-simulador",
            "type": "course",
            "category": "Testing",
            "short_description": "Curso-juego de QA.",
            "long_description": "Monta el proceso de calidad de un squad.",
            "image_url": "https://images.example.com/cover.jpg",
            "price": 0,
            "currency": "EUR",
            "status": "published",
            "level": "intermediate",
            "author": "ASE",
            "academy_course_key": "qa-profesional",
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text


def _correct_answers(db: Session, attempt_id: str) -> dict[str, int]:
    attempt = db.query(AcademyExamAttempt).filter(AcademyExamAttempt.uuid == attempt_id).one()
    return {item["id"]: item["order"].index(0) for item in attempt.questions_json}


def _finish_missions(db: Session, user: User) -> None:
    for mission_id in EXAMS["qa-profesional"].missions:
        db.add(AcademyRun(user_id=user.id, course_key="qa-profesional", mission_id=mission_id, seed=1, actions_json=[], finished=True))
    db.commit()


def test_overview_is_public_and_start_requires_access(client: TestClient, independent_headers: dict[str, str]):
    body = client.get(EXAM_URL).json()
    assert body["authenticated"] is False
    assert body["config"]["total"] == 40
    assert body["config"]["passMark"] == 26
    assert body["config"]["distinctExams"] >= 3

    resp = client.post(f"{EXAM_URL}/attempts", json={}, headers=independent_headers)
    assert resp.status_code == 403
    assert client.post(f"{EXAM_URL}/attempts", json={}).status_code == 401
    assert client.get("/api/v1/academy/exams/no-existe").status_code == 404


def test_full_flow_with_certificate(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    _link_free_course(client, super_admin_headers)
    started = client.post(f"{EXAM_URL}/attempts", json={"extendedTime": True}, headers=independent_headers)
    assert started.status_code == 201
    attempt = started.json()
    assert attempt["status"] == "in_progress"
    assert len(attempt["questions"]) == 40
    # Las respuestas correctas no viajan antes de entregar.
    assert all(q["correct"] is None and q["explanation"] is None for q in attempt["questions"])
    duration = datetime.fromisoformat(attempt["deadlineAt"]) - datetime.fromisoformat(attempt["startedAt"])
    assert duration == timedelta(minutes=75)

    again = client.post(f"{EXAM_URL}/attempts", json={}, headers=independent_headers)
    assert again.status_code == 200
    assert again.json()["id"] == attempt["id"]

    correct = _correct_answers(db, attempt["id"])
    first_id = attempt["questions"][0]["id"]
    saved = client.put(
        f"{EXAM_URL}/attempts/{attempt['id']}/answers", json={"answers": {first_id: correct[first_id]}}, headers=independent_headers
    )
    assert saved.status_code == 200
    assert saved.json()["questions"][0]["selected"] == correct[first_id]

    bad = client.put(f"{EXAM_URL}/attempts/{attempt['id']}/answers", json={"answers": {"c9-99": 0}}, headers=independent_headers)
    assert bad.status_code == 422
    bad = client.put(f"{EXAM_URL}/attempts/{attempt['id']}/answers", json={"answers": {first_id: 7}}, headers=independent_headers)
    assert bad.status_code == 422

    submitted = client.post(f"{EXAM_URL}/attempts/{attempt['id']}/submit", json={"answers": correct}, headers=independent_headers)
    assert submitted.status_code == 200
    result = submitted.json()
    assert result["status"] == "submitted"
    assert result["result"]["score"] == 40
    assert result["result"]["passed"] is True
    assert {c["key"] for c in result["result"]["chapters"]} == {"1", "2", "3", "4", "5", "6"}
    assert all(q["isCorrect"] and q["explanation"] for q in result["questions"])
    # Aprobado, pero sin las misiones terminadas no hay certificado todavía.
    assert result["result"]["certificate"] is None
    assert len(result["result"]["missingMissions"]) == 9

    assert client.post(f"{EXAM_URL}/attempts/{attempt['id']}/answers", json={"answers": {}}, headers=independent_headers).status_code == 405
    locked = client.put(f"{EXAM_URL}/attempts/{attempt['id']}/answers", json={"answers": {}}, headers=independent_headers)
    assert locked.status_code == 409

    assert client.post("/api/v1/academy/certificates/qa-profesional", headers=independent_headers).status_code == 409
    _finish_missions(db, independent_user)
    overview = client.get(EXAM_URL, headers=independent_headers).json()
    assert overview["passed"] is True
    assert overview["certificateEligible"] is True
    assert overview["bestScore"] == 40

    cert = client.post("/api/v1/academy/certificates/qa-profesional", headers=independent_headers)
    assert cert.status_code == 200
    code = cert.json()["code"]
    assert code.startswith("ASE-QAP-")
    assert client.post("/api/v1/academy/certificates/qa-profesional", headers=independent_headers).json()["code"] == code

    public = client.get(f"/api/v1/academy/certificates/verify/{code.lower()}")
    assert public.status_code == 200
    assert public.json()["holderName"] == "user"
    assert public.json()["score"] == 40
    assert client.get("/api/v1/academy/certificates/verify/ASE-QAP-0000-0000").status_code == 404

    # Derecho al olvido: el certificado (con el nombre) desaparece.
    anonymize_user_pii(db, independent_user)
    db.commit()
    assert db.query(AcademyCertificate).count() == 0


def test_certificate_is_issued_on_submit_when_missions_are_done(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    _link_free_course(client, super_admin_headers)
    _finish_missions(db, independent_user)
    attempt = client.post(f"{EXAM_URL}/attempts", json={}, headers=independent_headers).json()
    result = client.post(
        f"{EXAM_URL}/attempts/{attempt['id']}/submit", json={"answers": _correct_answers(db, attempt["id"])}, headers=independent_headers
    ).json()["result"]
    assert result["certificate"]["code"].startswith("ASE-QAP-")


def test_failing_and_timeout(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_headers: dict[str, str],
):
    _link_free_course(client, super_admin_headers)
    attempt = client.post(f"{EXAM_URL}/attempts", json={}, headers=independent_headers).json()
    failed = client.post(f"{EXAM_URL}/attempts/{attempt['id']}/submit", json={"answers": {}}, headers=independent_headers).json()
    assert failed["result"]["score"] == 0
    assert failed["result"]["passed"] is False
    assert failed["result"]["sections"][0]["correct"] == 0

    # Segundo intento: preguntas distintas del primero.
    second = client.post(f"{EXAM_URL}/attempts", json={}, headers=independent_headers).json()
    assert {q["id"] for q in second["questions"]}.isdisjoint({q["id"] for q in attempt["questions"]})

    row = db.query(AcademyExamAttempt).filter(AcademyExamAttempt.uuid == second["id"]).one()
    row.deadline_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.commit()
    late = client.put(
        f"{EXAM_URL}/attempts/{second['id']}/answers", json={"answers": {second["questions"][0]["id"]: 0}}, headers=independent_headers
    ).json()
    assert late["status"] == "submitted"
    assert late["result"]["timedOut"] is True
    assert late["questions"][0]["selected"] is None

    overview = client.get(EXAM_URL, headers=independent_headers).json()
    assert overview["inProgressId"] is None
    assert len(overview["attempts"]) == 2
    assert overview["passed"] is False


def test_english_exam_pdf_and_email(
    client: TestClient,
    db: Session,
    monkeypatch,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    sent: list[dict] = []

    def fake_send_email(**kwargs):
        sent.append(kwargs)
        return True

    monkeypatch.setattr("app.modules.academy.certificate_notify.send_email", fake_send_email)
    _link_free_course(client, super_admin_headers)
    _finish_missions(db, independent_user)

    overview = client.get(f"{EXAM_URL}?lang=en", headers=independent_headers).json()
    assert overview["config"]["title"] == "CTFL v4.0 mock exam"
    assert overview["config"]["distribution"][0]["title"] == "Fundamentals of testing"

    attempt = client.post(f"{EXAM_URL}/attempts?lang=en", json={}, headers=independent_headers).json()
    from app.modules.academy.exam_bank import BY_ID, EN

    first = attempt["questions"][0]
    assert first["text"] == EN[first["id"]].text
    assert sorted(first["options"]) == sorted(EN[first["id"]].options)
    # El mismo intento se puede leer en español: mismas preguntas y mismo orden de opciones.
    spanish = client.get(f"{EXAM_URL}/attempts/{attempt['id']}?lang=es", headers=independent_headers).json()
    es_first = spanish["questions"][0]
    assert es_first["text"] == BY_ID[first["id"]].text
    for es_opt, en_opt in zip(es_first["options"], first["options"]):
        assert BY_ID[first["id"]].options.index(es_opt) == EN[first["id"]].options.index(en_opt)

    result = client.post(
        f"{EXAM_URL}/attempts/{attempt['id']}/submit?lang=en",
        json={"answers": _correct_answers(db, attempt["id"])},
        headers=independent_headers,
    ).json()["result"]
    code = result["certificate"]["code"]
    assert result["certificate"]["courseTitle"] == "Professional QA: from testing to team quality"
    assert result["chapters"][0]["title"] == "Fundamentals of testing"

    # Aviso por email con el PDF adjunto (una sola vez).
    assert len(sent) == 1
    assert sent[0]["to_email"] == "user@example.com"
    assert "certificate" in sent[0]["subject"].lower()
    filename, pdf_bytes, mimetype = sent[0]["attachments"][0]
    assert filename == f"{code}.pdf" and mimetype == "application/pdf" and pdf_bytes.startswith(b"%PDF")
    assert f"/academy/certificado/{code}" in sent[0]["html_body"]
    client.post("/api/v1/academy/certificates/qa-profesional?lang=en", headers=independent_headers)
    assert len(sent) == 1

    pdf = client.get(f"/api/v1/academy/certificates/verify/{code}/pdf?lang=en")
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF")
    assert client.get("/api/v1/academy/certificates/verify/ASE-QAP-0000-0000/pdf").status_code == 404
    assert client.get(f"/api/v1/academy/certificates/verify/{code}?lang=xx").status_code == 422


def test_send_email_with_attachment_builds_mixed_message(monkeypatch):
    from app.core import email as email_module

    captured: dict = {}

    class FakeSMTP:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def starttls(self):
            pass

        def login(self, *args):
            pass

        def sendmail(self, sender, to, raw):
            captured["raw"] = raw

    monkeypatch.setattr(email_module.settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(email_module, "_IPv4OnlySMTP", FakeSMTP)
    ok = email_module.send_email(
        to_email="a@example.com", subject="s", html_body="<p>x</p>", attachments=[("c.pdf", b"%PDF-1.4", "application/pdf")]
    )
    assert ok is True
    assert "multipart/mixed" in captured["raw"]
    assert 'filename="c.pdf"' in captured["raw"]


KARATE_EXAM_URL = "/api/v1/academy/exams/karate-framework"


def _publish_karate_course(client: TestClient, super_admin_headers: dict[str, str]) -> None:
    resp = client.post(
        CATALOG_URL,
        json={
            "title": "Karate (simulador)",
            "slug": "karate-simulador",
            "type": "course",
            "category": "Testing",
            "short_description": "Curso de Karate.",
            "long_description": "Automatización de APIs con Karate.",
            "image_url": "https://images.example.com/cover.jpg",
            "price": 0,
            "currency": "EUR",
            "status": "published",
            "level": "intermediate",
            "author": "ASE",
            "academy_course_key": "karate-framework",
        },
        headers=super_admin_headers,
    )
    assert resp.status_code == 201, resp.text


def test_karate_exam_blocks_labels_and_practical_requirement(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    url = KARATE_EXAM_URL
    _publish_karate_course(client, super_admin_headers)
    overview = client.get(url).json()
    assert overview["config"]["total"] == 30
    assert [c["chapter"] for c in overview["config"]["distribution"]] == [1, 2, 3, 4, 5]

    attempt = client.post(f"{url}/attempts", json={}, headers=independent_headers).json()
    assert len(attempt["questions"]) == 30
    assert {q["chapter"] for q in attempt["questions"]} == {1, 2, 3, 4, 5}
    assert all(q["section"].split(".")[0] in {"1", "2", "3", "4", "5"} for q in attempt["questions"])
    # El mismo intento leído en inglés: mismas preguntas, texto traducido.
    english = client.get(f"{url}/attempts/{attempt['id']}?lang=en", headers=independent_headers).json()
    assert [q["id"] for q in english["questions"]] == [q["id"] for q in attempt["questions"]]
    assert english["questions"][0]["text"] == KARATE_EN[attempt["questions"][0]["id"]].text

    # Todas las misiones menos el examen práctico: aprobado, pero sin certificado.
    for mission_id in EXAMS["karate-framework"].missions[:-1]:
        db.add(AcademyRun(user_id=independent_user.id, course_key="karate-framework", mission_id=mission_id, seed=1, actions_json=[], finished=True))
    db.commit()
    result = client.post(
        f"{url}/attempts/{attempt['id']}/submit", json={"answers": _correct_answers(db, attempt["id"])}, headers=independent_headers
    ).json()["result"]
    assert result["passed"] is True
    assert {c["key"] for c in result["chapters"]} == {"1", "2", "3", "4", "5"}
    assert result["missingMissions"] == ["m10-examen"]
    assert result["certificate"] is None

    db.add(AcademyRun(user_id=independent_user.id, course_key="karate-framework", mission_id="m10-examen", seed=1, actions_json=[], finished=True))
    db.commit()
    cert = client.post("/api/v1/academy/certificates/karate-framework", headers=independent_headers)
    assert cert.status_code == 200
    assert cert.json()["code"].startswith("ASE-KAR-")


def test_karate_exam_in_english(
    client: TestClient,
    super_admin_headers: dict[str, str],
    independent_headers: dict[str, str],
):
    _publish_karate_course(client, super_admin_headers)
    overview = client.get(f"{KARATE_EXAM_URL}?lang=en").json()
    assert overview["config"]["title"] == "Karate final theory assessment"
    assert overview["config"]["distribution"][0]["title"] == "Fundamentals and match"

    attempt = client.post(f"{KARATE_EXAM_URL}/attempts?lang=en", json={}, headers=independent_headers).json()
    assert len(attempt["questions"]) == 30
    for question in attempt["questions"]:
        english = KARATE_EN[question["id"]]
        assert question["text"] == english.text
        assert sorted(question["options"]) == sorted(english.options)
        assert question["text"] != BY_ID[question["id"]].text
        assert question["sectionTitle"] in SECTION_TITLES_EN.values()
    # Un texto concreto del banco, para que la traducción no cambie sin querer.
    assert KARATE_EN["c11-02"].text == "When does the Background of a feature run?"


GESTION_EXAM_URL = "/api/v1/academy/exams/gestion-equipos-qa"


def test_gestion_exam_roles_report_and_certificate(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    resp = client.post(
        CATALOG_URL,
        json={
            "title": "Gestión de equipos QA (simulador)",
            "slug": "gestion-equipos-qa-simulador",
            "type": "course",
            "category": "Testing",
            "short_description": "Curso de gestión de equipos de QA.",
            "long_description": "De QA manual a Head of QA.",
            "image_url": "https://images.example.com/cover.jpg",
            "price": 0,
            "currency": "EUR",
            "status": "published",
            "level": "advanced",
            "author": "ASE",
            "academy_course_key": "gestion-equipos-qa",
        },
        headers=super_admin_headers,
    )
    assert resp.status_code == 201, resp.text
    overview = client.get(GESTION_EXAM_URL).json()
    assert overview["config"]["total"] == 30
    assert overview["config"]["passMark"] == 21
    assert [c["title"] for c in overview["config"]["distribution"]] == ["QA manual", "QA Engineer", "QA Architect", "QA Lead", "QA Manager", "Head of QA"]

    attempt = client.post(f"{GESTION_EXAM_URL}/attempts", json={}, headers=independent_headers).json()
    assert len(attempt["questions"]) == 30
    assert {q["chapter"] for q in attempt["questions"]} == {1, 2, 3, 4, 5, 6}

    # Once misiones de doce: aprobado, pero sin certificado hasta terminar la última.
    for mission_id in EXAMS["gestion-equipos-qa"].missions[:-1]:
        db.add(AcademyRun(user_id=independent_user.id, course_key="gestion-equipos-qa", mission_id=mission_id, seed=1, actions_json=[], finished=True))
    db.commit()
    result = client.post(
        f"{GESTION_EXAM_URL}/attempts/{attempt['id']}/submit", json={"answers": _correct_answers(db, attempt["id"])}, headers=independent_headers
    ).json()["result"]
    assert result["passed"] is True
    assert {c["key"] for c in result["chapters"]} == {"1", "2", "3", "4", "5", "6"}
    assert result["missingMissions"] == ["m11-estrategia"]

    db.add(AcademyRun(user_id=independent_user.id, course_key="gestion-equipos-qa", mission_id="m11-estrategia", seed=1, actions_json=[], finished=True))
    db.commit()
    cert = client.post("/api/v1/academy/certificates/gestion-equipos-qa", headers=independent_headers)
    assert cert.status_code == 200
    assert cert.json()["code"].startswith("ASE-GEQ-")


SQL_EXAM_URL = "/api/v1/academy/exams/sql-iniciacion"


def test_sql_exam_blocks_practical_exam_and_certificate(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    resp = client.post(
        CATALOG_URL,
        json={
            "title": "SQL desde cero (simulador)",
            "slug": "sql-desde-cero-simulador",
            "type": "course",
            "category": "Datos",
            "short_description": "Curso de SQL.",
            "long_description": "SQL con PostgreSQL real.",
            "image_url": "https://images.example.com/cover.jpg",
            "price": 0,
            "currency": "EUR",
            "status": "published",
            "level": "beginner",
            "author": "ASE",
            "academy_course_key": "sql-iniciacion",
        },
        headers=super_admin_headers,
    )
    assert resp.status_code == 201, resp.text
    overview = client.get(SQL_EXAM_URL).json()
    assert (overview["config"]["total"], overview["config"]["passMark"]) == (30, 21)
    assert [c["title"] for c in overview["config"]["distribution"]] == [
        "Consultar y filtrar",
        "Ordenar y los huecos",
        "Contar y agrupar",
        "Unir tablas",
        "Modificar y crear tablas",
    ]

    attempt = client.post(f"{SQL_EXAM_URL}/attempts", json={}, headers=independent_headers).json()
    assert len(attempt["questions"]) == 30
    assert {q["chapter"] for q in attempt["questions"]} == {1, 2, 3, 4, 5}
    # Las preguntas con consulta llevan su código.
    assert any(q.get("code") for q in attempt["questions"])

    # Todas las misiones menos el examen práctico: test aprobado, pero sin certificado.
    for mission_id in EXAMS["sql-iniciacion"].missions[:-1]:
        db.add(AcademyRun(user_id=independent_user.id, course_key="sql-iniciacion", mission_id=mission_id, seed=1, actions_json=[], finished=True))
    db.commit()
    result = client.post(
        f"{SQL_EXAM_URL}/attempts/{attempt['id']}/submit", json={"answers": _correct_answers(db, attempt["id"])}, headers=independent_headers
    ).json()["result"]
    assert result["passed"] is True
    assert {c["key"] for c in result["chapters"]} == {"1", "2", "3", "4", "5"}
    assert result["missingMissions"] == ["m10-examen"]

    db.add(AcademyRun(user_id=independent_user.id, course_key="sql-iniciacion", mission_id="m10-examen", seed=1, actions_json=[], finished=True))
    db.commit()
    cert = client.post("/api/v1/academy/certificates/sql-iniciacion", headers=independent_headers)
    assert cert.status_code == 200
    assert cert.json()["code"].startswith("ASE-SQL-")



SQI_EXAM_URL = "/api/v1/academy/exams/sql-intermedio"


def test_sql_intermedio_exam_blocks_practical_exam_and_certificate(
    client: TestClient,
    db: Session,
    super_admin_headers: dict[str, str],
    independent_user: User,
    independent_headers: dict[str, str],
):
    resp = client.post(
        CATALOG_URL,
        json={
            "title": "SQL intermedio",
            "slug": "sql-intermedio",
            "type": "course",
            "category": "Datos",
            "short_description": "Curso de SQL intermedio.",
            "long_description": "Subconsultas, CTE y funciones de ventana con PostgreSQL real.",
            "image_url": "https://images.example.com/cover.jpg",
            "price": 0,
            "currency": "EUR",
            "status": "published",
            "level": "intermediate",
            "author": "ASE",
            "academy_course_key": "sql-intermedio",
        },
        headers=super_admin_headers,
    )
    assert resp.status_code == 201, resp.text
    overview = client.get(SQI_EXAM_URL).json()
    assert (overview["config"]["total"], overview["config"]["passMark"]) == (30, 21)
    assert [c["title"] for c in overview["config"]["distribution"]] == [
        "Subconsultas y CTE",
        "Fechas, textos y conjuntos",
        "Informes y rankings",
        "Tendencias y cruces",
        "Calidad de datos y vistas",
    ]

    attempt = client.post(f"{SQI_EXAM_URL}/attempts", json={}, headers=independent_headers).json()
    assert len(attempt["questions"]) == 30
    assert {q["chapter"] for q in attempt["questions"]} == {1, 2, 3, 4, 5}

    for mission_id in EXAMS["sql-intermedio"].missions[:-1]:
        db.add(AcademyRun(user_id=independent_user.id, course_key="sql-intermedio", mission_id=mission_id, seed=1, actions_json=[], finished=True))
    db.commit()
    result = client.post(
        f"{SQI_EXAM_URL}/attempts/{attempt['id']}/submit", json={"answers": _correct_answers(db, attempt["id"])}, headers=independent_headers
    ).json()["result"]
    assert result["passed"] is True
    assert result["missingMissions"] == ["m10-examen"]

    db.add(AcademyRun(user_id=independent_user.id, course_key="sql-intermedio", mission_id="m10-examen", seed=1, actions_json=[], finished=True))
    db.commit()
    cert = client.post("/api/v1/academy/certificates/sql-intermedio", headers=independent_headers)
    assert cert.status_code == 200
    assert cert.json()["code"].startswith("ASE-SQI-")
