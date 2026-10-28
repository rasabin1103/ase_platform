import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m06Tendencias } from '../m06-tendencias'
import { ROLES_EN, missionEn } from './missionEn'

const OVER = { 0: { message: 'This task is solved with a window function: `… OVER (…)`.' } }

/** Course 6: Intermediate SQL · Mission 6 — Trends. English version of ../m06-tendencias.ts. */
export const m06TendenciasEn = missionEn(
  m06Tendencias,
  {
    title: 'Trends',
    subtitle: 'Running totals, moving averages, LAG and LEAD, and percentages of the total.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Tuesday · month 2, week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'The trend, crystal clear',
        body: 'Marta has her monthly change, Carmen the moving average for the committee, Nuria the running total of each year, Diego the dormant card found and Laura the weight of each category.',
      },
      ok: { title: 'Trends with a bump or two', body: 'You already use windows to accumulate and compare, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'Each month on its own', body: 'Several tasks were left undone. Replay the mission with the trends cheat sheet at hand.' },
    },
    briefing: {
      title: 'Month 2 · Week 2 · Trends',
      paragraphs: [
        "Tuesday. Today the questions are about evolution: how much have we got so far? Is it going up or down? What's the trend without the noise of each month?",
        'Almost every task starts from the accepted total per month. They are done with window functions and have to return exactly the columns asked for.',
      ],
      goals: [
        'Calculate a running total with SUM() OVER (ORDER BY …).',
        'Restart it every year with PARTITION BY.',
        'Compare with the previous row with LAG.',
        'Make a moving average with ROWS BETWEEN.',
        'Calculate percentages of the total with OVER ().',
        "Don't trust LAG when periods are missing.",
      ],
    },
    docs: {
      chuleta_tendencias: {
        title: 'Cheat sheet: trends with windows',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Total per month (first step)
\`\`\`
WITH mensual AS (
  SELECT DATE_TRUNC('month', pagado_en) AS mes, SUM(importe) AS total
  FROM pagos_tarjeta WHERE estado = 'aceptado'
  GROUP BY DATE_TRUNC('month', pagado_en)
)
\`\`\`

## Windows for trends
| I want | Window |
|---|---|
| Running total | \`SUM(total) OVER (ORDER BY mes)\` |
| Running total per year | \`SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes)\` |
| Total of everything | \`SUM(total) OVER ()\` |
| Previous / next row | \`LAG(total) OVER (ORDER BY mes)\` / \`LEAD(…)\` |
| 3-month moving average | \`AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)\` |

## Days between dates
\`fecha1::date - fecha2::date\` gives a number of days.

## Careful
- \`OVER ()\` is the whole table; the \`ORDER BY\` inside the OVER turns the sum into a running total.
- \`LAG\` is the previous **row**: if a month is missing, it compares with another one.`,
      },
    },
    sqlLab: {
      starter: "-- Accepted total per month\nWITH mensual AS (\n  SELECT DATE_TRUNC('month', pagado_en) AS mes, SUM(importe) AS total\n  FROM pagos_tarjeta\n  WHERE estado = 'aceptado'\n  GROUP BY DATE_TRUNC('month', pagado_en)\n)\nSELECT mes, total\nFROM mensual\nORDER BY mes;",
      retos: {
        acumulado: {
          title: 'Monthly running total',
          description: "**Accepted** payments per month: `mes` (with `DATE_TRUNC('month', pagado_en)`), `total` of the month and `acumulado` (running total) from the start.",
          hint: 'A step `mensual` with month and total; outside, `SUM(total) OVER (ORDER BY mes) AS acumulado`.',
          requires: OVER,
        },
        variacion: {
          title: 'Change from the previous month',
          description: '`mes`, `total`, `anterior` (total of the previous month) and `variacion` (total − anterior), of the **accepted** payments.',
          hint: '`LAG(total) OVER (ORDER BY mes) AS anterior` and `total - LAG(total) OVER (ORDER BY mes) AS variacion`.',
          requires: OVER,
        },
        media_movil: {
          title: '3-month moving average',
          description: '`mes`, `total` and `media_3m`: the average of the month and the two before it, with 2 decimals. **Accepted** payments.',
          hint: '`ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_3m`.',
          requires: OVER,
        },
        acumulado_anio: {
          title: 'Running total of each year',
          description: '`mes`, `total` and `acumulado_anio`: the running total that **starts again in January** of each year. **Accepted** payments.',
          hint: "`SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes) AS acumulado_anio`.",
          requires: OVER,
        },
        dias_entre_pagos: {
          title: 'Days between payments of card 5',
          description: 'Payments of **card 5** (any status): `id`, `pagado_en` and `dias` since its previous payment (calendar days; the first one, empty).',
          hint: '`pagado_en::date - LAG(pagado_en::date) OVER (ORDER BY pagado_en) AS dias`, with `WHERE tarjeta_id = 5`.',
          requires: OVER,
        },
        peso_categoria: {
          title: 'Weight of each category',
          description: "`categoria` (`'sin categoría'` for the one that has none), accepted `total` and `porcentaje` of the total of all categories, with 1 decimal.",
          hint: "`ROUND(100.0 * SUM(p.importe) / SUM(SUM(p.importe)) OVER (), 1) AS porcentaje`, grouping by `COALESCE(c.categoria, 'sin categoría')`.",
          requires: OVER,
        },
      },
    },
    bugs: {
      'C-MARTA': { title: "The monthly report doesn't say whether it's going up or down", explanation: "Marta didn't get the change from the previous month.", technique: 'LAG.' },
      'C-CARMEN': { title: 'The committee reacts to an isolated month', explanation: 'Without the moving average, a one-month peak looked like a trend.', technique: 'AVG with ROWS BETWEEN.' },
      'C-NURIA': { title: "The 2026 target is measured adding up 2025", explanation: "Nuria didn't have the running total that restarts every year.", technique: 'PARTITION BY year.' },
      'C-DIEGO': { title: 'The dormant card alert ships untested', explanation: "Diego didn't see the 130 days without use of card 5.", technique: 'LAG with dates.' },
      'C-LAURA': { title: "The dashboard doesn't show the weight of each category", explanation: 'Laura was left without the percentages.', technique: 'SUM(SUM(…)) OVER ().' },
      'C-OVER': { title: 'A report shows the same running total in every month', explanation: 'OVER () without ORDER BY gave the grand total in every row.', technique: 'ORDER BY inside the OVER.' },
      'C-HUECOS': { title: 'The services change compares July with May', explanation: 'LAG took the previous row, and June was missing.', technique: 'Check the previous period or fill in the calendar.' },
    },
    prevention: {
      title: 'At the end of the day',
      intro: "What happened with Tuesday's trends.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Marta's report", explanation: 'Month-on-month change.' },
        1: { label: "Carmen's committee", explanation: '3-month moving average.' },
        2: { label: "Nuria's targets", explanation: 'Running total per year.' },
        3: { label: "Diego's alert", explanation: 'Days between payments.' },
        4: { label: "Laura's dashboard", explanation: 'Percentage per category.' },
        5: { label: 'Real running totals', explanation: 'ORDER BY inside the OVER.' },
        6: { label: 'Comparisons with the right month', explanation: 'LAG and the gaps.' },
      },
    },
    concepts: {
      running_total: { title: 'Running totals', summary: 'SUM() OVER (ORDER BY …); with PARTITION BY it restarts in each group.' },
      lag_lead: { title: 'LAG and LEAD', summary: 'The value of the previous or the next row, according to the ORDER BY of the OVER.' },
      window_frame: { title: 'Frames and moving averages', summary: 'ROWS BETWEEN n PRECEDING AND CURRENT ROW decides which rows go into the window.' },
      share_of_total: { title: 'Percentage of the total', summary: 'OVER () sees every row: SUM(SUM(x)) OVER () is the grand total.' },
      lag_gaps: { title: 'LAG and the gaps', summary: 'LAG gives the previous row, not the previous period: if a month is missing, it compares with another.' },
    },
    seniorTips: [
      'Read the trends cheat sheet in the wiki.',
      'Inés: step mensual (DATE_TRUNC and SUM of accepted payments) and SUM(total) OVER (ORDER BY mes) AS acumulado.',
      'Marta: LAG(total) OVER (ORDER BY mes) AS anterior and total - LAG(total) OVER (ORDER BY mes) AS variacion.',
      'Carmen: ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_3m.',
      "Nuria: SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes) AS acumulado_anio.",
      'Diego: pagado_en::date - LAG(pagado_en::date) OVER (ORDER BY pagado_en) AS dias, with tarjeta_id = 5.',
      "Laura: ROUND(100.0 * SUM(p.importe) / SUM(SUM(p.importe)) OVER (), 1), per COALESCE(c.categoria, 'sin categoría').",
      'With Inés: OVER () is everything, OVER (ORDER BY …) accumulates; LAG looks at the row, not the calendar.',
    ],
    lessons: {
      running: {
        question: 'How do I make a running total?',
        body: `With \`SUM\` as a window and an \`ORDER BY\` inside the \`OVER\`:

\`\`\`
WITH mensual AS (
  SELECT DATE_TRUNC('month', pagado_en) AS mes, SUM(importe) AS total
  FROM pagos_tarjeta WHERE estado = 'aceptado'
  GROUP BY DATE_TRUNC('month', pagado_en)
)
SELECT mes, total,
       SUM(total) OVER (ORDER BY mes) AS acumulado
FROM mensual;
\`\`\`

Each row adds its total and that of all the previous ones. Check: the last row gives the grand total.`,
      },
      partition_reset: {
        question: 'And if the running total has to start from zero every year?',
        body: `You add a \`PARTITION BY\`:

\`\`\`
SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes) AS acumulado_anio
\`\`\`

In each year the window starts again. The same works for "running total per customer", "per card", and so on.`,
      },
      lag: {
        question: 'How do I compare with the previous month?',
        body: `\`LAG(column)\` brings the value of the **previous row** (according to the \`ORDER BY\` of the OVER); \`LEAD\`, that of the next one.

\`\`\`
SELECT mes, total,
       LAG(total) OVER (ORDER BY mes) AS anterior,
       total - LAG(total) OVER (ORDER BY mes) AS variacion
FROM mensual;
\`\`\`

The first row has no previous one: \`NULL\`. \`LAG(total, 12)\` would be the same month of the previous year (if no months are missing).`,
      },
      frame: {
        question: 'How do I make a moving average?',
        body: `By saying which rows go into the window (the *frame*):

\`\`\`
ROUND(AVG(total) OVER (ORDER BY mes
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_3m
\`\`\`

The current row and the two before it. The first months use the ones there are (January, only itself; February, two). Other frames: \`UNBOUNDED PRECEDING\` (from the start), \`1 FOLLOWING\` (the next one).`,
      },
      share: {
        question: 'How do I calculate the percentage of the total without another query?',
        body: `With an empty window, \`OVER ()\`: each row sees the total of all of them.

\`\`\`
SELECT categoria, SUM(importe) AS total,
       ROUND(100.0 * SUM(importe) / SUM(SUM(importe)) OVER (), 1) AS porcentaje
FROM …
GROUP BY categoria;
\`\`\`

\`SUM(SUM(importe)) OVER ()\`: the inner SUM is the one of the GROUP BY (per category); the outer one adds up all the categories.`,
      },
      gaps: {
        question: 'Does LAG give the previous month?',
        body: `No: it gives the **previous row**. If a month has no data, there is no row, and LAG skips that month without warning.

Before trusting it:
- also get \`LAG(mes) OVER (ORDER BY mes)\` and check that it is exactly one month earlier;
- or generate every month with a calendar (\`generate_series\`) and join it with LEFT JOIN, with 0 where there is no data.`,
      },
    },
    quiz: {
      pre: {
        i6pre_running: {
          question: 'What does `SUM(total) OVER (ORDER BY mes)` give?',
          options: ['The total of each month', 'The running total up to each month', 'The grand total in every row', 'Error'],
          explanation: 'The window goes from the start to the current row.',
        },
        i6pre_empty: {
          question: 'And `SUM(total) OVER ()`?',
          options: ['The running total', 'The total of all the rows, repeated in each one', 'NULL', 'Error'],
          explanation: 'Without ORDER BY or PARTITION BY, the window is everything.',
        },
        i6pre_lag: {
          question: 'What does `LAG(total) OVER (ORDER BY mes)` return in the first row?',
          options: ['0', 'NULL', 'The total of the last row', 'Error'],
          explanation: 'There is no previous row.',
        },
        i6pre_frame: {
          question: 'Average of each month and the two before it:',
          options: ['AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)', 'AVG(total) OVER ()', 'AVG(total) GROUP BY mes', 'AVG(LAG(total, 2))'],
          explanation: 'The ROWS BETWEEN frame says which rows go in.',
        },
        i6pre_reset: {
          question: 'For the running total to start from zero every year, you add…',
          options: ["PARTITION BY DATE_TRUNC('year', mes)", 'GROUP BY year', 'WHERE year = 2026', 'LAG(12)'],
          explanation: 'Each year is its own window.',
        },
        i6pre_gaps: {
          question: 'LAG(total) OVER (ORDER BY mes) returns…',
          options: ['The total of the previous calendar month', 'The total of the previous row', 'The total of the previous year', 'The average'],
          explanation: 'If a month is missing, it jumps to the previous one that exists.',
        },
      },
      post: {
        i6post_running: {
          question: 'How do you quickly check that a running total is right?',
          options: ["You can't", 'The last row has to give the grand total', 'It always has to grow one by one', 'With a COUNT'],
          explanation: 'The final running total is the sum of everything.',
        },
        i6post_share: {
          question: 'In `100.0 * SUM(importe) / SUM(SUM(importe)) OVER ()`, what is the outer SUM?',
          options: ['The total of the category', 'The total of all the categories', 'The running total', 'An error'],
          explanation: 'It adds up, over the whole grouped table, the totals per category.',
        },
        i6post_lag: {
          question: 'What does `LEAD(total) OVER (ORDER BY mes)` do?',
          options: ["It brings the next month's total (the next row)", 'It brings the previous one', 'It adds the next one', 'It sorts in reverse'],
          explanation: 'LEAD looks forward; LAG, backwards.',
        },
        i6post_frame: {
          question: 'With `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`, what average comes out in the first month?',
          options: ['NULL', "That month's total (there is only one row)", '0', 'The average of the first three'],
          explanation: 'The window uses the rows that exist.',
        },
        i6post_order: {
          question: 'A running total comes out the same in every row. What is missing?',
          options: ['An ORDER BY inside the OVER', 'An ORDER BY at the end of the query', 'A GROUP BY', 'A LIMIT'],
          explanation: 'Without ORDER BY in the OVER, the window is the whole table.',
        },
        i6post_gaps: {
          question: 'Services had no payments in June. What does a `LAG(total) OVER (ORDER BY mes)` compare July with?',
          options: ['With June (0)', 'With May', "With the previous year's July", 'It gives NULL'],
          explanation: 'There is no June row: the previous one is May.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Windows that look back',
        body: "Good morning.\n\nYesterday the windows sorted; today they are going to **add up and compare**: the year's running total, the average of the last three months, how much it changed from the previous month. The trend questions everyone will ask you.\n\nTo start, on the **accepted** payments per month:\n\n- `mes` (with `DATE_TRUNC`), `total` of the month and `acumulado` from the start (the sum of that month and all the previous ones).\n\nInés",
      },
      ines_ok: {
        body: 'Fourteen months and the last running total matches the total of accepted payments: €33,021.22. Whenever you make a running total, check that the last row gives the total.',
      },
      marta_variacion: {
        body: 'Hi! For the monthly report I want to see how much **each month goes up or down from the previous one**: `mes`, `total`, `anterior` (the total of the previous month) and `variacion` (total minus anterior). Accepted payments.',
      },
      marta_thanks: { body: 'The first month without a previous one, of course. And February 2026 goes up by more than €3,800. Thanks!' },
      carmen_movil: {
        body: 'Hi. The monthly totals jump around a lot. For the committee I want the **3-month moving average** (the month and the two before it): `mes`, `total` and `media_3m` with 2 decimals. Accepted payments.',
      },
      carmen_thanks: { body: 'With the moving average you see the trend without the noise of each month. This goes to the committee. Thanks.' },
      ines_over_vacio: {
        subject: '11:00 · Inés: "The running total is the same in every row"',
        body: '**Inés:** Diego tried the running total like this:\n\n`SELECT mes, total, SUM(total) OVER () AS acumulado FROM mensual;`\n\nAnd in all fourteen rows he gets 33,021.22. What is he missing?',
        choices: {
          order: {
            text: 'An `ORDER BY` inside the `OVER`. With `OVER ()` the window is **the whole table**: each row sees the grand total (useful for percentages). With `OVER (ORDER BY mes)` the window goes **from the start to the current row**, and that is a running total.',
            reply: "Exactly. The ORDER BY inside the OVER doesn't just sort: it changes which rows go into the window.",
            effects: { 2: { text: 'OVER () = total of everything; OVER (ORDER BY …) = running total up to the row.' } },
          },
          order_end: {
            text: 'That he should put `ORDER BY mes` at the end of the query.',
            reply: 'That ORDER BY only sorts the result; the window would still be the whole table. It has to go inside the OVER.',
            effects: { 0: { text: "The query's ORDER BY doesn't change the window." } },
          },
          group: {
            text: 'That he should use `GROUP BY mes` instead of the window.',
            reply: 'That would give him the total of each month, which he already has. The running total needs to see the previous months: only the window gives that.',
            effects: { 0: { text: "GROUP BY can't add up rows from other groups." } },
          },
        },
      },
      nuria_anio: {
        body: 'Hi. To compare with the yearly targets I want the **running total of each year**: the 2026 one has to start from zero in January. `mes`, `total` and `acumulado_anio`. Accepted payments.',
      },
      nuria_thanks: { body: '2026 starts at 1,384.41 and by February it is already at 6,593.70. Thanks!' },
      diego_dias: {
        body: 'Hey. I\'m testing the "dormant card" alert. For **card 5**: `id`, `pagado_en` and `dias` (calendar days since its previous payment). The first one, without a previous one.',
      },
      diego_thanks: { body: "130 days without using it between April and August! The alert should have gone off. I'm noting it down. Thanks!" },
      laura_peso: {
        body: "Hi. For the dashboard I want the **weight of each category** in the total accepted amount: `categoria` ('sin categoría' for the one that has none), `total` and `porcentaje` of the total of all of them, with 1 decimal.",
      },
      laura_thanks: { body: 'Travel and shopping take two thirds. And without a separate subquery for the total. Thanks!' },
      ines_huecos: {
        subject: '15:00 · Inés: "July compared with May?"',
        body: '**Inés:** Diego calculated the monthly change of the **services** category with `LAG(total) OVER (ORDER BY mes)`. In July 2025 he gets that it goes up compared "to the previous month"… but in June services had no payments at all, so there is no June row. What did he compare July with?',
        choices: {
          gaps: {
            text: '`LAG` takes the **previous row**, not the previous month: if June is missing, July is compared with May. You have to check it (for example, also getting `LAG(mes)` and seeing that it is exactly one month earlier) or fill in the empty months with a calendar (`generate_series`) so they exist with a total of 0.',
            reply: "That's it. LAG knows nothing about calendars. Tomorrow you'll see how to generate every month even if they have no data.",
            effects: { 3: { text: 'LAG = previous row, not previous period: watch out for gaps.' } },
          },
          lag2: {
            text: 'That he should use `LAG(total, 2)` to skip the gap.',
            reply: 'It would only work for July, and it would break every month that does have the previous one.',
            effects: { 0: { text: "Adjusting the offset by hand doesn't fix the gaps." } },
          },
          fine: {
            text: "That it doesn't matter: if June had no payments, comparing with May is the same.",
            reply: 'June had €0: July went up from 0, not from what there was in May. They are different changes.',
            effects: { 0: { text: 'You accepted a comparison with the wrong period.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you made trends. What are you taking away?',
        choices: {
          lesson: {
            text: 'That `SUM() OVER (ORDER BY …)` gives a running total and `OVER ()` the total of everything; that `PARTITION BY` restarts the running total every year; that `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` makes a moving average; and that `LAG` and `LEAD` look at the previous or next row, not the previous period.',
            reply: 'Very good. Tomorrow, tricky joins: the same table twice and calendars without gaps.',
          },
          excel: {
            text: 'That running totals and moving averages are better done in the spreadsheet.',
            reply: 'Until the report has to update itself every day. Check the debrief.',
            effects: { 0: { text: 'You came away with calculating trends outside the database.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
