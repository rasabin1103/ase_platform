# Evaluación final del curso de Karate

El certificado del curso exige tres cosas: terminar las 10 misiones, **aprobar el examen práctico** (misión `m10-examen`) y **aprobar la evaluación teórica**.

## Examen práctico · `m10-examen`

Código: `frontend/src/features/academy/content/courses/karate-framework/m10-*.ts` y `engine/practicalExam.ts`.

- Lunes, 09:00–13:00 (240 min de jornada). Sin mentor, sin lecciones y sin pistas en los retos (`codeLab.exam`).
- Recurso nuevo de la API: **órdenes periódicas** (`/standing-orders`, opción `standingOrders`): crear, consultar, listar por cuenta y cancelar (DELETE 204 → CANCELLED). Reglas: frecuencia WEEKLY/MONTHLY/QUARTERLY, fecha de inicio ≥ hoy (sandbox fijado en 2026-10-23), importe ≤ 1.000 en cuentas personales, máximo 3 órdenes activas por cuenta, DELETE exige `transfers:write`.
- El framework ya está montado: karate-config.js con `callSingle`, `schemas/error.json`, `common/cuenta-prueba.feature`, runner nocturno. El alumno puede crear ficheros.
- **Nota** (`practicalExam`): 8 retos × 10 + 4 bugs reportados × 5 − 5 por report rechazado. **Aprobado: 70/100.**
- Solo cuenta como terminado (y para el certificado) si se aprueba: `countsAsFinished` decide el `finished` que se guarda. Si no se aprueba, se puede repetir.
- El debrief muestra la nota, los retos y los bugs (sin desvelar los títulos de los no encontrados).

### Retos
contrato (match == contra el contrato completo) · encadenar (crear y consultar) · limites (Outline ≥4 filas con aceptadas y rechazadas) · negativos (≥3 casos 400 sobre ≥2 campos) · cancelar (DELETE y después CANCELLED) · permisos (token accounts:read no cancela, 403) · datos (todas las órdenes desde cuentas de prueba, ≥3 escenarios) · pipeline (nocturno en paralelo con assert, ≥8 escenarios, sin fallos de los tests).

### Bugs
- **KA-FRECUENCIA** (medio): se acepta «monthly» en minúsculas.
- **KA-HOY** (alto): una orden que empieza hoy se rechaza.
- **KA-CANCELAR** (crítico): DELETE 204 pero la orden sigue ACTIVE.
- **KA-SCOPE-DEL** (crítico): un token de solo lectura puede cancelar.

Solución de referencia: `M10_SOLUTION` en `m10-lab.ts` (8/8 retos; 100/100 con los cuatro reports).

## Evaluación teórica

Infraestructura del simulacro (backend `app/modules/academy`), configuración `karate-framework` en `exam_config.py`:

- **30 preguntas, 45 min (56 con tiempo ampliado), aprobado con 20.** 6 preguntas por bloque.
- Banco propio de 60 preguntas en `exam_bank/karate.py` (2 evaluaciones distintas sin repetir). Los bloques se numeran 11–15 en el banco para no mezclarse con el temario CTFL y se muestran como 1–5 (`chapter_offset`).
  1. Fundamentos y match · 2. Configuración, payloads y datos · 3. Reutilización y autenticación · 4. Errores, procesos asíncronos y mocks · 5. Pipeline y framework.
- En español y en inglés: el banco inglés está en `exam_bank/karate_en.py` (mismos ids, la correcta primero) y con `lang=en` se sirven en inglés. El examen práctico tiene su versión inglesa en `content/courses/karate-framework/en/m10-examen.ts`.
- El informe enlaza cada sección floja con su misión (`exam/studyMap.ts`).
- Certificado con prefijo **KAR** (`ASE-KAR-…`). Misiones exigidas: las 10 + `m10-examen`.
