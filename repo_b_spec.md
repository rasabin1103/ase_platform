# Especificación — "Repo B": versión clonable de `pytest-api-framework`

Documento de encargo para otro agente/desarrollador. Describe qué construir,
archivo por archivo, y por qué, para que el resultado sea coherente con todo
lo que ya funciona en ASE Platform (`test-execution` module) sin tener que
tocar el backend de ASE.

## 0. Contexto y objetivo (leer antes de tocar nada)

Existe un repo interno ("Repo A") que ASE Platform dispara hoy vía
`workflow_dispatch` cuando un comprador pulsa "Ejecutar" en
`/test-execution`. Ese repo es el que se usa para la prueba alojada
(demo/trial): el comprador nunca ve el código, solo rellena un formulario y
ve un informe.

"Repo B" es una versión distinta, pensada para venderse como acceso de
código: un comprador que ya probó el framework y quiere algo propio se lleva
este repo (vía "Use this template" de GitHub, ver §5), lo clona en su
máquina, lo modifica, y opcionalmente contribuye mejoras de vuelta mediante
pull request a una rama que un admin de ASE aprueba antes de que esa rama
quede disponible para ejecutarse desde la plataforma.

Por tanto Repo B tiene una restricción de diseño no negociable:

**El contrato de variables de entrada (nombres exactos) tiene que ser
estable y documentado**, porque ASE Platform ya tiene un buyer-facing form
generado dinámicamente a partir de un JSON (`test_input_schema_json`)
declarado por el admin en su catálogo, y ese JSON declara claves como
`base_url`, `method`, `endpoint`, etc. Esas claves llegan al workflow como
`inputs.<clave>` de GitHub Actions, y de ahí a variables de entorno del job.
Si Repo B renombra o reestructura esas claves, deja de ser compatible con
cualquier producto de catálogo ya configurado contra "Repo A" — así que
cualquier cambio de nombre debe hacerse en los dos sitios a la vez (nunca
solo en el repo).

## 1. Estructura de archivos

```
pytest-api-framework/          (o el nombre que uses para Repo B)
├── .github/
│   └── workflows/
│       └── test-dispatch.yml
├── assertions/
│   ├── __init__.py
│   └── api_assertions.py
├── clients/
│   ├── __init__.py
│   └── base_client.py
├── config/
│   ├── __init__.py
│   └── settings.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── health/
│   │   ├── __init__.py
│   │   └── test_health.py
│   └── dynamic/
│       ├── __init__.py
│       └── test_dynamic_request.py
├── utils/
│   ├── __init__.py
│   └── logger.py
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── pytest.ini
└── requirements.txt
```

## 2. `requirements.txt`

```
requests
pytest
pytest-html
pytest-metadata
jsonschema
python-dotenv
```

`jsonschema` es nuevo (necesario para la validación de esquema opcional,
§4.3). `python-dotenv` es opcional pero recomendado para que alguien pueda
correr la suite en local con un `.env` sin exportar variables a mano.

## 3. `clients/base_client.py`

Cliente HTTP fino sobre `requests`, con logging de cada petición/respuesta
(igual que ya existe hoy: método, URL, params, headers, body en el log de
salida, y en la respuesta: status, headers, tiempo, body). Debe:

- Aceptar `base_url` en el constructor (leído de `config/settings.py`).
- Exponer un método genérico `request(method, path, *, json=None, headers=None, params=None)`
  que una todos los verbos (no falta un `.get()`/`.post()` separado, pero
  pueden existir como azúcar sintáctico sobre `request`).
- Nunca lanzar excepción por un status code "malo" (4xx/5xx) — quien decide
  si un status es válido es el test, no el cliente. Solo debe fallar si la
  propia conexión falla (DNS, timeout, conexión rechazada), y en ese caso
  el error debe ser legible (qué URL, qué método, qué pasó).
- Loguear siempre, tanto en éxito como en fallo — este log es lo que ASE
  muestra en "Salida detallada", así que tiene que ser informativo sin
  necesidad de flags especiales de pytest.

## 4. Tests

### 4.1 `tests/health/test_health.py`

Un test de conectividad mínimo, sin ninguna suposición sobre la forma de la
respuesta — la lección aprendida en la iteración anterior es que un
healthcheck que asume "la respuesta es una lista" (o cualquier forma
concreta) se rompe en cuanto el comprador apunta `base_url` a una API
distinta a la que se usó para escribir el test.

```python
def test_api_healthcheck(client):
    response = client.request("GET", HEALTH_ENDPOINT)
    assert_status(response, 200)
```

Nada más. No `response.json()`, no `assert_json_content_type`, no
`assert_json_is_list`. Si `HEALTH_ENDPOINT` no está definido, saltar el test
con un mensaje claro (mismo patrón `@pytest.mark.skipif` que ya usa el test
dinámico).

### 4.2 `tests/dynamic/test_dynamic_request.py`

