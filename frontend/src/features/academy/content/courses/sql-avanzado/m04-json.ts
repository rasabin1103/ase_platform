import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

const JSON_TEXTO = exige(/->>|#>>/, 'Saca el valor del JSON como texto con `->>`.')

/**
 * Curso 7: SQL avanzado · Misión 4 — JSON y arrays.
 *
 * jsonb (->, ->>, rutas anidadas, ?, @>, conversiones, jsonb_build_object y
 * jsonb_agg) y arrays de texto (ANY, @>, unnest, string_agg). Trampas:
 * comparar números como texto y confundir -> (jsonb) con ->> (texto).
 */
export const m04Json: Mission = {
  ...COMUN,
  id: 'm04-json',
  number: 4,
  title: 'JSON y arrays',
  subtitle: 'jsonb con ->, ->>, ?, @> y conversiones; arrays con ANY, @> y unnest.',
  dayLabel: 'Viernes · mes 3',
  verdicts: {
    good: {
      title: 'Datos que no caben en columnas, bajo control',
      body: 'Inés tiene sus errores del servicio, Marta los logins por dispositivo, Carmen las transferencias externas de verdad, Nuria su campaña, Diego las apps sin versión y Laura los intereses de los clientes. Y ningún 51 € pasó por más grande que 300.',
    },
    ok: {
      title: 'JSON a medias',
      body: 'Ya sacas datos de JSON y arrays, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'JSON leído como texto',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de JSON y arrays a mano.',
    },
  },

  briefing: {
    title: 'Mes 3 · JSON y arrays',
    paragraphs: [
      'Viernes. La app guarda los detalles de cada evento en una columna JSON (`eventos_app.datos`) y las preferencias de los clientes en arrays (`preferencias.canales` e `intereses`). Hoy toca leerlos con SQL.',
      'Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas.',
    ],
    goals: [
      'Saca valores de un jsonb con -> (jsonb) y ->> (texto).',
      'Llega a valores anidados encadenando operadores.',
      'Convierte los valores del JSON antes de comparar números.',
      'Comprueba si existe una clave (?) o si el JSON contiene algo (@>).',
      'Busca en arrays con ANY y @>.',
      'Convierte un array en filas con unnest.',
    ],
  },

  docs: [
    {
      id: 'chuleta_json',
      title: 'Chuleta: JSON y arrays',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'json_arrows' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Qué hay en datos
| tipo | datos |
|---|---|
| login | \`{"dispositivo": "ios", "version": "5.2.1"}\` |
| transferencia | \`{"importe": 125.5, "destino": "interna"}\` |
| error | \`{"codigo": "E500", "pantalla": "transferencias", "reintentos": 2, "detalle": {"http": 500, "servicio": "…"}}\` |
| ajuste | \`{"ajuste": "notificaciones", "valor": true}\` |

## jsonb
| Quiero | Uso | Devuelve |
|---|---|---|
| Un valor como JSON | \`datos->'dispositivo'\` | jsonb (\`"ios"\`, con comillas) |
| Un valor como texto | \`datos->>'dispositivo'\` | text (\`ios\`) |
| Anidado | \`datos->'detalle'->>'servicio'\` o \`datos #>> '{detalle,servicio}'\` | text |
| Un número | \`(datos->>'importe')::numeric\` | numeric |
| ¿Tiene la clave? | \`datos ? 'version'\` | boolean |
| ¿Contiene esto? | \`datos @> '{"destino": "externa"}'\` | boolean |
| Construir | \`jsonb_build_object('a', x)\`, \`jsonb_agg(x)\` | jsonb |

## Arrays (preferencias.canales, intereses: text[])
| Quiero | Uso |
|---|---|
| ¿Contiene un valor? | \`'sms' = ANY(canales)\` o \`canales @> ARRAY['sms']\` |
| ¿Cuántos tiene? | \`cardinality(canales)\` |
| Una fila por elemento | \`FROM preferencias, unnest(intereses) AS interes\` |
| Juntar en uno | \`array_agg(x)\`, \`string_agg(x, ', ')\` |`,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Lo que trae un evento de error\nSELECT id, cliente_id, datos, datos->>'codigo' AS codigo\nFROM eventos_app\nWHERE tipo = 'error'\nLIMIT 10;",
    retos: [
      {
        id: 'errores_500',
        from: 'ines',
        title: 'Los errores 500 y su servicio',
        description: 'Los eventos de **error** con código **E500**: `id`, `cliente_id`, `ocurrido_en` y `servicio` (el que viene dentro de `detalle`), como texto.',
        hint: "`datos->>'codigo' = 'E500'` y `datos->'detalle'->>'servicio' AS servicio`.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "SELECT id, cliente_id, ocurrido_en, datos->'detalle'->>'servicio' AS servicio FROM eventos_app WHERE tipo = 'error' AND datos->>'codigo' = 'E500'",
        columns: ['id', 'cliente_id', 'ocurrido_en', 'servicio'],
        requires: [JSON_TEXTO],
      },
      {
        id: 'logins_dispositivo',
        from: 'marta',
        title: 'Logins por dispositivo',
        description: 'Número de **logins** por dispositivo: `dispositivo` (como texto, sin comillas) y `logins`.',
        hint: "`datos->>'dispositivo' AS dispositivo` y `GROUP BY` esa misma expresión.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT datos->>'dispositivo' AS dispositivo, COUNT(*) AS logins FROM eventos_app WHERE tipo = 'login' GROUP BY datos->>'dispositivo'",
        columns: ['dispositivo', 'logins'],
        requires: [JSON_TEXTO],
      },
      {
        id: 'externas_grandes',
        from: 'carmen',
        title: 'Transferencias externas de más de 300 €',
        description: 'Eventos de **transferencia** a destino **externo** de **más de 300 €**: `id`, `cliente_id` e `importe` (como número).',
        hint: "`(datos->>'importe')::numeric > 300` y `datos->>'destino' = 'externa'`. Sin convertir, '95' > '300' como texto.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT id, cliente_id, (datos->>'importe')::numeric AS importe FROM eventos_app WHERE tipo = 'transferencia' AND datos->>'destino' = 'externa' AND (datos->>'importe')::numeric > 300",
        columns: ['id', 'cliente_id', 'importe'],
        requires: [JSON_TEXTO],
      },
      {
        id: 'sms_viajes',
        from: 'nuria',
        title: 'Clientes que aceptan SMS y les gustan los viajes',
        description: 'Una columna `cliente_id` con los clientes que tienen **sms** entre sus `canales` y **viajes** entre sus `intereses`.',
        hint: "`'sms' = ANY(canales)` y `intereses @> ARRAY['viajes']` (o al revés).",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT cliente_id FROM preferencias WHERE 'sms' = ANY(canales) AND 'viajes' = ANY(intereses)",
        columns: ['cliente_id'],
        requires: [exige(/\bany\s*\(|@>/i, 'Busca dentro del array con `= ANY(…)` o `@>`.')],
      },
      {
        id: 'sin_version',
        from: 'diego',
        title: 'Logins sin versión de la app',
        description: 'Los **logins** cuyo JSON **no trae la clave** `version`: `id`, `cliente_id` y `dispositivo` (como texto).',
        hint: "`NOT datos ? 'version'` (o `datos->>'version' IS NULL`).",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT id, cliente_id, datos->>'dispositivo' AS dispositivo FROM eventos_app WHERE tipo = 'login' AND NOT datos ? 'version'",
        columns: ['id', 'cliente_id', 'dispositivo'],
        requires: [JSON_TEXTO],
      },
      {
        id: 'intereses',
        from: 'laura',
        title: 'Cuántos clientes tiene cada interés',
        description: '`interes` y número de `clientes` que lo tienen en su array de `intereses`.',
        hint: '`FROM preferencias, unnest(intereses) AS interes` y `GROUP BY interes`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'SELECT interes, COUNT(*) AS clientes FROM preferencias, unnest(intereses) AS interes GROUP BY interes',
        columns: ['interes', 'clientes'],
        requires: [exige(/\bunnest\s*\(/i, 'Convierte el array en filas con `unnest(…)`.')],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El informe de dispositivos sale con comillas y no cruza con nada', severity: 'low', explanation: 'Con -> el dispositivo es jsonb ("ios"), no texto.', technique: '->> para sacar texto.', preventedBy: 'reto.logins_dispositivo' },
    { id: 'C-CARMEN', title: 'Riesgos revisa transferencias de 51 € como si fueran grandes', severity: 'high', explanation: 'Comparar el importe como texto mete importes pequeños en la lista.', technique: 'Convertir con ::numeric antes de comparar.', preventedBy: 'reto.externas_grandes' },
    { id: 'C-NURIA', title: 'La campaña de viajes por SMS llega a quien no lo aceptó', severity: 'high', explanation: 'Sin buscar en el array de canales, se mandó a todos.', technique: 'ANY o @> sobre el array.', preventedBy: 'reto.sms_viajes' },
    { id: 'C-DIEGO', title: 'Las apps antiguas siguen sin actualizarse', severity: 'medium', explanation: 'Nadie localizó los logins sin versión.', technique: 'El operador ? (existe la clave).', preventedBy: 'reto.sin_version' },
    { id: 'C-LAURA', title: 'Los tests de recomendaciones no cubren todos los intereses', severity: 'low', explanation: 'Laura no supo qué intereses tienen más clientes.', technique: 'unnest y GROUP BY.', preventedBy: 'reto.intereses' },
    { id: 'C-TEXTO', title: 'Un filtro de importes del JSON deja pasar importes pequeños', severity: 'high', explanation: "'95' > '300' es verdad como texto.", technique: '(datos->>…)::numeric.', preventedBy: 'practice.json_cast' },
    { id: 'C-FLECHA', title: 'Un filtro por dispositivo da error en producción', severity: 'medium', explanation: "datos->'dispositivo' = 'ios' compara jsonb con un texto que no es JSON.", technique: '->> para comparar con texto.', preventedBy: 'practice.arrow_text' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con los encargos del viernes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.logins_dispositivo', label: 'Informe de Marta', explanation: 'Dispositivo como texto.' },
      { flag: 'reto.externas_grandes', label: 'Revisión de Carmen', explanation: 'Importes convertidos a número.' },
      { flag: 'reto.sms_viajes', label: 'Campaña de Nuria', explanation: 'Canales e intereses en el array.' },
      { flag: 'reto.sin_version', label: 'Apps de Diego', explanation: 'Logins sin la clave version.' },
      { flag: 'reto.intereses', label: 'Tests de Laura', explanation: 'unnest de los intereses.' },
      { flag: 'practice.json_cast', label: 'Números como números', explanation: 'Convertir antes de comparar.' },
      { flag: 'practice.arrow_text', label: 'Flecha correcta', explanation: '-> para JSON, ->> para texto.' },
    ],
  },

  concepts: [
    { id: 'json_arrows', title: '-> y ->>', summary: '-> devuelve jsonb (con comillas si es texto); ->> devuelve text.' },
    { id: 'json_nested', title: 'JSON anidado', summary: "Encadenar ->, o una ruta con #>> '{a,b}', para llegar dentro." },
    { id: 'json_cast', title: 'Convertir valores del JSON', summary: '->> siempre da texto: (…)::numeric, ::int o ::boolean antes de comparar o sumar.' },
    { id: 'json_keys', title: '? y @>', summary: '? pregunta si existe una clave; @> si el JSON contiene un fragmento.' },
    { id: 'array_ops', title: 'Buscar en arrays', summary: "'x' = ANY(arr), arr @> ARRAY['x'], cardinality(arr)." },
    { id: 'unnest_agg', title: 'unnest y agregados de listas', summary: 'unnest convierte un array en filas; array_agg y string_agg hacen lo contrario.' },
    { id: 'json_build', title: 'Construir JSON', summary: 'jsonb_build_object y jsonb_agg devuelven JSON desde columnas y filas.' },
  ],
  debriefConcepts: ['json_arrows', 'json_nested', 'json_cast', 'json_keys', 'array_ops', 'unnest_agg', 'json_build'],
  seniorTips: [
    'Lee la chuleta de JSON y arrays en la wiki.',
    "Inés: datos->>'codigo' = 'E500' y datos->'detalle'->>'servicio' AS servicio.",
    "Marta: datos->>'dispositivo' AS dispositivo, COUNT(*), GROUP BY esa expresión.",
    "Carmen: (datos->>'importe')::numeric > 300 y datos->>'destino' = 'externa'.",
    "Nuria: 'sms' = ANY(canales) AND 'viajes' = ANY(intereses).",
    "Diego: tipo = 'login' AND NOT datos ? 'version'.",
    'Laura: FROM preferencias, unnest(intereses) AS interes, GROUP BY interes.',
    'Con Inés: ->> para texto y conversión antes de comparar números.',
  ],

  lessons: [
    {
      id: 'arrows',
      question: '¿Qué diferencia hay entre -> y ->>?',
      conceptId: 'json_arrows',
      cost: 5,
      body: `Las dos sacan un valor de un objeto JSON por su clave:

- \`datos->'dispositivo'\` devuelve **jsonb**: \`"ios"\`, con comillas, porque sigue siendo JSON.
- \`datos->>'dispositivo'\` devuelve **text**: \`ios\`.

Para mostrar, agrupar o comparar con un texto normal, \`->>\`. Para seguir bajando dentro del JSON, \`->\`.`,
    },
    {
      id: 'nested',
      question: '¿Cómo llego a un valor anidado?',
      conceptId: 'json_nested',
      cost: 5,
      body: `Encadena: todas las flechas menos la última son \`->\` (siguen siendo JSON) y la última, \`->>\` si quieres texto:

\`\`\`
datos->'detalle'->>'servicio'
\`\`\`

O con una ruta: \`datos #>> '{detalle,servicio}'\` (texto) o \`datos #> '{detalle}'\` (jsonb). Si alguna clave no existe, el resultado es NULL, sin error.`,
    },
    {
      id: 'cast',
      question: '¿Por qué hay que convertir los números del JSON?',
      conceptId: 'json_cast',
      cost: 5,
      body: `\`->>\` **siempre** devuelve texto, aunque en el JSON sea un número. Y el texto se compara letra a letra: \`'95' > '300'\` es verdad, porque «9» va después de «3».

\`\`\`
WHERE (datos->>'importe')::numeric > 300
\`\`\`

Igual para sumar (\`SUM((datos->>'importe')::numeric)\`), para enteros (\`::int\`) y para booleanos (\`::boolean\`).`,
    },
    {
      id: 'keys',
      question: '¿Cómo sé si un JSON tiene una clave o contiene algo?',
      conceptId: 'json_keys',
      cost: 5,
      body: `- \`datos ? 'version'\`: ¿existe la clave en el primer nivel?
- \`datos @> '{"destino": "externa"}'\`: ¿contiene este fragmento?

Ojo: \`datos->>'version' IS NULL\` también es verdad si la clave existe con valor \`null\`. Si importa la diferencia, \`?\`. Y \`@>\` puede usar índices GIN, por eso se ve tanto en filtros.`,
    },
    {
      id: 'arrays',
      question: '¿Cómo busco dentro de un array?',
      conceptId: 'array_ops',
      cost: 5,
      body: `Con \`preferencias.canales text[]\`:

- \`'sms' = ANY(canales)\`: ¿contiene \`sms\`?
- \`canales @> ARRAY['sms', 'email']\`: ¿contiene los dos?
- \`canales && ARRAY['sms', 'push']\`: ¿tiene alguno en común?
- \`cardinality(canales)\`: cuántos elementos (0 para \`{}\`).

Un array NULL no es lo mismo que uno vacío \`{}\`: \`cardinality(NULL)\` es NULL.`,
    },
    {
      id: 'unnest',
      question: '¿Cómo cuento cuántos clientes tiene cada interés?',
      conceptId: 'unnest_agg',
      cost: 5,
      body: `\`unnest\` convierte un array en filas, una por elemento:

\`\`\`
SELECT interes, COUNT(*) AS clientes
FROM preferencias, unnest(intereses) AS interes
GROUP BY interes;
\`\`\`

(La coma equivale a un \`CROSS JOIN LATERAL\`.) Lo contrario: \`array_agg(x)\` junta valores en un array y \`string_agg(x, ', ')\` en un texto.`,
    },
    {
      id: 'build',
      question: '¿Y si tengo que devolver JSON?',
      conceptId: 'json_build',
      cost: 5,
      body: `\`jsonb_build_object\` y \`jsonb_agg\`:

\`\`\`
SELECT cliente_id,
       jsonb_build_object('errores', COUNT(*),
                          'codigos', jsonb_agg(DISTINCT datos->>'codigo')) AS resumen
FROM eventos_app WHERE tipo = 'error'
GROUP BY cliente_id;
\`\`\`

jsonb guarda las claves en su propio orden y sin duplicados: no cuentes con que salgan en el orden en que las escribes.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a4pre_arrow', conceptId: 'json_arrows', question: "¿Qué devuelve `datos->>'dispositivo'` si datos es `{\"dispositivo\": \"ios\"}`?", options: ['"ios" (jsonb)', 'ios (text)', 'NULL', 'Error'], correct: 1, explanation: '->> devuelve texto.' },
      { id: 'a4pre_nested', conceptId: 'json_nested', question: 'Para llegar a `servicio` dentro de `detalle`…', options: ["datos->>'detalle'->>'servicio'", "datos->'detalle'->>'servicio'", "datos.detalle.servicio", "datos['servicio']"], correct: 1, explanation: 'La primera flecha tiene que devolver JSON para seguir bajando.' },
      { id: 'a4pre_cast', conceptId: 'json_cast', question: "¿Es verdad `'95' > '300'`?", options: ['No', 'Sí, como texto', 'Da error', 'Depende del idioma'], correct: 1, explanation: 'El texto se compara carácter a carácter.' },
      { id: 'a4pre_keys', conceptId: 'json_keys', question: "¿Qué pregunta `datos ? 'version'`?", options: ['Si version es verdadero', 'Si existe la clave version', 'El valor de version', 'Si version es NULL'], correct: 1, explanation: '? = existe la clave.' },
      { id: 'a4pre_array', conceptId: 'array_ops', question: '¿Cómo preguntas si el array canales contiene sms?', options: ["canales = 'sms'", "'sms' = ANY(canales)", "canales LIKE '%sms%'", "canales ? 'sms'"], correct: 1, explanation: 'O canales @> ARRAY[\'sms\'].' },
      { id: 'a4pre_unnest', conceptId: 'unnest_agg', question: '¿Qué hace `unnest(intereses)`?', options: ['Ordena el array', 'Devuelve una fila por elemento', 'Cuenta los elementos', 'Quita repetidos'], correct: 1, explanation: 'Convierte el array en filas.' },
    ],
    post: [
      { id: 'a4post_arrow', conceptId: 'json_arrows', question: "`WHERE datos->'dispositivo' = 'ios'` da error. ¿Por qué?", options: ['ios no existe', "-> devuelve jsonb y 'ios' no es JSON válido; hay que usar ->>", 'Falta un GROUP BY', 'Las comillas son dobles'], correct: 1, explanation: "Con ->>, la comparación es entre textos." },
      { id: 'a4post_cast', conceptId: 'json_cast', question: 'Transferencias del JSON de más de 300 €:', options: ["datos->>'importe' > '300'", "(datos->>'importe')::numeric > 300", "datos->'importe' > 300", "datos ? '300'"], correct: 1, explanation: 'Convertir y comparar como número.' },
      { id: 'a4post_keys', conceptId: 'json_keys', question: "¿Qué devuelve `datos @> '{\"destino\": \"externa\"}'`?", options: ['El destino', 'true si el JSON contiene ese par', 'El número de claves', 'Error'], correct: 1, explanation: 'Contención.' },
      { id: 'a4post_null', conceptId: 'json_keys', question: "El JSON es `{\"version\": null}`. ¿Qué da `datos ? 'version'`?", options: ['false', 'true', 'NULL', 'Error'], correct: 1, explanation: 'La clave existe, aunque su valor sea null.' },
      { id: 'a4post_unnest', conceptId: 'unnest_agg', question: 'Un cliente tiene 3 intereses. ¿Cuántas filas le da `FROM preferencias, unnest(intereses)`?', options: ['1', '3', '0', 'Depende'], correct: 1, explanation: 'Una por elemento.' },
      { id: 'a4post_build', conceptId: 'json_build', question: '¿Qué construye `jsonb_agg(x)`?', options: ['Un texto', 'Un array JSON con los valores del grupo', 'Un objeto', 'Una tabla'], correct: 1, explanation: 'jsonb_build_object construye objetos.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Datos que no caben en columnas',
      body: 'Buenos días, último día de la semana.\n\nLa app guarda los detalles de cada evento en una columna **JSON**: `eventos_app.datos`. Cada tipo trae cosas distintas (mira la chuleta). Y las preferencias de los clientes están en **arrays**: `preferencias.canales` e `intereses`. Hoy toca leerlos con SQL.\n\nPara empezar:\n\n- Los eventos de **error** con código **E500**: `id`, `cliente_id`, `ocurrido_en` y el `servicio` que viene dentro de `detalle`, como texto.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'json_arrows' }, { kind: 'unlock', conceptId: 'json_nested' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.errores_500' },
      body: 'Doce errores, todos de core-transferencias. Fíjate en la cadena: `->` para entrar en `detalle` (sigue siendo JSON) y `->>` al final para sacar el texto.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_dispositivos',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Quiero saber desde qué dispositivo entra la gente: número de **logins** por dispositivo, con `dispositivo` como texto normal (sin comillas) y `logins`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.logins_dispositivo' },
      body: 'Android 400, iOS 368 y web 345. Bastante repartido. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_externas',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Quiero revisar las **transferencias a destino externo de más de 300 €** que se hacen desde la app: `id`, `cliente_id` e `importe` (como número).',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'json_cast' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.externas_grandes' },
      body: 'Doce transferencias, y tres son del cliente 22. Las reviso. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_texto',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «¿16 o 12?»',
      body: '**Inés:** Rubén, de Riesgos, había hecho la lista de Carmen así:\n\n`… WHERE datos->>\'destino\' = \'externa\' AND datos->>\'importe\' > \'300\'`\n\nY le salen **16** transferencias, entre ellas una de 51,20 €. ¿Qué ha pasado?',
      onDeliver: [],
      choices: [
        {
          id: 'cast',
          text: '`->>` devuelve **texto**, y Rubén compara con el texto `\'300\'`: la comparación es letra a letra, así que `\'51.2\'` es «mayor» que `\'300\'` porque el 5 va después del 3. Hay que convertir antes: `(datos->>\'importe\')::numeric > 300`.',
          cost: 10,
          reply: 'Exacto. Todo lo que sale con ->> es texto, aunque en el JSON fuera un número. Convierte siempre antes de comparar o sumar.',
          effects: [
            { kind: 'flag', key: 'practice.json_cast' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Lo que sale con ->> es texto: ::numeric antes de comparar números.' },
          ],
        },
        {
          id: 'arrow',
          text: 'Que use `->` en vez de `->>`, que mantiene el número.',
          cost: 10,
          reply: "Con -> tendría un jsonb, y compararlo con el texto '300' da otro tipo de problema. Lo limpio es ->> y convertir a numeric.",
          effects: [{ kind: 'note', tone: 'bad', text: 'Cambiar de flecha no convierte el valor en número.' }],
        },
        {
          id: 'data',
          text: 'Que el importe de 51,20 € estará mal guardado en el JSON.',
          cost: 10,
          reply: 'Está bien guardado: 51.2 como número. El problema es compararlo como texto.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a los datos de una comparación de textos.' }],
        },
      ],
    },
    {
      id: 'nuria_campana',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Vamos a mandar una campaña de viajes **por SMS**. Solo a los clientes que tienen **sms** entre sus `canales` y **viajes** entre sus `intereses`. Una columna `cliente_id`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'array_ops' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.sms_viajes' },
      body: 'Siete clientes. Mucho mejor que mandárselo a los cuarenta. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_version',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Las apps muy antiguas no mandan la versión en el login. Quiero esos logins: los que **no traen la clave** `version` en el JSON. `id`, `cliente_id` y `dispositivo` (como texto).',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'json_keys' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.sin_version' },
      body: 'Diez logins de tres clientes: el 13, el 26 y el 39. Les mandamos el aviso para actualizar. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_intereses',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. Para los tests del recomendador quiero saber **cuántos clientes tiene cada interés**: `interes` y `clientes`. Los intereses están en un array, uno por cliente.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'unnest_agg' }, { kind: 'unlock', conceptId: 'json_build' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.intereses' },
      body: 'Cinco intereses e «inversión» con 36 clientes. Ya sé por dónde empezar los tests. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_flecha',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «invalid input syntax for type json»',
      body: '**Inés:** Diego ha puesto en la app un filtro por dispositivo:\n\n`SELECT … FROM eventos_app WHERE datos->\'dispositivo\' = \'ios\'`\n\nY da «invalid input syntax for type json». ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'arrow',
          text: '`->` devuelve **jsonb**, así que PostgreSQL intenta leer `\'ios\'` como JSON, y `ios` sin comillas dobles no es JSON válido. Para comparar con un texto normal, `datos->>\'dispositivo\' = \'ios\'`. (Con `->` habría que comparar con el JSON `\'"ios"\'`, o usar `datos @> \'{"dispositivo": "ios"}\'`.)',
          cost: 10,
          reply: 'Eso es. -> para seguir dentro del JSON; ->> cuando quieres el valor para usarlo como texto.',
          effects: [
            { kind: 'flag', key: 'practice.arrow_text' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: '-> devuelve jsonb; para comparar o mostrar texto, ->>.' },
          ],
        },
        {
          id: 'like',
          text: "Que use `datos::text LIKE '%ios%'`.",
          cost: 10,
          reply: 'Funcionaría… y también cogería cualquier JSON que tenga «ios» en otra clave. Es frágil y no puede usar índices.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Buscar texto dentro del JSON entero es frágil.' }],
        },
        {
          id: 'bug',
          text: 'Que es un fallo de PostgreSQL con JSON.',
          cost: 10,
          reply: 'PostgreSQL hace lo que pide la consulta: comparar un jsonb con algo que debería ser JSON.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a la base de datos de una flecha equivocada.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre de la semana con Inés',
      body: '**Inés:** Semana cerrada: recursivas, marcos, rachas, subtotales y hoy JSON. ¿Qué te llevas de hoy?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que `->` devuelve jsonb y `->>` texto; que para llegar dentro se encadena; que lo que sale de un JSON hay que convertirlo antes de comparar números; que `?` y `@>` preguntan por claves y contenido; y que en arrays se busca con ANY o @> y se desdobla con unnest.',
          reply: 'Muy bien. La semana que viene dejamos de leer: toca cambiar datos, con cuidado.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'text',
          text: 'Que lo más cómodo es convertir el JSON entero a texto y buscar con LIKE.',
          reply: 'Hasta que una clave tiene el mismo texto que otra. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con tratar el JSON como texto.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
