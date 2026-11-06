import { m06Informe } from '../m06-informe'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 8: SQL for QA · Mission 6 — Testing a report. English version of ../m06-informe.ts. */
export const m06InformeEn = missionEn(m06Informe, {
  ...COMMON_EN,
  title: 'Testing a report',
  subtitle: 'An independent oracle, the differences with the report and the cause of each one.',
  dayLabel: 'Tuesday · month 4, week 2',
  verdicts: {
    good: {
      title: 'The report, taken apart',
      body: "You wrote the correct report from the specification, found the six merchants that don't add up and the cause of each difference: refunds counted, four payments from the 28th left out, a merchant duplicated by its categories and another that doesn't even show up.",
    },
    ok: { title: 'Report half tested', body: 'You already test reports, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'The report goes out as it was', body: 'Several tasks were left undone and the report reached Management with its errors. Replay the mission with the cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Testing a report',
    paragraphs: [
      "Tuesday. Diego has built the view `informe_comercios_febrero` for Thursday's committee: per merchant, how many payments and how much was charged in February. Before it reaches Management, QA has to test it.",
      "The specification and the view's SQL are in the wiki. Each task is done when the query returns exactly the rows and columns asked for.",
    ],
    goals: [
      'Write the correct result (the oracle) from the specification, not from the report.',
      'Compare the report with the oracle and find the differences.',
      'Isolate the cause of each difference with a query.',
      'Test the states, the boundary days and the rows that may be missing.',
      "Check the cardinality of the report's JOINs.",
      'Design test cases that cover each kind of error.',
    ],
  },
  docs: {
    chuleta_informe: {
      title: 'Merchant report: specification and SQL',
      updatedLabel: 'Diego Ruiz · Backend',
      body: `## Specification (from Product)
For **every merchant** (all of them, including those without payments):
- \`pagos\`: number of **accepted** payments in **February 2026** (from the 1st to the 28th, the whole day).
- \`total\`: sum of their amount (0 if there are none).

## What there is now
\`\`\`
CREATE VIEW informe_comercios_febrero AS
SELECT c.id AS comercio_id, c.nombre, COUNT(*) AS pagos, SUM(p.importe) AS total
FROM pagos_tarjeta p
JOIN comercios c ON c.id = p.comercio_id
JOIN comercio_categorias cc ON cc.comercio_id = c.id
WHERE p.estado <> 'rechazado'
  AND p.pagado_en BETWEEN '2026-02-01' AND '2026-02-28'
GROUP BY c.id, c.nombre;
\`\`\`

## Useful data
- States in \`pagos_tarjeta\`: aceptado (accepted), rechazado (rejected), devuelto (refunded).
- \`comercio_categorias(comercio_id, categoria)\`: one row per category of the merchant.`,
    },
  },
  sqlLab: {
    starter: '-- What the report says today\nSELECT *\nFROM informe_comercios_febrero\nORDER BY comercio_id;',
    retos: {
      oraculo: {
        title: 'The correct report',
        description: "Write the report yourself according to the **specification**, without looking at the view: for **every merchant**, `comercio_id`, `pagos` (accepted in February 2026, the whole 28th included) and `total` (0 if there are none).",
        hint: "`FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id AND p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01'`, `COUNT(p.id)` and `COALESCE(SUM(p.importe), 0)`.",
      },
      diferencias: {
        title: "The merchants that don't add up",
        description: "The merchants where the report **doesn't match** the correct one (in payments or total), **including** the ones the report leaves out: `comercio_id`, `pagos_informe`, `pagos_correcto`, `total_informe` and `total_correcto`.",
        hint: 'The oracle in a WITH, `LEFT JOIN informe_comercios_febrero i` and `WHERE i.pagos IS DISTINCT FROM ok.pagos OR i.total IS DISTINCT FROM ok.total`.',
      },
      contados_de_mas: {
        title: 'Payments the report counts and shouldn\'t',
        description: "The payments that pass the report's filter (`estado <> 'rechazado'` and `BETWEEN '2026-02-01' AND '2026-02-28'`) but are **not** **accepted**: `id` and `estado`.",
        hint: "`WHERE estado NOT IN ('aceptado', 'rechazado') AND pagado_en BETWEEN '2026-02-01' AND '2026-02-28'`.",
      },
      fuera_por_fecha: {
        title: 'Payments from the 28th left out',
        description: "The **accepted February** payments that the report **leaves out** because of its date filter: `id` and `pagado_en`.",
        hint: "Those on the 28th after 00:00: `pagado_en > '2026-02-28' AND pagado_en < '2026-03-01'`.",
      },
      categorias_repetidas: {
        title: 'Merchants the JOIN duplicates',
        description: "The merchants with **more than one** row in `comercio_categorias` (the report's JOIN repeats their payments): `comercio_id` and `categorias`.",
        hint: '`GROUP BY comercio_id HAVING COUNT(*) > 1`.',
      },
      ausentes: {
        title: "Merchants that don't appear in the report",
        description: "The merchants that **don't appear** in the report: `comercio_id` and `nombre`.",
        hint: '`FROM comercios c WHERE NOT EXISTS (SELECT 1 FROM informe_comercios_febrero i WHERE i.comercio_id = c.id)`.',
      },
    },
  },
  bugs: {
    'C-MARTA': { title: "Management decides with a report that doesn't add up for six merchants", explanation: 'Nobody compared the report with an independent result.', technique: 'Oracle + IS DISTINCT FROM merchant by merchant.' },
    'C-CARMEN': { title: 'Merchants with refunds seem to sell more than they do', explanation: "The filter \"<> 'rechazado'\" lets refunded payments through.", technique: 'Test every state, not only the normal one.' },
    'C-NURIA': { title: "Four payments from the last day don't appear in the report", explanation: 'BETWEEN with dates cuts off the 28th at 00:00.', technique: 'Cases at the last instant of the period.' },
    'C-DIEGO': { title: 'Electrónica Voltio shows double what it sold', explanation: 'It has two categories and the JOIN repeats its payments.', technique: 'Check the cardinality of every JOIN.' },
    'C-INES': { title: "The florist disappears from the committee's report", explanation: 'With no February payments and no category, the JOIN leaves it out.', technique: 'Rows that must appear even at zero.' },
    'C-COPIA': { title: 'The report tests always pass, with its errors inside', explanation: 'The expected result was calculated with the same query as the report.', technique: 'Independent oracle, written from the specification.' },
    'C-CASOS': { title: 'A "tested" report fails as soon as the data changes', explanation: 'It was tested with three merchants without refunds, without payments on the 28th and with one category.', technique: 'One test case for each class of data that can break it.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: 'What happened with the merchant report.',
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's committee", explanation: 'Report compared with the oracle.' },
      1: { label: "Carmen's refunds", explanation: 'Only the accepted ones.' },
      2: { label: "Nuria's 28th", explanation: 'The whole last day.' },
      3: { label: "Diego's JOIN", explanation: 'No repeated rows.' },
      4: { label: "Inés's merchants", explanation: 'All of them, even at zero.' },
      5: { label: 'Independent oracle', explanation: 'From the specification.' },
      6: { label: 'Cases that break', explanation: 'One class of data, one case.' },
    },
  },
  concepts: {
    oraculo: { title: 'The oracle', summary: 'The correct result, calculated independently from the specification.' },
    diferencias: { title: 'Comparing report and oracle', summary: 'LEFT/FULL JOIN on the key and IS DISTINCT FROM on each column; the missing rows too.' },
    aislar_causa: { title: 'Isolating the cause', summary: 'For each difference, a query that shows the rows that produce it.' },
    clases: { title: 'Classes of data', summary: 'Each state, each kind of row: one test case for each class the report treats differently.' },
    frontera_informe: { title: 'Period boundaries', summary: 'The first and last instant of the period are mandatory test cases.' },
    cardinalidad: { title: 'JOIN cardinality', summary: 'If a joined table has several rows per key, the report repeats and over-sums.' },
    filas_cero: { title: 'Rows at zero', summary: "An INNER JOIN loses what has no match; what must appear at zero needs a LEFT JOIN." },
  },
  seniorTips: [
    "Read the report's specification and SQL in the wiki.",
    'Laura: comercios LEFT JOIN pagos with the conditions in the ON, COUNT(p.id) and COALESCE(SUM(p.importe), 0).',
    'Marta: the oracle in a WITH, LEFT JOIN to the report and IS DISTINCT FROM on pagos and total.',
    "Carmen: estado NOT IN ('aceptado', 'rechazado') with the report's same BETWEEN.",
    "Nuria: accepted with pagado_en > '2026-02-28' AND < '2026-03-01'.",
    'Diego: comercio_categorias GROUP BY comercio_id HAVING COUNT(*) > 1.',
    'Inés: comercios NOT EXISTS in the report.',
    "With Laura: an oracle that doesn't copy the report and cases that cover each kind of data.",
  ],
  lessons: {
    oraculo: {
      question: 'What is an oracle and where does it come from?',
      body: `The **oracle** is the correct result you compare against. For a report, a query you write yourself **from the specification**, not from the report's SQL:

\`\`\`
SELECT c.id AS comercio_id, COUNT(p.id) AS pagos, COALESCE(SUM(p.importe), 0) AS total
FROM comercios c
LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id
  AND p.estado = 'aceptado'
  AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01'
GROUP BY c.id;
\`\`\`

If you copy it from the report, you copy its errors and the test always passes.`,
    },
    diferencias: {
      question: 'How do I compare the report with the oracle?',
      body: `On the key, starting from the oracle (which has every row) and with IS DISTINCT FROM:

\`\`\`
WITH ok AS (…oracle…)
SELECT ok.comercio_id, i.pagos, ok.pagos, i.total, ok.total
FROM ok LEFT JOIN informe_comercios_febrero i ON i.comercio_id = ok.comercio_id
WHERE i.pagos IS DISTINCT FROM ok.pagos OR i.total IS DISTINCT FROM ok.total;
\`\`\`

That way the merchants the report leaves out also come out (all NULL on its side). If the report could bring extra rows, you need a FULL JOIN.`,
    },
    aislar_causa: {
      question: 'I know which merchants fail. Now what?',
      body: `Now the **cause**. Read the report's SQL and, for each suspicious condition, write the query that shows the affected rows:

- \`estado <> 'rechazado'\` → which non-rejected payments aren't accepted either?
- \`BETWEEN … '2026-02-28'\` → which payments from the 28th are left out?
- \`JOIN comercio_categorias\` → which merchants have several rows?
- \`JOIN\` in general → which merchants have no match?

A defect with its cause and its rows gets fixed in an afternoon. "The report doesn't add up", in a week.`,
    },
    clases: {
      question: 'What test cases does a report need?',
      body: `One for each **class** of data the report treats differently:

| Class | Case |
|---|---|
| Each state | one accepted, one rejected, one refunded |
| Period | the first and last instant, one just outside |
| Relationships | a merchant without payments, one with one category, one with two, one without a category |

Testing with "three normal merchants" only tests the normal class. The errors live in the others.`,
    },
    frontera_informe: {
      question: 'Which dates do I test in a monthly report?',
      body: `The boundaries:

- The **first instant** of the month (\`2026-02-01 00:00\`).
- The **last instant** (\`2026-02-28 23:59\`).
- Just outside, on each side (\`2026-01-31 23:59\` and \`2026-03-01 00:00\`).

A \`BETWEEN '2026-02-01' AND '2026-02-28'\` passes every case except the afternoon of the 28th, which is exactly the one missing from "normal" test data.`,
    },
    cardinalidad: {
      question: 'Why can a JOIN duplicate a merchant?',
      body: `The report joins the payments with \`comercio_categorias\`. If a merchant has **two** categories, each payment comes out **twice**: \`COUNT\` and \`SUM\` double.

Before accepting a JOIN, ask how many rows per key the joined table has:

\`\`\`
SELECT comercio_id, COUNT(*) FROM comercio_categorias
GROUP BY comercio_id HAVING COUNT(*) > 1;
\`\`\`

And if the report uses nothing from that table, the JOIN isn't needed.`,
    },
    filas_cero: {
      question: 'Why do merchants disappear from the report?',
      body: `Because the report starts from \`pagos_tarjeta\` and does a JOIN: a merchant with **no payments** in February has no rows to come from. And the JOIN with categories also removes those without a category.

If the specification says "every merchant", the report has to **start from comercios** and join the payments with a LEFT JOIN, with the payment conditions in the \`ON\` (in the WHERE they would turn the LEFT JOIN into a plain JOIN).`,
    },
  },
  quiz: {
    pre: {
      q6pre_oraculo: { question: "Where do you get a report's expected result from?", options: ['From the report itself', 'From the specification, with an independent query', "From last month's report", 'From whatever Product says in the meeting'], explanation: 'If you copy the report, you copy its errors.' },
      q6pre_dif: { question: 'To compare report and oracle per merchant, which comparison do you use?', options: ['<>', 'IS DISTINCT FROM', '=', 'LIKE'], explanation: 'A missing merchant gives NULL in the report.' },
      q6pre_clases: { question: 'What cases does a report of accepted payments need?', options: ['Only accepted payments', 'A payment in each state: accepted, rejected, refunded', 'Lots of accepted payments', 'None'], explanation: 'Each state is a class.' },
      q6pre_card: { question: 'A merchant has two categories and the report joins with categories. What happens to its payments?', options: ['Nothing', 'They come out twice', 'They disappear', "They're added to another merchant"], explanation: 'And COUNT and SUM double.' },
      q6pre_cero: { question: "The report starts from payments with a JOIN to merchants. Which merchants don't appear?", options: ['None', 'Those without payments in the period', 'The ones that sell the most', 'The ones in Madrid'], explanation: 'You have to start from merchants.' },
      q6pre_front: { question: 'Which date case is mandatory in a February report?', options: ['15 February', '28 February, late in the day', '1 January', 'None'], explanation: 'The last instant of the period.' },
    },
    post: {
      q6post_on: { question: "In a LEFT JOIN from merchants to payments, where does `p.estado = 'aceptado'` go?", options: ['In the WHERE', 'In the ON', 'In the GROUP BY', "It doesn't matter"], explanation: 'In the WHERE it would remove the merchants without payments.' },
      q6post_copia: { question: "Rubén's test compares the report with the report's own query. What does it find?", options: ['Every error', 'None: they always match', 'Only the date ones', 'Only the state ones'], explanation: 'Independent oracle.' },
      q6post_estado: { question: "`WHERE estado <> 'rechazado'` in a report of accepted payments. What does it let through?", options: ['Nothing', 'The refunded ones', 'The rejected ones', 'Those from another month'], explanation: 'Better to say what you want: estado = aceptado.' },
      q6post_count: { question: 'Why `COUNT(p.id)` and not `COUNT(*)` in the oracle?', options: ["It's faster", 'So a merchant without payments counts 0 and not 1', "It doesn't matter", "COUNT(*) doesn't exist"], explanation: 'With a LEFT JOIN, the merchant without payments has one row with p.id NULL.' },
      q6post_casos: { question: 'The report was tested with three merchants that only have accepted payments mid-month. What has not been tested?', options: ['Nothing', 'Refunds, the last day, merchants without payments or with several categories', 'The total', 'The names'], explanation: 'Only the normal class.' },
      q6post_card: { question: "How do you detect that a report's JOIN can duplicate rows?", options: ['Looking at the total', 'Counting rows per key in the joined table', 'With EXPLAIN', "You can't"], explanation: 'GROUP BY key HAVING COUNT(*) > 1.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: "The committee's report",
      body: "Good morning.\n\nOn Thursday Management decides with the February merchant report Diego built (`informe_comercios_febrero`). Before that, we test it. The specification and the view's SQL are in the wiki.\n\nFirst we need something to compare against:\n\n- Write the report **yourself** according to the specification, **without copying the view**: for every merchant, `comercio_id`, `pagos` and `total`.\n\nLaura",
    },
    laura_ok: { body: "Twenty-two merchants, the florist at zero included. That's the oracle. Now, let's compare it with the view." },
    marta_diferencias: {
      body: "Hi! I need to know which merchants **don't add up** between Diego's report and the correct one, including the ones the report doesn't even bring: `comercio_id`, `pagos_informe`, `pagos_correcto`, `total_informe` and `total_correcto`.",
    },
    marta_thanks: { body: 'Six merchants out of twenty-two. If this reaches the committee, we decide wrong. Do you know why each one fails?' },
    carmen_devueltos: {
      body: "Hi. The report filters with `estado <> 'rechazado'`. Something smells off: which payments pass that filter (and the report's date filter) and are **not** accepted? `id` and `estado`.",
    },
    carmen_thanks: { body: 'Three refunds counted as sales: 403, 413 and 423. Thanks.' },
    laura_copia: {
      subject: '11:00 · Laura: "the automated report test passes"',
      body: '**Laura:** Rubén already had an automated test for this report: it calculates the expected result with… the same SQL as the view, "so as not to make mistakes writing it". And it always passes. What do you tell him?',
      choices: {
        independiente: {
          text: "That an oracle copied from the report has **the same errors** as the report, so they always match: the test can never fail. The expected result is written **from the specification**, independently, even if it takes longer.",
          reply: "Exactly. A test that can't fail tests nothing.",
          effects: { 2: { text: 'The oracle is written from the specification, not from the code.' } },
        },
        ok: {
          text: "That it's fine: that way the test never raises false alarms.",
          reply: 'It never raises real ones either. Today the report has four errors and its test is green.',
          effects: { 0: { text: 'You accepted an oracle that copies the code.' } },
        },
        manual: {
          text: "That he'd better review it by eye every month.",
          reply: "By eye you don't see the afternoon of the 28th or a repeated category. You need an oracle, but an independent one.",
          effects: { 0: { text: 'You swapped a bad automated test for a review by eye.' } },
        },
      },
    },
    nuria_fecha: {
      body: "Hi. Several merchants have complained that their sales from the last day don't show up. Which **accepted February** payments does the report's date filter leave out? `id` and `pagado_en`.",
    },
    nuria_thanks: { body: 'Four payments from the 28th, from four merchants. Now I can answer them. Thanks!' },
    diego_categorias: {
      body: 'Hey. Electrónica Voltio shows more payments than it had, and I suspect my JOIN with `comercio_categorias`. Which merchants have **more than one** category? `comercio_id` and `categorias`.',
    },
    diego_thanks: { body: "Number 14, with two. And the JOIN doesn't even use the category for anything: I'm removing it. Thanks!" },
    ines_ausentes: {
      body: "Hi. The specification says **every** merchant, even at zero. Which ones **don't appear** in the report? `comercio_id` and `nombre`.",
    },
    ines_thanks: { body: 'The florist: no payments in February and, on top of that, no category. The report loses it for both reasons. Thanks.' },
    laura_casos: {
      subject: '15:00 · Laura: "I tested it with three merchants"',
      body: "**Laura:** Diego says that, before handing it over, he tested the report by hand with three merchants (1, 8 and 12) and they added up. And it's true, they do. Why didn't he see anything?",
      choices: {
        casos: {
          text: "Because all three are from the **normal class**: only accepted payments, none on the afternoon of the 28th, a single category and with payments. Each error in the report lives in another class (refunds, last day, several categories, no payments or no category). You need one test case for each class the report treats differently.",
          reply: "That's it. Three cases of the same class are one case repeated three times.",
          effects: { 3: { text: 'One test case for each class of data.' } },
        },
        mas: {
          text: "Because three is too few: he should test with ten at random.",
          reply: "Ten at random can still all be normal. It's not how many, it's which ones.",
          effects: { 0: { text: 'You trusted quantity instead of choosing the cases.' } },
        },
        mala_suerte: {
          text: 'Bad luck: he happened to pick exactly the ones that were right.',
          reply: "It's not luck: the normal cases are almost always right. That's why you have to pick the ones that aren't.",
          effects: { 0: { text: 'You blamed luck for a poor case design.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Laura',
      body: '**Laura:** One report, six merchants wrong, four causes. What are you taking away?',
      choices: {
        lesson: {
          text: "That a report is tested against an independent oracle, written from the specification; that it's compared row by row with IS DISTINCT FROM, including the missing rows; that each difference has a cause you isolate with a query; and that test cases are chosen by class: each state, the period boundaries, the JOINs that multiply and the rows at zero.",
          reply: 'Very good. Tomorrow, things that change state: orders with their history.',
        },
        total: {
          text: "That it's enough to check that the report's total matches the database's.",
          reply: "The total didn't match… and even if it did, it could hide errors that cancel each other out. Check the debrief.",
          effects: { 0: { text: 'You came away with checking only the total.' } },
        },
      },
    },
  },
})
