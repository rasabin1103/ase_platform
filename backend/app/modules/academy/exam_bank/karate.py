"""Evaluación final teórica del curso de Karate (bloques 11–15, 60 preguntas).

Los bloques se numeran desde 11 para no mezclarse con los capítulos del
temario CTFL (1–6) del mismo banco; el servidor los muestra como 1–5
(ExamConfig.chapter_offset). La versión en inglés está en karate_en.py
(mismos ids, la correcta primero).
"""

from app.modules.academy.exam_bank.model import q

_STATUS_ONLY = """Scenario: detalle de una cuenta
  Given url 'https://api.kobalto.test/v1/accounts/ACC-1001'
  When method get
  Then status 200
  * print response"""

_RETRY = """Given path 'transfers', id
And retry until response.status == 'COMPLETED'
When method get"""

_RUNNER = """Results results = Runner.path("classpath:openapi")
        .tags("~@ignore")
        .parallel(4);
System.out.println(results.getFailCount());"""

_MOCK = """Scenario: pathMatches('/v2/authorizations')
  * def response = { result: 'APPROVED', authCode: 'A1' }

Scenario: pathMatches('/v2/authorizations') && request.merchant == 'DENEGADO'
  * def response = { result: 'DECLINED', reason: 'INSUFFICIENT_FUNDS' }"""

_OUTLINE = """Scenario Outline: importe <amount>
  Given path 'transfers'
  And request { amount: <amount>, currency: 'EUR' }
  When method post
  Then status <status>

  Examples:
    | amount | status |
    | 0.01   | 201    |
    | 1000   | 201    |"""

