# Misión 9 · Verde en el pipeline (jueves, semana 2)

Código: `frontend/src/features/academy/content/courses/karate-framework/m08-*.ts`

## Historia
El job nocturno salió verde con escenarios en rojo: el runner de Sergio imprime los fallos pero no hace fallar el test JUnit. Desde que lo puso en paralelo (`.parallel(4)`), el test del saldo falla a veces: comprueba el saldo exacto de ACC-1001, que otros escenarios cambian a la vez. Los devs piden un smoke en cada PR (< 3 s) y el viernes la 1.7 sube a producción con Finvo llamando en paralelo.

## Novedades del motor y del IDE
- **Botón «Pipeline»** con selector de job (PR · smoke / Nocturno · regresión): ejecuta el runner Java del job como CI. Banner con `mvn test -Dtest=…`, hilos, tags, duración, informes y **BUILD SUCCESS/FAILURE** (con aviso de «verde con fallos»). Cuesta 10 min de jornada.
- Lectura de runners JUnit 5 (`karate/pipeline.ts`): `Runner.path("classpath:…")`, `.tags(…)` (argumentos = Y, comas = O, `~` = sin), `.parallel(n)`, `assertEquals(0, results.getFailCount(), …)`, `.outputCucumberJson(true)` / `.outputJunitXml(true)`; errores de compilación básicos (llaves, `;`, imports de Assertions, `Results results`). `Karate.run` con `@Karate.Test` cuenta como secuencial y con fallos que rompen el build.
- **Ejecución en paralelo**: los escenarios se reparten entre hilos con reloj propio y avanzan paso a paso por orden de reloj sobre la misma API; el orden y el arranque dependen de la semilla (= número de ejecución del pipeline), así que cambian de una ejecución a otra. Los escenarios empiezan con `[hilo N]` en la consola.
- `RunOptions`: `root`, `tagGroups`, `parallel`; `RunResult.wallMs`.
- Racha por job en el estado del IDE (ejecuciones seguidas sin fallos achacables a los tests); contexto `pipeline` en los retos.
- API (opción `sandboxData`): `POST /sandbox/accounts` crea cuentas de prueba (ACC-9001…); confirmar comprueba el saldo disponible (422 INSUFFICIENT_FUNDS).

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Iván, chat de Sergio | Nocturno verde con fallos, smoke de PR, producción el viernes; botón Pipeline |
| 20 | Stand-up | Test que falla a veces (investigar la causa / reintentar hasta que pase / @ignore) |
| — | Sergio (con «verde con fallos») | Falta el assert sobre getFailCount() |
| 90 | Sergio (tras lanzar el pipeline) | El orden cambia en cada ejecución: ¿qué comparte el test? |
| 150 | Chat de Carmen | Dos transferencias pendientes y un saldo (activa «reserva») |
| 240 | Chat de Alba | Resultados en Xray (activa «informe») |
| 450 | Decisión | ¿La 1.7 a producción el viernes? (la opción buena requiere haber reportado KA-SEQ) |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos
1. **assert** — el nocturno compila y comprueba `getFailCount()` (lanzado en el pipeline).
2. **smoke** — job de PR: ≥3 escenarios @smoke, todos pasan, BUILD SUCCESS en menos de 3 s.
3. **aislado** — el test del saldo crea su cuenta (`POST /sandbox/accounts`), transfiere desde ella y comprueba su saldo.
4. **estable** — 3 ejecuciones seguidas del nocturno (≥2 hilos) sin fallos achacables a los tests.
5. **reserva** — cuenta de 100, dos transferencias de 80, la segunda confirmación 422 (revela KA-RESERVA).
6. **informe** — `.outputCucumberJson(true)` en el nocturno.

## Bugs
- **KA-SEQ** (crítico): ids de transferencia generados con el reloj (resolución de 25 ms); dos creaciones simultáneas comparten id y una pisa a la otra. Solo aparece en paralelo y no en todas las ejecuciones; el escenario, ejecutado solo, pasa (así lo revela el motor).
- **KA-RESERVA** (alto): el saldo solo se comprueba al crear; confirmar dos pendientes deja la cuenta en negativo.

## Solución de referencia
Ver `M08_SOLUTION_NIGHTLY`, `M08_SOLUTION_ACCOUNTS` y `M08_SOLUTION_TRANSFERS` en `m08-lab.ts`.
