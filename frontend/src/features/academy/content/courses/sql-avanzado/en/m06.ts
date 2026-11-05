import { m06Reglas } from '../m06-reglas'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 7: Advanced SQL · Mission 6 — Rules in the database. English version of ../m06-reglas.ts. */
export const m06ReglasEn = missionEn(m06Reglas, {
  ...COMMON_EN,
  title: 'Rules in the database',
  subtitle: 'CHECK, UNIQUE, foreign keys with ON DELETE, generated columns and partial unique indexes.',
  dayLabel: 'Tuesday · month 4',
  verdicts: {
    good: {
      title: 'The database now says no',
      body: "Valid terms, instalments that don't repeat, one active card per account, incidents that aren't closed before they open, instalments that go with their loan and a total that calculates itself. And no half-done rule, and no CASCADE taking away what it shouldn't.",
    },
    ok: { title: 'Rules, halfway there', body: 'You already put rules in the database, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'A database that accepts anything', body: 'Several tasks were left undone. Replay the mission with the rules cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Rules in the database',
    paragraphs: [
      "Tuesday. Yesterday you fixed data; today it's about making sure **bad data can't get in again**. The rules you put in the table itself always hold, whether the data comes from the app, a script or a console.",
      "We're still on the **test copy**. Each task is done when the rule exists and does its job: Inés tests it by trying to put bad data in (and undoing it).",
    ],
    goals: [
      'Add a CHECK to a table with data that already breaks it.',
      'Make a combination of columns unique.',
      'Change what happens to the children when the parent is deleted (ON DELETE).',
      'Create a column that calculates itself (GENERATED).',
      'Make a column unique only for some rows (partial unique index).',
      'Read the error codes of the rules (23514, 23505, 23503).',
    ],
  },
  docs: {
    chuleta_reglas: {
      title: 'Cheat sheet: rules in the database',
      updatedLabel: 'Inés Moreno · Data',
      body: `## Adding rules to a table that already exists
| Rule | Statement |
|---|---|
| Condition | \`ALTER TABLE t ADD CONSTRAINT name CHECK (condition)\` |
| Unique (several columns) | \`ALTER TABLE t ADD CONSTRAINT name UNIQUE (a, b)\` |
| Unique only in some rows | \`CREATE UNIQUE INDEX name ON t (a) WHERE condition\` |
| Foreign key with an action | \`… FOREIGN KEY (x) REFERENCES p(id) ON DELETE CASCADE\` |
| Change a rule | \`ALTER TABLE t DROP CONSTRAINT name, ADD CONSTRAINT name …\` |
| Calculated column | \`ALTER TABLE t ADD COLUMN c type GENERATED ALWAYS AS (expression) STORED\` |

## See the rules of a table
\`\`\`
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid = 'cuotas'::regclass;
\`\`\`

## If the rule won't go in
The data already there breaks it. Find those rows with the opposite condition, **fix them** and add the rule again.

## Error codes
| Code | Rule |
|---|---|
| 23514 | CHECK |
| 23505 | UNIQUE or primary key |
| 23503 | foreign key |
| 23502 | NOT NULL |`,
    },
  },
  sqlLab: {
    starter: "-- Test environment: the rules cuotas already has\nSELECT conname, pg_get_constraintdef(oid)\nFROM pg_constraint\nWHERE conrelid = 'cuotas'::regclass;",
    retos: {
      plazo_valido: {
        title: 'Only terms of 12, 24, 36, 48 or 60 months',
        description: 'Add the rule **`plazo_valido`** to `prestamos`: `plazo_meses` can only be 12, 24, 36, 48 or 60. If a loan breaks it, **fix the data** first (the contract rules).',
        hint: 'Find the ones that break it (`WHERE plazo_meses NOT IN (…)`), fix them with an UPDATE and then `ALTER TABLE prestamos ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60));`',
        requires: { 0: { message: 'This task is done with a `CHECK` rule: `ALTER TABLE prestamos ADD CONSTRAINT plazo_valido CHECK (…)`.' } },
      },
      cuota_unica: {
        title: 'Each instalment, only once',
        description: 'There must not be **two instalments with the same number for the same loan**: a unique rule on `(prestamo_id, numero)` in `cuotas`. If there is a repeated one, delete **the copy** (the one with the highest `id`).',
        hint: '`GROUP BY prestamo_id, numero HAVING COUNT(*) > 1` to find it, `DELETE` the copy and `ALTER TABLE cuotas ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero);`',
        requires: { 0: { message: 'This task is done with a `UNIQUE (prestamo_id, numero)` rule.' } },
      },
      una_activa: {
        title: 'Only one active card per account',
        description: "Each account can have **only one active card**, but it can have other blocked or expired ones. Make `tarjetas` refuse a second **active** one on the same account.",
        hint: "A unique index that only looks at the active ones: `CREATE UNIQUE INDEX una_activa_por_cuenta ON tarjetas (cuenta_id) WHERE estado = 'activa';`",
        requires: { 0: { message: 'Make the database prevent it with something unique (`UNIQUE`).' } },
      },
      cierre_posterior: {
        title: 'No incident is closed before it opens',
        description: 'Add a rule to `incidencias`: if it has `cerrada_en`, it cannot be **earlier** than `abierta_en`. The ones that are still open (empty `cerrada_en`) must still be storable.',
        hint: '`ALTER TABLE incidencias ADD CONSTRAINT cierre_posterior CHECK (cerrada_en IS NULL OR cerrada_en >= abierta_en);`',
        requires: { 0: { message: 'This task is done with a `CHECK` rule.' } },
      },
      cuotas_cascade: {
        title: 'The instalments go with their loan',
        description: 'When a loan is deleted, its **instalments** have to be deleted with it. Change the foreign key of `cuotas.prestamo_id` so that it does. An instalment of a loan that doesn\'t exist must still be refused.',
        hint: '`ALTER TABLE cuotas DROP CONSTRAINT cuotas_prestamo_id_fkey, ADD CONSTRAINT cuotas_prestamo_id_fkey FOREIGN KEY (prestamo_id) REFERENCES prestamos(id) ON DELETE CASCADE;`',
        requires: { 0: { message: 'This task is done with `ON DELETE CASCADE` on the foreign key.' } },
      },
      total_generado: {
        title: 'The total to repay, calculated by the database',
        description: 'Add the column **`total_a_devolver`** (numeric(12,2)) to `prestamos`: `importe × (1 + tipo_interes / 100)`, rounded to 2 decimals, that **calculates itself** and stays up to date if the amount or the interest rate changes.',
        hint: '`ALTER TABLE prestamos ADD COLUMN total_a_devolver numeric(12,2) GENERATED ALWAYS AS (ROUND(importe * (1 + tipo_interes / 100), 2)) STORED;`',
        requires: { 0: { message: 'Make it calculate itself: `GENERATED ALWAYS AS (…) STORED`.' } },
      },
    },
  },
  bugs: {
    'C-MARTA': { title: "Marta's instalments report charges one instalment twice", explanation: 'Nothing prevented two instalments with the same number for the same loan.', technique: 'UNIQUE (prestamo_id, numero).' },
    'C-CARMEN': { title: 'A customer ends up with two active cards on the same account', explanation: 'The rule lived only in the app, and a script skipped it.', technique: 'Partial unique index WHERE estado = activa.' },
    'C-NURIA': { title: 'The average resolution time comes out negative', explanation: 'An incident closed before it was opened got in.', technique: 'CHECK (cerrada_en IS NULL OR cerrada_en >= abierta_en).' },
    'C-DIEGO': { title: 'Deleting a loan application fails in the back office', explanation: 'The instalments blocked deleting the loan.', technique: 'ON DELETE CASCADE on cuotas.prestamo_id.' },
    'C-LAURA': { title: 'The app and the report give different totals for the same loan', explanation: 'Each one calculated the total its own way.', technique: 'A GENERATED column calculated by the database.' },
    'C-NOTVALID': { title: 'An 18-month loan is still in the "validated" portfolio', explanation: "The rule was added with NOT VALID and didn't look at the data already there.", technique: 'Fix the data and add the rule validated (or VALIDATE CONSTRAINT).' },
    'C-CASCADE': { title: 'Deleting a test customer takes their accounts and transactions with it', explanation: 'ON DELETE CASCADE was put on tables with a history of their own.', technique: 'CASCADE only for children that have no life without the parent.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Tuesday's rules.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's instalments", explanation: 'One instalment per number and loan.' },
      1: { label: "Carmen's cards", explanation: 'One active per account.' },
      2: { label: "Nuria's incidents", explanation: 'Closing after opening.' },
      3: { label: "Diego's back office", explanation: 'The instalments go with the loan.' },
      4: { label: "Laura's totals", explanation: 'Calculated by the database.' },
      5: { label: 'Validated rules', explanation: 'The old data complies too.' },
      6: { label: 'CASCADE with care', explanation: 'Only where there is no history of its own.' },
    },
  },
  concepts: {
    check: { title: 'CHECK', summary: "A condition every row has to meet; NULL meets it (it isn't false)." },
    not_valid: { title: 'Rules on data that already exists', summary: 'ADD CONSTRAINT checks the existing rows; NOT VALID skips that and leaves the bad data in.' },
    unique_multi: { title: 'Multi-column UNIQUE', summary: "The combination doesn't repeat, even if each column does." },
    partial_unique: { title: 'Partial unique index', summary: 'CREATE UNIQUE INDEX … WHERE: unique only among the rows that meet the condition.' },
    fk_actions: { title: 'ON DELETE on foreign keys', summary: 'RESTRICT/NO ACTION prevents deleting the parent; CASCADE deletes the children; SET NULL leaves them without a parent.' },
    generated: { title: 'Generated columns', summary: "GENERATED ALWAYS AS (…) STORED: the database calculates it and it can't be written." },
    sqlstate: { title: 'Error codes of the rules', summary: '23514 CHECK, 23505 UNIQUE, 23503 foreign key, 23502 NOT NULL.' },
  },
  seniorTips: [
    'Read the rules cheat sheet in the wiki.',
    'Inés: loan 23 has 18 months; its contract says 24. UPDATE and then ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60)).',
    'Marta: instalment 900 repeats 9 (loan 2, instalment 3). DELETE 900 and ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero).',
    "Carmen: CREATE UNIQUE INDEX una_activa_por_cuenta ON tarjetas (cuenta_id) WHERE estado = 'activa'.",
    'Nuria: CHECK (cerrada_en IS NULL OR cerrada_en >= abierta_en).',
    'Diego: DROP CONSTRAINT cuotas_prestamo_id_fkey and ADD it again with ON DELETE CASCADE.',
    'Laura: ADD COLUMN total_a_devolver numeric(12,2) GENERATED ALWAYS AS (ROUND(importe * (1 + tipo_interes / 100), 2)) STORED.',
    'With Inés: fix the data instead of NOT VALID, and CASCADE only where the children have no life of their own.',
  ],
  lessons: {
    check: {
      question: 'What is a CHECK and what happens with NULLs?',
      body: `A condition that **each row** has to meet when it is inserted or changed:

\`\`\`
ALTER TABLE prestamos
  ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60));
\`\`\`

If it isn't met, error **23514**. Careful: the CHECK only fails if the condition is **false**; if it gives NULL, it passes. That is why \`CHECK (cerrada_en >= abierta_en)\` already accepts the open ones, although writing \`cerrada_en IS NULL OR …\` makes it clearer.`,
    },
    not_valid: {
      question: 'And if the data already there breaks the rule?',
      body: `\`ADD CONSTRAINT\` checks every row and, if any fails, doesn't add the rule:

> check constraint "plazo_valido" of relation "prestamos" is violated by some row

The right way: find those rows (\`WHERE NOT (condition)\`), **fix them** and add it again. There is \`… NOT VALID\`, which adds the rule without looking at what is already there: it's only for huge tables, and afterwards you have to fix the data and run \`ALTER TABLE … VALIDATE CONSTRAINT name\`.`,
    },
    unique_multi: {
      question: 'How do I make a combination of columns unique?',
      body: `\`\`\`
ALTER TABLE cuotas ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero);
\`\`\`

Loan 2 can have many instalments and many instalments can be number 3, but **instalment 3 of loan 2** only once. If there are already repeated ones, it won't go in ("could not create unique index"): find them with \`GROUP BY prestamo_id, numero HAVING COUNT(*) > 1\`.`,
    },
    partial_unique: {
      question: 'How do I make something unique only for some rows?',
      body: `With a unique index with \`WHERE\`:

\`\`\`
CREATE UNIQUE INDEX una_activa_por_cuenta
  ON tarjetas (cuenta_id) WHERE estado = 'activa';
\`\`\`

It only looks at the active rows: an account can have many blocked or expired cards, but only one active. A normal \`UNIQUE (cuenta_id)\` would also prevent having one blocked and another active.`,
    },
    fk_actions: {
      question: 'What happens to the children when I delete the parent?',
      body: `The foreign key decides:

| Action | When the loan is deleted… |
|---|---|
| \`NO ACTION\` / \`RESTRICT\` (default) | error 23503 if it has instalments |
| \`ON DELETE CASCADE\` | its instalments are deleted |
| \`ON DELETE SET NULL\` | the instalments keep a NULL \`prestamo_id\` |

To change it: \`DROP CONSTRAINT\` and \`ADD CONSTRAINT\` again, in the same statement. CASCADE is convenient and dangerous: one DELETE can take rows from several tables with it.`,
    },
    generated: {
      question: 'What is a generated column?',
      body: `A column the database calculates from other columns of the same row:

\`\`\`
ALTER TABLE prestamos ADD COLUMN total_a_devolver numeric(12,2)
  GENERATED ALWAYS AS (ROUND(importe * (1 + tipo_interes / 100), 2)) STORED;
\`\`\`

It recalculates itself if \`importe\` or \`tipo_interes\` change, and nobody can write it by hand. The expression can only use columns of the row and functions that always give the same result (no \`now()\` or subqueries).`,
    },
    sqlstate: {
      question: 'How do I know which rule fired?',
      body: `Each error carries a code (SQLSTATE) and the name of the rule:

| Code | Rule |
|---|---|
| 23514 | CHECK |
| 23505 | UNIQUE or PRIMARY KEY |
| 23503 | FOREIGN KEY |
| 23502 | NOT NULL |

The app should use the code, not the text of the message. And that's why it pays to **name** the rules: \`plazo_valido\` says more than \`prestamos_plazo_meses_check\`.`,
    },
  },
  quiz: {
    pre: {
      a6pre_check: { question: '`CHECK (plazo_meses IN (12, 24, 36, 48, 60))`. What happens if you insert 18?', options: ["It's stored", 'Error 23514', "It's stored as 24", "It's stored as NULL"], explanation: "The CHECK is false: the row doesn't go in." },
      a6pre_existing: { question: 'You add a CHECK and a loan that already exists breaks it. What happens?', options: ['It is added and the loan is deleted', "The rule isn't added", 'It is added and the loan stays', 'It fixes itself'], explanation: 'ADD CONSTRAINT checks the existing rows.' },
      a6pre_unique: { question: "`UNIQUE (prestamo_id, numero)`. What can't you have?", options: ['Two instalments of the same loan', 'Two instalments number 3', 'Two instalments number 3 of the same loan', 'An unpaid instalment'], explanation: 'What is unique is the combination.' },
      a6pre_partial: { question: "What does `CREATE UNIQUE INDEX … ON tarjetas (cuenta_id) WHERE estado = 'activa'` allow?", options: ['One card per account', 'One active per account and as many blocked ones as you like', 'No active ones', 'One account per card'], explanation: 'It only looks at the active ones.' },
      a6pre_fk: { question: 'By default, what happens when you delete a loan that has instalments?', options: ['The instalments are deleted', 'Foreign key error (23503)', 'The instalments are left without a loan', 'Nothing'], explanation: "NO ACTION: it doesn't let you delete it." },
      a6pre_gen: { question: 'A `GENERATED ALWAYS AS (…) STORED` column…', options: ['Is written in every INSERT', "Is calculated by the database and can't be written", 'Is calculated only when it is created', 'Is a view'], explanation: 'And it is recalculated if its columns change.' },
    },
    post: {
      a6post_notvalid: { question: 'A rule added with `NOT VALID`…', options: ['Does nothing', 'Holds for new data, but leaves the bad data that was already there', 'Deletes the bad data', 'Only works for today'], explanation: 'Then you have to fix them and run VALIDATE CONSTRAINT.' },
      a6post_null: { question: '`CHECK (cerrada_en >= abierta_en)` and `cerrada_en` is NULL. Does the row go in?', options: ['No', "Yes: the CHECK only fails if it's false, and NULL isn't", 'It gives an error', 'Only with NOT NULL'], explanation: 'NULL ≥ something is NULL, not false.' },
      a6post_code: { question: 'The app gets error 23505. Which rule fired?', options: ['CHECK', 'UNIQUE or primary key', 'Foreign key', 'NOT NULL'], explanation: '23505 = unique_violation.' },
      a6post_cascade: { question: 'Where does `ON DELETE CASCADE` make sense?', options: ['From accounts to customers', 'From instalments to their loan', 'From transfers to accounts', 'Everywhere'], explanation: 'Instalments have no life without their loan; accounts and transfers do.' },
      a6post_partial: { question: 'Why isn\'t `UNIQUE (cuenta_id)` good for "one active per account"?', options: ['It is good', 'It would also prevent having a blocked one as well as the active one', "It can't be done on tarjetas", "It's slower"], explanation: 'It would make the account unique across every row.' },
      a6post_gen: { question: 'You change the `importe` of a loan with a generated `total_a_devolver`. What happens to the total?', options: ['It stays the same', 'It recalculates itself', 'You have to run an UPDATE', 'It gives an error'], explanation: "That's what a generated column is for." },
    },
  },
  scenes: {
    mail_ines: {
      subject: "So it doesn't happen again",
      body: "Good morning.\n\nYesterday you removed copies and fixed data. Today it's about making the **database refuse** bad data: rules in the tables themselves, which hold wherever the data comes from. We're still on the test copy.\n\nTo start:\n\n- In `prestamos`, the rule **`plazo_valido`**: `plazo_meses` can only be 12, 24, 36, 48 or 60. A warning: there's a loan with an impossible term. Its contract says **24 months**; someone mistyped it.\n\nInés",
    },
    ines_ok: {
      body: "Loan 23 with its 24 months and the rule validated. I tried setting loan 1 to 18 and got 23514. That's how it's done: first the data, then the rule.",
    },
    marta_cuotas: {
      body: 'Hi! My instalments report shows a **repeated** instalment: the same instalment of the same loan twice. Can you remove the copy (the one with the highest `id`) and make sure it can\'t happen again? Make the combination `(prestamo_id, numero)` unique.',
    },
    marta_thanks: { body: "900 was the copy of 9, and now it can't repeat. Thanks!" },
    carmen_tarjetas: {
      body: "Hi. Risk policy: **only one active card per account**. Blocked or expired, as many as needed. Right now only the app controls it; I want the database to prevent it.",
    },
    carmen_thanks: { body: 'A second active one on the same account gives an error, and a blocked one goes in. Exactly what the policy asks for. Thanks.' },
    ines_not_valid: {
      subject: '11:00 · Inés: "it went in first time for me"',
      body: '**Inés:** Rubén put the same terms rule in the reporting database. He got the "violated by some row" error and solved it like this:\n\n`ALTER TABLE prestamos ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60)) NOT VALID;`\n\nHe says it\'s done, the rule works. What do you think?',
      choices: {
        fix: {
          text: 'That with `NOT VALID` the rule only looks at **new** data: the 18-month loan is still there, and anyone who trusts the rule gets it wrong. You have to find the failing rows, **fix them** and validate the rule (`VALIDATE CONSTRAINT`, or drop it and add it without NOT VALID).',
          reply: 'Exactly. NOT VALID is for huge tables, and always with the data fix right behind it. Not to silence the error.',
          effects: { 2: { text: "A rule that won't go in is fixed in the data, not with NOT VALID." } },
        },
        fine: {
          text: "That it's fine: what matters is that new loans comply.",
          reply: 'And the report that says "every term is valid because there\'s a rule" is lying. The old data is still wrong.',
          effects: { 0: { text: 'You accepted a rule that leaves the bad data in.' } },
        },
        delete: {
          text: 'That he should delete the 18-month loan and add the rule again.',
          reply: 'Delete an approved loan, with its customer and its instalments, because of a mistyped value? You fix the value, you don\'t delete the row.',
          effects: { 0: { text: 'You deleted good data instead of fixing one value.' } },
        },
      },
    },
    nuria_incidencias: {
      body: 'Hi. Last month the average resolution time came out **negative**: someone closed an incident with a date earlier than the opening one. It\'s been fixed, but can you make it **impossible**? The ones still open, without a closing date, must still be storable.',
    },
    nuria_thanks: { body: 'Closing before opening now gives an error and the open ones are stored fine. Thanks!' },
    diego_cascade: {
      body: "Hey. In the back office, deleting a loan gives a foreign key error because it has **instalments**. The instalments make no sense without their loan: I want them **deleted with it**. But an instalment of a loan that doesn't exist must still be refused.",
    },
    diego_thanks: { body: 'I delete the loan and its instalments go with it, and an orphan instalment still gives an error. Thanks!' },
    laura_total: {
      body: "Hi. The app and the loans report each calculate the **total to repay** their own way and they don't match. I want **the database** to calculate it: a column `total_a_devolver` (numeric(12,2)) = `importe × (1 + tipo_interes / 100)`, rounded to 2 decimals, which keeps itself up to date if the amount or the interest rate change.",
    },
    laura_thanks: { body: 'Loan 1: €29,900.68. I changed its amount in a test and the total changed by itself. No more two calculations. Thanks!' },
    ines_cascade: {
      subject: '15:00 · Inés: "CASCADE everywhere"',
      body: '**Inés:** Diego liked the CASCADE thing. He suggests putting it on `cuentas.cliente_id`, `tarjetas.cuenta_id` and `transferencias` too, "so we can delete test customers without fighting the keys". What do you tell him?',
      choices: {
        care: {
          text: "No: a `DELETE FROM clientes` would cascade to their accounts, cards and transfers, which are **the history of the money** and have a life of their own. CASCADE only where the child makes no sense without the parent (a loan's instalments). For the test customers, a script that deletes in order, or marking them as closed.",
          reply: "That's it. The foreign key error is the database protecting you. Removing it everywhere is switching off the alarm.",
          effects: { 3: { text: 'CASCADE only for children with no life of their own; the rest should protect.' } },
        },
        yes: {
          text: 'Yes, that way everything is deleted at once and there are no errors.',
          reply: 'And the day someone deletes a real customer by mistake, their transfers disappear too. Without warning.',
          effects: { 0: { text: 'You put CASCADE where there is history to protect.' } },
        },
        drop: {
          text: 'That he should rather remove the foreign keys from those tables.',
          reply: "Then nothing prevents transfers from accounts that don't exist. The keys stay.",
          effects: { 0: { text: 'You suggested removing rules so as not to see their errors.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Inés',
      body: '**Inés:** Today the database learned to say no. What are you taking away?',
      choices: {
        lesson: {
          text: "That a rule in the table always holds, wherever the data comes from; that if it won't go in, you fix the data (not NOT VALID); that UNIQUE can cover several columns or, with a partial index, only some rows; that ON DELETE decides what happens to the children and CASCADE only goes where there's no history of its own; and that a generated column avoids repeated calculations.",
          reply: 'Very good. Tomorrow, logic inside the database: functions and triggers.',
        },
        app: {
          text: 'That the app already controls these rules, so they are not needed in the database.',
          reply: 'Until someone comes in another way: a script, a console, another app. Check the debrief.',
          effects: { 0: { text: 'You came away with rules living only in the app.' } },
        },
      },
    },
  },
})