Este archivo básicamente ya existe y está bien diseñado — mantenlo con dos
añadidos sobre la versión actual:

1. **Imprime siempre la respuesta**, pase o falle el test (usar `print()`
   antes de cualquier `assert`, no solo loguear en el bloque de captura de
   fallo). Ya lo hace parcialmente vía `logger.info` — añade también un
   `print()` explícito con el body formateado (JSON con indentación si
   parsea, texto crudo si no), porque el step del workflow correrá con
   `-s` (ver §5) para que esto se vea siempre en el log de GitHub Actions,
   que es lo que ASE expone en "Salida detallada".

2. **Validación de esquema opcional** (`REQ_EXPECTED_SCHEMA`, JSON Schema),
   evaluada con `jsonschema.validate`, sin acoplarse a `REQ_EXPECTED_STATUS`
   — cada criterio se evalúa de forma independiente y el resultado final
   (`PASSED`/`FAILED`/`REPORTED`) combina ambos. Igual que
   `REQ_EXPECTED_STATUS`, si no se manda `REQ_EXPECTED_SCHEMA` el test no
   falla por forma de la respuesta, solo reporta.

Reglas que NO deben romperse aquí (son las que hacen que este test sirva
para "cualquier endpoint", no solo el que tenía en mente quien lo escribió):

- Nunca asumir una forma concreta del body si no se pidió expresamente vía
  `REQ_EXPECTED_SCHEMA`.
- Nunca fallar por no encontrar `REQ_ENDPOINT` — saltar (`skip`), no fallar
  (`fail`). Un `skip` en el informe de ASE se lee como "no se configuró
  este caso", un `fail` se lee como "algo está roto" — son cosas distintas
  y el buyer necesita distinguirlas.
- Siempre escribir `request_result.json` en la raíz del repo, exista o no
  `REQ_EXPECTED_STATUS`/`REQ_EXPECTED_SCHEMA` — ASE lo lee como artifact
  (ver §5) para renderizar la tarjeta de detalle de la petición.

Variables de entorno que este test lee (deben coincidir EXACTO con lo que
declares en `workflow_dispatch.inputs`, ver §5, y en el
`test_input_schema_json` del producto en el admin de ASE):

| Variable              | Obligatoria | Tipo esperado en ASE | Notas |
|-----------------------|-------------|-----------------------|-------|
| `REQ_METHOD`          | No (default `GET`) | `choice` (`GET,POST,PUT,PATCH,DELETE`) | |
| `REQ_ENDPOINT`        | No (si falta, se salta el test) | `text` | Path relativo a `BASE_URL` |
| `REQ_BODY`            | No | `json` | JSON de body |
| `REQ_HEADERS`         | No | `json` | JSON de headers puntuales |
| `REQ_PARAMS`          | No | `json` | JSON de query params |
| `REQ_EXPECTED_STATUS` | No | `text` | Si se omite, el test solo reporta |
| `REQ_EXPECTED_SCHEMA` | No | `json` | JSON Schema del body esperado |

### 4.3 `tests/conftest.py`

Fixture de sesión `client` igual que hoy (`BaseClient()` construido una vez
por sesión de pytest). No necesita cambios de fondo, solo asegúrate de que
`BASE_URL`/`HEALTH_ENDPOINT` se leen de `config/settings.py`, no
directamente de `os.environ` desde el propio conftest (mantener una sola
fuente de verdad para la configuración).

## 5. `.github/workflows/test-dispatch.yml`

Inputs de `workflow_dispatch` — el nombre de cada uno es el contrato con
ASE, no lo cambies sin avisar de que el admin tiene que actualizar
`test_input_schema_json` a la vez:

```yaml
on:
  workflow_dispatch:
    inputs:
      base_url:
        description: 'URL base de la API a probar'
        required: true
        type: string
      auth_type:
        description: 'Tipo de autenticacion'
        required: false
        type: choice
        options: [none, bearer, basic, api_key, custom]
        default: none
      method:
        description: 'Metodo HTTP del test dinamico'
        required: false
        type: choice
        options: [GET, POST, PUT, PATCH, DELETE]
      endpoint:
        description: 'Path del test dinamico (vacio = solo corre el healthcheck)'
        required: false
        type: string
      body:
        description: 'JSON body del test dinamico'
        required: false
        type: string
      headers:
        description: 'JSON headers puntuales'
        required: false
        type: string
      params:
        description: 'JSON query params'
        required: false
        type: string
      expected_status:
        description: 'Status HTTP esperado (opcional)'
        required: false
        type: string
      expected_schema:
        description: 'JSON Schema esperado del body (opcional)'
        required: false
        type: string
      test_filter:
        description: "Filtro -k de pytest (vacio = toda la suite, 'dynamic' = solo el test dinamico)"
        required: false
        type: string
```

Job `test` — puntos importantes:

