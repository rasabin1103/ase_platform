# Curso 6 · SQL intermedio: consultas que responden preguntas de negocio

> Nivel: Intermedio · Simulador práctico · 10 misiones + evaluación final (examen práctico y test)
> Clave del curso: `sql-intermedio` · Mundo: Kobalto, segundo mes en el equipo de datos
> Segundo curso de la **ruta SQL** (serie): Iniciación (gratis con registro) → **Intermedio** → Avanzado → SQL para QA

Mismo formato que «SQL desde cero» (`docs/academy/sql-iniciacion/PLAN.md`): PostgreSQL real en el navegador (consola SQL), encargos que se comprueban por su resultado, reuniones con decisiones, lecciones, test antes y después, consecuencias y debrief.

## 1. La serie y el modelo comercial

| Curso | Clave | Acceso |
|---|---|---|
| 1 · SQL desde cero | `sql-iniciacion` | **Gratis con registro**: precio 0 en el catálogo. Sin cuenta solo se juega la misión 0; con cuenta, el curso completo, la evaluación y el certificado. |
| 2 · SQL intermedio | `sql-intermedio` | **De pago**: la misión 0 es demo abierta; el resto se compra (o viene incluido en un plan). |
| 3 · SQL avanzado | `sql-avanzado` | De pago, igual. |
| 4 · SQL para QA | `sql-qa` | De pago, igual. |

- Regla de acceso (desde el 28 oct 2026, para todos los cursos): **precio 0 + publicado → gratis para cualquiera con cuenta**; con precio → compra o plan. La primera misión de cada curso es siempre una demo abierta sin cuenta (`backend/app/modules/academy/service.py · get_access`, `AcademyCoursePage`, `AcademyPlayerPage`).
- En la página de cada curso de la serie se muestra la serie completa (panel `CourseSeries`, endpoint `GET /api/v1/academy/courses/{key}/series`): todos los cursos en orden, empezados o no, con su progreso (sin empezar, en curso X/Y misiones, completado), su acceso (gratis con cuenta, tienes acceso, de pago con precio) y el siguiente recomendado.
- En el catálogo, los cuatro cursos van en la misma serie (campos «Serie» = «Ruta SQL» y «Orden en la serie» = 1…4) para que se presenten juntos y en orden. Precios: los decide el admin en la ficha (no se fijan aquí).

## 2. Posicionamiento

| | SQL desde cero | SQL intermedio |
|---|---|---|
| Pregunta típica | «Dame los clientes de Madrid» | «¿Qué clientes gastan más que la media de su ciudad, y cómo evoluciona mes a mes?» |
| Consultas | Una tabla o un JOIN, un paso | Varios pasos: subconsultas, CTE, ventanas, fechas |
| Rol del jugador | QA junior que pide datos | QA con acceso a datos al que el negocio pide informes y validaciones |
| Encargos por misión | 5–6, cortos | 5–6, de varios pasos, con más datos |

## 3. Historia y personajes

Segundo mes en Kobalto. Inés (Data Engineer) sigue de mentora; el equipo ya confía en la jugadora y le llegan preguntas de negocio de verdad: Marta (Producto) quiere métricas, Carmen (Riesgos) controles, Diego (Backend) validaciones tras cada despliegue, Nuria (Atención al cliente) listados de seguimiento y Laura (QA Lead) datos para tests y comprobaciones de calidad de datos.

## 4. Base de datos

- Misiones 0–1: la base de datos de Kobalto del primer curso (clientes, cuentas, tarjetas, transferencias, incidencias).
- Desde la misión 2: **Kobalto ampliada** (`sql/kobaltoPagosDb.ts`) con `comercios` (22: nombre, categoría, ciudad) y `pagos_tarjeta` (306 pagos de enero de 2025 a febrero de 2026: tarjeta, comercio, importe, estado, fecha y hora), deterministas y con anomalías sembradas: 3 pagos duplicados, 3 pagos aceptados con la tarjeta bloqueada, un comercio sin categoría, nombres con espacios de más, pagos de madrugada y picos de importe. «Hoy» en la réplica = 1 de marzo de 2026.
- Versión en inglés con tablas en inglés, como en el primer curso.

## 5. Misiones

