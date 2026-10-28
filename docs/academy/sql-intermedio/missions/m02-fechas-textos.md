# Misión 2: Fechas y textos (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m02-*.ts`
> Base de datos: `frontend/src/features/academy/sql/kobaltoPagosDb.ts` (Kobalto ampliada)
> Ruta: `/academy/sql-intermedio/m02-fechas-textos`
> Tests: `engine/c6m02.test.ts`

## Premisa
Miércoles del segundo mes. Llegan a la réplica `comercios` (22) y `pagos_tarjeta` (306, de enero de 2025 a febrero de 2026). La réplica es una foto del **1 de marzo de 2026**: los encargos no aceptan `CURRENT_DATE` ni `NOW()`. Wiki: «Chuleta: fechas y textos».

## Kobalto ampliada (datos deterministas)
- `comercios(id, nombre, categoria, ciudad)`: 22 comercios ficticios; « Café Central» y «Bar Esquina  » con espacios de más, «PIZZERÍA FORNO» en mayúsculas, la floristería sin categoría y la tienda online sin ciudad.
- `pagos_tarjeta(id, tarjeta_id, comercio_id, importe, estado, pagado_en)`: estados aceptado (271), rechazado y devuelto; 13 pagos de madrugada; algunos importes de más de 2.500 €.
- Anomalías para las misiones de calidad: 3 pagos duplicados (ids 304–306), 3 pagos aceptados con la tarjeta bloqueada (301–303).

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Filas |
|---|---|---|---|---|
| Pagos aceptados por mes | Inés | 09:00 | `DATE_TRUNC('month', pagado_en)`, COUNT y SUM | 14 |
| Al menos un año de antigüedad | Marta | 09:30 | `fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'` | 24 |
| Fin de semana y más de 200 € | Carmen | 10:15 | `EXTRACT(ISODOW …) IN (6, 7)` | 11 |
| Clientes por dominio | Nuria | 11:30 | `SPLIT_PART(email, '@', 2)` | 2 |
| Pagos de madrugada | Diego | 12:30 | `EXTRACT(HOUR …) < 6` | 13 |
| Comercios con espacios de más | Laura | 13:30 | `TRIM(nombre) AS limpio … WHERE nombre <> TRIM(nombre)` | 2 |

Trampas comprobadas en los tests: agrupar por número de mes, CURRENT_DATE, `EXTRACT(DAY)` en vez del día de la semana, incluir las 06:00, agrupar por el email entero y no limpiar el nombre.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: tablas nuevas, «hoy» = 1/3/2026 | Leer la chuleta | — |
| 11:00 | `EXTRACT(MONTH) = 2` da 41 pagos (son 20) | Rango de fechas del mes (`practice.month_range`) | «Ha sido una campaña»; LIKE sobre texto |
| 15:00 | Informe ordenado por `TO_CHAR(…, 'MM/YYYY')` sale desordenado | Ordenar por la fecha, formato al final (`practice.format_last`) | `ORDER BY 1 DESC`; ordenar en Excel |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Convertir fechas en texto» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-FEBRERO (`practice.month_range`) y C-ORDEN (`practice.format_last`).

## Lecciones, test y conceptos
7 lecciones y test 6 + 6 sobre `date_trunc`, `date_extract`, `intervals`, `date_ranges`, `format_last`, `text_functions` y `trim_clean`.
