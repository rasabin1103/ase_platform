import { m02DatosPrueba } from '../m02-datos-prueba'
import { COMMON_EN, missionEn } from './missionEn'

const ANONIMOS = "SELECT id, 'Cliente ' || id AS nombre, 'cliente' || id || '@ejemplo.test' AS email, ciudad, segmento FROM clientes WHERE id < 9000"

/** Course 8: SQL for QA · Mission 2 — Test data. English version of ../m02-datos-prueba.ts. */
export const m02DatosPruebaEn = missionEn(m02DatosPrueba, {
  ...COMMON_EN,
  title: 'Test data',
  subtitle: 'generate_series, INSERT … SELECT, boundary values, cleanup and anonymised data.',
  dayLabel: 'Wednesday · month 4',
  verdicts: {
    good: {
      title: 'Made-to-measure data, and no junk',
      body: "A hundred test customers with their accounts, the three transfers on the €3,000 boundary, thirty incidents spread across channels, everything deleted without touching the real data and a copy of customers without a single piece of personal data. And nobody will mistake your data for the real thing.",
    },
    ok: { title: 'Test data, halfway there', body: 'You already build test data, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Tests without data (or with the real data)', body: 'Several tasks were left undone. Replay the mission with the test data cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Test data',
    paragraphs: [
      "Wednesday. To test yesterday's edge cases you need data that has them, and by hand it never ends. Today you build test data with SQL on the **test copy**, and remove it when it's no longer needed.",
      "Test data always uses ids **from 9001 up** and the **kobalto.test** domain, so nobody mistakes it for the real thing. Each task is done when the database ends up as asked. If something goes wrong, \"Restore\" puts it back as it was at the start.",
    ],
    goals: [
      'Generate many rows at once with generate_series.',
      'Create rows from other rows with INSERT … SELECT.',
      'Prepare the boundary values of a rule.',
      'Spread the data in a known way.',
      'Delete the test data in the order the foreign keys require.',
      'Make an anonymised copy of real data.',
    ],
  },
  docs: {
    chuleta_datos: {
      title: 'Cheat sheet: test data',
      updatedLabel: 'Laura Méndez · QA',
      body: `## House rules
- Test ids **from 9001 up**. Emails at **@kobalto.test**.
- No real personal data in tests.

## Building rows
\`\`\`
-- 100 numbered rows
INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento)
SELECT 9000 + n, 'Prueba', 'QA ' || n, 'qa' || n || '@kobalto.test', 'Madrid', '2026-03-01', 'estandar'
FROM generate_series(1, 100) AS n;

-- One row for each row of another table
INSERT INTO cuentas (…) SELECT … FROM clientes WHERE id BETWEEN 9001 AND 9100;
\`\`\`

## Spreading in a known way
- Alternate: \`CASE WHEN n % 2 = 1 THEN 'a' ELSE 'b' END\`
- Rotate a list: \`(ARRAY['chat', 'telefono', 'email'])[1 + n % 3]\`
- Space out in time: \`TIMESTAMP '2026-02-01 09:00' + (n - 1) * INTERVAL '22 hours'\`

## Table columns
- \`clientes(id, nombre, apellidos, email, ciudad, fecha_alta, segmento)\`
- \`cuentas(id, cliente_id, iban, tipo, saldo, moneda, abierta_en, estado)\` (\`iban\` unique)
- \`transferencias(id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en)\`
- \`incidencias(id, cliente_id, canal, motivo, abierta_en, cerrada_en)\``,
    },
  },
  sqlLab: {
    starter: "-- Test environment: generate_series builds numbered rows\nSELECT n, 'qa' || n || '@kobalto.test' AS email\nFROM generate_series(1, 5) AS n;",
    retos: {
      clientes_prueba: {
        title: 'A hundred test customers',
        description: "Create **100 test customers** with ids **9001 to 9100**, email `qa<n>@kobalto.test` (unique for each one), city `Madrid`, sign-up on `2026-03-01` and segment `estandar`. First name and surname, whatever you like (for example `Prueba` and `QA <n>`).",
        hint: "`INSERT INTO clientes (…) SELECT 9000 + n, 'Prueba', 'QA ' || n, 'qa' || n || '@kobalto.test', 'Madrid', '2026-03-01', 'estandar' FROM generate_series(1, 100) AS n;`",
        requires: { 0: { message: 'Build the hundred rows at once with `generate_series(1, 100)`.' } },
      },
      cuentas_prueba: {
        title: 'An account for each test customer',
        description: "An account for each of the 100 test customers: **same id as its customer**, IBAN `ES00 QA <id>`, type **`corriente` (current) for odd ids and `ahorro` (savings) for even ones**, balance **€1,000**, opened on `2026-03-01` and status `activa`.",
        hint: "`INSERT INTO cuentas (id, cliente_id, iban, tipo, saldo, abierta_en, estado) SELECT id, id, 'ES00 QA ' || id, CASE WHEN id % 2 = 1 THEN 'corriente' ELSE 'ahorro' END, 1000, '2026-03-01', 'activa' FROM clientes WHERE id BETWEEN 9001 AND 9100;`",
        requires: { 0: { message: 'Create the accounts from the customers with `INSERT INTO cuentas (…) SELECT … FROM clientes …`.' } },
      },
      valores_frontera: {
        title: 'The three boundary transfers',
        description: "Risk's rule reviews transfers **of €3,000 or more**. Create the three transfers that test the boundary, from account **9001** to **9002**: **2,999.99**, **3,000.00** and **3,000.01**, with ids **9001, 9002 and 9003**, status `pendiente` (pending), any concept and date `2026-03-02 10:00`.",
        hint: "`INSERT INTO transferencias (id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en) VALUES (9001, 9001, 9002, 2999.99, 'QA frontera', 'pendiente', '2026-03-02 10:00'), (…), (…);`",
        requires: { 0: { message: 'Create the transfers with `INSERT INTO transferencias …`.' } },
      },
      incidencias_prueba: {
        title: 'Thirty incidents spread out',
        description: "Create **30 test incidents** (ids **9001 to 9030**), one for each test customer from **9001 to 9030**, **open** (not closed), with **10 per channel** (`chat`, `telefono`, `email`) and all opened **in February 2026**. Any reason.",
        hint: "`SELECT 9000 + i, 9000 + i, (ARRAY['chat', 'telefono', 'email'])[1 + i % 3], 'Prueba QA', TIMESTAMP '2026-02-01 09:00' + (i - 1) * INTERVAL '22 hours' FROM generate_series(1, 30) AS i`",
        requires: { 0: { message: 'Create the incidents with `INSERT INTO incidencias … SELECT …`.' } },
      },
      limpieza: {
        title: 'All clean, without touching the real data',
        description: 'Delete **all** the test data (ids **9001 or higher**) from `transferencias`, `incidencias`, `cuentas` and `clientes`, **without touching** a single real row.',
        hint: 'First what depends on other tables: transfers and incidents, then accounts and finally customers. `DELETE FROM … WHERE id >= 9000;`',
        requires: { 0: { message: 'This task is done by deleting: `DELETE FROM … WHERE id >= 9000`.' } },
      },
      anonimos: {
        title: 'A copy of customers without personal data',
        description: "Create the table **`clientes_anonimos`** with the **real customers** (`id` < 9000) and the columns `id`, `nombre` (`Cliente <id>`), `email` (`cliente<id>@ejemplo.test`), `ciudad` and `segmento` (these two, the real ones).",
        hint: `\`CREATE TABLE clientes_anonimos AS ${ANONIMOS};\``,
        requires: { 0: { message: 'This task is done by creating the table: `CREATE TABLE clientes_anonimos AS SELECT …`.' } },
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'The account tests fail at random because there is no data', explanation: 'Each test looked for accounts "that happened to exist" instead of creating its own.', technique: 'INSERT … SELECT from the test customers.' },
    'C-CARMEN': { title: 'A transfer of exactly €3,000 skips the Risk review', explanation: 'Nobody tested the exact boundary value.', technique: 'Boundary values: just below, at the limit and just above.' },
    'C-NURIA': { title: 'The incidents-per-channel dashboard was only tested with chat', explanation: "The test data didn't cover every channel.", technique: 'Spread the data in a known way.' },
    'C-DIEGO': { title: "Production reports count a hundred customers who don't exist", explanation: 'The test data was left in the shared database.', technique: 'Clean up in order: children first, parents after.' },
    'C-INES': { title: 'A test database with real emails reaches a supplier', explanation: 'The customers were copied as they were.', technique: 'Anonymise: replace the personal data, keep what matters for testing.' },
    'C-IDS': { title: 'A real customer gets an email from an automated test', explanation: 'The test data used ids and emails that really existed.', technique: 'Reserved ranges and test domains (.test).' },
    'C-ORDEN': { title: 'The tests pass together and fail one by one', explanation: 'Each test used the data left by the previous one.', technique: 'Each test prepares and cleans up its own data.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Wednesday's test data.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's accounts", explanation: 'Each test with its own accounts.' },
      1: { label: "Carmen's boundary", explanation: '2,999.99 · 3,000 · 3,000.01.' },
      2: { label: "Nuria's channels", explanation: 'Ten per channel.' },
      3: { label: "Diego's cleanup", explanation: 'No test leftovers.' },
      4: { label: "Inés's copy", explanation: 'No personal data.' },
      5: { label: 'Recognisable data', explanation: 'Ids 9001+ and kobalto.test.' },
      6: { label: 'Independent tests', explanation: 'Each one with its own data.' },
    },
  },
  concepts: {
    generate_series: { title: 'generate_series', summary: 'Returns one row per number (or per date): the quick way to build many rows.' },
    insert_select: { title: 'INSERT … SELECT', summary: 'Inserts the result of a query: one account per customer, a copy of another table…' },
    frontera: { title: 'Boundary values', summary: 'Just below, at the limit and just above: where the ">" that should be ">=" fail.' },
    reparto: { title: 'Spreading in a known way', summary: 'With %, CASE and arrays, the data covers every case and you know how many there are of each.' },
    identificables: { title: 'Identifiable test data', summary: 'Reserved id ranges and .test domains: nobody mistakes them for real data and they are easy to clean up.' },
    limpieza: { title: 'Cleaning up in order', summary: 'Foreign keys force you to delete the children first (transfers, accounts) and then the parents (customers).' },
    anonimizar: { title: 'Anonymising', summary: 'Replace the personal data and keep what matters for testing (city, segment, relationships).' },
  },
  seniorTips: [
    'Read the test data cheat sheet in the wiki.',
    'Laura: INSERT INTO clientes … SELECT 9000 + n, … FROM generate_series(1, 100) AS n.',
    "Marta: INSERT INTO cuentas … SELECT id, id, 'ES00 QA ' || id, CASE WHEN id % 2 = 1 THEN 'corriente' ELSE 'ahorro' END, 1000, … FROM clientes WHERE id BETWEEN 9001 AND 9100.",
    'Carmen: three rows with VALUES: 2999.99, 3000.00 and 3000.01.',
    "Nuria: (ARRAY['chat', 'telefono', 'email'])[1 + i % 3] and dates spaced 22 hours apart from 1 February.",
    'Diego: DELETE from transfers and incidents, then accounts and finally customers, always with id >= 9000.',
    "Inés: CREATE TABLE clientes_anonimos AS SELECT id, 'Cliente ' || id AS nombre, … FROM clientes WHERE id < 9000.",
    "With Laura: recognisable data and tests that don't depend on each other.",
  ],
  lessons: {
    generate_series: {
      question: 'How do I build a hundred rows without writing them?',
      body: `\`generate_series(1, 100)\` returns a hundred rows with the numbers from 1 to 100. Use it in the FROM and build each column from the number:

\`\`\`
SELECT 9000 + n AS id, 'qa' || n || '@kobalto.test' AS email
FROM generate_series(1, 100) AS n;
\`\`\`

It also generates dates: \`generate_series(TIMESTAMP '2026-02-01', TIMESTAMP '2026-02-28', INTERVAL '1 day')\`. Look at the SELECT first; when it's what you want, put the \`INSERT INTO … (columns)\` in front of it.`,
    },
    insert_select: {
      question: 'How do I create an account for each test customer?',
      body: `With \`INSERT … SELECT\`: the SELECT returns one row per customer and each row is inserted as an account.

\`\`\`
INSERT INTO cuentas (id, cliente_id, iban, tipo, saldo, abierta_en, estado)
SELECT id, id, 'ES00 QA ' || id,
       CASE WHEN id % 2 = 1 THEN 'corriente' ELSE 'ahorro' END,
       1000, '2026-03-01', 'activa'
FROM clientes
WHERE id BETWEEN 9001 AND 9100;
\`\`\`

The SELECT columns go in the same order as the INSERT list. The ones you leave out take their default value (here, \`moneda\` = EUR).`,
    },
    frontera: {
      question: 'Which values do I test for a rule of "€3,000 or more"?',
      body: `The ones on the **boundary**: just below, exactly at the limit and just above.

| Amount | Should |
|---|---|
| 2,999.99 | not be reviewed |
| 3,000.00 | be reviewed |
| 3,000.01 | be reviewed |

If someone wrote \`> 3000\` instead of \`>= 3000\`, only the 3,000.00 case uncovers it. Testing with €100 and €10,000 never finds that error.`,
    },
    reparto: {
      question: 'How do I spread the data to cover every case?',
      body: `With the row number:

- Alternate two values: \`CASE WHEN n % 2 = 1 THEN 'corriente' ELSE 'ahorro' END\`
- Rotate a list: \`(ARRAY['chat', 'telefono', 'email'])[1 + n % 3]\` (arrays start at 1)
- Space out in time: \`TIMESTAMP '2026-02-01 09:00' + (n - 1) * INTERVAL '22 hours'\`

That way you know in advance how many rows there are of each case: the expected result of the test comes from the data.`,
    },
    identificables: {
      question: 'Why ids from 9001 and .test emails?',
      body: `So that test data is **unmistakable**:

- A **reserved id range** doesn't clash with the real ones and is deleted with a \`WHERE id >= 9000\`.
- The **.test** domain (like \`.example\`) is reserved: no test email can reach a person.
- A recognisable name (\`Prueba\`, \`QA 17\`) warns whoever sees it in a report.

If your test data can pass for real data, sooner or later someone will treat it as real.`,
    },
    limpieza: {
      question: 'Why does the DELETE of the test customers fail?',
      body: `Because they have accounts, and the foreign key \`cuentas.cliente_id\` doesn't let you delete a customer with accounts. You have to delete **from the children to the parents**:

\`\`\`
DELETE FROM transferencias WHERE id >= 9000;
DELETE FROM incidencias    WHERE id >= 9000;
DELETE FROM cuentas        WHERE id >= 9000;
DELETE FROM clientes       WHERE id >= 9000;
\`\`\`

The foreign key error is protecting you: don't remove it, change the order. And before each DELETE, the same WHERE with a SELECT.`,
    },
    anonimizar: {
      question: 'How do I use real data for testing without exposing anyone?',
      body: `By **anonymising** it: replace what identifies a person and keep what matters for the test.

\`\`\`
CREATE TABLE clientes_anonimos AS
SELECT id,
       'Cliente ' || id AS nombre,
       'cliente' || id || '@ejemplo.test' AS email,
       ciudad, segmento
FROM clientes WHERE id < 9000;
\`\`\`

The city, the segment and the id (to join with other tables) are kept; the name and the email disappear. If the id is also sensitive, it is replaced by another one consistently.`,
    },
  },
  quiz: {
    pre: {
      q2pre_gs: { question: 'How many rows does `generate_series(1, 100)` return?', options: ['1', '100', '99', '101'], explanation: 'One per number, including 1 and 100.' },
      q2pre_is: { question: 'What does `INSERT INTO cuentas (…) SELECT … FROM clientes WHERE id > 9000` do?', options: ['Copies the clientes table', 'Inserts one account for each customer the SELECT returns', 'Gives an error', 'Updates the accounts'], explanation: 'Each row of the SELECT is a new row.' },
      q2pre_frontera: { question: 'Rule: "review from €3,000". Which amounts test the boundary?', options: ['100 and 10,000', '2,999.99, 3,000 and 3,000.01', '0 and 3,000', 'Only 3,000'], explanation: 'Below, at the limit and above.' },
      q2pre_ids: { question: 'Why use @kobalto.test emails in tests?', options: ['Because they are shorter', 'Because .test is reserved and they reach nobody', 'Because PostgreSQL requires it', "It doesn't matter"], explanation: 'No test email reaches a real person.' },
      q2pre_fk: { question: '`DELETE FROM clientes WHERE id >= 9000` gives a foreign key error. Why?', options: ['Because there are no customers', 'Because those customers have accounts', 'Because a COMMIT is missing', 'Because the id is text'], explanation: 'Children first.' },
      q2pre_anon: { question: 'What does an anonymised copy of customers keep?', options: ['Nothing', 'What matters for testing (city, segment, relationships) without personal data', 'The real emails', 'Only the ids'], explanation: 'It replaces what identifies the person.' },
    },
    post: {
      q2post_arr: { question: "What does `(ARRAY['chat', 'telefono', 'email'])[1 + n % 3]` return for n = 3?", options: ['chat', 'telefono', 'email', 'NULL'], explanation: '3 % 3 = 0 → position 1.' },
      q2post_orden: { question: 'In which order do you delete test transfers, accounts and customers?', options: ['Customers, accounts, transfers', 'Transfers, accounts, customers', "It doesn't matter", 'Only customers, with CASCADE'], explanation: 'From the children to the parents.' },
      q2post_dep: { question: 'The tests use ids 1 to 100. What is the risk?', options: ['None', "Clashing with real data and not being able to clean up without touching the real data", 'That they are slow', 'That an index is missing'], explanation: 'Reserved range.' },
      q2post_front: { question: 'The code says `importe > 3000` and the rule "from €3,000". Which test uncovers it?', options: ['2,999.99', '3,000.00', '3,000.01', '10,000'], explanation: 'Only the exact limit value.' },
      q2post_gs: { question: "How do you test what you're going to insert before inserting it?", options: ["You can't", 'By running the SELECT alone first', 'Always with ROLLBACK', 'With EXPLAIN'], explanation: "When the SELECT is right, you put the INSERT in front of it." },
      q2post_anon: { question: 'Why not copy the real customers as they are to a test environment?', options: ['They take up a lot of space', "It exposes personal data to people who shouldn't see it", "It's slower", "It can't be done in PostgreSQL"], explanation: 'And test environments are shared with more people.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: 'Building data',
      body: "Good morning.\n\nYesterday you found the edge cases; today it's about building data that has them. You're on the **test copy**: you can create and delete. House rules: test ids **from 9001 up** and emails at **@kobalto.test**.\n\nTo start:\n\n- **100 test customers**, ids 9001 to 9100, email `qa<n>@kobalto.test`, city Madrid, signed up on 1 March 2026 and standard segment. With `generate_series`, no writing them one by one.\n\nLaura",
    },
    laura_ok: {
      body: 'A hundred customers in one statement. And since they start at 9001, we know at all times which ones are test data.',
    },
    marta_cuentas: {
      body: "Hi! To test the accounts screen I need **an account for each test customer**: same id as its customer, IBAN `ES00 QA <id>`, **current** for odd ones and **savings** for even ones, €1,000 balance, opened on 1 March and active.",
    },
    marta_thanks: { body: "Fifty current and fifty savings. Now my tests don't depend on whatever accounts happen to exist. Thanks!" },
    carmen_frontera: {
      body: 'Hi. Diego changed the rule that sends transfers **of €3,000 or more** to review. I want to test it right on the boundary: from account 9001 to 9002, **2,999.99**, **3,000.00** and **3,000.01**, with ids 9001, 9002 and 9003, pending and dated 2 March at 10:00.',
    },
    carmen_thanks: { body: "Rule run: the 3,000.00 one doesn't go to review. Diego wrote \"greater than\". Without your exact case we wouldn't have seen it. Thanks." },
    laura_ids: {
      subject: '11:00 · Laura: "my data looks real"',
      body: '**Laura:** Rubén made his own test data for the app. He\'s proud: "it looks real". He uses ids **1 to 100** and emails like `maria.lopez@gmail.com`. What do you tell him?',
      choices: {
        identificables: {
          text: "That test data has to be **unmistakable**: ids 1 to 100 already exist and clash with real customers (and then he can't delete his without touching the real ones), and a gmail address may belong to someone: a test that sends notifications would write to them. Reserved range (9001+) and a test domain (.test).",
          reply: 'Exactly. Realistic in shape, yes; mistakable for the real thing, never.',
          effects: { 2: { text: 'Test data with reserved ids and .test domains.' } },
        },
        real: {
          text: 'That it\'s great: the more real, the better the tests.',
          reply: 'And when the notifications test writes to a María López who exists? Or when he deletes his "test data" with WHERE id <= 100?',
          effects: { 0: { text: 'You accepted test data that can be mistaken for real data.' } },
        },
        prod: {
          text: 'That he\'d better copy the production customers, which are even more realistic.',
          reply: "That's exactly what you can't do with personal data. If real data is needed, anonymised.",
          effects: { 0: { text: 'You suggested using real personal data for testing.' } },
        },
      },
    },
    nuria_incidencias: {
      body: 'Hi. I want to test the incidents-per-channel dashboard. I need **30 test incidents**, ids 9001 to 9030, one for each test customer from 9001 to 9030, **open**, **10 per channel** (chat, phone and email) and all opened **in February**.',
    },
    nuria_thanks: { body: 'The dashboard shows 10, 10 and 10. Before, we had only tested it with chat. Thanks!' },
    diego_limpieza: {
      body: "Hey. Tonight the test database is copied for the weekly reports and I don't want a single piece of test data there. Can you delete **everything** with ids **9001 or higher** from transfers, incidents, accounts and customers? Without touching anything real, of course.",
    },
    diego_thanks: { body: 'Zero test rows and the real ones as they were: 40 customers, 52 accounts. Thanks!' },
    ines_anonimos: {
      body: "Hi. A supplier is going to test our integration and needs a customers table with **realistic** data, but **without personal data**. Create `clientes_anonimos` with the real customers (id < 9000): `id`, `nombre` = `Cliente <id>`, `email` = `cliente<id>@ejemplo.test`, and the real `ciudad` and `segmento`.",
    },
    ines_thanks: { body: 'Forty customers, with their city and segment, and not a single real name or email. This I can send. Thanks.' },
    laura_dependencias: {
      subject: '15:00 · Laura: "together they pass, separately they fail"',
      body: '**Laura:** Rubén\'s automated tests all pass when run together. But if you run only the "close account" one, it fails: it uses the account created by the "open account" test. What do you tell him?',
      choices: {
        independencia: {
          text: 'That each test has to **prepare its own data** and **clean it up** at the end (or run inside a transaction that is rolled back). If one depends on what another leaves, the result changes with the order and you can\'t run a single one when it fails.',
          reply: "That's it. A test that only works in company tells you nothing when it fails.",
          effects: { 3: { text: 'Each test prepares and cleans up its own data.' } },
        },
        orden: {
          text: 'That he should always run them together and in the same order.',
          reply: "Until someone adds a test in the middle, or runs them in parallel. And when one fails, he won't be able to repeat just that one.",
          effects: { 0: { text: 'You accepted tests that depend on the order.' } },
        },
        fijos: {
          text: 'That he should leave fixed accounts in the database for every test.',
          reply: 'And as soon as one test changes that account, the others inherit the change. Shared data, tests that step on each other.',
          effects: { 0: { text: 'You suggested data shared between tests.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Laura',
      body: '**Laura:** You built and cleaned up more than two hundred rows without touching the real data. What are you taking away?',
      choices: {
        lesson: {
          text: 'That with generate_series and INSERT … SELECT you build a lot of data in one statement; that you have to test the exact boundary; that data is spread to cover every case; that it has to be unmistakable (reserved ids, .test); that it is cleaned from the children to the parents; that real data is anonymised; and that each test prepares its own data.',
          reply: 'Very good. Tomorrow, the tests that run by themselves every night: queries that must return nothing.',
        },
        prod: {
          text: 'That the fastest thing is to copy the production data and test with it.',
          reply: "Fast and dangerous: personal data and tests you don't control. Check the debrief.",
          effects: { 0: { text: 'You came away with testing with production data.' } },
        },
      },
    },
  },
})
