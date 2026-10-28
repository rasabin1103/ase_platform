import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m06Join } from '../m06-join'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 6 — Joining tables. English version of ../m06-join.ts. */
export const m06JoinEn = missionEn(
  m06Join,
  {
    title: 'Joining tables',
    subtitle: 'JOIN … ON, table aliases and a three-table JOIN.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Tuesday · week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Tables well stitched together',
        body: 'Nuria solved the call, Carmen knows who sent each large transfer, Marta has the balance by city and Laura has opened a real bug: expired cards that are still active.',
      },
      ok: { title: 'You join, but something came loose', body: 'You already use JOIN, although a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'Loose tables', body: 'Several tasks were left undone. Replay the mission: JOIN with its ON, aliases and chains of JOINs.' },
    },
    briefing: {
      title: 'Week 2 · Joining tables',
      paragraphs: [
        "Tuesday of week 2. Today's questions cross tables: whose is this account, which card does this customer have, who sent this transfer.",
        "Today's tasks must be solved with JOIN in the query: looking up the ids by hand and copying them does not count.",
      ],
      goals: [
        'Understand how tables relate through their keys.',
        'Join two tables with JOIN … ON.',
        'Use table aliases and avoid ambiguous columns.',
        'Chain three tables.',
        'Combine JOIN with WHERE and GROUP BY.',
      ],
    },
    docs: {
      mapa_tablas: {
        title: 'Map of tables and keys',
        updatedLabel: 'Inés Moreno · Data',
        body: `## How they relate
- \`cuentas.cliente_id\` → \`clientes.id\`
- \`tarjetas.cuenta_id\` → \`cuentas.id\`
- \`transferencias.cuenta_origen_id\` → \`cuentas.id\` (who sends)
- \`transferencias.cuenta_destino_id\` → \`cuentas.id\` (who receives; empty if it is another bank)
- \`incidencias.cliente_id\` → \`clientes.id\`

## Shape
\`\`\`
SELECT c.nombre, a.iban
FROM cuentas a
JOIN clientes c ON a.cliente_id = c.id;
\`\`\`

## Columns that repeat across tables
\`id\`, \`estado\`, \`tipo\`: always write \`alias.column\`.`,
      },
    },
    sqlLab: {
      starter: '-- Join tables with JOIN … ON\nSELECT a.iban, a.saldo, c.nombre\nFROM cuentas a\nJOIN clientes c ON a.cliente_id = c.id;',
      retos: {
        cuentas_titular: {
          title: 'Each account with its holder',
          description: "`iban` and `saldo` of each account, with the `nombre` and `apellidos` of its holder. Four columns, in that order.",
          hint: '`FROM cuentas a JOIN clientes c ON a.cliente_id = c.id`.',
        },
        tarjeta_cliente: {
          title: "A customer's card",
          description: '`tipo`, `estado`, `limite_diario` and `caduca_en` of the card of the customer with email **pablo.gil34@mail.com**.',
          hint: 'To get from cards to customers you go through accounts: two JOINs, and the email in the WHERE.',
        },
        rechazadas_iban: {
          title: 'Rejected ones with their IBAN',
          description: '`id` and `importe` of the **rejected** (`rechazada`) transfers, with the `iban` of their **source account**.',
          hint: "`transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id`, and `t.estado = 'rechazada'` (both tables have `estado`).",
        },
        grandes_ordenante: {
          title: 'Who sent the large ones',
          description: '`id` and `importe` of the transfers of **more than €10,000**, with `nombre` and `apellidos` of the customer of the source account.',
          hint: 'Three tables: transferencias → cuentas (through `cuenta_origen_id`) → clientes.',
        },
        saldo_ciudad: {
          title: 'Total balance by city',
          description: '`ciudad` and **total balance** of the accounts of the customers in each city.',
          hint: 'Join cuentas with clientes and group by `c.ciudad` with `SUM(a.saldo)`.',
        },
        caducadas_activas: {
          title: 'Expired cards that are still active',
          description: "`id` and `caduca_en` of the **active** (`activa`) cards that expired **before 1 January 2026**, with the customer's `email`.",
          hint: "Two JOINs up to clientes; in the WHERE, `t.estado = 'activa' AND t.caduca_en < '2026-01-01'`.",
        },
      },
    },
    bugs: {
      'C-LLAMADA': { title: 'A customer still cannot pay by card', explanation: "Nuria didn't know his card was expired.", technique: 'Three-table JOIN with WHERE.' },
      'C-LOGS': {
        title: 'Rejected transfers cannot be traced',
        explanation: "Diego didn't receive the source IBAN.",
        technique: 'JOIN with aliases and qualified columns.',
      },
      'C-DOCUMENTACION': {
        title: 'Risk does not know whom to ask for explanations',
        explanation: "Carmen didn't receive who sent the large transfers.",
        technique: 'Chain transferencias → cuentas → clientes.',
      },
      'C-OFICINAS': { title: 'The offices plan comes out without the balance by city', explanation: "Marta didn't receive the balance by city.", technique: 'JOIN with GROUP BY.' },
      'C-CADUCADAS': {
        title: 'There are expired active cards and nobody knows',
        explanation: "Without Laura's list, the fault in the blocking process stays hidden.",
        technique: 'Three-table JOIN with status and date conditions.',
      },
      'C-CARTESIANO': {
        title: 'A query without ON brings the replica down',
        explanation: 'Without a join condition, each row is combined with all the others.',
        technique: 'A JOIN always with its ON.',
      },
      'C-PERDIDO': {
        title: 'A report says there are 39 customers',
        explanation: 'The INNER JOIN leaves out the customer with no accounts.',
        technique: 'Knowing which rows an INNER JOIN discards.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with Tuesday's joins.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Call solved', explanation: 'Expired card detected.' },
        1: { label: 'Traceable rejected ones', explanation: 'With the source IBAN.' },
        2: { label: 'Risk control', explanation: 'Who sent each large transfer.' },
        3: { label: 'Offices plan', explanation: 'Balance by city.' },
        4: { label: 'Cards bug', explanation: 'Expired ones that are still active.' },
        5: { label: 'JOIN with its ON', explanation: 'No Cartesian products.' },
        6: { label: 'Accounts that add up', explanation: 'What the INNER JOIN leaves out.' },
      },
    },
    concepts: {
      foreign_keys: { title: 'Keys that relate tables', summary: 'A foreign key (cliente_id) points to the primary key of another table (clientes.id).' },
      inner_join: { title: 'JOIN … ON', summary: 'Joins the rows of two tables according to the ON condition.' },
      join_condition: { title: 'Cartesian product', summary: 'Without a join condition, each row is combined with all those of the other table.' },
      table_alias: { title: 'Table aliases', summary: 'Short names (c, a, t) that make the query readable and avoid ambiguous columns.' },
      multi_join: { title: 'JOIN of several tables', summary: 'JOINs are chained, each with its ON.' },
      inner_drops: { title: 'What the INNER JOIN leaves out', summary: 'Only the rows with a match in both tables remain.' },
    },
    seniorTips: [
      'Read the table map in the wiki.',
      'Inés: SELECT a.iban, a.saldo, c.nombre, c.apellidos FROM cuentas a JOIN clientes c ON a.cliente_id = c.id.',
      "Nuria: tarjetas t JOIN cuentas a ON t.cuenta_id = a.id JOIN clientes c ON a.cliente_id = c.id WHERE c.email = 'pablo.gil34@mail.com'.",
      "Diego: … FROM transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id WHERE t.estado = 'rechazada'.",
      'Carmen: three tables with WHERE t.importe > 10000.',
      'Marta: … GROUP BY c.ciudad with SUM(a.saldo).',
      "Laura: … WHERE t.estado = 'activa' AND t.caduca_en < '2026-01-01'.",
      'With Inés: without ON you get a Cartesian product; INNER JOIN leaves out what has no match.',
    ],
    lessons: {
      keys: {
        question: 'How do tables relate to each other?',
        body: `Through **keys**:

- \`clientes.id\` identifies each customer (primary key).
- \`cuentas.cliente_id\` says which customer each account belongs to (foreign key).
- \`tarjetas.cuenta_id\` → \`cuentas.id\`.
- \`transferencias.cuenta_origen_id\` and \`cuenta_destino_id\` → \`cuentas.id\`.
- \`incidencias.cliente_id\` → \`clientes.id\`.

Instead of repeating the customer's name in every account, their \`id\` is stored. To bring the data together you need to join the tables.`,
      },
      join: {
        question: 'How do I join two tables?',
        body: `\`\`\`
SELECT cuentas.iban, clientes.nombre
FROM cuentas
JOIN clientes ON cuentas.cliente_id = clientes.id;
\`\`\`

\`ON\` says which row goes with which row: the account with the customer whose \`id\` is its \`cliente_id\`. \`JOIN\` and \`INNER JOIN\` are the same thing.`,
      },
      on: {
        question: 'And if I forget the ON?',
        body: `\`FROM cuentas, clientes\` (or a \`JOIN\` with a condition that relates nothing) combines **each row of one table with each row of the other**: the **Cartesian product**. 52 accounts × 40 customers = 2,080 meaningless rows.

Warning sign: if the result has many more rows than you expected, check the \`ON\`s.`,
      },
      alias: {
        question: 'Do I have to write the table name every time?',
        body: `Use **table aliases**:

\`\`\`
SELECT t.id, t.importe, a.iban
FROM transferencias t
JOIN cuentas a ON t.cuenta_origen_id = a.id
WHERE t.estado = 'rechazada';
\`\`\`

They also avoid the error “column id exists in several tables”: \`id\`, \`estado\` or \`tipo\` are in more than one table, so you have to say which (\`t.id\`).`,
      },
      multi: {
        question: 'Can I join three tables?',
        body: `Yes, by chaining \`JOIN\`s. To get from cards to customers you go through accounts:

\`\`\`
SELECT c.email, t.tipo, t.caduca_en
FROM tarjetas t
JOIN cuentas a  ON t.cuenta_id = a.id
JOIN clientes c ON a.cliente_id = c.id
WHERE c.email = 'cliente@mail.com';
\`\`\`

Each \`JOIN\` has its \`ON\`. You can add \`WHERE\`, \`GROUP BY\` and \`ORDER BY\` as usual.`,
      },
      inner: {
        question: 'Why am I missing rows after a JOIN?',
        body: `\`INNER JOIN\` only returns the rows that have a **match in both tables**. A customer with no accounts does not appear in \`clientes JOIN cuentas\`; a transfer to another bank (no destination account) does not appear if you join on \`cuenta_destino_id\`.

It is not a fault, but it changes what you count. To avoid losing anyone there is \`LEFT JOIN\` (next mission).`,
      },
    },
    quiz: {
      pre: {
        s6pre_keys: {
          question: 'What does `cuentas.cliente_id` store?',
          options: ["The customer's name", 'The id of the customer the account belongs to', 'The number of customers', "The account's id"],
          explanation: 'It is a foreign key that points to clientes.id.',
        },
        s6pre_join: {
          question: 'How do you join accounts with their holder?',
          options: ['FROM cuentas JOIN clientes ON cuentas.cliente_id = clientes.id', 'FROM cuentas JOIN clientes ON cuentas.id = clientes.id', 'FROM cuentas, clientes', 'FROM cuentas WHERE clientes'],
          explanation: 'The foreign key with the primary one.',
        },
        s6pre_cartesian: {
          question: '`SELECT * FROM cuentas, clientes` with 52 accounts and 40 customers returns…',
          options: ['52 rows', '40 rows', '92 rows', '2,080 rows'],
          explanation: 'Without a condition, every row with every row: 52 × 40.',
        },
        s6pre_alias: {
          question: 'Why does `SELECT id FROM cuentas JOIN clientes ON …` give an error?',
          options: ["id doesn't exist", "id is in both tables and it's not clear which", 'A WHERE is missing', "JOIN doesn't accept id"],
          explanation: 'Ambiguous column: write cuentas.id or use aliases.',
        },
        s6pre_multi: {
          question: 'To go from `tarjetas` to `clientes` you have to go through…',
          options: ['transferencias', 'cuentas', 'incidencias', 'Nothing: they join directly'],
          explanation: 'tarjetas.cuenta_id → cuentas.id; cuentas.cliente_id → clientes.id.',
        },
        s6pre_inner: {
          question: 'Does a customer with no accounts appear in `clientes JOIN cuentas`?',
          options: ['Yes, with the account empty', 'No: INNER JOIN only keeps the rows with a match', 'Yes, repeated', 'It gives an error'],
          explanation: 'INNER JOIN keeps the matches.',
        },
      },
      post: {
        s6post_join: {
          question: 'What does the ON do in a JOIN?',
          options: ['Sorts the result', 'Says which row of one table goes with which row of the other', 'Filters the groups', 'Renames the table'],
          explanation: 'It is the join condition.',
        },
        s6post_alias: {
          question: 'In `FROM transferencias t JOIN cuentas a ON …`, how do you ask for the account iban?',
          options: ['iban.a', 'a.iban', 'cuentas(iban)', 't.iban'],
          explanation: 'alias.column.',
        },
        s6post_cartesian: {
          question: 'Your JOIN returns far more rows than expected. What do you check first?',
          options: ['The ORDER BY', 'The ON conditions', 'The LIMIT', 'The column aliases'],
          explanation: 'A missing ON, or one that does not relate properly, multiplies the rows.',
        },
        s6post_multi: {
          question: 'How many ONs do you need to join three tables in a chain?',
          options: ['One', 'Two', 'Three', 'None'],
          explanation: 'One ON for each JOIN.',
        },
        s6post_inner: {
          question: 'You count the customers through `cuentas JOIN clientes` and get 39 out of 40. Why?',
          options: ['A customer is duplicated', 'A customer has no accounts and the INNER JOIN leaves them out', 'COUNT fails with JOIN', 'ORDER BY is missing'],
          explanation: 'Without a match in cuentas, they do not appear.',
        },
        s6post_keys: {
          question: 'Which column joins `transferencias` with the account that sends the money?',
          options: ['transferencias.id = cuentas.id', 'transferencias.cuenta_origen_id = cuentas.id', 'transferencias.cuenta_destino_id = cuentas.id', 'transferencias.importe = cuentas.saldo'],
          explanation: 'The source account is the one that sends.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Today: joining tables',
        body: "Hi!\n\nUntil now each query looked at a single table. But real questions cross tables: “this account, whose is it?”, “this card, which customer?”. The `cuentas` table doesn't have the holder's name, only their `cliente_id`, which points to `clientes.id`. To bring them together there is `JOIN`.\n\nTo start:\n\n- The `iban` and `saldo` of **each account**, with the `nombre` and `apellidos` of its holder.\n\nInés",
      },
      ines_ok: {
        body: '52 rows, one per account, each with its holder. The key is the `ON`: it tells PostgreSQL which row of one table goes with which row of the other.',
      },
      nuria_tarjeta: {
        body: "Hi. I have the customer with email **pablo.gil34@mail.com** on the phone: he says all his card payments are being rejected. Can you send me the `tipo`, the `estado`, the `limite_diario` and the `caduca_en` date of his card?",
      },
      nuria_thanks: {
        body: "It expired in November 2024 and is still marked as active! That's why his payments are rejected. I'll ask for a new one. I'll tell Laura about this, it smells like a bug.",
      },
      diego_rechazadas: {
        body: 'Hey. I\'m reviewing the **rejected** transfers: I need the `id` and the `importe` of each one with the `iban` of its **source account**.',
      },
      diego_thanks: { body: 'Seven. With the IBAN I can look them up in the bank logs. Thanks!' },
      ines_producto: {
        subject: '11:00 · Inés: “2,080 rows”',
        body: "**Inés:** Diego started with this, before asking you:\n\n`SELECT * FROM cuentas, clientes;`\n\nHe got **2,080 rows**, when there are 52 accounts. If he had run it in production, with millions of rows… What happened?",
        choices: {
          on: {
            text: 'Without a join condition, PostgreSQL combines **each account with each customer**: 52 × 40 = 2,080. It needs to say which account goes with which customer: `FROM cuentas JOIN clientes ON cuentas.cliente_id = clientes.id`.',
            reply: "Exactly: it's the Cartesian product. With two tables of a million rows it would be a trillion. A JOIN always has its ON.",
            effects: { 3: { text: 'Without a join condition, each row is combined with all of them: Cartesian product.' } },
          },
          distinct: {
            text: 'It needs a DISTINCT to remove the repeated ones.',
            reply: "They aren't repeated: they are all the possible combinations. The condition that joins the tables is missing.",
            effects: { 0: { text: 'DISTINCT does not fix a JOIN without a condition.' } },
          },
          limit: {
            text: 'A LIMIT 52 fixes it.',
            reply: 'You would get 52 rows, but badly matched: the first account with every customer. The problem is the missing ON.',
            effects: { 0: { text: 'Cutting the result does not make it correct.' } },
          },
        },
      },
      carmen_grandes: {
        body: "Remember the four transfers of **more than €10,000** you gave me last week? Now I need to know **who sent them**. `id` and `importe` of the transfer, and `nombre` and `apellidos` of the customer of the source account.",
      },
      carmen_thanks: { body: 'Four different customers. I can now ask for the documentation for each operation. Thanks.' },
      marta_ciudad: {
        body: 'For the offices plan: the **total balance by city**. The city is in `clientes` and the balance in `cuentas`. Columns: `ciudad` and the total.',
      },
      marta_thanks: { body: 'Madrid holds a third of the balance. This goes straight into the presentation. Thanks!' },
      laura_caducadas: {
        body: "Hi. Nuria told me about the expired card that was still active. Are there more? I need the `id` and the `caduca_en` date of all the **active** cards that **expired before 1 January 2026**, with the customer's `email`, so I can notify them.",
      },
      laura_thanks: {
        body: 'Two cards, both expired in November 2024. I\'m opening a bug: the process that blocks expired cards is not working. Great find!',
      },
      ines_perdido: {
        subject: '15:00 · Inés: “Where is customer 40?”',
        body: "**Inés:** Marta has counted the customers from your balance query:\n\n`SELECT COUNT(DISTINCT clientes.id) FROM cuentas JOIN clientes ON cuentas.cliente_id = clientes.id;`\n\nShe gets **39**. But we have 40 customers. Where is the missing one?",
        choices: {
          inner: {
            text: "The JOIN only keeps the rows that have a match in both tables. A customer with **no accounts at all** has no match in `cuentas`, so they disappear. It isn't a query error, but you have to know it: to count customers, better to count them in `clientes`.",
            reply: "Exactly: it's customer 38, who has no accounts. The “normal” JOIN is called INNER JOIN and keeps only the matches. Tomorrow you'll see LEFT JOIN, which doesn't lose anybody.",
            effects: { 3: { text: 'INNER JOIN keeps only the rows with a match: whoever has none disappears.' } },
          },
          distinct: {
            text: 'The DISTINCT must have removed one that was repeated.',
            reply: 'DISTINCT removes repeats of the same customer, not different customers. The missing one has no accounts at all.',
            effects: { 0: { text: 'You blamed DISTINCT for what the JOIN does.' } },
          },
          deleted: {
            text: 'They must have been deactivated.',
            reply: 'They are still in the clientes table. They simply have no accounts, and the JOIN leaves them out.',
            effects: { 0: { text: 'You assumed a deactivation without checking.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you joined tables and found a real bug. What are you taking away?',
        choices: {
          lesson: {
            text: 'That JOIN … ON joins tables by their key, that without ON you get the Cartesian product, that with aliases (c, a, t) queries read better and ambiguous columns are avoided, that I can chain several JOINs and that INNER JOIN leaves out whatever has no match.',
            reply: 'Very good. Tomorrow: LEFT JOIN, to find exactly what is missing.',
          },
          two: {
            text: "That it's easier to do two queries and cross the results by hand.",
            reply: 'With 52 accounts, maybe. With millions, no. Check the debrief.',
            effects: { 0: { text: 'You came away with crossing by hand instead of using JOIN.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support', laura: 'QA Lead' }),
)
