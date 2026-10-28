# Misión 4: Informes en una consulta (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m04-*.ts`
> Base de datos: Kobalto ampliada (`sql/kobaltoPagosDb.ts`)
> Ruta: `/academy/sql-intermedio/m04-informes`
> Tests: `engine/c6m04.test.ts`

## Premisa
Viernes del segundo mes, cierre de semana. Varios recuentos en columnas, porcentajes y una fila de indicadores, cada informe en una sola consulta. Wiki: «Chuleta: informes en una consulta».

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| Pagos por estado y porcentaje | Inés | 09:00 | `ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) …), 1)` | aceptado 88,6 · rechazado 9,5 · devuelto 2,0 |
| Estados en columnas por categoría | Marta | 09:30 | `COUNT(*) FILTER (WHERE p.estado = …)` por columna, `COALESCE(categoria, 'sin categoría')` | 9 filas |
| Rechazo por tipo de tarjeta | Carmen | 10:15 | `% sobre el grupo` | crédito 0,0 · débito 9,8 |
| Incidencias por canal | Nuria | 11:30 | `COUNT(*)`, `FILTER (WHERE cerrada_en IS NULL)`, `COUNT(cerrada_en)` | 3 filas |
| 2025 y 2026 en columnas | Diego | 12:30 | `SUM(importe) FILTER (WHERE …)` por año | 8 categorías |
| Fila de indicadores | Laura | 13:30 | Agregados sin GROUP BY | 40 · 38 · 2 · 7 |

`FILTER`, `SUM(CASE … ELSE 0)` y `COUNT(CASE … END)` sin ELSE valen todos. Trampas comprobadas en los tests: división entera, `COUNT(CASE … ELSE 0 END)`, porcentaje sobre el total en vez de sobre el grupo y no filtrar los aceptados.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: recuentos en columnas y porcentajes | Leer la chuleta | — |
| 11:00 | `100 * … / COUNT(*)` da 9 (es 9,5) | Entero entre entero da entero: `100.0` (`practice.decimal_division`) | Más decimales en el ROUND; «un 9 % vale» |
| 15:00 | `COUNT(CASE … ELSE 0 END)` cuenta todos los pagos como rechazados | COUNT cuenta no nulos: sin ELSE, SUM o FILTER (`practice.count_case`) | `COUNT(DISTINCT …)`; agrupar por estado |
| 17:00 | Cierre de la semana con Inés | Cierre y `preventBugs` | «Una consulta por columna» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-DIVISION (`practice.decimal_division`) y C-COUNTCASE (`practice.count_case`).

## Lecciones, test y conceptos
6 lecciones y test 6 + 6 sobre `filter_clause`, `case_aggregate`, `pivot`, `percentages`, `integer_division` y `kpi_row`.
