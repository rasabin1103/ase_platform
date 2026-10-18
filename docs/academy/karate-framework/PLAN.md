# Curso 3 · Karate Framework: automatización de APIs

Clave del curso: `karate-framework` · Nivel: intermedio · 10 misiones · ~10 h

## 1. Idea

El alumno escribe **código Karate de verdad** en un IDE dentro del navegador y lo ejecuta contra la **Kobalto Open API**, una API simulada con bugs sembrados. No hay vídeos ni pantallas de teoría: cada misión es una jornada de trabajo en el squad de Open API de Kobalto, con correos, chats, reuniones, una wiki con la documentación de la API y un mentor (Sergio Navas, QA Automation).

Lo que se escribe en el IDE es Karate estándar: se puede copiar a un proyecto Maven/Gradle con Karate 1.4+ y funciona igual (salvo la URL de la API).

Continuidad con los otros cursos: mismo mundo (Kobalto, neobanco ficticio), mismos personajes. El alumno ya hizo Fundamentos y QA Profesional; ahora pasa a automatizar.

## 2. Mecánica

- **IDE** (herramienta «app» con `appId: 'karate-ide'`): explorador de ficheros, editor con resaltado de Karate y números de línea, botón **Ejecutar** (Ctrl/Cmd + Enter), consola con el log de Karate (`1 > GET …`, `1 < 200`), informe por escenario y la lista de **retos** de la misión.
- **Retos**: objetivos verificables de la misión (p. ej. «smoke test de /health»). Se comprueban automáticamente sobre el resultado de la ejecución: qué peticiones hizo cada escenario, qué `match` usó y si pasó. Cada reto cumplido activa un flag `reto.<id>`.
- **Bugs que encuentran los tests**: la API tiene bugs sembrados. Un escenario **revela** un bug cuando falla y el mismo escenario pasaría contra la API sin ese bug (el motor lo vuelve a ejecutar en limpio). Es la regla general: no hay comprobaciones a medida por bug.
- **Evidencia**: cada escenario ejecutado queda en los logs de la jornada. El bug se reporta con el formulario de siempre adjuntando el escenario que falló; el dev lo arregla tras un tiempo y el alumno puede verificarlo volviendo a ejecutar.
- **Fallos que no son bugs**: un test mal escrito o un cambio de contrato documentado también ponen el escenario en rojo, pero no revelan ningún bug. Reportarlo se rechaza («la evidencia muestra un comportamiento conforme a la especificación»). Distinguir uno de otro es parte del aprendizaje.
- **Tiempo**: ejecutar cuesta minutos de jornada (3 la primera vez por ejecución, 1 por escenario adicional). Escribir código no consume tiempo.
- **Calidad del código**: el motor detecta malos olores (escenario sin aserciones, URL completa en `path`, `print` en lugar de `match`…) y el mentor los comenta.

## 3. El intérprete

Escrito en TypeScript (`features/academy/karate/`), sin dependencias ni `eval`:

- **Parser** de Gherkin/Karate: `Feature`, descripción, `Background`, `Scenario`, `Scenario Outline` + `Examples`, tags, comentarios, docstrings `"""` y tablas.
- **Pasos Karate soportados (v1)**: `url`, `path`, `param`, `params`, `header`, `headers`, `request`, `method`, `status`, `match` (`==`, `!=`, `contains`, `!contains`, `contains only`, `contains any`, `contains deep`, `match each`), `def`, `assert`, `print`.
- **Marcadores difusos**: `#ignore #null #notnull #present #notpresent #array #object #boolean #number #string #uuid #regex #? expr`, opcionales con `##`, arrays `#[]`, `#[n]`, `#[] #string`, expresiones embebidas `#(var)`.
- **JavaScript**: subconjunto propio interpretado (literales, objetos, arrays, operadores, ternario, acceso a propiedades, métodos de string/array habituales, funciones flecha) con límite de pasos para evitar bucles infinitos. Sin acceso a `window`, red ni almacenamiento.
- **Desde la misión 3**: `karate-config.js` editable y ejecutado antes de cada escenario, `karate.env` (selector en el IDE), `karate.properties`, `karate.configure('headers', …)`, `configure headers`, `header X = null`, `karate.abort()`, `responseHeaders`.
- **Desde la misión 4**: la API guarda estado durante cada ejecución (saldos y transferencias); `set`, `remove` y `copy`.
- **Desde la misión 5**: Examples dinámicos (`| read('datos.json') |`), `karate.merge`, reglas de límites en la API y detección de escenarios copiados.
- **Desde la misión 6**: `call` y `callonce` de features (con argumentos y ámbito compartido), `karate.get`, `@ignore`, OAuth2 en la API (tokens con scopes, revocación y límite de 5 tokens/min).
- **Desde la misión 7**: `retry until`, `configure retry` (count/interval), reloj simulado por ejecución; transferencias asíncronas (202 PROCESSING) y fallos simulados con `x-sandbox-fault` en la API.
- **Desde la misión 8**: mocks de Karate (`karate.start`, escenarios-condición con `pathMatches`/`methodIs`…, `response*` y `responseDelay`, estado en el Background), red simulada en localhost, `callonce` de funciones y asignaciones JS como paso. Servicio de pagos local (`kobaltoPayments`) que llama al procesador Paynexo.
- **Desde la misión 9**: botón «Pipeline» con jobs (PR · smoke / nocturno), lectura de runners JUnit 5 (`Runner.path…tags…parallel`, assert de `getFailCount()`, informes), ejecución en paralelo paso a paso con orden según la semilla, `root`/`tagGroups` y cuentas de prueba en el sandbox (`POST /sandbox/accounts`).
- **Desde la misión 10**: `karate.callSingle`, karate-config.js editable, ficheros nuevos creados por el alumno en el IDE, mal olor `hardcoded-token`; tarjetas en la API (`GET /cards`).

