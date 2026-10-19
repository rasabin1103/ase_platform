/**
 * Mensajes del intérprete de Karate en inglés.
 *
 * El motor (runner, js, parser, pipeline, APIs simuladas) genera sus errores y
 * logs en español; para las misiones en inglés se traducen al final de cada
 * ejecución (ver `localizeRun`), sin tocar la evaluación: los retos nunca
 * dependen del texto de un mensaje. Al añadir un mensaje nuevo en español,
 * añade aquí su patrón (lo comprueba messagesEn.test.ts).
 */
import type { RunResult } from './runner'

type Rule = [RegExp, string]

const RULES: Rule[] = [
  // --- runner: rutas, ficheros y llamadas
  [/ruta JSON no válida: /g, 'invalid JSON path: '],
  [/filtro JSONPath no soportado: /g, 'unsupported JSONPath filter: '],
  [/karate-config\.js debe contener una función: function fn\(\) \{ … return config; \}/g, 'karate-config.js must contain a function: function fn() { … return config; }'],
  [/karate-config\.js debe devolver un objeto \(return config\)/g, 'karate-config.js must return an object (return config)'],
  [/no se encuentra el fichero: /g, 'file not found: '],
  [/: JSON no válido \(/g, ': invalid JSON ('],
  [/call: los argumentos tienen que ser un objeto JSON \(p\. ej\. /g, 'call: the arguments must be a JSON object (e.g. '],
  [/resultado en caché \(no se vuelve a ejecutar\)/g, 'cached result (not executed again)'],
  [/resultado en caché \(una vez por ejecución\)/g, 'cached result (once per run)'],
  [/call: se esperaba read\('algo\.feature'\) o una función/g, "call: expected read('something.feature') or a function"],
  [/call: demasiadas llamadas anidadas \(¿un feature que se llama a sí mismo\?\)/g, 'call: too many nested calls (a feature calling itself?)'],
  [/ \(línea (\d+)\)/g, ' (line $1)'],
  [/: no hay escenarios con @/g, ': no scenarios tagged @'],
  [/: no hay escenarios/g, ': no scenarios'],
  [/:(\d*) falló\n/g, ':$1 failed\n'],
  [/^falta el valor$/g, 'missing value'],
  [/todavía no hay respuesta: «\$» se refiere a la última respuesta \(falta «method»\)/g, 'no response yet: «$» refers to the last response (missing «method»)'],
  [/escenario terminado sin ejecutar el resto de pasos/g, 'scenario ended without running the remaining steps'],
  [/la variable «([^»]+)» no existe \(créala antes con def\)/g, 'variable «$1» does not exist (create it first with def)'],
  [/url: se esperaba un string y llegó /g, 'url: expected a string but got '],
  [/path: falta el valor/g, 'path: missing value'],
  [/path: un segmento es null/g, 'path: a segment is null'],
  [/param: usa «param nombre = valor»/g, 'param: use «param name = value»'],
  [/params: se esperaba un objeto JSON/g, 'params: expected a JSON object'],
  [/header: usa «header Nombre = valor»/g, 'header: use «header Name = value»'],
  [/headers: se esperaba un objeto JSON/g, 'headers: expected a JSON object'],
  [/: usa «(\w+) nombre =» con un docstring/g, ': use «$1 name =» with a docstring'],
  [/status: se esperaba un código de 3 cifras \(p\. ej\. «status 200»\)/g, 'status: expected a 3-digit code (e.g. «status 200»)'],
  [/status: todavía no hay respuesta \(falta «method» antes\)/g, 'status: no response yet (missing «method» before it)'],
  [/def: usa «def nombre = valor»/g, 'def: use «def name = value»'],
  [/def: nombre de variable no válido /g, 'def: invalid variable name '],
  [/def: «([^»]+)» es una variable reservada de Karate/g, 'def: «$1» is a reserved Karate variable'],
  [/set: usa «set variable\.campo = valor»/g, 'set: use «set variable.field = value»'],
  [/set: la variable «([^»]+)» no existe \(créala antes con def\)/g, 'set: variable «$1» does not exist (create it first with def)'],
  [/copy: usa «copy nueva = existente»/g, 'copy: use «copy newName = existing»'],
  [/remove: usa «remove variable\.campo»/g, 'remove: use «remove variable.field»'],
  [/configure: usa «configure clave = valor»/g, 'configure: use «configure key = value»'],
  [/configure: clave no soportada /g, 'configure: unsupported key '],
  [/: falta qué llamar \(p\. ej\. /g, ': missing what to call (e.g. '],
  [/retry: usa «retry until condición» antes de «method»/g, 'retry: use «retry until condition» before «method»'],
  [/configure retry: se esperaba un objeto /g, 'configure retry: expected an object '],
  [/configure retry: clave no soportada «([^»]+)» \(usa count e interval\)/g, 'configure retry: unsupported key «$1» (use count and interval)'],
  [/configure retry: count debe ser un entero entre 1 y 100/g, 'configure retry: count must be an integer between 1 and 100'],
  [/method: método HTTP no válido «([^»]+)» \(usa get, post, put, patch o delete\)/g, 'method: invalid HTTP method «$1» (use get, post, put, patch or delete)'],
  [/url no válida: /g, 'invalid url: '],
  [/la condición dio error: /g, 'the condition threw an error: '],
  [/\ncondición: /g, '\ncondition: '],
  [/\núltima respuesta \(/g, '\nlast response ('],
  [/karate\.callSingle: no se encuentra /g, 'karate.callSingle: not found: '],
  [/karate\.start: usa karate\.start\(/g, 'karate.start: use karate.start('],
  [/'\) o karate\.start\(\{ mock: /g, "') or karate.start({ mock: "],
  [/karate\.start: no se encuentra el mock /g, 'karate.start: mock not found: '],
  [/karate\.start: port debe ser un número de puerto/g, 'karate.start: port must be a port number'],
  [/\(puerto ([^:)]+): ya hay un mock arrancado ahí; arráncalo una sola vez con callonce\)/g, '(port $1: a mock is already running there; start it only once with callonce)'],
  [/: el Background del mock falló\n/g, ": the mock's Background failed\n"],
  [/ arrancado en http:/g, ' started on http:'],
  [/match: no encuentro el operador \(==, !=, contains…\)/g, 'match: operator not found (==, !=, contains…)'],
  [/match: falta el lado izquierdo/g, 'match: missing left-hand side'],
  [/match: falta el valor esperado/g, 'match: missing expected value'],
  [/la condición «([^»]+)» dio error: /g, 'the condition «$1» threw an error: '],
  [/: (?:falló)$/g, ': failed'],
  [/ · ningún escenario coincide/g, ' · no scenario matches'],
  [/no se pueden hacer peticiones al calcular los Examples/g, 'requests are not allowed while computing the Examples'],
  [/Examples dinámicos: «([^»]+)» debe devolver una lista de objetos/g, 'Dynamic Examples: «$1» must return a list of objects'],
  [/Examples dinámicos: el elemento (\d+) no es un objeto/g, 'Dynamic Examples: item $1 is not an object'],
  [/Examples dinámicos sin contexto de ejecución/g, 'Dynamic Examples without an execution context'],
  [/ejecución en paralelo: demasiados pasos/g, 'parallel execution: too many steps'],
  [/^\[hilo ([^\]]+)\]$/g, '[thread $1]'],
  // --- APIs simuladas
  [/ \(¿falta \/v1 en la url\?\)/g, ' (missing /v1 in the url?)'],
  [/ \(¿falta request\?\)/g, ' (missing request?)'],
  // --- js: subconjunto de JavaScript
  [/carácter inesperado /g, 'unexpected character '],
  [/se esperaba «([^»]*)» y llegó «fin»/g, 'expected «$1» but reached the end'],
  [/se esperaba «([^»]*)» y llegó /g, 'expected «$1» but got '],
  [/se esperaba «;» antes de /g, 'expected «;» before '],
  [/se esperaba un nombre y llegó /g, 'expected a name but got '],
  [/función sin cerrar/g, 'unclosed function'],
  [/asignación a algo que no es una variable/g, 'assignment to something that is not a variable'],
  [/se esperaba un nombre de propiedad después de «\.»/g, 'expected a property name after «.»'],
  [/las plantillas etiquetadas no están soportadas/g, 'tagged templates are not supported'],
  [/número no válido: /g, 'invalid number: '],
  [/clave de objeto no válida: /g, 'invalid object key: '],
  [/se esperaba «:» en el objeto/g, 'expected «:» in the object'],
  [/expresión incompleta/g, 'incomplete expression'],
  [/símbolo inesperado /g, 'unexpected token '],
  [/sobra código después de la expresión/g, 'unexpected code after the expression'],
  [/no se puede reasignar la constante /g, 'cannot reassign constant '],
  [/la ejecución superó el límite de pasos \(¿un bucle infinito\?\)/g, 'execution exceeded the step limit (an infinite loop?)'],
  [/demasiadas llamadas anidadas \(¿recursión infinita\?\)/g, 'too many nested calls (infinite recursion?)'],
  [/«([^»]+)» no está definido/g, '«$1» is not defined'],
  [/solo se pueden expandir arrays con «\.\.\.»/g, 'only arrays can be spread with «...»'],
  [/la propiedad «([^»]+)» no está permitida/g, 'property «$1» is not allowed'],
  [/«new» solo está soportado con Date/g, '«new» is only supported with Date'],
  [/operador no soportado: /g, 'unsupported operator: '],
  [/no se puede asignar «([^»]+)» de /g, 'cannot set «$1» of '],
  [/no se puede asignar una propiedad a /g, 'cannot set a property on '],
  [/asignación no válida/g, 'invalid assignment'],
  [/no se puede leer «([^»]+)» de /g, 'cannot read «$1» of '],
  [/fecha no válida: /g, 'invalid date: '],
  [/JSON\.parse: el texto no es JSON válido/g, 'JSON.parse: the text is not valid JSON'],
  [/ no tiene el método /g, ' has no method '],
  [/ no es iterable/g, ' is not iterable'],
  [/ no es una función/g, ' is not a function'],
  // --- parser
  [/tag no válido: «([^»]+)» \(los tags empiezan por @\)/g, 'invalid tag: «$1» (tags start with @)'],
  [/solo puede haber un «Feature:» por fichero/g, 'only one «Feature:» per file'],
  [/el fichero debe empezar por «Feature:»/g, 'the file must start with «Feature:»'],
  [/solo puede haber un «Background:»/g, 'only one «Background:» is allowed'],
  [/«Background:» debe ir antes del primer escenario/g, '«Background:» must come before the first scenario'],
  [/«Examples:» solo puede ir dentro de un «Scenario Outline:»/g, '«Examples:» can only go inside a «Scenario Outline:»'],
  [/la fila tiene (\S+) columnas y la cabecera (\S+)/g, 'the row has $1 columns and the header $2'],
  [/tabla fuera de un paso/g, 'table outside a step'],
  [/docstring \(«"""»\) fuera de un paso/g, 'docstring («"""») outside a step'],
  [/docstring sin cerrar: falta el «"""» final/g, 'unclosed docstring: missing the closing «"""»'],
  [/después de «Examples:» solo van filas de la tabla/g, 'only table rows can follow «Examples:»'],
  [/paso fuera de un escenario: falta «Scenario:» o «Background:»/g, 'step outside a scenario: missing «Scenario:» or «Background:»'],
  [/ \(las palabras clave van con mayúscula: /g, ' (keywords are capitalised: '],
  [/ \(falta la palabra clave al principio: /g, ' (missing the keyword at the start: '],
  [/línea no reconocida: /g, 'unrecognised line: '],
  [/el fichero está vacío: empieza por «Feature:»/g, 'the file is empty: start with «Feature:»'],
  [/el esquema «([^»]+)» no tiene filas en «Examples:»/g, 'the outline «$1» has no rows in «Examples:»'],
  // --- pipeline (runner JUnit)
  [/«(.)» sin abrir/g, '«$1» without an opening match'],
  [/falta cerrar «(.)»/g, 'missing closing for «$1»'],
  [/la clase (\S+) debería llamarse (\S+) \(como el fichero\)/g, 'class $1 should be named $2 (like the file)'],
  [/: se esperaba un número de hilos/g, ': expected a number of threads'],
  [/falta «;» después de \.parallel\(…\)/g, 'missing «;» after .parallel(…)'],
  [/el runner no ejecuta nada: falta Runner\.path\(…\)…parallel\(n\)/g, 'the runner runs nothing: missing Runner.path(…)…parallel(n)'],
  [/\(falta «Results results = Runner…»\)/g, '(missing «Results results = Runner…»)'],
  [/\(falta «import static org\.junit\.jupiter\.api\.Assertions\.\*;»\)/g, '(missing «import static org.junit.jupiter.api.Assertions.*;»)'],
]

// Descripciones de valores (describe() en js.ts): solo en mensajes de error,
// nunca en los logs, que pueden llevar datos del alumno o de la API.
const DESCRIBE: Rule[] = [
  [/\bun array\b/g, 'an array'],
  [/\buna función\b/g, 'a function'],
  [/\bun objeto\b/g, 'an object'],
  [/\bel string «/g, 'the string «'],
  [/\bel número (\S)/g, 'the number $1'],
  [/\bel valor (\S)/g, 'the value $1'],
]

function apply(msg: string, rules: Rule[]): string {
  let out = msg
  for (const [re, rep] of rules) {
    re.lastIndex = 0
    out = out.replace(re, rep)
  }
  return out
}

/** Traduce al inglés un log del motor (si no reconoce nada, lo deja igual). */
export function logEn(line: string): string {
  return apply(line, RULES)
}

/** Traduce al inglés un mensaje de error del motor. */
export function messageEn(msg: string): string {
  return apply(apply(msg, RULES), DESCRIBE)
}

/** Copia del resultado con errores y logs en inglés. No cambia nada más. */
export function localizeRun(result: RunResult): RunResult {
  return {
    ...result,
    features: result.features.map((f) => ({
      ...f,
      error: f.error ? { ...f.error, message: messageEn(f.error.message) } : f.error,
      scenarios: f.scenarios.map((sc) => ({
        ...sc,
        error: sc.error ? { ...sc.error, message: messageEn(sc.error.message) } : sc.error,
        logs: sc.logs.map(logEn),
        steps: sc.steps.map((st) => (st.error ? { ...st, error: messageEn(st.error) } : st)),
      })),
    })),
  }
}

/** Patrones (para el test de cobertura). */
export const MESSAGE_RULES = [...RULES, ...DESCRIBE]
