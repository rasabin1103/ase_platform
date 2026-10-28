import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m08Calidad } from '../m08-calidad'
import { ROLES_EN, missionEn } from './missionEn'

/** Course 6: Intermediate SQL · Mission 8 — Data that doesn't add up. English version of ../m08-calidad.ts. */
export const m08CalidadEn = missionEn(
  m08Calidad,
  {
    title: "Data that doesn't add up",
    subtitle: 'Duplicates, business rules as queries, DISTINCT ON and a data quality dashboard.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Thursday · month 2, week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Every dirty record, with its bug',
        body: "You found the copies, the payments with a blocked and an expired card, the shared email and the peaks per merchant. And Laura has a dashboard that will warn if they come back.",
      },
      ok: { title: 'Dirty data, half found', body: 'You already write rules as queries, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: "The data still doesn't add up", body: 'Several tasks were left undone. Replay the mission with the data quality cheat sheet at hand.' },
    },
    briefing: {
      title: "Month 2 · Week 2 · Data that doesn't add up",
      paragraphs: [
        "Thursday. No reports today: you have to find what's wrong. Duplicates, payments that should never have been accepted, customer data that overlaps.",
        'Each business rule is written as a query that finds the cases that break it. Each task has to return exactly those cases.',
      ],
      goals: [
        'Write business rules as queries that should return zero rows.',
        'Find duplicates and tell the original from the copies.',
        'Clean duplicates keeping one copy.',
        'Get one row per group with DISTINCT ON.',
        'Put several rules together in a one-row dashboard.',
        'Report dirty data instead of hiding it.',
      ],
    },
    docs: {
      chuleta_calidad: {
        title: 'Cheat sheet: data quality',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Rule = a query that should give 0 rows
| Rule | Looks for |
|---|---|
| No duplicates | \`ROW_NUMBER() OVER (PARTITION BY columns ORDER BY id)\` > 1 |
| A blocked card doesn't pay | accepted payments with \`t.estado = 'bloqueada'\` |
| An expired card doesn't pay | accepted payments with \`pagado_en::date > caduca_en\` |
| Unique email | \`GROUP BY LOWER(email) HAVING COUNT(*) > 1\` |
| No orphans | \`LEFT JOIN … WHERE parent.id IS NULL\` |

## One row per group
\`SELECT DISTINCT ON (group) … ORDER BY group, criterion\`

## Rules dashboard
\`SELECT (SELECT COUNT(*) FROM …) AS rule1, (SELECT COUNT(*) FROM …) AS rule2;\`

## Cleaning
Delete the copies (\`n > 1\`), keep one. Rehearse the DELETE as a SELECT. Report the cause.`,
      },
    },
    sqlLab: {
      starter: '-- A rule as a query: it should return 0 rows\nSELECT tarjeta_id, comercio_id, importe, pagado_en, COUNT(*) AS veces\nFROM pagos_tarjeta\nGROUP BY tarjeta_id, comercio_id, importe, pagado_en\nHAVING COUNT(*) > 1;',
      retos: {
        duplicados: {
          title: 'The leftover copies',
          description: 'The `id` of the **leftover copies** of the duplicate payments (same card, merchant, amount and `pagado_en`): from each group, all except the one with the lowest id.',
          hint: '`ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id) AS n` in a step; outside, `WHERE n > 1`.',
        },
        tarjeta_bloqueada: {
          title: 'Accepted payments with a blocked card',
          description: '`id`, `tarjeta_id` and `importe` of the **accepted** payments with a **blocked** card.',
          hint: "`pagos_tarjeta JOIN tarjetas` and both conditions: `t.estado = 'bloqueada'` and `p.estado = 'aceptado'`.",
        },
        tarjeta_caducada: {
          title: 'Payments after the expiry date',
          description: '`id`, `tarjeta_id`, `pagado_en` and `caduca_en` of the **accepted** payments made **after** the expiry date of the card.',
          hint: '`p.pagado_en::date > t.caduca_en` (the expiry day itself is still valid).',
        },
        emails_repetidos: {
          title: 'Customers who share an email',
          description: '`id`, `nombre` and `email` of the customers whose email **some other customer** also has (ignoring case).',
          hint: '`WHERE LOWER(email) IN (SELECT LOWER(email) FROM clientes GROUP BY LOWER(email) HAVING COUNT(*) > 1)`.',
        },
        maximo_comercio: {
          title: 'The highest payment of each merchant',
          description: '`comercio_id`, `id` and `importe` of the **highest payment** (any status) of each merchant. One row per merchant.',
          hint: '`SELECT DISTINCT ON (comercio_id) comercio_id, id, importe FROM pagos_tarjeta ORDER BY comercio_id, importe DESC`.',
        },
        panel_reglas: {
          title: 'Rules dashboard in one row',
          description: "A single row: `duplicados` (leftover copies), `tarjeta_bloqueada` (accepted payments), `tarjeta_caducada` (accepted payments), `sin_categoria` (merchants) and `nombres_con_espacios` (merchants whose name doesn't match its `TRIM`).",
          hint: "One scalar subquery `(SELECT COUNT(*) FROM (…) x)` per column, reusing the queries of the other tasks.",
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'Payments with blocked cards are still being accepted', explanation: 'Nobody spotted the accepted payments with card 12.', technique: 'Rule as a query: blocked and accepted.' },
      'C-CARMEN': { title: "The audit doesn't catch expired cards that keep paying", explanation: 'Carmen was left without the 24 payments after the expiry date.', technique: 'Compare the payment date with the expiry date.' },
      'C-NURIA': { title: "A customer keeps receiving another one's statements", explanation: 'Nobody found the shared email.', technique: 'GROUP BY LOWER(email) HAVING COUNT(*) > 1.' },
      'C-DIEGO': { title: 'The anti-fraud limit is set without seeing the peaks', explanation: "Diego didn't have the highest payment of each merchant.", technique: 'DISTINCT ON.' },
      'C-LAURA': { title: 'Dirty data comes back without anyone noticing', explanation: 'There is no rules dashboard in the nightly pipeline.', technique: 'One row of counts, one per rule.' },
      'C-BORRADO': { title: 'The clean-up also deletes the original payments', explanation: 'The DELETE removed both rows of each duplicate group.', technique: 'Delete only n > 1 and rehearse it as a SELECT.' },
      'C-DISTINCT': { title: 'The duplicates keep inflating the balances', explanation: 'They were hidden with DISTINCT in a report instead of being reported.', technique: 'Report and fix at the source, with a rule that warns.' },
    },
    prevention: {
      title: 'At the end of the day',
      intro: "What happened with Thursday's dirty data.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Marta's authorisation", explanation: 'Payments with a blocked card.' },
        1: { label: "Carmen's audit", explanation: 'Payments after the expiry date.' },
        2: { label: "Nuria's customers", explanation: 'Shared email.' },
        3: { label: "Diego's limit", explanation: 'Highest payment per merchant.' },
        4: { label: "Laura's dashboard", explanation: 'Rules in the pipeline.' },
        5: { label: 'Safe clean-up', explanation: 'Only the copies.' },
        6: { label: 'Data fixed at the source', explanation: 'Report, don\'t hide.' },
      },
    },
    concepts: {
      rules_as_queries: { title: 'Rules as queries', summary: 'The query looks for the violations: if the rule holds, it returns zero rows.' },
      find_duplicates: { title: 'Finding duplicates', summary: 'Decide which columns define "the same"; ROW_NUMBER over those columns marks the copies.' },
      keep_one: { title: 'Cleaning while keeping one', summary: 'The copies (n > 1) are deleted, not the originals; the DELETE is rehearsed as a SELECT.' },
      distinct_on: { title: 'DISTINCT ON', summary: 'One row per group, the first according to the ORDER BY (PostgreSQL only).' },
      quality_dashboard: { title: 'Rules dashboard', summary: 'One row with a count per rule; all 0 when the data is clean.' },
      fix_at_source: { title: 'Fix at the source', summary: 'Dirty data is reported and corrected, not hidden with DISTINCT or filters.' },
    },
    seniorTips: [
      'Read the data quality cheat sheet in the wiki.',
      'Inés: ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id) and n > 1.',
      "Marta: payments JOIN tarjetas with t.estado = 'bloqueada' and p.estado = 'aceptado'.",
      "Carmen: p.estado = 'aceptado' AND p.pagado_en::date > t.caduca_en.",
      'Nuria: LOWER(email) IN (SELECT LOWER(email) … GROUP BY LOWER(email) HAVING COUNT(*) > 1).',
      'Diego: SELECT DISTINCT ON (comercio_id) comercio_id, id, importe … ORDER BY comercio_id, importe DESC.',
      'Laura: one row with (SELECT COUNT(*) FROM (…) x) per rule.',
      'With Inés: you delete the copies, not the originals; and dirty data is reported, not hidden.',
    ],
    lessons: {
      rules: {
        question: 'How do I check a business rule with SQL?',
        body: `Write the query that finds **the cases that break it**. If the rule holds, it returns **zero rows**.

Rule: "a blocked card can't have accepted payments".

\`\`\`
SELECT p.id, p.tarjeta_id, p.importe
FROM pagos_tarjeta p
JOIN tarjetas t ON t.id = p.tarjeta_id
WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado';
\`\`\`

Each row is a bug with a name and a face.`,
      },
      dups: {
        question: 'How do I find duplicates?',
        body: `First define **what is the same** (here: card, merchant, amount and instant; the id is always different). Then:

- To know how many: \`GROUP BY those columns HAVING COUNT(*) > 1\`.
- To know **which rows are left over**:

\`\`\`
WITH numerados AS (
  SELECT id, ROW_NUMBER() OVER (
           PARTITION BY tarjeta_id, comercio_id, importe, pagado_en
           ORDER BY id) AS n
  FROM pagos_tarjeta
)
SELECT id FROM numerados WHERE n > 1;
\`\`\``,
      },
      keep: {
        question: 'How are duplicates cleaned without losing data?',
        body: `You delete **the copies** (\`n > 1\`) and **keep one** (\`n = 1\`, the one with the lowest id).

Classic mistake: deleting \`WHERE id IN (the ones with COUNT > 1)\`, which takes the original too.

And always:
1. rehearse the \`DELETE\` as a \`SELECT\` with the same condition and count the rows;
2. do it inside a transaction and check before the \`COMMIT\`.`,
      },
      distinct_on: {
        question: 'What is DISTINCT ON?',
        body: `A PostgreSQL shortcut for "**one row per group**, the first one according to an order":

\`\`\`
SELECT DISTINCT ON (comercio_id) comercio_id, id, importe
FROM pagos_tarjeta
ORDER BY comercio_id, importe DESC;
\`\`\`

The \`ORDER BY\` has to start with the columns of the \`DISTINCT ON\`; what comes after decides which one stays (here, the highest amount). It does the same as \`ROW_NUMBER … WHERE n = 1\`, shorter, but it only exists in PostgreSQL.`,
      },
      dashboard: {
        question: 'How do I watch several rules at once?',
        body: `A **one-row** query, one column per rule, with a scalar subquery in each one:

\`\`\`
SELECT
  (SELECT COUNT(*) FROM …rule 1…) AS duplicados,
  (SELECT COUNT(*) FROM …rule 2…) AS tarjeta_bloqueada,
  …;
\`\`\`

It runs every night in the pipeline: if any column is not 0, an alert goes off. It's an automated test of the data.`,
      },
      source: {
        question: 'And if I find dirty data?',
        body: `Don't hide it in your query (\`DISTINCT\`, a filter, a \`COALESCE\`): the other reports will keep counting it and nobody will know it exists.

1. **Report it** as a bug, with the query that proves it.
2. Get the **cause** looked into (why are payments being duplicated?).
3. Get the data **cleaned** with a controlled process.
4. Leave the query as a **rule** that warns if it happens again.`,
      },
    },
    quiz: {
      pre: {
        i8pre_rules: {
          question: 'You write the rule "there are no accepted payments with a blocked card" as a query. If the rule holds, it returns…',
          options: ['Every payment', 'Zero rows', 'One row with a 1', 'An error'],
          explanation: 'The query looks for the violations.',
        },
        i8pre_dups: {
          question: "Why doesn't `SELECT DISTINCT *` remove the duplicate payments?",
          options: ["Because DISTINCT doesn't exist", 'Because each copy has a different id', 'Because there are NULLs', 'It does remove them'],
          explanation: 'You have to decide which columns define "the same".',
        },
        i8pre_keep: {
          question: 'There are 3 groups of repeated payments, 2 rows in each. How many rows do you have to delete?',
          options: ['6', '3', '2', '0'],
          explanation: 'The copies; one of each group stays.',
        },
        i8pre_distinct_on: {
          question: '`SELECT DISTINCT ON (comercio_id) … ORDER BY comercio_id, importe DESC` returns…',
          options: ['Every payment', 'The highest payment of each merchant', 'The lowest of each merchant', 'The distinct merchants without payments'],
          explanation: 'One row per merchant, the first according to the order.',
        },
        i8pre_dashboard: {
          question: 'In a one-row rules dashboard, what does it mean if every column gives 0?',
          options: ['That there is no data', 'That no rule is broken', 'That the query fails', 'Nothing'],
          explanation: 'Each column counts violations.',
        },
        i8pre_source: {
          question: 'You find duplicate payments. What do you do first?',
          options: ['DISTINCT in my report', 'Report it as a bug with the query that proves it', 'Delete them myself in production', 'Nothing'],
          explanation: 'It is fixed at the source, with its cause.',
        },
      },
      post: {
        i8post_rules: {
          question: 'Rule: "you can\'t pay with an expired card". Which condition finds the violations?',
          options: ["p.estado = 'aceptado' AND p.pagado_en::date > t.caduca_en", 't.caduca_en IS NULL', "t.estado = 'activa'", 'p.importe > 0'],
          explanation: 'Accepted after the expiry date.',
        },
        i8post_dups: {
          question: 'To list the leftover copies of each duplicate group:',
          options: ['GROUP BY … HAVING COUNT(*) > 1', 'ROW_NUMBER() OVER (PARTITION BY … ORDER BY id) and keep n > 1', 'DISTINCT', 'MAX(id)'],
          explanation: 'GROUP BY says how many groups; ROW_NUMBER, which rows are left over.',
        },
        i8post_keep: {
          question: 'Before running a clean-up DELETE…',
          options: ['Nothing, it can be undone', 'You rehearse it as a SELECT with the same condition and count the rows', 'You disable the foreign keys', 'You do a DISTINCT'],
          explanation: 'And preferably inside a transaction.',
        },
        i8post_distinct_on: {
          question: 'In `DISTINCT ON (comercio_id)`, how must the ORDER BY start?',
          options: ['With importe', 'With comercio_id', 'With id', 'It has no ORDER BY'],
          explanation: 'With the columns of the DISTINCT ON; what follows decides which one stays.',
        },
        i8post_dashboard: {
          question: 'A one-row rules dashboard is built with…',
          options: ['A GROUP BY per rule', 'A scalar subquery (SELECT COUNT(*) …) per column', 'UNION ALL of the rules', 'A CROSS JOIN'],
          explanation: 'Each column, its own count.',
        },
        i8post_source: {
          question: 'Marta fixes her report with DISTINCT. What problem remains?',
          options: ['None', "The data is still wrong: the other reports count the copies and nobody knows", 'DISTINCT is slow', 'She loses the columns'],
          explanation: "Hiding the symptom doesn't fix the cause.",
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: "Today we look for what's wrong",
        body: "Good morning.\n\nToday they're not asking you for reports: they're asking you to **find data that doesn't add up**. Duplicates, payments that shouldn't exist, business rules that are broken. It's what a QA does best with SQL: writing each rule as a query that should return **zero rows**. If it returns something, there's a problem.\n\nTo start:\n\n- There are **duplicate payments**: same card, same merchant, same amount and same instant. I want the `id` of the **leftover copies** (from each group of identical ones, all except the one with the lowest id).\n\nInés",
      },
      ines_ok: {
        body: "Three copies: 304, 305 and 306. Notice I didn't ask you for \"the duplicates\", but for **the copies that are left over**. If one day they have to be deleted, that's the list; the original stays.",
      },
      marta_bloqueada: {
        body: "Hi! A customer says their card was **blocked** and they were still **charged**. Are there **accepted** payments with blocked cards? `id`, `tarjeta_id` and `importe`.",
      },
      marta_thanks: { body: "Three accepted payments with card 12, which is blocked. This is an authorisation bug, I'm escalating it right now. Thanks!" },
      carmen_caducadas: {
        body: 'Hi. Audit: I want the **accepted** payments made **after the expiry date** of the card: `id`, `tarjeta_id`, `pagado_en` and `caduca_en`.',
      },
      carmen_thanks: { body: 'Twenty-four payments with three cards that expired in November 2024. Two of them are still "active". This goes into the audit report. Thanks.' },
      ines_borrar: {
        subject: '11:00 · Inés: "The clean-up script"',
        body: '**Inés:** Diego has prepared a script to clean the duplicates in production:\n\n`DELETE FROM pagos_tarjeta WHERE id IN (SELECT p.id FROM pagos_tarjeta p JOIN (SELECT tarjeta_id, comercio_id, importe, pagado_en FROM pagos_tarjeta GROUP BY 1, 2, 3, 4 HAVING COUNT(*) > 1) d USING (tarjeta_id, comercio_id, importe, pagado_en));`\n\nHe asks you to sign it off. Do you approve it?',
        choices: {
          keep_one: {
            text: 'No: that subquery returns **both rows** of each group (6 ids), so it would delete the original and the copy. You have to keep one: number each group with `ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id)` and delete only the ones with a number greater than 1 (3 ids). And before running it, a `SELECT` with the same condition to count what will be deleted.',
            reply: 'Exactly. "Deleting duplicates" always means "deleting the copies, keeping one". And every DELETE is rehearsed first as a SELECT.',
            effects: { 3: { text: 'To clean duplicates, delete the copies (n > 1) and keep one.' } },
          },
          approve: {
            text: "Yes: it looks for the repeated ones and deletes them, which is what we want.",
            reply: 'It would delete six payments instead of three: the three originals too, and three customers would lose a real payment from their history.',
            effects: { 0: { text: 'You approved a DELETE that also took the originals.' } },
          },
          distinct: {
            text: 'That instead of deleting he should create a new table with `SELECT DISTINCT *`.',
            reply: "Each copy has its own id: DISTINCT * doesn't see them as equal and doesn't remove any.",
            effects: { 0: { text: "DISTINCT * doesn't remove duplicates with different ids." } },
          },
        },
      },
      nuria_emails: {
        body: "Hi. Two customers tell me they receive each other's emails. Are there customers who **share an email**? Compare them ignoring case. `id`, `nombre` and `email`.",
      },
      nuria_thanks: { body: "Marta (12) and Laura (27) with the same email. Now I know why Laura gets Marta's statements. We'll fix it today. Thanks!" },
      diego_maximo: {
        body: "Hey. To set the anti-fraud limit per merchant I want **the highest payment of each merchant** (any status): `comercio_id`, `id` and `importe`. One row per merchant. I've been told there's a shortcut for this in PostgreSQL.",
      },
      diego_thanks: { body: "Twenty-two merchants with their highest payment. The online shop and the hairdresser have peaks of more than €3,000: I'll check them before setting the limit. Thanks!" },
      laura_panel: {
        body: 'Hi. I want to turn everything from today into a **rules dashboard** that runs every night: **one row** with how many cases break each rule. Columns: `duplicados` (leftover copies), `tarjeta_bloqueada` (accepted payments), `tarjeta_caducada` (accepted payments), `sin_categoria` (merchants) and `nombres_con_espacios` (merchants).',
      },
      laura_thanks: { body: "3, 3, 24, 1 and 2. When everything is fixed, the row has to be all zeros. I'm putting it in the nightly pipeline. Thanks!" },
      ines_distinct: {
        subject: '15:00 · Inés: "Fixed with a DISTINCT"',
        body: '**Inés:** Marta saw that her payments report overcounts because of the duplicates and "fixed" it like this:\n\n`SELECT COUNT(*) FROM (SELECT DISTINCT tarjeta_id, comercio_id, importe, pagado_en FROM pagos_tarjeta) x;`\n\nNow she gets 303 instead of 306 and she\'s happy. Do you say anything to her?',
        choices: {
          source: {
            text: "That the number is right, but the problem **is still in the data**: the other reports and the balances keep counting the copies, and nobody will know they exist. It has to be **reported as a bug** (where the copies come from), the data cleaned with a controlled process and a **rule** left in place that warns if they come back. The DISTINCT only hides the symptom, and it would also merge two legitimate payments that match in everything.",
            reply: "That's it. A QA doesn't cover up dirty data in their query: they report it, so it gets fixed at the source and doesn't come back.",
            effects: { 3: { text: 'Dirty data is reported and fixed at the source, not hidden with DISTINCT.' } },
          },
          ok: {
            text: 'That it\'s perfect: if the number is right, the report is right.',
            reply: 'Her report is; the others are not. And the copies will keep growing without anyone knowing.',
            effects: { 0: { text: 'You considered fixed a problem hidden in a single query.' } },
          },
          everywhere: {
            text: 'That she should put the same DISTINCT in every report.',
            reply: 'That way each report would have its own patch, and one that forgets it will give a different figure. It is fixed once, in the data.',
            effects: { 0: { text: "Multiplying patches doesn't fix the source." } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: "**Inés:** Today you looked for data that doesn't add up. What are you taking away?",
        choices: {
          lesson: {
            text: 'That every business rule can be written as a query that should return zero rows; that duplicates are found with `ROW_NUMBER` and cleaned keeping one copy; that `DISTINCT ON` gets one row per group; and that dirty data is reported and fixed at the source.',
            reply: 'Very good. Tomorrow, the last day before the exam: turning your queries into views anyone can reuse.',
          },
          hide: {
            text: 'That the most practical thing is to filter out the odd data in each query and move on.',
            reply: 'And nobody finds out it exists. Check the debrief.',
            effects: { 0: { text: 'You came away with hiding dirty data instead of reporting it.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
