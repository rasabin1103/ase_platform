import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m07LeftJoin } from '../m07-left-join'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 7 — What is missing. English version of ../m07-left-join.ts. */
export const m07LeftJoinEn = missionEn(
  m07LeftJoin,
  {
    title: 'What is missing',
    subtitle: 'LEFT JOIN, anti-join and EXISTS to find what has no match.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Wednesday · week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Nothing stays hidden',
        body: 'Marta has her customer with no account, Diego his broken reference, Nuria her calls and Carmen her three unused accounts. And you now know why Diego was getting zero.',
      },
      ok: { title: 'Almost everything in view', body: 'You already use LEFT JOIN, although a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'What is missing is still missing', body: 'Several tasks were left undone. Replay the mission: LEFT JOIN, IS NULL and NOT EXISTS.' },
    },
    briefing: {
      title: 'Week 2 · What is missing',
      paragraphs: [
        'Wednesday of week 2. Yesterday the JOIN swallowed a customer with no accounts. Today the tasks are exactly about that: finding what has no match.',
        "Customers without an account, accounts that have never received anything, transfers pointing to an account that doesn't exist: missing data or broken references, QA's daily bread.",
      ],
      goals: [
        'Keep all the rows with LEFT JOIN.',
        'Find what has no match with LEFT JOIN … IS NULL or NOT EXISTS.',
        'Use EXISTS so rows are not repeated.',
        'Put the conditions on the right-hand table in the ON.',
        'Count with COUNT(column) so zeros are zeros.',
      ],
    },
    docs: {
      chuleta_left: {
        title: 'Cheat sheet: LEFT JOIN and EXISTS',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Keep everything
\`FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id\`: all the customers; with no account → columns of \`a\` are NULL.

## What has no match (anti-join)
\`… LEFT JOIN cuentas a ON … WHERE a.id IS NULL\`
or
\`WHERE NOT EXISTS (SELECT 1 FROM cuentas a WHERE a.cliente_id = c.id)\`

## At least one (without repeating)
\`WHERE EXISTS (SELECT 1 FROM … WHERE … = c.id)\`

## Careful
- Conditions on the right-hand table: in the **ON**, not in the WHERE.
- Counting: \`COUNT(a.id)\`, not \`COUNT(*)\`.
- \`NOT IN (subquery)\` with a NULL inside returns nothing: use NOT EXISTS.`,
      },
    },
    sqlLab: {
      starter: '-- LEFT JOIN keeps all the rows on the left\nSELECT c.id, c.nombre, a.iban\nFROM clientes c\nLEFT JOIN cuentas a ON a.cliente_id = c.id;',
      retos: {
        clientes_cuentas: {
          title: 'All customers with their accounts',
          description: '`id` and `nombre` of the customer and `iban` of each account, **also for customers with no account at all**.',
          hint: '`FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id`.',
        },
        sin_cuenta: {
          title: 'Customers without an account',
          description: '`id`, `nombre` and `apellidos` of the customers who **have no account at all**.',
          hint: 'LEFT JOIN with cuentas and `WHERE a.id IS NULL`, or `WHERE NOT EXISTS (…)`.',
        },
        destino_inexistente: {
          title: "Destinations that don't exist",
          description: '`id`, `cuenta_destino_id` and `importe` of the transfers that **have** a destination account, but that account **does not exist** in `cuentas`.',
          hint: 'LEFT JOIN transferencias with cuentas through `cuenta_destino_id`; keep those with a destination (`IS NOT NULL`) and no match (`a.id IS NULL`).',
        },
        con_incidencia: {
          title: 'Customers with open incidents',
          description: '`id`, `nombre` and `email` of the customers with **any open incident**, once each.',
          hint: '`WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id AND i.cerrada_en IS NULL)`.',
        },
        nunca_recibida: {
          title: 'Accounts that have never received',
          description: '`id` and `iban` of the accounts that have **never received** a transfer.',
          hint: '`WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id)`. Careful with `NOT IN`: there are NULL destinations.',
        },
        cuentas_por_cliente: {
          title: "Each customer's accounts",
          description: '`id`, `nombre` and **number of accounts** of **all** the customers, including those with 0.',
          hint: 'LEFT JOIN, `GROUP BY c.id, c.nombre` and `COUNT(a.id)` (with `COUNT(*)` the one with no accounts would show 1).',
        },
      },
    },
    bugs: {
      'C-BIENVENIDA': {
        title: 'The customer who never opened an account receives no message',
        explanation: "Marta didn't receive the customer with no accounts.",
        technique: 'Anti-join: LEFT JOIN … IS NULL.',
      },
      'C-HUERFANA': {
        title: 'A transfer to a non-existent account still goes undetected',
        explanation: 'Transfer 77 points to account 999, which does not exist: a validation is missing.',
        technique: 'LEFT JOIN on the reference and IS NULL.',
      },
      'C-LLAMADAS': { title: 'Eight customers with open incidents are waiting for a call', explanation: "Nuria didn't receive the list.", technique: 'EXISTS.' },
      'C-SIN-USO': { title: 'Risk thinks there are no unused accounts', explanation: "Carmen was left with Diego's zero.", technique: 'NOT EXISTS.' },
      'C-RECUENTO': {
        title: 'The report says every customer has at least one account',
        explanation: "Without the count with LEFT JOIN and COUNT(a.id), the zero doesn't show up.",
        technique: 'LEFT JOIN + COUNT(right-hand column).',
      },
      'C-LEFT-WHERE': {
        title: 'A list of “all the customers” loses customers',
        explanation: 'The filter on the right-hand table in the WHERE turns the LEFT JOIN into an INNER.',
        technique: 'Right-hand conditions in the ON.',
      },
      'C-NOT-IN': {
        title: 'A NOT IN with NULL gives zero again in another report',
        explanation: 'NOT IN with a NULL in the subquery returns nothing.',
        technique: 'NOT EXISTS.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with what was missing on Wednesday.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Customer with no account', explanation: 'Anti-join.' },
        1: { label: 'Broken reference', explanation: 'Transfer 77.' },
        2: { label: "Nuria's calls", explanation: 'EXISTS.' },
        3: { label: 'Unused accounts', explanation: 'NOT EXISTS.' },
        4: { label: 'Count with zeros', explanation: 'COUNT(a.id).' },
        5: { label: 'LEFT JOIN that keeps', explanation: 'Conditions in the ON.' },
        6: { label: 'No NOT IN traps', explanation: 'NOT EXISTS.' },
      },
    },
    concepts: {
      left_join: { title: 'LEFT JOIN', summary: 'Keeps all the rows on the left; with no match, those on the right come out as NULL.' },
      anti_join: { title: 'Anti-join', summary: 'LEFT JOIN … WHERE right.id IS NULL: what has no match.' },
      exists: { title: 'EXISTS and NOT EXISTS', summary: 'Checks whether a subquery returns any row, without repeating the main row.' },
      left_on_where: { title: 'ON versus WHERE in a LEFT JOIN', summary: 'Filtering the right-hand table in the WHERE removes the rows with no match.' },
      left_count: { title: 'Counting with LEFT JOIN', summary: 'COUNT(right-hand column) gives 0 to whoever has no match; COUNT(*) gives 1.' },
      not_in_null: { title: 'NOT IN and NULL', summary: 'A NULL in the list makes NOT IN return nothing.' },
    },
    seniorTips: [
      'Read the LEFT JOIN cheat sheet in the wiki.',
      'Inés: SELECT c.id, c.nombre, a.iban FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id.',
      'Marta: … LEFT JOIN cuentas a ON a.cliente_id = c.id WHERE a.id IS NULL.',
      'Diego: … LEFT JOIN cuentas a ON t.cuenta_destino_id = a.id WHERE t.cuenta_destino_id IS NOT NULL AND a.id IS NULL.',
      'Nuria: … WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id AND i.cerrada_en IS NULL).',
      'Carmen: … WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id).',
      'Marta: LEFT JOIN + GROUP BY c.id, c.nombre + COUNT(a.id).',
      'With Inés: right-hand conditions go in the ON; NOT IN with NULL returns nothing.',
    ],
    lessons: {
      left: {
        question: 'What does LEFT JOIN do?',
        body: `It returns **all** the rows of the left-hand table (the one in the \`FROM\`), whether they have a match or not. Those without a match come out with the right-hand columns as **NULL**:

\`\`\`
SELECT c.id, c.nombre, a.iban
FROM clientes c
LEFT JOIN cuentas a ON a.cliente_id = c.id;
\`\`\`

The customer with no accounts shows up with \`iban\` NULL. The order matters: \`clientes LEFT JOIN cuentas\` keeps the customers.`,
      },
      anti: {
        question: 'How do I find what has no match?',
        body: `LEFT JOIN and keep the rows where the right-hand side is NULL:

\`\`\`
SELECT c.id, c.nombre
FROM clientes c
LEFT JOIN cuentas a ON a.cliente_id = c.id
WHERE a.id IS NULL;
\`\`\`

Ask about a column that is **never** NULL when there is a match (its \`id\`). It is called an *anti-join*.`,
      },
      exists: {
        question: 'What is EXISTS?',
        body: `It asks whether a subquery returns **any** row:

\`\`\`
SELECT c.id, c.nombre
FROM clientes c
WHERE EXISTS (
  SELECT 1 FROM incidencias i
  WHERE i.cliente_id = c.id AND i.cerrada_en IS NULL
);
\`\`\`

Each customer comes out **only once**, even with several incidents (a JOIN would repeat them). \`NOT EXISTS\` is the opposite: those with none.`,
      },
      on_where: {
        question: 'Does the condition go in the ON or in the WHERE?',
        body: `In a \`LEFT JOIN\`:

- In the **ON**: it decides which rows on the right count as a match. Those on the left are always kept.
- In the **WHERE**: it filters the result **after** joining. A condition on the right-hand table (\`a.estado = 'activa'\`) wipes out the rows without a match (because there \`a.estado\` is NULL), and the LEFT becomes an INNER.

Rule of thumb: whatever concerns the right-hand table, in the ON.`,
      },
      count: {
        question: 'How do I count with LEFT JOIN without getting false ones?',
        body: `With \`COUNT(right_hand_column)\`, not with \`COUNT(*)\`:

\`\`\`
SELECT c.id, c.nombre, COUNT(a.id) AS cuentas
FROM clientes c
LEFT JOIN cuentas a ON a.cliente_id = c.id
GROUP BY c.id, c.nombre;
\`\`\`

The customer with no accounts has one row (with NULL): \`COUNT(*)\` counts it and gives 1; \`COUNT(a.id)\` doesn't count the NULL and gives 0.`,
      },
      not_in: {
        question: 'Why does NOT IN return zero rows?',
        body: `If the list or the subquery contains **a single NULL**, \`x NOT IN (…)\` is never true: “is x different from NULL?” is unknown.

\`WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias)\` → 0 rows, because there are transfers with a NULL destination.

Solutions: \`NOT EXISTS\` (recommended), an anti-join with LEFT JOIN, or filtering the NULLs in the subquery (\`WHERE cuenta_destino_id IS NOT NULL\`).`,
      },
    },
    quiz: {
      pre: {
        s7pre_left: {
          question: '`clientes LEFT JOIN cuentas`: a customer with no accounts…',
          options: ["Doesn't appear", 'Appears once, with the cuentas columns as NULL', 'Appears repeated', 'Gives an error'],
          explanation: 'LEFT JOIN keeps all the rows on the left.',
        },
        s7pre_anti: {
          question: 'How do you find the customers without accounts with a LEFT JOIN?',
          options: ['WHERE a.id IS NULL', 'WHERE a.id = 0', "WHERE a.iban = ''", 'WHERE c.id IS NULL'],
          explanation: 'With no match, the right-hand columns are NULL.',
        },
        s7pre_exists: {
          question: 'What does `EXISTS (subquery)` check?',
          options: ['That the table exists', 'That the subquery returns at least one row', 'That there are no NULLs', 'That the column exists'],
          explanation: 'EXISTS is true if there is any row.',
        },
        s7pre_where: {
          question: "In a LEFT JOIN, what happens if you filter `WHERE a.estado = 'activa'`?",
          options: ['Nothing: it is still a LEFT', 'The rows with no match are lost: it behaves like an INNER JOIN', 'It gives an error', 'It duplicates rows'],
          explanation: 'With no match, a.estado is NULL and the WHERE removes it.',
        },
        s7pre_count: {
          question: 'With LEFT JOIN and GROUP BY, what does `COUNT(*)` give for a customer with no accounts?',
          options: ['0', '1', 'NULL', 'Error'],
          explanation: 'There is one row (with NULL): COUNT(*) counts it. COUNT(a.id) would give 0.',
        },
        s7pre_notin: {
          question: 'What does `WHERE 5 NOT IN (1, 2, NULL)` return?',
          options: ['True', 'False', 'Unknown: the row does not come out', 'Error'],
          explanation: 'With a NULL in the list, NOT IN is never true.',
        },
      },
      post: {
        s7post_left: {
          question: 'Which table keeps all its rows in `A LEFT JOIN B`?',
          options: ['A', 'B', 'Both', 'Neither'],
          explanation: 'The one on the left.',
        },
        s7post_anti: {
          question: 'You are looking for transfers whose destination does not exist. Which condition excludes those to other banks (NULL destination)?',
          options: ['a.id IS NULL', 't.cuenta_destino_id IS NOT NULL AND a.id IS NULL', 't.cuenta_destino_id IS NULL', 'a.id IS NOT NULL'],
          explanation: 'With a destination, but without a matching account.',
        },
        s7post_exists: {
          question: 'Why EXISTS instead of JOIN for “customers with any incident”?',
          options: ['It is the only way', 'Each customer comes out once even with several incidents', "JOIN doesn't work with incidents", 'EXISTS sorts the result'],
          explanation: 'JOIN would repeat the customer for each incident.',
        },
        s7post_where: {
          question: "Where does the condition `a.estado = 'activa'` go to keep the customers with no active account?",
          options: ['In the WHERE', 'In the ON of the LEFT JOIN', 'In the GROUP BY', 'In the HAVING'],
          explanation: 'Conditions on the right-hand table go in the ON.',
        },
        s7post_count: {
          question: 'How do you count each customer\'s accounts including those with zero?',
          options: ['COUNT(*) with INNER JOIN', 'COUNT(a.id) with LEFT JOIN', 'COUNT(c.id) with LEFT JOIN', 'SUM(1) with INNER JOIN'],
          explanation: 'LEFT JOIN so nobody is lost and COUNT of the right-hand side so the NULL counts as 0.',
        },
        s7post_notin: {
          question: '`id NOT IN (SELECT cuenta_destino_id FROM transferencias)` gives 0 rows. What do you use?',
          options: ['NOT EXISTS', 'IN', 'DISTINCT', 'LIMIT'],
          explanation: 'NOT EXISTS does not have the NULL problem.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Today: finding what is missing',
        body: "Hi!\n\nYesterday you saw that the JOIN leaves out what has no match: the customer with no accounts disappeared. Today we make use of exactly that. With `LEFT JOIN` nobody from the left-hand table is lost, and whatever has no match comes out as NULL. And looking for those NULLs is the way to find **what is missing**: customers without an account, accounts without movements, broken references.\n\nTo start:\n\n- **All** the customers with their accounts, **also those who have none**: `id` and `nombre` of the customer and `iban` of the account.\n\nInés",
      },
      ines_ok: {
        body: '53 rows: the 52 accounts and customer 38, with the `iban` as NULL. That NULL is the clue: “there was no match here”.',
      },
      marta_sin_cuenta: {
        body: 'Hi. I want to write to the customers who registered but **never opened an account**. Can you get me their `id`, `nombre` and `apellidos`?',
      },
      marta_sin_cuenta_thanks: { body: 'Just one. I will write to him personally. Thanks!' },
      diego_huerfana: {
        body: "Hey. I suspect there are transfers that point to a **destination account that doesn't exist**. Careful: those with an empty destination go to other banks and are fine. I need `id`, `cuenta_destino_id` and `importe` of those that have a destination but that destination is not in `cuentas`.",
      },
      diego_thanks: {
        body: "Number 77, to account 999! That account has never existed. This is a validation bug when creating transfers: I'll note it for Laura.",
      },
      ines_left_where: {
        subject: "11:00 · Inés: “The LEFT JOIN doesn't work”",
        body: "**Inés:** Marta wanted all the customers with their **active** accounts, also those with no active one:\n\n`SELECT c.nombre, a.iban FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id WHERE a.estado = 'activa';`\n\nAnd she says the LEFT JOIN doesn't work: customer 38 doesn't show up. What do you tell her?",
        choices: {
          on: {
            text: "The WHERE is applied after the JOIN: customer 38 gets `a.estado` NULL, and `NULL = 'activa'` is not true, so the WHERE removes it and the LEFT JOIN behaves like an INNER. The condition on the right-hand table goes in the ON: `LEFT JOIN cuentas a ON a.cliente_id = c.id AND a.estado = 'activa'`.",
            reply: 'Exactly. In a LEFT JOIN, conditions on the right-hand table go in the ON; in the WHERE they wipe out the rows without a match.',
            effects: { 3: { text: 'In a LEFT JOIN, filtering the right-hand table in the WHERE turns it into an INNER: it goes in the ON.' } },
          },
          right: {
            text: 'She has to use RIGHT JOIN.',
            reply: "RIGHT JOIN keeps the accounts, not the customers. The problem is where the condition goes.",
            effects: { 0: { text: 'Changing the JOIN does not fix a misplaced filter.' } },
          },
          bug: {
            text: "It's a PostgreSQL fault with LEFT JOIN.",
            reply: 'PostgreSQL does what it is asked: first it joins and then it filters.',
            effects: { 0: { text: 'You blamed the database for a misplaced condition.' } },
          },
        },
      },
      nuria_incidencias: {
        body: 'Hi. I want to call the customers who have **any open incident**. Just the customer data: `id`, `nombre` and `email`, once each.',
      },
      nuria_thanks: { body: 'Eight calls. I am on it right away!' },
      carmen_nunca: {
        body: "Hi. To detect unused accounts I want the ones that have **never received** a transfer: `id` and `iban`. Diego told me there are none, but I find it hard to believe.",
      },
      carmen_thanks: { body: 'Three accounts. Diego said zero… you can ask Inés later why. Thanks.' },
      marta_por_cliente: {
        body: 'Another one: the **number of accounts of each customer**, **all** of them, also those with zero. Columns: `id`, `nombre` and the number of accounts.',
      },
      marta_por_cliente_thanks: { body: 'Forty rows, and number 38 with a zero. That is it. Thanks!' },
      ines_notin: {
        subject: '15:00 · Inés: “Why was Diego getting zero?”',
        body: "**Inés:** This is the query with which Diego told Carmen there were no accounts that hadn't received anything:\n\n`SELECT id FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias);`\n\nZero rows. You found three. What failed?",
        choices: {
          notin: {
            text: "The subquery also returns NULL (the transfers to other banks). `id NOT IN (…, NULL)` is never true, because comparing with NULL gives “unknown”. With `NOT EXISTS`, or with a `LEFT JOIN … IS NULL`, it doesn't happen.",
            reply: "Exactly, the most famous trap in SQL. If you use NOT IN with a subquery, make sure it can't return NULL. Or use NOT EXISTS and forget about it.",
            effects: { 3: { text: 'NOT IN with a NULL in the list returns nothing: NOT EXISTS is safer.' } },
          },
          distinct: {
            text: 'He was missing a DISTINCT in the subquery.',
            reply: "Repeats don't change the result of NOT IN. What breaks it is the NULL.",
            effects: { 0: { text: 'DISTINCT does not fix a NULL inside NOT IN.' } },
          },
          trust: {
            text: "If Diego got zero, my query must be wrong.",
            reply: 'Your query is fine: the three accounts exist and have never received anything. Check one of them yourself.',
            effects: { 0: { text: 'You doubted a correct result without checking it.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you found what was missing and a broken reference. What are you taking away?',
        choices: {
          lesson: {
            text: 'That LEFT JOIN keeps the left-hand table and fills in with NULL, that with `WHERE … IS NULL` I find what has no match, that filters on the right-hand table go in the ON, that to count I use COUNT(column) and that NOT EXISTS is safer than NOT IN.',
            reply: "Very good. Tomorrow you move to the test environment: you're going to change data. Carefully.",
          },
          inner: {
            text: 'That INNER JOIN is enough for me for everything.',
            reply: "Today you saw it isn't: what is missing can only be seen with LEFT JOIN. Check the debrief.",
            effects: { 0: { text: 'You came away with INNER JOIN, which hides exactly what is missing.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support', laura: 'QA Lead' }),
)