| # | Misión | SQL que se practica | Encargos (ejemplos) |
|---|---|---|---|
| 0 | **La consulta dentro de la consulta** (demo gratis) | Subconsultas: escalares, `IN`, correlacionadas, en el `FROM` y en el `SELECT` | Transferencias por encima de la media, clientes con cuenta de ahorro, la más alta de cada estado, media de envíos por cuenta |
| 1 | **Paso a paso** | CTE (`WITH`), varias CTE encadenadas, legibilidad | Informe de clientes activos en tres pasos, reutilizar un cálculo |
| 2 | **Fechas y textos** | `EXTRACT`, `DATE_TRUNC`, `TO_CHAR`, intervalos, `AGE`, `UPPER`/`LOWER`, `TRIM`, `SPLIT_PART`, `LENGTH`, `||` | Pagos por mes, antigüedad de clientes, normalizar emails, dominios |
| 3 | **Juntar resultados** | `UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT` | Lista única de contactos, clientes en dos listas, los que faltan en una |
| 4 | **Informes en una consulta** | Agregados condicionales (`FILTER`, `SUM(CASE…)`), tablas dinámicas (pivot), porcentajes | Pagos por categoría y mes en columnas, % de rechazados |
| 5 | **El ranking** | Funciones de ventana: `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `PARTITION BY`, top N por grupo | Los 3 comercios con más gasto por ciudad, el último pago de cada tarjeta |
| 6 | **Tendencias** | `SUM() OVER` (acumulados), medias móviles, `LAG`/`LEAD`, variación mes a mes | Saldo acumulado, crecimiento mensual, días entre pagos |
| 7 | **Cruces complicados** | Self-join, varias uniones a la misma tabla (origen y destino), `FULL OUTER JOIN`, `CROSS JOIN` y `generate_series` para calendarios | Transferencias entre clientes de la misma ciudad, días sin pagos |
| 8 | **Datos que no cuadran** | Calidad de datos: duplicados (`ROW_NUMBER`), huérfanos, reglas de negocio como consultas, `DISTINCT ON` | Pagos duplicados, pagos con tarjeta bloqueada, conciliación de totales |
| 9 | **Tu informe reutilizable** | `CREATE VIEW`, vistas sobre vistas, cuándo usar una vista, `EXPLAIN` básico | Vista de clientes con KPI, vista de control diario para Carmen |
| 10 | **Evaluación final** | Examen práctico (10 encargos, 3 h, sin pistas, 70/100) y test (30 preguntas, 6 por bloque, 40 min, 21) | Sobre datos nuevos |

Cada misión: briefing, encargos que llegan durante la jornada, dos reuniones con Inés sobre una trampa típica, cierre y debrief; 5–7 lecciones; test 6 + 6; 6–7 consecuencias.

## 6. Evaluación final y certificado

- **Examen práctico** (`m10-examen`): 3 horas, sin pistas ni mentora, 10 encargos (uno por misión), 10 puntos cada uno, aprueba con 70. Solo cuenta como terminado si se aprueba.
- **Test** en servidor: banco de 60 preguntas en 5 bloques (41–45: Subconsultas y CTE · Fechas, textos y conjuntos · Informes y rankings · Tendencias y cruces · Calidad de datos y vistas), 30 por intento (6 por bloque), 40 min (50 ampliado), aprueba con 21. Prefijo de certificado `SQI`.
- Certificado de finalización de ASE Academy (no es una certificación oficial).

## 7. Orden de construcción

1. ~~Plan del curso y de la serie~~ ✅ y ~~Misión 0 · La consulta dentro de la consulta~~ ✅ (2026-10-28). Curso registrado como pendiente de traducción.
2. ~~Kobalto ampliada (`sql/kobaltoPagosDb.ts`: `comercios` y `pagos_tarjeta`)~~ ✅, ~~Misión 1 · Paso a paso~~ ✅, ~~Misión 2 · Fechas y textos~~ ✅, ~~Misión 3 · Juntar resultados~~ ✅ y ~~Misión 4 · Informes en una consulta~~ ✅ (2026-10-28).
3. ~~Misión 5 · El ranking~~ ✅, ~~Misión 6 · Tendencias~~ ✅ y ~~Misión 7 · Cruces complicados~~ ✅ (2026-10-28).
4. ~~Misión 8 · Datos que no cuadran~~ ✅ y ~~Misión 9 · Tu informe reutilizable~~ ✅ (2026-10-28).
5. ~~Evaluación final~~ ✅ (2026-10-28): examen práctico `m10-examen` (Kobalto ampliada + préstamos, 10 encargos, 70/100) y test en servidor (banco de 60 preguntas, bloques 41–45, `exam_bank/sql_intermedio.py`); certificado `SQI`.
6. Versión en inglés, ficha en el catálogo (serie «Ruta SQL», orden 2), tráiler.
