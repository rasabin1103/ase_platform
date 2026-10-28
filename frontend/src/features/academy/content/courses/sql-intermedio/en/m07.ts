import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m07Cruces } from '../m07-cruces'
import { ROLES_EN, missionEn } from './missionEn'

const uses = (what: string) => ({ 0: { message: `This task is solved with ${what}.` } })

/** Course 6: Intermediate SQL · Mission 7 — Tricky joins. English version of ../m07-cruces.ts. */
export const m07CrucesEn = missionEn(
  m07Cruces,
  {
    title: 'Tricky joins',
    subtitle: 'The same table twice, FULL OUTER JOIN, CROSS JOIN and calendars with generate_series.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Wednesday · month 2, week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Everything joined, nothing lost',
        body: 'Marta has the big movements with names, Carmen her calendar with zeros, Nuria the explanation for her customer, Diego the January and February comparison and Laura her coverage matrix.',
      },
      ok: { title: 'Joins with a loose end', body: 'You already join tables in trickier ways, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'Rows lost along the way', body: 'Several tasks were left undone. Replay the mission with the joins cheat sheet at hand.' },
    },
    briefing: {
      title: 'Month 2 · Week 2 · Tricky joins',
      paragraphs: [
        'Wednesday. Today the data is spread out in awkward ways: two accounts in each transfer, months without payments, merchants that only appear in one of two lists.',
        "Each task has to return exactly the rows and columns asked for, without losing the ones that don't have a match.",
      ],
      goals: [
        'Join the same table twice, one alias per role.',
        'Compare rows of a table with each other (self-join).',
        'Put two lists together without losing anything with FULL OUTER JOIN.',
        'Generate every combination with CROSS JOIN.',
        'Build a calendar with generate_series so gaps are not lost.',
        "Put the filters of a LEFT JOIN's right-hand table in the ON.",
      ],
    },
    docs: {
      chuleta_cruces: {
        title: 'Cheat sheet: tricky joins',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Origin and destination
\`\`\`
FROM transferencias t
JOIN cuentas  ao ON ao.id = t.cuenta_origen_id
JOIN clientes co ON co.id = ao.cliente_id
LEFT JOIN cuentas  ad ON ad.id = t.cuenta_destino_id
LEFT JOIN clientes cd ON cd.id = ad.cliente_id
\`\`\`

## Kinds of JOIN
| JOIN | Keeps |
|---|---|
| \`JOIN\` | Only the rows with a match |
| \`LEFT JOIN\` | All the rows on the left |
| \`FULL OUTER JOIN\` | All of them, from both sides |
| \`CROSS JOIN\` | Every combination (no ON) |

## Calendar
\`generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month')\` + \`LEFT JOIN\` + \`COALESCE(total, 0)\`.

## LEFT JOIN and filters
Filter on the right-hand table → in the **ON** (in the WHERE, the LEFT JOIN turns into a JOIN).`,
      },
    },
    sqlLab: {
      starter: '-- Origin and destination: the same table twice\nSELECT t.id, ao.cliente_id AS cliente_origen, ad.cliente_id AS cliente_destino\nFROM transferencias t\nJOIN cuentas ao ON ao.id = t.cuenta_origen_id\nLEFT JOIN cuentas ad ON ad.id = t.cuenta_destino_id;',
      retos: {
        misma_ciudad: {
          title: 'Transfers within the same city',
          description: '`id` and `ciudad` of the transfers in which the customer who sends and the one who receives are from the **same city** (without the ones that go to other banks).',
          hint: 'Join `cuentas` and `clientes` twice (origin and destination, with different aliases) and compare the two cities.',
        },
        grandes_con_nombres: {
          title: 'Big transfers with names',
          description: '`id`, `importe`, `emisor` (name of the sender) and `receptor` (name of the receiver, empty if it is from another bank) of the transfers of **more than €5,000**.',
          hint: "Origin with `JOIN`, destination with `LEFT JOIN` (accounts and customers), so you don't lose the ones that go outside.",
        },
        calendario_servicios: {
          title: 'Services calendar with zeros',
          description: '**Accepted** amount of the **servicios** (services) category for **each month** from January 2025 to February 2026, with **0** in the months without payments: `mes` (as a date, with `::date`) and `total`.',
          hint: "`generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month')` as the calendar; `LEFT JOIN` with the services total per month; `COALESCE(total, 0)`.",
          requires: uses('a calendar: `generate_series(…)`'),
        },
        traspasos_internos: {
          title: 'Transfers to oneself',
          description: '`id` and `cliente_id` of the transfers in which the origin and destination accounts belong to the **same customer**.',
          hint: '`cuentas` twice (origin and destination) and `ao.cliente_id = ad.cliente_id`.',
        },
        enero_febrero: {
          title: 'January and February, merchant by merchant',
          description: '`comercio_id`, `enero` and `febrero`: number of payments (any status) of each merchant in January and in February 2026, with **0** where there are none; also the ones that only have payments in one of the two months.',
          hint: 'One step per month (count per merchant) and `FULL OUTER JOIN` between the two; `COALESCE` for the id and for the zeros.',
        },
        matriz_cobertura: {
          title: 'Card type × category matrix',
          description: '`tipo`, `categoria` and `pagos`: **each card type with each merchant category** (without the one that has none) and the number of payments (any status) of the combination, **with 0** if there are none.',
          hint: 'Distinct types of `tarjetas` `CROSS JOIN` distinct categories of `comercios`; then `LEFT JOIN` with the payments (joined to their card and merchant) and `COUNT(p.id)`.',
          requires: uses('every combination: `CROSS JOIN`'),
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'A big transfer to another bank goes unreviewed', explanation: 'Without LEFT JOIN on the destination, the one that goes outside disappears from the report.', technique: 'Origin with JOIN, destination with LEFT JOIN.' },
      'C-CARMEN': { title: 'The services report skips the months without payments', explanation: "Without a calendar, the empty months don't appear.", technique: 'generate_series and LEFT JOIN.' },
      'C-NURIA': { title: 'A customer thinks they were charged twice', explanation: "Nuria couldn't explain their internal transfers to them.", technique: 'The same table twice.' },
      'C-DIEGO': { title: "February's new merchants don't show up in the comparison", explanation: 'With LEFT JOIN, the ones that are only in the second month are lost.', technique: 'FULL OUTER JOIN.' },
      'C-LAURA': { title: 'Nobody tests credit card payments in services', explanation: "Without the full matrix, the combination with no data can't be seen.", technique: 'CROSS JOIN and LEFT JOIN.' },
      'C-ALIAS': { title: 'A report says there are no transfers between customers', explanation: 'A single JOIN to accounts for origin and destination at once returns 0 rows.', technique: 'One alias per role.' },
      'C-WHERE': { title: 'The calendar loses the empty months again', explanation: "The right-hand table's filter in the WHERE cancelled the LEFT JOIN.", technique: 'Right-hand filter in the ON.' },
    },
    prevention: {
      title: 'At the end of the day',
      intro: "What happened with Wednesday's joins.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Big movements', explanation: 'Sender and receiver, also outside.' },
        1: { label: "Carmen's calendar", explanation: 'Empty months with 0.' },
        2: { label: "Nuria's customer", explanation: 'Transfers to oneself.' },
        3: { label: "Diego's comparison", explanation: 'FULL OUTER JOIN.' },
        4: { label: "Laura's matrix", explanation: 'Every combination.' },
        5: { label: 'Origin and destination', explanation: 'Two aliases.' },
        6: { label: 'A LEFT JOIN that keeps rows', explanation: 'Filter in the ON.' },
      },
    },
    concepts: {
      same_table_twice: { title: 'The same table twice', summary: 'One alias per role: origin account and destination account.' },
      self_join: { title: 'Self-join', summary: 'Joining a table with itself to compare its rows with each other.' },
      full_outer_join: { title: 'FULL OUTER JOIN', summary: 'Keeps the unmatched rows on both sides; COALESCE for the key.' },
      cross_join: { title: 'CROSS JOIN', summary: 'Every combination of two tables; then LEFT JOIN with the data.' },
      calendar_series: { title: 'Calendars with generate_series', summary: 'One row per month or day so periods without data come out with 0.' },
      on_vs_where: { title: 'ON or WHERE in a LEFT JOIN', summary: "The right-hand table's filter goes in the ON; in the WHERE it cancels the LEFT JOIN." },
    },
    seniorTips: [
      'Read the joins cheat sheet in the wiki.',
      'Inés: cuentas and clientes twice (ao/co and ad/cd) and co.ciudad = cd.ciudad.',
      'Marta: origin with JOIN, destination with LEFT JOIN; co.nombre AS emisor, cd.nombre AS receptor, importe > 5000.',
      "Carmen: generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month') LEFT JOIN the services total per month; mes::date and COALESCE(total, 0).",
      'Nuria: cuentas ao and ad, ao.cliente_id = ad.cliente_id.',
      'Diego: one step per month and FULL OUTER JOIN; COALESCE on the id and on the counts.',
      'Laura: types CROSS JOIN categories, LEFT JOIN payments and COUNT(p.id).',
      "With Inés: two roles, two aliases; and in a LEFT JOIN the right-hand filter goes in the ON.",
    ],
    lessons: {
      twice: {
        question: 'How do I join the same table twice?',
        body: `With **one alias per role**. A transfer has an origin account and a destination account:

\`\`\`
SELECT t.id, co.nombre AS emisor, cd.nombre AS receptor
FROM transferencias t
JOIN cuentas  ao ON ao.id = t.cuenta_origen_id
JOIN clientes co ON co.id = ao.cliente_id
LEFT JOIN cuentas  ad ON ad.id = t.cuenta_destino_id
LEFT JOIN clientes cd ON cd.id = ad.cliente_id;
\`\`\`

\`ao\`/\`co\` = origin, \`ad\`/\`cd\` = destination. The destination goes with \`LEFT JOIN\` because it can be from another bank (NULL).`,
      },
      self: {
        question: 'And joining a table with itself?',
        body: `It's the same thing: a *self-join*. It is used to compare rows of the same table with each other. For example, pairs of customers from the same city:

\`\`\`
SELECT a.id, b.id
FROM clientes a
JOIN clientes b ON b.ciudad = a.ciudad AND b.id > a.id;
\`\`\`

The \`b.id > a.id\` avoids pairing someone with themselves and each pair coming out twice.`,
      },
      full: {
        question: 'What is a FULL OUTER JOIN?',
        body: `It joins two tables and keeps **what is only in one of the two**, on both sides:

\`\`\`
SELECT COALESCE(e.comercio_id, f.comercio_id) AS comercio_id,
       COALESCE(e.n, 0) AS enero, COALESCE(f.n, 0) AS febrero
FROM enero e
FULL OUTER JOIN febrero f ON f.comercio_id = e.comercio_id;
\`\`\`

With LEFT JOIN you would lose the ones that are only in February. Notice the \`COALESCE\` on the id: it can come from either side.`,
      },
      cross: {
        question: 'What is a CROSS JOIN for?',
        body: `It combines **each row of one table with each row of the other**: 2 card types × 8 categories = 16 combinations. It has no \`ON\`.

Useful to build "every possible combination" and then join the real data with \`LEFT JOIN\`, so the ones with no data come out too (with 0).

Careful: 10,000 × 10,000 is 100 million rows.`,
      },
      series: {
        question: 'How do I generate a calendar?',
        body: `\`generate_series(start, end, step)\` returns one row per value:

\`\`\`
SELECT generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month') AS mes;
\`\`\`

14 rows, one per month. Then \`LEFT JOIN\` with the data aggregated per month and \`COALESCE(total, 0)\`: the months without data appear with 0. For days, \`INTERVAL '1 day'\`. \`::date\` leaves it as a date.`,
      },
      on_where: {
        question: 'Does the filter go in the ON or in the WHERE?',
        body: `In a normal \`JOIN\` it doesn't matter. In a \`LEFT JOIN\`, **it does**:

- In the **ON**: it decides which rows on the right are joined. The rows on the left always come out.
- In the **WHERE**: it is applied afterwards. If the condition is on the right-hand table, the unmatched rows (with NULL) don't meet it and disappear: the LEFT JOIN ends up as a normal JOIN.

Rule: the filters of the right-hand table, in the ON (or in a previous step).`,
      },
    },
    quiz: {
      pre: {
        i7pre_twice: {
          question: 'To have the origin and destination account of a transfer…',
          options: ['One JOIN to cuentas with both conditions', 'Two JOINs to cuentas with two aliases', 'A UNION', "You can't"],
          explanation: 'One alias per role.',
        },
        i7pre_self: {
          question: 'In a self-join for pairs of customers, what is `b.id > a.id` for?',
          options: ['To sort', "So you don't pair someone with themselves or repeat pairs", 'It is mandatory in PostgreSQL', 'To filter NULLs'],
          explanation: 'Each pair comes out once.',
        },
        i7pre_full: {
          question: 'What does a FULL OUTER JOIN keep?',
          options: ['Only the rows with a match', 'The ones on the left', 'The ones on both sides, matched or not', 'None'],
          explanation: 'What is missing on one side comes out as NULL.',
        },
        i7pre_cross: {
          question: 'A CROSS JOIN of a 2-row table with an 8-row one gives…',
          options: ['8 rows', '10 rows', '16 rows', '2 rows'],
          explanation: 'Every combination: 2 × 8.',
        },
        i7pre_series: {
          question: "What does `generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2025-03-01', INTERVAL '1 month')` return?",
          options: ['One row', 'Three rows: January, February and March', 'Two rows', 'An interval'],
          explanation: 'It includes the start and the end.',
        },
        i7pre_on_where: {
          question: "`meses LEFT JOIN pagos … WHERE p.estado = 'aceptado'`: what happens to the months without payments?",
          options: ['They come out with NULL', "They disappear: the WHERE doesn't let NULLs through", 'They come out with 0', 'It gives an error'],
          explanation: 'The right-hand filter goes in the ON.',
        },
      },
      post: {
        i7post_twice: {
          question: 'Why is the destination joined with LEFT JOIN?',
          options: ['It is faster', 'Because it can be NULL (another bank) and the transfer has to come out anyway', 'Out of habit', "Because it's the second table"],
          explanation: 'With a normal JOIN the ones that go outside would disappear.',
        },
        i7post_self: {
          question: 'Transfers between accounts of the same customer:',
          options: ['ao.cliente_id = ad.cliente_id with two aliases of cuentas', 'cuenta_origen_id = cuenta_destino_id', 'GROUP BY cliente_id', 'UNION of origin and destination'],
          explanation: 'Two different accounts of the same holder.',
        },
        i7post_full: {
          question: 'In a FULL OUTER JOIN, how do you get the merchant id whichever side it comes from?',
          options: ['e.comercio_id', 'f.comercio_id', 'COALESCE(e.comercio_id, f.comercio_id)', 'MAX(comercio_id)'],
          explanation: 'One of the two may be NULL.',
        },
        i7post_cross: {
          question: 'To also see the type × category combinations without payments:',
          options: ['A normal JOIN with payments', 'CROSS JOIN of types and categories, and LEFT JOIN with the payments', 'UNION ALL', 'GROUP BY tipo, categoria'],
          explanation: 'First every combination; then whatever data there is.',
        },
        i7post_series: {
          question: 'What is a generate_series calendar for in a monthly report?',
          options: ['To sort', 'So the months without data come out (with 0) instead of disappearing', 'To change the time zone', 'To group'],
          explanation: 'And that way LAG compares with the right month.',
        },
        i7post_on_where: {
          question: 'In a LEFT JOIN, where do you put the filter on the right-hand table?',
          options: ['In the WHERE', 'In the ON (or in a previous step)', 'In the GROUP BY', "It doesn't matter"],
          explanation: 'In the WHERE it turns the LEFT JOIN into a normal JOIN.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'The same table, twice',
        body: 'Good morning.\n\nA transfer has **two** accounts: the origin and the destination. To know who sends and who receives you have to join `cuentas` (and `clientes`) **twice**, each one with its alias. Today you will also cross everything with everything (`CROSS JOIN`), put two lists together without losing any (`FULL OUTER JOIN`) and build calendars with `generate_series`.\n\nTo start:\n\n- The transfers **between customers of the same city**: `id` and `ciudad`. The customer who sends and the one who receives, from the same city (not counting the ones that go to other banks).\n\nInés',
      },
      ines_ok: {
        body: 'Twenty-six. Four joins: origin account and customer, destination account and customer. With aliases that say what each thing is (`co`, `cd`…), it reads without getting lost.',
      },
      marta_grandes: {
        body: 'Hi! For the big movements review I want the transfers of **more than €5,000** with the **name of who sends and who receives**: `id`, `importe`, `emisor` and `receptor`. If the destination is from another bank, the receiver empty, but the transfer has to come out.',
      },
      marta_thanks: { body: "Four, and Diego's one goes to another bank. That's why I needed it not to disappear. Thanks!" },
      carmen_calendario: {
        body: 'Hi. I need the accepted amount of the **servicios** (services) category for **every month** from January 2025 to February 2026, **also the ones that had no payments** (with 0). `mes` (as a date, `::date`) and `total`.',
      },
      carmen_thanks: { body: 'Fourteen months, with the zeros of January, February, June, August and December. Now I can compare each month with the previous one. Thanks.' },
      ines_doble_alias: {
        subject: '11:00 · Inés: "Zero transfers"',
        body: '**Inés:** Diego wanted the transfers with their origin and destination account and wrote:\n\n`SELECT … FROM transferencias t JOIN cuentas a ON a.id = t.cuenta_origen_id AND a.id = t.cuenta_destino_id;`\n\nIt gives no error, but it returns **0 rows**. Why?',
        choices: {
          two_aliases: {
            text: 'With a single `JOIN` to `cuentas`, each row joins **one** account, and he asks it to be both the origin and the destination at once: that never happens. You have to join `cuentas` **twice**, with two aliases: `JOIN cuentas ao ON ao.id = t.cuenta_origen_id` and `LEFT JOIN cuentas ad ON ad.id = t.cuenta_destino_id`.',
            reply: 'Exactly. One alias per role: origin and destination are two different accounts, even if they come from the same table.',
            effects: { 2: { text: 'Two roles, two aliases: the same table joined twice.' } },
          },
          or: {
            text: 'That he should change the `AND` to `OR`.',
            reply: 'Rows would come out, but each transfer twice (once with each account) and without knowing which is which.',
            effects: { 0: { text: 'OR mixes origin and destination in the same column.' } },
          },
          empty: {
            text: 'That there are no transfers between Kobalto accounts.',
            reply: 'There are almost a hundred. When a JOIN returns 0 rows, check the condition before concluding there is no data.',
            effects: { 0: { text: 'You accepted a 0 that came from the query.' } },
          },
        },
      },
      nuria_internas: {
        body: 'Hi. A customer asks why they see two identical movements: they say they sent money **to themselves**. Can you get me the transfers in which **origin and destination are accounts of the same customer**? `id` and `cliente_id`.',
      },
      nuria_thanks: { body: "Two transfers of customer 6 between their current account and their savings. I'll explain it to them right now. Thanks!" },
      diego_meses: {
        body: 'Hey. I want to compare merchant by merchant the **number of payments** (any status) of **January** and **February 2026**: `comercio_id`, `enero` and `febrero`. The ones that only have payments in one of the two months should come out, with 0 in the other.',
      },
      diego_thanks: { body: "Twenty merchants. The ones that only appear in February are exactly the ones I couldn't see with my LEFT JOIN. Thanks!" },
      laura_matriz: {
        body: "Hi. I want the tests' **coverage matrix**: each **card type** with each merchant **category** (without the one that has none) and the number of `pagos` of that combination. The combinations without payments too, with 0: they're the ones I still have to test. `tipo`, `categoria` and `pagos`.",
      },
      laura_thanks: { body: 'Sixteen combinations and one at zero: credit in services. Now I know which test case I am missing. Thanks!' },
      ines_on_where: {
        subject: '15:00 · Inés: "The calendar has lost months"',
        body: "**Inés:** Diego made the services calendar like this:\n\n`… FROM meses m LEFT JOIN pagos_tarjeta p ON DATE_TRUNC('month', p.pagado_en) = m.mes LEFT JOIN comercios c ON c.id = p.comercio_id WHERE c.categoria = 'servicios' …`\n\nHe uses `LEFT JOIN` so as not to lose months… and he gets **11** instead of 14. Where are the other three?",
        choices: {
          on: {
            text: "The `WHERE` goes **after** the LEFT JOIN: in the months without services payments, `c.categoria` is NULL and `NULL = 'servicios'` is not met, so the WHERE deletes them and the LEFT JOIN turns into a normal JOIN. Conditions on the right-hand table go in the **ON** (or in a previous step that already filters services).",
            reply: "That's it. In a LEFT JOIN: what decides what gets joined, in the ON; what decides which rows come out, in the WHERE. If you filter the right-hand table in the WHERE, you lose the gaps.",
            effects: { 3: { text: "Filtering a LEFT JOIN's right-hand table: in the ON, not in the WHERE." } },
          },
          full: {
            text: 'That he should change the `LEFT JOIN`s to `FULL OUTER JOIN`.',
            reply: "The WHERE would still delete the rows with NULL. The problem isn't the kind of JOIN, it's where the filter is.",
            effects: { 0: { text: "Changing the JOIN doesn't fix a misplaced filter." } },
          },
          coalesce: {
            text: 'That he should put `COALESCE(SUM(p.importe), 0)`, which is what fills in the zeros.',
            reply: "The COALESCE is already there. But those months don't reach the SUM: the WHERE has removed them before.",
            effects: { 0: { text: "COALESCE doesn't bring back rows the WHERE has already removed." } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you made tricky joins. What are you taking away?',
        choices: {
          lesson: {
            text: 'That the same table is joined several times with one alias per role; that `FULL OUTER JOIN` keeps what is only on one side; that `CROSS JOIN` gives every combination; that `generate_series` builds calendars so gaps are not lost; and that in a LEFT JOIN the right-hand filter goes in the ON.',
            reply: "Very good. Tomorrow, what a data QA likes most: finding data that doesn't add up.",
          },
          two_queries: {
            text: "That it's easier to get origin and destination in two queries and put them together by hand.",
            reply: 'And match a hundred transfers by hand. Check the debrief.',
            effects: { 0: { text: 'You came away with crossing the data by hand.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
