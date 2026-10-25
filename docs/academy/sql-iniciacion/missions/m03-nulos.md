# Misión 3: Los huecos (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m03-*.ts`
> Ruta: `/academy/sql-iniciacion/m03-nulos`
> Tests: `engine/c5m03.test.ts` (recorrido bueno y malo, datos de cada encargo y trampas típicas contra PostgreSQL real)

## Premisa
Jueves de la semana 1. Todos los encargos tienen datos que faltan. Wiki: «Chuleta: NULL, COALESCE y CASE», con las columnas de Kobalto que admiten NULL (segmento, cerrada_en, cuenta_destino_id, concepto).

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Filas |
|---|---|---|---|---|
| Clientes sin segmento | Inés | 09:00 | `… WHERE segmento IS NULL` | 2 |
| Incidencias sin cerrar | Nuria | 09:30 | `… WHERE cerrada_en IS NULL` | 8 |
| Transferencias a otros bancos | Diego | 10:15 | `… WHERE cuenta_destino_id IS NULL` | 24 |
| Todos los que no son premium | Marta | 11:30 | `… WHERE segmento <> 'premium' OR segmento IS NULL` | 33 (31 sin el `OR`) |
| Concepto o «Sin concepto» | Laura | 12:30 | `COALESCE(concepto, 'Sin concepto') AS concepto` (columnas exactas) | 120 (9 sin concepto) |
| Nivel de saldo | Carmen | 13:30 | `CASE WHEN saldo < 0 … ELSE 'alto' END AS nivel` (columnas exactas) | 52 |

Trampas que no cumplen: `= NULL` (0 filas), `<> 'premium'` sin los NULL, `COALESCE` sin alias (la columna se llama «coalesce»), `CASE` con los WHEN en otro orden (la cuenta negativa sale «bajo»).

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: qué es NULL | Leer la chuleta | — |
| 11:00 | Nuria: `cerrada_en = NULL` da 0 filas | Comparar con NULL nunca es verdadero: `IS NULL` (`practice.isnull`) | `= 'NULL'`; «están todas cerradas» |
| 15:00 | Etiqueta `nombre || ' (' || segmento || ')'` vacía para dos clientes | NULL contagia: `COALESCE` (`practice.nullprop`) | Culpar a `||`; rellenar datos a mano |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «NULL es cero» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-NURIA · ocho incidencias abiertas siguen esperando | `reto.abiertas` | alta |
| C-DIEGO · el conector se prueba sin datos reales | `reto.externas` | media |
| C-PREMIUM · la campaña olvida a los clientes sin segmento | `reto.no_premium` | media |
| C-PDF · el extracto sale con celdas en blanco | `reto.sin_concepto` | media |
| C-RIESGO · el informe de riesgo sale sin etiquetas | `reto.nivel` | media |
| C-ISNULL · «no hay incidencias abiertas» | `practice.isnull` | alta |
| C-ETIQUETA · dos clientes sin nombre en la app | `practice.nullprop` | media |

## Conceptos
`null_meaning`, `is_null`, `null_logic`, `coalesce` y `case_when`. Cinco microlecciones de Inés y un test de 6 + 6 preguntas.
