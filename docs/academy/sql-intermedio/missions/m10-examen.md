# Evaluación final: examen práctico (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m10-examen.ts`
> Base de datos: Kobalto ampliada + `prestamos` y `cuotas` (`sql/prestamosDb.ts`), entorno de pruebas
> Ruta: `/academy/sql-intermedio/m10-examen`
> Tests: `engine/c6m10.test.ts` y el E2E del curso (`e2e/academy.spec.ts`, `M10_SQL_ANSWERS`)

## Formato
Lunes de la semana 3. Tres horas (09:00–12:00), sin mentora ni pistas. Diez encargos, uno por misión, a 10 puntos; aprueba con 70/100 (`practicalExam`). Solo cuenta como terminado, y para el certificado, si se aprueba. «Hoy» = 1/3/2026.

## Encargos

| # | Misión | Encargo | Resultado |
|---|---|---|---|
| 1 | M0 | Préstamos por encima de la media (exige subconsulta) | 13 |
| 2 | M1 | Clientes con más de 20.000 € en préstamos aprobados | 7 |
| 3 | M2 | Solicitudes por mes (`::date`) | 6 meses |
| 4 | M3 | Clientes con préstamo aprobado y ningún pago con tarjeta | 4 |
| 5 | M4 | Aprobados y rechazados por plazo, en columnas | 5 plazos |
| 6 | M5 | El préstamo más grande de cada plazo | 5 |
| 7 | M6 | Cobrado por mes y acumulado (exige ventana) | feb-2026: 8.024,22 · 25.577,25 |
| 8 | M7 | Cuotas pagadas y pendientes de cada préstamo aprobado, también sin cuotas | 15 (el 19 con 0 y 0) |
| 9 | M8 | Primera cuota vencida sin pagar de cada préstamo (DISTINCT ON) | préstamos 4 y 11 |
| 10 | M9 | Vista `resumen_prestamos` (estado, prestamos, importe_total) | `viewChecks` |

`M10_SQL_ANSWERS` resuelve los diez con consultas distintas de las soluciones (HAVING en vez de WITH, NOT EXISTS en vez de EXCEPT, SUM(CASE) en vez de FILTER, DISTINCT ON en vez de ROW_NUMBER…), para comprobar que se corrige el resultado. Trampas comprobadas: media escrita a mano, máximo sin PARTITION BY, JOIN normal en las cuotas, la última cuota en vez de la primera, una tabla en vez de la vista y borrar datos.

## Test final y certificado
- Test en servidor: banco `backend/app/modules/academy/exam_bank/sql_intermedio.py`, 60 preguntas en 5 bloques (41–45, se muestran 1–5), 6 por sección. 30 por intento (6 por bloque), 40 min (50 ampliado), aprobado con 21. Pendiente de inglés (`PENDING_EN_CHAPTERS`).
- `ExamConfig["sql-intermedio"]`: prefijo `SQI`, `chapter_offset=40`, misiones m00–m10 (el examen práctico incluido).
- Certificado de finalización de ASE Academy (no oficial), aviso propio en el PDF y en la ficha (`EXAM_COURSES`).
