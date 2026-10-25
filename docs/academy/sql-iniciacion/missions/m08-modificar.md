# Misión 8: Cambiar datos con cuidado (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m08-*.ts`
> Ruta: `/academy/sql-iniciacion/m08-modificar`
> Tests: `engine/c5m08.test.ts` (recorrido bueno y malo, transacciones abiertas y abortadas, restaurar y trampas típicas; cada prueba con su propia base de datos modificable)

## Premisa
Jueves de la semana 2. Primer día en el **entorno de pruebas**: base de datos modificable. Wiki: «Chuleta: modificar datos sin sustos» (el ritual: SELECT → BEGIN → cambio → comprobar → COMMIT o ROLLBACK).

## Novedades de la consola
- `readOnly: false`: admite INSERT, UPDATE, DELETE y transacciones (la sesión se mantiene entre ejecuciones).
- **Restaurar la base de datos** (5 min): vuelve a los datos de partida. Lo ya cumplido se conserva.
- Aviso **«Transacción abierta: COMMIT o ROLLBACK»** cuando hay cambios sin confirmar.
- Errores nuevos traducidos: transacción abortada y ROLLBACK sin transacción. Tras varias sentencias sin filas, el resultado muestra la última («UPDATE ejecutado · 31 filas afectadas», no «BEGIN»).
- **Encargos de estado**: se comprueban con consultas de verificación sobre cómo queda la base de datos (`state`), con patrones obligatorios en la consulta (`requires`). No cuentan mientras haya una transacción abierta.

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Verificación |
|---|---|---|---|---|
| Ensayo con red | Inés | 09:00 | `BEGIN; UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito'; SELECT …; ROLLBACK;` en una ejecución | Suma de límites intacta (20.100) |
| Cliente de prueba | Laura | 09:30 | `INSERT INTO clientes (…) VALUES (41, 'Prueba', 'QA Kobalto', …)` | Fila exacta y 41 clientes |
| Cuenta de prueba | Laura | 09:30 | `INSERT INTO cuentas (…) VALUES (53, 41, …)` (moneda por defecto) | Fila exacta y 53 cuentas |
| Bloquear las caducadas | Laura | 11:30 | `UPDATE tarjetas SET estado = 'bloqueada' WHERE estado = 'activa' AND caduca_en < '2026-01-01'` | Bloqueadas: 12, 18 y 28; 32 tarjetas |
| Segmento para los que no tienen | Marta | 12:30 | `UPDATE clientes SET segmento = 'estandar' WHERE segmento IS NULL` | Ningún NULL; estandar 26, joven 7, premium 7 |
| Limpiar los datos de prueba | Laura | 13:30 | `DELETE FROM cuentas WHERE id = 53; DELETE FROM clientes WHERE id = 41;` | 40 clientes y 52 cuentas (aparece tras crear el cliente) |

Trampas que no cumplen: UPDATE sin WHERE (32 tarjetas bloqueadas), ensayo con COMMIT, `= NULL` (0 filas), segmento a todos (los premium dejan de serlo), cuenta antes que cliente y cliente antes que cuenta (clave foránea), transacción sin confirmar.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: entorno de pruebas y ensayo | Leer la chuleta | — |
| 11:00 | Diego ejecutó `UPDATE cuentas SET estado = 'bloqueada'` → «UPDATE 52» | SELECT con el mismo WHERE, BEGIN, revisar filas afectadas, COMMIT o ROLLBACK (`practice.where_first`) | «Más cuidado»; «hay copias de seguridad» |
| 15:00 | Marta: «¿borramos la cuenta cerrada en producción?» | Borrado lógico: tiene historial (`practice.softdelete`) | Borrar también sus transferencias; «sí, no sirve» |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Si me equivoco, Restaurar» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-TESTS · Laura no puede probar el alta de cuentas | `reto.cuenta_prueba` | media |
| C-CADUCADAS · las tarjetas caducadas siguen activas | `reto.bloquear_caducadas` | crítica |
| C-SEGMENTO · siguen clientes sin segmento | `reto.segmento` | media |
| C-BASURA · los datos de prueba se quedan | `reto.borrar_prueba` | media |
| C-SIN-WHERE · un UPDATE sin WHERE bloquea todas las cuentas | `practice.where_first` | crítica |
| C-HISTORIAL · se borra una cuenta con historial | `practice.softdelete` | alta |

## Conceptos
`insert`, `update`, `delete`, `where_first`, `transactions`, `fk_order` y `soft_delete`. Siete microlecciones de Inés y un test de 6 + 6 preguntas.
