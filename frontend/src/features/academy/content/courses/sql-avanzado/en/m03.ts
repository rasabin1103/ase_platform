import { m03Subtotales } from '../m03-subtotales'
import { COMMON_EN, missionEn } from './missionEn'

const req = (message: string) => ({ 0: { message } })

/** Course 7: Advanced SQL · Mission 3 — Totals and subtotals. English version of ../m03-subtotales.ts. */
export const m03SubtotalesEn = missionEn(m03Subtotales, {
  ...COMMON_EN,
  title: 'Totals and subtotals',
  subtitle: 'ROLLUP, CUBE, GROUPING SETS, GROUPING() and LATERAL.',
  dayLabel: 'Thursday · month 3',
  verdicts: {
    good: {
      title: 'Every total at its level',
      body: "Inés has her report with subtotals, Marta her cube, Carmen her two views of the year, Nuria her labels in the right place, Diego each customer's two biggest transfers and Laura everyone's last event, including the one who has none.",
    },
    ok: { title: 'Subtotals with an extra NULL or two', body: 'You already do totals and subtotals in one query, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'One report per level of total', body: 'Several tasks were left undone. Replay the mission with the subtotals cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 3 · Totals and subtotals',
    paragraphs: [
      'Report Thursday: totals per category, per city, per both and the grand total, all in the same table. And a "the two biggest of each customer" or two.',
      'Each task is done when the query returns exactly the rows and columns asked for, subtotals included.',
    ],
    goals: [
      'Get hierarchical subtotals and the grand total with ROLLUP.',
      'Get every combination of totals with CUBE.',
      'Choose exactly which totals you want with GROUPING SETS.',
      'Tell a subtotal row from a NULL in the data with GROUPING().',
      'Get the top N of each row with LATERAL.',
      'Keep the rows without data with LEFT JOIN LATERAL.',
    ],
  },
  docs: {
    chuleta_subtotales: {
      title: 'Cheat sheet: subtotals and LATERAL',
      updatedLabel: 'Inés Moreno · Data',
      body: `## Several levels of total
| GROUP BY | Groups that come out |
|---|---|
| \`ROLLUP (a, b)\` | (a, b), (a), () |
| \`CUBE (a, b)\` | (a, b), (a), (b), () |
| \`GROUPING SETS ((a), (b), ())\` | Exactly the ones you say |

In the subtotal rows, the "summed up" columns come out as **NULL**.

## Subtotal or a real NULL?
\`GROUPING(a)\` = 1 if the row is a subtotal that has added up every value of \`a\`; 0 if \`a\` is a value from the data (even if it is NULL).
\`\`\`
CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total'
     ELSE COALESCE(c.categoria, 'sin categoría') END
\`\`\`

## LATERAL
A subquery in the FROM that can use columns of the tables to its left:
\`\`\`
FROM clientes c
CROSS JOIN LATERAL (SELECT … WHERE x.cliente_id = c.id ORDER BY … LIMIT 2) t
\`\`\`
\`LEFT JOIN LATERAL (…) t ON true\` keeps the customers for whom the subquery returns nothing.

## Careful
A result with ROLLUP already brings the subtotals: if you add it all up, you count twice.`,
    },
  },
  sqlLab: {
    starter:
      "-- Accepted total per category, with the grand total\nSELECT c.categoria, SUM(p.importe) AS total\nFROM pagos_tarjeta p\nJOIN comercios c ON c.id = p.comercio_id\nWHERE p.estado = 'aceptado'\nGROUP BY ROLLUP (c.categoria);",
    retos: {
      rollup_categoria: {
        title: 'Category, city, subtotals and total',
        description: 'Amount of the **accepted** payments per merchant `categoria` and `ciudad`, with the **subtotal of each category** and the **grand total**: `categoria`, `ciudad` and `total`.',
        hint: '`GROUP BY ROLLUP (c.categoria, c.ciudad)` with `SUM(p.importe) AS total`.',
        requires: req('This task is solved with `GROUP BY ROLLUP (…)`.'),
      },
      cubo_estado_tipo: {
        title: 'Payment status by card type, in every combination',
        description: 'Number of payments (all) per payment `estado` and card `tipo`, with **every combination of totals**: per status, per type and the grand one. Columns `estado`, `tipo` and `pagos`.',
        hint: '`pagos_tarjeta JOIN tarjetas` and `GROUP BY CUBE (p.estado, t.tipo)`.',
        requires: req('This task is solved with `GROUP BY CUBE (…)`.'),
      },
      sets_2026: {
        title: 'The year 2026 per category and per month, in one table',
        description: '**Accepted** payments since **1 January 2026**: the total per `categoria`, the total per `mes` (first day, as a date) and the grand total, **without** the category × month cross. Columns `categoria`, `mes` and `total`.',
        hint: "`GROUP BY GROUPING SETS ((c.categoria), (DATE_TRUNC('month', p.pagado_en)::date), ())`.",
        requires: req('This task is solved with `GROUP BY GROUPING SETS (…)`.'),
      },
      etiquetas: {
        title: "Payments per category with labels that don't mislead",
        description: "Number of payments (all) per category with the grand total. In the `categoria` column: **`Total`** on the total row and **`sin categoría`** (no category) for the merchants that have none. Columns `categoria` and `pagos`.",
        hint: "`GROUP BY ROLLUP (c.categoria)` and `CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total' ELSE COALESCE(c.categoria, 'sin categoría') END`.",
        requires: req('Use `GROUPING(…)` to know which row is the total.'),
      },
      top2_transferencias: {
        title: "Each customer's two biggest transfers",
        description: "For each customer, their **two sent transfers with the highest amount** (if they tie, the one with the lowest id): `cliente_id`, `transferencia_id` and `importe`. Customers without transfers don't come out.",
        hint: '`FROM clientes c CROSS JOIN LATERAL (SELECT tr.id, tr.importe FROM transferencias tr JOIN cuentas a ON a.id = tr.cuenta_origen_id WHERE a.cliente_id = c.id ORDER BY tr.importe DESC, tr.id LIMIT 2) t`.',
        requires: req('This task is solved with `LATERAL`.'),
      },
      ultimo_evento: {
        title: "Each customer's last event",
        description: '**All** the customers, also the ones without events: `id`, `nombre`, `ultimo_evento` (date and time of their last event in the app) and `tipo` of that event. If two events coincide, the one with the highest id.',
        hint: '`FROM clientes c LEFT JOIN LATERAL (SELECT e.ocurrido_en, e.tipo FROM eventos_app e WHERE e.cliente_id = c.id ORDER BY e.ocurrido_en DESC, e.id DESC LIMIT 1) u ON true`.',
        requires: req('This task is solved with `LATERAL`.'),
      },
    },
  },
  bugs: {
    'C-MARTA': { title: "The product committee gets four reports for a single table", explanation: 'Without CUBE, Marta put together by hand the totals per status, per type and the grand one.', technique: 'GROUP BY CUBE.' },
    'C-CARMEN': { title: 'The annual risk report crosses everything with everything', explanation: 'Carmen only wanted two cuts and the total, and she got the full cross.', technique: 'GROUPING SETS with the exact groups.' },
    'C-NURIA': { title: 'The dashboard shows two "Total" rows', explanation: 'COALESCE also turned the empty category in the data into "Total".', technique: 'GROUPING() for the total, COALESCE for the data.' },
    'C-DIEGO': { title: 'The big transfers review stops at one per customer', explanation: 'Diego used MAX, which only gives the highest amount.', technique: 'LATERAL with ORDER BY and LIMIT.' },
    'C-LAURA': { title: 'The activity report loses the customer who never logged in', explanation: 'With CROSS JOIN LATERAL, customer 38 disappears.', technique: 'LEFT JOIN LATERAL … ON true.' },
    'C-COALESCE': { title: "A subtotal gets mixed up with the online shop's payments", explanation: 'The online shop has no city: its row and the shopping subtotal looked the same.', technique: 'GROUPING() to tell them apart.' },
    'C-DOBLE': { title: "A presentation's total comes out double", explanation: 'A result with ROLLUP that already had the total was added up.', technique: 'Add only the detail rows or use the total row.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Thursday's reports.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's committee", explanation: 'Every combination with CUBE.' },
      1: { label: "Carmen's report", explanation: 'Only the cuts asked for.' },
      2: { label: "Nuria's dashboard", explanation: 'Total and no category, correctly labelled.' },
      3: { label: "Diego's review", explanation: 'Two per customer with LATERAL.' },
      4: { label: "Laura's activity", explanation: 'Every customer, with LEFT JOIN LATERAL.' },
      5: { label: 'Recognisable subtotals', explanation: 'GROUPING() instead of COALESCE.' },
      6: { label: 'Totals that add up', explanation: "Don't add subtotals twice." },
    },
  },
  concepts: {
    rollup: { title: 'ROLLUP', summary: 'Hierarchical subtotals from left to right and the grand total.' },
    cube: { title: 'CUBE', summary: 'The totals of every combination of columns.' },
    grouping_sets: { title: 'GROUPING SETS', summary: 'Exactly the groups you say, in one query.' },
    grouping_fn: { title: 'GROUPING()', summary: '1 on the subtotal rows of that column, 0 on the data rows: tells a subtotal from a real NULL.' },
    lateral: { title: 'LATERAL', summary: 'A FROM subquery that uses columns of the outer row: the N of each one.' },
    left_lateral: { title: 'LEFT JOIN LATERAL', summary: 'Keeps the rows for which the subquery returns nothing.' },
    double_count: { title: 'Subtotals and sums', summary: "A result with subtotals isn't added up again in full." },
  },
  seniorTips: [
    'Read the subtotals cheat sheet in the wiki.',
    'Inés: SUM(p.importe) of the accepted ones with GROUP BY ROLLUP (c.categoria, c.ciudad).',
    'Marta: payments JOIN tarjetas and GROUP BY CUBE (p.estado, t.tipo).',
    "Carmen: GROUP BY GROUPING SETS ((c.categoria), (DATE_TRUNC('month', p.pagado_en)::date), ()) from 2026.",
    "Nuria: CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total' ELSE COALESCE(c.categoria, 'sin categoría') END with ROLLUP.",
    'Diego: CROSS JOIN LATERAL with ORDER BY tr.importe DESC, tr.id LIMIT 2.',
    'Laura: LEFT JOIN LATERAL (… ORDER BY ocurrido_en DESC, id DESC LIMIT 1) u ON true.',
    "With Inés: GROUPING() for the subtotals; and don't add up a whole ROLLUP.",
  ],
  lessons: {
    rollup: {
      question: 'How do I get subtotals and the total in the same query?',
      body: `With \`ROLLUP\` in the \`GROUP BY\`:

\`\`\`
SELECT c.categoria, c.ciudad, SUM(p.importe) AS total
FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id
GROUP BY ROLLUP (c.categoria, c.ciudad);
\`\`\`

You get the groups (category, city), then (category) —the subtotal of each category, with the city as NULL— and () —the grand total, with both as NULL—. The order matters: \`ROLLUP (ciudad, categoria)\` would give subtotals per city.`,
    },
    cube: {
      question: 'And if I want the totals for each column separately?',
      body: `\`CUBE (a, b)\` gets every combination: (a, b), (a), (b) and ().

\`\`\`
SELECT p.estado, t.tipo, COUNT(*)
FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id
GROUP BY CUBE (p.estado, t.tipo);
\`\`\`

With three columns it's 8 groups; with four, 16. Use it when you really want every cut.`,
    },
    sets: {
      question: 'Can I choose exactly which totals come out?',
      body: `Yes, with \`GROUPING SETS\`:

\`\`\`
GROUP BY GROUPING SETS ((c.categoria), (DATE_TRUNC('month', p.pagado_en)::date), ())
\`\`\`

Total per category, total per month and grand total, without the cross of both. ROLLUP and CUBE are shortcuts of GROUPING SETS: \`ROLLUP (a, b)\` = \`GROUPING SETS ((a, b), (a), ())\`.`,
    },
    grouping: {
      question: 'How do I know whether a NULL is a subtotal or empty data?',
      body: `With \`GROUPING(column)\`: 1 if on that row the column has been "summed up" (subtotal or total), 0 if it is a value from the data.

\`\`\`
SELECT CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total'
            ELSE COALESCE(c.categoria, 'sin categoría') END AS categoria,
       COUNT(*)
FROM … GROUP BY ROLLUP (c.categoria);
\`\`\`

With \`COALESCE(c.categoria, 'Total')\`, the florist, which has no category, would also be called "Total".`,
    },
    lateral: {
      question: 'What is LATERAL?',
      body: `A subquery in the \`FROM\` that can use columns of the tables to its left. It runs "for each row" outside:

\`\`\`
SELECT c.id, t.id, t.importe
FROM clientes c
CROSS JOIN LATERAL (
  SELECT tr.id, tr.importe
  FROM transferencias tr JOIN cuentas a ON a.id = tr.cuenta_origen_id
  WHERE a.cliente_id = c.id
  ORDER BY tr.importe DESC, tr.id
  LIMIT 2
) t;
\`\`\`

It's the natural way to get "the top N of each one" with ORDER BY and LIMIT.`,
    },
    left_lateral: {
      question: "And the ones that don't have any?",
      body: `\`CROSS JOIN LATERAL\` works like a JOIN: if the subquery returns no rows, the outer row disappears. To keep it, \`LEFT JOIN LATERAL\` with a condition that is always true:

\`\`\`
FROM clientes c
LEFT JOIN LATERAL (SELECT … LIMIT 1) u ON true
\`\`\`

The customer without events comes out with NULL in the columns of \`u\`.`,
    },
    double: {
      question: 'Can I add up the result of a ROLLUP?',
      body: `Not in full: it already brings the subtotals and the total, and you would add them again. With a \`ROLLUP (categoria)\`, adding up every row gives **double** the total.

Either add only the detail rows (\`WHERE GROUPING(…) = 0\`, or the query without ROLLUP), or use the total row directly. It's a typical mistake when moving a report into a spreadsheet.`,
    },
  },
  quiz: {
    pre: {
      a3pre_rollup: { question: 'Which groups does `GROUP BY ROLLUP (a, b)` produce?', options: ['(a, b)', '(a, b), (a), ()', '(a, b), (a), (b), ()', '(a), (b)'], explanation: 'Subtotals from left to right and the total.' },
      a3pre_cube: { question: 'And `GROUP BY CUBE (a, b)`?', options: ['(a, b), (a), ()', '(a, b), (a), (b), ()', '(a, b)', '()'], explanation: 'Every combination.' },
      a3pre_sets: { question: 'How do you ask only for the total per a, the total per b and the grand one?', options: ['ROLLUP (a, b)', 'GROUPING SETS ((a), (b), ())', 'CUBE (a, b)', 'GROUP BY a, b'], explanation: 'GROUPING SETS chooses the exact groups.' },
      a3pre_null: { question: 'On the total row of a ROLLUP, the grouped columns come out as…', options: ['0', 'NULL', "'Total'", "empty ('')"], explanation: "And that's why they get mixed up with NULLs in the data." },
      a3pre_lateral: { question: 'What does LATERAL allow in a FROM subquery?', options: ['Using columns of the tables to its left', 'Sorting', 'Grouping', 'Nothing special'], explanation: 'That\'s why it works for "the N of each one".' },
      a3pre_double: { question: 'You add up every row of a `GROUP BY ROLLUP (categoria)`. You get…', options: ['The total', 'Double the total', 'The average', 'Error'], explanation: 'The total row is added along with the detail rows.' },
    },
    post: {
      a3post_rollup: { question: 'With `ROLLUP (categoria, ciudad)`, which row is the "compras" subtotal?', options: ["categoria = 'compras' and ciudad NULL (with GROUPING(ciudad) = 1)", "ciudad = 'compras'", 'The last row', 'There are no subtotals per category'], explanation: 'And the online shop, without a city, also has a NULL city: hence GROUPING().' },
      a3post_cube: { question: 'How many groups does `CUBE` generate with three columns?', options: ['3', '4', '8', '9'], explanation: '2³ combinations.' },
      a3post_grouping: { question: 'What does `GROUPING(c.categoria)` return on the florist\'s row (NULL category in the data)?', options: ['1', '0', 'NULL', 'Error'], explanation: 'It is a value from the data, not a subtotal.' },
      a3post_coalesce: { question: "Why is `COALESCE(categoria, 'Total')` a bad idea with ROLLUP?", options: ["It's slow", 'It also calls the NULLs in the data "Total"', "It doesn't work with ROLLUP", 'It changes the order'], explanation: 'Two "Total" rows come out.' },
      a3post_left: { question: 'Customer 38 has no events. Does it come out with `CROSS JOIN LATERAL (… LIMIT 1)`?', options: ['Yes, with NULL', 'No: you need LEFT JOIN LATERAL … ON true', 'Yes, with 0', 'It gives an error'], explanation: 'CROSS JOIN loses the rows without a match.' },
      a3post_lateral: { question: "For each customer's two biggest transfers, inside the LATERAL goes…", options: ['GROUP BY cliente_id', 'WHERE a.cliente_id = c.id ORDER BY importe DESC LIMIT 2', 'MAX(importe)', 'DISTINCT'], explanation: 'Filter by the outer customer, sort and cut.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: 'Subtotals without copy and paste',
      body: 'Good morning.\n\nToday everyone wants tables with subtotals: per category, per city, per both and the total. Until now that meant several queries pasted into a spreadsheet. PostgreSQL does it in one with `ROLLUP`, `CUBE` and `GROUPING SETS`.\n\nTo start, with the **accepted** payments:\n\n- The amount per merchant `categoria` and `ciudad`, with the **subtotal of each category** and the **grand total**: columns `categoria`, `ciudad` and `total`.\n\nInés',
    },
    ines_ok: {
      body: 'Thirty-two rows and the grand total at the bottom: €33,021.22. Look at "compras" (shopping): there are two rows with an empty city. One is the online shop, which has no city; the other, the subtotal. We\'ll talk about that.',
    },
    marta_cubo: {
      body: 'Hi! For the committee I want a table with the number of payments (all) per `estado` and per card `tipo`, and **every total**: per status, per type and the grand one. Columns `estado`, `tipo` and `pagos`.',
    },
    marta_thanks: { body: 'Ten rows: all the credit payments accepted and 306 payments in total. One table instead of four. Thanks!' },
    carmen_sets: {
      body: "Hi. For the 2026 risk report I want, of the **accepted** payments since 1 January: the total per `categoria`, the total per `mes` (first day, as a date) and the grand total. **Without** the category and month cross, I don't read it. Columns `categoria`, `mes` and `total`.",
    },
    carmen_thanks: { body: 'Twelve rows, €6,593.70 in total. Exactly what I asked for, not one row more. Thanks.' },
    ines_coalesce: {
      subject: '11:00 · Inés: "Two rows called Total"',
      body: "**Inés:** Nuria prepared her dashboard with:\n\n`SELECT COALESCE(c.categoria, 'Total') AS categoria, COUNT(*) FROM … GROUP BY ROLLUP (c.categoria);`\n\nAnd she gets **two** \"Total\" rows: one with 306 payments and another with 12. What's going on?",
      choices: {
        grouping: {
          text: "The florist **has no category** in the data: its NULL and the NULL of the total row look the same, and COALESCE turns both into \"Total\" (the one with 12 is the florist). You have to ask with `GROUPING(c.categoria)`: 1 on the total row, 0 on the data rows. Total if it's 1; otherwise `COALESCE(c.categoria, 'sin categoría')`.",
          reply: 'Exactly. In a ROLLUP, NULL can mean "all of them" or "there is no data". GROUPING() is the only safe way to tell them apart.',
          effects: { 2: { text: "To label subtotals, GROUPING(); COALESCE confuses the data's NULLs with the total's." } },
        },
        where: {
          text: 'That she should remove the merchants without a category with a `WHERE c.categoria IS NOT NULL`.',
          reply: "That way twelve real payments disappear and the total no longer matches the other reports'.",
          effects: { 0: { text: 'You removed real data to fix a label.' } },
        },
        order: {
          text: 'That she should sort by the number of payments: the biggest one is the total.',
          reply: 'It works today and fails the day a category has more payments than the total of another query… and the label would still lie.',
          effects: { 0: { text: 'You identified the total by its size instead of by GROUPING().' } },
        },
      },
    },
    nuria_etiquetas: {
      body: 'Hi. For the dashboard I want the number of payments (all) per category and the total, with the **labels right**: **`Total`** on the total row and **`sin categoría`** (no category) for the merchants that have none. Columns `categoria` and `pagos`.',
    },
    nuria_thanks: { body: 'Ten rows, a single "Total" with 306 and the florist as "sin categoría" with 12. Now it\'s right!' },
    diego_top2: {
      body: "Hey. For the big movements review I want, from each customer, their **two sent transfers with the highest amount** (if they tie, the one with the lowest id): `cliente_id`, `transferencia_id` and `importe`. The ones without transfers, out.",
    },
    diego_thanks: { body: "Seventy-eight rows, two per customer. Customer 19's €15,700 one tops the review. Thanks!" },
    laura_ultimo: {
      body: 'Hi. For the activity report I want **all** the customers with their **last event** in the app: `id`, `nombre`, `ultimo_evento` (date and time) and its `tipo`. If two coincide, the one with the highest id. And the ones without any should come out too.',
    },
    laura_thanks: { body: "Forty customers, and 38 with everything empty: they've never logged into the app. Exactly the one I was most interested in. Thanks!" },
    ines_doble: {
      subject: '15:00 · Inés: "€66,042"',
      body: '**Inés:** Marta copied the result of a `GROUP BY ROLLUP (c.categoria)` of the accepted payments into a spreadsheet and added up the `total` column for her presentation: **€66,042.44**. The accepted payments add up to €33,021.22. What happened?',
      choices: {
        double: {
          text: 'The ROLLUP already brings the **grand total** row, and by adding up the whole column she added the categories **and** the total: exactly double. Either add only the detail rows (the ones with `GROUPING(c.categoria) = 0`) or use the total row directly. And it\'s worth marking that row so it doesn\'t get confused.',
          reply: "That's it. A result with subtotals is for reading, not for adding up again. And exactly double is a very clear clue.",
          effects: { 3: { text: "A result with ROLLUP already brings the totals: it isn't added up in full." } },
        },
        dups: {
          text: 'That there must be duplicate payments in the data.',
          reply: "There are three duplicate copies, but they don't explain exactly double. What repeats is the ROLLUP's total.",
          effects: { 0: { text: 'You blamed the data for a sum done wrong.' } },
        },
        half: {
          text: "That she should divide by two and that's it.",
          reply: "With a two-column ROLLUP it wouldn't be by two any more, and nobody would know why. You have to understand which rows are added.",
          effects: { 0: { text: 'You corrected the number without understanding the mistake.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Inés',
      body: '**Inés:** Today you did totals and subtotals. What are you taking away?',
      choices: {
        lesson: {
          text: "That ROLLUP gives hierarchical subtotals, CUBE every combination and GROUPING SETS the exact groups; that GROUPING() tells a subtotal from a NULL in the data; that a result with subtotals isn't added up in full; and that LATERAL gets the N of each one, with LEFT JOIN LATERAL so nobody gets lost.",
          reply: "Very good. Tomorrow, JSON and arrays: data that doesn't fit in columns.",
        },
        union: {
          text: "That it's clearer to write one query per level of total and put them together with UNION ALL.",
          reply: "It can be done, but that's three queries to maintain and the same table read three times. Check the debrief.",
          effects: { 0: { text: 'You came away with one query per level of total.' } },
        },
      },
    },
  },
})