- El paso de ejecución usa `-s` (además de `-v`) para que los `print()` del
  test dinámico siempre lleguen al log, pase o falle:
  ```yaml
  run: |
    if [ -n "$TEST_FILTER" ]; then
      pytest -v -s -k "$TEST_FILTER" --html=report.html --self-contained-html
    else
      pytest -v -s --html=report.html --self-contained-html
    fi
  ```
- Resolución de auth según `auth_type` (esto ya lo tenías en la versión
  original que compartiste — mantenlo igual):
  - `bearer` → header `Authorization: Bearer ${{ secrets.AUTH_TOKEN }}`
  - `basic` → `${{ secrets.AUTH_USERNAME }}` / `${{ secrets.AUTH_PASSWORD }}`
  - `api_key` → header dinámico: nombre en `${{ vars.API_KEY_HEADER }}`,
    valor en `${{ secrets.API_KEY_VALUE }}`
  - `custom` → headers libres desde `${{ vars.EXTRA_HEADERS }}` (JSON)
  - `none` → no añade nada
- **Artifacts — nombres exactos, no cambiar:**
  ```yaml
  - uses: actions/upload-artifact@v4
    if: always()
    with:
      name: pytest-report
      path: report.html
  - uses: actions/upload-artifact@v4
    if: always()
    with:
      name: request-result
      path: request_result.json
      if-no-files-found: ignore
  ```
  ASE busca el artifact cuyo nombre contiene `report` para el informe HTML
  y el que contiene `request-result`/`request_result` para la tarjeta de
  detalle de la petición — si renombras estos, ASE deja de encontrarlos
  silenciosamente (no es un error visible, simplemente esa sección del
  informe no aparece).

## 6. Protección de rama y aprobación de ejecuciones (esto no es código, es configuración del repo en GitHub — Settings)

1. **Branch protection en `main`**: exigir pull request antes de fusionar,
   exigir al menos 1 revisión aprobada, no permitir push directo (ni
   siquiera a administradores, si GitHub lo permite en tu plan).
2. **Settings → Actions → General → "Fork pull request workflows"**:
   activar la opción que exige aprobación para ejecutar workflows de
   colaboradores externos o de primera contribución. Esto es lo que impide
   que una rama con el propio archivo de workflow modificado se ejecute
   sola en cuanto alguien la empuja — sin esto, un PR malicioso podría
   intentar exfiltrar secretos del job antes de que nadie lo revise.
3. Los compradores con acceso de clonado reciben rol de colaborador con
   permiso de escritura, pero la protección de `main` (punto 1) hace que
   solo puedan crear sus propias ramas y abrir PRs, nunca escribir directo
   en `main`.

## 7. `README.md` — contenido mínimo

- Qué es este repo (un framework de test de APIs basado en pytest,
  parametrizable 100% por variables de entorno para poder dispararse desde
  una plataforma externa como ASE, o correrse en local).
- Cómo correrlo en local: `pip install -r requirements.txt`, copiar
  `.env.example` a `.env`, rellenar `BASE_URL`, `pytest -v -s`.
- Tabla de todas las variables de entorno soportadas (la del §4.2 más
  `BASE_URL`/`HEALTH_ENDPOINT`), con una frase por variable.
- Sección "Cómo se conecta esto con ASE Platform" explicando el contrato
  de nombres del §0 en una frase: *"Cada clave de `workflow_dispatch.inputs`
  debe coincidir exactamente con la clave declarada en el catálogo de ASE
  para este producto — si añades o renombras un input aquí, un admin de ASE
  tiene que reflejarlo en `test_input_schema_json`."*
- Qué hace cada artifact (`pytest-report` = informe HTML completo,
  `request-result` = JSON estructurado de la última petición dinámica).

## 8. `CONTRIBUTING.md` — contenido mínimo

- Cómo crear una rama (`git checkout -b nombre-descriptivo`).
- Que `main` está protegida — todo cambio entra por pull request.
- Qué se espera en la descripción del PR (qué cambia y por qué, si toca el
  workflow YAML decirlo explícitamente en el título del PR para que quien
  revise le preste atención extra).
- Que la aprobación del PR es necesaria pero no suficiente para que la
  rama quede disponible para ejecutarse desde ASE — eso es un paso
  administrativo aparte, gestionado desde la plataforma, no automático al
  fusionar (evita que alguien asuma "ya me lo aprobaron, ya puedo
  ejecutarlo desde la web" antes de que así sea).

## 9. Fuera de alcance para esta primera versión de Repo B

Explícitamente NO construir en esta pasada (para no sobrecargar al agente
que lo implemente):

- Autenticación OAuth con refresco de token.
- Encadenado de tests (login → usar token → operar).
- Paginación automática.
- Cualquier UI o CLI propia — este repo es solo el framework + el workflow,
  la interfaz sigue siendo el dashboard de ASE.
