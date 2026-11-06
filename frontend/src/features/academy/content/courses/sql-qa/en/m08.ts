import { m08Reglas } from '../m08-reglas'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 8: SQL for QA · Mission 8 — Testing the database's rules. English version of ../m08-reglas.ts. */
export const m08ReglasEn = missionEn(m08Reglas, {
  ...COMMON_EN,
  title: "Testing the database's rules",
  subtitle: 'Constraints and triggers put to the test: what must get in, what must not, and without leaving a trace.',
  dayLabel: 'Thursday · month 4, week 2',
  verdicts: {
    good: {
      title: 'The rules, put to the test',
      body: "You tested each rule on `solicitudes` from both sides and at its boundaries: the 1,000 and 60,000 amounts rejected, the term and the customer that accept empty values, the new state that doesn't get in, two open applications from the same customer and a trigger that doesn't fire on update. And the table stayed as it was.",
    },
    ok: { title: 'Rules half tested', body: "You already test the database's rules, but a task or a trap fell by the wayside. Check the debrief." },
    bad: { title: 'The rules are still untested', body: 'Several tasks were left undone and the broken rules are still in production. Replay the mission with the cheat sheet at hand.' },
  },
  briefing: {
    title: "Month 4 · Testing the database's rules",
    paragraphs: [
      "Thursday. Diego has put the rules for `solicitudes` (loan applications) directly in the database: constraints and a trigger. Before the new app relies on them, QA tests them.",
      "You have two test functions: `probar('statement', …)` runs it, tells you `ok` or the **error code** (SQLSTATE) and **undoes** it; `efecto(ARRAY['statement', …], 'query')` runs it, returns what the query says and **undoes** it. Each task is done when the query returns exactly the rows and columns asked for, and `solicitudes` still has its 5 rows.",
    ],
    goals: [
      'Test each rule from both sides: what must get in and what must not.',
      'Test the exact boundaries of each range.',
      'Test empty values (NULL) in each required column.',
      'Test the business rules that span rows.',
      'Test triggers on every operation they should cover.',
      'Leave the data as it was after each test.',
    ],
  },
  docs: {
    chuleta_reglas: {
      title: 'Loan applications: specification and tests',
      updatedLabel: 'Marta Sanz · Product Owner Payments',
      body: `## Specification of \`solicitudes\`
| Column | Rule |
|---|---|
| \`cliente_id\` | **required** and must exist in \`clientes\` |
| \`importe\` | **required**, from **€1,000 to €60,000, both included** |
| \`plazo_meses\` | **required**: 12, 24, 36, 48 or 60 |
| \`estado\` | **required**: abierta, **en_estudio**, aprobada, rechazada or cancelada (lowercase) |
| \`revisada_en\` | the current time when the application is **created** and when it is **modified** |

And also: a customer can have **only one** **open** (abierta) application.

## How to test
\`\`\`
SELECT probar('INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES (2, 1000, 24, ''abierta'')');
\`\`\`
It returns \`ok\` or the code: **23514** CHECK, **23502** NOT NULL, **23503** foreign key, **23505** UNIQUE.

Several cases at once, with a table of cases and \`format\` (\`%L\` writes the value in quotes, or NULL):
\`\`\`
SELECT v.importe,
       probar(format('INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES (2, %L, 24, %L)', v.importe, 'abierta')) AS resultado
FROM (VALUES (999.99), (1000.00)) AS v(importe);
\`\`\`

For a trigger, \`efecto\`: it makes the changes, reads and undoes.
\`\`\`
SELECT efecto(ARRAY['UPDATE solicitudes SET importe = 6000 WHERE id = 1'],
              'SELECT revisada_en::text FROM solicitudes WHERE id = 1');
\`\`\``,
    },
  },
  sqlLab: {
    starter: "-- The rules solicitudes has today\nSELECT conname, pg_get_constraintdef(oid)\nFROM pg_constraint\nWHERE conrelid = 'solicitudes'::regclass;",
    retos: {
      importes: {
        title: 'The amount boundaries',
        description: 'Try to create an application for customer 2 (24 months, abierta) with amount **999.99**, **1000.00**, **60000.00** and **60000.01**: one row per case with `importe` and `resultado` (what `probar` returns).',
        hint: "`FROM (VALUES (999.99), (1000.00), (60000.00), (60000.01)) AS v(importe)` and `probar(format('INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES (2, %L, 24, %L)', v.importe, 'abierta'))`.",
        requires: { 0: { message: 'Each case is tested with `probar(…)`, which runs the statement, says what happened and undoes it.' } },
      },
      plazos: {
        title: "Terms that shouldn't get in",
        description: 'Try to create an application for customer 2 (€5000, abierta) with term **18**, **24** and **empty** (NULL): `plazo` and `resultado`.',
        hint: '`FROM (VALUES (18), (24), (NULL)) AS v(plazo)` and `%L` in the `format`, which writes NULL without quotes.',
        requires: { 0: { message: 'Each case is tested with `probar(…)`, which runs the statement, says what happened and undoes it.' } },
      },
      clientes: {
        title: 'Applications without a customer',
        description: "Try to create an application (€5000, 24 months, abierta) for customer **999** (doesn't exist), **none** (NULL) and **3**: `cliente_id` and `resultado`.",
        hint: "`FROM (VALUES (999), (NULL), (3)) AS v(cliente_id)` and `format('… VALUES (%L, 5000, 24, %L)', v.cliente_id, 'abierta')`.",
        requires: { 0: { message: 'Each case is tested with `probar(…)`, which runs the statement, says what happened and undoes it.' } },
      },
      abiertas: {
        title: 'Two open applications',
        description: 'Customer 1 already has an open application. Try to create (€5000, 24 months) an **abierta** one for customer **1**, a **cancelada** one for customer **1** and an **abierta** one for customer **2**: `cliente_id`, `estado` and `resultado`.',
        hint: "`FROM (VALUES (1, 'abierta'), (1, 'cancelada'), (2, 'abierta')) AS v(cliente_id, estado)`.",
        requires: { 0: { message: 'Each case is tested with `probar(…)`, which runs the statement, says what happened and undoes it.' } },
      },
      revision: {
        title: 'The revisada_en trigger',
        description: "One row with two columns, both with `efecto`: `al_insertar`, when creating an application for customer 6 (€5000, 24 months, abierta), whether its `revisada_en` is filled in (`(revisada_en IS NOT NULL)::text`); and `al_actualizar`, when changing application 1's amount to 6000, whether its `revisada_en` **has changed** (`(revisada_en <> '2026-02-21 10:00')::text`).",
        hint: "`SELECT efecto(ARRAY['INSERT …'], 'SELECT (revisada_en IS NOT NULL)::text FROM solicitudes WHERE cliente_id = 6') AS al_insertar, efecto(ARRAY['UPDATE solicitudes SET importe = 6000 WHERE id = 1'], 'SELECT (revisada_en <> ''2026-02-21 10:00'')::text FROM solicitudes WHERE id = 1') AS al_actualizar`.",
        requires: { 0: { message: "A trigger is tested by its effect: `efecto(ARRAY[…], 'SELECT …')` makes the change, reads and undoes it." } },
      },
      estados: {
        title: "The application's states",
        description: 'Try to create an application for customer 2 (€5000, 24 months) with state **abierta**, **en_estudio**, **APROBADA** and **empty** (NULL): `estado` and `resultado`.',
        hint: "`FROM (VALUES ('abierta'), ('en_estudio'), ('APROBADA'), (NULL)) AS v(estado)`.",
        requires: { 0: { message: 'Each case is tested with `probar(…)`, which runs the statement, says what happened and undoes it.' } },
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'An application without a term gets in and the instalment schedule comes out empty', explanation: 'The term CHECK lets NULL through and nobody tested the empty value.', technique: 'Test NULL in each required column.' },
    'C-CARMEN': { title: 'Loan applications without a customer show up', explanation: "The foreign key doesn't prevent NULL: NOT NULL was needed.", technique: 'Test the non-existent customer and the empty one.' },
    'C-NURIA': { title: 'A customer with two open applications receives two different offers', explanation: 'The "only one open" rule was not in the database.', technique: 'Test the rules that span rows.' },
    'C-DIEGO': { title: "The review queue doesn't see the modified applications", explanation: 'The revisada_en trigger only fires on insert.', technique: 'Test the trigger on each operation with efecto().' },
    'C-INES': { title: 'Applications cannot move to "en estudio"', explanation: 'The states CHECK was not updated with the new state.', technique: 'One case for each value in the specification.' },
    'C-FELIZ': { title: 'Loans of exactly €1,000 and €60,000 are rejected', explanation: 'The tests only used normal amounts and the CHECK had < instead of <=.', technique: 'Exact boundaries from both sides.' },
    'C-RESTOS': { title: 'The rule tests fail the second time they run', explanation: 'They left applications behind, and the next run clashed with them.', technique: 'Each test is undone: transaction with ROLLBACK, probar or efecto.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: 'What happened with the application rules.',
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's terms", explanation: "Without a term, it doesn't get in." },
      1: { label: "Carmen's customers", explanation: "Without a customer, it doesn't get in." },
      2: { label: "Nuria's offers", explanation: 'Only one open.' },
      3: { label: "Diego's trigger", explanation: 'On update too.' },
      4: { label: "Inés's states", explanation: 'en_estudio allowed.' },
      5: { label: 'Boundaries', explanation: 'The valid and the invalid.' },
      6: { label: 'No leftovers', explanation: 'Each test is undone.' },
    },
  },
  concepts: {
    dos_lados: { title: 'Testing from both sides', summary: 'A rule is tested with what must get in and with what must not; and at the boundaries, just inside and just outside.' },
    sqlstate_qa: { title: 'The error code', summary: '23514 CHECK, 23502 NOT NULL, 23503 foreign key, 23505 UNIQUE: the result of each case is a code, not a message.' },
    tabla_casos: { title: 'Table of cases', summary: 'VALUES with one case per row and a single query that tests them all: the test reads like a table.' },
    null_reglas: { title: 'NULL and the rules', summary: 'A CHECK and a foreign key let NULL through; what is required needs NOT NULL.' },
    reglas_filas: { title: 'Rules across rows', summary: '"Only one open per customer" can\'t be done by any CHECK: it needs a partial unique index, and a test with two rows.' },
    probar_trigger: { title: 'Testing a trigger', summary: 'By its effect, on each operation it must cover: INSERT, UPDATE, DELETE.' },
    deshacer: { title: "Tests that don't leave a trace", summary: 'Each test leaves the data as it was: BEGIN … ROLLBACK, or functions that undo.' },
  },
  seniorTips: [
    'Read the specification and how to use probar and efecto in the wiki.',
    'Laura: VALUES with 999.99, 1000.00, 60000.00 and 60000.01, and probar(format(…, %L …)).',
    'Marta: VALUES (18), (24), (NULL) for the term.',
    'Carmen: VALUES (999), (NULL), (3) for the customer.',
    "Nuria: VALUES (1, 'abierta'), (1, 'cancelada'), (2, 'abierta').",
    'Diego: two efecto() in one row, one with INSERT and the other with UPDATE.',
    "Inés: VALUES ('abierta'), ('en_estudio'), ('APROBADA'), (NULL).",
    "With Laura: test what must not get in and don't leave leftovers.",
  ],
  lessons: {
    dos_lados: {
      question: 'How is a rule tested?',
      body: `From **both sides**: what the specification says gets in must get in, and what doesn't must fail. And in ranges, at the **exact boundary**:

| Amount | Expected |
|---|---|
| 999.99 | 23514 |
| 1000.00 | ok |
| 60000.00 | ok |
| 60000.01 | 23514 |

A \`>\` where \`>=\` should have been only shows up with 1000.00. With 5000 everything "works".`,
    },
    sqlstate_qa: {
      question: 'What does probar() tell me?',
      body: `\`ok\` if the statement is accepted, or the error's **SQLSTATE**:

| Code | Rule |
|---|---|
| 23514 | CHECK |
| 23502 | NOT NULL |
| 23503 | foreign key |
| 23505 | UNIQUE or primary key |

Comparing codes (and not messages) makes the test stable: the message changes with the language or the rule's name; the code doesn't.`,
    },
    tabla_casos: {
      question: 'How do I test several cases at once?',
      body: `With a table of cases in \`VALUES\` and \`format\` to build each statement:

\`\`\`
SELECT v.plazo,
       probar(format('INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES (2, 5000, %L, %L)', v.plazo, 'abierta')) AS resultado
FROM (VALUES (18), (24), (NULL)) AS v(plazo);
\`\`\`

\`%L\` writes the value as a literal (with quotes) and NULL as NULL. The result reads like a table of cases: input and what happened.`,
    },
    null_reglas: {
      question: 'Why does an empty term get in if there is a CHECK?',
      body: `Because a CHECK only rejects what is **false**, and \`NULL IN (12, 24, …)\` isn't false: it's NULL. The same happens with the foreign key: an empty \`cliente_id\` doesn't point to anything, so it doesn't break it.

If the column is required, it needs **NOT NULL**. And that's why, in each required column, NULL is a test case.`,
    },
    reglas_filas: {
      question: 'How do I test "only one open application per customer"?',
      body: `With **two rows**: one that already exists and another that clashes with it. And with the cases that **must** get in:

| Case | Expected |
|---|---|
| customer 1's second open one | 23505 |
| customer 1's cancelled one | ok |
| customer 2's open one | ok |

A rule like this is implemented with a partial unique index: \`CREATE UNIQUE INDEX … ON solicitudes (cliente_id) WHERE estado = 'abierta'\`.`,
    },
    probar_trigger: {
      question: 'How do I test a trigger?',
      body: `By its **effect**, on **every** operation the specification says it must cover. If \`revisada_en\` is set on create and on modify, there are two cases:

\`\`\`
SELECT efecto(ARRAY['UPDATE solicitudes SET importe = 6000 WHERE id = 1'],
              'SELECT (revisada_en <> ''2026-02-21 10:00'')::text FROM solicitudes WHERE id = 1');
\`\`\`

\`false\`: the trigger didn't fire. It's a \`BEFORE INSERT\` that should have been \`BEFORE INSERT OR UPDATE\`.`,
    },
    deshacer: {
      question: 'Why do my tests have to be undone?',
      body: `Because a test that leaves data changes the next one's scenario: the second run clashes with the application the first one left, or counts one row too many.

\`\`\`
BEGIN;
INSERT INTO solicitudes …;   -- the test
ROLLBACK;                    -- everything as it was
\`\`\`

\`probar\` and \`efecto\` do that inside. The test can be run a thousand times and gives the same.`,
    },
  },
  quiz: {
    pre: {
      q8pre_lados: { question: 'Rule: amount from 1,000 to 60,000, both included. Which cases do you test?', options: ['5000', '999.99, 1000, 60000 and 60000.01', 'Only 1000', '0 and 100000'], explanation: 'Just inside and just outside each boundary.' },
      q8pre_code: { question: '`probar(…)` returns 23514. Which rule fired?', options: ['NOT NULL', 'CHECK', 'Foreign key', 'UNIQUE'], explanation: '23514 = check_violation.' },
      q8pre_null: { question: '`CHECK (plazo_meses IN (12, 24, 36, 48, 60))` and a NULL term. Does it get in?', options: ['No', 'Yes', 'It gives another error', "It's stored as 12"], explanation: "NULL isn't false." },
      q8pre_fk: { question: 'A foreign key without NOT NULL. Can a row without a customer be saved?', options: ['No', 'Yes', 'Only if customer 0 exists', 'It gives 23503'], explanation: "NULL doesn't point to anything, so it doesn't break the key." },
      q8pre_trig: { question: 'A trigger must update `revisada_en` on create and on modify. How many cases at least?', options: ['One', 'Two: an INSERT and an UPDATE', 'None', 'One per column'], explanation: 'One per operation.' },
      q8pre_desh: { question: 'What does `probar(…)` do with what it runs?', options: ['Saves it', 'Always undoes it', 'Saves it if it goes well', 'Deletes it the next day'], explanation: "That's why it can be repeated." },
    },
    post: {
      q8post_feliz: { question: 'Rubén tests the rules with a €5000, 24-month, open application. It passes. What has he tested?', options: ['Every rule', 'Only that the normal case gets in', 'The boundaries', 'The NULLs'], explanation: 'Everything that must not get in is missing.' },
      q8post_23505: { question: 'A second open application from the same customer. What result do you expect if the rule exists?', options: ['ok', '23505', '23514', '23503'], explanation: 'A (partial) unique index.' },
      q8post_format: { question: "What does `format('%L', NULL)` write?", options: ["'NULL'", 'NULL, without quotes', 'An empty string', 'An error'], explanation: "That's why it's useful for testing the empty value." },
      q8post_restos: { question: 'A test does a real INSERT and the next run fails with 23505. Why?', options: ['The rule is wrong', 'The first one left its row', 'PostgreSQL fails', 'Bad luck'], explanation: 'You have to undo.' },
      q8post_estado: { question: 'The specification adds the state "en_estudio". What new case does the test need?', options: ['None', "That 'en_estudio' gets in", "That 'en_estudio' fails", 'Only the old ones'], explanation: 'One case per valid value.' },
      q8post_update: { question: "`efecto` on update returns that `revisada_en` didn't change. What is the trigger missing?", options: ['Nothing', 'Firing on UPDATE too', 'A CHECK', 'A foreign key'], explanation: 'BEFORE INSERT OR UPDATE.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: 'The application rules',
      body: "Good morning.\n\nDiego has put the rules for `solicitudes` in the database. Before the new app relies on them, we test them. The specification and how to use `probar` and `efecto` are in the wiki. And one condition for the whole day: **the table has to stay as it was**.\n\nStart with the amount:\n\n- Try to create an application for customer 2 (24 months, abierta) with amount **999.99**, **1000.00**, **60000.00** and **60000.01**: `importe` and `resultado`.\n\nLaura",
    },
    laura_ok: { body: "Four 23514s. The ones outside are rightly rejected, but **1000 and 60000 too**, and the specification says \"both included\". There's a `>` that should be `>=`. I'll pass it to Diego." },
    marta_plazos: {
      body: 'Hi! The instalment schedule needs the term. Try to create an application for customer 2 (€5000, abierta) with term **18**, **24** and **empty**: `plazo` and `resultado`.',
    },
    marta_thanks: { body: 'The empty one gets in? Well, an application without a term breaks our instalment schedule. I\'ll ask Diego for a NOT NULL. Thanks!' },
    carmen_clientes: {
      body: 'Hi. For Risk, every application has to belong to a customer that exists. Try with customer **999**, **none** and **3** (€5000, 24 months, abierta): `cliente_id` and `resultado`.',
    },
    carmen_thanks: { body: "999 is stopped by the foreign key, but an application **without a customer** gets in. Risk can't accept that. Thanks." },
    laura_feliz: {
      subject: '11:00 · Laura: "Rubén\'s tests all pass"',
      body: "**Laura:** Rubén already has ten tests for the application rules and they all pass. They all create applications with good data: €5000, 24 months, abierta, a customer that exists… Do you give them the go-ahead?",
      choices: {
        dos_lados: {
          text: "No. They only test that **the good gets in**; a rule that lets **everything** in passes them too. You have to test what must **not** get in (each forbidden value, each required NULL) and the **exact boundaries** from both sides: that's how the 1000 and 60000 thing came up.",
          reply: 'Exactly. Ten happy-path cases are one case repeated ten times.',
          effects: { 2: { text: 'Rules are tested from both sides and at their boundaries.' } },
        },
        suficiente: {
          text: 'Yes: if they all pass, the rules work.',
          reply: 'They would pass just the same without any rule. And today we already know 1000 and 60000 fail.',
          effects: { 0: { text: 'You accepted tests that only look at the happy path.' } },
        },
        app: {
          text: 'Yes: the odd cases are already validated by the app.',
          reply: "Today's app. The database rules are there precisely for what the app doesn't stop: scripts, loads, tomorrow's app.",
          effects: { 0: { text: 'You relied on the app so as not to test the rules.' } },
        },
      },
    },
    nuria_abiertas: {
      body: 'Hi. A customer called me with **two different offers** for the same loan. Customer 1 already has an open one: try to create an **abierta** one for 1, a **cancelada** one for 1 and an **abierta** one for 2: `cliente_id`, `estado` and `resultado`.',
    },
    nuria_thanks: { body: "All three get in, including 1's second open one. That's why they got two offers. Thanks!" },
    diego_revision: {
      body: "Hey. The review queue sorts by `revisada_en`, which a trigger sets. Can you test it for me with `efecto`? One row: `al_insertar` (when creating one for customer 6, is it filled in?) and `al_actualizar` (when changing application 1's amount to 6000, does it change?). The details are in the task.",
    },
    diego_thanks: { body: "`true` and `false`. I made it `BEFORE INSERT` and forgot the `OR UPDATE`. Modified ones don't go back to the queue. I'll fix it. Thanks!" },
    ines_estados: {
      body: 'Hi. Product added the **en_estudio** state last month. Try to create one for customer 2 (€5000, 24 months) with **abierta**, **en_estudio**, **APROBADA** and **empty**: `estado` and `resultado`.',
    },
    ines_thanks: { body: "APROBADA and the empty one, rightly rejected. But **en_estudio** too: the CHECK wasn't updated. Thanks." },
    laura_restos: {
      subject: '15:00 · Laura: "the second time they fail"',
      body: "**Laura:** Rubén's tests pass the first time and fail the second: \"23505\" where they expected `ok`, or a count with one row too many. They do real `INSERT`s. What do you suggest?",
      choices: {
        deshacer: {
          text: "That each test **leaves the data as it was**: inside a transaction that ends in `ROLLBACK`, or with functions like `probar` and `efecto`, which always undo. A test that leaves leftovers changes the next one's scenario and stops being repeatable.",
          reply: "That's it. A good test can be run a thousand times and gives the same.",
          effects: { 3: { text: 'Each test is undone and leaves no leftovers.' } },
        },
        truncate: {
          text: 'That he should start with a `TRUNCATE solicitudes` to start from scratch.',
          reply: 'And take everyone else\'s applications in the environment with it. And the "one open" rule would have nothing to clash with.',
          effects: { 0: { text: 'You suggested emptying the table instead of undoing each test.' } },
        },
        ids: {
          text: 'That he should use a different customer each time.',
          reply: 'It delays the problem: the table grows and the counts keep changing. What you have to do is leave nothing.',
          effects: { 0: { text: 'You dodged the leftovers instead of not leaving them.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Laura',
      body: "**Laura:** Six rules, six failures. And none of them showed up with good data. What are you taking away?",
      choices: {
        lesson: {
          text: "That a rule is tested from both sides: what must get in and what must not, the exact boundaries, NULL in each required column, the rules that span rows with two rows and triggers on each operation; that the result is an error code; and that each test is undone and leaves no leftovers.",
          reply: "Very good. Tomorrow, the last one: making sure a new version isn't slower than the previous one.",
        },
        confiar: {
          text: "That if the rule is in the database, it doesn't need testing.",
          reply: 'Today there were six rules in the database and all six were wrong. Check the debrief.',
          effects: { 0: { text: "You came away with the idea that rules aren't tested." } },
        },
      },
    },
  },
})
