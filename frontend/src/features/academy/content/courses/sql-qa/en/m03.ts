import { m03CeroFilas } from '../m03-cero-filas'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 8: SQL for QA · Mission 3 — Queries that must return nothing. English version of ../m03-cero-filas.ts. */
export const m03CeroFilasEn = missionEn(m03CeroFilas, {
  ...COMMON_EN,
  title: 'Queries that must return nothing',
  subtitle: 'Data quality assertions: the rows that break a rule, to run every night.',
  dayLabel: 'Thursday · month 4',
  verdicts: {
    good: {
      title: 'Six assertions for the night',
      body: "Transfers to accounts that don't exist, repeated payments, charges on a blocked card, an incident closed before it was opened, a savings account in the red and an approved loan without instalments. Each assertion returns the guilty rows, with no false positives.",
    },
    ok: { title: 'Assertions, halfway there', body: 'You already write assertions, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'The night unwatched', body: 'Several tasks were left undone. Replay the mission with the assertions cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Queries that must return nothing',
    paragraphs: [
      'Thursday. Laura wants a pack of **data assertions** that runs every night: queries that return the rows that **break** a rule. If they return zero rows, all good; if not, each row is a named problem.',
      'Today you write six. Each task is done when the query returns exactly the guilty rows (with the columns asked for) and nothing else.',
    ],
    goals: [
      'Write a rule as a query that returns the rows that break it.',
      'Look for orphans without confusing them with legitimate empty values.',
      'Find exact duplicates and keep only the copies.',
      "Check states that can't go together.",
      'Check impossible dates and balances.',
      'Look for relationships that should exist and are missing.',
    ],
  },
  docs: {
    chuleta_aserciones: {
      title: 'Cheat sheet: data assertions',
      updatedLabel: 'Laura Méndez · QA',
      body: `## What a data assertion is
A query that returns **the rows that break a rule**. The night job runs it and:
- **0 rows** → the rule holds.
- **N rows** → there are N problems, and each row says which one.

## Templates
| Rule | Assertion |
|---|---|
| Every X points to a Y that exists | \`… WHERE x.y_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM y WHERE y.id = x.y_id)\` |
| No copies | \`… WHERE EXISTS (SELECT 1 FROM t o WHERE (same columns) AND o.id < t.id)\` |
| Compatible states | \`… JOIN … WHERE a.estado = 'x' AND b.estado = 'y'\` |
| Date order | \`… WHERE fin < inicio\` |
| Range of values | \`… WHERE tipo = 'x' AND valor < 0\` |
| Every X has some Y | \`… WHERE NOT EXISTS (SELECT 1 FROM y WHERE y.x_id = x.id)\` |

## Kobalto rules
- An empty \`transferencias.cuenta_destino_id\` = a transfer to **another bank** (that's normal).
- **Blocked** cards can't have **accepted** payments.
- **Savings** accounts (\`ahorro\`) can't be in the red (current ones can).
- An **approved** loan has its **instalments**.`,
    },
  },
  sqlLab: {
    starter: "-- An assertion returns the rows that break the rule.\n-- Rule: no incident has an unknown channel.\nSELECT id, canal\nFROM incidencias\nWHERE canal NOT IN ('chat', 'telefono', 'email');",
    retos: {
      destinos_inexistentes: {
        title: "Transfers to accounts that don't exist",
        description: "The transfers with a **destination account** that **doesn't exist** in `cuentas`. Transfers to other banks (empty destination) are normal and **don't** count. Columns: `id` and `cuenta_destino_id`.",
        hint: '`WHERE cuenta_destino_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.id = t.cuenta_destino_id)`.',
      },
      pagos_duplicados: {
        title: 'Repeated payments',
        description: 'The card payments that are an **exact copy** of an earlier one (same card, merchant, amount and time, and a higher `id`). Only the copies, not the originals: one column `id`.',
        hint: '`WHERE EXISTS (SELECT 1 FROM pagos_tarjeta o WHERE o.tarjeta_id = p.tarjeta_id AND … AND o.id < p.id)`.',
      },
      aceptados_bloqueada: {
        title: 'Accepted payments on a blocked card',
        description: 'The **accepted** payments made with a **blocked** card: `id` (of the payment) and `tarjeta_id`.',
        hint: "`JOIN tarjetas t ON t.id = p.tarjeta_id WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado'`.",
      },
      cierre_antes: {
        title: 'Incidents closed before they were opened',
        description: 'The incidents with a **closing date earlier** than the opening one: `id`, `abierta_en` and `cerrada_en`.',
        hint: "`WHERE cerrada_en < abierta_en` (the open ones, with an empty closing date, don't come out by themselves).",
      },
      ahorro_negativo: {
        title: 'Savings accounts in the red',
        description: 'The **savings** accounts with a **negative** balance (current accounts may be): `id` and `saldo`.',
        hint: "`WHERE tipo = 'ahorro' AND saldo < 0`.",
      },
      aprobados_sin_cuotas: {
        title: 'Approved loans without instalments',
        description: 'The **approved** loans that **have no instalment at all**: `id` and `cliente_id`.',
        hint: "`WHERE p.estado = 'aprobado' AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.prestamo_id = p.id)`.",
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'Three customers see a payment charged twice for weeks', explanation: 'Nothing was watching for repeated payments.', technique: 'Copies assertion with EXISTS and o.id < p.id.' },
    'C-CARMEN': { title: 'Payments on a blocked card are accepted and nobody notices', explanation: 'Incompatible states without monitoring.', technique: "Assertion of states that can't go together." },
    'C-NURIA': { title: 'The average resolution time comes out negative in the monthly report', explanation: 'An incident closed before it was opened.', technique: 'Date order assertion.' },
    'C-DIEGO': { title: 'A savings account in the red goes a month without anyone seeing it', explanation: 'The rule was only in the app.', technique: 'Range-of-values assertion per type.' },
    'C-INES': { title: 'An approved loan never starts being collected', explanation: 'It was approved without generating its instalments.', technique: 'Missing relationship assertion (NOT EXISTS).' },
    'C-RUIDO': { title: 'The team stops looking at the data alerts', explanation: 'An assertion with false positives "failed" every night because of the transfers to other banks.', technique: 'Exclude the legitimate cases: each row has to be a real problem.' },
    'C-COUNT': { title: "Rubén's assertions fail every night, whether there are problems or not", explanation: 'They returned a row with the count instead of the guilty rows.', technique: 'Return the rows that break the rule, with their identifier.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Thursday's assertions.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's payments", explanation: 'Copies monitored.' },
      1: { label: "Carmen's cards", explanation: 'Compatible states.' },
      2: { label: "Nuria's incidents", explanation: 'Dates in order.' },
      3: { label: "Diego's accounts", explanation: 'Savings never negative.' },
      4: { label: "Inés's loans", explanation: 'Approved with instalments.' },
      5: { label: 'No false positives', explanation: 'Each row, a real problem.' },
      6: { label: 'Rows, not counts', explanation: 'Zero rows = all good.' },
    },
  },
  concepts: {
    asercion: { title: 'Data assertion', summary: 'A query that returns the rows that break a rule: zero rows = the rule holds.' },
    huerfanos: { title: 'Orphans', summary: "Rows that point to something that doesn't exist; legitimate empty values (another bank) aren't orphans." },
    duplicados: { title: 'Duplicates', summary: 'Exact copies: EXISTS with the same columns and o.id < p.id to keep only the copies.' },
    estados: { title: 'Incompatible states', summary: "Combinations that can't happen: an accepted payment on a blocked card." },
    temporal: { title: 'Impossible dates', summary: 'An end before the start, a future date on something that already happened.' },
    falta_relacion: { title: 'Missing relationships', summary: 'What should have something and has nothing: NOT EXISTS.' },
    falsos_positivos: { title: 'False positives', summary: 'An assertion that warns about correct cases ends up ignored; each row has to be a real problem.' },
  },
  seniorTips: [
    'Read the data assertions cheat sheet in the wiki.',
    'Laura: cuenta_destino_id IS NOT NULL AND NOT EXISTS in cuentas.',
    'Marta: EXISTS with the same four columns and o.id < p.id.',
    "Carmen: JOIN tarjetas, t.estado = 'bloqueada' AND p.estado = 'aceptado'.",
    'Nuria: cerrada_en < abierta_en.',
    "Diego: tipo = 'ahorro' AND saldo < 0.",
    "Inés: estado = 'aprobado' AND NOT EXISTS in cuotas.",
    'With Laura: no false positives, and always the guilty rows, not a count.',
  ],
  lessons: {
    asercion: {
      question: 'What is a data assertion?',
      body: `A business rule written the other way round: instead of "all X meet Y", a query that returns **the X that don't meet Y**.

\`\`\`
-- Rule: savings accounts are not in the red
SELECT id, saldo FROM cuentas WHERE tipo = 'ahorro' AND saldo < 0;
\`\`\`

A night job runs them all: if any returns rows, it raises an alert with those rows. That way a rule that only lived in the app, or in someone's head, is always monitored.`,
    },
    huerfanos: {
      question: 'How do I look for orphans without false positives?',
      body: `An orphan points to something that **doesn't exist**. But an empty value isn't always an error: at Kobalto, an empty destination is a transfer to another bank.

\`\`\`
SELECT t.id, t.cuenta_destino_id
FROM transferencias t
WHERE t.cuenta_destino_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.id = t.cuenta_destino_id);
\`\`\`

With a bare \`LEFT JOIN cuentas … WHERE c.id IS NULL\` the 24 transfers to other banks would come out too.`,
    },
    duplicados: {
      question: 'How do I find only the copies of a payment?',
      body: `With an EXISTS that looks for another **identical** and **earlier** row:

\`\`\`
SELECT p.id FROM pagos_tarjeta p
WHERE EXISTS (
  SELECT 1 FROM pagos_tarjeta o
  WHERE o.tarjeta_id = p.tarjeta_id AND o.comercio_id = p.comercio_id
    AND o.importe = p.importe AND o.pagado_en = p.pagado_en
    AND o.id < p.id
);
\`\`\`

\`o.id < p.id\` leaves the originals out: the assertion points to exactly what would have to be removed.`,
    },
    estados: {
      question: "How do I monitor states that can't go together?",
      body: `Join the two tables and ask for the forbidden combination:

\`\`\`
SELECT p.id, p.tarjeta_id
FROM pagos_tarjeta p
JOIN tarjetas t ON t.id = p.tarjeta_id
WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado';
\`\`\`

Every business rule of the kind "if A, never B" becomes an assertion like this.`,
    },
    temporal: {
      question: 'Which impossible dates are worth monitoring?',
      body: `- End before the start: \`cerrada_en < abierta_en\`.
- Something that already happened with a future date: \`pagado_en > '2026-03-02'\` (with the test's reference date, not with \`now()\`).
- Steps out of order: an approval before the application.

Watch out for NULLs: \`cerrada_en < abierta_en\` is NULL for open incidents, so they don't come out. That's what we want: an open incident has no closing date to compare.`,
    },
    falta_relacion: {
      question: "How do I look for what's missing?",
      body: `With NOT EXISTS: the rows of one table for which there is **no** row at all in another.

\`\`\`
SELECT p.id, p.cliente_id FROM prestamos p
WHERE p.estado = 'aprobado'
  AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.prestamo_id = p.id);
\`\`\`

It's the assertion that finds half-finished processes: something was approved, created or closed… and didn't leave what it should have.`,
    },
    falsos_positivos: {
      question: 'Why do false positives matter so much?',
      body: `An assertion that warns **every night** about cases that are fine teaches the team to ignore it. And the day it warns about a real problem, nobody will look.

That's why:

- Each row it returns has to be a **real problem**: exclude the legitimate cases (empty destination = another bank).
- Return the **guilty rows** with their identifier, not a count: "there are 3" doesn't say which ones.
- If a rule has exceptions, write them in the query, not in the head of whoever reads the alert.`,
    },
  },
  quiz: {
    pre: {
      q3pre_asercion: { question: 'A data assertion returns zero rows. What does it mean?', options: ['That the query is wrong', 'That the rule holds', 'That the table is empty', "That there's an error"], explanation: 'Each row would be a violation.' },
      q3pre_huerfano: { question: 'What is an orphan row?', options: ['A row without an id', "A row that points to another one that doesn't exist", 'A repeated row', 'A row with NULL'], explanation: 'A NULL can be legitimate.' },
      q3pre_dup: { question: 'To return only the copies (not the originals) of the repeated payments, which condition do you add?', options: ['o.id <> p.id', 'o.id < p.id', 'o.id = p.id', 'DISTINCT'], explanation: 'An identical earlier one exists.' },
      q3pre_estado: { question: 'Rule: "a blocked card has no accepted payments". What does its assertion return?', options: ['The blocked cards', 'The accepted payments of blocked cards', 'Every payment', 'The number of cards'], explanation: 'The forbidden combination.' },
      q3pre_falta: { question: 'What do you use to look for approved loans without instalments?', options: ['JOIN cuotas', 'NOT EXISTS (SELECT 1 FROM cuotas …)', 'COUNT(*)', 'GROUP BY'], explanation: 'Or LEFT JOIN … WHERE c.id IS NULL.' },
      q3pre_ruido: { question: 'An assertion warns every night about correct cases. What happens?', options: ['Nothing', 'The team learns to ignore it', 'It fixes itself', 'Quality improves'], explanation: 'And one day it will ignore a real alert.' },
    },
    post: {
      q3post_null: { question: '`LEFT JOIN cuentas c ON c.id = t.cuenta_destino_id WHERE c.id IS NULL`. What does it return besides the orphans?', options: ['Nothing else', 'The transfers to other banks (empty destination)', 'The closed accounts', 'The duplicates'], explanation: 'You have to add cuenta_destino_id IS NOT NULL.' },
      q3post_count: { question: 'The night job accepts an assertion if it returns zero rows. Rubén writes `SELECT COUNT(*) …`. What happens?', options: ['It works', 'It always returns one row, so it always "fails"', 'It never fails', 'It gives an error'], explanation: 'Return the rows, not the count.' },
      q3post_temp: { question: 'An open incident has an empty `cerrada_en`. Does it come out in `WHERE cerrada_en < abierta_en`?', options: ['Yes', "No: the comparison with NULL isn't true", 'It gives an error', 'It depends'], explanation: "And that's correct." },
      q3post_regla: { question: '"Savings accounts can\'t be in the red". Which is the assertion?', options: ["SELECT … WHERE tipo = 'ahorro' AND saldo >= 0", "SELECT id, saldo FROM cuentas WHERE tipo = 'ahorro' AND saldo < 0", 'SELECT COUNT(*) FROM cuentas', 'SELECT MIN(saldo) FROM cuentas'], explanation: 'The rows that break it.' },
      q3post_dup: { question: 'With `o.id <> p.id` instead of `o.id < p.id`, what does the copies assertion return?', options: ['Only the copies', 'The copies and the originals', 'Nothing', 'Only the originals'], explanation: 'Each row of the pair finds the other.' },
      q3post_proc: { question: 'What kind of problem does an assertion with NOT EXISTS find?', options: ['Duplicates', "Half-finished processes: something that should have left something else and didn't", 'Missing indexes', 'Performance'], explanation: 'Approved without instalments, created without audit…' },
    },
  },
  scenes: {
    mail_laura: {
      subject: 'What the night watches',
      body: "Good morning.\n\nEverything you found this week, you found because you looked for it. I want it to look by itself: a pack of **data assertions** that runs every night. Each one is a query that returns **the rows that break a rule**: zero rows, all good.\n\nThe first one:\n\n- The transfers with a **destination account that doesn't exist**. Careful: an **empty** destination is a transfer to another bank and it's normal. `id` and `cuenta_destino_id`.\n\nLaura",
    },
    laura_ok: {
      body: "Three: 77 (to 999, which comes from months ago), 2001 and 2002. And none of the 24 to other banks. That's how you write an assertion people can trust.",
    },
    marta_duplicados: {
      body: 'Hi! Last year we had **repeated** card payments (same card, merchant, amount and time). I want an assertion that returns **only the copies**, not the originals: one column `id`.',
    },
    marta_thanks: { body: "304, 305 and 306. If another one appears tomorrow, we'll know the next day. Thanks!" },
    carmen_bloqueadas: {
      body: "Hi. Risk rule: a **blocked** card can't have **accepted** payments. I want the assertion: the payment's `id` and `tarjeta_id`.",
    },
    carmen_thanks: { body: "Three accepted payments with card 12, the blocked one. I'm opening the investigation. Thanks." },
    laura_ruido: {
      subject: '11:00 · Laura: "27 orphans every night"',
      body: '**Laura:** Rubén already had an orphans assertion:\n\n`SELECT t.id FROM transferencias t LEFT JOIN cuentas c ON c.id = t.cuenta_destino_id WHERE c.id IS NULL;`\n\nIt returns 27 rows every night, and the team no longer even looks at it. What is wrong with it?',
      choices: {
        ruido: {
          text: 'That it counts as orphans the **24 transfers to other banks**, which have an empty destination on purpose. They are **false positives**: they hide the 3 real orphans and teach the team to ignore the alert. You have to add `cuenta_destino_id IS NOT NULL`.',
          reply: 'Exactly. An assertion that always rings is worse than none: it gives false peace of mind to whoever owns it and noise to whoever receives it.',
          effects: { 2: { text: 'An assertion without false positives: exclude the legitimate cases.' } },
        },
        umbral: {
          text: 'That it should only alert if there are more than 27.',
          reply: 'And if tomorrow two transfers to other banks disappear and two real orphans appear? It would still be 27.',
          effects: { 0: { text: 'You set a threshold to hide false positives.' } },
        },
        quitar: {
          text: "That he should remove it: if nobody looks at it, it's useless.",
          reply: "The three real orphans are still there. The assertion is useful; what fails is how it's written.",
          effects: { 0: { text: 'You removed the monitoring instead of fixing it.' } },
        },
      },
    },
    nuria_fechas: {
      body: 'Hi. The resolution times report looks odd again. Can you write me the assertion for the incidents **closed before they were opened**? `id`, `abierta_en` and `cerrada_en`.',
    },
    nuria_thanks: { body: 'Number 5: closed two hours before it was opened. Now I know where the negative number came from. Thanks!' },
    diego_ahorro: {
      body: "Hey. The app doesn't let a **savings** account go negative, but the closing processes take another path. Can you write me the assertion? `id` and `saldo` of the savings accounts with a negative balance.",
    },
    diego_thanks: { body: "Account 28, with −€12.40. A fees closing run skipped it. I'll look into it. Thanks!" },
    ines_cuotas: {
      body: "Hi. When a loan is approved, its instalments are generated. If the process stops halfway, the loan is never collected. Assertion: **approved** loans with **no** instalment at all, with `id` and `cliente_id`.",
    },
    ines_thanks: { body: "Number 19. Approved and without a single instalment. I'm passing it to Loans. Thanks." },
    laura_count: {
      subject: '15:00 · Laura: "mine always fail"',
      body: "**Laura:** The night job accepts an assertion if it returns **zero rows**. Rubén wrote his like this:\n\n`SELECT COUNT(*) AS problemas FROM cuentas WHERE tipo = 'ahorro' AND saldo < 0;`\n\nAnd he says they all \"fail\" every time, even when there are no problems. Why?",
      choices: {
        filas: {
          text: 'Because `COUNT(*)` **always returns one row**, even if the count is 0. The assertion has to return **the rows that break the rule** (here, `id` and `saldo` of each account), so zero rows means "all good" and, when it fails, each row says where the problem is.',
          reply: "That's it. And notice the second part: \"there is 1\" doesn't help anyone at three in the morning; \"account 28 is at −12.40\" does.",
          effects: { 3: { text: 'Assertions return the guilty rows, not a count.' } },
        },
        proceso: {
          text: 'That he should change the job so it looks at the number.',
          reply: "It could be done, but we'd lose the important part: knowing which rows fail. And each assertion would need its own logic.",
          effects: { 0: { text: 'You adapted the job to a badly written assertion.' } },
        },
        having: {
          text: 'That he should add `HAVING COUNT(*) > 0`.',
          reply: "It would no longer always fail… but it still wouldn't say which accounts. The assertion has to return the rows.",
          effects: { 0: { text: 'You fixed the symptom and not the design.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Laura',
      body: '**Laura:** Six assertions for the night job. What are you taking away?',
      choices: {
        lesson: {
          text: "That a rule is monitored with a query that returns the rows that break it: orphans (not counting the legitimate empty values), copies, incompatible states, impossible dates, forbidden values and missing relationships. Without false positives and with the guilty rows, not a count.",
          reply: 'Very good. Tomorrow, when there are two sources that should say the same thing: reconciling.',
        },
        manual: {
          text: "That it's better to review the data by hand when there's time.",
          reply: "There's never time. That's why it's automated. Check the debrief.",
          effects: { 0: { text: 'You came away with reviewing by hand.' } },
        },
      },
    },
  },
})
