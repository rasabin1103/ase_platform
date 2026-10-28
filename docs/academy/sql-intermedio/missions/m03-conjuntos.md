# Misión 3: Juntar resultados (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m03-*.ts`
> Base de datos: Kobalto ampliada (`sql/kobaltoPagosDb.ts`)
> Ruta: `/academy/sql-intermedio/m03-conjuntos`
> Tests: `engine/c6m03.test.ts`

## Premisa
Jueves del segundo mes. Las respuestas salen de juntar dos consultas. Cada encargo exige el operador que corresponde (`UNION`, `INTERSECT` o `EXCEPT`). Wiki: «Chuleta: juntar resultados».

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Filas |
|---|---|---|---|---|
| Cuentas con alguna transferencia | Inés | 09:00 | `cuenta_origen_id UNION cuenta_destino_id` (no nula) | 53 (incluye la 999) |
| Movimientos de enero de 2026 | Marta | 09:30 | `'transferencia' AS tipo … UNION ALL 'tarjeta' …` | 37 |
| Pago rechazado e incidencia «Tarjeta bloqueada» | Carmen | 10:15 | `… INTERSECT …` | 2 (clientes 28 y 36) |
| Clientes que nunca han pagado con tarjeta | Nuria | 11:30 | `clientes EXCEPT clientes con pagos` | 8 |
| Cuentas de destino que no existen | Diego | 12:30 | `cuenta_destino_id EXCEPT SELECT id FROM cuentas` | 1 (999) |
| Comercios con pagos en 2025 y 2026 | Laura | 13:30 | `… INTERSECT …` con dos rangos | 20 |

Trampas comprobadas en los tests: resolverlo sin el operador pedido, solo los orígenes, EXCEPT al revés, UNION en vez de INTERSECT y no filtrar el motivo de la incidencia.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: operaciones de conjuntos | Leer la chuleta | — |
| 11:00 | Con `UNION` el total de enero da 36 movimientos y 24.098,08 € (son 37 y 24.115,63 €) | UNION quita repetidos: `UNION ALL` para sumar (`practice.union_all`) | «Redondeo»; «había un duplicado» |
| 15:00 | `SELECT id, importe … UNION SELECT importe, id …` no da error y saca 426 filas | Se empareja por posición: mismo orden (`practice.union_columns`) | «Empareja por nombre»; convertir a texto |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Cruzar en Excel» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-UNION (`practice.union_all`) y C-COLUMNAS (`practice.union_columns`).

## Lecciones, test y conceptos
6 lecciones y test 6 + 6 sobre `union_distinct`, `union_all`, `intersect_op`, `except_op`, `setop_columns` y `setop_vs_join`. La consola traduce los errores de número y tipo de columnas en UNION/INTERSECT/EXCEPT.
