# Curso 7 · SQL avanzado: PostgreSQL a fondo

> Nivel: Avanzado · Simulador práctico · 10 misiones + evaluación final (examen práctico y test)
> Clave del curso: `sql-avanzado` · Mundo: Kobalto, tercer mes en el equipo de datos
> Tercer curso de la **ruta SQL** (serie): Iniciación (gratis con registro) → Intermedio → **Avanzado** → SQL para QA
> Español e inglés desde el principio (overlay `en/`, como los demás cursos).

Mismo formato que «SQL intermedio» (`docs/academy/sql-intermedio/PLAN.md`): PostgreSQL real en el navegador (consola SQL), encargos que se comprueban por su resultado o por el estado de la base de datos, dos reuniones con decisiones por misión, lecciones, test antes y después, consecuencias y debrief.

## 1. Acceso

De pago, como el intermedio: la misión 0 es demo abierta sin cuenta; el resto se compra o viene en un plan. En el catálogo: serie «Ruta SQL», orden 3.

## 2. Posicionamiento

| | SQL intermedio | SQL avanzado |
|---|---|---|
| Pregunta típica | «¿Qué clientes gastan más que la media de su ciudad?» | «¿Quién depende de quién?, ¿por qué esta consulta tarda?, ¿cómo impido que esto vuelva a pasar en los datos?» |
| Consultas | Subconsultas, CTE, ventanas, vistas | Recursivas, marcos de ventana, JSON, DML seguro, restricciones, funciones, triggers, índices |
| Entorno | Réplica de solo lectura (vistas en pruebas) | Réplica (m00–m04) y entorno de pruebas modificable (m05–m09 y examen) |
| Rol del jugador | QA al que el negocio pide informes | QA de datos de referencia: diseña reglas, automatiza controles y revisa rendimiento |

## 3. Historia y personajes

Tercer mes en Kobalto. Inés (ahora Responsable de Datos) sigue de mentora. Marta (Producto), Carmen (Riesgos), Nuria (Atención al cliente), Diego (Backend) y Laura (QA Lead) piden cosas que ya no caben en un SELECT sencillo. La propia plantilla de Kobalto aparece en la tabla `empleados`.

## 4. Base de datos: Kobalto avanzada (`frontend/src/features/academy/sql/kobaltoAvanzadaDb.ts`)

Kobalto ampliada (clientes, cuentas, tarjetas, transferencias, incidencias, comercios, pagos con tarjeta) + préstamos y cuotas + tablas nuevas:

| Tabla | Para qué | Notas |
|---|---|---|
| `empleados` (28) | Jerarquías (m00) | `jefe_id` → empleados; 6 niveles (CEO → CTO → Raúl → Laura → Andrés → Víctor) |
| `invitaciones` (23) | Árboles y ciclos (m00) | «Invita a un amigo»; ciclo sembrado 36 ↔ 39 |
| `eventos_app` (1.307) | Rachas (m02), JSON (m04) | ene–feb 2026; `datos jsonb`; rachas sembradas (cliente 7: 21 días, 15: 14 días); 10 logins sin versión; 12 errores E500 con `detalle` anidado |
| `preferencias` (39) | Arrays (m04) | `canales text[]`, `intereses text[]`; el 38 no tiene, el 11, el 22 y el 33 sin intereses (NULL), 5 sin canales (`{}`) |
| `movimientos` (60.000) | Índices y rendimiento (m08–m09) | generados por PostgreSQL; 300 pendientes; dos índices repetidos sobre `fecha` |
| `comercios_import`, `ajustes_limite`, `incidencias_archivo`, `movimientos_nuevos` | DML (m05, m09) | tablas de carga y archivo |

Anomalías para las reglas (m06): una cuota repetida (id 900 = copia de la 9) y el préstamo 23 con un plazo de 18 meses.

Funciones de apoyo para comprobar encargos (esquema `qa`, oculto): `qa.probar` (¿se acepta esta sentencia?), `qa.efecto` (ejecuta, mira y deshace) y `qa.plan` (texto del EXPLAIN).

Protecciones del motor (para todos los cursos): `temp_file_limit = 32MB` corta una recursiva sin fin en un segundo; `max_stack_depth = 256kB` hace que un trigger que se dispara a sí mismo dé error en vez de romper la base de datos.

## 5. Misiones

| # | Misión | SQL | Entorno |
|---|---|---|---|
| 0 | **Quién depende de quién** (demo) | `WITH RECURSIVE`, niveles, rutas, ciclos (`CYCLE`) | Réplica |
| 1 | **Ventanas a fondo** | `FIRST_VALUE`/`LAST_VALUE`/`NTH_VALUE`, marcos `ROWS`/`RANGE`, `CUME_DIST`, `WINDOW` con nombre | Réplica |
| 2 | **Rachas y percentiles** | Huecos e islas, `PERCENTILE_CONT`, `MODE` | Réplica |
| 3 | **Totales y subtotales** | `ROLLUP`, `CUBE`, `GROUPING SETS`, `GROUPING()`, `LATERAL` | Réplica |
| 4 | **JSON y arrays** | `->`, `->>`, `?`, `@>`, `jsonb_build_object`, `ANY`, `unnest`, `string_agg` | Réplica |
| 5 | **Modificar con cabeza** | `UPDATE … FROM`, `MERGE`, `DELETE … USING`, `RETURNING`, CTE que modifican, `ON CONFLICT`, `SAVEPOINT` | Pruebas |
| 6 | **Reglas en la base de datos** | `CHECK`, `UNIQUE`, FK `ON DELETE`, columnas generadas, índices únicos parciales | Pruebas |
| 7 | **Funciones y triggers** | Funciones SQL y PL/pgSQL, `RETURNS TABLE`, triggers `BEFORE`/`AFTER` | Pruebas |
| 8 | **Índices y planes** | `EXPLAIN ANALYZE`, índices simples, compuestos, parciales y de expresión | Pruebas |
| 9 | **Rendimiento** | Paginación por clave, `EXISTS`/`NOT EXISTS` (y `NOT IN` con NULL), vistas materializadas y `REFRESH`, `DISTINCT ON` | Pruebas |
| 10 | **Examen práctico** | 10 encargos (uno por misión), 3 h, sin pistas, aprueba con 70 | Pruebas |

Cada misión: 6 encargos, dos reuniones con Inés sobre una trampa típica, cierre, 7 consecuencias, 7 conceptos y 7 lecciones, y test 6 + 6. Las de pruebas (5–9) comprueban el estado de la base de datos con sondas que se deshacen (`qa.probar`, `qa.efecto`, `qa.plan`).

## 6. Evaluación final y certificado

- Examen práctico `m10-examen`: 10 encargos × 10 puntos, aprueba con 70. Los 5 primeros son consultas (se comparan con los datos de partida) y los 5 últimos cambian la base de datos (archivar incidencias, cuota única, función `total_pagado`, índice compuesto, vista materializada `pagos_por_comercio`).
- Test en servidor: 60 preguntas en 5 bloques (51 · Jerarquías y ventanas, 52 · Rachas, percentiles y subtotales, 53 · JSON y cambios de datos, 54 · Reglas, funciones y triggers, 55 · Índices y rendimiento), 30 por intento (6 por bloque), 40 min (50 ampliado), aprueba con 21. Prefijo de certificado `SQA`. Español e inglés.
- Certificado de finalización de ASE Academy (no es una certificación oficial).
