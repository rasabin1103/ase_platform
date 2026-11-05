import { m05Modificar } from '../m05-modificar'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 7: Advanced SQL · Mission 5 — Changing data carefully. English version of ../m05-modificar.ts. */
export const m05ModificarEn = missionEn(m05Modificar, {
  ...COMMON_EN,
  title: 'Changing data carefully',
  subtitle: 'UPDATE … FROM, MERGE, DELETE … USING, RETURNING, ON CONFLICT and SAVEPOINT.',
  dayLabel: 'Monday · month 4',
  verdicts: {
    good: {
      title: 'Changes made, and you know what you changed',
      body: 'Limits adjusted, catalogue up to date, copies gone, incidents archived, preferences for everyone and a transaction half undone with a SAVEPOINT. And no row ended up with a random value or the old one.',
    },
    ok: { title: 'Changes, halfway there', body: 'You already change data using several tables, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Changes without control', body: 'Several tasks were left undone. Replay the mission with the cheat sheet on changing data at hand.' },
  },
  briefing: {
    title: 'Month 4 · Changing data carefully',
    paragraphs: [
      "Monday. Today reading isn't enough: the console points to a **test copy** of the database and you can change data. If something goes wrong, \"Restore\" puts it back as it was at the start (it costs time).",
      'Each task is done when the data ends up exactly as asked. If you open a transaction, close it with COMMIT or ROLLBACK.',
    ],
    goals: [
      'Update a table with data from another (UPDATE … FROM) and see what changed with RETURNING.',
      'Sync a catalogue with MERGE or INSERT … ON CONFLICT.',
      'Remove repeated rows with DELETE … USING without deleting the original.',
      'Move rows from one table to another in a single statement.',
      'Insert only what is missing with ON CONFLICT DO NOTHING.',
      'Undo part of a transaction with SAVEPOINT.',
    ],
  },
  docs: {
    chuleta_modificar: {
      title: 'Cheat sheet: changing data carefully',
      updatedLabel: 'Inés Moreno · Data',
      body: `## Today's tables
| table | what it is |
|---|---|
| \`ajustes_limite(tarjeta_id, nuevo_limite)\` | new approved daily limits |
| \`comercios_import(id, nombre, categoria, ciudad)\` | the merchant catalogue sent by the supplier |
| \`incidencias_archivo\` | same structure as \`incidencias\`, empty |

## Statements
| I want | Use |
|---|---|
| See what I changed | \`UPDATE … RETURNING id, column\` (also in INSERT and DELETE) |
| Update with another table | \`UPDATE t SET c = o.c FROM other o WHERE o.id = t.id\` |
| Update or insert | \`MERGE INTO t USING o ON … WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT …\` |
| The same with a unique key | \`INSERT … ON CONFLICT (id) DO UPDATE SET c = EXCLUDED.c\` |
| Insert only what is missing | \`INSERT … ON CONFLICT (id) DO NOTHING\` |
| Delete using another table | \`DELETE FROM t USING other o WHERE …\` |
| Move rows | \`WITH m AS (DELETE … RETURNING *) INSERT INTO target SELECT * FROM m\` |

## Transactions
\`\`\`
BEGIN;
  …
  SAVEPOINT point;
  …
  ROLLBACK TO SAVEPOINT point;   -- undoes only from the point
COMMIT;
\`\`\``,
    },
  },
  sqlLab: {
    starter: '-- Test environment: look before you change\nSELECT t.id, t.limite_diario, a.nuevo_limite\nFROM tarjetas t\nJOIN ajustes_limite a ON a.tarjeta_id = t.id;',
    retos: {
      ajustar_limites: {
        title: 'The new limits, with what changed',
        description: 'Give each card in `ajustes_limite` its `nuevo_limite` in `limite_diario`, in **a single statement** that returns `id` and `limite_diario` of the changed cards.',
        hint: '`UPDATE tarjetas t SET limite_diario = a.nuevo_limite FROM ajustes_limite a WHERE a.tarjeta_id = t.id RETURNING t.id, t.limite_diario;`',
        requires: {
          0: { message: 'Update with the data from the other table: `UPDATE … SET … FROM ajustes_limite …`.' },
          1: { message: 'Return what you changed with `RETURNING`.' },
        },
      },
      sincronizar_comercios: {
        title: 'The merchant catalogue up to date',
        description: 'Leave `comercios` as `comercios_import` says: the ones that already exist, with their new `nombre`, `categoria` and `ciudad`; the ones that don\'t, inserted. Without touching the rest.',
        hint: '`MERGE INTO comercios c USING comercios_import i ON c.id = i.id WHEN MATCHED THEN UPDATE SET … WHEN NOT MATCHED THEN INSERT (…) VALUES (…);`',
        requires: { 0: { message: 'Update or insert in one statement: `MERGE` or `INSERT … ON CONFLICT … DO UPDATE`.' } },
      },
      quitar_copias: {
        title: 'Out with the repeated payments',
        description: 'Some payments have **another identical row** (same card, merchant, amount and time). Delete the **copies** and keep the original (the one with the lowest `id`).',
        hint: '`DELETE FROM pagos_tarjeta p USING pagos_tarjeta o WHERE p.tarjeta_id = o.tarjeta_id AND … AND p.id > o.id;`',
        requires: { 0: { message: 'This task is done by deleting: `DELETE FROM pagos_tarjeta …`.' } },
      },
      archivar: {
        title: 'Archive the 2025 incidents',
        description: 'Move to `incidencias_archivo` the incidents **closed before 1 January 2026**: out of `incidencias` and into the archive, in **a single statement**.',
        hint: "`WITH movidas AS (DELETE FROM incidencias WHERE cerrada_en < '2026-01-01' RETURNING *) INSERT INTO incidencias_archivo SELECT * FROM movidas;`",
        requires: { 0: { message: 'In a single statement: `WITH m AS (DELETE … RETURNING *) INSERT INTO … SELECT * FROM m`.' } },
      },
      preferencias_todos: {
        title: 'Preferences for every customer',
        description: 'Each customer without a row in `preferencias` needs one with `canales` = `{email}` and an empty `intereses` (`{}`). The ones that already have a row, **exactly as they were**.',
        hint: "`INSERT INTO preferencias (cliente_id, canales, intereses) SELECT id, '{email}', '{}' FROM clientes ON CONFLICT (cliente_id) DO NOTHING;`",
        requires: { 0: { message: 'Insert only the missing ones: `ON CONFLICT (cliente_id) DO NOTHING` (or `WHERE NOT EXISTS`).' } },
      },
      savepoint: {
        title: 'A transaction half undone',
        description: 'In a transaction: add **€10** to the balance of the **savings** accounts (`ahorro`), set a `SAVEPOINT`, add €10 to the **current** accounts (`corriente`), **undo only that last part** and commit.',
        hint: '`BEGIN; UPDATE … ahorro; SAVEPOINT antes; UPDATE … corriente; ROLLBACK TO SAVEPOINT antes; COMMIT;`',
        requires: { 0: { message: 'Do it in a transaction with `SAVEPOINT` and confirm it with `COMMIT`.' } },
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'The app shows misspelled merchant names and three are missing', explanation: "The supplier's catalogue never reached the table.", technique: 'MERGE or INSERT … ON CONFLICT DO UPDATE.' },
    'C-CARMEN': { title: 'Three customers see a payment charged twice', explanation: 'The payment copies stayed in the table.', technique: 'DELETE … USING with p.id > o.id.' },
    'C-NURIA': { title: "Nuria's inbox is still full of 2025 incidents", explanation: 'Nobody moved them to the archive.', technique: 'WITH … DELETE … RETURNING + INSERT.' },
    'C-DIEGO': { title: "Customer 38 can't open their settings in the app", explanation: 'They had no row in preferencias.', technique: 'INSERT … ON CONFLICT DO NOTHING.' },
    'C-LAURA': { title: 'The interest test leaves the current accounts changed', explanation: 'Without a SAVEPOINT, it was all or nothing to undo.', technique: 'SAVEPOINT and ROLLBACK TO SAVEPOINT.' },
    'C-DUPLICADO': { title: 'A card ends up with a limit nobody approved', explanation: 'UPDATE … FROM with two source rows for the same card applies any one of them.', technique: 'Check that the source has no repeated keys, or MERGE, which gives an error.' },
    'C-EXCLUDED': { title: 'The merchant sync "updates" without changing anything', explanation: 'SET nombre = nombre keeps the value that was already there.', technique: 'EXCLUDED.nombre is the value you tried to insert.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Monday's changes.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's catalogue", explanation: 'Merchants updated and inserted.' },
      1: { label: "Carmen's payments", explanation: 'Copies out, originals in.' },
      2: { label: "Nuria's inbox", explanation: '2025 incidents in the archive.' },
      3: { label: "Diego's settings", explanation: 'Preferences for everyone.' },
      4: { label: "Laura's test", explanation: 'Only savings changed.' },
      5: { label: 'Source without repeats', explanation: 'One source row per row to change.' },
      6: { label: 'EXCLUDED', explanation: 'The new value, not the old one.' },
    },
  },
  concepts: {
    update_from: { title: 'UPDATE … FROM', summary: 'Update a table with data from another; if the source repeats keys, the result is unpredictable.' },
    returning: { title: 'RETURNING', summary: 'INSERT, UPDATE and DELETE return the affected rows, like a SELECT.' },
    merge: { title: 'MERGE', summary: 'Update the rows that match and insert the ones that don\'t, in one statement.' },
    upsert: { title: 'INSERT … ON CONFLICT', summary: 'DO NOTHING skips the rows that clash with a unique key; DO UPDATE updates them with EXCLUDED.' },
    delete_using: { title: 'DELETE … USING', summary: 'Delete by looking at another table (or the same one), for example the copies of an original.' },
    cte_dml: { title: 'Moving rows with WITH', summary: 'WITH m AS (DELETE … RETURNING *) INSERT … SELECT * FROM m: all or nothing.' },
    savepoint: { title: 'Transactions and SAVEPOINT', summary: 'BEGIN … COMMIT groups changes; ROLLBACK TO SAVEPOINT undoes only part of them.' },
  },
  seniorTips: [
    'Read the cheat sheet on changing data carefully in the wiki.',
    'Inés: UPDATE tarjetas t SET limite_diario = a.nuevo_limite FROM ajustes_limite a WHERE a.tarjeta_id = t.id RETURNING t.id, t.limite_diario.',
    'Marta: MERGE INTO comercios c USING comercios_import i ON c.id = i.id WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT ….',
    'Carmen: DELETE FROM pagos_tarjeta p USING pagos_tarjeta o WHERE (same columns) AND p.id > o.id.',
    "Nuria: WITH m AS (DELETE FROM incidencias WHERE cerrada_en < '2026-01-01' RETURNING *) INSERT INTO incidencias_archivo SELECT * FROM m.",
    "Diego: INSERT INTO preferencias … SELECT id, '{email}', '{}' FROM clientes ON CONFLICT (cliente_id) DO NOTHING.",
    'Laura: BEGIN; UPDATE savings; SAVEPOINT antes; UPDATE current; ROLLBACK TO SAVEPOINT antes; COMMIT;',
    'With Inés: the source of an UPDATE … FROM without repeated keys, and EXCLUDED in ON CONFLICT.',
  ],
  lessons: {
    update_from: {
      question: 'How do I update a table with data from another?',
      body: `With \`FROM\` and the join condition in the \`WHERE\`:

\`\`\`
UPDATE tarjetas t
SET limite_diario = a.nuevo_limite
FROM ajustes_limite a
WHERE a.tarjeta_id = t.id;
\`\`\`

Only the rows of \`tarjetas\` that match change. **Careful:** if the source has two rows for the same card, PostgreSQL applies **any one of them**, without warning. First, \`GROUP BY tarjeta_id HAVING COUNT(*) > 1\` on the source.`,
    },
    returning: {
      question: 'How do I see what I just changed?',
      body: `Add \`RETURNING\` at the end of an INSERT, UPDATE or DELETE: it returns the affected rows, like a SELECT.

\`\`\`
UPDATE … RETURNING t.id, t.limite_diario;
DELETE FROM … RETURNING id;
INSERT INTO … RETURNING id;   -- the id the database generated
\`\`\`

It saves you the checking query and tells you exactly which rows you touched.`,
    },
    merge: {
      question: 'How do I sync one table with another?',
      body: `\`MERGE\` decides row by row:

\`\`\`
MERGE INTO comercios c
USING comercios_import i ON c.id = i.id
WHEN MATCHED THEN
  UPDATE SET nombre = i.nombre, categoria = i.categoria, ciudad = i.ciudad
WHEN NOT MATCHED THEN
  INSERT (id, nombre, categoria, ciudad) VALUES (i.id, i.nombre, i.categoria, i.ciudad);
\`\`\`

If a target row matches two source rows, MERGE **gives an error** instead of picking one: better than a random value.`,
    },
    upsert: {
      question: 'What is ON CONFLICT and what is EXCLUDED?',
      body: `\`INSERT … ON CONFLICT (unique_column)\` says what to do if the row clashes with a unique key:

- \`DO NOTHING\`: it doesn't insert it and carries on with the rest.
- \`DO UPDATE SET nombre = EXCLUDED.nombre\`: it updates the one that was already there.

\`EXCLUDED\` is the row you **were trying** to insert. \`SET nombre = nombre\` keeps the old value. It needs a primary or unique key on those columns.`,
    },
    delete_using: {
      question: 'How do I delete the copies without deleting the original?',
      body: `Join the table with itself using \`USING\` and keep the one with the lowest id:

\`\`\`
DELETE FROM pagos_tarjeta p
USING pagos_tarjeta o
WHERE p.tarjeta_id = o.tarjeta_id AND p.comercio_id = o.comercio_id
  AND p.importe = o.importe AND p.pagado_en = o.pagado_en
  AND p.id > o.id;
\`\`\`

With \`p.id <> o.id\` you would delete both rows of each pair. Try it first with a SELECT with the same conditions.`,
    },
    cte_dml: {
      question: 'How do I move rows from one table to another without losing any?',
      body: `In a single statement, with a WITH that deletes and returns what was deleted:

\`\`\`
WITH movidas AS (
  DELETE FROM incidencias WHERE cerrada_en < '2026-01-01'
  RETURNING *
)
INSERT INTO incidencias_archivo SELECT * FROM movidas;
\`\`\`

It's a single statement: either all of it happens or nothing. With a separate INSERT and then a DELETE, a row that changes in between ends up in one place or in neither.`,
    },
    savepoint: {
      question: 'What is a SAVEPOINT for?',
      body: `\`BEGIN\` opens a transaction: nothing is visible outside until the \`COMMIT\`, and \`ROLLBACK\` undoes all of it. A \`SAVEPOINT\` marks a point in between:

\`\`\`
BEGIN;
UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'ahorro';
SAVEPOINT antes_corrientes;
UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'corriente';
ROLLBACK TO SAVEPOINT antes_corrientes;   -- undoes only the current accounts
COMMIT;
\`\`\`

If a statement fails inside the transaction, everything after it gives an error until a ROLLBACK (or ROLLBACK TO SAVEPOINT).`,
    },
  },
  quiz: {
    pre: {
      a5pre_returning: { question: 'What does `RETURNING id` at the end of an UPDATE do?', options: ['Undoes the change', 'Returns the id of the changed rows', 'Counts the rows', 'Nothing'], explanation: 'It returns the affected rows.' },
      a5pre_update: { question: 'To update `tarjetas` with data from `ajustes_limite`…', options: ['UPDATE tarjetas JOIN ajustes_limite …', 'UPDATE tarjetas t SET … FROM ajustes_limite a WHERE a.tarjeta_id = t.id', 'UPDATE ajustes_limite SET tarjetas …', "It can't be done"], explanation: 'In PostgreSQL, UPDATE … FROM.' },
      a5pre_merge: { question: 'What does MERGE do?', options: ['Joins two tables into one', "Updates the rows that match and inserts the ones that don't", 'Deletes duplicates', 'Creates an index'], explanation: 'WHEN MATCHED / WHEN NOT MATCHED.' },
      a5pre_nothing: { question: 'What does `ON CONFLICT (cliente_id) DO NOTHING` do?', options: ['Fails if there is a conflict', "Doesn't insert the rows that already exist and carries on", 'Deletes the existing one', 'Updates the existing one'], explanation: 'It skips the ones that clash with the unique key.' },
      a5pre_delete: { question: 'To delete the copies and keep the original with the lowest id…', options: ['p.id <> o.id', 'p.id > o.id', 'p.id < o.id', 'DISTINCT'], explanation: 'The one with the highest id of each pair is deleted.' },
      a5pre_savepoint: { question: 'What does `ROLLBACK TO SAVEPOINT x` undo?', options: ['The whole transaction', 'Only what was done after x', 'Only the last statement', 'Nothing'], explanation: 'The transaction stays open from x.' },
    },
    post: {
      a5post_dup: { question: 'The source of an UPDATE … FROM has two rows for card 7 (1,500 and 2,500). What limit remains?', options: ['The higher one', 'Any one of the two, without warning', 'The sum', 'It gives an error'], explanation: 'That is why you have to check the source (or use MERGE, which does give an error).' },
      a5post_excluded: { question: '`ON CONFLICT (id) DO UPDATE SET nombre = nombre`. Which name remains?', options: ['The new one', 'The one that was already there', 'NULL', 'It gives an error'], explanation: 'The new one is EXCLUDED.nombre.' },
      a5post_cte: { question: 'Why move rows with `WITH m AS (DELETE … RETURNING *) INSERT …`?', options: ["It's shorter", "It's a single statement: either all are moved or none, the same rows", "It's always faster", "It can't be done any other way"], explanation: 'What is deleted and what is inserted are exactly the same rows.' },
      a5post_returning: { question: 'What does `DELETE FROM pagos_tarjeta WHERE id = 304 RETURNING *` return?', options: ['Nothing', 'The deleted row, with all its columns', 'The number 1', 'An error'], explanation: 'RETURNING works the same in DELETE.' },
      a5post_merge: { question: 'MERGE finds two source rows for the same target. What happens?', options: ['It uses the first', 'It gives an error', 'It inserts both', 'It ignores them'], explanation: 'Better an error than a random value.' },
      a5post_tx: { question: 'In a transaction, an UPDATE gives an error. What happens with the next statement?', options: ['It runs normally', 'It gives an error until you ROLLBACK (or ROLLBACK TO SAVEPOINT)', 'It commits by itself', 'The UPDATE is repeated'], explanation: 'The transaction is aborted.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: 'Today we write',
      body: 'Good morning.\n\nSo far you have only read. This week it\'s about **changing data**, and doing it well: with several tables at once, knowing which rows you touch and being able to undo. The console points to a **test copy**; if something goes wrong, "Restore" puts it back as it was at the start.\n\nTo start, Risk has approved **new daily limits** for five cards (`ajustes_limite`):\n\n- Put them in `tarjetas.limite_diario` in **a single statement** that returns `id` and `limite_diario` of the changed cards.\n\nInés',
    },
    ines_ok: {
      body: 'Five cards, and RETURNING tells you which ones without another query. Card 11 already had 600: it also counts as changed, because the UPDATE touched it.',
    },
    marta_catalogo: {
      body: "Hi! The supplier sends us the corrected merchant catalogue in `comercios_import`: there are fixed names of merchants we already have and **three new merchants**. Can you leave `comercios` as the supplier says? Without touching the ones that aren't in it.",
    },
    marta_thanks: { body: '"Café Central" without the leading space now, the florist with its category and three more merchants. Thanks!' },
    carmen_copias: {
      body: 'Hi. Some card payments are there **twice**: same card, same merchant, same amount and same time. Delete the **copies** and keep the original, the one with the lowest `id`.',
    },
    carmen_thanks: { body: 'Three copies gone (304, 305 and 306) and the originals in place. Thanks.' },
    ines_repetidas: {
      subject: '11:00 · Inés: "1,500 or 2,500?"',
      body: '**Inés:** Risk sent another batch of limits and card 7 came **twice** in the file: once with 1,500 and once with 2,500. Rubén ran the same `UPDATE … FROM` as you and got no error at all. What limit does card 7 have now?',
      choices: {
        unique: {
          text: "There's no way to know: with two source rows for the same card, `UPDATE … FROM` applies **any one of them** and doesn't warn. Before updating you have to check the source (`GROUP BY tarjeta_id HAVING COUNT(*) > 1`) and decide which one is right. With `MERGE`, on the other hand, it would give an error.",
          reply: 'Exactly. An UPDATE … FROM trusts the source. If the source repeats keys, the result depends on how PostgreSQL reads the rows that day.',
          effects: { 2: { text: 'Check that the source of an UPDATE … FROM has no repeated keys.' } },
        },
        last: {
          text: '2,500, the last one in the file.',
          reply: "A table has no \"last\": without ORDER BY there is no order, and the UPDATE doesn't use one. It can be either of the two.",
          effects: { 0: { text: "You assumed an order the UPDATE doesn't have." } },
        },
        both: {
          text: 'Both are applied, one after the other, and 2,500 remains.',
          reply: 'Each target row is updated only once per statement. One of the two wins, whichever.',
          effects: { 0: { text: 'You thought the UPDATE applies every row of the source.' } },
        },
      },
    },
    nuria_archivo: {
      body: 'Hi. My incident inbox is really slow. Can you **move to the archive** (`incidencias_archivo`) the ones **closed before 1 January 2026**? Out of `incidencias` and into the archive, without losing any along the way.',
    },
    nuria_thanks: { body: 'Eleven to the archive and nineteen in the inbox. What a relief, thanks!' },
    diego_preferencias: {
      body: "Hey. The app's settings screen fails if the customer has **no row** in `preferencias`. I want one for each customer who doesn't have it, with `canales` = `{email}` and an empty `intereses` (`{}`). And the ones who already have it, **leave them untouched**: some people removed email on purpose.",
    },
    diego_thanks: { body: 'Only customer 38 was missing, and the five who removed every channel are still the same. Thanks!' },
    laura_savepoint: {
      body: "Hi. I'm testing the interest payment and I need this state in the copy: **€10 more** in every **savings** account (`ahorro`), and the current accounts (`corriente`) as they were. I want to see that you can undo **only part of it**: in a transaction, add €10 to savings, set a `SAVEPOINT`, add €10 to the current accounts, **go back to the savepoint** and commit.",
    },
    laura_thanks: { body: 'Savings with €130 more across the thirteen accounts and the current accounts untouched. Just what I wanted to test. Thanks!' },
    ines_excluded: {
      subject: '15:00 · Inés: "it updated, but nothing changed"',
      body: '**Inés:** Diego wrote the merchant sync for the nightly job like this:\n\n`INSERT INTO comercios SELECT * FROM comercios_import ON CONFLICT (id) DO UPDATE SET nombre = comercios.nombre, categoria = comercios.categoria, ciudad = comercios.ciudad;`\n\nIt gives no error and says it processed seven rows, but the names are still wrong. What do you tell him?',
      choices: {
        excluded: {
          text: "That in `DO UPDATE`, `comercios.nombre` is the value that **was already there**: he's setting it to itself. The value he was trying to insert is `EXCLUDED.nombre`. It has to be `SET nombre = EXCLUDED.nombre, categoria = EXCLUDED.categoria, ciudad = EXCLUDED.ciudad`.",
          reply: "That's it. EXCLUDED is the row that clashed. Without it, DO UPDATE does nothing useful and on top of that counts it as done.",
          effects: { 3: { text: 'In ON CONFLICT DO UPDATE, the new value is EXCLUDED.column.' } },
        },
        nothing: {
          text: 'That he should use `DO NOTHING`, which is safer.',
          reply: 'With DO NOTHING the merchants that already exist keep the wrong name. We want to update them, with the right value.',
          effects: { 0: { text: "DO NOTHING doesn't update anything." } },
        },
        commit: {
          text: "That he's probably missing a COMMIT.",
          reply: 'Without an open transaction, each statement commits by itself. The changes are there: each value was just changed to itself.',
          effects: { 0: { text: "You blamed the transaction for a SET that doesn't change anything." } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Inés',
      body: '**Inés:** First day writing. What are you taking away?',
      choices: {
        lesson: {
          text: 'That before changing I have to know which rows I touch (a SELECT with the same conditions, and RETURNING); that the source of an UPDATE … FROM must not repeat keys; that MERGE and ON CONFLICT sync, with EXCLUDED for the new value; that DELETE … USING with `p.id > o.id` keeps the original; that moving rows is done in one statement; and that a SAVEPOINT undoes only part.',
          reply: "Very good. Tomorrow, making the database refuse bad data: rules.",
        },
        restore: {
          text: "That it doesn't matter if you make a mistake, because you can always restore.",
          reply: 'In the test copy, yes. In production there is no "Restore" button. Check the debrief.',
          effects: { 0: { text: 'You came away with the idea that you can always restore.' } },
        },
      },
    },
  },
})
