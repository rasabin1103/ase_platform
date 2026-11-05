import { m02Rachas } from '../m02-rachas'
import { COMMON_EN, missionEn } from './missionEn'

const WINDOW_FN = { 0: { message: 'This task is solved with window functions: `… OVER (…)`.' } }
const ORDERED = { 0: { message: 'This task is solved with an ordered-set aggregate: `… WITHIN GROUP (ORDER BY …)`.' } }

/** Course 7: Advanced SQL · Mission 2 — Streaks and percentiles. English version of ../m02-rachas.ts. */
export const m02RachasEn = missionEn(m02Rachas, {
  ...COMMON_EN,
  title: 'Streaks and percentiles',
  subtitle: 'Gaps and islands: streaks, inactive periods, median, percentiles and mode.',
  dayLabel: 'Wednesday · month 3',
  verdicts: {
    good: {
      title: 'Every streak, with its start and its end',
      body: 'Marta has her most consistent customers, Carmen the median that doesn\'t lie, Nuria the typical hours, Diego the dormant cards and Laura the rejection streaks. And nobody presented an inflated average as "normal".',
    },
    ok: { title: 'Islands found, halfway there', body: 'You already find streaks and gaps, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Streaks counted by eye', body: 'Several tasks were left undone. Replay the mission with the gaps and islands cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 3 · Streaks and percentiles',
    paragraphs: [
      'Today a new table arrives in the replica: `eventos_app`, what customers do in the app in January and February 2026. And with it, questions about "how many days in a row" and "what is normal".',
      'Streak and gap problems are called "gaps and islands" and there is a window trick for them. Each task is done when the query returns exactly what is asked.',
    ],
    goals: [
      'Find streaks of consecutive days with the date − ROW_NUMBER trick.',
      'Remove repeated days before looking for streaks.',
      'Find inactive periods with LAG.',
      'Find streaks of the same status by subtracting two ROW_NUMBERs.',
      'Calculate the median and percentiles with PERCENTILE_CONT.',
      'Get the most frequent value with MODE.',
    ],
  },
  docs: {
    chuleta_islas: {
      title: 'Cheat sheet: gaps, islands and percentiles',
      updatedLabel: 'Inés Moreno · Data',
      body: `## New table
\`eventos_app\` (app events): id, cliente_id, tipo (\`login\`, \`transferencia\`, \`error\`, \`ajuste\`), ocurrido_en, datos (JSON). January and February 2026.

## Streaks of consecutive days (islands)
\`\`\`
WITH dias AS (SELECT DISTINCT ocurrido_en::date AS dia FROM eventos_app WHERE …),
g AS (SELECT dia, dia - (ROW_NUMBER() OVER (ORDER BY dia))::int AS grupo FROM dias)
SELECT MIN(dia) AS inicio, MAX(dia) AS fin, COUNT(*) AS dias FROM g GROUP BY grupo;
\`\`\`
On consecutive days, the date and the row number go up together: the difference is constant and marks the streak. **First, DISTINCT**: a repeated day breaks the count.

## Gaps
\`LAG(fecha) OVER (PARTITION BY … ORDER BY fecha)\` and \`fecha - anterior\`: the big jumps are the gaps.

## Streaks of the same status
\`ROW_NUMBER() OVER (PARTITION BY x ORDER BY t) - ROW_NUMBER() OVER (PARTITION BY x, estado ORDER BY t)\` is constant within each streak of the same status.

## Ordered-set aggregates
| I want | Use |
|---|---|
| Median | \`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY x)\` |
| 90th percentile | \`PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY x)\` |
| A value that exists | \`PERCENTILE_DISC(0.5) …\` |
| The most frequent | \`MODE() WITHIN GROUP (ORDER BY x)\` |
\`PERCENTILE_CONT\` returns double: \`ROUND(… ::numeric, 2)\`.`,
    },
  },
  sqlLab: {
    starter:
      "-- Customer 7's login days and the group of their streak\nWITH dias AS (\n  SELECT DISTINCT ocurrido_en::date AS dia\n  FROM eventos_app\n  WHERE cliente_id = 7 AND tipo = 'login'\n)\nSELECT dia, dia - (ROW_NUMBER() OVER (ORDER BY dia))::int AS grupo\nFROM dias;",
    retos: {
      rachas_cliente7: {
        title: "Customer 7's streaks",
        description: 'The streaks of consecutive days with a **login** of **customer 7**: `inicio`, `fin` and `dias` of each streak (also the one-day ones).',
        hint: 'Distinct days with a login, `dia - ROW_NUMBER() OVER (ORDER BY dia)` as the group and then `MIN`, `MAX` and `COUNT(*)` per group.',
        requires: WINDOW_FN,
      },
      rachas_largas: {
        title: 'The most consistent customers',
        description: '`cliente_id` and `racha_maxima` (their longest streak of consecutive login days) of the customers whose longest streak is **10 days or more**.',
        hint: 'The same trick with `PARTITION BY cliente_id`; then the length of each streak and, per customer, the longest with `HAVING MAX(n) >= 10`.',
        requires: WINDOW_FN,
      },
      mediana_estado: {
        title: 'Mean, median and 90th percentile per status',
        description: 'Per card payment `estado`: `media` (mean), `mediana` (median) and `p90` (90th percentile) of the amount, all three with 2 decimals.',
        hint: '`ROUND(AVG(importe), 2)`, `ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe)::numeric, 2)` and the same with 0.9, with `GROUP BY estado`.',
        requires: ORDERED,
      },
      hora_tipica: {
        title: 'The typical hour of each category',
        description: 'Per merchant `categoria` (without the one that has none): `hora_tipica`, the hour of the day (0–23) with the **most payments** (all statuses). If they tie, the earliest.',
        hint: '`MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM p.pagado_en))` with `GROUP BY c.categoria`.',
        requires: ORDERED,
      },
      periodos_inactivos: {
        title: 'Cards that went to sleep',
        description: 'The gaps of **more than 120 days** between two consecutive payments of the same card: `tarjeta_id`, `desde` and `hasta` (dates of the two payments) and `dias` between them.',
        hint: '`LAG(pagado_en) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en)` in a step; outside, `pagado_en::date - anterior::date > 120`.',
        requires: WINDOW_FN,
      },
      rachas_rechazo: {
        title: 'Streaks of consecutive rejections',
        description: 'The streaks of **3 or more consecutive rejected payments** of the same card (in `pagado_en` order, breaking ties by `id`): `tarjeta_id`, `inicio`, `fin` (date and time of the first and last rejection) and `rechazos`.',
        hint: '`ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en, id) - ROW_NUMBER() OVER (PARTITION BY tarjeta_id, estado ORDER BY pagado_en, id)` is constant within each streak of the same status. Group by card and that group, only the rejected ones, `HAVING COUNT(*) >= 3`.',
        requires: WINDOW_FN,
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'The consistency prize goes to whoever logs in most, not whoever logs in in a row', explanation: 'Marta rewarded by number of logins, without streaks.', technique: 'Gaps and islands per customer and MAX of the streaks.' },
    'C-CARMEN': { title: 'The "normal payment" limit is set with the mean', explanation: 'The €121.85 mean is inflated by three huge payments; the median is €37.85.', technique: 'PERCENTILE_CONT.' },
    'C-NURIA': { title: 'The reinforcement shift is put at the wrong hour', explanation: "Nuria didn't have the most frequent hour of each category.", technique: 'MODE() WITHIN GROUP.' },
    'C-DIEGO': { title: 'The dormant card alert never goes off', explanation: "Diego didn't have the long gaps to test it.", technique: 'LAG and date difference.' },
    'C-LAURA': { title: 'Nobody sees that card 12 chains rejections', explanation: "Laura didn't have the rejection streaks.", technique: 'Difference of two ROW_NUMBERs.' },
    'C-REPETIDOS': { title: 'The streaks report breaks streaks into pieces', explanation: 'With several events on the same day, the difference is no longer constant.', technique: 'DISTINCT of the days before numbering.' },
    'C-MEDIA': { title: 'The mean is presented as "what a normal customer pays"', explanation: 'With extreme values, the mean represents almost nobody.', technique: 'Median and percentiles.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Wednesday's tasks.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's prize", explanation: 'Streaks of 10 days or more.' },
      1: { label: "Carmen's limit", explanation: 'Median and 90th percentile.' },
      2: { label: "Nuria's shifts", explanation: 'The typical hour of each category.' },
      3: { label: "Diego's alert", explanation: 'Gaps of more than 120 days.' },
      4: { label: "Laura's rejections", explanation: 'Streaks of 3 or more.' },
      5: { label: 'Whole streaks', explanation: 'DISTINCT before numbering.' },
      6: { label: 'What is really normal', explanation: 'Median, not mean.' },
    },
  },
  concepts: {
    gaps_islands: { title: 'Gaps and islands', summary: 'In a sequence without gaps, value − row number is constant: it marks each streak.' },
    distinct_first: { title: 'First, distinct values', summary: 'A repeated value breaks the difference: DISTINCT before numbering.' },
    gaps_lag: { title: 'Gaps with LAG', summary: 'The difference with the previous value finds the jumps.' },
    runs_by_state: { title: 'Streaks of the same status', summary: 'Overall ROW_NUMBER minus ROW_NUMBER per status: constant in each streak.' },
    percentiles: { title: 'Median and percentiles', summary: 'PERCENTILE_CONT(p) WITHIN GROUP (ORDER BY x): interpolates; PERCENTILE_DISC returns a value that exists.' },
    mode_agg: { title: 'MODE', summary: 'The most frequent value; with ties, the first according to the ORDER BY.' },
    mean_vs_median: { title: 'Mean or median', summary: 'With extreme values, the mean drifts; the median describes the typical case.' },
  },
  seniorTips: [
    'Read the gaps and islands cheat sheet in the wiki.',
    "Inés: customer 7's distinct login days, dia - ROW_NUMBER() OVER (ORDER BY dia) as the group, MIN, MAX and COUNT per group.",
    'Marta: the same with PARTITION BY cliente_id, the length of each streak and MAX(n) >= 10 per customer.',
    'Carmen: ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe)::numeric, 2) and 0.9, per status.',
    'Nuria: MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM pagado_en)) per category.',
    'Diego: LAG(pagado_en) per card and pagado_en::date - anterior::date > 120.',
    'Laura: ROW_NUMBER per card minus ROW_NUMBER per card and status, only rejected, HAVING COUNT(*) >= 3.',
    'With Inés: DISTINCT before looking for streaks; and for "normal", the median.',
  ],
  lessons: {
    islands: {
      question: 'How do I find streaks of consecutive days?',
      body: `Number the days in order and subtract the number from the date:

| dia | n | dia − n |
|---|---|---|
| 1 Feb | 1 | 31 Jan |
| 2 Feb | 2 | 31 Jan |
| 3 Feb | 3 | 31 Jan |
| 5 Feb | 4 | 1 Feb |

While the days are consecutive, the difference doesn't change: it is the "group" of the streak. Then \`GROUP BY grupo\` with \`MIN(dia)\`, \`MAX(dia)\` and \`COUNT(*)\`. In PostgreSQL, date − integer gives another date: \`dia - (ROW_NUMBER() OVER (ORDER BY dia))::int\`.`,
    },
    distinct: {
      question: 'Why do repeated days have to be removed?',
      body: `If a day has two events, that day takes two row numbers but the date only moves forward once: the difference changes and the streak splits in two.

First, a step with \`SELECT DISTINCT ocurrido_en::date AS dia\` (and \`cliente_id\` if there are several); then, the trick. Always check with a known case: if a customer logged in 21 days in a row, their streak has to give 21.`,
    },
    gaps: {
      question: 'And the gaps, the periods without activity?',
      body: `With \`LAG\`, compare each row with the previous one of the same group:

\`\`\`
WITH p AS (
  SELECT tarjeta_id, pagado_en,
         LAG(pagado_en) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) AS anterior
  FROM pagos_tarjeta
)
SELECT tarjeta_id, anterior::date, pagado_en::date, pagado_en::date - anterior::date AS dias
FROM p WHERE pagado_en::date - anterior::date > 120;
\`\`\`

Subtracting two \`date\` values gives a number of days.`,
    },
    runs: {
      question: 'And streaks of the same status, like consecutive rejections?',
      body: `Two numberings: one of all the rows and another only of the rows with the same status. Within a streak, both move forward together and their difference is constant:

\`\`\`
ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en, id)
- ROW_NUMBER() OVER (PARTITION BY tarjeta_id, estado ORDER BY pagado_en, id) AS grupo
\`\`\`

Then \`GROUP BY tarjeta_id, estado, grupo\`. Break ties in the order (\`, id\`) so the result doesn't depend on luck.`,
    },
    percentile: {
      question: 'How do I calculate the median?',
      body: `With an ordered-set aggregate:

\`\`\`
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe) AS mediana,
       PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY importe) AS p90
FROM pagos_tarjeta;
\`\`\`

- \`PERCENTILE_CONT\` interpolates between the two central values; it returns double (\`ROUND(…::numeric, 2)\`).
- \`PERCENTILE_DISC\` returns a value that exists in the data.

They work with \`GROUP BY\` like any aggregate.`,
    },
    mode: {
      question: 'And the most frequent value?',
      body: `\`MODE() WITHIN GROUP (ORDER BY x)\` returns the value that repeats the most:

\`\`\`
SELECT c.categoria,
       MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM p.pagado_en)) AS hora_tipica
FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id
GROUP BY c.categoria;
\`\`\`

If there is a tie, the first according to the \`ORDER BY\`: \`ORDER BY x DESC\` would give the highest of the tied ones.`,
    },
    median: {
      question: 'Mean or median?',
      body: `The mean adds everything up and divides: three payments of almost €3,000 out of 271 push it up a lot. The median is the middle value: half pay less and half pay more.

To describe "normal" with skewed data (amounts, response times, balances), median and percentiles. The mean is still useful for totals: mean × count = sum.`,
    },
  },
  quiz: {
    pre: {
      a2pre_islands: { question: 'On consecutive days, what happens to `dia - ROW_NUMBER() OVER (ORDER BY dia)`?', options: ['It goes up one by one', 'It is constant', 'It is zero', 'It is NULL'], explanation: 'Date and number move forward together.' },
      a2pre_distinct: { question: 'A customer has two events on the same day. If you number events and not days…', options: ['Nothing happens', 'The streak splits', 'It gives an error', 'The streak gets longer'], explanation: 'The number moves forward twice and the date once.' },
      a2pre_gaps: { question: 'What does `fecha - LAG(fecha) OVER (ORDER BY fecha)` give on the first row?', options: ['0', 'NULL', 'The date', 'Error'], explanation: 'There is no previous one.' },
      a2pre_pct: { question: 'How is the median calculated in PostgreSQL?', options: ['MEDIAN(x)', 'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY x)', 'AVG(x)', 'MODE(x)'], explanation: 'There is no MEDIAN: it is the 50th percentile.' },
      a2pre_mode: { question: 'What does `MODE() WITHIN GROUP (ORDER BY x)` return?', options: ['The mean', 'The most frequent value', 'The maximum', 'The number of values'], explanation: 'The mode.' },
      a2pre_median: { question: 'Amounts: 10, 12, 14, 3,000. What describes "typical" best?', options: ['The mean (759)', 'The median (13)', 'The maximum', 'The sum'], explanation: 'An extreme value drags the mean.' },
    },
    post: {
      a2post_islands: { question: 'You already have the group of each day. How do you get the start, end and length of each streak?', options: ['ORDER BY grupo', 'GROUP BY grupo with MIN, MAX and COUNT', 'DISTINCT grupo', 'LAG(grupo)'], explanation: 'Each group is a streak.' },
      a2post_distinct: { question: "Diego says customer 7's best streak is 12 days and you have 21. He numbered all the events. Who is right?", options: ['Diego', 'You: you have to number distinct days', 'Both', 'Neither'], explanation: 'Days with more than one event break his count.' },
      a2post_runs: { question: 'To find streaks of consecutive rejections…', options: ['COUNT(*) FILTER', 'ROW_NUMBER per card minus ROW_NUMBER per card and status', 'LAG(estado)', 'MODE()'], explanation: 'The difference is constant in each streak.' },
      a2post_pct: { question: '`ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY importe), 2)` gives an error. Why?', options: ['0.9 is not valid', 'It returns double and ROUND with decimals needs numeric', 'GROUP BY is missing', 'You have to use PERCENTILE_DISC'], explanation: 'Cast first: ::numeric.' },
      a2post_mode: { question: 'Two hours tie as the most frequent. `MODE() WITHIN GROUP (ORDER BY hora)` returns…', options: ['Both', 'The earliest', 'NULL', 'Error'], explanation: 'The first according to the ORDER BY.' },
      a2post_median: { question: 'Only 54 of 271 payments are above the mean. What does that tell you?', options: ['That there are few payments', 'That a few very high amounts inflate the mean', 'That the mean is wrongly calculated', 'Nothing'], explanation: 'With skew, the median describes the typical case better.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: 'Consecutive days: gaps and islands',
      body: "Good morning.\n\n**`eventos_app`** has arrived in the replica: what customers do in the app in January and February (logins, transfers, errors…). Product wants to know how many days **in a row** each customer logs in, and that is a classic **gaps and islands** problem: the streaks are islands of consecutive days separated by gaps.\n\nTo start:\n\n- The streaks of consecutive days with a **login** of **customer 7**: `inicio`, `fin` and `dias` of each streak, also the one-day ones.\n\nHint: on consecutive days, the date and the row number go up together.\n\nInés",
    },
    ines_ok: {
      body: 'Ten streaks, and one of 21 days: from 1 to 21 February without missing one. The date − number difference is constant in each island: that is the whole trick.',
    },
    marta_constancia: {
      body: 'Hi! We want to reward **consistency**, not just whoever logs in most. I want the customers whose longest streak of consecutive login days is **10 days or more**: `cliente_id` and `racha_maxima`.',
    },
    marta_thanks: { body: 'Seven customers, and number 29 with 23 days in a row. That is our number one fan!' },
    carmen_mediana: {
      body: 'Hi. To set what a **normal payment** is I want, per card payment `estado`: the `media` (mean), the `mediana` (median) and the 90th percentile (`p90`) of the amount, with 2 decimals.',
    },
    carmen_thanks: { body: 'A mean of €121.85 and a median of €37.85 for accepted payments. If I had set the limit with the mean… Thanks.' },
    ines_repetidos: {
      subject: '11:00 · Inés: "12 days or 21?"',
      body: "**Inés:** Diego calculated customer 7's streaks like this:\n\n`SELECT ocurrido_en::date AS dia, ocurrido_en::date - (ROW_NUMBER() OVER (ORDER BY ocurrido_en))::int AS grupo FROM eventos_app WHERE cliente_id = 7`\n\nAnd he says their best streak is 12 days, on dates that don't match yours. What happened?",
      choices: {
        distinct: {
          text: "He numbered **events**, not days: the days when the customer also made a transfer have two rows, the number moves forward twice and the date once, so the difference changes and the streak splits. First you have to get the **distinct days** with a login (`SELECT DISTINCT ocurrido_en::date … WHERE tipo = 'login'`) and then number them.",
          reply: 'Exactly. The islands trick only works with values that don\'t repeat. And checking against a case you know (21 days in February) exposes it right away.',
          effects: { 2: { text: 'First distinct values (DISTINCT), then the islands trick.' } },
        },
        dense: {
          text: 'That he should use `RANK()` instead of `ROW_NUMBER()`.',
          reply: 'RANK gives the same number to ties at the same instant, but not to two events on the same day at different times. It still splits streaks.',
          effects: { 0: { text: "Changing the numbering function doesn't remove the repeated days." } },
        },
        both: {
          text: 'That both versions are valid: it depends on how you count.',
          reply: "A streak of days is a streak of days. His gives dates that don't exist as streaks.",
          effects: { 0: { text: 'You accepted a streak split by repeated events.' } },
        },
      },
    },
    nuria_hora: {
      body: 'Hi. To organise the reinforcement shifts I want to know at what **hour** the payments of each category concentrate: per `categoria` (without the one that has none), the `hora_tipica` (0–23) with the most payments, all statuses. If they tie, the earliest.',
    },
    nuria_thanks: { body: 'Eight categories: restaurants at 6 and shopping and travel at 18. Now I know where to put people. Thanks!' },
    diego_dormidas: {
      body: 'Hey. To test the "dormant card" alert I want the **gaps of more than 120 days** between two consecutive payments of the same card: `tarjeta_id`, `desde`, `hasta` (the dates of the two payments) and `dias`.',
    },
    diego_thanks: { body: 'Ten gaps, and card 1 with 234 days without a payment. With this the alert has plenty of cases. Thanks!' },
    laura_rechazos: {
      body: 'Hi. I want to detect cards that chain rejections: the streaks of **3 or more consecutive rejected payments** of the same card (in `pagado_en` order, and by `id` if they tie): `tarjeta_id`, `inicio`, `fin` and `rechazos`.',
    },
    laura_thanks: { body: "Two streaks, both of card 12: one of 3 and one of 5. It's the blocked one, that fits. I'm turning it into a regression test. Thanks!" },
    ines_media: {
      subject: '15:00 · Inés: "The average customer pays €121"',
      body: '**Inés:** Marta is going to put in the product presentation that "a normal card payment is about €121", the mean of the accepted ones. Only 54 of the 271 accepted payments are above that figure. What do you recommend?',
      choices: {
        median: {
          text: "That she shouldn't use the mean for \"normal\": a few huge payments (€3,373, €3,082, €2,791) inflate it, and that's why only 20% are above it. The **median** (€37.85) says what a typical customer pays; and if she wants to give an idea of the range, the 90th percentile.",
          reply: "That's it. With skewed data, median and percentiles. The mean is for totals, not for describing the typical customer.",
          effects: { 3: { text: 'To describe the typical case with extreme values, median and percentiles.' } },
        },
        remove: {
          text: 'That she should remove the three big payments and calculate the mean again.',
          reply: "Those payments exist. Removing data by hand so the mean looks nice is choosing the result. The median doesn't need that trimming.",
          effects: { 0: { text: 'You proposed removing real data instead of using the right measure.' } },
        },
        ok: {
          text: 'That the mean is the mean: it is correctly calculated.',
          reply: 'It is correctly calculated, but it describes almost nobody: 80% pay less.',
          effects: { 0: { text: "You accepted a mean that doesn't represent the typical case." } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Inés',
      body: '**Inés:** Today you looked for streaks and gaps. What are you taking away?',
      choices: {
        lesson: {
          text: 'That streaks come from subtracting the row number from the date, but only with distinct values; that gaps come from LAG; that streaks of a status come from subtracting two numberings; and that for the typical case I use the median and percentiles, and MODE for the most frequent.',
          reply: 'Very good. Tomorrow, totals and subtotals in a single query.',
        },
        loop: {
          text: "That streaks are easier to calculate with a loop in a spreadsheet.",
          reply: 'With forty customers, maybe. With forty thousand, no. Check the debrief.',
          effects: { 0: { text: 'You came away with calculating streaks outside the database.' } },
        },
      },
    },
  },
})
