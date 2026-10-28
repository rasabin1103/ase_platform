# Misión 9: Tu informe reutilizable (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m09-*.ts`
> Base de datos: Kobalto ampliada, en el **entorno de pruebas** (modificable, con «Restaurar»)
> Ruta: `/academy/sql-intermedio/m09-vistas`
> Tests: `engine/c6m09.test.ts`

## Premisa
Viernes de la semana 2 del mes 2, último día antes del examen. Las mejores consultas del curso se convierten en vistas que todo el equipo puede usar. Wiki: «Chuleta: vistas y EXPLAIN».

## Encargos

| Encargo | Quién | Hora | Se comprueba |
|---|---|---|---|
| Vista `saldos_cliente` (cliente_id, saldo_total) | Inés | 09:00 | Existe como VIEW, columnas y filas iguales a la referencia |
| Vista `kpi_clientes` (id, nombre, ciudad, saldo_total) sobre `saldos_cliente` | Marta | 09:30 | Lo anterior + depende de `saldos_cliente` (`information_schema.view_table_usage`); 40 filas, el 38 a 0 |
| Vista `control_pagos` (una fila: duplicados, tarjeta_bloqueada, tarjeta_caducada) | Carmen | 10:15 | 3 · 3 · 24 |
| Clientes de Madrid con más de 10.000 € usando `kpi_clientes` | Nuria | 11:30 | Resultado + `FROM kpi_clientes` |
| `EXPLAIN` (sin ANALYZE) de una consulta sobre `kpi_clientes` | Diego | 12:30 | Columna «QUERY PLAN» y el plan nombra clientes o cuentas |
| Vista `pagos_a_revisar` (id, motivo) | Laura | 13:30 | 30 filas (3 + 3 + 24) |

Las vistas se comprueban con `viewChecks` (exportada desde `m09-vistas.ts` y reutilizada en el examen): tipo VIEW, nombres de columna en orden y diferencia cero con la consulta de referencia (`EXCEPT ALL` en los dos sentidos, así que 0 y 0.00 son iguales). Trampas comprobadas en los tests: tabla en vez de vista, columna sin alias («sum»), kpi_clientes sin usar saldos_cliente o con JOIN normal, la consulta de Nuria sin la vista y EXPLAIN ANALYZE.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: vistas y entorno de pruebas | Leer la chuleta | — |
| 11:00 | Diego quiere guardar el panel con `CREATE TABLE … AS SELECT` | Vista (o materializada con REFRESH si hace falta) (`practice.view_live`) | «Tabla, que es más rápida»; las dos |
| 15:00 | `EXPLAIN ANALYZE DELETE` ha borrado los pagos | ANALYZE ejecuta: `BEGIN; … ROLLBACK;` (`practice.explain_safe`) | «Fallo de la consola»; «no usar EXPLAIN» |
| 17:00 | Cierre del curso con Inés | Cierre y `preventBugs` | «Pasarse las consultas por chat» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-FOTO (`practice.view_live`) y C-ANALYZE (`practice.explain_safe`).

## Lecciones, test y conceptos
6 lecciones y test 6 + 6 sobre `create_view`, `view_on_view`, `view_vs_table`, `explain_basics` y `explain_analyze`. La consola traduce los errores de objeto ya existente, renombrar columnas de una vista y borrar una vista de la que dependen otras.
