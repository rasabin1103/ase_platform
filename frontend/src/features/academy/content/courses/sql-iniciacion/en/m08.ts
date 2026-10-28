import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m08Modificar } from '../m08-modificar'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 8 — Changing data carefully. English version of ../m08-modificar.ts. */
export const m08ModificarEn = missionEn(
  m08Modificar,
  {
    title: 'Changing data carefully',
    subtitle: 'INSERT, UPDATE, DELETE and transactions in the test environment.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Thursday · week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Clean changes',
        body: 'Laura had her test data and you cleaned it up at the end, the expired cards are blocked, the customers without a segment have one and nobody has blocked 52 accounts by mistake.',
      },
      ok: { title: 'Changes with a scare or two', body: 'You already modify data, but a task or a habit fell by the wayside. Check the debrief.' },
      bad: {
        title: 'Half-done changes',
        body: "Several tasks were left undone or the environment wasn't left as it should be. Replay the mission: SELECT first, BEGIN, and COMMIT or ROLLBACK.",
      },
    },
    briefing: {
      title: 'Week 2 · Changing data carefully',
      paragraphs: [
        'Thursday of week 2. Today you work in the test environment: a copy of the database where you can modify data.',
        'The tasks are checked by looking at how the database is left after each run. If you wreck it, “Restore the database” puts it back as it was at the start (it costs minutes of the working day, and it also undoes what you had done right).',
      ],
      goals: [
        'Add rows with INSERT respecting the foreign keys.',
        'Change only the right rows with UPDATE … WHERE.',
        'Delete with DELETE in the right order.',
        'Rehearse inside BEGIN and decide with COMMIT or ROLLBACK.',
        'Check with a SELECT before modifying.',
      ],
    },
    docs: {
      chuleta_cambios: {
        title: 'Cheat sheet: modifying data without scares',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Statements
- \`INSERT INTO table (col1, col2) VALUES (v1, v2);\`
- \`UPDATE table SET col = value WHERE condition;\`
- \`DELETE FROM table WHERE condition;\`

## The ritual
1. \`SELECT … WHERE condition;\` → are these the rows? how many?
2. \`BEGIN;\`
3. \`UPDATE … WHERE condition;\` (the **same** WHERE) → look at “UPDATE n”.
4. \`SELECT\` to check.
5. \`COMMIT;\` if it adds up · \`ROLLBACK;\` if not.

## Rules
- Without WHERE **everything** is changed or deleted.
- Foreign keys: what is referenced is created first (customer) and what references is deleted first (account).
- If something fails inside a transaction: \`ROLLBACK;\`.
- What has history is marked (status), not deleted.`,
      },
    },
    sqlLab: {
      starter: "-- Test environment: here you can modify data.\n-- Before changing anything, look at which rows you are going to touch:\nSELECT id, tipo, limite_diario\nFROM tarjetas\nWHERE tipo = 'debito';",
      retos: {
        ensayo: {
          title: 'Rehearsal with a safety net',
          description: 'In **a single run**: `BEGIN`, raise the `limite_diario` of the **debit** (`debito`) cards by 10 %, check it with a `SELECT` and undo it with `ROLLBACK`. The limits must be left as they were.',
          hint: "`BEGIN; UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito'; SELECT id, limite_diario FROM tarjetas WHERE tipo = 'debito'; ROLLBACK;`",
        },
        alta_cliente: {
          title: 'Test customer',
          description: 'Create customer **41**: Prueba · QA Kobalto · qa.prueba@kobalto.test · Madrid · sign-up 2026-01-15 · segment estandar.',
          hint: "`INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento) VALUES (41, 'Prueba', 'QA Kobalto', 'qa.prueba@kobalto.test', 'Madrid', '2026-01-15', 'estandar');`",
        },
        cuenta_prueba: {
          title: 'Test account',
          description: 'Create account **53** for customer 41: IBAN ES76 2100 9999 0000 0053 · corriente · balance 100 · opened 2026-01-15 · activa.',
          hint: "Customer 41 has to exist first (foreign key). The `moneda` isn't needed: its default value is EUR.",
        },
        bloquear_caducadas: {
          title: 'Block the expired ones',
          description: 'Set the status of the **active** cards that expired **before 1 January 2026** to **bloqueada**. No others.',
          hint: "First the SELECT with the WHERE; then `UPDATE tarjetas SET estado = 'bloqueada' WHERE estado = 'activa' AND caduca_en < '2026-01-01'`.",
        },
        segmento: {
          title: 'Segment for those who have none',
          description: 'Set the segment **estandar** for the customers who **have no segment**. Only them.',
          hint: "`UPDATE clientes SET segmento = 'estandar' WHERE segmento IS NULL` (with `= NULL` nothing would change).",
        },
        borrar_prueba: {
          title: 'Clean up the test data',
          description: 'Delete account **53** and customer **41**. Nothing else.',
          hint: "First the account (`DELETE FROM cuentas WHERE id = 53`) and then the customer: the other way round, the foreign key won't let you.",
        },
      },
    },
    bugs: {
      'C-TESTS': {
        title: "Laura can't test account creation",
        explanation: 'The test customer or the test account were missing.',
        technique: 'INSERT respecting the foreign keys.',
      },
      'C-CADUCADAS': {
        title: 'The expired cards are still active',
        explanation: 'The old data was not corrected.',
        technique: 'UPDATE with the WHERE checked beforehand.',
      },
      'C-SEGMENTO': { title: 'Customers without a segment are still left', explanation: "Marta's task was left undone.", technique: 'UPDATE … WHERE segmento IS NULL.' },
      'C-BASURA': {
        title: 'The test data stays in the environment',
        explanation: 'The test customer and account are still there and pollute the reports.',
        technique: 'DELETE in order: account and then customer.',
      },
      'C-SIN-WHERE': {
        title: 'An UPDATE without WHERE blocks all the accounts',
        explanation: 'Without a previous SELECT or a transaction, nobody saw “UPDATE 52” in time.',
        technique: 'SELECT with the same WHERE, BEGIN and check the affected rows.',
      },
      'C-HISTORIAL': {
        title: 'An account with history is deleted in production',
        explanation: 'Deleting data with history breaks audits and references.',
        technique: 'Soft delete: mark, do not delete.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: 'How the test environment was left on Thursday.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Test data', explanation: 'Customer and account created.' },
        1: { label: 'Expired cards', explanation: 'Only the right ones blocked.' },
        2: { label: 'Complete segments', explanation: 'IS NULL in the WHERE.' },
        3: { label: 'Clean environment', explanation: 'DELETE in order.' },
        4: { label: 'The ritual', explanation: 'SELECT, BEGIN, check, COMMIT or ROLLBACK.' },
        5: { label: 'History intact', explanation: 'Soft delete.' },
      },
    },
    concepts: {
      insert: { title: 'INSERT', summary: 'Adds rows: columns and values in the same order; omitted ones take their default value.' },
      update: { title: 'UPDATE', summary: 'Changes columns of the rows that meet the WHERE; without WHERE, of all of them.' },
      delete: { title: 'DELETE', summary: 'Deletes the rows that meet the WHERE; without WHERE, all of them.' },
      where_first: { title: 'SELECT before modifying', summary: 'Check with the same WHERE which rows and how many you are going to touch.' },
      transactions: { title: 'Transactions', summary: 'BEGIN groups changes; COMMIT confirms them and ROLLBACK undoes them.' },
      fk_order: { title: 'Foreign keys and order', summary: 'What is referenced is created first and what references is deleted first.' },
      soft_delete: { title: 'Soft delete', summary: 'What has history is marked (status, end date), not deleted.' },
    },
    seniorTips: [
      'Read the data-modification cheat sheet in the wiki.',
      "Inés: BEGIN; UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito'; SELECT …; ROLLBACK;",
      "Laura: INSERT INTO clientes (…) VALUES (41, 'Prueba', 'QA Kobalto', …); then INSERT INTO cuentas (…) VALUES (53, 41, …).",
      "Laura: UPDATE tarjetas SET estado = 'bloqueada' WHERE estado = 'activa' AND caduca_en < '2026-01-01'.",
      "Marta: UPDATE clientes SET segmento = 'estandar' WHERE segmento IS NULL.",
      'Laura: DELETE FROM cuentas WHERE id = 53; DELETE FROM clientes WHERE id = 41;',
      'With Inés: SELECT first, BEGIN and check the affected rows; what has history is not deleted.',
    ],
    lessons: {
      insert: {
        question: 'How do I add a row?',
        body: `With \`INSERT INTO\`, the list of columns and the values **in the same order**:

\`\`\`
INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento)
VALUES (41, 'Prueba', 'QA Kobalto', 'qa.prueba@kobalto.test', 'Madrid', '2026-01-15', 'estandar');
\`\`\`

- Text and dates in single quotes; numbers without quotes.
- The columns you leave out take their default value (\`moneda\` → 'EUR') or NULL.
- A foreign key must point to something that exists: first the customer, then their account.`,
      },
      update: {
        question: 'How do I change data?',
        body: `\`\`\`
UPDATE tarjetas
SET estado = 'bloqueada'
WHERE estado = 'activa' AND caduca_en < '2026-01-01';
\`\`\`

- \`SET\` says what changes (several columns separated by commas; you can use the column itself: \`limite_diario = limite_diario * 1.10\`).
- \`WHERE\` says **which rows**. **Without WHERE all of them are changed.**
- PostgreSQL answers with the affected rows: “UPDATE 2”. Check it.`,
      },
      delete: {
        question: 'How do I delete rows?',
        body: `\`DELETE FROM cuentas WHERE id = 53;\`

Just like UPDATE: **without WHERE everything is deleted**. And there is no recycle bin.`,
      },
      select_first: {
        question: 'What do I do before an UPDATE or a DELETE?',
        body: `First write the **SELECT with the same WHERE**:

\`SELECT id, estado, caduca_en FROM tarjetas WHERE estado = 'activa' AND caduca_en < '2026-01-01';\`

Are they the rows you expect? How many? Only then change \`SELECT … FROM\` to \`UPDATE … SET\` (or \`DELETE FROM\`) **without touching the WHERE**.`,
      },
      transactions: {
        question: 'What is a transaction?',
        body: `A group of changes that are confirmed or undone **together**:

\`\`\`
BEGIN;
UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito';
SELECT id, limite_diario FROM tarjetas WHERE tipo = 'debito';  -- does it add up?
ROLLBACK;   -- undoes everything (or COMMIT to confirm it)
\`\`\`

Until you \`COMMIT\`, the changes are not final. If a statement fails inside the transaction, it is **aborted**: leave with \`ROLLBACK\`. The console warns you if you leave a transaction open.`,
      },
      fk_order: {
        question: "Why won't it let me delete the customer?",
        body: `Because they have an account that references them (\`cuentas.cliente_id\`). The **foreign key** prevents leaving orphan accounts.

You delete in the reverse order of creation: **first what references** (the account), **then what is referenced** (the customer):

\`\`\`
DELETE FROM cuentas WHERE id = 53;
DELETE FROM clientes WHERE id = 41;
\`\`\``,
      },
      soft: {
        question: 'Is what is no longer used always deleted?',
        body: `Almost never in real systems. Data with **history** (accounts with movements, customers with contracts) is **marked**: a status (“cerrada”), an end date… That is **soft delete**.

That way the history, audits and references are kept. A real \`DELETE\` is reserved for test data or very controlled cases.`,
      },
    },
    quiz: {
      pre: {
        s8pre_insert: {
          question: 'Which statement adds a new row?',
          options: ['ADD', 'INSERT INTO … VALUES …', 'UPDATE … SET …', 'CREATE ROW'],
          explanation: 'INSERT INTO table (columns) VALUES (values).',
        },
        s8pre_update: {
          question: "What does `UPDATE cuentas SET estado = 'bloqueada';` do?",
          options: ['Blocks the first account', 'Gives an error because the WHERE is missing', 'Blocks all the accounts', 'Does nothing'],
          explanation: 'Without WHERE, the UPDATE affects all the rows.',
        },
        s8pre_delete: {
          question: 'How do you delete only account 53?',
          options: ['DELETE cuentas 53', 'DELETE FROM cuentas WHERE id = 53', 'DROP cuentas WHERE id = 53', 'REMOVE FROM cuentas 53'],
          explanation: 'DELETE FROM table WHERE condition.',
        },
        s8pre_tx: {
          question: 'What does ROLLBACK do?',
          options: ['Confirms the changes', 'Undoes the changes of the transaction', 'Repeats the last statement', 'Restores a backup'],
          explanation: 'ROLLBACK undoes; COMMIT confirms.',
        },
        s8pre_fk: {
          question: "It won't let you delete a customer because they have an account. Why?",
          options: ['Because of permissions', "The foreign key of cuentas references them", "Customers can't be deleted", 'A COMMIT is missing'],
          explanation: 'First you delete what references (the account).',
        },
        s8pre_first: {
          question: 'What comes first before a DELETE in production?',
          options: ['Running it fast', 'A SELECT with the same WHERE to see which rows would be deleted', 'Removing the WHERE', 'Disabling the foreign keys'],
          explanation: 'See which rows and how many before touching anything.',
        },
      },
      post: {
        s8post_insert: {
          question: "In an INSERT you don't put the `moneda` column, which has DEFAULT 'EUR'. What value does it take?",
          options: ['NULL', "'EUR'", 'It gives an error', 'An empty string'],
          explanation: 'Omitted columns take their default value.',
        },
        s8post_update: {
          question: 'How do you raise the limit of the debit cards by 10 %?',
          options: ["UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito'", "UPDATE tarjetas limite_diario + 10% WHERE tipo = 'debito'", 'SET tarjetas.limite_diario = 1.10', "UPDATE tarjetas SET limite_diario = 10 WHERE tipo = 'debito'"],
          explanation: 'SET can use the current value of the column.',
        },
        s8post_count: {
          question: 'You expected to block 2 cards and PostgreSQL answers “UPDATE 32”. You are inside a BEGIN. What do you do?',
          options: ['COMMIT', 'ROLLBACK and check the WHERE', "Nothing, it's already done", 'Another UPDATE to correct it'],
          explanation: 'Inside the transaction it can still be fixed: ROLLBACK.',
        },
        s8post_tx: {
          question: 'A statement fails inside a BEGIN. What happens to the following ones?',
          options: ['They run normally', 'They are ignored: the transaction is aborted until ROLLBACK', 'They are confirmed on their own', 'They run twice'],
          explanation: 'An aborted transaction only accepts ROLLBACK.',
        },
        s8post_fk: {
          question: 'In what order do you delete customer 41 and their account 53?',
          options: ['The customer first', 'The account first and then the customer', "It doesn't matter", 'The whole table has to be deleted'],
          explanation: 'First what references, then what is referenced.',
        },
        s8post_soft: {
          question: 'A closed account with transfers. What do you do with it?',
          options: ['DELETE', 'I leave it marked as closed (soft delete)', 'I delete its transfers and then the account', 'TRUNCATE'],
          explanation: 'Data with history is marked, not deleted.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Today: test environment (and be careful)',
        body: "Good morning!\n\nToday you change database: it is no longer the read-only replica, but the **test environment**, a copy where you **can modify data** with `INSERT`, `UPDATE` and `DELETE`. If something goes wrong, you have the **“Restore the database”** button. In production that button doesn't exist: that is why today we practice the habits that save you there.\n\nFirst exercise, to rehearse with a safety net:\n\n- In **a single run**: open a transaction (`BEGIN`), raise the `limite_diario` of the **debit** cards by 10 %, look at the result with a `SELECT` and **undo it** with `ROLLBACK`.\n\nIn the end, the limits must be as they were.\n\nInés",
      },
      ines_ok: {
        body: 'You saw the raised limits and, with the ROLLBACK, everything went back to how it was. That is the trick: inside a transaction you can look at the effect of a change before deciding whether to confirm it (`COMMIT`) or undo it (`ROLLBACK`).',
      },
      laura_alta: {
        body: "Hi. To test account creation I need test data in the environment:\n\n1. A **customer** with `id` 41, first name **Prueba**, surname **QA Kobalto**, email **qa.prueba@kobalto.test**, city **Madrid**, sign-up date **2026-01-15** and segment **estandar**.\n2. An **account** of theirs with `id` 53, IBAN **ES76 2100 9999 0000 0053**, type **corriente**, balance **100**, opened on **2026-01-15** and status **activa** (the currency sets itself: EUR).",
      },
      laura_alta_thanks: { body: "Test customer and account created. I can now run my tests. Thanks! I'll ask you to clean it up later." },
      ines_sin_where: {
        subject: '11:00 · Inés: “Diego has blocked all the accounts”',
        body: "**Inés:** This morning Diego wanted to block **one** account in the test environment and ran:\n\n`UPDATE cuentas SET estado = 'bloqueada';`\n\nResult: “UPDATE 52”. All 52 accounts blocked and half the QA team stopped. Here we fix it by restoring, but in production it would have been a disaster. What habits do you recommend to him before an UPDATE or a DELETE?",
        choices: {
          habits: {
            text: 'First write a **SELECT with the same WHERE** and check how many rows and which ones. Then, make the change inside a **BEGIN**, check that the number of affected rows is the expected one and only then **COMMIT** (or ROLLBACK if it doesn\'t add up). And never an UPDATE or DELETE without WHERE unless you really want to change everything.',
            reply: "That's it. “UPDATE 52” when you expected “UPDATE 1” is the alarm: inside a transaction it can still be fixed.",
            effects: { 3: { text: 'Before modifying: SELECT with the same WHERE, BEGIN, check the affected rows and COMMIT or ROLLBACK.' } },
          },
          careful: {
            text: 'To be more careful next time.',
            reply: "“Being careful” is not a method. A previous SELECT and a transaction are.",
            effects: { 0: { text: 'You recommended care, not a method.' } },
          },
          backup: {
            text: "It's no big deal: that's what backups are for.",
            reply: 'Restoring a backup in production takes hours and loses whatever happened since. Better not to need it.',
            effects: { 0: { text: 'You relied on the backup instead of avoiding the mistake.' } },
          },
        },
      },
      laura_bloquear: {
        body: "The fix for the expired-cards process is already in testing, but the old data has to be corrected by hand: **block** the **active** cards that **expired before 1 January 2026**. Only those: the others are not touched.",
      },
      laura_bloquear_thanks: {
        body: 'Two cards blocked, and the one that was already blocked stays the same. Perfect: in production it will be done the same way, with the same WHERE.',
      },
      marta_segmento: {
        body: "Hi. About the customers without a segment: we have decided they move to **estandar**. Can you change it in the test environment? Only those with no segment.",
      },
      marta_segmento_thanks: { body: 'Done: nobody is left without a segment and the premium ones are still premium. Thanks!' },
      laura_borrar: {
        body: "My tests have finished. Can you **delete** the test account and customer (account 53 and customer 41)? So they don't stay there polluting the environment.",
      },
      laura_borrar_thanks: { body: 'Clean. And in the right order: first the account and then the customer. Thanks!' },
      ines_borrado: {
        subject: '15:00 · Inés: “Shall we delete the closed account?”',
        body: "**Inés:** Marta proposes tidying up **production**: “account 23 is closed, why don't we delete it with a DELETE?”. What do you answer?",
        choices: {
          soft: {
            text: "No: that account has transfers, and a bank's history is not deleted. The database wouldn't even allow it because of the foreign key. That is what the “cerrada” status is for: the account stays, but marked. Real deletion is left for test data or very controlled cases.",
            reply: 'Exactly. In most real systems nothing is deleted: it is marked (status, end date). That is what is called soft delete.',
            effects: { 3: { text: 'Data with history is not deleted: it is marked (soft delete).' } },
          },
          cascade: {
            text: 'Yes, and delete its transfers too so it does not give an error.',
            reply: 'That would make movements of other customers who received money from that account disappear. History is not touched.',
            effects: { 0: { text: 'You were going to delete history in order to delete an account.' } },
          },
          yes: {
            text: "Yes: if it's closed, it's of no use.",
            reply: "It is useful for audits, for the customer's history and for the transfers that reference it. Better to mark it than to delete it.",
            effects: { 0: { text: 'You proposed deleting data with history.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** First day modifying data and nothing broken. What are you taking away?',
        choices: {
          lesson: {
            text: 'That INSERT adds, UPDATE changes and DELETE deletes; that before changing anything I do a SELECT with the same WHERE; that I work inside BEGIN and decide with COMMIT or ROLLBACK; that foreign keys set the order of deletion; and that what has history is marked, not deleted.',
            reply: 'Perfect. Tomorrow, the last step: creating your own table with its rules.',
          },
          restore: {
            text: 'That if I make a mistake, I hit “Restore”.',
            reply: "In production there is no restore button. Check the debrief.",
            effects: { 0: { text: "You came away with the restore button, which doesn't exist in production." } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support', laura: 'QA Lead' }),
)
