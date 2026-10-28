import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m05Ranking } from '../m05-ranking'
import { ROLES_EN, missionEn } from './missionEn'

const OVER = { 0: { message: 'This task is solved with a window function: `… OVER (…)`.' } }

/** Course 6: Intermediate SQL · Mission 5 — The ranking. English version of ../m05-ranking.ts. */
export const m05RankingEn = missionEn(
  m05Ranking,
  {
    title: 'The ranking',
    subtitle: 'Window functions: RANK, ROW_NUMBER, DENSE_RANK, PARTITION BY and the top N of each group.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Monday · month 2, week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Everyone in their place',
        body: 'Marta has her local merchants, Carmen the last payment of each card, Nuria her ambassadors, Diego the levels with ties handled right and Laura her four groups of customers.',
      },
      ok: { title: 'Rankings with a gap or two', body: 'You already use window functions, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'Sorting and counting by hand', body: 'Several tasks were left undone. Replay the mission with the window functions cheat sheet at hand.' },
    },
    briefing: {
      title: 'Month 2 · Week 2 · The ranking',
      paragraphs: [
        "The second week of the month begins. Today it's all rankings: the ones that sell the most, the last one of each card, the best one of each city.",
        "Today's tasks are done with window functions (`… OVER (…)`) and have to return exactly the rows and columns asked for.",
      ],
      goals: [
        'Number rows with RANK, ROW_NUMBER and DENSE_RANK.',
        'Restart the ranking in each group with PARTITION BY.',
        'Keep the top N of each group: number in a WITH and filter outside.',
        'Decide what to do with ties.',
        'Split rows into equal groups with NTILE.',
      ],
    },
    docs: {
      chuleta_ventanas: {
        title: 'Cheat sheet: window functions (rankings)',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Shape
\`function() OVER (PARTITION BY group ORDER BY criterion)\`
- \`PARTITION BY\`: optional; restarts in each group.
- \`ORDER BY\`: the order of the ranking.

## Ranking functions
| Function | 100, 100, 80 |
|---|---|
| \`ROW_NUMBER()\` | 1, 2, 3 |
| \`RANK()\` | 1, 1, 3 |
| \`DENSE_RANK()\` | 1, 1, 2 |
| \`NTILE(n)\` | splits into n groups |

## The top N of each group
\`\`\`
WITH numerados AS (
  SELECT …, ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC) AS n
  FROM …
)
SELECT … FROM numerados WHERE n <= 3;
\`\`\`
Windows do **not** go in the WHERE or the HAVING: they are calculated afterwards.

## Order of execution
FROM → WHERE → GROUP BY → HAVING → windows → ORDER BY → LIMIT`,
      },
    },
    sqlLab: {
      starter: "-- A ranking with a window function\nSELECT comercio_id,\n       SUM(importe) AS total,\n       RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto\nFROM pagos_tarjeta\nWHERE estado = 'aceptado'\nGROUP BY comercio_id;",
      retos: {
        ranking_comercios: {
          title: 'Merchant ranking',
          description: 'Of the **accepted** payments: `comercio_id`, `total` amount and `puesto` (position: 1 for the one that sells the most).',
          hint: "`RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto`, with `WHERE estado = 'aceptado'` and `GROUP BY comercio_id`.",
          requires: OVER,
        },
        top3_ciudad: {
          title: 'The top 3 sellers of each city',
          description: '`ciudad`, `nombre` and `total` (**accepted** payments) of the **3 merchants that sell the most in each city**; without the online shop, which has no city.',
          hint: 'A step with the total per merchant (with its city and name) and `ROW_NUMBER() OVER (PARTITION BY ciudad ORDER BY total DESC) AS n`; outside, `WHERE n <= 3`.',
          requires: OVER,
        },
        ultimo_pago: {
          title: 'The last payment of each card',
          description: '`tarjeta_id`, `id`, `importe` and `pagado_en` of the **last payment** (any status) of each card.',
          hint: '`ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) AS n` in a WITH; outside, `WHERE n = 1`.',
          requires: OVER,
        },
        top_cliente_ciudad: {
          title: 'The customer with the highest balance in each city',
          description: '`ciudad`, `nombre` and `saldo_total` (sum of their accounts) of the **customer with the highest total balance in each city**.',
          hint: 'Balance per customer with their city, `RANK() OVER (PARTITION BY ciudad ORDER BY saldo_total DESC)` and outside position 1.',
          requires: OVER,
        },
        ranking_pagos: {
          title: 'Customers by number of payments, no gaps',
          description: '`cliente_id`, number of card `pagos` (all statuses) and `puesto`: tied customers share the position and the next position is the next number (1, 1, 2…).',
          hint: '`pagos_tarjeta` → `tarjetas` → `cuentas` to get to the customer; `DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS puesto`.',
          requires: OVER,
        },
        cuartiles: {
          title: 'Customers in four groups by balance',
          description: '`cliente_id`, `saldo_total` and `cuartil`: the customers split into **4 groups** by total balance, 1 for the ones with the highest balance.',
          hint: 'Balance per `cliente_id` in `cuentas` and `NTILE(4) OVER (ORDER BY SUM(saldo) DESC) AS cuartil`.',
          requires: OVER,
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'The local campaign is left without merchants', explanation: "Marta didn't get the top three sellers of each city.", technique: 'PARTITION BY and filtering the number outside.' },
      'C-CARMEN': { title: 'Nobody reviews the inactive cards', explanation: 'Carmen was left without the last payment of each card.', technique: 'ROW_NUMBER per card, from newest to oldest.' },
      'C-NURIA': { title: "The ambassadors programme doesn't start", explanation: "Nuria didn't have the best customer of each city.", technique: 'RANK per city.' },
      'C-DIEGO': { title: 'The app levels jump from 1 to 7', explanation: 'Without DENSE_RANK, the positions leave gaps after ties.', technique: 'DENSE_RANK.' },
      'C-LAURA': { title: 'The performance tests use similar customers', explanation: "Laura couldn't pick customers from each balance group.", technique: 'NTILE(4).' },
      'C-WHERE': { title: 'A "last payments" report brings every payment', explanation: 'To dodge the window-in-the-WHERE error, someone removed the filter.', technique: 'Number in a WITH and filter outside.' },
      'C-EMPATES': { title: 'Three tied customers are left without a prize', explanation: 'ROW_NUMBER blindly cut the top 3 among six tied customers.', technique: 'RANK or DENSE_RANK, or an explicit tie-breaker.' },
    },
    prevention: {
      title: 'At the end of the day',
      intro: "What happened with Monday's rankings.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Local campaign', explanation: 'Top 3 per city.' },
        1: { label: 'Inactive cards', explanation: 'Last payment of each card.' },
        2: { label: 'Ambassadors', explanation: 'The best customer of each city.' },
        3: { label: 'App levels', explanation: 'DENSE_RANK without gaps.' },
        4: { label: 'Performance tests', explanation: 'Customers in four groups.' },
        5: { label: 'Filter in the right place', explanation: 'The window in a WITH.' },
        6: { label: 'Fair prizes', explanation: 'Ties respected.' },
      },
    },
    concepts: {
      window_basics: { title: 'Window functions', summary: "A calculation over a group of rows that doesn't merge them: each row gains a column." },
      partition_by: { title: 'PARTITION BY', summary: 'Restarts the window in each group: a ranking per city, per card…' },
      rank_functions: { title: 'ROW_NUMBER, RANK and DENSE_RANK', summary: 'The same without ties; with ties: 1,2,3 / 1,1,3 / 1,1,2.' },
      top_n_per_group: { title: 'The top N of each group', summary: 'Number in a WITH with PARTITION BY and filter n <= N outside.' },
      window_filter: { title: 'Windows and WHERE', summary: 'Windows are calculated after the WHERE and the HAVING: they are filtered in another step.' },
      ntile: { title: 'NTILE', summary: 'Splits the rows into n groups as equal as possible.' },
    },
    seniorTips: [
      'Read the window functions cheat sheet in the wiki.',
      "Inés: comercio_id, SUM(importe) AS total, RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto … WHERE estado = 'aceptado' GROUP BY comercio_id.",
      'Marta: ROW_NUMBER() OVER (PARTITION BY c.ciudad ORDER BY SUM(p.importe) DESC) in a WITH, and n <= 3 outside.',
      'Carmen: ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) in a WITH, and n = 1 outside.',
      'Nuria: RANK() OVER (PARTITION BY c.ciudad ORDER BY SUM(a.saldo) DESC) and position 1.',
      'Diego: DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) per customer (pagos → tarjetas → cuentas).',
      'Laura: NTILE(4) OVER (ORDER BY SUM(saldo) DESC) per cliente_id in cuentas.',
      "With Inés: the window doesn't go in the WHERE; and with ties, ROW_NUMBER cuts blindly.",
    ],
    lessons: {
      basics: {
        question: 'What is a window function?',
        body: `A calculation over a group of rows that **doesn't merge them**: each row stays and gains a column.

\`\`\`
SELECT comercio_id,
       SUM(importe) AS total,
       RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto
FROM pagos_tarjeta
WHERE estado = 'aceptado'
GROUP BY comercio_id;
\`\`\`

What goes inside \`OVER (…)\` defines the window: in which order the rows are looked at and in which groups. Windows are calculated at the end, after the \`WHERE\`, the \`GROUP BY\` and the \`HAVING\`: that's why they can use \`SUM(importe)\`.`,
      },
      partition: {
        question: 'How do I make a ranking within each group?',
        body: `With \`PARTITION BY\`: the window restarts in each group.

\`\`\`
ROW_NUMBER() OVER (PARTITION BY ciudad ORDER BY total DESC)
\`\`\`

It numbers 1, 2, 3… the merchants of Madrid, starts again at 1 with the ones of Barcelona, and so on. It's like a \`GROUP BY\`, but without merging the rows.`,
      },
      rank: {
        question: 'ROW_NUMBER, RANK or DENSE_RANK?',
        body: `They only differ in **ties**. With amounts 100, 100, 80:

| Function | Result |
|---|---|
| \`ROW_NUMBER()\` | 1, 2, 3 (breaks ties at random) |
| \`RANK()\` | 1, 1, 3 (leaves a gap) |
| \`DENSE_RANK()\` | 1, 1, 2 (no gaps) |

If there can't be ties (a unique column in the ORDER BY), all three give the same.`,
      },
      top_n: {
        question: 'How do I get the top N of each group?',
        body: `In two steps: number and filter.

\`\`\`
WITH numerados AS (
  SELECT tarjeta_id, id, importe, pagado_en,
         ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) AS n
  FROM pagos_tarjeta
)
SELECT tarjeta_id, id, importe, pagado_en
FROM numerados
WHERE n = 1;
\`\`\`

\`n = 1\` is "the last one of each card"; \`n <= 3\`, "the last three".`,
      },
      filter: {
        question: "Why can't I put the window in the WHERE?",
        body: `Because of the order in which PostgreSQL runs the query:

1. \`FROM\` and \`JOIN\` → 2. \`WHERE\` → 3. \`GROUP BY\` → 4. \`HAVING\` → 5. **windows** → 6. \`ORDER BY\` → 7. \`LIMIT\`.

When the \`WHERE\` is evaluated, the window doesn't exist yet. Solution: calculate it in a \`WITH\` (or a subquery in the \`FROM\`) and filter outside.`,
      },
      ntile: {
        question: 'How do I split rows into equal groups?',
        body: `\`NTILE(n)\` splits the rows, in the given order, into \`n\` groups as equal as possible:

\`\`\`
NTILE(4) OVER (ORDER BY saldo_total DESC) AS cuartil
\`\`\`

39 customers in 4 groups: 10, 10, 10 and 9. Useful for quartiles, deciles or splitting work into batches.`,
      },
    },
    quiz: {
      pre: {
        i5pre_basics: {
          question: 'What sets a window function apart from a GROUP BY?',
          options: ['Nothing', "The window doesn't merge the rows: each row keeps its detail and gains a column", 'The window is faster', 'The window only works with numbers'],
          explanation: 'GROUP BY leaves one row per group; the window, all of them.',
        },
        i5pre_partition: {
          question: 'What does `PARTITION BY ciudad` do inside `OVER (…)`?',
          options: ['It filters by city', 'It restarts the calculation in each city', 'It sorts by city', 'It groups and merges the rows'],
          explanation: 'Each city is its own window.',
        },
        i5pre_rank: {
          question: 'Amounts 100, 100, 80. What does `RANK()` give sorting from highest to lowest?',
          options: ['1, 2, 3', '1, 1, 2', '1, 1, 3', '1, 2, 2'],
          explanation: 'RANK ties and leaves a gap.',
        },
        i5pre_top_n: {
          question: 'You want the last payment of each card, with its id and amount. What do you use?',
          options: ['MAX(pagado_en) GROUP BY tarjeta_id', 'ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) and keep number 1', 'ORDER BY pagado_en DESC LIMIT 1', 'DISTINCT tarjeta_id'],
          explanation: 'MAX gives the date, not the row; LIMIT 1 gives a single payment in total.',
        },
        i5pre_filter: {
          question: '`WHERE ROW_NUMBER() OVER (…) = 1`:',
          options: ['It works', 'It gives an error: windows are not allowed in the WHERE', 'It returns every row', 'It returns the first row'],
          explanation: 'It is calculated in a WITH and filtered outside.',
        },
        i5pre_ntile: {
          question: 'What does `NTILE(4) OVER (ORDER BY saldo DESC)` do?',
          options: ['It divides the balance by 4', 'It splits the rows into 4 groups in order of balance', 'It returns the first 4', 'It rounds to 4 decimals'],
          explanation: 'Quartiles: 1 for the highest balances, 4 for the lowest.',
        },
      },
      post: {
        i5post_basics: {
          question: 'Can a window use `SUM(importe)` from a GROUP BY in its ORDER BY?',
          options: ['No', 'Yes: windows are calculated after the GROUP BY', 'Only with PARTITION BY', 'Only in a WITH'],
          explanation: 'RANK() OVER (ORDER BY SUM(importe) DESC) is valid.',
        },
        i5post_partition: {
          question: 'Top 3 merchants of each city: what goes in the OVER?',
          options: ['ORDER BY ciudad', 'PARTITION BY ciudad ORDER BY total DESC', 'PARTITION BY total ORDER BY ciudad', 'GROUP BY ciudad'],
          explanation: 'A ranking per city, from highest to lowest.',
        },
        i5post_rank: {
          question: 'Positions without gaps when there are ties (1, 1, 2…):',
          options: ['ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE'],
          explanation: "DENSE_RANK doesn't leave gaps.",
        },
        i5post_ties: {
          question: 'Six customers tie for first place and you reward `ROW_NUMBER() <= 3`. What happens?',
          options: ['All six come out', 'Three come out, picked at random', 'Error', 'None comes out'],
          explanation: 'ROW_NUMBER breaks ties without a criterion. RANK or an explicit tie-breaker.',
        },
        i5post_filter: {
          question: 'In which order are WHERE, GROUP BY and the windows evaluated?',
          options: ['Windows, WHERE, GROUP BY', 'WHERE, GROUP BY, windows', 'GROUP BY, windows, WHERE', "It doesn't matter"],
          explanation: 'Windows come almost at the end, before the ORDER BY.',
        },
        i5post_ntile: {
          question: '39 customers with NTILE(4): how many are there in each group?',
          options: ['10, 10, 10, 9', '9, 10, 10, 10', '13, 13, 13, 0', '39 in the first one'],
          explanation: 'The first groups take the leftover rows.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Week 2: window functions',
        body: "Good morning and welcome to the second week.\n\nThis week it's what gets asked for most in data: **rankings and trends**. The tool is **window functions**: they calculate something over a group of rows (the \"window\") **without merging them into one**, unlike `GROUP BY`. Each row keeps its detail and gains a new column: its position, the total of its group, the previous row…\n\nTo start:\n\n- The merchants sorted by amount of **accepted** payments: `comercio_id`, `total` and `puesto` (1 for the one that sells the most), with `RANK() OVER (ORDER BY …)`.\n\nInés",
      },
      ines_ok: {
        body: 'Viajes Horizonte, first with more than €7,700. Notice: the `GROUP BY` merges the payments per merchant and the window numbers the groups already merged. They can be combined in the same query.',
      },
      marta_top3: {
        body: "Hi! For the campaign with local merchants I want the **3 merchants that sell the most in each city** (accepted payments; the online shop has no city, leave it out). Columns: `ciudad`, `nombre` and `total`. If a city has fewer than 3, the ones there are.",
      },
      marta_thanks: { body: 'Seventeen merchants: three in Madrid, Barcelona and Valencia, and the two there are in the others. Perfect!' },
      carmen_ultimo: {
        body: 'Hi. To review inactive cards I need the **last payment of each card**: `tarjeta_id`, payment `id`, `importe` and `pagado_en`. One row per card.',
      },
      carmen_thanks: { body: "Thirty-two cards with their last payment. The ones that haven't moved in months go to review. Thanks." },
      ines_where: {
        subject: '11:00 · Inés: "It won\'t let me filter by position"',
        body: '**Inés:** Diego wanted the last payment of each card like this:\n\n`SELECT tarjeta_id, id FROM pagos_tarjeta WHERE ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) = 1;`\n\nAnd PostgreSQL tells him window functions are not allowed in the WHERE. How does he fix it?',
        choices: {
          cte: {
            text: 'Windows are calculated **after** the `WHERE` (and the `GROUP BY`), so they don\'t exist there yet. You have to calculate the number in a step (`WITH numerados AS (SELECT …, ROW_NUMBER() OVER (…) AS n …)`) and filter `WHERE n = 1` in the outer query.',
            reply: "Exactly. First you number, then you filter: two steps. It's the \"top N per group\" pattern and you'll use it a lot.",
            effects: { 2: { text: 'To filter by a window: calculate it in a WITH and filter outside.' } },
          },
          having: {
            text: 'That he should move it to the `HAVING`.',
            reply: "The HAVING also comes before the windows. It can't see them either.",
            effects: { 0: { text: "HAVING can't see window functions either." } },
          },
          max: {
            text: "That he should use `MAX(pagado_en)` with `GROUP BY tarjeta_id` and that's it.",
            reply: 'He would get the date, but not the id or the amount of that payment: for that he needs the whole row, and the window gives him that.',
            effects: { 0: { text: 'With MAX you have the date, not the whole row.' } },
          },
        },
      },
      nuria_top_ciudad: {
        body: "Hi. We're going to call the **customer with the highest total balance in each city** for an ambassadors programme. Can you send me `ciudad`, `nombre` and `saldo_total`? One per city.",
      },
      nuria_thanks: { body: 'Seven ambassadors, one per city. Thanks!' },
      diego_ranking: {
        body: 'Hey. For the app levels system I want the customers by **number of card payments**: `cliente_id`, `pagos` and `puesto`. If they tie, **same position**, and the next position is the **next number** (1, 1, 2…), no gaps.',
      },
      diego_thanks: { body: 'Six customers tied at the first level, one at the second… With positions without gaps, the levels work out. Thanks!' },
      laura_cuartiles: {
        body: 'Hi. For the performance tests I want to split the customers into **four groups by total balance** (from highest to lowest): `cliente_id`, `saldo_total` and `cuartil` (1 for the highest balances, 4 for the lowest).',
      },
      laura_thanks: { body: "Four groups of about ten customers. I'll take two from each one for the tests. Thanks!" },
      ines_empates: {
        subject: '15:00 · Inés: "And the other three?"',
        body: '**Inés:** Marta rewarded the 3 customers with the most card payments like this:\n\n`… ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS n …` and then `WHERE n <= 3`.\n\nThree customers with 13 payments came out. But there are **six** with 13 payments, and three were left without a prize. What happened?',
        choices: {
          ties: {
            text: '`ROW_NUMBER` gives a different number to each row even if they tie, and the order between tied rows is **random**. For a prize to "the top 3" with ties, `RANK` (1, 1, 1, 1, 1, 1, 7…) or `DENSE_RANK` (1, 1, …, 2…) keeps them all in. And if it really has to be three, you have to say how ties are broken in the `ORDER BY`.',
            reply: "That's it. Before a top N ask yourself: what happens if they tie? ROW_NUMBER cuts blindly; RANK and DENSE_RANK respect the tie.",
            effects: { 3: { text: 'In a top N with ties, RANK or DENSE_RANK; or an explicit tie-breaker.' } },
          },
          limit: {
            text: 'That she should use `ORDER BY COUNT(*) DESC LIMIT 3`.',
            reply: 'Same problem: three rows picked blindly among six tied ones.',
            effects: { 0: { text: 'LIMIT also cuts ties without a criterion.' } },
          },
          random: {
            text: "That it's bad luck: the three that came out deserve it just as much.",
            reply: "And so do the other three. And if you run the query again, others may come out. A prize can't depend on chance.",
            effects: { 0: { text: 'You accepted a result that changes between runs.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you made rankings. What are you taking away?',
        choices: {
          lesson: {
            text: 'That window functions add a column without merging rows; that `PARTITION BY` restarts the count in each group; that to keep the top N I number in a `WITH` and filter outside; and that with ties `ROW_NUMBER`, `RANK` and `DENSE_RANK` give different results.',
            reply: 'Very good. Tomorrow, the windows that look back: running totals, moving averages and the previous month.',
          },
          sort: {
            text: "That it's enough to sort and count the first ones by hand.",
            reply: 'With 22 merchants, maybe. With 20,000 and per city, no. Check the debrief.',
            effects: { 0: { text: 'You came away with sorting and counting by hand.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
