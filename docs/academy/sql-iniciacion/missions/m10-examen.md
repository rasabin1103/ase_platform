# Misión 10: Examen práctico (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m10-examen.ts` · datos: `frontend/src/features/academy/sql/prestamosDb.ts`
> Ruta: `/academy/sql-iniciacion/m10-examen`
> Tests: `engine/c5m10.test.ts` (100/100 con las respuestas de referencia, 60/100 no aprueba, datos y trampas), `coursePlaythrough.test.ts` y el E2E (`e2e/academy.spec.ts`, que resuelve el examen en la consola del navegador)

## Formato
- Lunes de la semana 3, **3 horas** (09:00–12:00), **sin mentora ni pistas** (las pistas vacías no se muestran). Examinadora: Laura.
- Tablas nuevas que el alumno no ha visto: `prestamos` (25) y `cuotas` (84), junto a las de Kobalto. «Hoy» = 2026-03-01. Anomalía: el préstamo 19 está aprobado sin cuotas.
- Entorno de pruebas modificable, con «Restaurar». Los encargos de consulta se comparan con los **datos de partida** (calculados al abrir la base de datos): borrar datos no hace que un resultado vacío «coincida».
- **10 encargos × 10 puntos**; aprueba con **70**. Solo cuenta como terminado (y para el certificado) si se aprueba (`practicalExam`, `countsAsFinished`).

## Encargos (uno por misión)

| # | Misión | Encargo | Resultado de referencia |
|---|---|---|---|
| 1 | M0 | `id`, `importe AS importe_solicitado`, `plazo_meses AS meses` de todos (columnas exactas) | 25 filas |
| 2 | M1 | Aprobados entre 5.000 y 15.000 € | 5 |
| 3 | M2 | Los 5 de mayor importe, ordenados | 15, 1, 16, 2, 17 |
| 4 | M3 | Solicitados sin aprobar con `tramo` (CASE) | 4 |
| 5 | M4 | `impagadas` e `importe_impagado` de las cuotas vencidas sin pagar (con COUNT y SUM) | 4 · 1.518,90 |
| 6 | M5 | Por estado con más de 3 préstamos: número e importe medio | aprobado, solicitado |
| 7 | M6 | Aprobados con nombre, apellidos y email del cliente (con JOIN) | 15 |
| 8 | M7 | Aprobados sin ninguna cuota | el 19 |
| 9 | M8 | `tipo_interes = 7.50` en los aprobados de más de 20.000 € (verificación de estado de toda la tabla) | 7 préstamos |
| 10 | M9 | Tabla `recordatorios` con PK, FK a cuotas, CHECK de canal y NOT NULL (esquema + sondas) | — |

Las respuestas de referencia están en `M10_SQL_ANSWERS` (las usan el test y el E2E).

## Debrief
Nota sobre 100, APTO / NO APTO y un renglón por encargo (como el examen práctico de Karate). Sin bugs que reportar.
