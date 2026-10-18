# Misión 4 · POST y encadenar (jueves)

Código: `frontend/src/features/academy/content/courses/karate-framework/m03-*.ts`

## Historia
La beta ya está en producción. Los partners piden iniciar transferencias; Nico tiene `POST /transfers` en el sandbox y, si va bien, se abre a Finvo la semana siguiente. Primera vez que la suite mueve dinero: hay que probar lo que se guarda y su efecto, no solo el 201.

## Novedades del motor
- La API guarda estado durante cada ejecución: saldos y transferencias (`POST /transfers`, `GET /transfers/{id}`, `POST /transfers/{id}/confirm`, `GET /accounts/{id}/balance`).
- Palabras clave nuevas: `set`, `remove` y `copy`. `read()` de JSON con expresiones embebidas ya existía.

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Alba, chat de Sergio | Beta en producción; llegan las transferencias |
| 20 | Refinamiento | ¿Basta un 201? (probar el efecto / sí / desde la app del partner) |
| — | Sergio | Tras el primer POST: sacar el cuerpo a un JSON; si hay ids escritos a mano o solo status |
| 120 | Chat de Carmen | ¿Reintentos de confirmación cobran dos veces? (activa el reto «doble») |
| 240 | Chat de Alba | ¿Qué devolvemos sin saldo? (activa el reto «fondos») |
| 450 | Decisión | ¿Abrir a Finvo? (la opción buena requiere haber reportado KA-DOBLE) |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos
1. **crear** — POST con `request`: 201 y `status` PENDING.
2. **fichero** — cuerpo en `payloads/transfer.json` con `"#(…)"` y `read()`.
3. **encadenar** — `def transferId = response.id`, GET de la transferencia y match del `amount` (sin ids escritos a mano).
4. **confirmar** — saldo antes, confirmar, saldo después: baja exactamente el importe.
5. **doble** — confirmar dos veces el mismo id → 409.
6. **fondos** — importe por encima del saldo → 422 INSUFFICIENT_FUNDS.

## Bugs
- **KA-IMPORTE** (alto): se guarda sin decimales; solo se ve al leer la transferencia (la respuesta del POST repite lo enviado).
- **KA-DOBLE** (crítico): la segunda confirmación devuelve 200 y descuenta otra vez.
- **KA-FONDOS** (crítico): acepta transferencias por encima del saldo.

## Solución de referencia
Ver `M03_SOLUTION_FEATURE` y `M03_SOLUTION_PAYLOAD` en `m03-lab.ts`.