## 4. La API simulada (Kobalto Open API)

`https://api.kobalto.test/v1`. Datos de ejemplo deterministas.

| Endpoint | Uso |
| --- | --- |
| `GET /health` | estado y versión |
| `GET /accounts` (`status`, `page`, `size`) | lista paginada |
| `GET /accounts/{id}` | detalle de una cuenta; 404 `ACCOUNT_NOT_FOUND`, 400 `INVALID_ACCOUNT_ID` |
| `GET /accounts/{id}/balance` | saldo disponible |
| `POST /transfers`, `GET /transfers/{id}`, `POST /transfers/{id}/confirm` | transferencias con estado por ejecución; el saldo refleja las confirmadas (misión 4) |
| Host de pre `api.pre.kobalto.test` | otros datos (ACC-2001…), `x-api-key` obligatoria, eco de `x-correlation-id` (misión 3) |
| `POST /auth/token`, `POST /auth/revoke` | OAuth2 con scopes y límite de 5 tokens/min (misión 6) |
| Confirmar → 202 PROCESSING, cabecera `x-sandbox-fault` | transferencias asíncronas (8 s) y caídas simuladas 500/503/504 (misión 7) |
| Servicio de pagos local `http://localhost:8080/v1`: `GET /cards/{id}`, `POST /cards/{id}/payments` → Paynexo en `localhost:8090` | mocks (misión 8) |

La API conoce los bugs activos de la partida y la versión desplegada (flags de la misión, p. ej. `api.v15`).

## 5. Temario

| # | Id | Título | Qué se aprende |
| --- | --- | --- | --- |
| 1 | `m00-hola-karate` | Hola, Karate | Anatomía de un feature, `url`/`path`/`method`/`status`, primer `match`, Background, leer el log. Primer bug encontrado por un test. |
| 2 | `m01-match` | Match, tu superpoder | Validación de contrato: marcadores difusos, esquemas con `def`, `match each`, `contains`, opcionales `##`, cambios de contrato compatibles e incompatibles. |
| 3 | `m02-config` | Un test, tres entornos | `karate-config.js`, `karate.env`, variables, cabeceras comunes, `configure headers`. |
| 4 | `m03-payloads` | POST y encadenar | `request`, expresiones embebidas, `read()` de JSON, crear y consultar (encadenar respuestas). |
| 5 | `m04-datos` | Dirigido por datos | `Scenario Outline`, `Examples` con tablas y JSON, valores límite de importes. |
| 6 | `m05-auth` | Tokens y reutilización | `call`/`callonce`, feature de login, `Authorization`, tags `@ignore`. |
| 7 | `m06-errores` | Cuando todo falla | Casos negativos, esquemas de error, `retry until`, `assert`, utilidades `karate.*`. |
| 8 | `m07-mocks` | El tercero que no responde | Mocks de Karate para el procesador de tarjetas, dobles de prueba. |
| 9 | `m08-pipeline` | Verde en el pipeline | Runner JUnit 5, `parallel()`, tags `@smoke`, informes, tests inestables, CI. |
| 10 | `m09-framework` | Tu framework | Estructura de proyecto, utilidades JS/Java, convenciones, revisión de código de otros. Suite final. |

Evaluación final: examen práctico (misión `m10-examen`) + evaluación teórica, y certificado (ver missions/m10-examen.md).

## 6. Primera entrega (16 oct 2026)

- Intérprete v1 + API simulada (cuentas) + IDE.
- Misiones 1 y 2 en español, jugables de principio a fin.
- Curso registrado en la lista (selector «Curso interactivo» del catálogo): misiones 3–10 aparecen como «próximamente».
- Pendiente para la siguiente tanda: misiones 3–10, versión en inglés, simulacro práctico y certificado.

## Entregas
- 16 oct: misiones 1 y 2.
- 16 oct (tarde): misión 3 «Un test, tres entornos» y soporte de karate-config.js y entornos en el motor.
- 16 oct (noche): misión 4 «POST y encadenar» y API de transferencias con estado.
- 17 oct: misión 5 «Dirigido por datos».
- 17 oct: misión 6 «Tokens y reutilización».
- 17 oct: misión 7 «Cuando todo falla».
- 17 oct: misión 8 «El tercero que no responde».
- 17 oct: misión 9 «Verde en el pipeline».
- 17 oct: misión 10 «Tu framework». Curso completo (10 misiones en español).
- 17 oct: evaluación final: examen práctico en el IDE (misión `m10-examen`, aprobado 70/100) y evaluación teórica (30 preguntas, 45 min, aprobado 20) con certificado ASE-KAR. Ver missions/m10-examen.md.
