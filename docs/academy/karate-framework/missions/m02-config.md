# Misión 3 · Un test, tres entornos (miércoles)

Código: `frontend/src/features/academy/content/courses/karate-framework/m02-*.ts`

## Historia
Mañana la Open API sale a producción. Iván (DevOps) ha montado el pipeline: desplegar en pre → ejecutar la suite contra pre → promocionar. La suite solo sabe hablar con el sandbox. Pre tiene otra URL, otros datos (ACC-2001…) y exige `x-api-key`, que llega como propiedad del sistema `kobalto.apiKey` y no puede estar en el código.

## Novedades del motor
- `karate-config.js` es editable y se ejecuta antes de cada escenario (como en Karate), con `karate.env`, `karate.properties`, `karate.configure('headers', …)` y `karate.log`.
- Selector `-Dkarate.env=` en el IDE (sandbox / pre). En pre, el IDE pasa `kobalto.apiKey` como haría el pipeline.
- `header X = null` quita una cabecera (también las configuradas); `karate.abort()` termina el escenario sin fallo.
- La API tiene host de preproducción con sus datos, clave obligatoria y eco de `x-correlation-id`.
- El IDE detecta la clave pegada en cualquier fichero (flag `smell.hardcoded-secret`).

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Iván, chat de Sergio | Pipeline, pre y la clave |
| 20 | Reunión | Cómo correr la suite en todos los entornos (config por entorno / copiar features / cambiar URL a mano) |
| 60 | Chat de Nico | Te pasa la clave en claro (tentación) |
| — | Carmen | Si la clave aparece en el código: hay que rotarla (riesgo −1) |
| 150 | Chat de Carmen | Prueba de que sin clave no hay datos (activa el reto «sinclave») |
| 240 | Chat de Alba | Id de correlación para los partners (activa el reto «correlacion») |
| 450 | Go/no-go | Promocionar a producción (la opción buena requiere haber reportado KA-KEY) |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos
1. **entornos** — la config elige la URL según `karate.env` y se ejecuta en pre.
2. **clave** — `x-api-key` con `configure headers`, no escenario a escenario.
3. **secreto** — la clave sale de `karate.properties`, nunca escrita en el código.
4. **datos** — misma suite en verde en sandbox y en pre (o fallando solo por bugs), sin ids fijos.
5. **sinclave** — en pre, detalle sin clave → 401 (`header x-api-key = null`, `karate.abort()` fuera de pre).
6. **correlacion** — `x-correlation-id` en todas las peticiones y comprobado en `responseHeaders`.

## Bugs
- **KA-KEY** (crítico): pre devuelve el detalle de una cuenta sin clave. Lo revela la prueba negativa.
- **KA-CORR** (medio): pre no devuelve `x-correlation-id`.

## Solución de referencia
`karate-config.js`:
```
function fn() {
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001',
    correlationId: 'qa-' + env + '-001'
  };
  var headers = { 'x-correlation-id': config.correlationId };
  if (env == 'pre') {
    config.baseUrl = 'https://api.pre.kobalto.test/v1';
    config.accountId = 'ACC-2001';
    headers['x-api-key'] = karate.properties['kobalto.apiKey'];
  }
  karate.configure('headers', headers);
  return config;
}
```
Escenarios nuevos del feature:
```
  Scenario: el id de correlación vuelve en la respuesta
    Given path 'health'
    When method get
    Then status 200
    And match responseHeaders['x-correlation-id'][0] == correlationId

  Scenario: sin clave no hay datos
    * if (karate.env != 'pre') karate.abort()
    Given path 'accounts', accountId
    And header x-api-key = null
    When method get
    Then status 401
    And match response.code == 'MISSING_API_KEY'
```
Y en el detalle de cuenta: `Given path 'accounts', accountId`.
