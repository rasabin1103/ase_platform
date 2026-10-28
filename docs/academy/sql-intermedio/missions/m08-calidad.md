# Misión 8: Datos que no cuadran (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m08-*.ts`
> Base de datos: Kobalto ampliada (`sql/kobaltoPagosDb.ts`), con las anomalías sembradas
> Ruta: `/academy/sql-intermedio/m08-calidad`
> Tests: `engine/c6m08.test.ts`

## Premisa
Jueves de la semana 2 del mes 2. Hoy no hay informes: hay que encontrar datos que no cuadran. Cada regla de negocio se escribe como una consulta que debería devolver cero filas. Wiki: «Chuleta: calidad de datos».

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| Las copias sobrantes | Inés | 09:00 | `ROW_NUMBER() OVER (PARTITION BY tarjeta, comercio, importe, pagado_en ORDER BY id)`, n > 1 | 304, 305, 306 |
| Pagos aceptados con tarjeta bloqueada | Marta | 09:30 | `t.estado = 'bloqueada' AND p.estado = 'aceptado'` | 3 (tarjeta 12) |
| Pagos después de la caducidad | Carmen | 10:15 | `p.pagado_en::date > t.caduca_en`, aceptados | 24 (tarjetas 12, 18 y 28) |
| Clientes que comparten email | Nuria | 11:30 | `GROUP BY LOWER(email) HAVING COUNT(*) > 1` | 2 (clientes 12 y 27) |
| El pago más alto de cada comercio | Diego | 12:30 | `DISTINCT ON (comercio_id) … ORDER BY comercio_id, importe DESC` | 22 |
| Panel de reglas en una fila | Laura | 13:30 | Una subconsulta escalar por regla | 3 · 3 · 24 · 1 · 2 |

Trampas comprobadas en los tests: devolver también los originales, todos los pagos de la tarjeta bloqueada, solo tarjetas «activas», DISTINCT ON sin ordenar por importe y contar filas duplicadas en vez de copias.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: reglas como consultas | Leer la chuleta | — |
| 11:00 | El DELETE de limpieza de Diego borraría 6 filas (también los originales) | Borrar solo n > 1 y ensayar como SELECT (`practice.keep_one`) | Aprobarlo; `SELECT DISTINCT *` |
| 15:00 | Marta «arregla» su informe con DISTINCT (303 en vez de 306) | Reportar y arreglar en origen, con regla (`practice.fix_source`) | «Si sale bien, está bien»; DISTINCT en todos los informes |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Filtrar los raros en cada consulta» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-BORRADO (`practice.keep_one`) y C-DISTINCT (`practice.fix_source`).

## Lecciones, test y conceptos
6 lecciones y test 6 + 6 sobre `rules_as_queries`, `find_duplicates`, `keep_one`, `distinct_on`, `quality_dashboard` y `fix_at_source`.
