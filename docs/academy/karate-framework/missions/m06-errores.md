# Misión 7 · Cuando todo falla (martes, semana 2)

Código: `frontend/src/features/academy/content/courses/karate-framework/m06-*.ts`

## Historia
Anoche se desplegó la Open API 1.7 en sandbox: confirmar una transferencia devuelve **202 PROCESSING** y se completa unos segundos después. La suite de transferencias amanece en rojo (esperaba 200 COMPLETED): no es un bug, es el cambio de contrato, y reportarlo se rechaza. Finvo empieza el jueves con transferencias reales e Iván quiere saber cómo se comporta la API cuando algo va mal.

## Novedades del motor
- `retry until <condición>` antes de `method`: repite la petición hasta que se cumple (usa `response`, `responseStatus`, `responseHeaders`); si se agotan los intentos, falla con `too many retry attempts: N` y la última respuesta.
- `configure retry = { count, interval }` y `karate.configure('retry', …)`. Por defecto 3 intentos cada 3000 ms, como Karate.
- Reloj simulado por ejecución: avanza con cada respuesta y con las esperas de `retry` (el informe muestra el tiempo total).
- API (opciones `async` y `faults`): confirmar → 202 PROCESSING, COMPLETED a los 8 s; 409 TRANSFER_ALREADY_CONFIRMED; cabecera `x-sandbox-fault: 500 | 503 | 504` (503 con Retry-After).

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Iván, chat de Sergio | 1.7 asíncrona; guía de errores en la wiki; la suite en rojo |
| 20 | Stand-up | Cómo esperar a una transferencia (retry until / sleep fijo / solo el 202) |
| 75 | Sergio | Tras la primera ejecución: «too many retry attempts: 3» no es un bug |
| 110 | Chat de Nico | Importes como texto en las pruebas de Finvo |
| 150 | Chat de Carmen | Caídas: 503 con Retry-After (activa el reto «caida») |
| 240 | Chat de Alba | El 80 % de las transferencias van a otros bancos (activa el reto «externa») |
| 450 | Decisión | ¿Transferencias a otros bancos el jueves? (la opción buena requiere haber reportado KA-ASYNC) |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos
1. **esquema** — `def` de un esquema de error (≥3 marcadores) y `match response == esquema` en escenarios de ≥2 códigos HTTP de error.
2. **negativos** — Scenario Outline con ≥4 filas de error, ≥3 códigos HTTP distintos y comprobación del `code`.
3. **asincrona** — confirmar (202) y `retry until` hasta COMPLETED; escenario en verde.
4. **basura** — `amount` como texto → 400 (revela KA-PARSE).
5. **caida** — `x-sandbox-fault: 503` → 503 y comprobación de `responseHeaders` (Retry-After).
6. **externa** — mismo flujo con un IBAN de otro banco (revela KA-ASYNC).

## Bugs
- **KA-ASYNC** (crítico): las transferencias a otros bancos se quedan en PROCESSING para siempre.
- **KA-PARSE** (medio): un importe como texto devuelve 500 con un error de Java.
- **KA-ERRFMT** (medio): el 404 de una transferencia inexistente sale con el formato por defecto del framework (sin code ni traceId).

## Solución de referencia
Ver `M06_SOLUTION_TRANSFERS` y `M06_SOLUTION_ERRORS` en `m06-lab.ts`.
