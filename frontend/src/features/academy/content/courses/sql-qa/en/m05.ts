import { m05Migracion } from '../m05-migracion'
import { COMMON_EN, missionEn } from './missionEn'

const JOIN = 'FROM clientes c JOIN clientes_v2 v ON v.id = c.id'

/** Course 8: SQL for QA · Mission 5 — Validating a migration. English version of ../m05-migracion.ts. */
export const m05MigracionEn = missionEn(m05Migracion, {
  ...COMMON_EN,
  title: 'Validating a migration',
  subtitle: 'Comparing what was migrated with what was expected: rows, transformations, mappings, NULLs and units.',
  dayLabel: 'Monday · month 4, week 2',
  verdicts: {
    good: {
      title: 'A migration truly validated',
      body: 'A lost customer and a test one slipped in even though the counts matched, a name without its surname, two wrong emails (one empty), two segments wrongly mapped, a changed city and three balances wrongly converted to cents. The migration doesn\'t go out until it\'s fixed.',
    },
    ok: { title: 'Validation, halfway there', body: 'You already compare source and target, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Migration in the dark', body: 'Several tasks were left undone and the defects went into the new system. Replay the mission with the cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Validating a migration',
    paragraphs: [
      'Monday. This weekend Diego migrated the customers and accounts to the **new schema**: `clientes_v2`, `ciudades` and `cuentas_v2`. On Friday the old one is switched off. Before that, QA has to give the go-ahead.',
      "The specification is in the wiki. Each task is done when the query returns exactly the rows that don't meet the specification, with the columns asked for.",
    ],
    goals: [
      'Compare the source and target keys in both directions.',
      "Calculate each column's expected value from the specification.",
      "Compare with IS DISTINCT FROM so you don't skip the NULLs.",
      'Check the value and table mappings.',
      'Check the unit changes.',
      "Know why an equal count doesn't validate anything.",
    ],
  },
  docs: {
    chuleta_migracion: {
      title: 'Specification of the migration to v2',
      updatedLabel: 'Diego Ruiz · Backend',
      body: `## clientes → clientes_v2
| New column | Rule |
|---|---|
| \`id\` | the same; **every** customer, none more |
| \`nombre_completo\` | \`nombre || ' ' || apellidos\` |
| \`email\` | \`lower(trim(email))\` |
| \`ciudad_id\` | the \`id\` in \`ciudades\` whose \`nombre\` is the customer's city |
| \`segmento\` | the same; **empty → 'sin_segmento'** |
| \`alta\` | \`fecha_alta\` |

## cuentas → cuentas_v2
| New column | Rule |
|---|---|
| \`id\`, \`cliente_id\` | the same |
| \`iban\` | without spaces |
| \`saldo_centimos\` | \`saldo × 100\` (integer, **with its sign**) |

## How to validate
1. The keys: what's missing and what's extra.
2. Each column: the expected value (according to the rule) against the migrated one.
3. Compare with \`IS DISTINCT FROM\` (a NULL is also a difference).`,
    },
  },
  sqlLab: {
    starter: '-- Source and target, side by side\nSELECT c.id, c.nombre, c.apellidos, c.email, c.ciudad, c.segmento,\n       v.nombre_completo, v.email, v.ciudad_id, v.segmento\nFROM clientes c\nLEFT JOIN clientes_v2 v ON v.id = c.id\nORDER BY c.id\nLIMIT 10;',
    retos: {
      faltan_sobran: {
        title: 'Customers missing and extra',
        description: "The customer ids that are **not** in `clientes_v2` (`problema` = `'falta'`, missing) and those in `clientes_v2` that are **not** in `clientes` (`problema` = `'sobra'`, extra): `id` and `problema`.",
        hint: "`SELECT id, 'falta' AS problema FROM clientes WHERE id NOT IN (SELECT id FROM clientes_v2) UNION ALL SELECT id, 'sobra' FROM clientes_v2 WHERE id NOT IN (SELECT id FROM clientes)`.",
      },
      nombres: {
        title: 'Badly built full names',
        description: "The migrated customers whose `nombre_completo` is **not** `nombre || ' ' || apellidos`: one column `id`.",
        hint: `\`SELECT c.id ${JOIN} WHERE v.nombre_completo IS DISTINCT FROM c.nombre || ' ' || c.apellidos\`.`,
      },
      emails: {
        title: 'Wrongly migrated emails',
        description: "The migrated customers whose new email is **not** `lower(trim(email))` of the old one, **including** when the new one is empty: `id`, `email_origen` and `email_destino`.",
        hint: "`WHERE v.email IS DISTINCT FROM lower(trim(c.email))`: with `<>`, an empty email doesn't come out.",
      },
      segmentos: {
        title: 'Wrongly mapped segments',
        description: "The migrated customers whose new segment isn't the expected one (the same, and **empty → 'sin_segmento'**): `id`, `segmento_origen` and `segmento_destino`.",
        hint: "`WHERE v.segmento IS DISTINCT FROM COALESCE(c.segmento, 'sin_segmento')`.",
      },
      ciudades: {
        title: 'Changed cities',
        description: "The migrated customers whose `ciudad_id` **doesn't** match (in the `ciudades` table) their previous city: `id`, `ciudad_origen` and `ciudad_destino` (the name of the city it points to).",
        hint: '`LEFT JOIN ciudades ci ON ci.id = v.ciudad_id WHERE ci.nombre IS DISTINCT FROM c.ciudad`.',
      },
      saldos_centimos: {
        title: 'Balances wrongly converted to cents',
        description: 'The migrated accounts whose `saldo_centimos` is **not** `saldo × 100` (with its sign): `id`, `saldo` and `saldo_centimos`.',
        hint: '`FROM cuentas a JOIN cuentas_v2 v ON v.id = a.id WHERE v.saldo_centimos IS DISTINCT FROM a.saldo * 100`.',
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'Customer emails start with "Hi, Lucía" without a surname', explanation: 'A full name was migrated without surnames.', technique: "Compare with the rule's expected value." },
    'C-CARMEN': { title: 'A customer stops receiving the security notifications', explanation: 'Their email was migrated empty and nobody saw it.', technique: 'IS DISTINCT FROM: a NULL is also a difference.' },
    'C-NURIA': { title: 'A premium customer loses their benefits', explanation: 'The segment mapping changed their value.', technique: 'Check the mapping of every value, including the empty one.' },
    'C-DIEGO': { title: 'A customer from Bilbao gets offers for Málaga', explanation: 'The ciudad_id pointed to another city.', technique: 'Resolve the mapping table and compare the name.' },
    'C-INES': { title: 'Three balances change when moving to the new system', explanation: 'The conversion to cents failed on three accounts (one lost its sign).', technique: 'Expected value in the new unit, account by account.' },
    'C-RECUENTO': { title: 'The migration is signed off with a customer lost', explanation: 'The counts matched: one was missing and another was extra.', technique: 'Compare the keys in both directions, not just how many there are.' },
    'C-NULL': { title: "The automated validation doesn't see the values that end up empty", explanation: 'It compared with <>, and something <> NULL is never true.', technique: 'IS DISTINCT FROM.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: 'What happened with the migration to v2.',
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's names", explanation: 'First name + surnames.' },
      1: { label: "Carmen's emails", explanation: 'No empty emails.' },
      2: { label: "Nuria's segments", explanation: 'Correct mapping.' },
      3: { label: "Diego's cities", explanation: 'Cities table.' },
      4: { label: "Inés's balances", explanation: 'Cents with their sign.' },
      5: { label: 'Keys, not counts', explanation: 'Missing and extra.' },
      6: { label: 'IS DISTINCT FROM', explanation: 'NULLs count.' },
    },
  },
  concepts: {
    esperado: { title: 'The expected value', summary: "It's calculated from the source with the specification's rule and compared with what was migrated." },
    claves: { title: 'Missing and extra', summary: 'Compare the keys in both directions; an equal count can hide one missing and one extra.' },
    distinct_from: { title: 'IS DISTINCT FROM', summary: 'Compares treating NULL as a value: NULL against something is different; NULL against NULL, equal.' },
    mapeo: { title: 'Value mapping', summary: 'Each old value has its new value, including the empty one: COALESCE to write it.' },
    tabla_mapeo: { title: 'Mapping tables', summary: 'If the target stores an id, resolve it with its table and compare the real value.' },
    unidades: { title: 'Unit changes', summary: 'Euros to cents, hours to minutes: the expected value is calculated in the new unit, with its sign and without losing decimals.' },
    todas_filas: { title: 'Every row', summary: "A sample of ten customers doesn't validate a migration; the query compares them all." },
  },
  seniorTips: [
    'Read the migration specification in the wiki.',
    "Laura: NOT IN in both directions with UNION ALL, and 'falta' / 'sobra' as a column.",
    "Marta: v.nombre_completo IS DISTINCT FROM c.nombre || ' ' || c.apellidos.",
    'Carmen: v.email IS DISTINCT FROM lower(trim(c.email)).',
    "Nuria: v.segmento IS DISTINCT FROM COALESCE(c.segmento, 'sin_segmento').",
    'Diego: LEFT JOIN ciudades and ci.nombre IS DISTINCT FROM c.ciudad.',
    'Inés: cuentas JOIN cuentas_v2 and saldo_centimos IS DISTINCT FROM saldo * 100.',
    "With Laura: keys in both directions and comparisons that don't skip NULLs.",
  ],
  lessons: {
    esperado: {
      question: 'How do I validate a migration column by column?',
      body: `With the specification in hand: for each new column, calculate from the source the **expected value** and compare it with the migrated one.

\`\`\`
SELECT c.id
FROM clientes c JOIN clientes_v2 v ON v.id = c.id
WHERE v.nombre_completo IS DISTINCT FROM c.nombre || ' ' || c.apellidos;
\`\`\`

Each query like this is a test of a rule. Zero rows: the rule holds for **every** customer, not only for the ones you looked at.`,
    },
    claves: {
      question: "Why isn't it enough for the counts to match?",
      body: `Because 40 = 40 also when customer 17 is missing and 9999 is extra. Compare the **keys** in both directions:

\`\`\`
SELECT id, 'falta' AS problema FROM clientes WHERE id NOT IN (SELECT id FROM clientes_v2)
UNION ALL
SELECT id, 'sobra' FROM clientes_v2 WHERE id NOT IN (SELECT id FROM clientes);
\`\`\`

(Or \`EXCEPT\` in both orders.) The count is a first glance, not a validation.`,
    },
    distinct_from: {
      question: 'Why IS DISTINCT FROM and not <>?',
      body: `\`'ana@mail.com' <> NULL\` isn't true: it's NULL. So an email that was migrated **empty** doesn't come out with \`<>\`, exactly the worst case.

| a | b | a <> b | a IS DISTINCT FROM b |
|---|---|---|---|
| 'x' | 'y' | true | true |
| 'x' | NULL | NULL | **true** |
| NULL | NULL | NULL | false |

In validations, always \`IS DISTINCT FROM\`.`,
    },
    mapeo: {
      question: 'How do I test a value mapping?',
      body: `Write the specification's mapping as an expression and compare:

\`\`\`
WHERE v.segmento IS DISTINCT FROM COALESCE(c.segmento, 'sin_segmento')
\`\`\`

If the mapping is more complex, \`CASE c.segmento WHEN 'joven' THEN 'young' … END\`. And test **every** value of the source, including the empty one: it's the most often forgotten.`,
    },
    tabla_mapeo: {
      question: 'How do I check an id that points to another table?',
      body: `The target stores \`ciudad_id\` = 7. That can't be compared with "Bilbao". Resolve it with the table:

\`\`\`
FROM clientes c
JOIN clientes_v2 v ON v.id = c.id
LEFT JOIN ciudades ci ON ci.id = v.ciudad_id
WHERE ci.nombre IS DISTINCT FROM c.ciudad
\`\`\`

The \`LEFT JOIN\` makes a \`ciudad_id\` that doesn't exist (or is empty) also come out as a difference.`,
    },
    unidades: {
      question: 'What can go wrong when changing units?',
      body: `From euros to cents: \`saldo × 100\`. The typical failures:

- Forgetting the multiplication (8,617.21 € → 8617).
- Truncating instead of rounding (146.95 → 14694).
- Losing the sign (−245.30 → 24530).

None of them shows in a "similar" total. Compare account by account with the expected value in the new unit.`,
    },
    todas_filas: {
      question: "Isn't it enough to review a few customers?",
      body: `A sample finds **systematic** errors (every name without surnames). **Single-row** errors (an empty email, a changed city) are only found by comparing every row.

And with SQL comparing 40 costs the same as 4 million: the query is the same. Leave eyeballing for understanding the data, not for validating it.`,
    },
  },
  quiz: {
    pre: {
      q5pre_rec: { question: 'Source and target have 40 customers. Is the migration complete?', options: ['Yes', 'Not necessarily: one may be missing and another extra', 'Only if the ids are consecutive', 'Yes, if there are no errors in the log'], explanation: 'You have to compare the keys.' },
      q5pre_null: { question: "What does `'x' <> NULL` give?", options: ['true', 'false', 'NULL', 'Error'], explanation: "That's why it doesn't come out in a WHERE." },
      q5pre_esp: { question: 'What do you check a migrated value against?', options: ['Against whatever seems reasonable', 'Against the expected value according to the specification, calculated from the source', "Against the previous day's value", 'Against nothing'], explanation: 'The rule is the oracle.' },
      q5pre_map: { question: "Rule: \"empty segment → 'sin_segmento'\". Which expression gives the expected value?", options: ['c.segmento', "COALESCE(c.segmento, 'sin_segmento')", "NULLIF(c.segmento, 'sin_segmento')", "c.segmento || 'sin_segmento'"], explanation: 'COALESCE replaces the NULL.' },
      q5pre_uni: { question: '−245.30 € in cents is…', options: ['24530', '−24530', '−245', '245'], explanation: 'With its sign.' },
      q5pre_todas: { question: 'Why compare every row and not a sample?', options: ["Because it's faster", "Because single-row errors don't show up in a sample", 'Because PostgreSQL requires it', "It isn't needed"], explanation: 'And in SQL it costs the same.' },
    },
    post: {
      q5post_idf: { question: 'What does `NULL IS DISTINCT FROM NULL` give?', options: ['true', 'false', 'NULL', 'Error'], explanation: 'Two empty values are equal.' },
      q5post_email: { question: 'An email was migrated empty. Does `WHERE v.email <> lower(trim(c.email))` find it?', options: ['Yes', 'No', 'Only if the source is NULL too', 'It gives an error'], explanation: 'You need IS DISTINCT FROM.' },
      q5post_tabla: { question: 'The target stores `ciudad_id`. How do you validate it?', options: ['Comparing the number with the name', 'Resolving the id in ciudades and comparing the name', 'Counting cities', "You can't"], explanation: "With LEFT JOIN so you don't lose ids that don't exist." },
      q5post_except: { question: '`SELECT id FROM clientes_v2 EXCEPT SELECT id FROM clientes`. What does it return?', options: ['The missing ones', 'The extra ones in the target', 'The matching ones', 'Nothing'], explanation: 'You also need the other order.' },
      q5post_uni: { question: '€146.95 migrated as 14694 cents. What happened?', options: ['Nothing', 'It was truncated instead of rounded (or a cent was lost)', 'The sign was lost', 'The multiplication is missing'], explanation: 'Expected: 14695.' },
      q5post_map: { question: 'The segment mapping was tested with premium, standard and young. Which value is missing?', options: ['None', 'The empty one (NULL)', 'A made-up one', 'The first one'], explanation: 'The most often forgotten.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: 'The migration to v2',
      body: "Good morning.\n\nThis weekend Diego migrated customers and accounts to the new schema (`clientes_v2`, `ciudades`, `cuentas_v2`). On Friday we switch off the old one, so QA has to validate it **before**. The specification is in the wiki.\n\nFirst, the keys:\n\n- The customer ids that are **missing** from `clientes_v2` and the ones that are **extra** (in v2 and not in `clientes`): `id` and `problema` ('falta' or 'sobra').\n\nLaura",
    },
    laura_ok: {
      body: "17 is missing and 9999 is extra, a test customer that slipped in. And both counts said 40. Make a note of that.",
    },
    marta_nombres: {
      body: "Hi! The new app's emails greet customers with the `nombre_completo`. According to the specification it's `nombre || ' ' || apellidos`. Can you get me the migrated customers that don't meet it? One column `id`.",
    },
    marta_thanks: { body: "Number 8, without surnames. Just one, but it's a customer with a name and a face. Thanks!" },
    carmen_emails: {
      body: "Hi. Security notifications go to the email, so for Risk it's critical. The new one has to be `lower(trim(email))` of the old one. Which ones aren't, **including** if it ended up empty? `id`, `email_origen` and `email_destino`.",
    },
    carmen_thanks: { body: "22 with a made-up email and 30 with no email. 30 wouldn't receive any security notification. Thanks." },
    laura_recuento: {
      subject: '11:00 · Laura: "40 out of 40, migration OK"',
      body: '**Laura:** The migration report sent by Rubén\'s script says: "Source customers: 40. Target customers: 40. Accounts: 52 and 52. **Migration OK**". Do you sign it off?',
      choices: {
        claves: {
          text: "No. An equal count doesn't say they're **the same ones**: 17 is missing and 9999 is extra, and it comes out as 40 and 40. You have to compare the **keys** in both directions and then each column with its expected value. The count is only a first glance.",
          reply: 'Exactly. "40 = 40" is the cheapest validation and the most misleading.',
          effects: { 2: { text: 'Keys in both directions, not just counts.' } },
        },
        ok: {
          text: "Yes: if they're all there, the migration is fine.",
          reply: "They're not all there: one is missing and another is extra. And even if they were, you still need to look at what values they have.",
          effects: { 0: { text: 'You signed off a migration on a count.' } },
        },
        suma: {
          text: 'That he should also compare the sum of the ids.',
          reply: "Better than nothing, but it's still a summary: two errors can add up to the same. The keys, one by one.",
          effects: { 0: { text: 'You swapped one summary for another summary.' } },
        },
      },
    },
    nuria_segmentos: {
      body: "Hi. Premium customers have a priority line and the new app grants it based on the v2 segment. Rule: the same, and **empty → 'sin_segmento'**. Which ones are wrong? `id`, `segmento_origen` and `segmento_destino`.",
    },
    nuria_thanks: { body: "Number 2, premium turned into standard, and 9, without a segment turned into standard instead of 'sin_segmento'. We would have taken the priority line away from 2. Thanks!" },
    diego_ciudades: {
      body: "Hey. The city is now a `ciudad_id` that points to `ciudades`. I did it with a JOIN by name and I want to be sure: which migrated customers point to a city that isn't theirs? `id`, `ciudad_origen` and `ciudad_destino` (the name).",
    },
    diego_thanks: { body: "Number 1: Bilbao to Málaga. A manual patch I made on Sunday. I'll fix it. Thanks!" },
    ines_centimos: {
      body: "Hi. In v2 the balances are stored in **cents** (`saldo_centimos` = saldo × 100, an integer and with its sign). The grand total \"looks similar\", but I don't trust it. Which accounts don't meet the rule? `id`, `saldo` and `saldo_centimos`.",
    },
    ines_thanks: { body: 'Three: 21 without the multiplication, 33 with one cent less and 17, which lost its sign. Thanks.' },
    laura_null: {
      subject: '15:00 · Laura: "I only get 22"',
      body: '**Laura:** Rubén did the email check like this:\n\n`… WHERE v.email <> lower(trim(c.email))`\n\nAnd he only gets 22. You also have 30. Who is right?',
      choices: {
        distinct: {
          text: "30 has the new email **empty** (NULL). `something <> NULL` isn't true, it's NULL, so the WHERE discards it: exactly the worst case, a customer without an email. You have to compare with `IS DISTINCT FROM`, which treats NULL as a value.",
          reply: "That's it. In a validation, a `<>` is an open door for NULLs. IS DISTINCT FROM, always.",
          effects: { 3: { text: 'IS DISTINCT FROM to compare without skipping NULLs.' } },
        },
        ruben: {
          text: "Rubén: 30 has no email, there's nothing to compare.",
          reply: 'Number 30 did have an email in the source. Ending up empty after the migration is precisely the defect.',
          effects: { 0: { text: 'You accepted a comparison that skips NULLs.' } },
        },
        coalesce: {
          text: "That he should use `COALESCE(v.email, '')` and compare with `<>`.",
          reply: 'It works here, but it confuses "empty" with "empty string" and you have to remember it in every column. IS DISTINCT FROM solves it without tricks.',
          effects: { 0: { text: 'You used a trick instead of the comparison made for NULL.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Laura',
      body: '**Laura:** Ten defects in a migration that "was OK". What are you taking away?',
      choices: {
        lesson: {
          text: "That a migration is validated against the specification: first the keys in both directions (counts mislead), then each column with its expected value calculated from the source, with IS DISTINCT FROM so I don't skip the NULLs, resolving the mapping tables, the unit changes with their sign, and always every row.",
          reply: 'Very good. Tomorrow, another kind of oracle: testing a report that already exists.',
        },
        muestra: {
          text: 'That comparing the counts and reviewing a few customers by hand is enough.',
          reply: 'Today that would have let almost everything through. Check the debrief.',
          effects: { 0: { text: 'You came away with counts and a manual sample.' } },
        },
      },
    },
  },
})
