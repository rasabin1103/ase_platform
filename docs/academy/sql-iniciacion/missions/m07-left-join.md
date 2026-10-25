# Misión 7: Lo que falta (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m07-*.ts`
> Ruta: `/academy/sql-iniciacion/m07-left-join`
> Tests: `engine/c5m07.test.ts` (recorrido bueno y malo, datos de cada encargo y trampas típicas contra PostgreSQL real)

## Premisa
Miércoles de la semana 2. Ayer el INNER JOIN se tragó al cliente sin cuentas; hoy se trata justo de encontrar lo que no tiene pareja. Wiki: «Chuleta: LEFT JOIN y EXISTS». Destapa la referencia rota de la transferencia 77 (destino 999).

Datos: los destinos de las transferencias se reparten entre 50 de las 52 cuentas, y quedan 3 que nunca han recibido nada (21, 32 y 47).

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| Todos los clientes con sus cuentas | Inés | 09:00 | `FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id` | 53 filas (el 38 con `iban` NULL) |
| Clientes sin cuenta | Marta | 09:30 | `… LEFT JOIN … WHERE a.id IS NULL` o `NOT EXISTS` | 1 (el 38) |
| Destinos que no existen | Diego | 10:15 | `LEFT JOIN cuentas a ON t.cuenta_destino_id = a.id WHERE t.cuenta_destino_id IS NOT NULL AND a.id IS NULL` | 1 (la 77) |
| Clientes con incidencias abiertas | Nuria | 11:30 | `WHERE EXISTS (SELECT 1 FROM incidencias i WHERE … AND i.cerrada_en IS NULL)` | 8 |
| Cuentas que nunca han recibido | Carmen | 12:30 | `WHERE NOT EXISTS (… t.cuenta_destino_id = a.id)` | 3 |
| Cuentas de cada cliente | Marta | 13:30 | LEFT JOIN + `GROUP BY c.id, c.nombre` + `COUNT(a.id)` | 40 filas (el 38 con 0) |

Trampas que no cumplen: INNER JOIN en vez de LEFT, anti-join sin excluir los destinos NULL (salen las transferencias a otros bancos), `NOT IN` con NULL en la subconsulta (0 filas), `COUNT(*)` con LEFT JOIN (el 38 sale con 1).

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: LEFT JOIN | Leer la chuleta | — |
| 11:00 | LEFT JOIN con `WHERE a.estado = 'activa'` pierde al cliente 38 | La condición de la derecha va en el ON (`practice.left_on`) | RIGHT JOIN; «fallo de PostgreSQL» |
| 15:00 | `NOT IN (SELECT cuenta_destino_id …)` da 0 | Un NULL en la lista anula NOT IN: NOT EXISTS (`practice.notin`) | DISTINCT; dudar del resultado correcto |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Con INNER JOIN me basta» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-BIENVENIDA · el cliente sin cuenta no recibe mensaje | `reto.sin_cuenta` | media |
| C-HUERFANA · la transferencia a la cuenta 999 sigue sin detectar | `reto.destino_inexistente` | crítica |
| C-LLAMADAS · ocho clientes esperan una llamada | `reto.con_incidencia` | media |
| C-SIN-USO · «no hay cuentas sin uso» | `reto.nunca_recibida` | media |
| C-RECUENTO · «todos tienen al menos una cuenta» | `reto.cuentas_por_cliente` | media |
| C-LEFT-WHERE · un listado de «todos» pierde clientes | `practice.left_on` | media |
| C-NOT-IN · otro informe con cero por NOT IN | `practice.notin` | alta |

## Conceptos
`left_join`, `anti_join`, `exists`, `left_on_where`, `left_count` y `not_in_null`. Seis microlecciones de Inés y un test de 6 + 6 preguntas.
