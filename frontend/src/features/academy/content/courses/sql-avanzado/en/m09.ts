import { m09Rendimiento } from '../m09-rendimiento'
import { COMMON_EN, missionEn } from './missionEn'

const RESUMEN = "SELECT DATE_TRUNC('month', fecha)::date AS mes, COUNT(*) AS movimientos, SUM(importe) AS total FROM movimientos GROUP BY 1"

/** Course 7: Advanced SQL · Mission 9 — Performance. English version of ../m09-rendimiento.ts. */
export const m09RendimientoEn = missionEn(m09Rendimiento, {
  ...COMMON_EN,
  title: 'Performance',
  subtitle: 'Keyset pagination, EXISTS and NOT EXISTS, materialized views and DISTINCT ON.',
  dayLabel: 'Friday · month 4',
  verdicts: {
    good: {
      title: 'Fast and correct',
      body: "Pages that don't slow down, accounts with pending items without repeats, a monthly summary that doesn't recalculate 60,000 rows, the accounts without transfers that NOT IN was hiding, March loaded and refreshed, and the last transaction of each account. And no OFFSET 50000.",
    },
    ok: { title: 'Performance, halfway there', body: 'You already write queries that hold up under volume, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: "Queries that don't hold up", body: 'Several tasks were left undone. Replay the mission with the performance cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Performance',
    paragraphs: [
      "Friday. Yesterday it was indexes; today, **how to write** queries so they hold up when there are many rows, and so they also give the right result.",
      "We're still on the **test copy**. Some tasks are done with the exact result and others when the database ends up as asked.",
    ],
    goals: [
      'Paginate by key (WHERE id > … LIMIT) instead of OFFSET.',
      'Ask "does it have any?" with EXISTS.',
      "Find what has none with NOT EXISTS (and know why NOT IN fails with NULL).",
      'Store an expensive summary in a materialized view.',
      'Refresh the materialized view when the data changes.',
      'Get the last one of each group with DISTINCT ON.',
    ],
  },
  docs: {
    chuleta_rendimiento: {
      title: 'Cheat sheet: performance',
      updatedLabel: 'Inés Moreno · Data',
      body: `## Paginating
| Not like this | Like this |
|---|---|
| \`ORDER BY id LIMIT 20 OFFSET 40000\` | \`WHERE id > (last id of the previous page) ORDER BY id LIMIT 20\` |

## Does it have any? Does it have none?
\`\`\`
WHERE EXISTS (SELECT 1 FROM children c WHERE c.parent_id = p.id)
WHERE NOT EXISTS (SELECT 1 FROM children c WHERE c.parent_id = p.id)
\`\`\`
Careful with \`NOT IN (subquery)\`: if the subquery returns any NULL, **nothing** comes out.

## Materialized views
\`\`\`
CREATE MATERIALIZED VIEW name AS SELECT …;   -- calculates and stores
REFRESH MATERIALIZED VIEW name;              -- calculates again
\`\`\`
See the existing ones: \`SELECT matviewname FROM pg_matviews;\`

## The last one of each group
\`\`\`
SELECT DISTINCT ON (grp) grp, …
FROM t
ORDER BY grp, ordering DESC;
\`\`\`

## Today's tables
\`movimientos_nuevos\`: March's 500 transactions, with the same structure as \`movimientos\`, not loaded yet.`,
    },
  },
  sqlLab: {
    starter: '-- Test environment: the usual "deep" page\nEXPLAIN ANALYZE\nSELECT id FROM movimientos ORDER BY id LIMIT 20 OFFSET 50000;',
    retos: {
      keyset: {
        title: 'The next page, without OFFSET',
        description: "The app shows **account 5**'s transactions 20 at a time, ordered by `id`. The page on screen ends at **id 30000**. Ask for the **next** one: `id`, `fecha`, `importe` and `concepto`, **without OFFSET**.",
        hint: '`WHERE cuenta_id = 5 AND id > 30000 ORDER BY id LIMIT 20`.',
        forbid: { 0: { message: 'No OFFSET: carry on from the last id of the previous page (`id > 30000`).' } },
        requires: {
          0: { message: 'Carry on from the last id seen: `id > 30000`.' },
          1: { message: 'A page is 20 rows: `LIMIT 20`.' },
        },
      },
      con_pendientes: {
        title: 'The accounts with any pending transaction',
        description: 'The **accounts** that have **at least one** transaction with status **pending** (`pendiente`): `id` and `cliente_id`, **one row per account**.',
        hint: "`FROM cuentas a WHERE EXISTS (SELECT 1 FROM movimientos m WHERE m.cuenta_id = a.id AND m.estado = 'pendiente')`.",
        requires: { 0: { message: 'Ask "does it have any?" with `WHERE EXISTS (SELECT 1 FROM movimientos …)`.' } },
      },
      resumen_mensual: {
        title: 'The monthly summary, calculated once',
        description: 'Create the **materialized view** `resumen_mensual` with one row per month: `mes` (date, the 1st of the month), `movimientos` (how many) and `total` (sum of the amount).',
        hint: `\`CREATE MATERIALIZED VIEW resumen_mensual AS ${RESUMEN};\``,
        requires: { 0: { message: 'This task is done with `CREATE MATERIALIZED VIEW resumen_mensual AS …`.' } },
      },
      sin_transferencias: {
        title: 'The accounts that have never received a transfer',
        description: "The **accounts** that **don't appear as the destination** (`cuenta_destino_id`) of any transfer: `id` and `cliente_id`.",
        hint: '`WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id)`.',
      },
      refresh: {
        title: 'March loaded and in the summary',
        description: "Load into `movimientos` the 500 transactions from **March** waiting in `movimientos_nuevos`, and make `resumen_mensual` show them.",
        hint: '`INSERT INTO movimientos SELECT * FROM movimientos_nuevos;` and then `REFRESH MATERIALIZED VIEW resumen_mensual;`',
        requires: { 0: { message: "The materialized view doesn't find out by itself: `REFRESH MATERIALIZED VIEW resumen_mensual;`." } },
      },
      ultimo_movimiento: {
        title: 'The last transaction of each account',
        description: 'For each account, its **last** transaction (the one with the highest `id`): `cuenta_id`, `id`, `fecha` and `importe`. One row per account.',
        hint: '`SELECT DISTINCT ON (cuenta_id) cuenta_id, id, fecha, importe FROM movimientos ORDER BY cuenta_id, id DESC`.',
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'The "you have pending transactions" notice arrives repeated', explanation: 'A JOIN returned the account once for each pending one.', technique: 'EXISTS: one row per account, and it stops at the first one.' },
    'C-CARMEN': { title: "Risk's monthly dashboard takes half a minute to open", explanation: 'Each opening recalculated the summary over 60,000 rows.', technique: 'Materialized view.' },
    'C-NURIA': { title: 'The welcome campaign for accounts without transfers reaches nobody', explanation: 'NOT IN with a NULL in the subquery returned no account.', technique: 'NOT EXISTS.' },
    'C-DIEGO': { title: "The monthly summary doesn't have March", explanation: "The data was loaded, but the materialized view wasn't refreshed.", technique: 'REFRESH MATERIALIZED VIEW after each load.' },
    'C-LAURA': { title: 'The "last transaction" report repeats accounts', explanation: 'Without DISTINCT ON, every transaction of the last date came out.', technique: 'DISTINCT ON (cuenta_id) … ORDER BY cuenta_id, id DESC.' },
    'C-OFFSET': { title: 'The last pages of the history take seconds and repeat rows', explanation: 'OFFSET reads and discards every previous row, and shifts if new rows come in.', technique: 'Keyset pagination: WHERE id > last LIMIT n.' },
    'C-NOTIN': { title: 'A "without …" report comes out empty without an error', explanation: 'NOT IN (subquery) with any NULL is never true.', technique: 'NOT EXISTS, or filter the NULLs out of the subquery.' },
  },
  prevention: {
    title: 'At the end of the week',
    intro: "What happened with Friday's queries.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's notices", explanation: 'One row per account with EXISTS.' },
      1: { label: "Carmen's dashboard", explanation: 'Materialized summary.' },
      2: { label: "Nuria's campaign", explanation: 'NOT EXISTS.' },
      3: { label: "Diego's load", explanation: 'March in the summary.' },
      4: { label: "Laura's report", explanation: 'DISTINCT ON.' },
      5: { label: 'Pagination', explanation: 'By key, not by OFFSET.' },
      6: { label: 'NOT IN and NULL', explanation: 'NOT EXISTS instead.' },
    },
  },
  concepts: {
    keyset: { title: 'Keyset pagination', summary: "WHERE id > last_seen ORDER BY id LIMIT n: every page costs the same and doesn't shift." },
    offset_cost: { title: 'What OFFSET costs', summary: 'OFFSET n reads and discards n rows: deep pages are slow, and a new row shifts all the others.' },
    exists: { title: 'EXISTS', summary: "Does it have any? It stops at the first and doesn't repeat the outer row, unlike a JOIN." },
    not_in_null: { title: 'NOT EXISTS and NOT IN', summary: "x NOT IN (… NULL …) is never true; NOT EXISTS doesn't have that problem." },
    matview: { title: 'Materialized views', summary: 'They store the result of an expensive query; reading it is reading a small table.' },
    refresh: { title: 'REFRESH MATERIALIZED VIEW', summary: "The materialized view doesn't change by itself: you have to refresh it when the data changes." },
    distinct_on: { title: 'DISTINCT ON', summary: 'One row per group: the first according to the ORDER BY, which starts with the DISTINCT ON columns.' },
  },
  seniorTips: [
    'Read the performance cheat sheet in the wiki.',
    'Inés: WHERE cuenta_id = 5 AND id > 30000 ORDER BY id LIMIT 20, without OFFSET.',
    "Marta: FROM cuentas a WHERE EXISTS (SELECT 1 FROM movimientos m WHERE m.cuenta_id = a.id AND m.estado = 'pendiente').",
    "Carmen: CREATE MATERIALIZED VIEW resumen_mensual AS SELECT DATE_TRUNC('month', fecha)::date AS mes, COUNT(*) AS movimientos, SUM(importe) AS total FROM movimientos GROUP BY 1.",
    'Nuria: WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id).',
    'Diego: INSERT INTO movimientos SELECT * FROM movimientos_nuevos; REFRESH MATERIALIZED VIEW resumen_mensual;',
    'Laura: SELECT DISTINCT ON (cuenta_id) cuenta_id, id, fecha, importe FROM movimientos ORDER BY cuenta_id, id DESC.',
    "With Inés: a deep OFFSET is paid for on every page, and NOT IN with a NULL returns nothing.",
  ],
  lessons: {
    keyset: {
      question: 'How do I paginate without OFFSET?',
      body: `By remembering **where** the previous page **ended**:

\`\`\`
-- first page
SELECT … FROM movimientos WHERE cuenta_id = 5 ORDER BY id LIMIT 20;
-- next ones: from the last id seen
SELECT … FROM movimientos WHERE cuenta_id = 5 AND id > 30000 ORDER BY id LIMIT 20;
\`\`\`

With an index on the ordering column, every page costs the same, whether it's the second or the thousandth. The order has to be **unique** (if you order by date, add the id: \`WHERE (fecha, id) > (…, …) ORDER BY fecha, id\`). What you can't do is jump straight to "page 37".`,
    },
    offset_cost: {
      question: "What's wrong with OFFSET?",
      body: `\`LIMIT 20 OFFSET 50000\` **reads 50,020 rows** and throws away 50,000. The deeper the page, the slower:

\`\`\`
Limit  (actual time=30.764..30.780 rows=20)
  ->  Index Only Scan using movimientos_pkey  (… rows=50020)
\`\`\`

And if a new row comes in at the start between one page and the next, everything shifts by one: the next page repeats the last row of the previous one (or skips one if a row is deleted). With keyset pagination, it doesn't.`,
    },
    exists: {
      question: 'Why EXISTS and not a JOIN?',
      body: `For "the accounts that have any pending transaction":

- \`JOIN movimientos\` returns the account **once for every** pending one: you have to add DISTINCT, and the database has joined all those rows for nothing.
- \`WHERE EXISTS (SELECT 1 FROM movimientos m WHERE m.cuenta_id = a.id AND …)\` returns each account **once** and stops looking as soon as it finds the first one.

It doesn't matter what you put in the inner SELECT (\`SELECT 1\` is the custom): only whether there are rows matters.`,
    },
    not_in_null: {
      question: 'Why can NOT IN return nothing?',
      body: `\`id NOT IN (1, 2, NULL)\` means \`id <> 1 AND id <> 2 AND id <> NULL\`. And \`id <> NULL\` is NULL (unknown), so the condition is **never true**:

\`\`\`
SELECT COUNT(*) FROM cuentas
WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias);  -- 0
\`\`\`

In \`transferencias\` there are 24 transfers without a destination account (to other banks): \`cuenta_destino_id\` is NULL. \`NOT EXISTS\` doesn't have that problem. If you use NOT IN, filter: \`… WHERE cuenta_destino_id IS NOT NULL\`.`,
    },
    matview: {
      question: 'What is a materialized view?',
      body: `A normal view is a stored query: it runs **every time** you read it. A materialized one **stores the result**:

\`\`\`
CREATE MATERIALIZED VIEW resumen_mensual AS
SELECT DATE_TRUNC('month', fecha)::date AS mes, COUNT(*) AS movimientos, SUM(importe) AS total
FROM movimientos GROUP BY 1;
\`\`\`

Reading it means reading fourteen rows instead of grouping 60,000. In exchange, it **doesn't update itself**. You can add indexes to it like a table. It's for summaries that are read a lot and can lag a little behind.`,
    },
    refresh: {
      question: 'How do I bring a materialized view up to date?',
      body: `\`\`\`
REFRESH MATERIALIZED VIEW resumen_mensual;
\`\`\`

It runs the query again and replaces what was stored. While it runs, the view is locked for reading. With \`REFRESH MATERIALIZED VIEW CONCURRENTLY\` it can still be read, but it needs a unique index on the view.

The usual thing: refresh after each load, or every so often. And show on the dashboard **how old** the data is.`,
    },
    distinct_on: {
      question: 'How do I get the last one of each group?',
      body: `In PostgreSQL, with \`DISTINCT ON\`:

\`\`\`
SELECT DISTINCT ON (cuenta_id) cuenta_id, id, fecha, importe
FROM movimientos
ORDER BY cuenta_id, id DESC;
\`\`\`

It keeps the **first row of each account** according to the ORDER BY, which has to start with the same columns as the DISTINCT ON. It does the same as \`ROW_NUMBER() OVER (PARTITION BY cuenta_id ORDER BY id DESC) = 1\`, but shorter. If the order ties (two with the same date), add a tiebreaker.`,
    },
  },
  quiz: {
    pre: {
      a9pre_offset: { question: 'How many rows does `ORDER BY id LIMIT 20 OFFSET 50000` read?', options: ['20', 'About 50,020', '50,000', 'It depends on the index: always 20'], explanation: 'It reads and discards the first 50,000.' },
      a9pre_keyset: { question: 'The last page ended at id 30000. How do you ask for the next one?', options: ['OFFSET 30000', 'WHERE id > 30000 ORDER BY id LIMIT 20', 'WHERE id = 30001', 'LIMIT 30020'], explanation: 'Keyset pagination.' },
      a9pre_exists: { question: 'What does `WHERE EXISTS (SELECT 1 FROM …)` return?', options: ['The number 1', 'The outer rows for which the subquery has some row', 'The subquery', 'An error'], explanation: 'Only whether there are rows matters.' },
      a9pre_notin: { question: 'What is `5 NOT IN (1, 2, NULL)`?', options: ['true', 'false', 'NULL', 'Error'], explanation: '5 <> NULL is NULL.' },
      a9pre_matview: { question: 'How is a materialized view different from a normal one?', options: ["It isn't", 'It stores the result; the normal one is calculated when read', 'It can only be read once', "It doesn't allow GROUP BY"], explanation: 'And that is why you have to refresh it.' },
      a9pre_distinct: { question: '`DISTINCT ON (cuenta_id) … ORDER BY cuenta_id, id DESC` returns…', options: ['Every row', 'One row per account: the one with the highest id', 'The accounts without repeats, with no other columns', 'An error'], explanation: 'The first of each group according to the ORDER BY.' },
    },
    post: {
      a9post_notin: { question: '`WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias)` returns 0 rows. Why?', options: ['There are no accounts without transfers', 'The subquery has some NULL', 'An index is missing', "NOT IN doesn't work with subqueries"], explanation: 'With a single NULL, NOT IN is never true.' },
      a9post_refresh: { question: 'You load 500 new transactions. What does the materialized view show?', options: ['The new ones too', 'What it had before the load, until a REFRESH', 'Nothing', 'An error'], explanation: "It doesn't update itself." },
      a9post_shift: { question: 'With OFFSET, a new transaction comes in while the user moves to the next page. What do they see?', options: ['Nothing odd', 'The last row of the previous page, repeated', 'An error', 'An empty page'], explanation: 'Everything shifts by one position.' },
      a9post_exists: { question: "An account has 3 pending transactions. How many times does it come out with `JOIN movimientos … WHERE estado = 'pendiente'`?", options: ['1', '3', '0', 'It depends'], explanation: 'With EXISTS it would come out once.' },
      a9post_keyset: { question: 'You paginate by `fecha`, which repeats. What do you need?', options: ['Nothing', 'A unique tiebreaker: ORDER BY fecha, id and WHERE (fecha, id) > (…, …)', 'OFFSET', 'DISTINCT'], explanation: 'The order has to be unique so you neither lose nor repeat rows.' },
      a9post_distinct: { question: 'What must the ORDER BY satisfy with DISTINCT ON (cuenta_id)?', options: ['Nothing', 'Start with cuenta_id', 'End with cuenta_id', 'Not use DESC'], explanation: 'The DISTINCT ON columns go first.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: 'Make it hold up',
      body: "Good morning, last day of the week.\n\nYesterday you added indexes. Today it's about **writing** queries so they hold up when there are many rows, and also give what they should. We're still on the test copy.\n\nTo start, the app's history. It shows an account's transactions 20 at a time with `OFFSET`, and the last pages take seconds. Look at the `EXPLAIN ANALYZE` I left you in the console.\n\n- **Account 5**, ordered by `id`: the page on screen ends at **id 30000**. Ask for the **next** one (`id`, `fecha`, `importe`, `concepto`) **without OFFSET**.\n\nInés",
    },
    ines_ok: {
      body: "Twenty rows from 30032. And page one thousand would cost the same, because it doesn't have to count the previous ones.",
    },
    marta_pendientes: {
      body: 'Hi! We are going to send the "you have pending transactions" notice. I want the **accounts** with **at least one** **pending** transaction: `id` and `cliente_id`, **one row per account** (last month someone got the notice five times).',
    },
    marta_thanks: { body: 'Thirteen accounts, each one once. Thanks!' },
    carmen_resumen: {
      body: "Hi. My monthly dashboard groups the 60,000 transactions **every time someone opens it**. The data only changes with each night's load. Can you store the summary in a **materialized view** `resumen_mensual`, with `mes` (date, the 1st), `movimientos` and `total`?",
    },
    carmen_thanks: { body: 'The dashboard reads fourteen rows and opens instantly. Thanks.' },
    ines_offset: {
      subject: '11:00 · Inés: "an index will fix it"',
      body: '**Inés:** Rubén says the OFFSET thing doesn\'t need changing: "with an index on `id`, `OFFSET 50000` goes straight to row 50,000". Also, Customer service complain that sometimes, when moving to the next page, **they see a repeated row**. What do you tell him?',
      choices: {
        keyset: {
          text: "That an index can't \"jump\" 50,000 positions: with OFFSET the database **reads and discards** every previous row, and the deeper the page, the slower it is. And the repeated row is OFFSET too: if a new transaction comes in between one page and the next, everything shifts by one position. Both are fixed by paginating by key: `WHERE id > last_seen ORDER BY id LIMIT 20`.",
          reply: "Exactly. EXPLAIN ANALYZE shows it: rows=50020 to return 20. And keyset pagination doesn't shift.",
          effects: { 2: { text: 'OFFSET reads and throws away the previous rows; by key, every page costs the same.' } },
        },
        index: {
          text: "That he's right: with a good index, OFFSET is just as fast.",
          reply: "Look at the plan: Index Only Scan with rows=50020. It goes through the index, yes, but walks 50,020 entries to return 20.",
          effects: { 0: { text: 'You believed an index makes OFFSET free.' } },
        },
        cache: {
          text: 'That the app should store every page the first time.',
          reply: 'Sixty thousand rows in memory for every user? And they would still see old data. The problem is how the page is requested.',
          effects: { 0: { text: 'You suggested hiding the problem in the app.' } },
        },
      },
    },
    nuria_bienvenida: {
      body: "Hi. We want to call the customers whose accounts **have never received a transfer**, to explain how to do it. The **accounts** that don't appear as the destination (`cuenta_destino_id`) of any transfer: `id` and `cliente_id`. Rubén tried it and got nothing…",
    },
    nuria_thanks: { body: 'Three accounts: 21, 32 and 47. Rubén was getting zero. Thanks!' },
    diego_marzo: {
      body: "Hey. I have **March's 500 transactions** in `movimientos_nuevos`, with the same structure. Can you load them into `movimientos` and make Carmen's monthly summary show them?",
    },
    diego_thanks: { body: "March now shows up in the summary, with its 500 transactions. I'm adding it to the load process: after the INSERT, the REFRESH. Thanks!" },
    laura_ultimo: {
      body: 'Hi. For the statement tests I need the **last transaction of each account** (the one with the highest `id`): `cuenta_id`, `id`, `fecha` and `importe`. One row per account.',
    },
    laura_thanks: { body: 'One row per account, fifty-two. Just what I needed. Thanks!' },
    ines_notin: {
      subject: '15:00 · Inés: "zero accounts"',
      body: "**Inés:** Rubén's attempt at Nuria's list. He wrote:\n\n`SELECT id, cliente_id FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias);`\n\nAnd he got **zero** accounts, without any error. You found three. What happened to him?",
      choices: {
        null: {
          text: "That there are transfers to **other banks** with a NULL `cuenta_destino_id`. `id NOT IN (…, NULL)` is `id <> … AND id <> NULL`, and `id <> NULL` is unknown: the condition is **never true**. With `NOT EXISTS` that doesn't happen; or, if he uses NOT IN, `WHERE cuenta_destino_id IS NOT NULL` in the subquery.",
          reply: "That's it. A single NULL in the subquery and NOT IN returns nothing. That's why, for \"the ones that have none\", always NOT EXISTS.",
          effects: { 3: { text: 'NOT IN with a NULL in the subquery returns nothing: NOT EXISTS.' } },
        },
        distinct: {
          text: 'That he was missing a DISTINCT in the subquery.',
          reply: "Repeats don't change the result of NOT IN. What breaks it is a NULL.",
          effects: { 0: { text: 'You looked for repeats where there was a NULL.' } },
        },
        data: {
          text: 'That the data changed between his query and yours.',
          reply: "It's the same copy and nobody has touched the transfers. Try his query: it still gives zero.",
          effects: { 0: { text: 'You blamed the data for a NOT IN with NULL.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the week with Inés',
      body: "**Inés:** Week done: changing data, rules, functions, indexes and today performance. Next week, the practical exam. What are you taking away from today?",
      choices: {
        lesson: {
          text: 'That you paginate by key (id > last seen) and not with OFFSET; that "does it have any?" is EXISTS and "has none" is NOT EXISTS, because NOT IN with a NULL returns nothing; that an expensive summary goes in a materialized view that must be refreshed after each load; and that DISTINCT ON gives the last one of each group.',
          reply: 'Very good. With this you have everything in the course. Review the week before the exam.',
        },
        hardware: {
          text: "That if it's slow, the best thing is a bigger server.",
          reply: "A server twice as big doesn't fix an OFFSET 50000 or a NOT IN that returns zero. Check the debrief.",
          effects: { 0: { text: 'You came away with fixing it with more hardware.' } },
        },
      },
    },
  },
})
