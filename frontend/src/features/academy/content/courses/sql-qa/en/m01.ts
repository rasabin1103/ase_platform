import { m01Bordes } from '../m01-bordes'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 8: SQL for QA · Mission 1 — The edge cases. English version of ../m01-bordes.ts. */
export const m01BordesEn = missionEn(m01Bordes, {
  ...COMMON_EN,
  title: 'The edge cases',
  subtitle: 'Dates with times, NULLs, repeated rows, almost identical text, rounding and division.',
  dayLabel: 'Tuesday · month 4',
  verdicts: {
    good: {
      title: 'No edge case gets past you',
      body: 'February with all of the 28th, the customers without a segment, totals without multiplying, repeated emails even when the case changes, fees rounded as the contract says and percentages that don\'t come out as zero. And nobody slipped a BETWEEN past you.',
    },
    ok: { title: 'Edge cases, halfway there', body: 'You already look for the boundary cases, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'The edge cases reached production', body: 'Several tasks were left undone. Replay the mission with the edge cases cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · The edge cases',
    paragraphs: [
      "Tuesday. Kobalto's reports \"work\" with the usual data. Today it's about testing them where they break: the last day of the month, empty values, repeats, almost identical text and decimals.",
      'Each task is done when the query returns exactly the rows and columns asked for, with the edge case handled correctly.',
    ],
    goals: [
      'Filter a whole month when the column has a time.',
      'Count the empty values without confusing COUNT(*) with COUNT(column).',
      "Add up without a JOIN repeating rows.",
      'Find repeated text that only differs in case or spaces.',
      'Round where the rule says, not where it is easiest.',
      'Divide without integer division and without dividing by zero.',
    ],
  },
  docs: {
    chuleta_bordes: {
      title: 'Cheat sheet: the edge cases',
      updatedLabel: 'Laura Méndez · QA',
      body: `## Where queries break
| Edge case | Wrong | Right |
|---|---|---|
| A month with a timestamp | \`BETWEEN '2026-02-01' AND '2026-02-28'\` | \`>= '2026-02-01' AND < '2026-03-01'\` |
| Empty values | \`COUNT(segmento)\` (doesn't count NULL) | \`COUNT(*) - COUNT(segmento)\` |
| Repeats from a JOIN | \`JOIN incidencias\` and \`SUM\` | \`WHERE EXISTS (…)\` |
| Almost identical text | \`GROUP BY email\` | \`GROUP BY lower(trim(email))\` |
| Rounding | \`ROUND(SUM(x), 2)\` if the rule is per line | \`SUM(ROUND(x, 2))\` |
| Division | \`a / b\` with integers (gives 0) | \`100.0 * a / NULLIF(b, 0)\` |

## Today's tables
- \`pagos_tarjeta\`: 52 payments in February 2026, two of them on the afternoon of the 28th.
- \`altas_web\`: customer sign-ups from the website (\`email\` as they typed it).
- \`incidencias\`: some customers have several.
- \`tarjetas\`: card 33 is new and has no payments.`,
    },
  },
  sqlLab: {
    starter: "-- How many payments were there in February? Look closely at the last day\nSELECT id, pagado_en, estado\nFROM pagos_tarjeta\nWHERE pagado_en >= '2026-02-27'\nORDER BY pagado_en;",
    retos: {
      pagos_febrero: {
        title: "February's payments, the 28th included",
        description: 'How many card payments (any status) there were in **February 2026**, counting **all of the 28th**: one column `pagos`.',
        hint: "`WHERE pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'`.",
      },
      sin_segmento: {
        title: 'Customers without a segment per city',
        description: 'Per `ciudad`: the number of `clientes` and how many are **without a segment** (`sin_segmento`, empty segment). Every city, even with 0.',
        hint: '`COUNT(*) AS clientes, COUNT(*) - COUNT(segmento) AS sin_segmento` (or `COUNT(*) FILTER (WHERE segmento IS NULL)`).',
      },
      total_con_incidencias: {
        title: 'What customers with incidents pay',
        description: 'The **total** amount of the **accepted** payments of the customers who have **any incident** (open or closed): one column `total`. Each payment counts only once.',
        hint: 'Payments → cards → accounts and `WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = a.cliente_id)`.',
      },
      altas_repetidas: {
        title: 'Repeated sign-ups with the same email',
        description: 'The emails in `altas_web` that repeat **ignoring case and leading or trailing spaces**: `email_normalizado` (lower case and without spaces) and `altas`. Only the ones that appear more than once.',
        hint: '`lower(trim(email)) AS email_normalizado`, `GROUP BY` that expression and `HAVING COUNT(*) > 1`.',
      },
      comision_por_comercio: {
        title: "Each merchant's fee, rounded per payment",
        description: 'Kobalto charges each merchant **1.5 %** of each **accepted** payment, **rounded to cents on each payment**. Per merchant: `comercio_id` and `comision` (the sum of the fees of its payments).',
        hint: '`SUM(ROUND(importe * 0.015, 2))`: first each payment is rounded and then they are added up.',
      },
      rechazo_por_tarjeta: {
        title: "Each card's rejection percentage",
        description: 'For **every** card (including the ones without payments): `tarjeta_id`, `pagos` and `pct_rechazo` (percentage of **rejected** payments, with 1 decimal). Without payments, the percentage is **empty**.',
        hint: "`LEFT JOIN pagos_tarjeta` and `ROUND(100.0 * COUNT(p.id) FILTER (WHERE p.estado = 'rechazado') / NULLIF(COUNT(p.id), 0), 1)`.",
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'Marketing writes to customers "without a segment" who do have one', explanation: 'COUNT(segmento) counts the ones that have it, not the missing ones.', technique: 'COUNT(*) − COUNT(column).' },
    'C-CARMEN': { title: 'Risk sees an inflated payment volume for customers with incidents', explanation: 'The JOIN with incidents repeats the payments of anyone with several.', technique: 'EXISTS instead of JOIN.' },
    'C-NURIA': { title: "The same customer has three records and doesn't get the notifications", explanation: 'The repeats only differed in case and spaces.', technique: 'lower(trim(email)).' },
    'C-DIEGO': { title: "The fee invoices don't match the contract by a few cents", explanation: 'The total was rounded instead of each payment.', technique: 'SUM(ROUND(…)) when the rule is per line.' },
    'C-INES': { title: 'The fraud dashboard shows 0 % rejections on every card', explanation: 'Integer division: 2 / 12 = 0.', technique: '100.0 * … / NULLIF(…, 0).' },
    'C-BETWEEN': { title: "February's close leaves out the afternoon payments of the 28th", explanation: "BETWEEN … AND '2026-02-28' cuts at 00:00 on the 28th.", technique: '>= first day AND < first day of the next month.' },
    'C-JOIN': { title: 'A payments-per-customer report adds up more than was charged', explanation: 'A JOIN to a table with several rows per customer multiplied the amounts.', technique: 'Check the cardinality before adding up; EXISTS or aggregate first.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Tuesday's edge cases.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's segments", explanation: 'Empty values counted correctly.' },
      1: { label: "Carmen's volume", explanation: 'Each payment once.' },
      2: { label: "Nuria's records", explanation: 'Normalised emails.' },
      3: { label: "Diego's fees", explanation: 'Rounding per payment.' },
      4: { label: "Inés's dashboard", explanation: 'No integer division.' },
      5: { label: 'The last day', explanation: 'Half-open ranges.' },
      6: { label: 'JOIN that multiplies', explanation: 'Cardinality before adding up.' },
    },
  },
  concepts: {
    casos_borde: { title: 'Edge cases', summary: 'The values at the limits (last day, zero, empty, repeated) are where queries fail.' },
    rango_fechas: { title: 'Date ranges with times', summary: '>= start AND < start of the next period; BETWEEN with a date cuts at 00:00.' },
    count_null: { title: 'COUNT and NULL', summary: 'COUNT(*) counts rows; COUNT(column), only the ones that are not NULL.' },
    fan_out: { title: 'Rows multiplied by a JOIN', summary: 'Joining with a table that has several rows per key repeats the other one; SUM and COUNT get inflated.' },
    normalizar: { title: 'Normalising text', summary: 'lower(trim(…)) to compare text that only differs in case or spaces.' },
    redondeo: { title: 'Where to round', summary: 'SUM(ROUND(x)) and ROUND(SUM(x)) give different results: the business rule decides.' },
    division: { title: 'Safe division', summary: 'Integer / integer truncates; 100.0 * a / NULLIF(b, 0) avoids the zero and division by zero.' },
  },
  seniorTips: [
    'Read the edge cases cheat sheet in the wiki.',
    "Laura: COUNT(*) with pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'.",
    'Marta: COUNT(*) AS clientes and COUNT(*) − COUNT(segmento) AS sin_segmento.',
    'Carmen: SUM of accepted payments with WHERE EXISTS on incidencias, no JOIN.',
    'Nuria: lower(trim(email)), GROUP BY and HAVING COUNT(*) > 1.',
    'Diego: SUM(ROUND(importe * 0.015, 2)) per comercio_id.',
    'Inés: LEFT JOIN, 100.0 * … / NULLIF(COUNT(p.id), 0) and ROUND(…, 1).',
    'With Laura: half-open ranges for dates and watch out for JOINs that multiply.',
  ],
  lessons: {
    casos_borde: {
      question: 'What are edge cases and why does QA look for them?',
      body: `The values at the **limits**: the first and the last day, zero, empty, repeated, the maximum. Queries are usually tested with "normal" data and fail right there.

For each query, ask yourself:

- What happens on the **last day** of the period, late in the day?
- And if the column is **empty** (NULL)?
- And if there are **several rows** where I expect one?
- And if the text only changes in **case or spaces**?
- And if the divisor is **zero**?`,
    },
    rango_fechas: {
      question: 'Why does BETWEEN fail with dates?',
      body: `\`pagado_en\` has a **time**. \`BETWEEN '2026-02-01' AND '2026-02-28'\` compares with \`2026-02-28 00:00:00\`: a payment on the 28th at 18:20 is left out.

The safe way is a **half-open range**:

\`\`\`
WHERE pagado_en >= '2026-02-01'
  AND pagado_en <  '2026-03-01'
\`\`\`

It works the same with dates without times, with months of 28, 30 or 31 days and with leap years.`,
    },
    count_null: {
      question: 'What is the difference between COUNT(*) and COUNT(column)?',
      body: `- \`COUNT(*)\`: counts **rows**.
- \`COUNT(segmento)\`: counts the rows whose segment **is not NULL**.

So the **missing** ones are \`COUNT(*) - COUNT(segmento)\`, or \`COUNT(*) FILTER (WHERE segmento IS NULL)\`.

The same happens with \`AVG\`, \`SUM\` or \`MAX\`: they **ignore** NULLs. An average "without the empty values" may not be the one the business asks for.`,
    },
    fan_out: {
      question: 'How can a JOIN inflate a sum?',
      body: `If you join a customer's payments with their incidents and they have **two** incidents, **each payment comes out twice**. The \`SUM\` counts it twice.

Before adding up, ask yourself how many rows there are **per key** in each table. If you only need to know whether one exists:

\`\`\`
WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = a.cliente_id)
\`\`\`

And if you need data from both tables, aggregate each one before joining them.`,
    },
    normalizar: {
      question: "How do I find text that is the same even though it doesn't look like it?",
      body: `"ana.garcia@mail.com", " Ana.Garcia@mail.com" and "ANA.GARCIA@MAIL.COM " are the same email. To compare them, **normalise**:

\`\`\`
SELECT lower(trim(email)) AS email_normalizado, COUNT(*)
FROM altas_web
GROUP BY lower(trim(email))
HAVING COUNT(*) > 1;
\`\`\`

\`trim\` removes the spaces at the ends; \`lower\`, the upper case. Accents need more (\`unaccent\`), but start here.`,
    },
    redondeo: {
      question: 'Do I round each line or the total?',
      body: `They are not the same:

- \`SUM(ROUND(importe * 0.015, 2))\`: rounds **each payment** and adds up.
- \`ROUND(SUM(importe) * 0.015, 2)\`: adds up and rounds **once**.

They can differ by one or more cents. Neither is "the right one" in general: the **business rule** decides (here, the contract says "per payment"). The test case is exactly a merchant where the two differ.`,
    },
    division: {
      question: 'Why does a percentage come out as 0?',
      body: `\`COUNT\` returns integers, and **integer / integer** in PostgreSQL truncates: \`2 / 12 = 0\`.

\`\`\`
ROUND(100.0 * rechazados / NULLIF(pagos, 0), 1)
\`\`\`

- \`100.0\` turns the operation into a decimal one.
- \`NULLIF(pagos, 0)\` returns NULL if there are no payments: the result is empty instead of giving "division by zero".

Card 33, new and without payments, is exactly the case that tests it.`,
    },
  },
  quiz: {
    pre: {
      q1pre_between: { question: "`pagado_en BETWEEN '2026-02-01' AND '2026-02-28'`. Is a payment on the 28th at 18:20 included?", options: ['Yes', 'No', 'Only if accepted', 'It depends on the index'], explanation: 'The limit is the 28th at 00:00.' },
      q1pre_count: { question: 'What does `COUNT(segmento)` count?', options: ['Every row', 'The rows with a non-empty segment', 'The rows with an empty segment', 'The distinct segments'], explanation: 'COUNT(column) ignores NULLs.' },
      q1pre_fan: { question: 'A customer with 2 incidents has 5 payments. How many rows does `pagos JOIN incidencias` give?', options: ['5', '10', '7', '2'], explanation: 'Each payment for each incident.' },
      q1pre_norm: { question: 'How do you compare emails ignoring case and extra spaces?', options: ['email = email', 'lower(trim(email))', 'email LIKE email', 'upper(email)'], explanation: 'trim removes the spaces at the ends.' },
      q1pre_div: { question: 'What does `2 / 12` give in PostgreSQL with integers?', options: ['0.1666', '0', '0.17', 'Error'], explanation: 'Integer division.' },
      q1pre_borde: { question: 'Where does a query that "works" usually fail?', options: ['With normal data', 'At the limits: last day, empty values, zeros, repeats', 'Never', 'Only with a lot of data'], explanation: "That's where you have to test." },
    },
    post: {
      q1post_rango: { question: 'What is the safe filter for "February 2026"?', options: ["BETWEEN '2026-02-01' AND '2026-02-28'", "pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'", 'EXTRACT(MONTH FROM pagado_en) = 2', "pagado_en LIKE '2026-02%'"], explanation: 'Half-open and without functions on the column.' },
      q1post_null: { question: '`AVG(comision)` with two rows: 10 and NULL. What does it give?', options: ['5', '10', 'NULL', 'Error'], explanation: 'AVG ignores NULLs.' },
      q1post_exists: { question: 'You want the total payments of the customers with any incident. What do you use?', options: ['JOIN incidencias', 'WHERE EXISTS (SELECT 1 FROM incidencias …)', 'CROSS JOIN', 'UNION'], explanation: "EXISTS doesn't repeat rows." },
      q1post_round: { question: 'The contract says "1.5 % of each payment, rounded to cents". What do you calculate?', options: ['ROUND(SUM(importe) * 0.015, 2)', 'SUM(ROUND(importe * 0.015, 2))', 'SUM(importe) * 0.015', 'ROUND(AVG(importe), 2)'], explanation: 'Rounding per line.' },
      q1post_nullif: { question: 'What does `NULLIF(pagos, 0)` do?', options: ['Sets 0 if it is NULL', 'Returns NULL if pagos is 0', 'Deletes the rows with 0', 'Nothing'], explanation: "That way you don't divide by zero." },
      q1post_norm: { question: '" Ana@mail.com" and "ana@mail.com ". Does `GROUP BY email` group them?', options: ['Yes', 'No: you need lower(trim(email))', 'Only with DISTINCT', 'Only with ORDER BY'], explanation: 'They are different texts for PostgreSQL.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: 'Where queries break',
      body: "Good morning.\n\nYesterday you saw that the app can lie. Today it's something else: queries that \"work\" with the usual data and fail at the **edges**. The last day of the month, empty values, repeats, decimals.\n\nWe start with the month-end close:\n\n- How many card payments (any status) there were in **February 2026**, with **all of the 28th**: one column `pagos`.\n\nLaura",
    },
    laura_ok: {
      body: "52. With BETWEEN up to the 28th you get 48: the four payments of the 28th are lost, because the limit is the 28th at 00:00. That's the edge case.",
    },
    marta_segmentos: {
      body: "Hi! We're launching a campaign for customers **without a segment**. Per `ciudad`, I want the number of `clientes` and how many are without a segment (`sin_segmento`). Every city, even with zero.",
    },
    marta_thanks: { body: "Two in total, one in Madrid and one in Barcelona. The draft I was given said 11 and 7: it was counting the ones that **do** have one. Thanks!" },
    carmen_volumen: {
      body: 'Hi. I need the **total** amount of the **accepted** payments of the customers who have **any incident** (open or closed). One column `total`. Careful: some customers have several incidents and each payment has to count **only once**.',
    },
    carmen_thanks: { body: "€24,253.47. The report I had said 25,874.11: customer 3 has three incidents and their payments came out three times. Thanks." },
    laura_between: {
      subject: '11:00 · Laura: "the close matches the bank"',
      body: "**Laura:** The February close report Rubén made uses `WHERE pagado_en BETWEEN '2026-02-01' AND '2026-02-28'`. He says he tested it with January's data and it matched. Do you accept it?",
      choices: {
        rango: {
          text: "No. `pagado_en` has a time and BETWEEN cuts at **the 28th at 00:00**: the payments on the afternoon of the 28th aren't included. With January it matched because there were no payments on the last day after midnight. The filter has to be `>= '2026-02-01' AND < '2026-03-01'`, and the test needs payments on the last day, late in the day.",
          reply: "Exactly. And notice the second part: Rubén's test didn't have the case that breaks it. A good test case lives at the edge.",
          effects: { 2: { text: 'Half-open ranges, and test cases at the last moment of the period.' } },
        },
        ok: {
          text: 'Yes: if it matched with January, it will with February too.',
          reply: "With February four payments of the 28th are lost. A test passing says nothing if it doesn't have the hard case.",
          effects: { 0: { text: 'You accepted a test without the edge case.' } },
        },
        mes: {
          text: 'That he should rather use `EXTRACT(MONTH FROM pagado_en) = 2`.',
          reply: 'That would catch February of every year, and it also prevents using the date index. The half-open range is safer.',
          effects: { 0: { text: 'You swapped one edge case for another problem.' } },
        },
      },
    },
    nuria_altas: {
      body: "Hi. Some customers sign up several times on the website and then don't get the notifications. Can you get me the emails in `altas_web` that repeat **ignoring case and spaces**? `email_normalizado` (lower case and without spaces) and `altas`, only the repeated ones.",
    },
    nuria_thanks: { body: 'Ana three times, Lucía twice and Elena twice. With a normal GROUP BY only Elena came out. Thanks!' },
    diego_comisiones: {
      body: "Hey. I'm testing the merchant invoicing. The contract says: **1.5 % of each accepted payment, rounded to cents on each payment**. Per merchant, `comercio_id` and `comision`. I want to compare it with what the backend calculates.",
    },
    diego_thanks: { body: 'In 14 merchants my backend is off by a cent: it rounded the total, not each payment. Thanks!' },
    ines_rechazos: {
      body: "Hi. The fraud dashboard says **0 %** rejections on every card, and I don't believe it. For **every** card (card 33 is new and has no payments): `tarjeta_id`, `pagos` and `pct_rechazo` with 1 decimal. Without payments, the percentage empty.",
    },
    ines_thanks: { body: 'Card 12 with 76.9 %, and card 33 with no value instead of an error. The dashboard was dividing integers. Thanks.' },
    laura_join: {
      subject: '15:00 · Laura: "the total is right, I checked it"',
      body: '**Laura:** For Carmen\'s request, Rubén had written `… JOIN incidencias i ON i.cliente_id = a.cliente_id …` and he says he checked it: "customer 5 has one incident and their total matches". What is that check missing?',
      choices: {
        cardinalidad: {
          text: "That he tested it with a customer that has **one** incident, where the JOIN doesn't repeat anything. With a customer with **several** (customer 3 has three), each payment comes out several times and the total gets inflated. You have to think about how many rows there are per customer in each table, and use EXISTS or aggregate before joining.",
          reply: "That's it. Same as with the dates: the easy case always passes. The several-rows-per-key case is the one that uncovers the error.",
          effects: { 3: { text: 'Test JOINs with keys that have several rows.' } },
        },
        distinct: {
          text: 'That he is missing a `SUM(DISTINCT p.importe)`.',
          reply: 'And two different payments with the same amount would count as one. DISTINCT covers one problem with another.',
          effects: { 0: { text: "SUM(DISTINCT) doesn't fix a JOIN that multiplies." } },
        },
        ok: {
          text: 'Nothing: if it matches for customer 5, it matches for the others too.',
          reply: "For customer 3 it doesn't match: their payments come out three times.",
          effects: { 0: { text: 'You generalised from an easy case.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Laura',
      body: '**Laura:** Six edge cases, six defects. What are you taking away?',
      choices: {
        lesson: {
          text: "That queries break at the limits: the last day with a time (half-open range), NULLs in counts, JOINs that multiply rows, almost identical text, where to round and integer division or division by zero. And that a test without the hard case doesn't test anything.",
          reply: 'Very good. Tomorrow we build those hard cases: test data.',
        },
        normal: {
          text: "That if a query works with normal data, it's fine.",
          reply: 'Today they all worked with normal data. Check the debrief.',
          effects: { 0: { text: 'You came away with testing only with normal data.' } },
        },
      },
    },
  },
})
