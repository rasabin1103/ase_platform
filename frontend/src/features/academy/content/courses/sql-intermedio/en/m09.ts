import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m09Vistas } from '../m09-vistas'
import { ROLES_EN, missionEn } from './missionEn'

const CREATE_VIEW = { 0: { message: 'This task is done by creating a view: `CREATE VIEW name AS …`.' } }

/** Course 6: Intermediate SQL · Mission 9 — Your reusable report. English version of ../m09-vistas.ts. */
export const m09VistasEn = missionEn(
  m09Vistas,
  {
    title: 'Your reusable report',
    subtitle: 'Views, views on views and a first look at EXPLAIN.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Friday · month 2, week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Your queries, for the whole team',
        body: 'Marta has her dashboard, Carmen her daily check, Nuria queries on her own, Diego knows how the view runs and support has its list of payments to review. Ready for the exam.',
      },
      ok: { title: 'Views almost ready', body: 'You already create views, but a task or a trap fell by the wayside. Check the debrief before the exam.' },
      bad: { title: 'Queries that only live in your console', body: 'Several tasks were left undone. Replay the mission with the views cheat sheet before the exam.' },
    },
    briefing: {
      title: 'Month 2 · Week 2 · Your reusable report',
      paragraphs: [
        'Friday, the last day before the exam. Today your best queries become views the whole team can use.',
        'You are in the test environment: you can create and drop views. "Restore" leaves the database as it was at the start. The view tasks are checked by looking at the view you created.',
      ],
      goals: [
        'Create a view with CREATE VIEW and clear column names.',
        'Build a view on top of another.',
        'Use a view as if it were a table.',
        'Read a plan with EXPLAIN.',
        'Choose between a view, a copied table and a materialized view.',
        'Measure with EXPLAIN ANALYZE without changing data.',
      ],
    },
    docs: {
      chuleta_vistas: {
        title: 'Cheat sheet: views and EXPLAIN',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Views
\`\`\`
CREATE VIEW name AS
SELECT …;                      -- an alias on everything calculated
CREATE OR REPLACE VIEW name AS …;   -- change it (add columns at the end)
DROP VIEW name;                -- drop it (doesn't touch the tables)
\`\`\`
- It is used like a table: \`SELECT … FROM name\`.
- It is recalculated every time: always up to date.
- A view can use other views.
- Don't use \`SELECT *\` inside a view.

## See which views there are
\`SELECT table_name FROM information_schema.views WHERE table_schema = 'public';\`

## EXPLAIN
- \`EXPLAIN query\`: the plan, without running it.
- \`EXPLAIN ANALYZE query\`: **runs** it and measures. With DML: \`BEGIN; EXPLAIN ANALYZE …; ROLLBACK;\`
- Seq Scan = reads the whole table · Index Scan = uses an index.`,
      },
    },
    sqlLab: {
      starter: '-- Test environment: a query saved with a name\nCREATE VIEW saldos_cliente AS\nSELECT cliente_id, SUM(saldo) AS saldo_total\nFROM cuentas\nGROUP BY cliente_id;',
      retos: {
        vista_saldos: {
          title: 'The saldos_cliente view',
          description: 'Create the view **`saldos_cliente`** with `cliente_id` and `saldo_total` (sum of the balance of their accounts).',
          hint: '`CREATE VIEW saldos_cliente AS SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id;`',
          requires: CREATE_VIEW,
        },
        vista_kpi: {
          title: 'The kpi_clientes view, on top of saldos_cliente',
          description: 'Create **`kpi_clientes`** with `id`, `nombre`, `ciudad` and `saldo_total` of **all** the customers (0 if they have no accounts), **using the view `saldos_cliente`**.',
          hint: '`clientes LEFT JOIN saldos_cliente` and `COALESCE(s.saldo_total, 0) AS saldo_total`.',
          requires: CREATE_VIEW,
        },
        vista_control: {
          title: 'The control_pagos view',
          description: 'Create **`control_pagos`**: a single row with `duplicados` (leftover copies), `tarjeta_bloqueada` and `tarjeta_caducada` (**accepted** payments with a blocked card or after its expiry date).',
          hint: "One scalar subquery `(SELECT COUNT(*) FROM (…) x)` per column, like Thursday's dashboard.",
          requires: CREATE_VIEW,
        },
        usar_vista: {
          title: 'Madrid and more than €10,000, with the view',
          description: '**Using the view `kpi_clientes`**: `id`, `nombre` and `saldo_total` of the customers from **Madrid** with a total balance **greater than €10,000**.',
          hint: "`SELECT id, nombre, saldo_total FROM kpi_clientes WHERE ciudad = 'Madrid' AND saldo_total > 10000`.",
          requires: { 0: { message: 'This task is done with the view: `FROM kpi_clientes`.' } },
        },
        explain_vista: {
          title: 'The plan of a query on the view',
          description: 'Run an **`EXPLAIN`** (without ANALYZE) of a query on **`kpi_clientes`**, for example the one for a specific customer.',
          hint: '`EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7;` and look at which tables appear.',
          requires: {
            0: { message: 'Start the query with `EXPLAIN` (without ANALYZE).' },
            1: { message: 'The query in the EXPLAIN has to use the view `kpi_clientes`.' },
          },
        },
        vista_revisar: {
          title: 'The pagos_a_revisar view',
          description: "Create **`pagos_a_revisar`** with `id` and `motivo` (reason): one row per payment and reason, with the reasons **'duplicado'** (leftover copies), **'tarjeta_bloqueada'** and **'tarjeta_caducada'** (accepted payments).",
          hint: 'Three queries (one per rule) with a fixed column for the reason, combined with `UNION ALL`.',
          requires: CREATE_VIEW,
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'The product dashboard repeats the balance calculation', explanation: 'Without kpi_clientes on top of saldos_cliente, each report calculates the balance its own way.', technique: 'Views on views.' },
      'C-CARMEN': { title: 'The daily check is still asked for over chat', explanation: "Carmen doesn't have her check view.", technique: 'A one-row view with a count per rule.' },
      'C-NURIA': { title: 'Customer support depends on you for every list', explanation: "Nuria didn't learn to use the view.", technique: 'SELECT on the view.' },
      'C-DIEGO': { title: 'The app uses the view without knowing how it runs', explanation: 'Nobody looked at the plan before putting it in production.', technique: 'EXPLAIN.' },
      'C-LAURA': { title: 'Support has no list of payments to review', explanation: 'Laura was left without the work view.', technique: 'UNION ALL with a reason column.' },
      'C-FOTO': { title: "Product presents last week's balances", explanation: 'The dashboard was saved as a copied table and nobody updated it.', technique: 'A view instead of CREATE TABLE AS.' },
      'C-ANALYZE': { title: 'An EXPLAIN ANALYZE deletes payments in a shared environment', explanation: 'EXPLAIN ANALYZE ran the DELETE that was only meant to be measured.', technique: 'BEGIN; EXPLAIN ANALYZE …; ROLLBACK;' },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with Friday's views.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Marta's dashboard", explanation: 'kpi_clientes on top of saldos_cliente.' },
        1: { label: "Carmen's check", explanation: 'A one-row view.' },
        2: { label: 'Nuria, on her own', explanation: 'Queries on the view.' },
        3: { label: 'Plan reviewed', explanation: 'EXPLAIN before production.' },
        4: { label: 'Support list', explanation: 'Payments with their reason.' },
        5: { label: 'Up-to-date data', explanation: 'A view, not a copy.' },
        6: { label: 'Measuring without breaking', explanation: 'ANALYZE inside a transaction.' },
      },
    },
    concepts: {
      create_view: { title: 'CREATE VIEW', summary: 'A query saved with a name that is used like a table and is always recalculated.' },
      view_on_view: { title: 'Views on views', summary: 'Each view solves one step; the dependencies prevent dropping without CASCADE.' },
      view_vs_table: { title: 'View, copied table or materialized view', summary: 'View: always up to date. Copied table: a snapshot that goes stale. Materialized: a snapshot with REFRESH.' },
      explain_basics: { title: 'EXPLAIN', summary: 'The execution plan without running it: Seq Scan, Index Scan, joins and estimates.' },
      explain_analyze: { title: 'EXPLAIN ANALYZE', summary: 'Actually runs it to measure: with DML, inside BEGIN … ROLLBACK.' },
    },
    seniorTips: [
      'Read the views cheat sheet in the wiki.',
      'Inés: CREATE VIEW saldos_cliente AS SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id;',
      'Marta: CREATE VIEW kpi_clientes AS SELECT c.id, c.nombre, c.ciudad, COALESCE(s.saldo_total, 0) AS saldo_total FROM clientes c LEFT JOIN saldos_cliente s ON s.cliente_id = c.id;',
      'Carmen: CREATE VIEW control_pagos AS SELECT (SELECT COUNT(*) …) AS duplicados, (…) AS tarjeta_bloqueada, (…) AS tarjeta_caducada;',
      "Nuria: SELECT id, nombre, saldo_total FROM kpi_clientes WHERE ciudad = 'Madrid' AND saldo_total > 10000;",
      'Diego: EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7;',
      "Laura: CREATE VIEW pagos_a_revisar AS SELECT id, 'duplicado' AS motivo FROM (…) UNION ALL … 'tarjeta_bloqueada' … UNION ALL … 'tarjeta_caducada' …;",
      'With Inés: a view, not a copied table; and EXPLAIN ANALYZE runs the query.',
    ],
    lessons: {
      create: {
        question: 'What is a view?',
        body: `A **query saved with a name** in the database. It is used like a table, but it doesn't store data: every time you query it, it runs its query with the data of the moment.

\`\`\`
CREATE VIEW saldos_cliente AS
SELECT cliente_id, SUM(saldo) AS saldo_total
FROM cuentas
GROUP BY cliente_id;

SELECT * FROM saldos_cliente WHERE saldo_total > 20000;
\`\`\`

The column names come from the query: give an alias to everything calculated.`,
      },
      on_view: {
        question: 'Can I make a view on top of another?',
        body: `Yes, and it's the usual thing: each view solves one step, like the \`WITH\` steps, but for the whole team.

\`\`\`
CREATE VIEW kpi_clientes AS
SELECT c.id, c.nombre, c.ciudad, COALESCE(s.saldo_total, 0) AS saldo_total
FROM clientes c
LEFT JOIN saldos_cliente s ON s.cliente_id = c.id;
\`\`\`

If the way of calculating the balance changes, only \`saldos_cliente\` is changed. That's why PostgreSQL won't let you drop a view other views depend on (except with \`CASCADE\`, which takes them all with it: careful).`,
      },
      change: {
        question: 'How do I change or drop a view?',
        body: `- \`CREATE OR REPLACE VIEW name AS …\`: changes the query. It can add columns at the end, but not rename or remove the existing ones.
- \`DROP VIEW name;\`: drops it (the data in the tables is not touched).
- If you need to change columns: \`DROP VIEW\` and \`CREATE VIEW\` again.

Avoid \`SELECT *\` inside a view: the columns are fixed when it is created, and if the table changes, the view doesn't notice.`,
      },
      vs_table: {
        question: 'View or copied table?',
        body: `| | View | \`CREATE TABLE … AS SELECT\` | Materialized view |
|---|---|---|---|
| Data | Always up to date | Snapshot of the moment | Snapshot refreshed on purpose |
| Speed | As long as the query takes | Fast | Fast |
| Risk | None | Goes stale without warning | You have to remember to \`REFRESH\` |

Rule: a view by default. Materialized only when a view is really slow (measured) and data a few hours old is acceptable.`,
      },
      explain: {
        question: 'What does EXPLAIN tell me?',
        body: `\`EXPLAIN query\` shows the **plan**: how PostgreSQL intends to run it, without running it.

\`\`\`
EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7;
\`\`\`

What to look at first:
- **Seq Scan on table**: reads the whole table (normal for small tables).
- **Index Scan**: uses an index to go straight there.
- **Hash Join / Nested Loop**: how it joins the tables.
- \`cost\` and \`rows\`: estimates, not real times.

With a view, the plan shows the tables underneath: the view stores nothing.`,
      },
      analyze: {
        question: 'And EXPLAIN ANALYZE?',
        body: `\`EXPLAIN ANALYZE\` **runs the query** and shows the plan with the real times and rows.

With a \`SELECT\` nothing happens. With an \`INSERT\`, \`UPDATE\` or \`DELETE\`, **it makes the changes**. If you only want to measure:

\`\`\`
BEGIN;
EXPLAIN ANALYZE DELETE FROM pagos_tarjeta WHERE id IN (304, 305, 306);
ROLLBACK;
\`\`\``,
      },
    },
    quiz: {
      pre: {
        i9pre_create: {
          question: 'What does a view store?',
          options: ['A copy of the data', 'The query, which runs every time it is used', 'An index', 'Nothing: it disappears when the console closes'],
          explanation: "That's why it's always up to date.",
        },
        i9pre_on_view: {
          question: 'Can a view use another view?',
          options: ['No', 'Yes, as if it were a table', 'Only if they belong to the same user', 'Only with UNION'],
          explanation: 'That is how calculations are reused.',
        },
        i9pre_vs_table: {
          question: '`CREATE TABLE informe AS SELECT …` and tomorrow the data changes. What does `informe` have?',
          options: ['The new data', 'The data from when it was created', 'Nothing', 'An error'],
          explanation: "It's a snapshot: it doesn't update itself.",
        },
        i9pre_explain: {
          question: 'What does `EXPLAIN SELECT …` do?',
          options: ['It runs the query twice', 'It shows the execution plan without running it', 'It explains the error', 'It creates an index'],
          explanation: 'An estimated plan, without touching data.',
        },
        i9pre_analyze: {
          question: 'What does `EXPLAIN ANALYZE DELETE …` do?',
          options: ['It only shows the plan', 'It runs the DELETE and shows the plan with real times', 'It gives an error', 'It simulates the deletion'],
          explanation: 'ANALYZE runs it. Inside BEGIN … ROLLBACK if you only want to measure.',
        },
        i9pre_seq: {
          question: 'In a plan, "Seq Scan on pagos_tarjeta" means…',
          options: ['That it uses an index', 'That it reads the whole table', 'That the query fails', 'That it sorts it'],
          explanation: 'Normal for small tables.',
        },
      },
      post: {
        i9post_create: {
          question: "Why is it worth giving aliases to a view's calculated columns?",
          options: ['For looks', "Because they are the names of the view's columns", 'It is mandatory in PostgreSQL', 'To make it faster'],
          explanation: 'SUM(saldo) without an alias would be called "sum".',
        },
        i9post_on_view: {
          question: '`DROP VIEW saldos_cliente` gives an error because `kpi_clientes` depends on it. What do you do?',
          options: ['DROP … CASCADE without thinking', 'Check what depends on it before deciding', 'Drop the cuentas table', 'Nothing, it is a bug'],
          explanation: 'CASCADE would also drop kpi_clientes.',
        },
        i9post_vs_table: {
          question: 'A view is really slow and data from a few hours ago is enough. What do you use?',
          options: ['A table copied by hand', 'A materialized view with REFRESH', 'Nothing', 'A CROSS JOIN'],
          explanation: "It's an explicit snapshot that is refreshed on purpose.",
        },
        i9post_explain: {
          question: 'You run `EXPLAIN` on a query on `kpi_clientes`. Which tables appear in the plan?',
          options: ['Only kpi_clientes', 'The tables underneath: clientes and cuentas', 'None', 'Every table in the database'],
          explanation: 'The view is replaced by its query.',
        },
        i9post_analyze: {
          question: 'You want to measure an UPDATE without changing anything:',
          options: ['EXPLAIN ANALYZE UPDATE …', 'BEGIN; EXPLAIN ANALYZE UPDATE …; ROLLBACK;', 'EXPLAIN UPDATE … and then COMMIT', "You can't"],
          explanation: 'The ROLLBACK undoes what ANALYZE ran.',
        },
        i9post_replace: {
          question: '`CREATE OR REPLACE VIEW` changing the name of an existing column:',
          options: ['It works', 'It gives an error: you have to DROP VIEW and CREATE VIEW', 'It deletes the data', 'It creates another view'],
          explanation: 'It can only add columns at the end.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Make your queries useful for the whole team',
        body: "Good morning, last day before the exam.\n\nFor two weeks you've been writing good queries that live in your console. Today you will turn them into **views**: a query saved with a name in the database, that anyone can use as if it were a table and that **is recalculated every time** with the data of the moment. You are in the **test environment**: here you can create things (and \"Restore\" puts everything back as it was at the start).\n\nTo start:\n\n- Create the view **`saldos_cliente`** with two columns: `cliente_id` and `saldo_total` (the sum of the balance of their accounts).\n\nInés",
      },
      ines_ok: {
        body: "`saldos_cliente` exists now. Try `SELECT * FROM saldos_cliente`: it's your query from the first WITH day, but now anyone on the team has it at hand, and there's no need to copy it.",
      },
      marta_kpi: {
        body: 'Hi! I want a view **`kpi_clientes`** for the product dashboard: `id`, `nombre`, `ciudad` and `saldo_total` of **all** the customers (0 if they have no accounts). Inés says you should build it **on top of `saldos_cliente`**, so the calculation is not repeated.',
      },
      marta_thanks: { body: 'Forty customers, with number 38 at zero. And if the way the balance is calculated changes tomorrow, only `saldos_cliente` is touched. Thanks!' },
      carmen_control: {
        body: "Hi. I want the **daily check** of payments as a view I can query every morning: **`control_pagos`**, a single row with `duplicados` (leftover copies), `tarjeta_bloqueada` and `tarjeta_caducada` (accepted payments in each case). Thursday's thing, but always at hand.",
      },
      carmen_thanks: { body: "3, 3 and 24. Tomorrow I'll query it again and, if someone has cleaned something up, I'll see it without asking you. Thanks." },
      ines_vista_tabla: {
        subject: '11:00 · Inés: "View or table?"',
        body: "**Inés:** Diego suggests saving Marta's dashboard as a table:\n\n`CREATE TABLE kpi_clientes_tabla AS SELECT … ;`\n\nHe says it's faster to query that way. What do you think?",
        choices: {
          view: {
            text: "A table created like that is a **snapshot**: it stores today's data and goes stale as soon as an account changes, without anyone noticing. A **view** stores the query and is recalculated every time. For something small like this, a view. If one day it were really slow, there is the **materialized view**, which is refreshed on purpose (`REFRESH MATERIALIZED VIEW`) and makes it clear that it's a snapshot.",
            reply: 'Exactly. First make it correct and up to date; speed, when it is measured and needed.',
            effects: { 2: { text: 'View = saved query, up to date; copied table = a snapshot that goes stale.' } },
          },
          table: {
            text: "That he's right: a table is always faster, so a table.",
            reply: "Faster and with yesterday's data. Marta would present balances that no longer exist.",
            effects: { 0: { text: 'You preferred a fast, outdated copy.' } },
          },
          both: {
            text: 'That he should make both and everyone can use whichever they want.',
            reply: 'And in a month there will be two different figures for the same thing. One source of truth.',
            effects: { 0: { text: 'Two copies of the same data end up giving two figures.' } },
          },
        },
      },
      nuria_madrid: {
        body: 'Hi. Now that `kpi_clientes` exists, can you get me, **using it**, the customers from **Madrid** with more than **€10,000** of total balance? `id`, `nombre` and `saldo_total`.',
      },
      nuria_thanks: { body: "One line of SQL and done. I'm noting it down to use it myself. Thanks!" },
      diego_explain: {
        body: 'Hey. Before using `kpi_clientes` in the app I want to see **how PostgreSQL runs it**. Run an **`EXPLAIN`** on a query on `kpi_clientes` (for example, a specific customer) and tell me which tables it reads.',
      },
      diego_thanks: { body: "So the view doesn't store anything: the plan goes straight to `clientes` and `cuentas`. With such small tables, reading them whole (Seq Scan) is normal. Thanks!" },
      laura_revisar: {
        body: "Hi. For the support team I want a view **`pagos_a_revisar`** with **one payment per row and the reason**: `id` and `motivo`, with the reasons **'duplicado'** (leftover copies), **'tarjeta_bloqueada'** and **'tarjeta_caducada'** (accepted). If a payment meets two reasons, it should come out twice.",
      },
      laura_thanks: { body: 'Thirty rows, each with its reason. Support now has its work list and it will empty itself as things get fixed. Thanks!' },
      ines_explain_analyze: {
        subject: '15:00 · Inés: "I only wanted to see the plan"',
        body: '**Inés:** Marta wanted to know how long deleting the duplicate copies would take in the test environment, and she ran:\n\n`EXPLAIN ANALYZE DELETE FROM pagos_tarjeta WHERE id IN (304, 305, 306);`\n\nShe got the plan with the times… and now the three payments are gone. What happened?',
        choices: {
          safe: {
            text: '`EXPLAIN` only shows the plan without running anything, but `EXPLAIN ANALYZE` **actually runs the query** to measure it: the DELETE has been done. With an INSERT, UPDATE or DELETE you have to wrap it in a transaction: `BEGIN; EXPLAIN ANALYZE DELETE …; ROLLBACK;`. Here, "Restore" fixes it; in production, it doesn\'t.',
            reply: "That's it. EXPLAIN looks; EXPLAIN ANALYZE does. And everything that modifies data, inside BEGIN… ROLLBACK when you only want to measure.",
            effects: { 3: { text: 'EXPLAIN ANALYZE runs the query: with DELETE/UPDATE, inside BEGIN … ROLLBACK.' } },
          },
          bug: {
            text: "That it's a console bug: an EXPLAIN never modifies anything.",
            reply: 'Plain EXPLAIN, no. With ANALYZE, yes: it has to run it to measure the real times.',
            effects: { 0: { text: "You assumed EXPLAIN ANALYZE doesn't run the query." } },
          },
          never: {
            text: 'That she should never use EXPLAIN, it is dangerous.',
            reply: 'EXPLAIN is a basic, safe tool. What you need to know is what ANALYZE does.',
            effects: { 0: { text: 'You gave up a tool instead of learning to use it.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the course with Inés',
        body: '**Inés:** Two weeks: subqueries, WITH, dates, sets, reports, windows, joins, data quality and today views. What are you taking away from today?',
        choices: {
          lesson: {
            text: 'That a view stores the query and is always recalculated, unlike a copied table; that views can be built on views so calculations are not repeated; that `EXPLAIN` shows the plan without running and `EXPLAIN ANALYZE` does run; and that in testing I can create and drop, but carefully.',
            reply: "Very good. You're ready for the practical exam. Good luck: you won't need it.",
          },
          copy: {
            text: 'That the easiest thing is to send queries over chat and let everyone copy them.',
            reply: 'Until everyone has a different version. Check the debrief.',
            effects: { 0: { text: 'You came away with copying queries instead of sharing views.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