QUESTIONS = [
    # ------------------------------------------------------------ 11 · Fundamentos y match
    q("c11-01", "11.1", 1, "¿Qué paso de Karate fija la parte de la URL que cambia en cada escenario, sin repetir el host?",
      "path", ["url", "param", "header"],
      "url se fija una vez (normalmente en el Background con baseUrl) y path añade los segmentos de cada petición."),
    q("c11-02", "11.1", 1, "¿Cuándo se ejecuta el Background de un feature?",
      "Antes de cada escenario del feature", ["Una sola vez, antes del primer escenario", "Después de cada escenario", "Solo si un escenario lo llama con call"],
      "El Background se repite antes de cada escenario: por eso cada escenario empieza con el mismo estado."),
    q("c11-03", "11.1", 2, "Después de «When method get», ¿qué pasa con los path, param y request que se habían fijado?",
      "Se reinician: la siguiente petición empieza sin ellos", ["Se mantienen para todas las peticiones del escenario", "Se mantienen hasta el final del feature", "Solo se reinicia el request"],
      "Como en Karate real: tras cada method se limpian path, params, cabeceras puntuales y cuerpo."),
    q("c11-04", "11.1", 3, "¿Cuál es el principal problema de este escenario?",
      "Solo comprueba el status: un 200 con datos erróneos también pasaría", ["El print hace que el escenario sea lento", "Falta un Background", "status 200 debería ir antes de method"],
      "print muestra la respuesta pero no comprueba nada; además la URL completa impide cambiar de entorno.", code=_STATUS_ONLY),
    q("c11-05", "11.2", 1, "¿Qué marcador comprueba que un campo existe y es texto, sea cual sea su valor?",
      "#string", ["#present", "#notnull", "#ignore"],
      "#string exige un string; #present solo que la clave exista; #notnull que no sea null."),
    q("c11-06", "11.2", 2, "¿Qué significa «alias: '##string'» en un esquema?",
      "alias es opcional: puede faltar o ser null; si viene, es un string", ["alias debe ser un string vacío", "alias puede ser de cualquier tipo", "alias es obligatorio y no puede ser null"],
      "El doble # marca un campo opcional (ausente o null)."),
    q("c11-07", "11.2", 2, "La respuesta tiene un campo que el esquema no recoge. ¿Qué hace «match response == esquema»?",
      "Falla: == exige exactamente las mismas claves", ["Pasa: solo compara las claves del esquema", "Pasa si el campo extra es null", "Falla solo si el campo extra es un objeto"],
      "== compara el objeto completo; para ignorar campos extra se usa contains."),
    q("c11-08", "11.2", 2, "¿Qué comprueba «match each response.items contains { status: 'ACTIVE' }»?",
      "Que todos los elementos de la lista tienen status ACTIVE", ["Que al menos uno tiene status ACTIVE", "Que la lista tiene un solo elemento", "Que status es el único campo de cada elemento"],
      "match each aplica la comparación a cada elemento; contains admite otras claves."),
    q("c11-09", "11.2", 1, "¿Qué marcador valida un array de exactamente 2 elementos?",
      "#[2]", ["#array(2)", "#[] 2", "#size2"],
      "#[n] comprueba que es un array de longitud n; #[] solo que es un array."),
    q("c11-10", "11.2", 3, "Un test valida el detalle de una cuenta con «match response contains { id: '#string' }». La API añade un campo con el número de tarjeta completo. ¿Qué pasa?",
      "Nada: contains ignora el campo extra y la fuga pasa desapercibida", ["Falla porque hay un campo nuevo", "Falla porque id no es único", "Karate avisa de datos sensibles"],
      "Para detectar campos que no deberían estar hay que comparar el contrato completo con == (o comprobar #notpresent)."),
    q("c11-11", "11.2", 2, "¿Qué expresión embebida usa en un JSON el valor de la variable accountId?",
      "'#(accountId)'", ["'${accountId}'", "'<accountId>'", "'{{accountId}}'"],
      "#(expr) se sustituye por el valor de la expresión al evaluar el JSON."),
    q("c11-12", "11.1", 2, "Un escenario falla en el segundo paso. ¿Qué ocurre con los pasos siguientes?",
      "No se ejecutan: el escenario se marca como fallido", ["Se ejecutan igualmente", "Se ejecutan solo los match", "Se repite el escenario"],
      "Un paso fallido salta el resto del escenario; los demás escenarios del feature sí se ejecutan."),

    # ------------------------------------------------------------ 12 · Configuración y datos
    q("c12-01", "12.1", 1, "¿Cuándo se ejecuta karate-config.js?",
      "Antes de cada escenario; lo que devuelve son las variables globales", ["Una vez al compilar el proyecto", "Solo cuando se llama con call", "Al final de la ejecución"],
      "karate-config.js se evalúa para cada escenario y su objeto de retorno define variables como baseUrl."),
    q("c12-02", "12.1", 2, "¿Cómo se ejecuta la suite contra preproducción sin tocar los features?",
      "Con -Dkarate.env=pre y un karate-config.js que elija la URL según karate.env", ["Cambiando url en cada Background", "Con un feature distinto por entorno", "Con una etiqueta @pre en cada escenario"],
      "karate.env llega desde el comando y la configuración decide baseUrl, claves, etc."),
    q("c12-03", "12.1", 2, "¿Dónde debe estar la clave de API de preproducción?",
      "En una propiedad del pipeline (-Dkobalto.apiKey=…) leída con karate.properties", ["Escrita en karate-config.js", "En cada feature que la use", "En un comentario del runner"],
      "Los secretos no van en el repositorio: llegan como propiedades o variables del CI."),
    q("c12-04", "12.1", 2, "¿Qué hace «header x-api-key = null»?",
      "Quita esa cabecera de la siguiente petición, aunque esté configurada para todas", ["Envía la cabecera con el texto null", "Da error de sintaxis", "Borra la cabecera de todos los escenarios"],
      "Un valor null elimina la cabecera: útil para probar que la API la exige."),
    q("c12-05", "12.2", 2, "Tras crear una transferencia, ¿cómo se consulta por su id en el mismo escenario?",
      "* def id = response.id y luego Given path 'transfers', id", ["Copiando el id del log a mano", "Con un segundo escenario que lea el id", "Con print response.id"],
      "Encadenar: se guarda lo necesario de una respuesta en una variable y se usa en la siguiente petición."),
    q("c12-06", "12.2", 1, "¿Qué hace «* def body = read('transfer.json')»?",
      "Lee el JSON y resuelve sus expresiones embebidas #(…)", ["Lo envía como petición", "Lo valida contra el contrato", "Lo escribe en el informe"],
      "read de un .json devuelve el objeto, con las expresiones embebidas evaluadas."),
    q("c12-07", "12.2", 2, "¿Qué paso cambia un campo de una variable JSON antes de enviarla?",
      "* set body.amount = 0", ["* change body.amount = 0", "* put body.amount 0", "* match body.amount = 0"],
      "set (o una asignación JavaScript) modifica la variable; remove quita una clave."),
    q("c12-08", "12.3", 2, "En un Scenario Outline, ¿para qué sirve escribir la cabecera de una columna como «amount!»?",
      "Para que el valor sea número (u otro tipo JSON) y no texto", ["Para que la columna sea obligatoria", "Para negarla en el match", "Para ocultarla en el informe"],
      "Con ! el valor de la celda se evalúa: 1000 es un número, no la cadena '1000'."),
    q("c12-09", "12.3", 3, "El límite es «hasta 1.000 € por transferencia, incluidos». ¿Qué filas son imprescindibles?",
      "1000 (se acepta) y 1000.01 (se rechaza)", ["500 y 2000", "1 y 1000000", "999 y 1001"],
      "Valores límite: justo en el borde y el valor inmediatamente fuera, con la precisión de la regla (céntimos)."),
    q("c12-10", "12.3", 2, "¿Qué hace la tabla «| read('casos.json') |» bajo Examples?",
      "Crea una fila por cada objeto del array del fichero", ["Lee el fichero una vez y lo pasa como variable", "Valida el fichero contra un esquema", "Solo funciona con ficheros CSV"],
      "Examples dinámicos: cada elemento del array es una fila, con sus tipos."),
    q("c12-11", "12.3", 3, "¿Qué falla en este esquema si el contrato admite importes de 0,01 a 1.000 €?",
      "Faltan filas fuera de los bordes (0 y 1000.01) que se deban rechazar", ["Falta una fila con 500", "Los importes deberían ir entre comillas", "No hace falta comprobar el status"],
      "Solo se prueba que se acepta lo válido; los bugs de borde aparecen justo fuera del rango.", code=_OUTLINE),
    q("c12-12", "12.2", 2, "¿Qué variable contiene las cabeceras de la última respuesta?",
      "responseHeaders", ["response.headers", "headers", "karate.headers"],
      "Cada cabecera es una lista: responseHeaders['Location'][0]."),

    # ------------------------------------------------------------ 13 · Reutilización y autenticación
    q("c13-01", "13.1", 1, "¿Qué devuelve «* def auth = call read('login.feature')»?",
      "Un objeto con las variables del feature llamado (auth.token…)", ["El texto del feature", "Solo el status de la última petición", "Nada"],
      "call devuelve las variables del llamado; sin asignar, pasan al escenario que llama."),
    q("c13-02", "13.1", 2, "Seis features usan «callonce read('login.feature')». ¿Cuántas veces se hace login en una ejecución?",
      "Seis: una por feature", ["Una", "Una por escenario", "Ninguna"],
      "callonce es una vez por feature; para una vez por ejecución está karate.callSingle."),
    q("c13-03", "13.1", 2, "¿Para qué sirve @ignore en un feature de login reutilizable?",
      "Para que no se ejecute suelto como un test; call lo sigue ejecutando", ["Para que no se pueda llamar", "Para ocultar el secreto", "Para ejecutarlo en paralelo"],
      "El runner ejecuta todos los features salvo los @ignore."),
    q("c13-04", "13.1", 2, "¿Cómo se pasa un argumento al feature llamado?",
      "* def ro = call read('login.feature') { scope: 'accounts:read' }", ["* call read('login.feature') scope=accounts:read", "* def scope = call 'accounts:read'", "No se puede: los features no reciben argumentos"],
      "El objeto tras la llamada define variables en el llamado (y __arg)."),
    q("c13-05", "13.1", 2, "Dentro del feature llamado, ¿cómo se da un valor por defecto a un argumento opcional?",
      "* def scope = karate.get('scope', 'accounts:read transfers:write')", ["* def scope = scope || 'todo'", "* default scope = 'todo'", "* def scope = __arg.scope!"],
      "karate.get devuelve la variable si existe o el valor por defecto."),
    q("c13-06", "13.2", 2, "Un token válido sin el scope necesario intenta crear una transferencia. ¿Qué código debería devolver la API?",
      "403", ["401", "400", "500"],
      "401 es «no sé quién eres»; 403 «sé quién eres, pero no puedes hacer esto»."),
    q("c13-07", "13.2", 3, "Para probar que un token revocado deja de funcionar, ¿por qué no usar el token compartido de callonce?",
      "Porque al revocarlo se rompen los demás escenarios que lo usan", ["Porque callonce no devuelve token", "Porque es más lento", "Porque la API no deja revocarlo"],
      "Un escenario que destruye un dato compartido rompe a los demás: pide un token propio con call."),
    q("c13-08", "13.2", 2, "La suite falla con 429 TOO_MANY_REQUESTS en /auth/token. ¿Qué es lo más probable?",
      "La suite pide más tokens de los que permite el límite", ["Un bug de la API", "Credenciales incorrectas", "La red del CI es lenta"],
      "El límite está documentado: hay que pedir menos tokens (callonce / callSingle)."),
    q("c13-09", "13.1", 2, "¿Dónde se suele usar karate.callSingle para el login?",
      "En karate-config.js, pasándole la configuración como argumento", ["En cada Background", "En el runner Java", "En el propio feature de login"],
      "Se ejecuta una vez por ejecución y la caché sirve a todos los features e hilos."),
    q("c13-10", "13.2", 2, "Unas credenciales incorrectas devuelven 500 con «NullPointerException». ¿Es correcto?",
      "No: debería ser un 401 limpio, sin trazas internas", ["Sí, es un error", "Sí, si el mensaje es claro", "Depende del cliente"],
      "Credenciales malas son un error esperado del cliente; un 500 con trazas además filtra detalles internos."),
    q("c13-11", "13.1", 3, "Un escenario necesita un dato que crea otro escenario del mismo feature. ¿Mejor solución?",
      "Crear el dato en el propio escenario (o con una utilidad llamada con call)", ["Ejecutar los escenarios siempre en el mismo orden", "Guardarlo en una variable global con karate.set", "Juntar los dos escenarios en uno largo"],
      "Los escenarios deben ser independientes: en paralelo o por separado, el orden no está garantizado."),
    q("c13-12", "13.2", 1, "¿Qué cabecera lleva un token OAuth2 en cada petición?",
      "Authorization: Bearer <token>", ["x-api-key: <token>", "Token: <token>", "Cookie: token=<token>"],
      "Es el esquema estándar Bearer."),

    # ------------------------------------------------------------ 14 · Errores, asíncrono y mocks
    q("c14-01", "14.1", 2, "En un caso negativo, ¿qué conviene comprobar además del status?",
      "El code del error: dos errores distintos pueden compartir status", ["Nada más", "Que el cuerpo esté vacío", "El tiempo de respuesta"],
      "ACCOUNT_NOT_FOUND y TRANSFER_NOT_FOUND son 404: el code dice cuál es."),
    q("c14-02", "14.1", 3, "Un 404 llega como { timestamp, status, error, path } y el contrato dice { code, message, traceId }. ¿Es un bug?",
      "Sí: incumple el formato común de errores aunque el status sea correcto", ["No: el status es el esperado", "Solo si el mensaje está en inglés", "No, es el formato estándar de Spring"],
      "Los partners leen code y traceId: otro formato rompe su manejo de errores."),
    q("c14-03", "14.1", 2, "¿Qué hace este fragmento?",
      "Repite el GET hasta que el estado sea COMPLETED o se agoten los intentos", ["Hace un GET y espera 3 segundos", "Repite el GET para siempre", "Falla si el primer GET no está COMPLETED"],
      "retry until va antes de method y repite la petición con el intervalo configurado.", code=_RETRY),
    q("c14-04", "14.1", 2, "Sin configurar nada, ¿cuánto reintenta retry until?",
      "3 intentos cada 3 segundos", ["10 intentos cada segundo", "Hasta que pase", "1 intento"],
      "Se cambia con configure retry = { count, interval }."),
    q("c14-05", "14.1", 3, "Una transferencia a otro banco da «too many retry attempts: 10» con 1 s de intervalo; el contrato dice que tarda hasta 8 s y las internas pasan. ¿Qué haces?",
      "Revisar la última respuesta: si sigue en PROCESSING más allá del contrato, es un bug", ["Subir a 100 intentos", "Poner un sleep de 30 s", "Quitar esa prueba"],
      "Si con el tiempo del contrato no termina, el problema está en la API, no en la espera."),
    q("c14-06", "14.1", 2, "Un importe enviado como texto («10,50») devuelve 500. ¿Qué debería devolver?",
      "400 de validación indicando el campo", ["500 está bien", "200 ignorando el importe", "404"],
      "Una entrada incorrecta del cliente es un 4xx; un 5xx indica un fallo del servidor."),
    q("c14-07", "14.1", 2, "¿Cómo compruebas que un 503 trae la cabecera Retry-After con un número?",
      "match responseHeaders['Retry-After'][0] == '#regex [0-9]+'", ["match response.Retry-After == '#number'", "header Retry-After = '#number'", "status 503 basta"],
      "Las cabeceras de la respuesta están en responseHeaders, cada una como lista."),
    q("c14-08", "14.2", 1, "¿Qué arranca un mock de Karate desde un test?",
      "karate.start({ mock: 'mocks/paynexo.feature', port: 8090 })", ["call read('mocks/paynexo.feature')", "karate.mock('paynexo')", "Runner.mock(8090)"],
      "karate.start levanta un servidor con el feature del mock y devuelve su puerto."),
    q("c14-09", "14.2", 3, "En este mock, una petición con merchant DENEGADO, ¿qué respuesta recibe?",
      "APPROVED: gana el primer escenario que se cumple", ["DECLINED: el escenario más específico gana", "Las dos", "Un error por ambigüedad"],
      "El orden importa: los casos concretos van arriba y el general al final.", code=_MOCK),
    q("c14-10", "14.2", 2, "¿Cómo simula un mock que el tercero tarda 5 segundos?",
      "* def responseDelay = 5000", ["* sleep 5000", "* def responseStatus = 504", "* configure timeout = 5000"],
      "responseDelay retrasa la respuesta del mock (ms)."),
    q("c14-11", "14.2", 3, "Tu mock aprueba todo lo que recibe y la suite está en verde. ¿Qué riesgo hay?",
      "Que enviemos peticiones que el tercero real rechazaría y no lo veamos", ["Ninguno", "Que el mock sea lento", "Que falle el runner"],
      "El mock debe validar la petición como el tercero (karate.match con un esquema) para vigilar el contrato."),
    q("c14-12", "14.2", 2, "¿Qué devuelve karate.match(request, esquema)?",
      "Un objeto { pass, message } sin hacer fallar el escenario", ["true o false", "Lanza un error si no coincide", "El esquema"],
      "Por eso sirve en las condiciones de un mock."),

    # ------------------------------------------------------------ 15 · Pipeline y framework
    q("c15-01", "15.1", 3, "Con este runner, el pipeline dice BUILD SUCCESS aunque fallen escenarios. ¿Por qué?",
      "Nadie comprueba getFailCount(): falta un assertEquals", ["parallel(4) oculta los fallos", "Falta .outputCucumberJson(true)", "El tag ~@ignore excluye los fallidos"],
      "parallel devuelve resultados; sin assert, el test JUnit pasa siempre.", code=_RUNNER),
    q("c15-02", "15.1", 2, "¿Qué ejecuta .tags(\"@pagos\", \"~@lento\")?",
      "Los escenarios @pagos que no son @lento", ["@pagos o los que no son @lento", "Solo los @lento", "Nada: es un error"],
      "Cada argumento se suma (Y); la coma dentro de un argumento es O."),
    q("c15-03", "15.1", 2, "¿Qué escenarios van en el smoke de cada pull request?",
      "Los imprescindibles y rápidos", ["Todos", "Los que fallan a menudo", "Los de rendimiento"],
      "El smoke da una señal rápida; la regresión completa va en otro job."),
    q("c15-04", "15.1", 3, "En paralelo, un test comprueba el saldo exacto de ACC-1001, que otros tests también usan. ¿Qué pasará?",
      "Pasará o fallará según el orden de ejecución", ["Pasará siempre", "Fallará siempre", "Karate lo bloquea"],
      "Datos compartidos + paralelo = test inestable. La solución: datos propios por escenario."),
    q("c15-05", "15.1", 3, "Un escenario con datos propios falla solo en paralelo y, ejecutado solo, pasa siempre. ¿Qué sospechas?",
      "Un problema de la aplicación con peticiones simultáneas", ["Que el test está mal escrito", "Que el pipeline es lento", "Nada: es normal"],
      "Si el test está aislado, el comportamiento distinto con concurrencia apunta a la API: es un bug."),
    q("c15-06", "15.1", 2, "Un test falla una de cada tres ejecuciones. ¿Qué haces primero?",
      "Investigar qué cambia entre ejecuciones", ["Reintentarlo hasta que pase", "Marcarlo @ignore", "Borrarlo"],
      "Reintentar o apagarlo esconde la causa, que puede ser del test o de la aplicación."),
    q("c15-07", "15.1", 1, "¿Qué opción del Runner genera el JSON que importan herramientas como Xray?",
      ".outputCucumberJson(true)", [".outputHtml(true)", ".reportXray(true)", ".json(true)"],
      "Para JUnit XML está .outputJunitXml(true)."),
    q("c15-08", "15.2", 2, "El mismo esquema de error está copiado en cinco features. ¿Mejor opción?",
      "Un fichero schemas/error.json leído con read() desde cada feature", ["Dejarlo así", "Copiarlo en karate-config.js como texto", "Quitar los esquemas"],
      "Un solo fichero: si el contrato cambia, se cambia en un sitio."),
    q("c15-09", "15.2", 2, "¿Qué hace que un feature sea una buena utilidad reutilizable?",
      "Tiene @ignore, hace una sola cosa y recibe argumentos", ["Tiene muchos escenarios", "Está en la carpeta del runner", "Usa print para depurar"],
      "Por ejemplo, common/cuenta-prueba.feature con el saldo como argumento."),
    q("c15-10", "15.2", 3, "Al revisar una PR de tests, ¿cuál es la pregunta más útil?",
      "¿Qué fallaría si la API se rompiera?", ["¿Pasa en tu máquina?", "¿Cuántos escenarios tiene?", "¿Usa la última versión de Karate?"],
      "Un test que no puede fallar no protege nada."),
    q("c15-11", "15.2", 2, "Una PR lleva «header Authorization = 'Bearer kbt_3f9a…'» copiado de la consola. ¿Qué le dices?",
      "Que caduca y es un secreto: el token se pide en el login o en karate-config.js", ["Que está bien si pasa", "Que lo ponga en un comentario", "Que use un token más largo"],
      "Funciona hoy en una máquina; mañana da 401. Y un secreto no va en el código."),
    q("c15-12", "15.2", 2, "¿Qué convención hace que los jobs del pipeline elijan bien los escenarios?",
      "Que todo escenario lleve @smoke o @regression", ["Nombres en inglés", "Un feature por persona", "Comentarios en cada paso"],
      "Los runners seleccionan por tags: un escenario sin tag puede quedarse fuera."),
]
