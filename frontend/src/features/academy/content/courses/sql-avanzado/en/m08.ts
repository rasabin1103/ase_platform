import { m08Indices } from '../m08-indices'
import { COMMON_EN, missionEn } from './missionEn'

const CREATE_INDEX = { 0: { message: 'This task is done by creating an index: `CREATE INDEX name ON table (…)`.' } }
const EXTRACTO = "SELECT * FROM movimientos WHERE cuenta_id = 5 AND fecha >= '2026-02-01' ORDER BY fecha"
const PENDIENTES = "SELECT * FROM movimientos WHERE estado = 'pendiente' ORDER BY fecha"
const CONCEPTO = "SELECT * FROM movimientos WHERE LOWER(concepto) = 'recibo agua'"

/** Course 7: Advanced SQL · Mission 8 — Indexes and plans. English version of ../m08-indices.ts. */
export const m08IndicesEn = missionEn(m08Indices, {
  ...COMMON_EN,
  title: 'Indexes and plans',
  subtitle: 'EXPLAIN, simple, composite, partial and expression indexes, and queries that can use them.',
  dayLabel: 'Thursday · month 4',
  verdicts: {
    good: {
      title: 'Queries that get straight to the point',
      body: "Marta's statement, Carmen's pending items, Nuria's search and Diego's report now use indexes, and Laura has one repeated index fewer. And nobody filled the table with indexes \"just in case\".",
    },
    ok: { title: 'Indexes, halfway there', body: 'You already read plans and create indexes, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Seq Scan everywhere', body: 'Several tasks were left undone. Replay the mission with the indexes cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Indexes and plans',
    paragraphs: [
      "Thursday. `movimientos` (transactions) has **60,000 rows** and several queries are slow. Today it's about looking at **how** PostgreSQL runs them (`EXPLAIN`) and giving it the indexes it needs, not one more.",
      "We're still on the **test copy**. Each task is done when the query's plan uses an index as asked (Inés checks it with EXPLAIN).",
    ],
    goals: [
      'Read a plan: Seq Scan, Index Scan, Bitmap, cost and rows.',
      'Create an index for a filter on one column.',
      'Create a composite index in the right order.',
      'Create a partial index and one on an expression.',
      'Rewrite a condition so it can use an index.',
      'Remove an index that is not needed.',
    ],
  },
  docs: {
    chuleta_indices: {
      title: 'Cheat sheet: indexes and plans',
      updatedLabel: 'Inés Moreno · Data',
      body: `## movimientos (60,000 rows)
\`id, cuenta_id, fecha, importe, tipo, concepto, estado\`

## See the plan
| Statement | What it does |
|---|---|
| \`EXPLAIN query\` | the plan, without running it |
| \`EXPLAIN ANALYZE query\` | runs it and gives real times and rows |

| In the plan | Means |
|---|---|
| Seq Scan | reads the whole table |
| Index Scan / Index Only Scan | goes through an index |
| Bitmap Index Scan + Bitmap Heap Scan | uses the index to mark the rows and then reads them |
| Index Cond | the part of the WHERE the index solves |
| Filter | what is checked row by row |
| cost=…, rows=… | the planner's estimate |

## Indexes
\`\`\`
CREATE INDEX name ON table (col);                 -- simple
CREATE INDEX name ON table (col1, col2);          -- composite
CREATE INDEX name ON table (col) WHERE condition; -- partial
CREATE INDEX name ON table (LOWER(col));          -- expression
DROP INDEX name;
\`\`\`
See the existing ones: \`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'movimientos';\``,
    },
  },
  sqlLab: {
    starter: '-- Test environment: how PostgreSQL runs a query\nEXPLAIN ANALYZE\nSELECT * FROM movimientos WHERE cuenta_id = 5;',
    retos: {
      indice_cuenta: {
        title: "An account's transactions, through an index",
        description: 'Make `SELECT * FROM movimientos WHERE cuenta_id = 5` stop reading the whole table: create the index it needs.',
        hint: '`CREATE INDEX movimientos_cuenta_idx ON movimientos (cuenta_id);` and look at the plan again with EXPLAIN.',
        requires: CREATE_INDEX,
      },
      indice_compuesto: {
        title: 'The statement, with a single index',
        description: `Marta asks for the account statement: \`${EXTRACTO}\`. Create an index that solves **both conditions** (account and date) at once.`,
        hint: 'A composite index, with the equality column first: `CREATE INDEX movimientos_cuenta_fecha_idx ON movimientos (cuenta_id, fecha);`',
        requires: CREATE_INDEX,
      },
      indice_parcial: {
        title: 'The pending ones, with a small index',
        description: `Carmen's dashboard queries \`${PENDIENTES}\`. That's 300 out of 60,000 rows: create an index that **only stores the pending ones**.`,
        hint: "A partial index: `CREATE INDEX movimientos_pendientes_idx ON movimientos (fecha) WHERE estado = 'pendiente';`",
        requires: { ...CREATE_INDEX, 1: { message: "Make the index store only the pending ones: `CREATE INDEX … WHERE estado = 'pendiente'`." } },
      },
      indice_expresion: {
        title: 'Searching descriptions regardless of case',
        description: `Customer service searches with \`${CONCEPTO}\` (the descriptions are written every which way). Create the index this search can use.`,
        hint: 'An index on the same expression as the WHERE: `CREATE INDEX movimientos_concepto_idx ON movimientos (LOWER(concepto));`',
        requires: CREATE_INDEX,
      },
      fecha_sargable: {
        title: "February's report, without touching the column",
        description: 'The monthly report counts the transactions of **February 2026** with `EXTRACT(YEAR FROM fecha) = 2026 AND EXTRACT(MONTH FROM fecha) = 2` and reads the whole table. Write the query so it can use the index on `fecha`: one column `movimientos` with the number.',
        hint: "Compare the column as it is with a range: `WHERE fecha >= '2026-02-01' AND fecha < '2026-03-01'`.",
        forbid: { 0: { message: "If you apply a function to `fecha`, the index is no use: compare the column as it is with a date range." } },
        requires: { 0: { message: "Use a range on the column: `fecha >= '2026-02-01' AND fecha < '2026-03-01'`." } },
      },
      indice_duplicado: {
        title: 'One repeated index too many',
        description: 'Laura suspects `movimientos` has **two identical indexes**. Find them and remove one: there must still be an index on `fecha`.',
        hint: "`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'movimientos';` and `DROP INDEX` the extra one.",
        requires: { 0: { message: 'This task is done by removing an index: `DROP INDEX name;`.' } },
      },
    },
  },
  bugs: {
    'C-MARTA': { title: "The app's account statement takes several seconds", explanation: 'It read the whole table for each account.', technique: 'Composite index (cuenta_id, fecha).' },
    'C-CARMEN': { title: "Risk's pending items dashboard hangs", explanation: 'It looked for 300 rows among 60,000 without an index.', technique: "Partial index WHERE estado = 'pendiente'." },
    'C-NURIA': { title: "Customer service's searches crawl along", explanation: 'An index on concepto is no use for LOWER(concepto).', technique: 'Expression index on LOWER(concepto).' },
    'C-DIEGO': { title: 'The monthly report locks up the database at the end of the month', explanation: 'EXTRACT on fecha prevented using the index.', technique: 'A range on the column without functions.' },
    'C-LAURA': { title: 'Transaction loads are slower than normal', explanation: 'Each INSERT maintained two identical indexes.', technique: 'Check pg_indexes and remove the repeated one.' },
    'C-LIKE': { title: "A new index and the '%agua%' search is still just as slow", explanation: 'A LIKE that starts with % cannot use a normal index.', technique: 'Search from the start, by equality with LOWER or with a trigram index.' },
    'C-SOBRE': { title: 'Eight new indexes and writes are twice as slow', explanation: 'An index on every column "just in case" is paid for on every INSERT and UPDATE.', technique: 'Indexes for real queries, checked with EXPLAIN.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Thursday's indexes.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's statement", explanation: 'Composite index.' },
      1: { label: "Carmen's dashboard", explanation: 'Partial index.' },
      2: { label: "Nuria's searches", explanation: 'Expression index.' },
      3: { label: "Diego's report", explanation: 'A range on the column.' },
      4: { label: "Laura's loads", explanation: 'One repeated index fewer.' },
      5: { label: 'LIKE and wildcards', explanation: 'No leading % for a normal index.' },
      6: { label: 'Just enough indexes', explanation: 'Only the ones someone uses.' },
    },
  },
  concepts: {
    explain: { title: 'EXPLAIN and EXPLAIN ANALYZE', summary: 'The plan PostgreSQL picks: Seq Scan, Index Scan, Bitmap; estimated costs and rows (and real ones with ANALYZE).' },
    btree: { title: 'Simple index', summary: 'An index on a column speeds up equalities, ranges and ORDER BY on it.' },
    composite: { title: 'Composite index', summary: 'It works for the leftmost columns: (cuenta_id, fecha) works for cuenta_id and for cuenta_id + fecha, not for fecha alone.' },
    partial: { title: 'Partial index', summary: 'CREATE INDEX … WHERE: it only stores the rows that matter; small and fast.' },
    expression: { title: 'Expression index', summary: 'An index on LOWER(col) works for WHERE LOWER(col) = …; one on col does not.' },
    sargable: { title: 'Conditions that use indexes', summary: 'No functions on the column and no leading % in a LIKE: fecha >= … AND fecha < …' },
    index_cost: { title: 'What an index costs', summary: 'It takes space and is updated on every INSERT, UPDATE and DELETE; repeated or unused ones are not needed.' },
  },
  seniorTips: [
    'Read the indexes and plans cheat sheet in the wiki.',
    'Inés: CREATE INDEX ON movimientos (cuenta_id) and EXPLAIN again.',
    'Marta: CREATE INDEX ON movimientos (cuenta_id, fecha): equality first, range after.',
    "Carmen: CREATE INDEX ON movimientos (fecha) WHERE estado = 'pendiente'.",
    'Nuria: CREATE INDEX ON movimientos (LOWER(concepto)).',
    "Diego: SELECT COUNT(*) AS movimientos FROM movimientos WHERE fecha >= '2026-02-01' AND fecha < '2026-03-01'.",
    'Laura: movimientos_fecha_idx and idx_mov_fecha are identical: DROP INDEX one of them.',
    'With Inés: LIKE with a leading % does not use normal indexes, and every index is paid for when writing.',
  ],
  lessons: {
    explain: {
      question: 'How do I read a plan?',
      body: `\`EXPLAIN\` shows the plan without running it; \`EXPLAIN ANALYZE\` runs it and adds what really happened:

\`\`\`
Seq Scan on movimientos  (cost=0.00..1322.00 rows=1066 width=44)
                         (actual time=0.049..10.371 rows=1154 loops=1)
  Filter: (cuenta_id = 5)
  Rows Removed by Filter: 58846
\`\`\`

- **Seq Scan**: it read all 60,000 rows and threw away 58,846.
- **cost**: planner units (not milliseconds); the second number is the total.
- **rows**: estimated rows; with ANALYZE, the real ones too. If they are far apart, the statistics are old (\`ANALYZE table\`).`,
    },
    btree: {
      question: 'What does an index do?',
      body: `It's a sorted list of a column's values with where each row is, like the index of a book:

\`\`\`
CREATE INDEX movimientos_cuenta_idx ON movimientos (cuenta_id);
\`\`\`

It works for \`=\`, \`<\`, \`>\`, \`BETWEEN\`, \`ORDER BY\` and \`LIKE 'abc%'\` on that column. With many rows, PostgreSQL uses a **Bitmap**: it marks the rows in the index and then reads them in order. If the query returns almost the whole table, a Seq Scan is faster and it will keep choosing it: that's not a bug.`,
    },
    composite: {
      question: 'In what order do I put the columns of a composite index?',
      body: `The index \`(cuenta_id, fecha)\` is sorted by account and, within each account, by date. That's why:

| Query | Does it use it? |
|---|---|
| \`cuenta_id = 5\` | yes |
| \`cuenta_id = 5 AND fecha >= …\` | yes, both |
| \`fecha >= …\` | not well: the first column is missing |

Rule of thumb: **equality** columns first, then the **range** or ordering one. And an index on \`(cuenta_id)\` is redundant if you already have \`(cuenta_id, fecha)\`.`,
    },
    partial: {
      question: 'What is a partial index?',
      body: `An index that only stores **some rows**:

\`\`\`
CREATE INDEX movimientos_pendientes_idx
  ON movimientos (fecha) WHERE estado = 'pendiente';
\`\`\`

It has 300 entries instead of 60,000: it takes little space and is barely noticeable when writing. It is used when the query's WHERE includes the index's condition (\`estado = 'pendiente'\`). Ideal for "the few things that need reviewing".`,
    },
    expression: {
      question: "Why doesn't my index work for LOWER(concepto)?",
      body: `The index on \`concepto\` stores "Recibo luz", "recibo agua", "NÓMINA"… as they are. The query searches by \`LOWER(concepto)\`, which is **another value**. You need an index on the same expression:

\`\`\`
CREATE INDEX movimientos_concepto_idx ON movimientos (LOWER(concepto));
\`\`\`

The query has to use exactly that expression. The same goes for \`(datos->>'codigo')\` in a JSON or for \`DATE(fecha_hora)\`.`,
    },
    sargable: {
      question: 'Which conditions can use an index?',
      body: `The ones that compare the **column as it is**:

| Doesn't use the date index | Does use it |
|---|---|
| \`EXTRACT(MONTH FROM fecha) = 2\` | \`fecha >= '2026-02-01' AND fecha < '2026-03-01'\` |
| \`fecha::text LIKE '2026-02%'\` | the same |
| \`importe * 1.21 > 100\` | \`importe > 100 / 1.21\` |
| \`concepto LIKE '%agua%'\` | \`concepto LIKE 'Recibo%'\`* |

When you apply a function to the column, the index (sorted by the column) doesn't help. *A LIKE prefix needs \`text_pattern_ops\` or the C collation.`,
    },
    index_cost: {
      question: "Why don't I put an index on every column?",
      body: `Because each index:

- **takes** space (sometimes as much as the table),
- is **updated** on every INSERT, UPDATE and DELETE: more indexes, slower writes,
- and the planner only uses one or a few per query.

Create indexes for real queries and check them with EXPLAIN. To find the ones that aren't needed: repeated ones in \`pg_indexes\`, and unused ones in \`pg_stat_user_indexes\` (\`idx_scan = 0\`).`,
    },
  },
  quiz: {
    pre: {
      a8pre_seq: { question: 'What does "Seq Scan" mean in a plan?', options: ['That it uses an index', 'That it reads the whole table', 'That it sorts', 'That there is an error'], explanation: 'Row by row, from start to finish.' },
      a8pre_analyze: { question: 'What does `EXPLAIN ANALYZE` add to `EXPLAIN`?', options: ['Nothing', 'It runs the query and gives real times and rows', 'It creates the indexes', 'It updates the statistics'], explanation: 'Careful with an UPDATE: ANALYZE really runs it.' },
      a8pre_btree: { question: 'An index on `cuenta_id` helps…', options: ['Only ORDER BY', 'WHERE cuenta_id = 5, ranges and ORDER BY cuenta_id', 'Any query on the table', 'INSERTs'], explanation: 'INSERTs, on the contrary, become a little slower.' },
      a8pre_comp: { question: 'With the index `(cuenta_id, fecha)`, which query makes the worst use of it?', options: ['cuenta_id = 5', 'cuenta_id = 5 AND fecha > …', 'fecha > … (without account)', 'cuenta_id = 5 ORDER BY fecha'], explanation: "The index's first column is missing." },
      a8pre_partial: { question: "What does `CREATE INDEX … ON movimientos (fecha) WHERE estado = 'pendiente'` store?", options: ['Every date', 'Only the dates of the pending ones', 'Only the statuses', 'Nothing'], explanation: 'A partial index.' },
      a8pre_expr: { question: "There's an index on `concepto`. Does `WHERE LOWER(concepto) = 'recibo agua'` use it?", options: ['Yes', 'No: you need an index on LOWER(concepto)', 'Only with ANALYZE', 'Only if there are few rows'], explanation: 'The index stores concepto, not LOWER(concepto).' },
    },
    post: {
      a8post_sarg: { question: 'Which condition can use the index on `fecha`?', options: ['EXTRACT(MONTH FROM fecha) = 2', "fecha >= '2026-02-01' AND fecha < '2026-03-01'", "fecha::text LIKE '2026-02%'", "date_trunc('month', fecha) = '2026-02-01'"], explanation: 'The column as it is, compared with a range.' },
      a8post_like: { question: "Why doesn't `concepto LIKE '%agua%'` use a normal index?", options: ['Because LIKE never uses indexes', "Because it starts with %: there's no knowing where to start looking in the order", 'Because ANALYZE is missing', 'Because agua is a short word'], explanation: 'To search in the middle of the text: trigram indexes (pg_trgm).' },
      a8post_cost: { question: 'What happens when you add ten indexes to a table that is written to a lot?', options: ['Everything gets faster', 'Reads may improve, but each INSERT and UPDATE maintains ten more indexes', 'Nothing', 'The data is deleted'], explanation: 'Indexes are paid for when writing.' },
      a8post_redundant: { question: 'You have `(cuenta_id)` and `(cuenta_id, fecha)`. Which one is usually redundant?', options: ['The composite', 'The cuenta_id one: the composite already works for cuenta_id', 'Neither', 'Both'], explanation: 'A composite works for its prefix.' },
      a8post_seqok: { question: 'A query returns 90% of the table and the plan is a Seq Scan even though there is an index. Is that wrong?', options: ['Yes, you have to force the index', 'No: reading almost everything in sequence is faster than jumping through the index', 'Yes, ANALYZE is missing', 'Yes, the index is broken'], explanation: 'The planner picks the cheapest option.' },
      a8post_rows: { question: 'EXPLAIN ANALYZE says rows=10 estimated and 50,000 real. What do you do first?', options: ['Create an index', 'ANALYZE the table: the statistics are old', 'Drop the table', 'Nothing'], explanation: 'With bad statistics, the planner chooses badly.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: '60,000 rows',
      body: "Good morning.\n\n`movimientos` already has **60,000 rows** and the complaints are starting: \"it's slow\". Today it's about seeing **how** PostgreSQL runs each query (`EXPLAIN ANALYZE`) and giving it the indexes it needs. We're still on the test copy.\n\nTo start, the app's most basic query:\n\n- `SELECT * FROM movimientos WHERE cuenta_id = 5`. Look at its plan and create the index it needs so it stops reading the whole table.\n\nInés",
    },
    ines_ok: {
      body: 'From "Rows Removed by Filter: 58846" to a Bitmap Index Scan. Look at the EXPLAIN ANALYZE time before and after: that is the difference the app feels.',
    },
    marta_extracto: {
      body: `Hi! The app's account statement takes forever. It does this:\n\n\`${EXTRACTO}\`\n\nCan you create an index that solves **the account and the date at once**?`,
    },
    marta_thanks: { body: 'A single index for both conditions. The statement flies. Thanks!' },
    carmen_pendientes: {
      body: `Hi. My pending transactions dashboard runs \`${PENDIENTES}\` every minute. There are only **300 pending** among 60,000. An index that **only stores those**, so it takes little space?`,
    },
    carmen_thanks: { body: 'A 300-entry index and the dashboard no longer hangs. Thanks.' },
    ines_like: {
      subject: "11:00 · Inés: \"'%agua%'\"",
      body: "**Inés:** Nuria's agents also search with `WHERE concepto LIKE '%agua%'`. Rubén created an index on `concepto` and the search is still a Seq Scan. He says the index \"doesn't work\". What do you explain to him?",
      choices: {
        prefix: {
          text: "That a normal index is **sorted from the start of the text**: it works for `LIKE 'agua%'`, but with `%` at the start it doesn't know where to begin and has to look at every row. If they search for the whole description, equality with `LOWER(…)` and an expression index; if they really search in the middle of the text, a **trigram** index (`pg_trgm`, GIN).",
          reply: "Exactly. The index works; what it can't do is search from the middle. You have to change the query or the kind of index.",
          effects: { 2: { text: "LIKE '%…' doesn't use a normal index: equality, prefix or trigrams." } },
        },
        analyze: {
          text: 'That he is missing an `ANALYZE movimientos` so the planner sees the index.',
          reply: "Statistics don't change the fact that the index can't search in the middle of the text. It would still be a Seq Scan.",
          effects: { 0: { text: "You blamed the statistics for a LIKE that can't use the index." } },
        },
        force: {
          text: 'That PostgreSQL has to be forced to use the index.',
          reply: "PostgreSQL has no way to use that index for that LIKE. And if it did, it would be slower than reading the table.",
          effects: { 0: { text: "You wanted to force an index that is no use for that search." } },
        },
      },
    },
    nuria_conceptos: {
      body: `Hi. When a customer asks about a bill, we search like this, because the descriptions are written in a thousand ways:\n\n\`${CONCEPTO}\`\n\nIt takes forever. Diego says there are already indexes… can you create the one that works for this?`,
    },
    nuria_thanks: { body: 'Now the search comes back instantly. Thanks!' },
    diego_febrero: {
      body: "Hey. The monthly report does this and at the end of the month it eats the database:\n\n`SELECT COUNT(*) AS movimientos FROM movimientos WHERE EXTRACT(YEAR FROM fecha) = 2026 AND EXTRACT(MONTH FROM fecha) = 2`\n\nThere's an index on `fecha`, but the plan says Seq Scan. Can you rewrite it so it uses it? One column `movimientos`.",
    },
    diego_thanks: { body: '3,961 transactions, the same number, and now with a Bitmap Index Scan. Thanks!' },
    laura_duplicado: {
      body: "Hi. The transaction loads in my tests are slower than normal and I suspect `movimientos` has **two identical indexes**. Can you check and remove the extra one? There must still be an index on `fecha`, Diego's report uses it.",
    },
    laura_thanks: { body: 'movimientos_fecha_idx and idx_mov_fecha were the same. One fewer to maintain on every load. Thanks!' },
    ines_sobre: {
      subject: '15:00 · Inés: "indexes for everything"',
      body: '**Inés:** Diego, excited about today, suggests creating an index on **every column** of `movimientos` "just in case, so everything is fast". What do you tell him?',
      choices: {
        real: {
          text: "That each index **takes** space and is **updated on every INSERT and UPDATE**: with seven more indexes, the loads would be much slower, and most of them wouldn't be used by any query. Indexes for the real queries, checked with EXPLAIN, and remove the unused ones (`pg_stat_user_indexes`). By the way, this morning's `cuenta_id` index is already redundant: `(cuenta_id, fecha)` covers it.",
          reply: "That's it. An index is a query that goes faster in exchange for every write going a bit slower. You have to be able to justify it.",
          effects: { 3: { text: 'Indexes for real queries; each one is paid for when writing.' } },
        },
        yes: {
          text: 'Yes: more indexes, faster.',
          reply: 'Faster to read, sometimes. Slower to write, always. And a query uses one or two, not seven.',
          effects: { 0: { text: 'You accepted indexes without queries that need them.' } },
        },
        composite: {
          text: "It's better to have a single composite index with every column.",
          reply: 'A seven-column index only works for queries that filter by the first one. And it is almost as big as the table.',
          effects: { 0: { text: 'A giant composite index is no substitute for thinking about the queries.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Inés',
      body: '**Inés:** Today you made it fast. What are you taking away?',
      choices: {
        lesson: {
          text: 'That before creating an index you look at the plan with EXPLAIN ANALYZE; that a composite goes with equality first and works for its prefix; that a partial one stores only what matters; that if the query uses LOWER(col), the index has to be on LOWER(col); that a function on the column or a leading % prevent using the index; and that every index is paid for when writing.',
          reply: 'Very good. Tomorrow, last day of the week: real performance, with pagination and materialized views.',
        },
        more: {
          text: 'That if something is slow, you add an index and that is it.',
          reply: "Sometimes the problem is the query (an EXTRACT, a LIKE with %), and another index doesn't fix it. Check the debrief.",
          effects: { 0: { text: 'You came away with everything being fixed by an index.' } },
        },
      },
    },
  },
})
