# Misión 1: Paso a paso (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m01-*.ts`
> Ruta: `/academy/sql-intermedio/m01-cte`
> Tests: `engine/c6m01.test.ts` (recorrido bueno y malo, datos de cada encargo y trampas típicas contra PostgreSQL real)

## Premisa
Martes del segundo mes. Los encargos ya necesitan dos o tres pasos y la jugadora los escribe con `WITH`. Wiki: «Chuleta: consultas por pasos con WITH». Misma base de Kobalto que el primer curso, réplica de solo lectura. Todos los encargos exigen que la consulta empiece con `WITH`.

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Filas |
|---|---|---|---|---|
| Más de 20.000 € en total | Inés | 09:00 | Paso `saldos` (SUM por cliente) + JOIN con clientes y filtro | 7 |
| Más de 1.000 € enviados | Marta | 09:30 | Paso `enviado` (transferencias completadas JOIN cuentas, SUM por cliente) | 23 |
| Por encima de la media de su ciudad | Carmen | 10:15 | Pasos `saldos` y `medias` (AVG por ciudad sobre saldos) | 12 |
| Incidencia abierta y poco saldo | Nuria | 11:30 | Pasos `abiertas` y `saldos`, saldo < 5.000 | 3 |
| Saldo medio por cliente y segmento | Diego | 12:30 | Una fila por cliente y después AVG por segmento | 3 (estandar 8.837,48) |
| Por encima de la media de todos | Laura | 13:30 | `FROM saldos WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos)` | 12 |

Trampas comprobadas en los tests: resolverlo sin WITH, media por cuenta en vez de por cliente, media de la ciudad con las cuentas sueltas y sumar transferencias de cualquier estado.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: WITH y primer encargo | Leer la chuleta | — |
| 11:00 | Diego: «la tabla saldos no existe» en la segunda consulta | El WITH vive en su consulta; para siempre, vista (`practice.scope`) | Copiar en una tabla; culpar a la consola |
| 15:00 | Media por cuenta (7.009 €) frente a por cliente (8.837 €) | Granularidad: una fila por cliente antes de la media (`practice.grain`) | `AVG(DISTINCT …)`; «da igual» |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Subconsultas anidadas» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-AMBITO (`practice.scope`) y C-GRANULARIDAD (`practice.grain`).

## Lecciones, test y conceptos
6 lecciones y test 6 + 6 sobre `cte_basic`, `cte_readability`, `cte_chain`, `cte_reuse`, `cte_scope`, `cte_grain` y `cte_vs_subquery`.
