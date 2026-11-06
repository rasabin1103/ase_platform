import { m00LoQueHizo } from '../m00-lo-que-hizo'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 8: SQL for QA · Mission 0 — What the app did. English version of ../m00-lo-que-hizo.ts. */
export const m00LoQueHizoEn = missionEn(m00LoQueHizo, {
  ...COMMON_EN,
  title: 'What the app did',
  subtitle: 'Verify in the database what an app test run reported as fine.',
  dayLabel: 'Monday · month 4',
  verdicts: {
    good: {
      title: "The database doesn't lie",
      body: 'The app said "all good" and you found an amount multiplied by ten, an entry without its counterpart, a transfer made even though the app showed an error, another one without audit and an account with €250 too much. And the previous day\'s run didn\'t throw you off.',
    },
    ok: { title: 'Verification, halfway there', body: 'You already look at the database after a test, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: "The test passed… and it shouldn't have", body: 'Several tasks were left undone and the defects reached production. Replay the mission with the cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · What the app did',
    paragraphs: [
      'Monday. You start in the QA team with Laura. This morning the test run **R-0306** was launched against the app: seven transfers. The app says five went fine and two gave an error.',
      'Your job: check in the database what **really** happened. Each task is done when the query returns exactly the rows and columns asked for.',
    ],
    goals: [
      'Find in the database what a test run created.',
      'Compare the values the app asked for with the ones that were stored.',
      'Check that each transfer has its two entries and that they add up to zero.',
      'Look for what was done even though the app showed an error.',
      'Check the side effects: audit and balances.',
      'Keep only the data of your own run.',
    ],
  },
  docs: {
    chuleta_verificar: {
      title: 'Cheat sheet: verifying what the app did',
      updatedLabel: 'Laura Méndez · QA',
      body: `## Test tables
| table | what it holds |
|---|---|
| \`ejecuciones\` | what the test did: \`ejecucion\` (R-0305, R-0306), \`caso\`, \`referencia\`, accounts, the \`importe\` requested and \`resultado_ui\` (ok / error) |
| \`transferencias\` | what the app stored; the \`concepto\` is the test reference |
| \`apuntes\` | double entry: each completed transfer leaves **two** entries, a negative one on the source and a positive one on the destination |
| \`saldos_antes\` | snapshot of the balances taken at 09:55, before R-0306 |
| \`auditoria\` | one row per creation (\`tabla\`, \`registro_id\`) |

## What to check after a test
1. **That it exists**: the row the app says it created.
2. **That the values are the requested ones**: amount, accounts, status.
3. **That the invariants hold**: entries add up to zero, the balance adds up.
4. **That there are no extra effects**: what failed shouldn't have left anything.
5. **That the side effects are there**: audit, notifications…

## To keep only your run
\`\`\`
FROM ejecuciones e
JOIN transferencias t ON t.concepto = e.referencia
WHERE e.ejecucion = 'R-0306'
\`\`\``,
    },
  },
  sqlLab: {
    starter: "-- What test run R-0306 did, according to the test itself\nSELECT caso, referencia, cuenta_origen_id, cuenta_destino_id, importe, resultado_ui\nFROM ejecuciones\nWHERE ejecucion = 'R-0306'\nORDER BY caso;",
    retos: {
      transferencias_prueba: {
        title: 'The transfers R-0306 left behind',
        description: 'The transfers in the database whose concept is the **reference** of an operation of run **R-0306**: `id`, `concepto`, `importe` and `estado`.',
        hint: "`FROM transferencias WHERE concepto IN (SELECT referencia FROM ejecuciones WHERE ejecucion = 'R-0306')`.",
      },
      importes_distintos: {
        title: "Amounts that aren't the requested ones",
        description: 'The operations of **R-0306** whose transfer was stored with an **amount different** from the one the test requested: `referencia`, `importe_app` and `importe_bd`.',
        hint: "`FROM ejecuciones e JOIN transferencias t ON t.concepto = e.referencia WHERE e.ejecucion = 'R-0306' AND t.importe <> e.importe`.",
      },
      partida_doble: {
        title: 'Transfers without their double entry',
        description: "The transfers of **R-0306** that **don't** have exactly **two entries** that **add up to zero**: `transferencia_id`, `apuntes` (how many it has) and `suma`.",
        hint: '`LEFT JOIN apuntes a ON a.transferencia_id = t.id`, `GROUP BY t.id` and `HAVING COUNT(a.id) <> 2 OR COALESCE(SUM(a.importe), 0) <> 0`.',
      },
      error_pero_hecha: {
        title: 'Error in the app, but it was done',
        description: 'The operations of **R-0306** that the app marked as **error** but that **did** leave a transfer: `referencia`, `id` (of the transfer) and `estado`.',
        hint: "`… WHERE e.ejecucion = 'R-0306' AND e.resultado_ui = 'error'` with the JOIN to transferencias.",
      },
      sin_auditoria: {
        title: 'Transfers without audit',
        description: "The transfers of **R-0306** that **don't** have their row in `auditoria` (`tabla = 'transferencias'` and `registro_id` = the id): one column `id`.",
        hint: "`AND NOT EXISTS (SELECT 1 FROM auditoria au WHERE au.tabla = 'transferencias' AND au.registro_id = t.id)`.",
      },
      saldos_descuadrados: {
        title: "Balances that don't match the entries",
        description: "For the accounts with entries from **R-0306**: the ones whose **balance change** (current balance − `saldos_antes`) **doesn't match** the **sum of their R-0306 entries**: `cuenta_id`, `cambio_saldo` and `suma_apuntes`.",
        hint: 'First the sum of entries per account, only from R-0306 (`apuntes → transferencias → ejecuciones`), and then the JOIN with `cuentas` and `saldos_antes`.',
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'A customer sees €300 on a €30 transfer', explanation: 'The test only checked that the transfer existed, not its amount.', technique: 'Compare the requested value with the stored one.' },
    'C-CARMEN': { title: '€75.50 leave an account and never arrive anywhere', explanation: 'A transfer was left with a single entry.', technique: 'Invariant: two entries that add up to zero.' },
    'C-NURIA': { title: 'A customer repeats a transfer that "failed" and pays it twice', explanation: 'The app showed an error, but the operation was done.', technique: 'Look for effects of the operations that errored.' },
    'C-DIEGO': { title: "Internal audit can't find the trail of a transfer", explanation: 'A transfer was stored without its audit row.', technique: 'NOT EXISTS on the audit table.' },
    'C-INES': { title: "Account 9 has €250 that don't belong to it", explanation: 'The balance was updated twice for the same transfer.', technique: 'Balance after = balance before + entries.' },
    'C-EXISTE': { title: 'The automated tests stay green with wrongly stored data', explanation: 'The checks only looked at whether the row existed.', technique: 'Check values, not just existence.' },
    'C-MEZCLA': { title: 'A test report flags four accounts as out of balance that were fine', explanation: "Another run's entries were added in.", technique: 'Filter by the run (references or time window).' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: 'What happened with run R-0306.',
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's amounts", explanation: 'Requested value = stored value.' },
      1: { label: "Carmen's entries", explanation: 'Two entries that add up to zero.' },
      2: { label: "Nuria's customers", explanation: 'What failed left nothing behind.' },
      3: { label: "Diego's audit", explanation: 'Every creation with its trail.' },
      4: { label: "Inés's balances", explanation: 'Balance after = before + entries.' },
      5: { label: 'Values, not just rows', explanation: 'Check what was stored.' },
      6: { label: 'Only my run', explanation: 'Without mixing in other tests.' },
    },
  },
  concepts: {
    verificar_bd: { title: 'Verifying in the database', summary: 'The screen says what the app believes; the database, what was left. A test compares both.' },
    valores: { title: 'Values, not just existence', summary: "The row existing isn't enough: amount, accounts and status have to be the requested ones." },
    invariantes: { title: 'Invariants', summary: "Rules that always hold: a transfer's entries add up to zero, the balance is the previous one plus the movements." },
    efectos_error: { title: 'Effects of what failed', summary: 'An operation that errors should leave nothing; if it leaves something, the user will repeat it.' },
    efectos_secundarios: { title: 'Side effects', summary: 'Audit, notifications, balances: what has to happen besides the main row.' },
    foto_antes: { title: 'The snapshot before', summary: 'To measure a change you need the state before: a copy of the balances when the test starts.' },
    aislar: { title: 'Isolating your run', summary: "Filter by your test's identifiers or time window so you don't mix in others." },
  },
  seniorTips: [
    'Read the cheat sheet on verifying what the app did in the wiki.',
    "Laura: transferencias WHERE concepto IN (SELECT referencia FROM ejecuciones WHERE ejecucion = 'R-0306').",
    'Marta: JOIN ejecuciones–transferencias by reference and t.importe <> e.importe.',
    'Carmen: LEFT JOIN apuntes, GROUP BY t.id, HAVING COUNT(a.id) <> 2 OR SUM <> 0.',
    "Nuria: the same JOIN with e.resultado_ui = 'error'.",
    "Diego: NOT EXISTS in auditoria with tabla = 'transferencias' and registro_id = t.id.",
    'Inés: sum of entries per account only from R-0306, compared with saldo − saldos_antes.',
    'With Laura: check values and not just existence, and always filter by your run.',
  ],
  lessons: {
    verificar_bd: {
      question: 'Why look at the database if the app already says "ok"?',
      body: `The screen shows what the app **believes** happened: a server response, a message. The database stores what **really** was left.

An end-to-end test closes in both places:

- **Screen**: the user sees what they should see.
- **Database**: what had to be left is there, no more and no less.

Today the app said "ok" for five operations and the database had problems in three.`,
    },
    valores: {
      question: "Isn't it enough to check that the transfer exists?",
      body: `\`SELECT COUNT(*) … WHERE concepto = 'REF-1007'\` gives 1 and the test passes… with €300 stored instead of 30.

Compare with what the test requested:

\`\`\`
SELECT e.referencia, e.importe AS importe_app, t.importe AS importe_bd
FROM ejecuciones e
JOIN transferencias t ON t.concepto = e.referencia
WHERE e.ejecucion = 'R-0306' AND t.importe <> e.importe;
\`\`\`

Zero rows = everything matches. Each row is a defect with its reference.`,
    },
    invariantes: {
      question: 'What is an invariant and why does it help?',
      body: `A rule that has to hold **always**, whatever happens in the app:

- Each completed transfer has **two entries** and they **add up to zero**.
- An account's balance = previous balance + its entries.

You don't need to know what each test did: if an invariant fails, something broke.

\`\`\`
… GROUP BY t.id
HAVING COUNT(a.id) <> 2 OR COALESCE(SUM(a.importe), 0) <> 0
\`\`\`

The \`LEFT JOIN\` matters: with a normal JOIN, a transfer with **no** entries at all would disappear from the result.`,
    },
    efectos_error: {
      question: 'What should you look at when the app shows an error?',
      body: `That **nothing** was left. If the app says "error" (because of a timeout, for example) but the server finished the operation, the user will try again and do it **twice**.

\`\`\`
… WHERE e.ejecucion = 'R-0306' AND e.resultado_ui = 'error'
\`\`\`

with the JOIN to transferencias: each row is a "failed" operation that was actually done. It's the kind of defect you only see in the database.`,
    },
    efectos_secundarios: {
      question: 'What are the side effects of an operation?',
      body: `Everything that has to happen **besides** the main row: the audit row, the entry, the customer notification, the balance change…

You look for them with \`NOT EXISTS\`:

\`\`\`
WHERE NOT EXISTS (
  SELECT 1 FROM auditoria au
  WHERE au.tabla = 'transferencias' AND au.registro_id = t.id
)
\`\`\`

A test that only looks at the transfer doesn't see that the audit is missing.`,
    },
    foto_antes: {
      question: 'How do I check a balance change?',
      body: `You need the balance **from before**. That's why good tests take a snapshot when they start (\`saldos_antes\`, at 09:55):

\`\`\`
change = cuentas.saldo − saldos_antes.saldo
\`\`\`

and compare it with what **should** have changed: the sum of the test's entries. If they don't match, the balance was updated too much (or too little).`,
    },
    aislar: {
      question: 'Why filter by the run?',
      body: `In the test database, data from many runs live side by side. Yesterday **R-0305** was launched on the same accounts.

If you add up **all** the entries of account 3, you include yesterday's, which were already in the snapshot, and the account comes out out of balance when it's fine.

Always filter by something that identifies your test: its **references**, its **ids** or its **time window**.`,
    },
  },
  quiz: {
    pre: {
      q0pre_ui: { question: 'The app shows "Transfer completed". What does that tell you about the database?', options: ['That everything was stored correctly', "Nothing for sure: you have to check it in the database", 'That the amount is correct', 'That there is audit'], explanation: 'The screen says what the app believes.' },
      q0pre_valores: { question: "Your check is `SELECT COUNT(*) … WHERE concepto = 'REF-1007'` and it gives 1. What have you tested?", options: ['That the transfer is correct', 'Only that it exists', 'That it has audit', 'Nothing'], explanation: 'The values are missing.' },
      q0pre_inv: { question: 'What is an invariant?', options: ['A value that never changes', 'A rule that must always hold, like "entries add up to zero"', 'A NOT NULL column', 'A performance test'], explanation: 'It works for every test at once.' },
      q0pre_error: { question: 'The app shows an error on a transfer. What do you check in the database?', options: ['Nothing: it errored', "That it wasn't done anyway", 'That the error is in the logs', 'That the balance is 0'], explanation: 'If it was done, the user will repeat it.' },
      q0pre_sec: { question: 'What do you use to find transfers without an audit row?', options: ['JOIN auditoria', 'NOT EXISTS (SELECT 1 FROM auditoria …)', 'COUNT(*)', 'ORDER BY'], explanation: 'Or LEFT JOIN … WHERE au.id IS NULL.' },
      q0pre_aislar: { question: 'Yesterday another run was launched on the same accounts. What do you do?', options: ['Nothing', "Filter by your run's identifiers", "Delete yesterday's data", 'Repeat the test'], explanation: 'Without deleting anything: by filtering.' },
    },
    post: {
      q0post_left: { question: 'To find transfers without any entry, which JOIN do you use?', options: ['JOIN apuntes', 'LEFT JOIN apuntes', 'CROSS JOIN apuntes', "It doesn't matter"], explanation: 'With JOIN, the transfer without entries disappears.' },
      q0post_foto: { question: 'What do you need to know how much a balance changed with the test?', options: ['Only the current balance', 'The balance from before the test', 'The audit', "The app's logs"], explanation: 'Change = after − before.' },
      q0post_mezcla: { question: "You add up all the entries of account 3 and it doesn't match the balance change. What do you check first?", options: ["That there's a defect", "That you're not adding entries from another run", 'That an index is missing', 'That the balance is negative'], explanation: 'First rule out mixing data.' },
      q0post_valor: { question: 'The app requested €30 and €300 were stored. Which query finds it?', options: ['COUNT(*) of the reference', 'JOIN by reference and t.importe <> e.importe', 'MAX(importe)', 'SUM(importe)'], explanation: 'Requested value against stored value.' },
      q0post_error: { question: 'Which defect does an operation that shows an error on screen but is done on the server cause?', options: ['None', 'The user repeats it and pays it twice', 'The app is slow', 'An index is missing'], explanation: 'And you only see it in the database.' },
      q0post_cero: { question: 'Your check query returns zero rows. What does it mean?', options: ['That the query is wrong', 'That no case breaks the check', 'That the table is empty', 'That a permission is missing'], explanation: 'Each row would be a defect.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: 'Welcome to QA: R-0306',
      body: "Good morning and welcome to the team.\n\nYou've spent three months with Inés learning SQL. Now it's time to use it to **test**. This morning the test run **R-0306** was launched against the app: seven transfers (table `ejecuciones`). The app says five went fine and two gave an error.\n\nWhat the app says isn't enough: you have to look at what was left in the database. To start:\n\n- The transfers in the database whose concept is the **reference** of an operation of **R-0306**: `id`, `concepto`, `importe` and `estado`.\n\nLaura",
    },
    laura_ok: {
      body: 'Six transfers for seven operations. REF-1005 errored and left nothing, good. But count the ones that errored: is only one missing?',
    },
    marta_importes: {
      body: "Hi! I'm testing the change to the app's number pad and I'm afraid a zero might slip in. Can you get me the operations of **R-0306** whose transfer was stored with an **amount different** from the one the test requested? `referencia`, `importe_app` and `importe_bd`.",
    },
    marta_thanks: { body: "REF-1007: €30 in the app, €300 stored. There's the zero! I'm raising the defect right now. Thanks." },
    carmen_apuntes: {
      body: "Hi. For Risk, the golden rule: each completed transfer leaves **two entries** (a negative one on the source and a positive one on the destination) that **add up to zero**. Can you tell me which transfers of **R-0306** don't meet it? `transferencia_id`, `apuntes` and `suma`.",
    },
    carmen_thanks: { body: "1003: a single entry of −75.50. The money leaves account 3 and never reaches 12. That's a serious problem in production. Thanks." },
    laura_existe: {
      subject: '11:00 · Laura: "the automated test is green"',
      body: '**Laura:** Rubén has an automated test for transfers. After each "ok" operation he runs:\n\n`SELECT COUNT(*) FROM transferencias WHERE concepto = :referencia` and checks that it gives 1.\n\nWith R-0306 everything came out green. What do you tell him?',
      choices: {
        valores: {
          text: 'That it only checks that the row **exists**. REF-1007 exists… with €300 instead of 30. A test has to compare the requested **values** (amount, accounts, status) with the stored ones, plus the invariants, like the entries.',
          reply: '"It exists" is the weakest check there is. What the customer sees is the amount.',
          effects: { 2: { text: 'A check compares values, not just that the row exists.' } },
        },
        ok: {
          text: "That it's fine: if the transfer was created, the test passed.",
          reply: 'And if it was created with another amount, or on another account? REF-1007 would pass its test with an extra zero.',
          effects: { 0: { text: 'You accepted a test that only checks whether the row exists.' } },
        },
        ui: {
          text: "That he'd better check the message on the screen, which is what the customer sees.",
          reply: 'The screen said "ok" for REF-1007. What the database stored is another matter.',
          effects: { 0: { text: 'You put the screen above what the database stores.' } },
        },
      },
    },
    nuria_error: {
      body: 'Hi. Every week a customer calls me: "the app gave me an error, I tried again and it charged me twice". Can you check whether it happens in **R-0306**? The operations the app marked as **error** but that **did** leave a transfer: `referencia`, `id` and `estado`.',
    },
    nuria_thanks: { body: 'REF-1004: error in the app and completed in the database. Now I have something to take to Diego. Thanks!' },
    diego_auditoria: {
      body: "Hey. Each transfer creation has to leave its row in `auditoria` (`tabla = 'transferencias'`, `registro_id` = the id). I touched that code this week… can you tell me which transfers of **R-0306** don't have it? One column `id`.",
    },
    diego_thanks: { body: "1006. It's the only one leaving a savings account: I forgot that path. I'll fix it. Thanks!" },
    ines_saldos: {
      body: "Hi, it's Inés, so good to see you in QA! At 09:55, before R-0306, we saved the balances in `saldos_antes`. For the accounts with entries from **R-0306**, which ones have a **balance change** (current balance − balance before) that **doesn't match** the **sum of their R-0306 entries**? `cuenta_id`, `cambio_saldo` and `suma_apuntes`.",
    },
    ines_thanks: { body: 'Account 9: the balance went up €560 and its entries say 310. 1002 was added twice. Well spotted.' },
    laura_mezcla: {
      subject: '15:00 · Laura: "four accounts out of balance"',
      body: "**Laura:** Rubén redid Inés's check his own way, adding up **all** the entries of each account:\n\n`SELECT a.cuenta_id, SUM(a.importe) … FROM apuntes a JOIN cuentas c … JOIN saldos_antes s … GROUP BY a.cuenta_id`\n\nAnd he gets 3, 5, 7 and 9 out of balance. You only found 9. Who is right?",
      choices: {
        aislar: {
          text: "That Rubén is also adding the entries from **R-0305**, yesterday's run on the same accounts. Those were already in the 09:55 snapshot, so they mustn't count. You have to filter by the run (its references) or by the time window. That way, only 9 is wrong.",
          reply: "That's it. In a shared test environment, the first thing is to isolate your data. Otherwise you chase ghosts.",
          effects: { 3: { text: "Always filter by your run's data." } },
        },
        ruben: {
          text: "Rubén: if the balances don't match the entries, they're wrong.",
          reply: "Yesterday's entries were already in the balance before. Counting them again creates mismatches that don't exist.",
          effects: { 0: { text: "You took another run's effects for defects." } },
        },
        repeat: {
          text: 'That the test database has to be wiped and R-0306 repeated.',
          reply: "We'd lose the evidence of the defects and nothing gets fixed. Filtering is enough.",
          effects: { 0: { text: 'You suggested deleting instead of isolating your data.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Laura',
      body: '**Laura:** First day in QA and five defects found in a "green" run. What are you taking away?',
      choices: {
        lesson: {
          text: "That the screen isn't the oracle: you have to look at the database. Check values and not just existence, the invariants (entries that add up to zero, balances that match), that what fails leaves nothing and that side effects like the audit are there. And always with my run's data.",
          reply: 'Very good. Tomorrow, the cases nobody tests: the edge cases.',
        },
        ui: {
          text: 'That if the app says "ok" and the row exists, the test is fine.',
          reply: 'Today that would have let five defects through. Check the debrief.',
          effects: { 0: { text: 'You came away with the screen and the row existing being enough.' } },
        },
      },
    },
  },
})
