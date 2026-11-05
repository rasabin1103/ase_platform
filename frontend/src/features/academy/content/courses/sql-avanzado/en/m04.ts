import { m04Json } from '../m04-json'
import { COMMON_EN, missionEn } from './missionEn'

const TEXT = { 0: { message: 'Get the value out of the JSON as text with `->>`.' } }

/** Course 7: Advanced SQL · Mission 4 — JSON and arrays. English version of ../m04-json.ts. */
export const m04JsonEn = missionEn(m04Json, {
  ...COMMON_EN,
  title: 'JSON and arrays',
  subtitle: 'jsonb with ->, ->>, ?, @> and casts; arrays with ANY, @> and unnest.',
  dayLabel: 'Friday · month 3',
  verdicts: {
    good: {
      title: "Data that doesn't fit in columns, under control",
      body: "Inés has her service errors, Marta the logins per device, Carmen the real external transfers, Nuria her campaign, Diego the apps without a version and Laura the customers' interests. And no €51 passed for bigger than 300.",
    },
    ok: { title: 'JSON, halfway there', body: 'You already get data out of JSON and arrays, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'JSON read as text', body: 'Several tasks were left undone. Replay the mission with the JSON and arrays cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 3 · JSON and arrays',
    paragraphs: [
      "Friday. The app stores the details of each event in a JSON column (`eventos_app.datos`) and the customers' preferences in arrays (`preferencias.canales` and `intereses`). Today it's about reading them with SQL.",
      'Each task is done when the query returns exactly the rows and columns asked for.',
    ],
    goals: [
      'Get values out of a jsonb with -> (jsonb) and ->> (text).',
      'Reach nested values by chaining operators.',
      'Cast the JSON values before comparing numbers.',
      'Check whether a key exists (?) or whether the JSON contains something (@>).',
      'Search arrays with ANY and @>.',
      'Turn an array into rows with unnest.',
    ],
  },
  docs: {
    chuleta_json: {
      title: 'Cheat sheet: JSON and arrays',
      updatedLabel: 'Inés Moreno · Data',
      body: `## What's in datos
| tipo | datos |
|---|---|
| login | \`{"dispositivo": "ios", "version": "5.2.1"}\` |
| transferencia | \`{"importe": 125.5, "destino": "interna"}\` |
| error | \`{"codigo": "E500", "pantalla": "transferencias", "reintentos": 2, "detalle": {"http": 500, "servicio": "…"}}\` |
| ajuste | \`{"ajuste": "notificaciones", "valor": true}\` |

## jsonb
| I want | Use | Returns |
|---|---|---|
| A value as JSON | \`datos->'dispositivo'\` | jsonb (\`"ios"\`, with quotes) |
| A value as text | \`datos->>'dispositivo'\` | text (\`ios\`) |
| Nested | \`datos->'detalle'->>'servicio'\` or \`datos #>> '{detalle,servicio}'\` | text |
| A number | \`(datos->>'importe')::numeric\` | numeric |
| Does it have the key? | \`datos ? 'version'\` | boolean |
| Does it contain this? | \`datos @> '{"destino": "externa"}'\` | boolean |
| Build | \`jsonb_build_object('a', x)\`, \`jsonb_agg(x)\` | jsonb |

## Arrays (preferencias.canales, intereses: text[])
| I want | Use |
|---|---|
| Does it contain a value? | \`'sms' = ANY(canales)\` or \`canales @> ARRAY['sms']\` |
| How many does it have? | \`cardinality(canales)\` |
| One row per element | \`FROM preferencias, unnest(intereses) AS interes\` |
| Put together into one | \`array_agg(x)\`, \`string_agg(x, ', ')\` |`,
    },
  },
  sqlLab: {
    starter: "-- What an error event carries\nSELECT id, cliente_id, datos, datos->>'codigo' AS codigo\nFROM eventos_app\nWHERE tipo = 'error'\nLIMIT 10;",
    retos: {
      errores_500: {
        title: 'The 500 errors and their service',
        description: 'The **error** events with code **E500**: `id`, `cliente_id`, `ocurrido_en` and `servicio` (the one inside `detalle`), as text.',
        hint: "`datos->>'codigo' = 'E500'` and `datos->'detalle'->>'servicio' AS servicio`.",
        requires: TEXT,
      },
      logins_dispositivo: {
        title: 'Logins per device',
        description: 'Number of **logins** per device: `dispositivo` (as text, without quotes) and `logins`.',
        hint: "`datos->>'dispositivo' AS dispositivo` and `GROUP BY` that same expression.",
        requires: TEXT,
      },
      externas_grandes: {
        title: 'External transfers of more than €300',
        description: '**Transfer** events to an **external** destination of **more than €300**: `id`, `cliente_id` and `importe` (as a number).',
        hint: "`(datos->>'importe')::numeric > 300` and `datos->>'destino' = 'externa'`. Without casting, '95' > '300' as text.",
        requires: TEXT,
      },
      sms_viajes: {
        title: 'Customers who accept SMS and like travel',
        description: 'One column `cliente_id` with the customers who have **sms** among their `canales` (channels) and **viajes** (travel) among their `intereses` (interests).',
        hint: "`'sms' = ANY(canales)` and `intereses @> ARRAY['viajes']` (or the other way round).",
        requires: { 0: { message: 'Search inside the array with `= ANY(…)` or `@>`.' } },
      },
      sin_version: {
        title: 'Logins without the app version',
        description: "The **logins** whose JSON **doesn't carry the key** `version`: `id`, `cliente_id` and `dispositivo` (as text).",
        hint: "`NOT datos ? 'version'` (or `datos->>'version' IS NULL`).",
        requires: TEXT,
      },
      intereses: {
        title: 'How many customers each interest has',
        description: '`interes` and number of `clientes` who have it in their `intereses` array.',
        hint: '`FROM preferencias, unnest(intereses) AS interes` and `GROUP BY interes`.',
        requires: { 0: { message: 'Turn the array into rows with `unnest(…)`.' } },
      },
    },
  },
  bugs: {
    'C-MARTA': { title: "The devices report comes out with quotes and doesn't join with anything", explanation: 'With -> the device is jsonb ("ios"), not text.', technique: '->> to get text.' },
    'C-CARMEN': { title: 'Risk reviews €51 transfers as if they were big', explanation: 'Comparing the amount as text lets small amounts into the list.', technique: 'Cast with ::numeric before comparing.' },
    'C-NURIA': { title: "The SMS travel campaign reaches people who didn't accept it", explanation: 'Without searching the channels array, it was sent to everyone.', technique: 'ANY or @> on the array.' },
    'C-DIEGO': { title: 'The old apps still have not been updated', explanation: 'Nobody found the logins without a version.', technique: 'The ? operator (the key exists).' },
    'C-LAURA': { title: "The recommendations tests don't cover every interest", explanation: "Laura didn't know which interests have the most customers.", technique: 'unnest and GROUP BY.' },
    'C-TEXTO': { title: 'A filter on JSON amounts lets small amounts through', explanation: "'95' > '300' is true as text.", technique: '(datos->>…)::numeric.' },
    'C-FLECHA': { title: 'A device filter gives an error in production', explanation: "datos->'dispositivo' = 'ios' compares jsonb with a text that isn't JSON.", technique: '->> to compare with text.' },
  },
  prevention: {
    title: 'At the end of the week',
    intro: "What happened with Friday's tasks.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's report", explanation: 'Device as text.' },
      1: { label: "Carmen's review", explanation: 'Amounts cast to numbers.' },
      2: { label: "Nuria's campaign", explanation: 'Channels and interests in the array.' },
      3: { label: "Diego's apps", explanation: 'Logins without the version key.' },
      4: { label: "Laura's tests", explanation: 'unnest of the interests.' },
      5: { label: 'Numbers as numbers', explanation: 'Cast before comparing.' },
      6: { label: 'The right arrow', explanation: '-> for JSON, ->> for text.' },
    },
  },
  concepts: {
    json_arrows: { title: '-> and ->>', summary: '-> returns jsonb (with quotes if it is text); ->> returns text.' },
    json_nested: { title: 'Nested JSON', summary: "Chain ->, or a path with #>> '{a,b}', to get inside." },
    json_cast: { title: 'Casting JSON values', summary: '->> always gives text: (…)::numeric, ::int or ::boolean before comparing or adding.' },
    json_keys: { title: '? and @>', summary: '? asks whether a key exists; @> whether the JSON contains a fragment.' },
    array_ops: { title: 'Searching arrays', summary: "'x' = ANY(arr), arr @> ARRAY['x'], cardinality(arr)." },
    unnest_agg: { title: 'unnest and list aggregates', summary: 'unnest turns an array into rows; array_agg and string_agg do the opposite.' },
    json_build: { title: 'Building JSON', summary: 'jsonb_build_object and jsonb_agg return JSON from columns and rows.' },
  },
  seniorTips: [
    'Read the JSON and arrays cheat sheet in the wiki.',
    "Inés: datos->>'codigo' = 'E500' and datos->'detalle'->>'servicio' AS servicio.",
    "Marta: datos->>'dispositivo' AS dispositivo, COUNT(*), GROUP BY that expression.",
    "Carmen: (datos->>'importe')::numeric > 300 and datos->>'destino' = 'externa'.",
    "Nuria: 'sms' = ANY(canales) AND 'viajes' = ANY(intereses).",
    "Diego: tipo = 'login' AND NOT datos ? 'version'.",
    'Laura: FROM preferencias, unnest(intereses) AS interes, GROUP BY interes.',
    'With Inés: ->> for text and a cast before comparing numbers.',
  ],
  lessons: {
    arrows: {
      question: 'What is the difference between -> and ->>?',
      body: `Both get a value out of a JSON object by its key:

- \`datos->'dispositivo'\` returns **jsonb**: \`"ios"\`, with quotes, because it is still JSON.
- \`datos->>'dispositivo'\` returns **text**: \`ios\`.

To display, group or compare with plain text, \`->>\`. To keep going down inside the JSON, \`->\`.`,
    },
    nested: {
      question: 'How do I reach a nested value?',
      body: `Chain them: every arrow except the last is \`->\` (they are still JSON) and the last one, \`->>\` if you want text:

\`\`\`
datos->'detalle'->>'servicio'
\`\`\`

Or with a path: \`datos #>> '{detalle,servicio}'\` (text) or \`datos #> '{detalle}'\` (jsonb). If a key doesn't exist, the result is NULL, without an error.`,
    },
    cast: {
      question: 'Why do the numbers from the JSON have to be cast?',
      body: `\`->>\` **always** returns text, even if it is a number in the JSON. And text is compared character by character: \`'95' > '300'\` is true, because "9" comes after "3".

\`\`\`
WHERE (datos->>'importe')::numeric > 300
\`\`\`

The same to add up (\`SUM((datos->>'importe')::numeric)\`), for integers (\`::int\`) and for booleans (\`::boolean\`).`,
    },
    keys: {
      question: 'How do I know whether a JSON has a key or contains something?',
      body: `- \`datos ? 'version'\`: does the key exist at the first level?
- \`datos @> '{"destino": "externa"}'\`: does it contain this fragment?

Careful: \`datos->>'version' IS NULL\` is also true if the key exists with the value \`null\`. If the difference matters, \`?\`. And \`@>\` can use GIN indexes, which is why it shows up so much in filters.`,
    },
    arrays: {
      question: 'How do I search inside an array?',
      body: `With \`preferencias.canales text[]\`:

- \`'sms' = ANY(canales)\`: does it contain \`sms\`?
- \`canales @> ARRAY['sms', 'email']\`: does it contain both?
- \`canales && ARRAY['sms', 'push']\`: does it have any in common?
- \`cardinality(canales)\`: how many elements (0 for \`{}\`).

A NULL array is not the same as an empty one \`{}\`: \`cardinality(NULL)\` is NULL.`,
    },
    unnest: {
      question: 'How do I count how many customers each interest has?',
      body: `\`unnest\` turns an array into rows, one per element:

\`\`\`
SELECT interes, COUNT(*) AS clientes
FROM preferencias, unnest(intereses) AS interes
GROUP BY interes;
\`\`\`

(The comma is equivalent to a \`CROSS JOIN LATERAL\`.) The opposite: \`array_agg(x)\` puts values together into an array and \`string_agg(x, ', ')\` into a text.`,
    },
    build: {
      question: 'And if I have to return JSON?',
      body: `\`jsonb_build_object\` and \`jsonb_agg\`:

\`\`\`
SELECT cliente_id,
       jsonb_build_object('errores', COUNT(*),
                          'codigos', jsonb_agg(DISTINCT datos->>'codigo')) AS resumen
FROM eventos_app WHERE tipo = 'error'
GROUP BY cliente_id;
\`\`\`

jsonb stores the keys in its own order and without duplicates: don't count on them coming out in the order you write them.`,
    },
  },
  quiz: {
    pre: {
      a4pre_arrow: { question: 'What does `datos->>\'dispositivo\'` return if datos is `{"dispositivo": "ios"}`?', options: ['"ios" (jsonb)', 'ios (text)', 'NULL', 'Error'], explanation: '->> returns text.' },
      a4pre_nested: { question: 'To reach `servicio` inside `detalle`…', options: ["datos->>'detalle'->>'servicio'", "datos->'detalle'->>'servicio'", 'datos.detalle.servicio', "datos['servicio']"], explanation: 'The first arrow has to return JSON to keep going down.' },
      a4pre_cast: { question: "Is `'95' > '300'` true?", options: ['No', 'Yes, as text', 'It gives an error', 'It depends on the language'], explanation: 'Text is compared character by character.' },
      a4pre_keys: { question: "What does `datos ? 'version'` ask?", options: ['Whether version is true', 'Whether the key version exists', 'The value of version', 'Whether version is NULL'], explanation: '? = the key exists.' },
      a4pre_array: { question: 'How do you ask whether the canales array contains sms?', options: ["canales = 'sms'", "'sms' = ANY(canales)", "canales LIKE '%sms%'", "canales ? 'sms'"], explanation: "Or canales @> ARRAY['sms']." },
      a4pre_unnest: { question: 'What does `unnest(intereses)` do?', options: ['Sorts the array', 'Returns one row per element', 'Counts the elements', 'Removes repeats'], explanation: 'It turns the array into rows.' },
    },
    post: {
      a4post_arrow: { question: "`WHERE datos->'dispositivo' = 'ios'` gives an error. Why?", options: ["ios doesn't exist", "-> returns jsonb and 'ios' isn't valid JSON; you have to use ->>", 'A GROUP BY is missing', 'The quotes are double'], explanation: 'With ->>, the comparison is between texts.' },
      a4post_cast: { question: 'JSON transfers of more than €300:', options: ["datos->>'importe' > '300'", "(datos->>'importe')::numeric > 300", "datos->'importe' > 300", "datos ? '300'"], explanation: 'Cast and compare as a number.' },
      a4post_keys: { question: 'What does `datos @> \'{"destino": "externa"}\'` return?', options: ['The destination', 'true if the JSON contains that pair', 'The number of keys', 'Error'], explanation: 'Containment.' },
      a4post_null: { question: 'The JSON is `{"version": null}`. What does `datos ? \'version\'` give?', options: ['false', 'true', 'NULL', 'Error'], explanation: 'The key exists, even though its value is null.' },
      a4post_unnest: { question: 'A customer has 3 interests. How many rows does `FROM preferencias, unnest(intereses)` give them?', options: ['1', '3', '0', 'It depends'], explanation: 'One per element.' },
      a4post_build: { question: 'What does `jsonb_agg(x)` build?', options: ['A text', 'A JSON array with the values of the group', 'An object', 'A table'], explanation: 'jsonb_build_object builds objects.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: "Data that doesn't fit in columns",
      body: "Good morning, last day of the week.\n\nThe app stores the details of each event in a **JSON** column: `eventos_app.datos`. Each type carries different things (look at the cheat sheet). And the customers' preferences are in **arrays**: `preferencias.canales` and `intereses`. Today it's about reading them with SQL.\n\nTo start:\n\n- The **error** events with code **E500**: `id`, `cliente_id`, `ocurrido_en` and the `servicio` inside `detalle`, as text.\n\nInés",
    },
    ines_ok: {
      body: 'Twelve errors, all from core-transferencias. Notice the chain: `->` to get into `detalle` (it is still JSON) and `->>` at the end to get the text.',
    },
    marta_dispositivos: {
      body: 'Hi! I want to know which device people log in from: number of **logins** per device, with `dispositivo` as plain text (without quotes) and `logins`.',
    },
    marta_thanks: { body: 'Android 400, iOS 368 and web 345. Quite evenly spread. Thanks!' },
    carmen_externas: {
      body: 'Hi. I want to review the **transfers to an external destination of more than €300** made from the app: `id`, `cliente_id` and `importe` (as a number).',
    },
    carmen_thanks: { body: "Twelve transfers, and three are from customer 22. I'll review them. Thanks." },
    ines_texto: {
      subject: '11:00 · Inés: "16 or 12?"',
      body: "**Inés:** Rubén, from Risk, had made Carmen's list like this:\n\n`… WHERE datos->>'destino' = 'externa' AND datos->>'importe' > '300'`\n\nAnd he gets **16** transfers, among them one of €51.20. What happened?",
      choices: {
        cast: {
          text: "`->>` returns **text**, and Rubén compares with the text `'300'`: the comparison is character by character, so `'51.2'` is \"greater\" than `'300'` because 5 comes after 3. You have to cast first: `(datos->>'importe')::numeric > 300`.",
          reply: 'Exactly. Everything that comes out with ->> is text, even if it was a number in the JSON. Always cast before comparing or adding up.',
          effects: { 2: { text: 'What comes out with ->> is text: ::numeric before comparing numbers.' } },
        },
        arrow: {
          text: 'That he should use `->` instead of `->>`, which keeps the number.',
          reply: "With -> he would have a jsonb, and comparing it with the text '300' gives another kind of problem. The clean way is ->> and cast to numeric.",
          effects: { 0: { text: "Changing the arrow doesn't turn the value into a number." } },
        },
        data: {
          text: 'That the €51.20 amount must be stored wrong in the JSON.',
          reply: "It's stored fine: 51.2 as a number. The problem is comparing it as text.",
          effects: { 0: { text: 'You blamed the data for a text comparison.' } },
        },
      },
    },
    nuria_campana: {
      body: "Hi. We're going to send a travel campaign **by SMS**. Only to the customers who have **sms** among their `canales` (channels) and **viajes** (travel) among their `intereses` (interests). One column `cliente_id`.",
    },
    nuria_thanks: { body: 'Seven customers. Much better than sending it to all forty. Thanks!' },
    diego_version: {
      body: "Hey. Very old apps don't send the version on login. I want those logins: the ones that **don't carry the key** `version` in the JSON. `id`, `cliente_id` and `dispositivo` (as text).",
    },
    diego_thanks: { body: "Ten logins from three customers: 13, 26 and 39. We'll send them the update notice. Thanks!" },
    laura_intereses: {
      body: 'Hi. For the recommender tests I want to know **how many customers each interest has**: `interes` and `clientes`. The interests are in an array, one per customer.',
    },
    laura_thanks: { body: 'Five interests and "inversion" (investment) with 36 customers. Now I know where to start the tests. Thanks!' },
    ines_flecha: {
      subject: '15:00 · Inés: "invalid input syntax for type json"',
      body: "**Inés:** Diego put a device filter in the app:\n\n`SELECT … FROM eventos_app WHERE datos->'dispositivo' = 'ios'`\n\nAnd it gives \"invalid input syntax for type json\". What do you tell him?",
      choices: {
        arrow: {
          text: "`->` returns **jsonb**, so PostgreSQL tries to read `'ios'` as JSON, and `ios` without double quotes isn't valid JSON. To compare with plain text, `datos->>'dispositivo' = 'ios'`. (With `->` you would have to compare with the JSON `'\"ios\"'`, or use `datos @> '{\"dispositivo\": \"ios\"}'`.)",
          reply: "That's it. -> to stay inside the JSON; ->> when you want the value to use as text.",
          effects: { 3: { text: '-> returns jsonb; to compare or display text, ->>.' } },
        },
        like: {
          text: "That he should use `datos::text LIKE '%ios%'`.",
          reply: "It would work… and it would also catch any JSON with \"ios\" in another key. It's fragile and can't use indexes.",
          effects: { 0: { text: 'Searching text inside the whole JSON is fragile.' } },
        },
        bug: {
          text: "That it's a PostgreSQL bug with JSON.",
          reply: 'PostgreSQL does what the query asks: compare a jsonb with something that should be JSON.',
          effects: { 0: { text: 'You blamed the database for the wrong arrow.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the week with Inés',
      body: '**Inés:** Week done: recursive queries, frames, streaks, subtotals and today JSON. What are you taking away from today?',
      choices: {
        lesson: {
          text: 'That `->` returns jsonb and `->>` text; that you chain them to get inside; that what comes out of a JSON has to be cast before comparing numbers; that `?` and `@>` ask about keys and contents; and that in arrays you search with ANY or @> and unfold with unnest.',
          reply: 'Very good. Next week we stop reading: it\'s time to change data, carefully.',
        },
        text: {
          text: "That the easiest thing is to turn the whole JSON into text and search with LIKE.",
          reply: 'Until one key has the same text as another. Check the debrief.',
          effects: { 0: { text: 'You came away with treating JSON as text.' } },
        },
      },
    },
  },
})
