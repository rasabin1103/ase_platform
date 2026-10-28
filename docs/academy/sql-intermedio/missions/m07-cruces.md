# Misión 7: Cruces complicados (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m07-*.ts`
> Base de datos: Kobalto ampliada (`sql/kobaltoPagosDb.ts`)
> Ruta: `/academy/sql-intermedio/m07-cruces`
> Tests: `engine/c6m07.test.ts`

## Premisa
Miércoles de la semana 2 del mes 2. Datos repartidos de formas incómodas: dos cuentas por transferencia, meses sin pagos, listas que no coinciden. Wiki: «Chuleta: cruces complicados».

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| Transferencias dentro de la misma ciudad | Inés | 09:00 | `cuentas`/`clientes` dos veces (ao/co, ad/cd) | 26 |
| Grandes transferencias con nombres | Marta | 09:30 | Destino con LEFT JOIN, `importe > 5000` | 4 (la 25 a otro banco) |
| Calendario de servicios con ceros | Carmen | 10:15 | `generate_series` + LEFT JOIN + COALESCE (exige generate_series) | 14 meses, 5 a 0 |
| Transferencias a uno mismo | Nuria | 11:30 | `ao.cliente_id = ad.cliente_id` | 2 (cliente 6) |
| Enero y febrero, comercio a comercio | Diego | 12:30 | FULL OUTER JOIN de dos recuentos | 20 (3 solo en febrero) |
| Matriz tipo de tarjeta × categoría | Laura | 13:30 | CROSS JOIN + LEFT JOIN + `COUNT(p.id)` (exige CROSS JOIN) | 16 (crédito × servicios = 0) |

Trampas comprobadas en los tests: destino con JOIN normal, sin calendario, LEFT JOIN en vez de FULL OUTER, `COUNT(*)` en la matriz y comparar la cuenta consigo misma.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: la misma tabla dos veces | Leer la chuleta | — |
| 11:00 | Un JOIN a `cuentas` con origen y destino a la vez da 0 filas | Un alias por papel (`practice.double_alias`) | Cambiar AND por OR; «no hay datos» |
| 15:00 | El calendario con el filtro en el WHERE da 11 meses en vez de 14 | Filtro de la derecha en el ON (`practice.on_vs_where`) | FULL OUTER JOIN; COALESCE |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Dos consultas y a mano» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-ALIAS (`practice.double_alias`) y C-WHERE (`practice.on_vs_where`).

## Lecciones, test y conceptos
6 lecciones y test 6 + 6 sobre `same_table_twice`, `self_join`, `full_outer_join`, `cross_join`, `calendar_series` y `on_vs_where`.

## Nota técnica
`generate_series(DATE …, DATE …, INTERVAL …)` devuelve `timestamptz`; el contenido usa `TIMESTAMP` y pide el mes con `::date`. Desde esta misión el corrector compara los números por valor (0 = 0.00), así que `COALESCE(total, 0)` y `COALESCE(total, 0.00)` valen igual.
