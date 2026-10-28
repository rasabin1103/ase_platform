# Misión 0: La consulta dentro de la consulta (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m00-*.ts`
> Ruta: `/academy/sql-intermedio/m00-subconsultas` (demo abierta sin cuenta: es la primera misión)
> Tests: `engine/c6m00.test.ts` (recorrido bueno y malo, datos de cada encargo y trampas típicas contra PostgreSQL real)

## Premisa
Lunes del segundo mes en Kobalto. El equipo ya no pide listas sino respuestas que necesitan un dato calculado antes. Wiki: «Chuleta: subconsultas» (qué devuelve cada tipo y dónde va, correlacionadas y trampas). Misma base de datos que el primer curso, réplica de solo lectura; cada ejecución cuesta 2 minutos.

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| Por encima de la media | Inés | 09:00 | `… WHERE importe > (SELECT AVG(importe) FROM transferencias)` (obligatorio usar subconsulta) | 4 filas |
| Clientes con cuenta de ahorro | Marta | 09:30 | `… WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro')` | 13 |
| La más alta de cada estado | Carmen | 10:15 | Correlacionada: `t.importe = (SELECT MAX(t2.importe) … WHERE t2.estado = t.estado)` | 3 |
| Clientes sin incidencias | Nuria | 11:30 | `NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id)` (o `NOT IN`) | 10 |
| Media de envíos por cuenta | Diego | 12:30 | `ROUND(AVG(n), 2)` sobre `(SELECT cuenta_origen_id, COUNT(*) AS n … GROUP BY …) AS envios` (obligatorio usar subconsulta) | 2.31 |
| Incidencias de cada cliente | Laura | 13:30 | `(SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias` (también vale `LEFT JOIN … GROUP BY`) | 40 |

Trampas comprobadas en los tests: escribir la media a mano, el máximo global en vez de por estado, la media de importes en vez de la de envíos e `INNER JOIN` que pierde a los clientes sin incidencias.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: subconsultas y primer encargo | Leer la chuleta | — |
| 11:00 | `id = (SELECT cliente_id …)` da «más de una fila» | Un valor → `=`, una lista → `IN` (`practice.multirow`) | `LIMIT 1`; «fallo de PostgreSQL» |
| 15:00 | Un JOIN cuenta 49 clientes con cuenta activa; son 38 | El JOIN repite por pareja: `IN`/`EXISTS`/`COUNT(DISTINCT)` (`practice.semijoin`) | «Clientes duplicados»; `LEFT JOIN` |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Copiar el número de una consulta a otra» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (un encargo sin hacer cada una), C-MULTIFILA (`practice.multirow`) y C-DUPLICADOS (`practice.semijoin`).

## Lecciones, test y conceptos
7 lecciones (escalar, IN, correlacionada, FROM, SELECT, varias filas, JOIN frente a IN/EXISTS) y test 6 + 6 sobre los conceptos `subquery_scalar`, `subquery_in`, `subquery_correlated`, `subquery_from`, `subquery_select`, `subquery_multirow` y `semijoin_duplicates`.
