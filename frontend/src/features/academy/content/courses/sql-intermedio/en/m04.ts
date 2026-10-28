import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m04Informes } from '../m04-informes'
import { ROLES_EN, missionEn } from './missionEn'

/** Course 6: Intermediate SQL · Mission 4 — Reports in one query. English version of ../m04-informes.ts. */
export const m04InformesEn = missionEn(
  m04Informes,
  {
    title: 'Reports in one query',
    subtitle: 'FILTER, CASE inside aggregates, columns per status or per year, and percentages.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Friday · month 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Reports ready to present',
        body: 'Marta has her table by category, Carmen the rejection rate per card type, Nuria her summary per channel, Diego the comparison between years and Laura her row of indicators. And every percentage with its decimals.',
      },
      ok: { title: 'Reports almost ready', body: 'You already put counts in columns, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'One query per number', body: 'Several tasks were left undone. Replay the mission with the reports cheat sheet at hand.' },
    },
    briefing: {
      title: 'Month 2 · Reports in one query',
      paragraphs: [
        'Friday, end of the week: everyone wants their report. Tables with the statuses in columns, percentages, comparisons between years and a row of indicators.',
        'Each task is done when the query returns exactly the rows and columns asked for, with the column names given.',
      ],
      goals: [
        'Count only some rows with COUNT(*) FILTER (WHERE …).',
        'Do the same with SUM or COUNT and a CASE inside.',
        'Turn row values into columns (pivot).',
        'Calculate percentages without losing decimals.',
        'Summarise a table in a row of indicators.',
      ],
    },
    docs: {
      chuleta_informes: {
        title: 'Cheat sheet: reports in one query',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Counting only some rows
| Form | Example |
|---|---|
| FILTER (PostgreSQL) | \`COUNT(*) FILTER (WHERE estado = 'rechazado')\` |
| SUM with CASE | \`SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END)\` |
| COUNT with CASE | \`COUNT(CASE WHEN estado = 'rechazado' THEN 1 END)\` (no ELSE!) |

## Columns per value (pivot)
\`SUM(importe) FILTER (WHERE pagado_en < '2026-01-01') AS total_2025\`, one per column. With no rows, NULL: \`COALESCE(…, 0)\`.

## Percentages
- Over the total: \`ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM t), 1)\`.
- Over the group: \`ROUND(100.0 * COUNT(*) FILTER (WHERE …) / COUNT(*), 1)\`.
- **100.0**, not 100: integer divided by integer gives an integer.

## A row of indicators
Aggregates without GROUP BY.`,
      },
    },
    sqlLab: {
      starter: "-- Several counts in columns\nSELECT COUNT(*) AS pagos,\n       COUNT(*) FILTER (WHERE estado = 'rechazado') AS rechazados\nFROM pagos_tarjeta;",
      retos: {
        estados_pct: {
          title: 'Payments per status and percentage',
          description: 'For each payment `estado`: number of `pagos` and `porcentaje` over the total of payments, rounded to **1 decimal**.',
          hint: '`ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS porcentaje`, with `GROUP BY estado`.',
        },
        pivot_categoria: {
          title: 'Statuses in columns per category',
          description: "One row per merchant `categoria` (`'sin categoría'` for the one that has none) with the number of payments `aceptados`, `rechazados` and `devueltos`.",
          hint: "`COALESCE(c.categoria, 'sin categoría') AS categoria` and one `COUNT(*) FILTER (WHERE p.estado = …)` per column; group by the same COALESCE expression.",
        },
        rechazo_tipo: {
          title: 'Rejections per card type',
          description: 'Per card `tipo`: `pagos`, `rechazados` and `pct_rechazo` (rejected over the payments of that type, in %, with 1 decimal).',
          hint: "`pagos_tarjeta JOIN tarjetas`, `GROUP BY t.tipo`; `ROUND(100.0 * COUNT(*) FILTER (WHERE p.estado = 'rechazado') / COUNT(*), 1)`.",
        },
        canales: {
          title: 'Tickets per channel',
          description: 'Per `canal`: `total` of tickets, `abiertas` (open: no `cerrada_en`) and `cerradas` (closed).',
          hint: '`COUNT(*) AS total`, `COUNT(*) FILTER (WHERE cerrada_en IS NULL) AS abiertas` and `COUNT(cerrada_en) AS cerradas`.',
        },
        anios_categoria: {
          title: '2025 and 2026 in columns',
          description: 'Per `categoria` (without the one that has no category): amount of **accepted** payments in 2025 (`total_2025`) and in 2026 (`total_2026`).',
          hint: "`SUM(p.importe) FILTER (WHERE p.pagado_en < '2026-01-01') AS total_2025` and another with `>= '2026-01-01'`; accepted and non-null category in the WHERE.",
        },
        kpis: {
          title: 'A row of indicators',
          description: 'A single row with the `total` of customers, `con_segmento` (with a segment), `sin_segmento` (without one) and `premium`.',
          hint: "No GROUP BY: `COUNT(*)`, `COUNT(segmento)`, `COUNT(*) FILTER (WHERE segmento IS NULL)` and `COUNT(*) FILTER (WHERE segmento = 'premium')`.",
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'The product meeting starts without the table by category', explanation: "Marta didn't get the statuses in columns.", technique: 'COUNT(*) FILTER per column.' },
      'C-CARMEN': { title: "The risk report doesn't tell debit from credit", explanation: 'Carmen was left without the rejection percentage per card type.', technique: 'Percentage over the group.' },
      'C-NURIA': { title: "Customer support doesn't know which channel leaves more cases open", explanation: "Nuria didn't have the summary per channel.", technique: 'FILTER and COUNT(column).' },
      'C-DIEGO': { title: 'The comparison between years is done by hand', explanation: "Diego didn't get 2025 and 2026 in columns.", technique: 'SUM … FILTER per year.' },
      'C-LAURA': { title: 'The data quality dashboard comes out empty', explanation: "Laura didn't have her row of indicators.", technique: 'Aggregates without GROUP BY.' },
      'C-DIVISION': { title: "The report's percentages come out truncated", explanation: 'The integer division threw away the decimals: the 2% of refunds came out as 1%.', technique: '100.0 before dividing.' },
      'C-COUNTCASE': { title: 'A report says 100% of the payments are rejected', explanation: 'COUNT(CASE … ELSE 0 END) counted every row.', technique: 'COUNT without ELSE, SUM with ELSE 0, or FILTER.' },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with Friday's reports.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Marta's table", explanation: 'Statuses in columns.' },
        1: { label: 'Risk report', explanation: 'Rejections per card type.' },
        2: { label: "Nuria's summary", explanation: 'Open and closed per channel.' },
        3: { label: "Diego's comparison", explanation: 'Two years in columns.' },
        4: { label: "Laura's dashboard", explanation: 'A row of indicators.' },
        5: { label: 'Percentages with decimals', explanation: '100.0 before dividing.' },
        6: { label: 'Counts done right', explanation: 'COUNT with CASE, without ELSE.' },
      },
    },
    concepts: {
      filter_clause: { title: 'FILTER', summary: 'An aggregate that only sees the rows that meet its condition.' },
      case_aggregate: { title: 'CASE inside an aggregate', summary: 'SUM(CASE … THEN 1 ELSE 0 END) or COUNT(CASE … THEN 1 END), without ELSE.' },
      pivot: { title: 'Values in columns', summary: 'An aggregate with a condition per column: one column per status, year or channel.' },
      percentages: { title: 'Percentages', summary: 'Part over total (of the group or of everything), times 100.0, and ROUND at the end.' },
      integer_division: { title: 'Integer division', summary: 'Integer divided by integer gives an integer: a decimal before dividing.' },
      kpi_row: { title: 'Row of indicators', summary: 'Aggregates without GROUP BY: the whole table summarised in one row.' },
    },
    seniorTips: [
      'Read the reports cheat sheet in the wiki.',
      'Inés: estado, COUNT(*) AS pagos, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS porcentaje, GROUP BY estado.',
      "Marta: COALESCE(c.categoria, 'sin categoría') and one COUNT(*) FILTER (WHERE p.estado = …) per column.",
      "Carmen: GROUP BY t.tipo; ROUND(100.0 * COUNT(*) FILTER (WHERE p.estado = 'rechazado') / COUNT(*), 1) AS pct_rechazo.",
      'Nuria: COUNT(*) AS total, COUNT(*) FILTER (WHERE cerrada_en IS NULL) AS abiertas, COUNT(cerrada_en) AS cerradas.',
      "Diego: SUM(p.importe) FILTER (WHERE p.pagado_en < '2026-01-01') AS total_2025 and another one for 2026.",
      "Laura: COUNT(*), COUNT(segmento), COUNT(*) FILTER (WHERE segmento IS NULL), COUNT(*) FILTER (WHERE segmento = 'premium').",
      'With Inés: 100.0 before dividing; COUNT with CASE, without ELSE.',
    ],
    lessons: {
      filter: {
        question: 'How do I put several counts in columns?',
        body: `With \`FILTER\`: each aggregate only counts the rows that meet its condition.

\`\`\`
SELECT COALESCE(c.categoria, 'sin categoría') AS categoria,
       COUNT(*) FILTER (WHERE p.estado = 'aceptado')  AS aceptados,
       COUNT(*) FILTER (WHERE p.estado = 'rechazado') AS rechazados,
       COUNT(*) FILTER (WHERE p.estado = 'devuelto')  AS devueltos
FROM pagos_tarjeta p
JOIN comercios c ON c.id = p.comercio_id
GROUP BY COALESCE(c.categoria, 'sin categoría');
\`\`\`

It works with any aggregate: \`SUM(importe) FILTER (WHERE …)\`, \`AVG(…) FILTER (…)\`.`,
      },
      case: {
        question: 'And without FILTER?',
        body: `\`FILTER\` is PostgreSQL's. The form that works in any database is putting a \`CASE\` inside the aggregate:

\`\`\`
SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END)   -- adds up ones
COUNT(CASE WHEN estado = 'rechazado' THEN 1 END)         -- counts non-nulls
\`\`\`

Careful: \`COUNT(CASE … THEN 1 ELSE 0 END)\` counts **every** row, because 0 is not NULL.`,
      },
      pivot: {
        question: 'What is a pivot table in SQL?',
        body: `Turning row values into **columns** (*pivot*): one column per year, per status or per channel.

\`\`\`
SELECT c.categoria,
       SUM(p.importe) FILTER (WHERE p.pagado_en <  '2026-01-01') AS total_2025,
       SUM(p.importe) FILTER (WHERE p.pagado_en >= '2026-01-01') AS total_2026
FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id
WHERE p.estado = 'aceptado' AND c.categoria IS NOT NULL
GROUP BY c.categoria;
\`\`\`

The columns are written by hand: if 2027 shows up tomorrow, you have to add another one. A \`SUM … FILTER\` with no rows gives NULL: \`COALESCE(…, 0)\` if you want a zero.`,
      },
      pct: {
        question: 'How do I calculate a percentage?',
        body: `Part over total, times 100, with a decimal **before dividing**:

\`\`\`
SELECT estado,
       COUNT(*) AS pagos,
       ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS porcentaje
FROM pagos_tarjeta
GROUP BY estado;
\`\`\`

- Over the total: the total in a subquery.
- Over the group: \`100.0 * COUNT(*) FILTER (WHERE …) / COUNT(*)\`.
- When rounding, the sum may give 99.9 or 100.1: that's normal.`,
      },
      int_div: {
        question: "Why doesn't my percentage have decimals?",
        body: `Because in PostgreSQL **integer divided by integer gives an integer** (the decimals are thrown away): \`2900 / 306\` = \`9\`, \`7 / 2\` = \`3\`.

\`COUNT(*)\` is an integer and so is \`100\`. Solutions:

- \`100.0 * COUNT(*) / total\` (100.0 is already a decimal);
- \`COUNT(*)::numeric / total\`.

And the \`ROUND\` always at the end: it doesn't recover what the division has already lost.`,
      },
      kpis: {
        question: 'Can I get several figures in one row?',
        body: `Yes: without \`GROUP BY\`, all the aggregates summarise the whole table in **one row**:

\`\`\`
SELECT COUNT(*) AS total,
       COUNT(segmento) AS con_segmento,
       COUNT(*) FILTER (WHERE segmento IS NULL) AS sin_segmento,
       COUNT(*) FILTER (WHERE segmento = 'premium') AS premium
FROM clientes;
\`\`\`

It is the typical query of an indicators dashboard: one row, many columns.`,
      },
    },
    quiz: {
      pre: {
        i4pre_filter: {
          question: "What does `COUNT(*) FILTER (WHERE estado = 'rechazado')` count?",
          options: ['Every row', 'Only the rejected rows', 'The distinct statuses', 'It gives an error'],
          explanation: 'The aggregate only sees the rows that meet the FILTER.',
        },
        i4pre_case: {
          question: "What does `SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END)` give?",
          options: ['The number of rejected payments', 'The total of rows', 'The rejected amount', 'NULL'],
          explanation: 'It adds a 1 for each rejected one and 0 for the rest.',
        },
        i4pre_pivot: {
          question: 'You want one column per year with the amount of each year. How?',
          options: ['GROUP BY year', 'One SUM with FILTER per year', 'UNION of two queries', 'ORDER BY year'],
          explanation: 'Each column is an aggregate with its condition.',
        },
        i4pre_pct: {
          question: '29 of 306 payments are rejected. What percentage is it, with 1 decimal?',
          options: ['9.0%', '9.5%', '29.0%', '0.1%'],
          explanation: '100 × 29 / 306 = 9.48 → 9.5.',
        },
        i4pre_int: {
          question: 'What does `SELECT 7 / 2` return in PostgreSQL?',
          options: ['3.5', '3', '4', 'Error'],
          explanation: 'Integer divided by integer gives an integer.',
        },
        i4pre_kpi: {
          question: '`SELECT COUNT(*), COUNT(segmento) FROM clientes` (without GROUP BY) returns…',
          options: ['One row per segment', 'A single row with two numbers', 'One row per customer', 'Error'],
          explanation: 'Without GROUP BY, the aggregates summarise the whole table.',
        },
      },
      post: {
        i4post_filter: {
          question: 'Which aggregates does FILTER work with?',
          options: ['Only COUNT', 'Any aggregate: COUNT, SUM, AVG…', 'Only SUM', 'Only with GROUP BY'],
          explanation: 'SUM(importe) FILTER (WHERE …) works too.',
        },
        i4post_case: {
          question: "What does `COUNT(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END)` give?",
          options: ['The number of rejected payments', 'The total of rows of the group', '0', 'NULL'],
          explanation: 'The 0 is not NULL: COUNT counts it. Without ELSE, or with SUM.',
        },
        i4post_pivot: {
          question: 'A category has no payments in 2026. What does its `SUM(importe) FILTER (WHERE … 2026)` give?',
          options: ['0', 'NULL', 'Error', 'The 2025 total'],
          explanation: 'SUM of no rows is NULL: COALESCE(…, 0) if you want a zero.',
        },
        i4post_pct: {
          question: '% of rejected payments of each card type, over the payments of that type:',
          options: [
            "100.0 * COUNT(*) FILTER (WHERE estado = 'rechazado') / COUNT(*) with GROUP BY tipo",
            "COUNT(*) FILTER (WHERE estado = 'rechazado') / (SELECT COUNT(*) FROM pagos_tarjeta)",
            'AVG(estado)',
            "100 * COUNT(*) / COUNT(*) FILTER (WHERE estado = 'rechazado')",
          ],
          explanation: 'Part of the group over the total of the group, with a decimal.',
        },
        i4post_int: {
          question: '`ROUND(100 * 29 / 306, 1)` gives 9.0. How do you fix it?',
          options: ['ROUND(…, 3)', '100.0 * 29 / 306', 'CEIL(…)', "It can't be fixed"],
          explanation: 'The decimal has to be there before the division.',
        },
        i4post_kpi: {
          question: 'In the row of indicators, what does `COUNT(segmento)` count?',
          options: ['All the customers', 'The customers with a segment (not null)', 'The distinct segments', 'The customers without a segment'],
          explanation: 'COUNT(column) ignores NULLs.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'The whole report in one query',
        body: "Good morning, last day of the week.\n\nUntil now, to count accepted and rejected payments you ran two queries, or a `GROUP BY estado` with one row per status. Today you will put several counts **in columns**, in a single query: `COUNT(*) FILTER (WHERE …)` or `SUM(CASE WHEN … THEN 1 ELSE 0 END)`. And percentages.\n\nTo start:\n\n- For each card payment `estado`: number of `pagos` and `porcentaje` over the total of payments, with **1 decimal**.\n\nInés",
      },
      ines_ok: {
        body: "88.6% accepted, 9.5% rejected and 2.0% refunded. They add up to 100.1 because of the rounding: that's normal, mention it if you present it.",
      },
      marta_pivot: {
        body: "Hi! I want a table for the product meeting: one row per merchant **category** and, in columns, how many payments it has `aceptados`, `rechazados` and `devueltos` (accepted, rejected and refunded). The merchants with no category, as **'sin categoría'**. Columns: `categoria`, `aceptados`, `rechazados`, `devueltos`.",
      },
      marta_thanks: { body: 'Nine rows and it reads at a glance: restaurants and health are the ones that reject the most. Thanks!' },
      carmen_rechazo: {
        body: 'Hi. For the risk report: per **card type** (debit and credit), the number of `pagos`, how many `rechazados` and the `pct_rechazo` (percentage of rejected over the payments of that type, with 1 decimal).',
      },
      carmen_thanks: { body: 'Credit cards never get rejected and debit cards almost 10%. That goes straight to the risk meeting. Thanks.' },
      ines_division: {
        subject: '11:00 · Inés: "A round 9%?"',
        body: "**Inés:** Diego calculated the percentage of rejected payments like this:\n\n`SELECT 100 * COUNT(*) FILTER (WHERE estado = 'rechazado') / COUNT(*) FROM pagos_tarjeta;`\n\nHe gets **9**, with no decimals, and `ROUND(…, 1)` gives him 9.0. Your query gives 9.5. What's going on?",
        choices: {
          decimal: {
            text: "That they are all **integers** (`100` and the `COUNT`s), and integer division **throws away the decimals**: 2,900 / 306 = 9. You have to bring in a decimal before dividing: `100.0 * …` or `COUNT(*)::numeric`. The ROUND comes too late: it rounds a 9 that has already lost the .5.",
            reply: 'Exactly. In PostgreSQL, integer divided by integer is an integer. A 100.0 at the start and you are done.',
            effects: { 2: { text: 'Integer divided by integer gives an integer: 100.0 before dividing.' } },
          },
          round: {
            text: 'That he should put more decimals in the `ROUND`.',
            reply: 'With ROUND(…, 3) he would get 9.000. The decimals were lost in the division, before the ROUND.',
            effects: { 0: { text: "The ROUND doesn't recover decimals lost in an integer division." } },
          },
          fine: {
            text: 'That a round 9% is fine for a report.',
            reply: 'With small percentages the error is very noticeable: the 2% of refunds would come out as 1%. Half.',
            effects: { 0: { text: 'You accepted truncated percentages.' } },
          },
        },
      },
      nuria_canales: {
        body: 'Hi. For the customer support meeting: for each `canal`, the `total` of tickets, how many are still `abiertas` (open, with no closing date) and how many are `cerradas` (closed).',
      },
      nuria_thanks: { body: 'Ten per channel and chat is the one that leaves the fewest open. Thanks!' },
      diego_anios: {
        body: 'Hey. I want to compare years: per merchant **category** (without the one that has none), the amount of **accepted** payments in 2025 and in 2026, in two columns: `categoria`, `total_2025` and `total_2026`.',
      },
      diego_thanks: { body: 'Eight categories and both years side by side. Travel moves the most by far. Thanks!' },
      laura_kpis: {
        body: 'Hi. For the data quality dashboard I want **a single row** with: `total` of customers, `con_segmento`, `sin_segmento` and `premium`.',
      },
      laura_thanks: { body: "Forty customers, two without a segment. One row, four numbers: that's how I like a dashboard. Thanks!" },
      ines_count_case: {
        subject: '15:00 · Inés: "Every category rejects everything"',
        body: "**Inés:** Marta tried her table without FILTER:\n\n`SELECT categoria, COUNT(CASE WHEN p.estado = 'rechazado' THEN 1 ELSE 0 END) AS rechazados FROM …`\n\nAnd she gets that the rejected payments of each category are **all** its payments. What is wrong?",
        choices: {
          count_case: {
            text: '`COUNT` counts everything that **is not NULL**, and the `0` of the `ELSE` is not NULL: it counts every row. Either you remove the `ELSE` (without ELSE, the CASE gives NULL and does not count), or you use `SUM(CASE … THEN 1 ELSE 0 END)`, or directly `COUNT(*) FILTER (WHERE …)`.',
            reply: "That's it. COUNT with CASE: without ELSE. SUM with CASE: with ELSE 0. And if you're in PostgreSQL, FILTER, which leaves no room for doubt.",
            effects: { 3: { text: 'COUNT counts what is not NULL: an ELSE 0 counts everything.' } },
          },
          distinct: {
            text: 'That she should use `COUNT(DISTINCT CASE …)`.',
            reply: 'She would get 2 in every category: the two distinct values, 0 and 1. Even worse.',
            effects: { 0: { text: 'COUNT(DISTINCT) counts distinct values, not rows that meet a condition.' } },
          },
          group: {
            text: 'That she should also group by status.',
            reply: 'That way she would be back to one row per status, which is exactly what she wanted to avoid to put the statuses in columns.',
            effects: { 0: { text: 'Grouping by status undoes the table in columns.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the week with Inés',
        body: '**Inés:** Week done: subqueries, WITH, dates, sets and today reports. What are you taking away from today?',
        choices: {
          lesson: {
            text: 'That with `COUNT(*) FILTER (WHERE …)` or `SUM(CASE … ELSE 0 END)` I put several counts in columns in a single query; that a percentage needs a decimal before dividing; and that `COUNT` with `CASE` goes without `ELSE`.',
            reply: 'Very good. Next week: rankings with window functions.',
          },
          several: {
            text: "That it's clearer to run one query per column and put them together in the spreadsheet.",
            reply: 'And every month, six queries and a copy-paste. Check the debrief.',
            effects: { 0: { text: 'You came away with one query per column.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
