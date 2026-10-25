# Misión 2: Ordenar y buscar (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m02-*.ts`
> Ruta: `/academy/sql-iniciacion/m02-ordenar`
> Tests: `engine/c5m02.test.ts` (recorrido bueno y malo, datos de cada encargo, trampas y encargos ordenados sin empates)

## Premisa
Miércoles de la semana 1. El equipo quiere listas **en orden** y buscar textos que no recuerda enteros. Wiki: «Chuleta: ordenar y buscar». Cuando un encargo pide un orden, el orden cuenta (las mismas filas desordenadas no lo cumplen). Al ordenar y buscar salen dos anomalías de los datos: un saldo negativo y un email duplicado.

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Orden |
|---|---|---|---|---|
| De menor a mayor saldo | Inés | 09:00 | `SELECT iban, saldo FROM cuentas ORDER BY saldo` (la primera: -245,30 €) | Sí |
| Las 10 transferencias más altas | Carmen | 09:30 | `… ORDER BY importe DESC LIMIT 10` (4 por encima de 12.000 €) | Sí |
| Buscar a un Serrano | Nuria | 10:15 | `… WHERE apellidos ILIKE '%serrano%'` (4, primer o segundo apellido) | No |
| Ciudades sin repetir | Marta | 11:30 | `SELECT DISTINCT ciudad FROM clientes ORDER BY ciudad` (7) | Sí |
| Emails de correo.es | Laura | 12:30 | `… WHERE email LIKE '%@correo.es'` (11, con un email repetido) | No |
| Por ciudad y por alta | Marta | 13:30 | `… ORDER BY ciudad, fecha_alta DESC` | Sí |

Trampas que no cumplen: `ORDER BY importe LIMIT 10` (las más bajas), `LIKE 'Serrano%'` (solo primer apellido), `LIKE '%serrano%'` (mayúsculas), `DISTINCT` sin `ORDER BY`, `ORDER BY ciudad, fecha_alta` sin `DESC`.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: ORDER BY y LIKE | Leer la chuleta | — |
| 11:00 | Nuria: `apellidos LIKE 'serrano'` da 0 filas | Sin % es exacto y LIKE distingue mayúsculas: `%…%` o ILIKE (`practice.like`) | Usar `=`; «el cliente no está registrado» |
| 15:00 | `SELECT DISTINCT ciudad, nombre` da 40 filas | DISTINCT mira la fila entera (`practice.distinct`) | Añadir ORDER BY; «DISTINCT falla con textos» |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Ordenar en una hoja de cálculo» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-CARMEN · se le pasan las transferencias de 12.000 € | `reto.top10` | alta |
| C-NURIA · no encuentra al cliente | `reto.serrano` | media |
| C-CIUDADES · la diapositiva repite ciudades | `reto.ciudades` | baja |
| C-LAURA · el arreglo se prueba sin los clientes afectados | `reto.dominio` | media |
| C-ORDEN · el informe de oficinas sale desordenado | `reto.por_ciudad` | media |
| C-LIKE · una búsqueda no encuentra clientes que existen | `practice.like` | alta |
| C-DISTINCT · «hay 40 ciudades» | `practice.distinct` | media |

## Conceptos
`order_by`, `order_desc`, `order_multi`, `like_patterns`, `ilike_case` y `distinct`. Seis microlecciones de Inés y un test de 6 + 6 preguntas.
