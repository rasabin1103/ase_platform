import { m04Conciliar } from '../m04-conciliar'
import { COMMON_EN, missionEn } from './missionEn'

const FEB = "p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01'"

/** Course 8: SQL for QA · Mission 4 — Reconciling two sources. English version of ../m04-conciliar.ts. */
export const m04ConciliarEn = missionEn(m04Conciliar, {
  ...COMMON_EN,
  title: 'Reconciling two sources',
  subtitle: "What's missing, what's extra and what doesn't match between two sources that should say the same thing.",
  dayLabel: 'Friday · month 4',
  verdicts: {
    good: {
      title: 'The two sources, row by row',
      body: "Two payments not settled, a payment that doesn't exist, an amount €10 too high (and a cent that wasn't an error), a payment settled twice, a refunded one that was charged anyway and the five days that don't add up. And the 6th, which matched to the cent, had two errors.",
    },
    ok: { title: 'Reconciliation, halfway there', body: 'You already compare two sources, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: "The month-end close doesn't add up", body: 'Several tasks were left undone. Replay the mission with the reconciliation cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Reconciling two sources',
    paragraphs: [
      "Friday, February close. The card processor has sent its **settlement** (`liquidaciones`): what it says it collected for each payment. It has to match February's **accepted** payments in `pagos_tarjeta`.",
      'Today you reconcile the two sources. Each task is done when the query returns exactly the rows and columns asked for.',
    ],
    goals: [
      "Find what's in one source and missing from the other, in both directions.",
      'Compare amounts with a tolerance.',
      "Find what's repeated in one source.",
      "Find what shouldn't be there.",
      'Compare daily totals with FULL OUTER JOIN.',
      "Know why a total that matches proves nothing.",
    ],
  },
  docs: {
    chuleta_conciliar: {
      title: 'Cheat sheet: reconciling two sources',
      updatedLabel: 'Laura Méndez · QA',
      body: `## The two sources
| Kobalto | Processor |
|---|---|
| \`pagos_tarjeta\` (accepted, February 2026) | \`liquidaciones(lote, pago_id, fecha_operacion, importe)\` |

## What to look for
| Difference | How |
|---|---|
| Missing from the settlement | \`NOT EXISTS\` from the payments |
| Extra in the settlement | \`NOT EXISTS\` from the settlement |
| Different amount | \`JOIN\` and \`abs(a - b) > tolerance\` |
| Repeated | \`GROUP BY … HAVING COUNT(*) > 1\` |
| Shouldn't be there | \`JOIN\` with the status |
| Daily totals | aggregate each side and \`FULL OUTER JOIN\` with \`COALESCE(…, 0)\` |

## Tolerance agreed with the processor
Differences of **up to 1 cent** per payment are their rounding and **don't** count.`,
    },
  },
  sqlLab: {
    starter: "-- What the processor says\nSELECT lote, pago_id, fecha_operacion, importe\nFROM liquidaciones\nORDER BY fecha_operacion, pago_id\nLIMIT 15;",
    retos: {
      faltan: {
        title: 'Payments not settled',
        description: "The **accepted payments of February 2026** that **don't appear** in `liquidaciones`: one column `id`.",
        hint: `\`WHERE ${FEB} AND NOT EXISTS (SELECT 1 FROM liquidaciones l WHERE l.pago_id = p.id)\`.`,
      },
      sobran: {
        title: "Settlements of payments that don't exist",
        description: "The rows of `liquidaciones` whose `pago_id` **doesn't exist** in `pagos_tarjeta`: `pago_id` and `importe`.",
        hint: '`FROM liquidaciones l WHERE NOT EXISTS (SELECT 1 FROM pagos_tarjeta p WHERE p.id = l.pago_id)`.',
      },
      importes_distintos: {
        title: "Amounts that don't match",
        description: "The settled payments with an amount that differs from Kobalto's by **more than 1 cent** (the agreed tolerance): `pago_id`, `importe_app` and `importe_liquidado`.",
        hint: '`JOIN liquidaciones l ON l.pago_id = p.id WHERE abs(l.importe - p.importe) > 0.01`.',
      },
      duplicados: {
        title: 'Payments settled more than once',
        description: 'The `pago_id` values that appear **more than once** in `liquidaciones`: `pago_id` and `veces` (times).',
        hint: '`GROUP BY pago_id HAVING COUNT(*) > 1`.',
      },
      no_aceptados: {
        title: 'Settled, but not accepted',
        description: 'The payments the processor has settled that at Kobalto are **not** **accepted**: `pago_id` and `estado`.',
        hint: "`FROM liquidaciones l JOIN pagos_tarjeta p ON p.id = l.pago_id WHERE p.estado <> 'aceptado'`.",
      },
      dias_descuadrados: {
        title: "The days that don't add up",
        description: "Per day: the total of **February's accepted** payments according to Kobalto (by the payment date) and the settled total (by `fecha_operacion`). Only the days on which they **don't match**, including when a day only exists on one side: `fecha`, `total_app` and `total_liquidado` (0 if there's nothing).",
        hint: 'Aggregate each side by date in a WITH and join them with `FULL OUTER JOIN … ON l.fecha = a.fecha`, with `COALESCE(…, 0)`.',
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'Kobalto pays a merchant for a payment that never existed', explanation: "The settlement carried a pago_id that isn't at Kobalto.", technique: 'NOT EXISTS from the settlement.' },
    'C-CARMEN': { title: 'A merchant collects €10 too much on a payment', explanation: 'Nobody compared the amounts payment by payment.', technique: 'JOIN and difference with tolerance.' },
    'C-NURIA': { title: "A customer sees the same payment charged twice on their bank statement", explanation: 'The processor settled the payment twice.', technique: 'GROUP BY … HAVING COUNT(*) > 1.' },
    'C-DIEGO': { title: 'A payment already refunded to the customer is settled to the merchant', explanation: "Kobalto's status wasn't crossed with the settlement.", technique: "JOIN with the payment's status." },
    'C-INES': { title: "February's close is signed off with five days out of balance", explanation: "Only the month's total was looked at.", technique: 'Daily totals with FULL OUTER JOIN.' },
    'C-COMPENSA': { title: "The 6th \"matches\" and has a payment not settled and another that doesn't exist", explanation: 'Two errors of the same amount cancelled each other out in the total.', technique: 'Reconcile row by row; totals only as a summary.' },
    'C-JOIN': { title: 'The automated reconciliation says "all correct" and payments are missing', explanation: "A normal JOIN only compares what's on both sides.", technique: 'FULL OUTER JOIN or EXCEPT in both directions.' },
  },
  prevention: {
    title: 'At the end of the week',
    intro: "What happened with February's close.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's payments", explanation: "Nothing that doesn't exist." },
      1: { label: "Carmen's amounts", explanation: 'With a 1-cent tolerance.' },
      2: { label: "Nuria's customers", explanation: 'One settlement per payment.' },
      3: { label: "Diego's refunds", explanation: 'Only accepted payments.' },
      4: { label: "Inés's close", explanation: 'Day by day.' },
      5: { label: 'Row by row', explanation: 'Totals hide things.' },
      6: { label: 'Both sides', explanation: "What's only on one." },
    },
  },
  concepts: {
    conciliar: { title: 'Reconciling', summary: 'Comparing two sources that should say the same thing and explaining each difference.' },
    faltan_sobran: { title: "What's missing and what's extra", summary: 'NOT EXISTS (or EXCEPT) in both directions: from A to B and from B to A.' },
    tolerancia: { title: 'Tolerance', summary: "abs(a − b) > margin: agreed differences (rounding) aren't errors." },
    repetidos: { title: 'Repeats in one source', summary: 'GROUP BY key HAVING COUNT(*) > 1 before comparing.' },
    estado_cruce: { title: 'Crossing with the status', summary: "Being in both sources isn't enough: it has to be in the right status." },
    full_join: { title: 'FULL OUTER JOIN', summary: "Joins both sides and keeps what's only on one; COALESCE sets 0 for what's missing." },
    compensacion: { title: 'Errors that cancel out', summary: 'An equal total can hide one payment too few and another one too many of the same amount.' },
  },
  seniorTips: [
    'Read the reconciliation cheat sheet in the wiki.',
    "Laura: February's accepted payments with NOT EXISTS in liquidaciones.",
    'Marta: liquidaciones with NOT EXISTS in pagos_tarjeta.',
    'Carmen: JOIN and abs(l.importe − p.importe) > 0.01.',
    'Nuria: GROUP BY pago_id HAVING COUNT(*) > 1.',
    "Diego: JOIN with pagos_tarjeta and p.estado <> 'aceptado'.",
    'Inés: two aggregates per date, FULL OUTER JOIN and COALESCE(…, 0).',
    'With Laura: row by row and in both directions.',
  ],
  lessons: {
    conciliar: {
      question: 'What is reconciling?',
      body: `Comparing two sources that should tell the same story (Kobalto and the processor, the app and the report, the source and the target of a load) and **explaining each difference**.

Differences are always of one of these kinds:

1. It's in A and **missing** from B.
2. It's in B and **extra** (not in A).
3. It's in both with **different values**.
4. It's **repeated** in one.
5. It's in both, but **shouldn't be** (wrong status).`,
    },
    faltan_sobran: {
      question: 'Why look in both directions?',
      body: `"All my payments are settled" says nothing about what the processor settled that isn't yours.

\`\`\`
-- Missing: at Kobalto and not in the settlement
SELECT p.id FROM pagos_tarjeta p WHERE … AND NOT EXISTS (SELECT 1 FROM liquidaciones l WHERE l.pago_id = p.id);
-- Extra: in the settlement and not at Kobalto
SELECT l.pago_id FROM liquidaciones l WHERE NOT EXISTS (SELECT 1 FROM pagos_tarjeta p WHERE p.id = l.pago_id);
\`\`\`

\`EXCEPT\` works too: \`SELECT id FROM … EXCEPT SELECT pago_id FROM …\`, in both orders.`,
    },
    tolerancia: {
      question: 'Why a tolerance?',
      body: `Because some differences are **expected**: the processor rounds its own way and may be off by a cent. If you count them as errors, the reconciliation fills up with noise and nobody looks at it.

\`\`\`
WHERE abs(l.importe - p.importe) > 0.01
\`\`\`

The tolerance isn't made up: it's **agreed** and written down. And it's measured as an absolute value: a cent more or a cent less is the same.`,
    },
    repetidos: {
      question: 'What if a source has repeats?',
      body: `A JOIN multiplies them and an existence comparison doesn't see them (the payment "is there"). You have to look for them separately:

\`\`\`
SELECT pago_id, COUNT(*) AS veces
FROM liquidaciones
GROUP BY pago_id
HAVING COUNT(*) > 1;
\`\`\`

A repeated settlement is money collected twice.`,
    },
    estado_cruce: {
      question: 'Is it enough for the payment to be in both sources?',
      body: `No. It has to be in the right **status**. A payment **refunded** to the customer shouldn't be settled to the merchant:

\`\`\`
SELECT l.pago_id, p.estado
FROM liquidaciones l
JOIN pagos_tarjeta p ON p.id = l.pago_id
WHERE p.estado <> 'aceptado';
\`\`\`

A reconciliation that only looks at ids and amounts doesn't see it.`,
    },
    full_join: {
      question: 'How do I compare totals when a day only exists on one side?',
      body: `Aggregate each side and join them with **FULL OUTER JOIN**, which keeps the rows of both even if they have no partner:

\`\`\`
WITH app AS (SELECT pagado_en::date AS fecha, SUM(importe) AS total FROM … GROUP BY 1),
     liq AS (SELECT fecha_operacion AS fecha, SUM(importe) AS total FROM liquidaciones GROUP BY 1)
SELECT COALESCE(a.fecha, l.fecha) AS fecha,
       COALESCE(a.total, 0) AS total_app,
       COALESCE(l.total, 0) AS total_liquidado
FROM app a FULL OUTER JOIN liq l ON l.fecha = a.fecha
WHERE COALESCE(a.total, 0) <> COALESCE(l.total, 0);
\`\`\`

Aggregating **before** joining stops the rows of one side from multiplying those of the other.`,
    },
    compensacion: {
      question: 'If the total matches, is everything fine?',
      body: `No. An unsettled €54.78 payment and a €54.78 settlement of a payment that doesn't exist give **the same total**. Two errors, zero difference.

Totals are useful as a **summary** and to find quickly where to look. But the real reconciliation is **row by row**: missing, extra, different, repeated.`,
    },
  },
  quiz: {
    pre: {
      q4pre_conc: { question: 'What is reconciling two sources?', options: ['Copying one into the other', 'Comparing them and explaining each difference', 'Adding them up', 'Deleting the duplicates'], explanation: 'Missing, extra, different, repeated…' },
      q4pre_sentido: { question: "You've checked that all your payments are in the settlement. What's left?", options: ['Nothing', "Checking that the settlement has no payments that aren't yours", 'Sorting', 'Counting'], explanation: 'Both directions.' },
      q4pre_tol: { question: 'The processor rounds and is sometimes off by a cent. How do you compare?', options: ['l.importe <> p.importe', 'abs(l.importe - p.importe) > 0.01', 'ROUND(l.importe) = ROUND(p.importe)', "You don't compare"], explanation: 'With the agreed tolerance.' },
      q4pre_rep: { question: 'How do you find payments settled twice?', options: ['DISTINCT', 'GROUP BY pago_id HAVING COUNT(*) > 1', 'NOT EXISTS', 'ORDER BY'], explanation: 'Before comparing them with anything.' },
      q4pre_full: { question: 'Which JOIN keeps the rows of both sides even without a partner?', options: ['JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'], explanation: 'With COALESCE for the gaps.' },
      q4pre_comp: { question: "The month's total matches to the cent. What can you conclude?", options: ['That there are no differences', 'That there may be errors that cancel out', 'That the settlement is correct', 'That a day is missing'], explanation: 'You have to go down to the rows.' },
    },
    post: {
      q4post_inner: { question: 'You compare daily totals with a normal JOIN. Which day gets lost?', options: ['None', 'One that only has settlements (or only payments)', 'The first', 'The last'], explanation: 'The JOIN only returns the days with a partner.' },
      q4post_estado: { question: 'A refunded payment appears in the settlement with its correct amount. Is that a problem?', options: ['No', "Yes: it shouldn't be settled", 'Only if the amount is different', 'Only if it is repeated'], explanation: 'The status matters.' },
      q4post_except: { question: 'What does `SELECT pago_id FROM liquidaciones EXCEPT SELECT id FROM pagos_tarjeta` return?', options: ["The missing ones", "The settled ones that don't exist at Kobalto", 'The repeated ones', 'All of them'], explanation: "What's extra in the settlement." },
      q4post_tol: { question: "Where does a reconciliation's tolerance come from?", options: ['From whatever comes out in the test', 'From a written agreement with the other party', "From the table's size", 'It is always 0'], explanation: "It isn't made up." },
      q4post_comp: { question: 'The 6th matches. How do you find that it has an unsettled payment and an extra one?', options: ['By looking at the total', 'By reconciling row by row', "You can't", 'With an index'], explanation: 'Totals hide things.' },
      q4post_agg: { question: 'Why aggregate each side before the FULL JOIN?', options: ['For looks', "So that one side's rows don't multiply the other's", "Because FULL JOIN doesn't allow SUM", "It doesn't matter"], explanation: 'A day with 3 payments and 3 settlements would give 9 rows.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: 'February close',
      body: "Good morning, last day of the week.\n\nThe card processor has sent the **February settlement** (`liquidaciones`): what it says it collected for each payment. It has to match our **accepted** February payments. Today it's about **reconciling**.\n\nFirst:\n\n- The accepted payments of February 2026 that **don't** appear in the settlement: one column `id`.\n\nLaura",
    },
    laura_ok: {
      body: "406 and 418 not settled. Now look in the other direction: is there anything in the settlement that isn't ours?",
    },
    marta_sobran: {
      body: "Hi! Laura asked me to look at the other side: are there rows in `liquidaciones` with a `pago_id` that **doesn't exist** among our payments? `pago_id` and `importe`.",
    },
    marta_thanks: { body: "A payment 999 of €54.78 that doesn't exist. I'll claim it from the processor. Thanks!" },
    carmen_importes: {
      body: 'Hi. Now the amounts: payments settled with an amount different from ours by **more than 1 cent** (that\'s the tolerance we have signed for their rounding). `pago_id`, `importe_app` and `importe_liquidado`.',
    },
    carmen_thanks: { body: "415: €28.95 ours and 38.95 settled. 410 is off by a cent, but that's within what was signed. Thanks." },
    laura_totales: {
      subject: '11:00 · Laura: "the 6th matches to the cent"',
      body: '**Laura:** Rubén reconciled by daily totals and says the **6th** matches to the cent, so that day "doesn\'t need looking at". But 406, which isn\'t settled, is from the 6th. How can it match?',
      choices: {
        fila: {
          text: "Because that same day the processor settled payment **999**, which doesn't exist, for **the same amount** (€54.78). One payment too few and one too many: the errors **cancel each other out** in the total. Totals are useful to summarise, but the reconciliation has to be row by row.",
          reply: "Exactly. A total that matches doesn't prove there are no errors; only that, if there are any, they add up to zero.",
          effects: { 2: { text: 'Reconcile row by row: totals hide errors that cancel out.' } },
        },
        tarde: {
          text: 'Because 406 will be settled on another day.',
          reply: "It could be… but then the 6th wouldn't match, which is exactly what's odd. There's something else that day.",
          effects: { 0: { text: 'You explained a difference without looking at the rows.' } },
        },
        ok: {
          text: "If the total matches, the day is fine: there's no need to look at it.",
          reply: "That day has an unsettled payment and another one that doesn't exist. Two errors that add up to zero.",
          effects: { 0: { text: 'You accepted a day because the total matched.' } },
        },
      },
    },
    nuria_duplicados: {
      body: 'Hi. A customer says a payment appears twice on their bank statement. Are there payments **settled more than once**? `pago_id` and `veces`.',
    },
    nuria_thanks: { body: "420, twice. It's exactly the customer's one. Thanks!" },
    diego_estados: {
      body: "Hey. If a payment is **refunded** to the customer, the processor shouldn't settle it to the merchant. Are there settled payments that at Kobalto are **not** accepted? `pago_id` and `estado`.",
    },
    diego_thanks: { body: '413, refunded and settled. We paid it twice: to the customer and to the merchant. Thanks!' },
    ines_dias: {
      body: "Hi. For the close report I want the **days that don't add up**: the total of February's accepted payments by payment date and the settled total by `fecha_operacion`. Only the different days, including when a day only exists on one side. `fecha`, `total_app` and `total_liquidado` (0 if there's nothing).",
    },
    ines_thanks: { body: "Five days, each with its explanation from this morning. The 6th doesn't come out: there the two errors cancel out. Thanks." },
    laura_join: {
      subject: '15:00 · Laura: "the automated reconciliation says everything is fine"',
      body: '**Laura:** Rubén has automated the reconciliation:\n\n`SELECT … FROM pagos_tarjeta p JOIN liquidaciones l ON l.pago_id = p.id WHERE l.importe <> p.importe`\n\nIf it returns zero rows, he signs off the day. What doesn\'t it see?',
      choices: {
        lados: {
          text: "Everything that's only on **one side**: the JOIN keeps only the payments that are in both sources. The two unsettled ones and 999 disappear without warning. You have to look in both directions (NOT EXISTS or EXCEPT) or use a FULL OUTER JOIN. And it's missing the tolerance: 410 would come out as an error.",
          reply: "That's it. The most dangerous reconciliation is the one that says \"zero differences\" because it doesn't look where they are.",
          effects: { 3: { text: 'A reconciliation looks at both sides, not only at what matches.' } },
        },
        left: {
          text: 'That he should change the JOIN to a LEFT JOIN from the payments.',
          reply: "That way he'd see the unsettled payments, but he still wouldn't see what's extra in the settlement, like 999.",
          effects: { 0: { text: 'You fixed one direction and forgot the other.' } },
        },
        ok: {
          text: "Nothing: if there are no different amounts, it's reconciled.",
          reply: "Two payments are missing and one is extra, and his query doesn't see them. Zero rows isn't the same as zero differences.",
          effects: { 0: { text: 'You trusted a reconciliation that only looks at what matches.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the week with Laura',
      body: '**Laura:** Week done: verifying, edge cases, test data, assertions and today reconciling. What are you taking away from today?',
      choices: {
        lesson: {
          text: "That reconciling is explaining each difference: what's missing and what's extra (in both directions), amounts with an agreed tolerance, repeats, what's in the wrong status, and daily totals with FULL OUTER JOIN. And that a total that matches proves nothing: you have to go row by row.",
          reply: 'Very good. Next week, a migration: the same thing, but with a whole table that changes shape.',
        },
        totales: {
          text: "That comparing the month's totals is enough.",
          reply: 'Today the 6th matched with two errors inside. Check the debrief.',
          effects: { 0: { text: 'You came away with reconciling by totals.' } },
        },
      },
    },
  },
})
