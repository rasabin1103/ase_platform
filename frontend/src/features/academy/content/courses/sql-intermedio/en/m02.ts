import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m02FechasTextos } from '../m02-fechas-textos'
import { ROLES_EN, missionEn } from './missionEn'

/** Course 6: Intermediate SQL · Mission 2 — Dates and texts. English version of ../m02-fechas-textos.ts. */
export const m02FechasTextosEn = missionEn(
  m02FechasTextos,
  {
    title: 'Dates and texts',
    subtitle: 'DATE_TRUNC, EXTRACT, intervals, TO_CHAR and text functions.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Wednesday · month 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Every date in its place',
        body: "Inés has her monthly series, Marta her rewards, Carmen the anti-fraud review, Nuria her email budget, Diego his late-night payments and Laura her spaces bug. And no report mixes up Februaries.",
      },
      ok: { title: 'Dates almost under control', body: 'You already work with dates and texts, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'February doubled and January out of order', body: 'Several tasks were left undone. Replay the mission with the dates and texts cheat sheet at hand.' },
    },
    briefing: {
      title: 'Month 2 · Dates and texts',
      paragraphs: [
        'The card payments arrive in the replica: merchants and payments from January 2025 to February 2026. Today everything is about when: per month, per day of the week, per hour. And about texts that are not as clean as they look.',
        'The replica is a snapshot of 1 March 2026: when you need "today", use that date.',
      ],
      goals: [
        'Group by month with DATE_TRUNC.',
        'Get the day of the week and the hour with EXTRACT.',
        'Subtract time from a date with INTERVAL.',
        'Filter a specific month with a range, without mixing years.',
        'Use TO_CHAR only to display, never to sort.',
        'Work with texts using SPLIT_PART, TRIM, LOWER and friends.',
      ],
    },
    docs: {
      chuleta_fechas: {
        title: 'Cheat sheet: dates and texts',
        updatedLabel: 'Inés Moreno · Data',
        body: `## New tables
- \`comercios\` (merchants): id, nombre, categoria, ciudad (the online shop has no city).
- \`pagos_tarjeta\` (card payments): id, tarjeta_id, comercio_id, importe, estado (aceptado, rechazado, devuelto), pagado_en (date and time).
- Data from January 2025 to February 2026. "Today" = **1 March 2026**.

## Dates
| I want | Use |
|---|---|
| Group by month | \`DATE_TRUNC('month', pagado_en)\` |
| Day of the week | \`EXTRACT(ISODOW FROM pagado_en)\` → 1 Monday … 7 Sunday |
| Hour | \`EXTRACT(HOUR FROM pagado_en)\` |
| Subtract time | \`DATE '2026-03-01' - INTERVAL '1 year'\` |
| Exact age | \`AGE(fin, inicio)\` |
| A specific month | \`>= '2026-02-01' AND < '2026-03-01'\` |
| Display | \`TO_CHAR(pagado_en, 'DD/MM/YYYY')\` (text: only at the end) |

## Texts
\`UPPER\`, \`LOWER\`, \`INITCAP\`, \`LENGTH\`, \`TRIM\`, \`SPLIT_PART(t, '@', 2)\`, \`REPLACE\`, \`SUBSTRING\`, \`||\` (with NULL it gives NULL).`,
      },
    },
    sqlLab: {
      starter: "-- Accepted payments per month\nSELECT DATE_TRUNC('month', pagado_en) AS mes, COUNT(*) AS pagos\nFROM pagos_tarjeta\nWHERE estado = 'aceptado'\nGROUP BY DATE_TRUNC('month', pagado_en)\nORDER BY mes;",
      retos: {
        pagos_mes: {
          title: 'Accepted payments per month',
          description: "Of the **accepted** payments, one row per month: `mes` (with `DATE_TRUNC('month', pagado_en)`), number of `pagos` and `total` amount.",
          hint: "`SELECT DATE_TRUNC('month', pagado_en) AS mes, COUNT(*) AS pagos, SUM(importe) AS total … WHERE estado = 'aceptado' GROUP BY 1`.",
        },
        antiguedad: {
          title: 'At least one year as a customer',
          description: '`id`, `nombre` and `fecha_alta` of the customers with **at least one year** with us as of **1 March 2026** (signed up on 1/3/2025 or before).',
          hint: "`WHERE fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'`. Don't use CURRENT_DATE.",
          forbid: { 0: { message: 'The replica is a snapshot of 1 March 2026: use that date instead of CURRENT_DATE or NOW().' } },
        },
        finde: {
          title: 'Weekend and more than €200',
          description: '`id`, `importe` and `pagado_en` of the **accepted** payments made on a **Saturday or Sunday** with an amount **greater than €200**.',
          hint: '`EXTRACT(ISODOW FROM pagado_en) IN (6, 7)` (or `EXTRACT(DOW …) IN (0, 6)`), plus the other two conditions with AND.',
        },
        dominios: {
          title: 'Customers per email domain',
          description: '`dominio` (what comes after the @ in the email) and number of `clientes` of each domain.',
          hint: "`SPLIT_PART(email, '@', 2) AS dominio`, `COUNT(*) AS clientes` and `GROUP BY` the domain.",
        },
        madrugada: {
          title: 'Late-night payments',
          description: '`id`, `tarjeta_id`, `importe` and `pagado_en` of the payments (any status) made **between 00:00 and 06:00** (06:00 not included).',
          hint: '`EXTRACT(HOUR FROM pagado_en) < 6`: hours 0 to 5.',
        },
        espacios: {
          title: 'Merchants with extra spaces',
          description: 'The merchants whose name has **spaces at the start or at the end**: `id`, `nombre` (as it is) and `limpio` (the name without those spaces).',
          hint: '`TRIM(nombre) AS limpio` and `WHERE nombre <> TRIM(nombre)`.',
        },
      },
    },
    bugs: {
      'C-MARTA': { title: "The loyalty rewards don't go out", explanation: "Marta didn't get the customers with at least one year.", technique: 'Date minus INTERVAL.' },
      'C-CARMEN': { title: "Anti-fraud doesn't review weekend payments", explanation: 'Carmen was left without the list of large payments on Saturday and Sunday.', technique: 'EXTRACT(ISODOW).' },
      'C-NURIA': { title: 'The most expensive email plan gets signed', explanation: 'Without the count per domain, Nuria signed up for the big plan.', technique: 'SPLIT_PART and GROUP BY.' },
      'C-DIEGO': { title: 'The night job is tested without late-night payments', explanation: "Diego didn't have the payments that fall in the settlement window.", technique: 'EXTRACT(HOUR).' },
      'C-LAURA': { title: 'The merchant search keeps failing', explanation: 'Nobody found the names with extra spaces.', technique: 'TRIM and compare with the original.' },
      'C-FEBRERO': { title: 'The monthly report says February doubled the sales', explanation: 'EXTRACT(MONTH) = 2 added up February 2025 and February 2026.', technique: 'A date range for a specific month.' },
      'C-ORDEN': { title: 'The monthly report comes out in the wrong order', explanation: 'Sorting by TO_CHAR sorts text.', technique: 'Sort by the date; format at the end.' },
    },
    prevention: {
      title: 'At the end of the day',
      intro: "What happened with Wednesday's tasks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Marta's rewards", explanation: 'One year as a customer with INTERVAL.' },
        1: { label: 'Anti-fraud review', explanation: 'Weekend with EXTRACT.' },
        2: { label: 'Email plan', explanation: 'Customers per domain.' },
        3: { label: 'Night job', explanation: 'Payments from 00:00 to 06:00.' },
        4: { label: 'Merchant search', explanation: 'Names with extra spaces.' },
        5: { label: 'February counted right', explanation: 'A date range, without mixing years.' },
        6: { label: 'Report in order', explanation: 'Sort by date, format at the end.' },
      },
    },
    concepts: {
      date_trunc: { title: 'DATE_TRUNC', summary: 'Cuts a date down to the month, day or hour: used to group by periods.' },
      date_extract: { title: 'EXTRACT', summary: 'Gets a number out of a date: year, month, hour or day of the week (ISODOW).' },
      intervals: { title: 'Intervals and AGE', summary: "Date minus INTERVAL '1 year'; AGE gives the exact difference. A fixed \"today\", not CURRENT_DATE." },
      date_ranges: { title: 'A specific month', summary: 'Range >= first day AND < first day of the next month; EXTRACT(MONTH) mixes years.' },
      format_last: { title: 'TO_CHAR only to display', summary: 'TO_CHAR returns text: sort by the date and format at the end.' },
      text_functions: { title: 'Text functions', summary: 'UPPER, LOWER, LENGTH, SPLIT_PART, REPLACE, ||…' },
      trim_clean: { title: 'TRIM and dirty texts', summary: 'Removes spaces at the start and the end; nombre <> TRIM(nombre) finds them.' },
    },
    seniorTips: [
      'Read the dates and texts cheat sheet in the wiki.',
      "Inés: SELECT DATE_TRUNC('month', pagado_en) AS mes, COUNT(*) AS pagos, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY 1.",
      "Marta: WHERE fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'.",
      "Carmen: estado = 'aceptado' AND EXTRACT(ISODOW FROM pagado_en) IN (6, 7) AND importe > 200.",
      "Nuria: SPLIT_PART(email, '@', 2) AS dominio, COUNT(*) AS clientes, GROUP BY 1.",
      'Diego: WHERE EXTRACT(HOUR FROM pagado_en) < 6.',
      'Laura: SELECT id, nombre, TRIM(nombre) AS limpio FROM comercios WHERE nombre <> TRIM(nombre).',
      'With Inés: a specific month with a range; TO_CHAR only at the end.',
    ],
    lessons: {
      trunc: {
        question: 'How do I group by month?',
        body: `\`DATE_TRUNC\` cuts the date down to the unit you say and sets the rest to zero:

\`\`\`
SELECT DATE_TRUNC('month', pagado_en) AS mes,
       COUNT(*) AS pagos,
       SUM(importe) AS total
FROM pagos_tarjeta
WHERE estado = 'aceptado'
GROUP BY DATE_TRUNC('month', pagado_en)
ORDER BY mes;
\`\`\`

\`'2025-03-19 09:35:47'\` → \`'2025-03-01 00:00:00'\`. Units: \`'year'\`, \`'month'\`, \`'week'\`, \`'day'\`, \`'hour'\`. The result is still a date: it sorts correctly.`,
      },
      extract: {
        question: 'How do I get the day of the week or the hour?',
        body: `\`EXTRACT(part FROM date)\` returns a number:

- \`YEAR\`, \`MONTH\`, \`DAY\`, \`HOUR\`, \`MINUTE\`.
- \`ISODOW\`: day of the week from 1 (Monday) to 7 (Sunday). (\`DOW\` goes from 0, Sunday, to 6, Saturday.)

\`\`\`
WHERE EXTRACT(ISODOW FROM pagado_en) IN (6, 7)   -- weekend
WHERE EXTRACT(HOUR FROM pagado_en) < 6           -- from 00:00 to 05:59
\`\`\``,
      },
      intervals: {
        question: 'How do I subtract a year from a date?',
        body: `With an \`INTERVAL\`:

\`\`\`
WHERE fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'
\`\`\`

Others: \`INTERVAL '30 days'\`, \`INTERVAL '2 hours'\`. For the exact age between two dates, \`AGE(fin, inicio)\` (for example \`2 years 3 mons 4 days\`), and \`EXTRACT(YEAR FROM AGE(…))\` gives the full years.

In the replica, "today" is **1 March 2026**: don't use \`CURRENT_DATE\`, which changes every day and would make the result change too.`,
      },
      ranges: {
        question: 'How do I filter a specific month?',
        body: `With a **range**, from the first day included to the first day of the next month not included:

\`\`\`
WHERE pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'
\`\`\`

Careful with \`EXTRACT(MONTH FROM pagado_en) = 2\`: it takes **every February**, of any year. Useful for "what happens in February in general?", not for "February 2026".`,
      },
      format: {
        question: 'And to display the date nicely?',
        body: `\`TO_CHAR(date, format)\` turns it into **text**: \`TO_CHAR(pagado_en, 'DD/MM/YYYY HH24:MI')\`.

Being text, it sorts character by character: \`'01/2026'\` comes before \`'02/2025'\`. Rule: **calculate, group and sort with the date**; use \`TO_CHAR\` only to display, at the end. If you have to sort text, use a format that goes from big to small: \`'YYYY-MM'\`.`,
      },
      text: {
        question: 'Which text functions are there?',
        body: `The most used ones:

- \`UPPER(t)\`, \`LOWER(t)\`: upper and lower case. \`INITCAP(t)\`: first letter of each word.
- \`LENGTH(t)\`: number of characters.
- \`t1 || ' ' || t2\`: concatenate (with NULL, everything is NULL; use \`CONCAT\` or \`COALESCE\`).
- \`SPLIT_PART(t, '@', 2)\`: piece 2 when splitting by \`@\` (the domain of an email).
- \`SUBSTRING(t FROM 1 FOR 3)\`, \`REPLACE(t, 'a', 'b')\`.

To compare ignoring case: \`LOWER(email) = LOWER('Ana@Mail.com')\` or \`ILIKE\`.`,
      },
      trim: {
        question: 'How do I find texts with extra spaces?',
        body: `\`TRIM(t)\` removes the spaces at the start and at the end (\`LTRIM\` and \`RTRIM\`, only one side). To find the ones that have them:

\`\`\`
SELECT id, nombre, TRIM(nombre) AS limpio
FROM comercios
WHERE nombre <> TRIM(nombre);
\`\`\`

Spaces can't be seen on screen, but they make \`nombre = 'Café Central'\` find nothing. A QA looks for them before a customer finds them.`,
      },
    },
    quiz: {
      pre: {
        i2pre_trunc: {
          question: "What does `DATE_TRUNC('month', TIMESTAMP '2025-03-19 09:35')` return?",
          options: ['3', "'2025-03'", "'2025-03-01 00:00:00'", "'2025-03-19'"],
          explanation: 'It cuts to the first instant of the month and is still a date.',
        },
        i2pre_extract: {
          question: 'Which condition keeps the Saturday and Sunday payments?',
          options: ['EXTRACT(ISODOW FROM pagado_en) IN (6, 7)', 'EXTRACT(DAY FROM pagado_en) IN (6, 7)', "pagado_en LIKE '%saturday%'", 'EXTRACT(MONTH FROM pagado_en) > 5'],
          explanation: 'ISODOW: 1 Monday … 7 Sunday. DAY is the day of the month.',
        },
        i2pre_intervals: {
          question: 'Customers who signed up at least one year ago (today is 1/3/2026):',
          options: ["fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'", "fecha_alta >= DATE '2026-03-01' - INTERVAL '1 year'", 'fecha_alta - 1 > 2025', "fecha_alta < '1 year'"],
          explanation: 'Signed up on 1/3/2025 or before.',
        },
        i2pre_ranges: {
          question: 'The data goes from January 2025 to February 2026. What does `EXTRACT(MONTH FROM pagado_en) = 2` take?',
          options: ['February 2026', 'February 2025', 'Both Februaries', 'None'],
          explanation: 'The month without the year matches in both.',
        },
        i2pre_text: {
          question: "What does `SPLIT_PART('ana.garcia@mail.com', '@', 2)` return?",
          options: ['ana.garcia', 'mail.com', '@mail.com', '2'],
          explanation: 'The second piece when splitting by the @.',
        },
        i2pre_trim: {
          question: "A merchant is called `' Café Central'` (with a space in front). Does `WHERE nombre = 'Café Central'` find it?",
          options: ['Yes', 'No', 'Only with ILIKE', 'It depends on the index'],
          explanation: 'The space counts. TRIM(nombre) = … would find it.',
        },
      },
      post: {
        i2post_trunc: {
          question: 'For a report of payments per month, what do you group by?',
          options: ['By EXTRACT(MONTH …)', "By DATE_TRUNC('month', pagado_en)", 'By pagado_en', "By TO_CHAR(pagado_en, 'Month')"],
          explanation: 'One group for each month of each year, and it sorts correctly.',
        },
        i2post_extract: {
          question: 'Payments between 00:00 and 06:00:',
          options: ['EXTRACT(HOUR FROM pagado_en) < 6', 'EXTRACT(HOUR FROM pagado_en) <= 6', "pagado_en < '06:00'", 'EXTRACT(MINUTE FROM pagado_en) < 360'],
          explanation: 'Hours 0 to 5; at 06:00 the window is already over.',
        },
        i2post_intervals: {
          question: "Why not use CURRENT_DATE in today's tasks?",
          options: ["It doesn't exist in PostgreSQL", 'It changes every day and the replica is a snapshot of 1/3/2026', 'It is slower', 'It only works with timestamps'],
          explanation: 'The result would depend on the day it runs.',
        },
        i2post_ranges: {
          question: 'The best filter for "payments of February 2026":',
          options: ["pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'", "pagado_en BETWEEN '2026-02-01' AND '2026-02-28'", 'EXTRACT(MONTH FROM pagado_en) = 2', "pagado_en::text LIKE '2026-02%'"],
          explanation: 'BETWEEN loses the 28th after 00:00; EXTRACT mixes years; LIKE turns it into text.',
        },
        i2post_format: {
          question: "A report sorts by `TO_CHAR(pagado_en, 'MM/YYYY')`. What happens?",
          options: ['It comes out in order', 'It sorts as text: 01/2025, 01/2026, 02/2025…', 'It gives an error', 'It sorts by year'],
          explanation: 'Sort by the date and format at the end.',
        },
        i2post_text: {
          question: "What does `'Ana' || ' ' || NULL` return?",
          options: ["'Ana '", "'Ana'", 'NULL', "'Ana NULL'"],
          explanation: 'With ||, a NULL makes everything NULL. CONCAT ignores it.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'The card payments have arrived',
        body: "Good morning.\n\nFrom today the replica has two new tables: **`comercios`** (merchants: name, category and city) and **`pagos_tarjeta`** (card payments: card, merchant, amount, status and date and time of the payment), from January 2025 to February 2026. Look at the explorer before you start.\n\nAlmost all of today's questions are about dates: per month, per day of the week, per hour. And a few about dirty texts.\n\nTo start:\n\n- Of the **accepted** payments, one row per **month**: the `mes` (with `DATE_TRUNC('month', pagado_en)`), the number of `pagos` and the `total` amount.\n\nAnd one thing: the replica is a snapshot of **1 March 2026**. When you need \"today\", use that date, not `CURRENT_DATE`.\n\nInés",
      },
      ines_ok: {
        body: "Fourteen months, one per row. DATE_TRUNC \"rounds\" the date down to the first day of the month and so you can group by it. May and February come out high: there's some huge payment, we'll look at it another day.",
      },
      marta_antiguedad: {
        body: 'Hi! We are going to reward the customers with **at least one year with us** (as of 1 March 2026). I need `id`, `nombre` and `fecha_alta`.',
      },
      marta_thanks: { body: 'Twenty-four customers with a reward. Thanks!' },
      carmen_finde: {
        body: 'Hi. The anti-fraud system wants to review the **accepted** payments made at the **weekend** (Saturday or Sunday) of **more than €200**: `id`, `importe` and `pagado_en`.',
      },
      carmen_thanks: { body: "Eleven payments to review. Thanks: we're going to ask for this every Monday." },
      ines_febrero: {
        subject: '11:00 · Inés: "Was February double?"',
        body: "**Inés:** Marta counted the February payments for her monthly report:\n\n`SELECT COUNT(*) FROM pagos_tarjeta WHERE EXTRACT(MONTH FROM pagado_en) = 2;`\n\nShe gets **41**, double any other month. Was it a spectacular February?",
        choices: {
          range: {
            text: "`EXTRACT(MONTH …) = 2` takes **every February**: 2025 and 2026. For a specific month, a range: `pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'` (or `DATE_TRUNC('month', pagado_en) = '2026-02-01'`). With the range you get 20.",
            reply: 'Exactly. The month without the year is a different question ("what happens in February in general?"). For a specific month, a date range: it is also what makes the best use of indexes.',
            effects: { 2: { text: 'For a specific month, a date range; EXTRACT(MONTH) mixes years.' } },
          },
          spike: {
            text: 'Yes: there must have been a campaign. She should celebrate.',
            reply: "Look at the same count per year and you'll see half of them are from 2025. Before celebrating a strange figure, check it.",
            effects: { 0: { text: 'You accepted a figure that was double the others.' } },
          },
          like: {
            text: "That she should turn the date into text and search `LIKE '%-02-%'`.",
            reply: 'It would still take both Februaries, and turning dates into text to filter is slow and fragile. A date range.',
            effects: { 0: { text: "Filtering dates as text doesn't fix the problem and adds others." } },
          },
        },
      },
      nuria_dominios: {
        body: 'Hi. We are going to send a notice by email and the provider charges us per email **domain**. How many customers are there of each domain? Columns `dominio` (what comes after the @) and `clientes`.',
      },
      nuria_thanks: { body: 'Only two domains: I save myself the big plan. Thanks!' },
      diego_madrugada: {
        body: 'Hey. The nightly settlement job runs **between 00:00 and 06:00** and we want to see which payments get caught in the middle: `id`, `tarjeta_id`, `importe` and `pagado_en` of the payments made in that window (any status).',
      },
      diego_thanks: { body: "Thirteen late-night payments. I'll use them to test the night job. Thanks!" },
      laura_espacios: {
        body: 'Hi. A merchant search test fails because some names have **extra spaces** at the start or at the end. I want those merchants: `id`, `nombre` (as it is) and `limpio` (the name without those spaces).',
      },
      laura_thanks: { body: "Two merchants with invisible spaces. I'm opening a bug to clean them on save. Thanks!" },
      ines_orden_texto: {
        subject: '15:00 · Inés: "The report starts with January 2026"',
        body: "**Inés:** Marta made a nice monthly report:\n\n`SELECT TO_CHAR(pagado_en, 'MM/YYYY') AS mes, COUNT(*) FROM pagos_tarjeta GROUP BY 1 ORDER BY 1;`\n\nAnd it comes out \"01/2025, 01/2026, 02/2025, 02/2026, 03/2025…\". What happened?",
        choices: {
          format_last: {
            text: "`TO_CHAR` returns **text**, and text is sorted character by character. You have to group and sort by the **date** (`DATE_TRUNC('month', pagado_en)`) and use `TO_CHAR` only to display it, at the end. Or use a format that sorts well as text, like `YYYY-MM`.",
            reply: "That's it: calculate and sort with dates, format at the end. A date turned into text no longer behaves like a date.",
            effects: { 2: { text: 'Sort by the date; TO_CHAR only to display.' } },
          },
          desc: {
            text: 'That she should sort with `ORDER BY 1 DESC`.',
            reply: 'It would come out the other way round, but just as out of order: it still sorts text.',
            effects: { 0: { text: "Changing the direction doesn't fix a text sort." } },
          },
          excel: {
            text: 'That she should sort it by hand in the spreadsheet.',
            reply: 'She would have to do it again every month. Better for the query to return it already in order.',
            effects: { 0: { text: "Fixing it by hand every month doesn't scale." } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you worked with dates and texts. What are you taking away?',
        choices: {
          lesson: {
            text: 'That `DATE_TRUNC` groups by month, `EXTRACT` gets the day of the week or the hour, intervals subtract time from a date, a specific month is filtered with a range, `TO_CHAR` is only for display, and texts are cleaned with `TRIM`, `LOWER` and friends.',
            reply: 'Very good. Tomorrow: putting together results from several queries.',
          },
          text: {
            text: 'That the easiest thing is to turn dates into text and work with that.',
            reply: "That's exactly what put Marta's report out of order. Check the debrief.",
            effects: { 0: { text: 'You came away with treating dates as text.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
