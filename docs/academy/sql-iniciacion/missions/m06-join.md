# Misión 6: Unir tablas (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m06-*.ts`
> Ruta: `/academy/sql-iniciacion/m06-join`
> Tests: `engine/c5m06.test.ts` (recorrido bueno y malo, datos de cada encargo y trampas típicas contra PostgreSQL real)

## Premisa
Martes de la semana 2. Las preguntas cruzan tablas. Wiki: «Mapa de tablas y claves». Los encargos exigen `JOIN` en la consulta: buscar un id a mano y copiarlo no vale. La misión destapa un bug real: tarjetas caducadas que siguen activas.

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| Cada cuenta con su titular | Inés | 09:00 | `FROM cuentas a JOIN clientes c ON a.cliente_id = c.id` | 52 filas |
| La tarjeta de un cliente | Nuria | 09:30 | tarjetas → cuentas → clientes `WHERE c.email = 'pablo.gil34@mail.com'` | caducada en 2024 y activa |
| Rechazadas con su IBAN | Diego | 10:15 | `transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id WHERE t.estado = 'rechazada'` | 7 |
| Quién envió las grandes | Carmen | 11:30 | transferencias → cuentas → clientes `WHERE t.importe > 10000` | 4 |
| Saldo total por ciudad | Marta | 12:30 | JOIN + `GROUP BY c.ciudad` con `SUM(a.saldo)` | 7 (Madrid, un tercio) |
| Tarjetas caducadas activas | Laura | 13:30 | tres tablas `WHERE t.estado = 'activa' AND t.caduca_en < '2026-01-01'` | 2 |

Trampas que no cumplen: producto cartesiano (`FROM cuentas, clientes`), unir por la clave equivocada (`a.id = c.id`), buscar el id de la tarjeta a mano, unir por `cuenta_destino_id`, olvidar el estado en las caducadas. Columnas sin alias que existen en dos tablas (`id`, `estado`) dan el error de columna ambigua, traducido.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: claves y JOIN | Leer el mapa de tablas | — |
| 11:00 | `FROM cuentas, clientes` da 2.080 filas | Producto cartesiano: falta el ON (`practice.on`) | DISTINCT; LIMIT 52 |
| 15:00 | Contar clientes a través del JOIN da 39 | INNER JOIN deja fuera al cliente sin cuentas (`practice.inner`) | Culpar al DISTINCT; «lo habrán dado de baja» |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Cruzar a mano» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-LLAMADA · el cliente sigue sin poder pagar | `reto.tarjeta_cliente` | alta |
| C-LOGS · rechazadas sin rastrear | `reto.rechazadas_iban` | media |
| C-DOCUMENTACION · Riesgos no sabe a quién preguntar | `reto.grandes_ordenante` | alta |
| C-OFICINAS · plan sin saldo por ciudad | `reto.saldo_ciudad` | media |
| C-CADUCADAS · tarjetas caducadas activas sin detectar | `reto.caducadas_activas` | crítica |
| C-CARTESIANO · una consulta sin ON tumba la réplica | `practice.on` | alta |
| C-PERDIDO · «hay 39 clientes» | `practice.inner` | media |

## Conceptos
`foreign_keys`, `inner_join`, `join_condition`, `table_alias`, `multi_join` e `inner_drops`. Seis microlecciones de Inés y un test de 6 + 6 preguntas.
