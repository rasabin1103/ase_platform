import { m01Ventanas } from '../m01-ventanas'
import { COMMON_EN, missionEn } from './missionEn'

const WINDOW_FN = { message: 'This task is solved with a window function: `… OVER (…)`.' }
const NAMED = { message: 'Define the window only once with `WINDOW w AS (…)` and use it with `OVER w`.' }

/** Course 7: Advanced SQL · Mission 1 — Windows in depth. English version of ../m01-ventanas.ts. */
export const m01VentanasEn = missionEn(m01Ventanas, {
  ...COMMON_EN,
  title: 'Windows in depth',
  subtitle: 'ROWS and RANGE frames, first, last and nth, distribution and named windows.',
  dayLabel: 'Tuesday · month 3',
  verdicts: {
    good: {
      title: 'Every window with its frame',
      body: "Marta has her real seven-day sum, Carmen the second highest payments, Nuria her percentiles, Diego his report without repeating the window and Laura her centered average. And no \"last\" got stuck on the current row.",
    },
    ok: { title: 'Windows with a crooked frame or two', body: 'You already handle frames, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Windows with the default frame', body: 'Several tasks were left undone. Replay the mission with the frames cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 3 · Windows in depth',
    paragraphs: [
      'Last month you used windows for rankings and running totals. Today it is about what decides which rows each window sees: the frame.',
      'Each task is done when your query, with window functions, returns exactly the rows and columns asked for.',
    ],
    goals: [
      'Get the first and last value of each group with FIRST_VALUE and LAST_VALUE.',
      'Understand the default frame and when to change it.',
      'Tell ROWS (rows) from RANGE (values, such as days).',
      'Get the nth value with NTH_VALUE.',
      'Measure where each row sits in the distribution with CUME_DIST.',
      'Define a window once with WINDOW and use it several times.',
    ],
  },
  docs: {
    chuleta_marcos: {
      title: 'Cheat sheet: window frames',
      updatedLabel: 'Inés Moreno · Data',
      body: `## Full shape
\`function() OVER (PARTITION BY … ORDER BY … frame)\`

## The frame
| Frame | Rows each row sees |
|---|---|
| (default, with ORDER BY) | \`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`: from the start up to it and its ties |
| \`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\` | Itself and the 2 previous rows |
| \`ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING\` | The previous one, itself and the next one |
| \`RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW\` | The ones in the previous 6 days (by value, even if days are missing) |
| \`ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING\` | Every row of the group |

## Values
- \`FIRST_VALUE(x)\`, \`LAST_VALUE(x)\`, \`NTH_VALUE(x, n)\`: the first, the last and the nth **of the frame**.
- \`LAST_VALUE\` and \`NTH_VALUE\` with the default frame stop at the current row: widen the frame.

## Distribution
\`CUME_DIST()\`: fraction of rows with a lower or equal value (0–1). \`PERCENT_RANK()\`: (rank − 1) / (rows − 1). They return double: \`ROUND((100 * CUME_DIST() OVER …)::numeric, 1)\`.

## Named window
\`… OVER w … WINDOW w AS (PARTITION BY … ORDER BY …)\`, after WHERE/GROUP BY/HAVING and before ORDER BY.`,
    },
  },
  sqlLab: {
    starter:
      "-- The first and the last payment of card 5, on every row\nSELECT id, pagado_en, importe,\n       FIRST_VALUE(importe) OVER w AS primer_importe,\n       LAST_VALUE(importe) OVER w AS ultimo_importe\nFROM pagos_tarjeta\nWHERE tarjeta_id = 5\nWINDOW w AS (ORDER BY pagado_en);",
    retos: {
      primero_ultimo: {
        title: 'The first and the last payment of card 5',
        description: 'Payments of **card 5** (all statuses): `id`, `pagado_en`, `importe`, `primer_importe` (the amount of the card\'s first payment) and `ultimo_importe` (the amount of the **last** one), on every row.',
        hint: '`FIRST_VALUE(importe)` and `LAST_VALUE(importe)` ordered by `pagado_en` and with the full frame: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.',
        requires: { 0: WINDOW_FN },
      },
      ultimos_7_dias: {
        title: 'Accepted in the last 7 days',
        description: 'Each day of **February 2026** with **accepted** payments: `dia`, `total` of the day and `ultimos_7_dias` (what was accepted that day and the **6 previous calendar days**, even if some have no payments).',
        hint: "A step with the total per day and outside `SUM(total) OVER (ORDER BY dia RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW)`. With ROWS you would count 7 rows, not 7 days.",
        requires: { 0: WINDOW_FN },
      },
      segundo_mayor: {
        title: 'The second highest payment of each merchant',
        description: 'For each merchant, with its **accepted** payments: `comercio_id` and `segundo_importe`, the amount of its **second highest payment**. One row per merchant.',
        hint: '`NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)` and `DISTINCT`, or number with `ROW_NUMBER` and keep number 2.',
        requires: { 0: WINDOW_FN },
      },
      percentil_saldo: {
        title: 'Which percentile each customer is in',
        description: 'Each customer with accounts: `cliente_id`, `saldo_total` (sum of their accounts) and `percentil`: the **percentage of customers with a total balance lower than or equal** to theirs, with 1 decimal.',
        hint: '`ROUND((100 * CUME_DIST() OVER (ORDER BY saldo_total))::numeric, 1)` over a step with the balance per customer. CUME_DIST returns double: cast before rounding.',
        requires: { 0: WINDOW_FN },
      },
      pagos_viajes: {
        title: "Viajes Horizonte's payments against its average",
        description: 'Payments of **merchant 20** (all statuses): `id`, `importe`, `media_comercio` (rounded to 2 decimals) and `maximo_comercio`, defining the window **only once** with `WINDOW`.',
        hint: '`ROUND(AVG(importe) OVER w, 2) AS media_comercio, MAX(importe) OVER w AS maximo_comercio … WINDOW w AS (PARTITION BY comercio_id)`.',
        requires: { 0: WINDOW_FN, 1: NAMED },
      },
      media_centrada: {
        title: 'The centered average of each month',
        description: '**Accepted** total of each month: `mes` (first day, as a date), `total` and `media_centrada`: the average of the previous month, the month itself and the next one, with 2 decimals.',
        hint: '`ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 2)` over a step with the total per month.',
        requires: { 0: WINDOW_FN },
      },
    },
  },
  bugs: {
    'C-MARTA': { title: "Product's weekly alert looks at seven payments, not seven days", explanation: 'Without the frame by days, the "weekly" sum sometimes covered two weeks.', technique: 'RANGE with INTERVAL.' },
    'C-CARMEN': { title: "The peaks check doesn't compare with the second payment", explanation: "Carmen didn't see that the online shop has a €3,373 payment and the next one is €237.", technique: 'NTH_VALUE with the full frame.' },
    'C-NURIA': { title: 'The "top 10%" offer goes to the wrong people', explanation: 'Without percentiles, Nuria picked a balance cut-off by eye.', technique: 'CUME_DIST.' },
    'C-DIEGO': { title: 'A report repeats the same window four times and one comes out different', explanation: 'When copying the window, one was left without the PARTITION BY.', technique: 'Named WINDOW.' },
    'C-LAURA': { title: "The dashboard trend lags a month behind", explanation: 'The average only looked backwards; Laura wanted a centered one.', technique: 'ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING.' },
    'C-ULTIMO': { title: 'The "last payment" of each card is always the row\'s own', explanation: 'LAST_VALUE with the default frame ends at the current row.', technique: 'A frame up to UNBOUNDED FOLLOWING.' },
    'C-ROWS': { title: 'The 7-day sum counts 7 rows when days are missing', explanation: 'ROWS counts rows; days without payments have no row.', technique: 'RANGE with an interval, or a calendar.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Tuesday's tasks.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's alert", explanation: 'Seven real days.' },
      1: { label: "Carmen's check", explanation: 'The second payment of each merchant.' },
      2: { label: "Nuria's offer", explanation: "Each customer's percentile." },
      3: { label: "Diego's report", explanation: 'A named window.' },
      4: { label: "Laura's dashboard", explanation: 'Centered average.' },
      5: { label: 'Real lasts', explanation: 'LAST_VALUE with the full frame.' },
      6: { label: 'Days, not rows', explanation: 'RANGE with an interval.' },
    },
  },
  concepts: {
    first_last_value: { title: 'FIRST_VALUE and LAST_VALUE', summary: 'The first and the last value of the frame of each row.' },
    window_frame_default: { title: 'The default frame', summary: 'With ORDER BY, from the start to the current row (and its ties): LAST_VALUE stops at it.' },
    rows_vs_range: { title: 'ROWS or RANGE', summary: 'ROWS counts rows; RANGE looks at values (days, amounts): with gaps they give different things.' },
    nth_value: { title: 'NTH_VALUE', summary: "The nth value of the frame; it needs the full frame so it doesn't depend on the row." },
    cume_dist: { title: 'CUME_DIST and PERCENT_RANK', summary: 'Where each row sits in the distribution, between 0 and 1.' },
    named_window: { title: 'Named WINDOW', summary: 'The window is defined once and used in several functions: fewer copies, fewer mistakes.' },
    centered_frame: { title: 'Frames looking forward', summary: 'FOLLOWING looks at later rows: centered averages, next value.' },
  },
  seniorTips: [
    'Read the frames cheat sheet in the wiki.',
    'Inés: FIRST_VALUE and LAST_VALUE with WINDOW w AS (ORDER BY pagado_en ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING).',
    "Marta: total per day in February and SUM(total) OVER (ORDER BY dia RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW).",
    'Carmen: NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) with DISTINCT.',
    'Nuria: ROUND((100 * CUME_DIST() OVER (ORDER BY saldo_total))::numeric, 1) over the balance per customer.',
    'Diego: AVG and MAX OVER w, with WINDOW w AS (PARTITION BY comercio_id), WHERE comercio_id = 20.',
    'Laura: ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 2) over the total per month.',
    'With Inés: the default frame ends at the current row; and with gaps, RANGE, not ROWS.',
  ],
  lessons: {
    first_last: {
      question: 'How do I get the first and last value of a group on every row?',
      body: `With \`FIRST_VALUE\` and \`LAST_VALUE\`:

\`\`\`
SELECT id, importe,
       FIRST_VALUE(importe) OVER w AS primero,
       LAST_VALUE(importe)  OVER w AS ultimo
FROM pagos_tarjeta
WHERE tarjeta_id = 5
WINDOW w AS (ORDER BY pagado_en
             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING);
\`\`\`

They return the first and the last value **of the frame** of each row. Without the full frame, the last one is not the last of the group.`,
    },
    default: {
      question: "What frame does a window use if I don't say anything?",
      body: `- Without \`ORDER BY\` in the OVER: every row of the partition.
- With \`ORDER BY\`: \`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`, from the start **up to the current row** (and the ones tied with it).

That's why \`SUM() OVER (ORDER BY …)\` is a running total… and \`LAST_VALUE() OVER (ORDER BY …)\` returns the row's own value: the last of a frame that ends at it.`,
    },
    rows_range: {
      question: 'ROWS or RANGE?',
      body: `- \`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\`: the row and the **6 previous rows**.
- \`RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW\`: the rows whose ORDER BY value is within the **6 previous days**.

If there is one data point per day with no gaps, they give the same. If days are missing, ROWS goes back further than a week. With RANGE and an interval, the ORDER BY has to be a single date or number column.`,
    },
    nth: {
      question: 'And the second highest value?',
      body: `\`NTH_VALUE(x, n)\` gives value number n of the frame:

\`\`\`
SELECT DISTINCT comercio_id,
       NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS segundo
FROM pagos_tarjeta;
\`\`\`

With the default frame, on the first row of each group it gives NULL (the frame only has one row). Alternative: \`ROW_NUMBER()\` in a step and keep number 2.`,
    },
    dist: {
      question: 'How do I know which percentile each row is in?',
      body: `- \`CUME_DIST()\`: fraction of rows with a **lower or equal** value (from 1/n to 1).
- \`PERCENT_RANK()\`: (rank − 1) / (rows − 1), from 0 to 1.

\`\`\`
ROUND((100 * CUME_DIST() OVER (ORDER BY saldo_total))::numeric, 1) AS percentil
\`\`\`

Both return \`double precision\`: \`ROUND(x, 1)\` only accepts \`numeric\`, so you have to cast first.`,
    },
    named: {
      question: 'Can I avoid repeating the same window?',
      body: `Yes, with \`WINDOW\`, after \`WHERE\`/\`GROUP BY\`/\`HAVING\` and before \`ORDER BY\`:

\`\`\`
SELECT id, importe,
       AVG(importe) OVER w, MAX(importe) OVER w, COUNT(*) OVER w
FROM pagos_tarjeta
WINDOW w AS (PARTITION BY comercio_id);
\`\`\`

It can be extended: \`OVER (w ORDER BY pagado_en)\` uses the partition of \`w\` and adds an order. A single definition: if you change the partition, all of them change.`,
    },
    centered: {
      question: 'Can a window look forward?',
      body: `Yes, with \`FOLLOWING\`:

\`\`\`
AVG(total) OVER (ORDER BY mes ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)
\`\`\`

Average of the previous month, the current one and the next one: it smooths without lagging behind. At the ends it uses the rows there are (the first month, two; the last, two).`,
    },
  },
  quiz: {
    pre: {
      a1pre_last: { question: '`LAST_VALUE(importe) OVER (ORDER BY pagado_en)` returns…', options: ['The last amount of the group', "The row's own amount (or its last tie)", 'NULL', 'The first one'], explanation: 'The default frame ends at the current row.' },
      a1pre_first: { question: '`FIRST_VALUE(importe) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en)` returns…', options: ['The first payment of each card', 'The first payment of the table', 'The highest', 'Error'], explanation: 'The first of the frame, which starts at the beginning of the group.' },
      a1pre_rows: { question: 'Two days are missing in your daily data. What does `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` cover?', options: ['Exactly 7 days', 'The last 7 rows, which cover 9 days', 'Nothing', '6 days'], explanation: 'ROWS counts rows, not days.' },
      a1pre_nth: { question: 'What does `NTH_VALUE(importe, 2)` do?', options: ['Multiplies by 2', 'Returns the second value of the frame', 'Returns the second group', 'Splits into 2 groups'], explanation: 'The nth of the frame.' },
      a1pre_dist: { question: '`CUME_DIST()` of the customer with the highest balance out of 40 is…', options: ['0', '1', '0.5', '40'], explanation: 'Every row has a lower or equal value.' },
      a1pre_named: { question: 'Where does the `WINDOW w AS (…)` clause go?', options: ['Before the FROM', 'After WHERE/GROUP BY/HAVING and before ORDER BY', 'Inside the OVER', 'At the end, after the LIMIT'], explanation: 'And then it is used with OVER w.' },
    },
    post: {
      a1post_last: { question: 'For `LAST_VALUE` to give the last of the group on every row…', options: ["Remove the query's ORDER BY", 'ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING', 'Add DISTINCT', 'Use MAX'], explanation: 'The frame has to reach the end of the group.' },
      a1post_range: { question: 'Sum of the last 7 calendar days even if days are missing:', options: ['ROWS BETWEEN 6 PRECEDING AND CURRENT ROW', "RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW", 'LAG(total, 7)', 'SUM(total) OVER ()'], explanation: 'RANGE looks at the value of the date.' },
      a1post_nth: { question: 'With the default frame, `NTH_VALUE(importe, 2)` on the first row of each group gives…', options: ['The second amount', 'NULL', 'The first one', 'Error'], explanation: 'Its frame only has one row.' },
      a1post_dist: { question: '`ROUND(100 * CUME_DIST() OVER (…), 1)` gives an error. Why?', options: ["CUME_DIST doesn't exist", 'It returns double and ROUND with decimals needs numeric', 'PARTITION BY is missing', 'You have to multiply by 100.0'], explanation: 'Cast first: (…)::numeric.' },
      a1post_named: { question: 'What advantage does `WINDOW w AS (…)` have if you use the same window in four columns?', options: ['None', "It's defined once: there are no copies to get out of sync", 'It is always faster', 'It lets you use the window in the WHERE'], explanation: 'A single place to change.' },
      a1post_centered: { question: '`ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` on the last month uses…', options: ['3 rows', '2 rows: the previous one and itself', '1 row', 'None'], explanation: 'There is no next one: it uses the ones there are.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: 'What decides a window: the frame',
      body: 'Good morning.\n\nLast month you used windows for rankings and running totals. Today we go to what lies underneath: the **frame**, the rows each row sees. Almost every mistake with windows comes from not knowing which frame is being used.\n\nTo start, with the payments of **card 5** (all statuses):\n\n- `id`, `pagado_en`, `importe`, `primer_importe` (the amount of the card\'s first payment) and `ultimo_importe` (the amount of the **last** one), on every row.\n\nInés',
    },
    ines_ok: {
      body: '€27.35 the first and €29.95 the last, on all twelve rows. Notice you had to tell LAST_VALUE to look all the way to the end: it doesn\'t do it by itself.',
    },
    marta_semana: {
      body: 'Hi! I want an alert that looks at **what was accepted in the last 7 days**. To test it with February 2026: each day with accepted payments, `dia`, `total` of the day and `ultimos_7_dias` (that day and the **6 previous calendar days**, whether they have payments or not).',
    },
    marta_thanks: { body: 'Nineteen days and the peak on the 15th stands out: more than €3,500 in a week. Thanks!' },
    carmen_segundo: {
      body: "Hi. For the peaks check I want to compare each merchant's highest payment with the **second highest**: if they're far apart, it's suspicious. For now, `comercio_id` and `segundo_importe` of each merchant, with its **accepted** payments.",
    },
    carmen_thanks: { body: "The online shop: €3,373 the highest and €237.55 the second. I'll look into it. Thanks." },
    ines_ultimo: {
      subject: '11:00 · Inés: "The last payment is… every payment"',
      body: "**Inés:** Diego wanted each card's last payment on every row:\n\n`SELECT id, importe, LAST_VALUE(importe) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) FROM pagos_tarjeta;`\n\nAnd on every row he gets its own amount. What's going on?",
      choices: {
        frame: {
          text: 'With `ORDER BY` in the OVER, the default frame goes **from the start to the current row**: the last of that frame is the row itself. The frame has to be widened: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`. (Or use `FIRST_VALUE` ordering the other way round.)',
          reply: 'Exactly. It is the most typical mistake with windows: the default frame is designed for running totals, not for "the last one".',
          effects: { 2: { text: 'LAST_VALUE and NTH_VALUE need the full frame.' } },
        },
        order: {
          text: 'That he is missing an `ORDER BY pagado_en` at the end of the query.',
          reply: "The query's ORDER BY only sorts the result; the window's frame still ends at each row.",
          effects: { 0: { text: "The query's ORDER BY doesn't change the frame." } },
        },
        bug: {
          text: "That LAST_VALUE works badly in PostgreSQL and it's better not to use it.",
          reply: 'It works exactly as the standard says: the last of the frame. The frame is what had to change.',
          effects: { 0: { text: 'You blamed the function for a badly chosen frame.' } },
        },
      },
    },
    nuria_percentil: {
      body: "Hi. We are going to call the **10% of customers with the highest balance** for an offer. First I want to see all of them with their **percentile**: `cliente_id`, `saldo_total` and `percentil` (the percentage of customers with a total balance lower than or equal to theirs, with 1 decimal).",
    },
    nuria_thanks: { body: "Thirty-nine customers and the top four above 90. Those are mine. Thanks!" },
    diego_ventana: {
      body: 'Hey. For a Viajes Horizonte report (merchant 20) I want each payment (all statuses) with the `media_comercio` (2 decimals) and the `maximo_comercio`: `id`, `importe`, `media_comercio` and `maximo_comercio`. And Inés says the window should be written **only once**, with `WINDOW`.',
    },
    diego_thanks: { body: 'Thirteen payments, an average of €636.89 and a maximum of €1,075.49. And if I change the partition tomorrow, I change it in one place. Thanks!' },
    laura_centrada: {
      body: 'Hi. The dashboard\'s moving average always lags a little behind reality. I want a **centered average**: for each month, the average of the previous month, the month itself and the next one. `mes` (first day, as a date), accepted `total` and `media_centrada` with 2 decimals.',
    },
    laura_thanks: { body: "Fourteen months, and the ends with two months each. Now the curve doesn't arrive late. Thanks!" },
    ines_rows: {
      subject: '15:00 · Inés: "Seven days or seven rows?"',
      body: '**Inés:** Marta had tried her alert like this:\n\n`SUM(total) OVER (ORDER BY dia ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`\n\nAnd she gets something different from you on 14 of the 19 days of February. Which one is right?',
      choices: {
        range: {
          text: "Hers counts **7 rows**, not 7 days: in February there are nine days without accepted payments, which have no row, so the 7 previous rows go back more than a week. For 7 calendar days you have to use `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW` (or fill in the calendar with zeros and then, yes, ROWS).",
          reply: "That's it. ROWS counts rows; RANGE looks at the value. With data that has gaps, the difference is exactly what you want to avoid.",
          effects: { 3: { text: 'With gaps in the dates, RANGE with an interval (or a calendar); ROWS counts rows.' } },
        },
        rows_ok: {
          text: "That both are right: it's a rounding issue.",
          reply: "It isn't rounding: they add up different days. On some dates, the ROWS one includes payments from ten days ago.",
          effects: { 0: { text: 'You accepted two sums that look at different periods.' } },
        },
        seven: {
          text: 'That she should change the 6 to a 7 to make up for it.',
          reply: "That would be 8 rows, which aren't 7 days either. The problem isn't the number, it's that it counts rows.",
          effects: { 0: { text: "Adjusting the number of rows doesn't turn rows into days." } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Inés',
      body: '**Inés:** Today you worked on window frames. What are you taking away?',
      choices: {
        lesson: {
          text: 'That every window has a frame and the default one ends at the current row, so LAST_VALUE and NTH_VALUE need the full frame; that ROWS counts rows and RANGE values; that you can look forward with FOLLOWING; that CUME_DIST gives percentiles; and that with WINDOW I define the window once.',
          reply: 'Very good. Tomorrow, streaks, gaps and percentiles: the "islands" problems.',
        },
        maxmin: {
          text: "That for the first and the last it's easier to use MIN and MAX.",
          reply: "MIN and MAX give the lowest and the highest, not the first and the last in time. Check the debrief.",
          effects: { 0: { text: "You came away with MIN and MAX, which aren't first and last." } },
        },
      },
    },
  },
})
