# Simulacro de examen y certificado (ASE Academy)

> Backend: `backend/app/modules/academy/exam_*` (banco en `exam_bank/`, cursos en `exam_config.py`)
> Modelos: `backend/app/models/academy_exam.py` · Migración: `a7d3e9f1c5b2_add_academy_exams_and_certificates`
> Frontend: `frontend/src/features/academy/exam/` y `pages/AcademyExamPage.tsx`, `pages/AcademyCertificatePage.tsx`
> Rutas: `/academy/:courseKey/simulacro` y `/academy/certificado/:code` (pública, imprimible)

## Exámenes

| Curso | Examen | Preguntas | Tiempo (ampliado) | Aprobado | Reparto por capítulo | Simulacros sin repetir |
|---|---|---|---|---|---|---|
| `qa-profesional` | Simulacro CTFL v4.0 | 40 | 60 min (75) | 26 (65 %) | 1→8 · 2→6 · 3→4 · 4→11 · 5→9 · 6→2 | 6 |
| `testing-fundamentals` | Evaluación final | 20 | 30 min (38) | 13 (65 %) | 1→5 · 2→2 · 3→2 · 4→7 · 5→4 (solo 1.1–1.3, 2.2, 3.1, 4.1–4.2, 5.2, 5.5) | 4 |

El formato del curso 2 es el del examen real CTFL v4.0. El tiempo ampliado (+25 %) es para quien no hace el examen en su lengua materna, como en el examen oficial.

## Banco de preguntas

- **250 preguntas originales** en español **y en inglés**, escritas para ASE Academy (nunca copiadas de exámenes oficiales): capítulo 1 → 50, 2 → 38, 3 → 25, 4 → 69, 5 → 56, 6 → 12 (proporcional al reparto del examen).
- Español en `chN.py`; inglés en `chN_en.py` con el mismo id y el mismo orden de opciones (la correcta primero). `validate_bank()` exige que toda pregunta tenga su versión en inglés.
- El idioma se elige al leer (`?lang=es|en`): un mismo intento se puede ver en los dos idiomas con las mismas preguntas y el mismo orden de opciones.
- Cada pregunta lleva sección del temario, nivel K (K1 recordar, K2 entender, K3 aplicar), 4 opciones, explicación y, si hace falta, pseudocódigo.
- **Convención:** en el banco la opción correcta va siempre la primera. El servidor baraja las opciones en cada intento y guarda la permutación.
- Revisado contra el temario CTFL v4.0 en los dos idiomas (respuestas, distractores, secciones, cálculos y terminología oficial en inglés).
- Al cambiar el banco, sube `BANK_VERSION` en `exam_bank/__init__.py`. No borres preguntas usadas: los intentos antiguos guardan sus ids.
- Ampliarlo: añade preguntas a `chN.py` con el id `cN-NN`; `tests/test_academy_exam_bank.py` valida la coherencia y cuántos simulacros distintos se pueden generar.

## Reglas

- **Acceso:** el mismo que el curso completo (`hasAccess`: comprado, incluido en el plan, gratuito publicado o super admin). Sin sesión se ve el formato.
- **Generación:** reparto por capítulo del examen; dentro de cada capítulo, primero las preguntas que el usuario ha visto menos veces y, a igualdad, al azar. Los tres primeros simulacros del curso 2 no repiten ninguna pregunta.
- **Un intento en curso** por usuario y curso: empezar otro reanuda el que hay.
- **Tiempo en el servidor:** fecha límite guardada en el intento, con 30 s de margen. Pasado el límite, cualquier acceso corrige el intento con las respuestas guardadas (`timedOut`).
- **Autoguardado:** cada respuesta se guarda a los 0,7 s y al cambiar de pestaña. Las marcas «para revisar» viven en el navegador.
- **Seguridad:** la respuesta correcta y la explicación solo viajan después de entregar. Límite de 20 intentos por hora.
- **Resultado:** nota, aprobado, desglose por capítulo, secciones por debajo del 65 % con enlace a la misión donde se repasan (`exam/studyMap.ts`) y revisión pregunta a pregunta.

## Certificado de finalización ASE

- Requisitos: simulacro aprobado y **todas las misiones del curso terminadas** (filas de `academy_runs` con `finished`).
- Se emite solo al entregar si ya se cumplen; si se aprueba antes de acabar las misiones, se pide luego desde el resumen (`POST /academy/certificates/{curso}`).
- Uno por usuario y curso, con código `ASE-QAP-XXXX-XXXX` (curso 2) o `ASE-TFU-XXXX-XXXX` (curso 1), verificable públicamente en `/academy/certificado/{código}`. Imprimible o guardable en PDF desde el navegador (A4 apaisado).
- Nombre del titular: nombre y apellidos del perfil; si no hay, el nombre visible.
- **Derecho al olvido:** al anonimizar una cuenta se borran sus certificados (`app/core/user_anonymize.py`).
- **PDF generado en el servidor** (`certificate_pdf.py`, fpdf2 y fuentes DejaVu incluidas en `app/assets/fonts`, que cubren nombres con cualquier letra latina): `GET /api/v1/academy/certificates/verify/{código}/pdf?lang=es|en`. La página pública enlaza «Descargar PDF».
- **Aviso por email** al emitirse (al entregar, al reclamarlo o al cerrarse un intento caducado): correo en el idioma de la interfaz con el enlace verificable y el PDF adjunto (`certificate_notify.py`, plantilla `academy_certificate_email`). Se envía en segundo plano y nunca bloquea la emisión; usa el SMTP ya configurado y `FRONTEND_URL` para los enlaces.
- No es una certificación oficial de ISTQB®; así se indica en el resumen, el resultado, el certificado, el PDF y el email.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/academy/exams/{curso}` | Formato, acceso, misiones pendientes, intentos, mejor nota y certificado |
| POST | `/api/v1/academy/exams/{curso}/attempts` | Empieza (201) o reanuda (200) un intento; `{extendedTime}` |
| GET | `/api/v1/academy/exams/{curso}/attempts/{id}` | Intento (corrige si caducó) |
| PUT | `/api/v1/academy/exams/{curso}/attempts/{id}/answers` | Autoguardado `{answers: {id: índice o null}}` |
| POST | `/api/v1/academy/exams/{curso}/attempts/{id}/submit` | Entrega y corrige |
| POST | `/api/v1/academy/certificates/{curso}` | Emite el certificado si se cumplen los requisitos (409 si no) |
| GET | `/api/v1/academy/certificates/verify/{código}` | Verificación pública |
| GET | `/api/v1/academy/certificates/verify/{código}/pdf` | PDF público del certificado |

Todas aceptan `?lang=es|en` (por defecto, español).

## Verificación

- Backend: `tests/test_academy_exam_bank.py` (coherencia del banco, reparto, no repetición, filtro del curso 1 y que las misiones exigidas coinciden con los `course.ts` del frontend) y `tests/test_academy_exam.py` (acceso, flujo completo, corrección en servidor, tiempo agotado, certificado, verificación y borrado al anonimizar).
- Frontend: `exam/ExamRunner.test.tsx` (autoguardado, entrega con confirmación, entrega automática al acabar el tiempo) y `exam/studyMap.test.ts`.
- Recorrido manual con backend y base de datos reales: resumen, examen (escritorio y móvil), resultado, revisión y certificado.
