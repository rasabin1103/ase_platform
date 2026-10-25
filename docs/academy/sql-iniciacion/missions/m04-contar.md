# Misión 4: Contar (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m04-*.ts`
> Ruta: `/academy/sql-iniciacion/m04-contar`
> Tests: `engine/c5m04.test.ts` (recorrido bueno y malo, cifras de cada encargo y trampas típicas contra PostgreSQL real)

## Premisa
Viernes, cierre de la semana 1. Nadie quiere listas: quieren cifras. Wiki: «Chuleta: contar y resumir». Los encargos se cumplen solo si la cifra sale de la función pedida (`COUNT`, `SUM`, `AVG`, `MIN`/`MAX`): `SELECT 40` no vale.

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| ¿Cuántos clientes? | Inés | 09:00 | `SELECT COUNT(*) FROM clientes` | 40 |
| Saldo total de las activas | Marta | 09:30 | `SELECT SUM(saldo) FROM cuentas WHERE estado = 'activa'` | 396.358,49 |
| Importe medio de las completadas | Diego | 10:15 | `SELECT ROUND(AVG(importe), 2) … WHERE estado = 'completada'` | 956,99 |
| La más pequeña y la más grande | Carmen | 11:30 | `MIN(importe) AS minimo, MAX(importe) AS maximo` (columnas exactas) | 6,90 · 15.700 |
| Total y con concepto | Laura | 12:30 | `COUNT(*) AS total, COUNT(concepto) AS con_concepto` (columnas exactas) | 120 · 111 |
| ¿En cuántas ciudades? | Marta | 13:30 | `SELECT COUNT(DISTINCT ciudad) FROM clientes` | 7 |

Trampas que no cumplen: escribir la cifra a mano, `SUM` sin el `WHERE`, `AVG` sin redondear, `MIN`/`MAX` sin alias, `COUNT(*)` en lugar de `COUNT(concepto)`, `COUNT(ciudad)` sin `DISTINCT`.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: funciones de agregación | Leer la chuleta | — |
| 11:00 | Nuria: `SELECT nombre, COUNT(*)` da error de GROUP BY | Un agregado devuelve una fila: no se mezcla con columnas sueltas (`practice.aggmix`) | DISTINCT; «ejecútalo otra vez» |
| 15:00 | Marta: «la transferencia típica es de 893 €» | La media la inflan 4 transferencias enormes: MIN/MAX, media sin extremos (430 €) o mediana (`practice.outliers`) | Redondear a 900; «la media es la media» |
| 17:00 | Cierre de la semana con Inés | Cierre y `preventBugs` | «Sumar con la calculadora» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-COMITE · Marta va al comité sin el saldo total | `reto.saldo_activas` | alta |
| C-MOTOR · el motor de pagos se dimensiona a ojo | `reto.media_completadas` | media |
| C-TRIMESTRAL · el informe de Riesgos sale sin extremos | `reto.extremos` | media |
| C-EXTRACTO · el test no sabe cuántas filas sin concepto esperar | `reto.conceptos` | media |
| C-CIUDADES · «clientes en 40 ciudades» | `reto.ciudades_distintas` | baja |
| C-MEZCLA · Nuria se atasca con el error | `practice.aggmix` | baja |
| C-MEDIA · «la transferencia típica es de 893 €» | `practice.outliers` | alta |

## Conceptos
`count_rows`, `count_column`, `sum_avg`, `round`, `min_max`, `aggregate_rows` y `average_outliers`. Siete microlecciones de Inés y un test de 6 + 6 preguntas.
