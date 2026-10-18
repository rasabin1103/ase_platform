# Misión 10 · Tu framework (viernes, semana 2)

Código: `frontend/src/features/academy/content/courses/karate-framework/m09-*.ts`

## Historia
Sergio se va dos semanas de vacaciones y la suite pasa al alumno. Ha crecido deprisa: login con `callonce` copiado en seis features (seis tokens contra un límite de cinco: el último feature da 429), esquemas pegados, cuentas de prueba creadas a mano. Iker, QA junior recién llegado, abre su primera PR (`cards.feature`): URLs y un token copiados de la consola, tres escenarios iguales, `print` en lugar de `match`. El lunes /cards se abre a los partners.

## Novedades del motor y del IDE
- `karate.callSingle(ruta, arg)`: una vez por ejecución (todos los features e hilos), sin karate-config.js en el llamado (le llega `arg`). Uso típico en `karate-config.js` con `karate.configure('headers', …)`.
- `karate-config.js` editable en esta misión.
- **Nuevo fichero** en el explorador del IDE (`newFiles.root`): rutas `.feature`, `.json` o `.js` bajo `src/test/java/`; los ficheros propios se pueden borrar.
- Mal olor nuevo `hardcoded-token` (`header Authorization = 'Bearer …'` literal).
- API (opción `cards`): `GET /cards?accountId=` y `GET /cards/{id}` con token; bugs KA-PAN y KA-CARDFILTER.
- NPC nuevo: Iker Medina (QA Automation junior).

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Iván, chat de Sergio | La suite es tuya; 429; PR de tarjetas; /cards el lunes |
| 20 | Stand-up | Cómo dejarla mantenible (centralizar y convenciones / copiar ejemplos / reescribir) |
| 30 | Chat de Iker | Su primera PR (activa «revision») |
| 60 | Sergio (tras ejecutar) | callonce vs callSingle |
| 120 | Chat de Iván | Convenciones en la wiki (activa «convenciones») |
| 300 | Sergio | Lanza el nocturno antes de irme (activa «final») |
| 450 | Decisión | ¿/cards a los partners el lunes? (la opción buena requiere haber reportado KA-PAN) |
| 480 | Último café con Sergio | Cierre del curso |

## Retos
1. **callsingle** — `karate.callSingle` en karate-config.js, un solo token en toda la ejecución, sin 429 y ≥5 features autenticados.
2. **revision** — `cards.feature` sin URLs ni tokens, sin copias, sin malos olores, comprobando el cuerpo, con detalle y lista (revela KA-PAN y KA-CARDFILTER).
3. **esquemas** — un JSON en `schemas/` con marcadores, leído desde ≥2 features, suite en verde.
4. **utilidades** — feature `@ignore` que crea cuentas de prueba, llamado desde ≥2 features.
5. **convenciones** — todo escenario con @smoke o @regression; ningún feature con URLs completas ni tokens.
6. **final** — nocturno con ≥15 escenarios, en paralelo, con assert y sin fallos de los tests.

## Bugs
- **KA-PAN** (crítico): el detalle de una tarjeta incluye el número completo.
- **KA-CARDFILTER** (crítico): la lista por cuenta devuelve tarjetas de otros clientes.

## Solución de referencia
`M09_SOLUTION` en `m09-lab.ts` (karate-config.js, features, `openapi/schemas/error.json`, `openapi/schemas/card.json` y `common/cuenta-prueba.feature`).
