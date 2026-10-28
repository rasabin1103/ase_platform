# Misión 5: El ranking (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m05-*.ts`
> Base de datos: Kobalto ampliada (`sql/kobaltoPagosDb.ts`)
> Ruta: `/academy/sql-intermedio/m05-ranking`
> Tests: `engine/c6m05.test.ts`

## Premisa
Lunes de la semana 2 del mes 2. Primer día de funciones de ventana: rankings. Todos los encargos exigen una ventana (`… OVER (…)`). Wiki: «Chuleta: funciones de ventana (rankings)».

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Filas |
|---|---|---|---|---|
| Ranking de comercios | Inés | 09:00 | `RANK() OVER (ORDER BY SUM(importe) DESC)` | 22 (1.º Viajes Horizonte, 7.721,88 €) |
| Los 3 que más facturan de cada ciudad | Marta | 09:30 | `ROW_NUMBER() OVER (PARTITION BY ciudad …)` en un WITH, `n <= 3` | 17 |
| El último pago de cada tarjeta | Carmen | 10:15 | `ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC)`, `n = 1` | 32 |
| El cliente con más saldo de cada ciudad | Nuria | 11:30 | `RANK() OVER (PARTITION BY ciudad …)`, puesto 1 | 7 |
| Clientes por número de pagos, sin huecos | Diego | 12:30 | `DENSE_RANK()` | 32 (6 empatados en el 1) |
| Clientes en cuatro grupos por saldo | Laura | 13:30 | `NTILE(4)` | 39 (10, 10, 10, 9) |

Trampas comprobadas en los tests: sin ventana, RANK en vez de DENSE_RANK, sin PARTITION BY, el primer pago en vez del último y DISTINCT ON (vale en general, pero el encargo pide ventana).

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: funciones de ventana | Leer la chuleta | — |
| 11:00 | `WHERE ROW_NUMBER() … = 1` da error | Numerar en un WITH y filtrar fuera (`practice.window_filter`) | Pasarlo al HAVING; `MAX(pagado_en)` |
| 15:00 | Top 3 con ROW_NUMBER: tres de seis empatados se quedan fuera | RANK/DENSE_RANK o desempate explícito (`practice.ties`) | `LIMIT 3`; «mala suerte» |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Ordenar y contar a mano» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-WHERE (`practice.window_filter`) y C-EMPATES (`practice.ties`).

## Lecciones, test y conceptos
6 lecciones y test 6 + 6 sobre `window_basics`, `partition_by`, `rank_functions`, `top_n_per_group`, `window_filter` y `ntile`. La consola traduce el error de ventanas en WHERE/HAVING.
