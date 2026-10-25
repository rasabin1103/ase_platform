# Misión 1: Solo lo que importa (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m01-*.ts`
> Ruta: `/academy/sql-iniciacion/m01-filtrar`
> Tests: `engine/c5m01.test.ts` (recorrido bueno y malo, datos de cada encargo y trampas típicas contra PostgreSQL real)

## Premisa
Martes de la semana 1. Ya sabe sacar columnas; hoy el equipo quiere **filas concretas**. Wiki: «Chuleta: filtrar con WHERE» (operadores, AND/OR/IN/BETWEEN y los valores posibles de segmento, estados y tipos). Réplica de solo lectura; cada ejecución cuesta 2 minutos.

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Filas |
|---|---|---|---|---|
| Los clientes de Madrid | Inés | 09:00 | `SELECT * FROM clientes WHERE ciudad = 'Madrid'` | 12 |
| Cuentas con mucho saldo | Marta | 09:30 | `SELECT iban, tipo, saldo FROM cuentas WHERE saldo > 10000` | 11 |
| Cuentas que no están activas | Carmen | 10:15 | `… WHERE estado <> 'activa'` (2 bloqueadas y 1 cerrada) | 3 |
| Clientes de Sevilla o Málaga | Nuria | 11:30 | `… WHERE ciudad IN ('Sevilla', 'Málaga')` | 8 |
| Jóvenes de Madrid | Marta | 12:30 | `… WHERE ciudad = 'Madrid' AND segmento = 'joven'` | 3 |
| Una semana de transferencias | Diego | 13:30 | `… WHERE creada_en >= '2026-01-19' AND creada_en < '2026-01-26'` | 6 |

Trampa del último encargo: `BETWEEN '2026-01-19' AND '2026-01-25'` devuelve 5, porque corta el domingo a las 00:00 y hay una transferencia el domingo por la tarde. Diego lo explica al recibir las 6.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: WHERE y primer encargo | Leer la chuleta | — |
| 11:00 | Nuria: `ciudad = madrid` da error y `= 'madrid'` da 0 filas | Comillas simples y mayúsculas exactas; 0 filas se revisa (`practice.quotes`) | Comillas dobles; «no hay clientes en Madrid» |
| 15:00 | «Jóvenes de Madrid o Barcelona» devuelve 14 en vez de 5 | AND va antes que OR: paréntesis o IN (`practice.parens`) | Cambiar el orden de las condiciones; culpar a los datos |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Filtrar en Excel» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-MARTA · campaña de ahorro sin lista | `reto.saldo_alto` | alta |
| C-CARMEN · auditoría sin cuentas bloqueadas ni cerradas | `reto.no_activas` | alta |
| C-NURIA · nadie invita a Sevilla y Málaga | `reto.sur` | media |
| C-CAMPANA · la tarjeta joven se ofrece a quien no es joven | `reto.jovenes_madrid` | media |
| C-SEMANA · el informe pierde el domingo | `reto.semana` | media |
| C-COMILLAS · «no hay clientes en Madrid» | `practice.quotes` | alta |
| C-PRECEDENCIA · un listado de jóvenes con todos los de Madrid | `practice.parens` | media |

## Conceptos
`where_basic`, `comparison_ops`, `text_quotes`, `and_or`, `in_list`, `between_dates` y `precedence`. Seis microlecciones de Inés y un test de 6 + 6 preguntas.
