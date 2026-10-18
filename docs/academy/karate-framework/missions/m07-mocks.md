# Misión 8 · El tercero que no responde (miércoles, semana 2)

Código: `frontend/src/features/academy/content/courses/karate-framework/m07-*.ts`

## Historia
El lunes se abren los pagos con tarjeta a los partners (`POST /cards/{id}/payments`). Cada pago lo autoriza Paynexo, el procesador de tarjetas, cuyo sandbox lleva caído toda la semana. El servicio de pagos se arranca en local (`http://localhost:8080/v1`) y llama a Paynexo en `localhost:8090`: ahí el alumno arranca un mock de Karate y provoca cada respuesta posible del procesador.

## Novedades del motor
- **Mocks de Karate**: `karate.start('mock.feature')` o `karate.start({ mock, port })` devuelve `{ port, url }`. Cada `Scenario` del mock es una condición (gana la primera que se cumple; `Scenario:` vacío = catch-all) con `pathMatches` (y `pathParams`), `methodIs`, `paramValue`, `paramExists`, `headerContains`, `typeContains`, `acceptContains`, `bodyPath`, y variables `request`, `requestHeaders`, `requestParams`, `requestMethod`, `requestPath`, `requestUri`. Responde con `response`, `responseStatus`, `responseHeaders` y `responseDelay`. El Background es estado global que los escenarios pueden cambiar.
- Red simulada en localhost: una petición a un puerto con mock va al mock (desde el test o desde la API, que llama hacia fuera con `net`); sin nada escuchando, `ConnectException: Connection refused`.
- Puerto fijo ocupado dos veces → `BindException` (se arranca con `callonce` de una función, que ahora se cachea por feature).
- Asignaciones JavaScript como paso (`* o.b = 1`, `* cats[id] = cat`).
- Consola: `[mock :8090] < POST /v2/authorizations {…}` y `→ status · Scenario: condición`. Los escenarios guardan `mockCalls`.
- API nueva `kobaltoPayments`: tarjetas CRD-1001/1002/1003 y pagos que llaman a Paynexo v2 (importe en céntimos, timeout de 3 s).

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Iván, chat de Sergio | Pagos el lunes; Paynexo sin sandbox; esqueleto del mock |
| 20 | Stand-up | Cómo probar sin Paynexo (mock + prueba final con el real / esperar / solo validaciones) |
| 70 | Sergio | Tras la primera ejecución: cómo leer el mock en la consola y el orden de los escenarios |
| 150 | Chat de Nico | Paynexo v2 recibe céntimos enteros (activa el reto «contrato») |
| 240 | Chat de Carmen | Timeout de 3 s: nunca aprobar sin autorización (activa el reto «lento») |
| 450 | Decisión | ¿Lanzar pagos el lunes? (la opción buena requiere haber reportado KA-TIMEOUT) |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos
1. **mock** — el mock aprueba y el pago sale 201 APPROVED.
2. **denegado** — el mock deniega y el test comprueba 422 PAYMENT_DECLINED y el `reason` (revela KA-MOTIVO).
3. **caida** — el mock responde 5xx y el servicio devuelve 502.
4. **tabla** — Scenario Outline con ≥4 filas por el mock y ≥3 códigos del servicio.
5. **lento** — `responseDelay` > 3 s y 504 (revela KA-TIMEOUT).
6. **contrato** — el mock valida la petición (`karate.match` con esquema → 400) y un pago con decimales sale 201 (revela KA-UNIDADES).

## Bugs
- **KA-TIMEOUT** (crítico): si Paynexo tarda más de 3 s, el pago se aprueba sin autorización.
- **KA-UNIDADES** (alto): se envía el importe en euros a Paynexo v2, que espera céntimos.
- **KA-MOTIVO** (medio): el motivo de la denegación se pierde (UNKNOWN).

## Solución de referencia
Ver `M07_SOLUTION_PAYMENTS` y `M07_SOLUTION_MOCK` en `m07-lab.ts`.
