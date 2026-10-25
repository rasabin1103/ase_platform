# Misión 5: Agrupar (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m05-*.ts`
> Ruta: `/academy/sql-iniciacion/m05-agrupar`
> Tests: `engine/c5m05.test.ts` (recorrido bueno y malo, cifras de cada encargo y trampas típicas contra PostgreSQL real)

## Premisa
Lunes de la semana 2. Una cifra por grupo. Wiki: «Chuleta: GROUP BY y HAVING». Cierra la parte de una sola tabla. El motor traduce el error de usar agregados en el WHERE y sugiere HAVING.

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| Clientes por ciudad | Inés | 09:00 | `SELECT ciudad, COUNT(*) AS clientes … GROUP BY ciudad` (columnas exactas) | 7 filas |
| Transferencias por estado | Diego | 09:30 | `SELECT estado, COUNT(*), SUM(importe) … GROUP BY estado` | 103 · 10 · 7 |
| Cuentas por tipo | Marta | 10:15 | `SELECT tipo, COUNT(*), ROUND(AVG(saldo), 2) … GROUP BY tipo` | ahorro 13 · corriente 39 |
| Incidencias abiertas por motivo | Nuria | 11:30 | `… WHERE cerrada_en IS NULL GROUP BY motivo` | 5 filas (Cambio de datos: 3) |
| Ciudades con más de 4 clientes | Marta | 12:30 | `… GROUP BY ciudad HAVING COUNT(*) > 4` | Madrid 12 · Barcelona 8 |
| Clientes con más de una cuenta | Carmen | 13:30 | `SELECT cliente_id, COUNT(*) FROM cuentas GROUP BY cliente_id HAVING COUNT(*) > 1` | 13 filas |

Trampas que no cumplen: contar todas las incidencias en vez de las abiertas, `>= 4` (salen las 7 ciudades), `AVG` sin redondear, el recuento por ciudad sin el alias `clientes`, el `GROUP BY` sin `HAVING`.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: GROUP BY | Leer la chuleta | — |
| 11:00 | `WHERE COUNT(*) > 4` da error | WHERE filtra filas antes; HAVING, grupos después (`practice.having`) | Mover el WHERE; filtrar a mano |
| 15:00 | El informe por segmento tiene una fila en blanco con 2 | Es el grupo de los NULL: etiquetarlo con COALESCE (`practice.nullgroup`) | Quitarlo con `IS NOT NULL`; «fallo de GROUP BY» |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Una consulta por ciudad» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-PANEL · el panel de transferencias sale vacío | `reto.por_estado` | media |
| C-CAMPANA · la campaña de ahorro sin cifras por tipo | `reto.por_tipo` | media |
| C-NURIA · no sabe qué motivo atacar primero | `reto.abiertas_motivo` | media |
| C-OFICINAS · oficinas sin saber dónde hay clientes | `reto.ciudades_grandes` | alta |
| C-TITULARES · control de titularidades sin hacer | `reto.multicuenta` | media |
| C-HAVING · grupos filtrados a mano | `practice.having` | baja |
| C-SEGMENTOS · el informe suma 38 clientes | `practice.nullgroup` | alta |

## Conceptos
`group_by`, `group_select`, `having`, `where_vs_having` y `group_null`. Cinco microlecciones de Inés y un test de 6 + 6 preguntas.
