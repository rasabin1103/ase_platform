import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m00Subconsultas } from '../m00-subconsultas'
import { ROLES_EN, missionEn } from './missionEn'

const SUBQUERY = { 0: { message: 'This task is solved with a subquery: a `(SELECT …)` inside the query.' } }

/** Course 6: Intermediate SQL · Mission 0 — The query inside the query. English version of ../m00-subconsultas.ts. */
export const m00SubconsultasEn = missionEn(
  m00Subconsultas,
  {
    title: 'The query inside the query',
    subtitle: 'Subqueries: a value, a list, a table or one figure per row.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Monday · month 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Two-step questions, in one query',
        body: 'Marta has her campaign without repeats, Carmen her maximum per status, Nuria her survey, Diego his average and Laura her test data with the zeros where they belong.',
      },
      ok: { title: 'Subqueries, halfway there', body: 'You solve some of the tasks, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: "Copying figures by hand doesn't scale", body: 'Several tasks were left undone. Replay the mission with the subqueries cheat sheet at hand.' },
    },
    briefing: {
      title: 'Month 2 · The query inside the query',
      paragraphs: [
        'Your second month at Kobalto begins. The team no longer asks you for lists: they ask for answers, and many of them need a figure that has to be calculated first.',
        'Today you will learn to put one query inside another. Each task is done when your query returns exactly what is asked, calculated by the query itself.',
      ],
      goals: [
        'Compare with a calculated value: a scalar subquery.',
        'Filter with a calculated list: IN and NOT EXISTS.',
        'Write a subquery correlated with the outer row.',
        'Aggregate an aggregate with a derived table in the FROM.',
        'Add a calculated column with a subquery in the SELECT.',
        'Tell when a JOIN repeats rows and when to use IN or EXISTS.',
      ],
    },
    docs: {
      chuleta_subconsultas: {
        title: 'Cheat sheet: subqueries',
        updatedLabel: 'Inés Moreno · Data',
        body: `## What does your subquery return?
| Returns | Where it goes | Example |
|---|---|---|
| One value | \`=\`, \`>\`, \`<\`… or in the SELECT | \`WHERE importe > (SELECT AVG(importe) FROM transferencias)\` |
| A list | \`IN\` / \`NOT IN\` | \`WHERE id IN (SELECT cliente_id FROM cuentas)\` |
| A table | In the \`FROM\`, with an alias | \`FROM (SELECT …) AS t\` |
| Is there any row? | \`EXISTS\` / \`NOT EXISTS\` | \`WHERE NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id)\` |

## Correlated
It uses a column of the outer query and is evaluated for each row. Give both tables an alias (\`t\`, \`t2\`).

## Traps
- \`=\` with a subquery that returns several rows: error. Use \`IN\` or an aggregate. Never \`LIMIT 1\` to hide it.
- \`NOT IN\` with a list that contains NULL returns nothing: better \`NOT EXISTS\`.
- "The ones that have some" with a JOIN repeats a row per match: \`IN\`, \`EXISTS\` or \`COUNT(DISTINCT …)\`.
- \`AVG(COUNT(*))\` gives an error: count in a subquery in the FROM and take the average outside.`,
      },
    },
    sqlLab: {
      starter: '-- A query inside another one\nSELECT id, importe\nFROM transferencias\nWHERE importe > (SELECT AVG(importe) FROM transferencias);',
      retos: {
        sobre_media: {
          title: 'Above the average',
          description: 'The `id` and the `importe` of the transfers whose amount is **greater than the average of all of them**, without typing the average by hand.',
          hint: 'The average, in a subquery in brackets: `WHERE importe > (SELECT AVG(importe) FROM transferencias)`.',
          requires: SUBQUERY,
        },
        ahorradores: {
          title: 'Customers with a savings account',
          description: 'The `id`, `nombre` and `apellidos` of the customers who have **some savings account** (`ahorro`), once each.',
          hint: "The subquery gives the list of `cliente_id` of the accounts with `tipo = 'ahorro'`; outside, `WHERE id IN (…)`.",
        },
        max_estado: {
          title: 'The highest one per status',
          description: 'For each transfer `estado`, the **highest** transfer: `id`, `estado` and `importe`. One row per status.',
          hint: 'Correlated: `FROM transferencias t WHERE t.importe = (SELECT MAX(t2.importe) FROM transferencias t2 WHERE t2.estado = t.estado)`.',
        },
        sin_incidencias: {
          title: 'Customers with no tickets',
          description: 'The `id`, `nombre` and `email` of the customers who have **never opened a ticket** (`incidencias`).',
          hint: '`WHERE NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id)`, or `NOT IN` with the list of `cliente_id` of the tickets.',
        },
        media_envios: {
          title: 'Average transfers sent per account',
          description: 'How many transfers **each account sends on average** (among those that have sent some), rounded to **2 decimals**. A single figure.',
          hint: 'First count per `cuenta_origen_id` in a subquery in the `FROM` (give it an alias, `AS envios`); outside, `ROUND(AVG(n), 2)`.',
          requires: SUBQUERY,
        },
        incidencias_cliente: {
          title: 'Tickets per customer',
          description: '**All** the customers with `id`, `nombre` and a column `incidencias` with how many tickets each one has opened (0 if none).',
          hint: 'In the SELECT: `(SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias`.',
        },
      },
    },
    bugs: {
      'C-MARTA': { title: "The savings offer doesn't go out (or goes out twice)", explanation: "Marta didn't get the list of customers with a savings account, once each.", technique: 'Subquery with IN.' },
      'C-CARMEN': { title: "The amounts control doesn't have the maximum per status", explanation: 'Carmen was left without the highest transfer of each status.', technique: 'Correlated subquery.' },
      'C-NURIA': { title: 'The satisfaction survey is left without recipients', explanation: "Nuria didn't get the list of customers with no tickets.", technique: 'NOT EXISTS (or NOT IN without NULLs).' },
      'C-DIEGO': { title: 'The new service is sized by eye', explanation: 'Without the average per account, Diego estimated the peak without data.', technique: 'Derived table in the FROM: aggregate an aggregate.' },
      'C-LAURA': { title: 'The tests have no customers without history', explanation: "Laura didn't get the count per customer with the zeros.", technique: 'Correlated subquery in the SELECT.' },
      'C-MULTIFILA': { title: 'A LIMIT 1 leaves a report with one customer out of thirteen', explanation: 'Hiding the "more than one row" error with LIMIT 1 returns an arbitrary result.', technique: 'One value → =; a list → IN.' },
      'C-DUPLICADOS': { title: 'The report says 49 customers with an active account (there are 38)', explanation: 'The JOIN repeats the customer for each active account.', technique: 'IN, EXISTS or COUNT(DISTINCT).' },
    },
    prevention: {
      title: 'At the end of the day',
      intro: "What happened with Monday's tasks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Savings offer', explanation: 'Customers with IN, no repeats.' },
        1: { label: "Carmen's control", explanation: 'The highest of each status.' },
        2: { label: "Nuria's survey", explanation: 'Customers with no tickets, with NOT EXISTS.' },
        3: { label: "Diego's sizing", explanation: 'Average of a count with a derived table.' },
        4: { label: "Laura's test data", explanation: 'Count per customer with the zeros.' },
        5: { label: 'Several-rows error well solved', explanation: 'IN instead of LIMIT 1.' },
        6: { label: 'Count without duplicates', explanation: 'IN or EXISTS instead of JOIN.' },
      },
    },
    concepts: {
      subquery_scalar: { title: 'Scalar subquery', summary: 'A query in brackets that returns one value and is used like a number.' },
      subquery_in: { title: 'Subquery with IN', summary: 'Compares with the list another query returns; each outer row comes out once.' },
      subquery_correlated: { title: 'Correlated subquery', summary: 'Uses columns of the outer query and is evaluated for each row.' },
      subquery_from: { title: 'Derived table', summary: 'A subquery in the FROM, with an alias: the way to aggregate an aggregate.' },
      subquery_select: { title: 'Subquery in the SELECT', summary: 'A calculated column per row, like a count per customer.' },
      subquery_multirow: { title: 'One value or a list', summary: 'With = the subquery must return one row; if there are several, IN. Never LIMIT 1 to hide it.' },
      semijoin_duplicates: { title: 'JOIN versus IN/EXISTS', summary: 'The JOIN gives one row per pair; IN and EXISTS answer "does it have any?".' },
    },
    seniorTips: [
      'Read the subqueries cheat sheet in the wiki.',
      'Inés: SELECT id, importe FROM transferencias WHERE importe > (SELECT AVG(importe) FROM transferencias).',
      "Marta: … FROM clientes WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro').",
      'Carmen: … WHERE t.importe = (SELECT MAX(t2.importe) FROM transferencias t2 WHERE t2.estado = t.estado).',
      'Nuria: … WHERE NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id).',
      'Diego: SELECT ROUND(AVG(n), 2) FROM (SELECT cuenta_origen_id, COUNT(*) AS n FROM transferencias GROUP BY cuenta_origen_id) AS envios.',
      'Laura: (SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias, in the SELECT.',
      'With Inés: one value → =, a list → IN; and for "the ones that have some", IN or EXISTS, not JOIN.',
    ],
    lessons: {
      scalar: {
        question: 'What is a subquery?',
        body: `A query **in brackets** inside another one. The simplest one returns **a single value** and is used as if it were a number:

\`\`\`
SELECT id, importe
FROM transferencias
WHERE importe > (SELECT AVG(importe) FROM transferencias);
\`\`\`

PostgreSQL first calculates the average and then compares each row with it. No copying the figure by hand: if the data changes, the query is still right.`,
      },
      in: {
        question: 'And if the subquery returns a list?',
        body: `You compare with \`IN\`:

\`\`\`
SELECT id, nombre, apellidos
FROM clientes
WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro');
\`\`\`

The subquery gives the list of \`cliente_id\` with savings and the outer query keeps those customers, **once each** even if they have several accounts. \`NOT IN\` does the opposite (careful if the list can contain NULL; in that case, \`NOT EXISTS\`).`,
      },
      correlated: {
        question: 'Can the subquery depend on each row?',
        body: `Yes: it is a **correlated** subquery. It uses a column of the outer query:

\`\`\`
SELECT t.id, t.estado, t.importe
FROM transferencias t
WHERE t.importe = (SELECT MAX(t2.importe)
                   FROM transferencias t2
                   WHERE t2.estado = t.estado);
\`\`\`

For each transfer \`t\`, the subquery calculates the maximum **of its status**. The aliases (\`t\`, \`t2\`) are essential to know which column belongs to which.`,
      },
      from: {
        question: 'Can I use the result of a query as if it were a table?',
        body: `Yes, in the \`FROM\` (it is called a *derived table*). Always give it an **alias** (\`AS envios\`): in PostgreSQL 16 or later it is optional, but in older versions and in other databases it is mandatory, and it lets you name its columns:

\`\`\`
SELECT ROUND(AVG(n), 2)
FROM (SELECT cuenta_origen_id, COUNT(*) AS n
      FROM transferencias
      GROUP BY cuenta_origen_id) AS envios;
\`\`\`

First you count per account; then you take the average of those counts. It is the way to **aggregate an aggregate**: \`AVG(COUNT(*))\` directly gives an error.`,
      },
      select: {
        question: 'And a subquery as a column?',
        body: `In the \`SELECT\`, a correlated subquery that returns one value per row:

\`\`\`
SELECT c.id, c.nombre,
       (SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias
FROM clientes c;
\`\`\`

Each customer comes out once, with their count (0 if they have none). It is an alternative to \`LEFT JOIN … GROUP BY\`: with few rows, very readable.`,
      },
      multirow: {
        question: '"The subquery returns more than one row": what do I do?',
        body: `With \`=\`, \`>\`, \`<\`… the subquery has to return **one value**. If it returns several rows:

- if you wanted to compare with a list, use **\`IN\`**;
- if you wanted one value, the subquery has to guarantee it: an aggregate (\`MAX\`, \`COUNT\`…) or a condition on a key.

Don't cover it up with \`LIMIT 1\`: the error would go away and it would return an arbitrary result.`,
      },
      semijoin: {
        question: 'JOIN or IN/EXISTS?',
        body: `They answer different questions:

- **JOIN**: "give me each customer–account pair". A customer with two accounts comes out **twice**.
- **IN / EXISTS**: "give me the customers who have some". Each customer comes out **once**.

If a JOIN gives you more rows than expected, you probably wanted IN or EXISTS (or \`COUNT(DISTINCT …)\`).`,
      },
    },
    quiz: {
      pre: {
        i0pre_scalar: {
          question: 'How do you ask for the transfers with an amount greater than the average of all of them?',
          options: ['WHERE importe > AVG(importe)', 'WHERE importe > (SELECT AVG(importe) FROM transferencias)', 'HAVING importe > AVG(importe)', 'WHERE importe > MEDIA'],
          explanation: 'The average is calculated in a subquery; an aggregate cannot go on its own in the WHERE.',
        },
        i0pre_in: {
          question: 'What does `WHERE id IN (SELECT cliente_id FROM cuentas)` return?',
          options: ['The customers who have some account', 'The customers without an account', 'An error', 'One row per account'],
          explanation: 'IN compares with the list the subquery returns.',
        },
        i0pre_correlated: {
          question: 'What is a correlated subquery?',
          options: ['One that uses columns of the outer query and is evaluated for each row', 'One that goes in the FROM', 'One that has a JOIN', 'One that returns several columns'],
          explanation: 'It depends on each row of the outer query.',
        },
        i0pre_from: {
          question: 'Why does `SELECT AVG(COUNT(*)) FROM transferencias GROUP BY cuenta_origen_id` give an error?',
          options: ['AVG does not exist in PostgreSQL', 'Aggregates cannot be nested: you count in a subquery in the FROM and take the average outside', 'A WHERE is missing', 'An ORDER BY is missing'],
          explanation: 'An aggregate of an aggregate is done in two steps, with a derived table.',
        },
        i0pre_multirow: {
          question: "`WHERE id = (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro')` gives an error. Why?",
          options: ['A JOIN is missing', 'The subquery returns several rows and only one value fits with =', 'tipo does not exist', 'Subqueries cannot be used in the WHERE'],
          explanation: 'For a list you use IN.',
        },
        i0pre_semijoin: {
          question: "A customer with two active accounts: how many times do they appear in `clientes JOIN cuentas … WHERE estado = 'activa'`?",
          options: ['Once', 'Twice', 'None', 'It depends on the order'],
          explanation: 'The JOIN gives one row per pair.',
        },
      },
      post: {
        i0post_scalar: {
          question: 'What is the advantage of calculating the average in a subquery instead of typing the figure?',
          options: ['None', 'The query stays correct when the data changes', 'It is shorter', 'It sorts the result'],
          explanation: 'The value is recalculated on every run.',
        },
        i0post_in: {
          question: "A customer has three savings accounts. How many times do they appear with `WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro')`?",
          options: ['Three', 'Once', 'None', 'It gives an error'],
          explanation: 'IN filters the outer table: each customer comes out once.',
        },
        i0post_correlated: {
          question: 'To get the highest transfer of each status, what does the subquery compare?',
          options: ['The maximum of all the transfers', 'The maximum of the transfers with the same status as the outer row', 'The average per status', 'The first status'],
          explanation: 'WHERE t2.estado = t.estado: correlated with the outer row.',
        },
        i0post_from: {
          question: 'How do you calculate the average number of transfers sent per account?',
          options: ['AVG(COUNT(*))', 'A COUNT per account in a subquery in the FROM and AVG outside', 'COUNT(AVG(*))', 'SUM(*) / AVG(*)'],
          explanation: 'An aggregate of an aggregate is done in two steps.',
        },
        i0post_select: {
          question: 'A subquery in the SELECT that counts tickets per customer: what does it give a customer with no tickets?',
          options: ['NULL', '0', 'The customer does not appear', 'Error'],
          explanation: 'COUNT(*) of zero rows is 0, and the customer appears anyway.',
        },
        i0post_semijoin: {
          question: 'You count "customers with some active account" with a JOIN and get more than there are customers. What do you use?',
          options: ['LEFT JOIN', 'IN or EXISTS (or COUNT(DISTINCT))', 'ORDER BY', 'LIMIT'],
          explanation: 'IN and EXISTS do not repeat the outer row.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Month 2: questions that need two queries',
        body: 'Welcome to your second month!\n\nThe team no longer asks you for lists: they ask for **answers**. And many answers need a figure that has to be calculated first: "the transfers above the average" requires knowing what the average is. That is what the **subquery** is for: a query in brackets inside another one.\n\nTo warm up:\n\n- The `id` and the `importe` of the transfers whose amount is **greater than the average of all of them**.\n\nWithout typing the average by hand: let the query itself calculate it.\n\nInés',
      },
      ines_ok: {
        body: 'Only four. Remember the average inflated by the huge transfers? Here you see it from the other side: almost nothing beats the average. And the best part: if the data changes tomorrow, the query is still right, because the average calculates itself.',
      },
      marta_ahorro: {
        body: "Hi! We're going to send an offer to the customers who **already have some savings account**. I need their `id`, `nombre` and `apellidos`, once each.",
      },
      marta_thanks: { body: 'Thirteen customers, none repeated. Perfect for the campaign!' },
      carmen_maximo: {
        body: 'Hi. For the amounts control I want, **for each status** (completada, pendiente, rechazada), the **highest** transfer: `id`, `estado` and `importe`. One row per status.',
      },
      carmen_thanks: { body: "The highest pending one doesn't reach €900, but the completed one is over €15,000. Noted. Thanks." },
      ines_multifila: {
        subject: '11:00 · Inés: "An error I don\'t understand"',
        body: "**Inés:** Diego wanted the customers with a savings account and wrote:\n\n`SELECT * FROM clientes WHERE id = (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro');`\n\nError: the subquery returns more than one row. What is wrong with it?",
        choices: {
          multirow: {
            text: 'With `=` the subquery has to return **a single value**, and here it returns thirteen customers. To compare with a list you use `IN`. And if he really wanted one value, the subquery has to guarantee it, with an aggregate such as `MAX` or `COUNT`.',
            reply: 'Exactly. Before writing a subquery, ask yourself: does this return a value, a list or a table? Where it can go depends on that.',
            effects: { 2: { text: 'One value → `=`; a list → `IN`; a table → in the `FROM`.' } },
          },
          limit: {
            text: 'Tell him to add `LIMIT 1` to the subquery and be done.',
            reply: 'That stops the error… and returns one arbitrary customer out of the thirteen. A wrong result is worse than an error.',
            effects: { 0: { text: 'You would cover the error with a wrong result.' } },
          },
          bug: {
            text: "It's a PostgreSQL bug with subqueries.",
            reply: 'PostgreSQL says exactly what is happening: there is more than one row where only one value fits.',
            effects: { 0: { text: 'You blamed the database for a problem in the query.' } },
          },
        },
      },
      nuria_sin_incidencias: {
        body: 'Hi. For a satisfaction survey we want to write to the customers who **have never opened a ticket**. Can you send me their `id`, `nombre` and `email`?',
      },
      nuria_thanks: { body: 'Ten happy customers (or so we hope). Thanks!' },
      diego_media: {
        body: 'Hey. To size the new service I need to know **how many transfers each account sends on average** (among those that have sent some). One figure with 2 decimals.',
      },
      diego_thanks: { body: '2.31 transfers per account. With that I can work out the peak. Thanks!' },
      laura_por_cliente: {
        body: 'Hi. To prepare test data I want **all the customers** with the number of tickets each one has opened: `id`, `nombre` and a column `incidencias`. Those with none, with a 0.',
      },
      laura_thanks: { body: 'Forty rows and the zeros where they belong. Now I can pick customers with and without history for the tests. Thanks!' },
      ines_duplicados: {
        subject: '15:00 · Inés: "49 customers?"',
        body: "**Inés:** Diego counted the customers with some active account using a JOIN:\n\n`SELECT COUNT(*) FROM clientes c JOIN cuentas a ON a.cliente_id = c.id WHERE a.estado = 'activa';`\n\nHe gets **49**. But there are only 38 customers with some active account. Where do the other 11 come from?",
        choices: {
          semijoin: {
            text: "The JOIN repeats the customer **once per active account**: those with two accounts count twice. For \"customers who have some\" it's better to use `WHERE id IN (SELECT cliente_id FROM cuentas WHERE estado = 'activa')` or `EXISTS`, which don't repeat. Or count with `COUNT(DISTINCT c.id)`.",
            reply: 'That\'s it. IN and EXISTS answer "does it have any?"; the JOIN answers "give me each pair". They are different questions.',
            effects: { 3: { text: 'For "the ones that have some", IN or EXISTS: a JOIN repeats a row per match.' } },
          },
          data: {
            text: 'There must be duplicate customers in the table.',
            reply: "The customers table has no duplicates: it's the JOIN that repeats.",
            effects: { 0: { text: 'You blamed the data for the shape of the query.' } },
          },
          left: {
            text: 'Tell him to use LEFT JOIN and it will be fixed.',
            reply: 'LEFT JOIN keeps the customers without an account: even more rows would come out. The problem is the repeated pairs.',
            effects: { 0: { text: "Changing the type of JOIN doesn't remove the repeats." } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you wrote queries inside queries. What are you taking away?',
        choices: {
          lesson: {
            text: 'That a subquery can give a value (to compare with `=`), a list (for `IN`), a table (for the `FROM`) or one figure per row (in the `SELECT`), that it can depend on the outer row (correlated) and that for "the ones that have some" IN and EXISTS don\'t repeat like the JOIN does.',
            reply: "Very good. Tomorrow: when the query grows, we organize it in steps with WITH.",
          },
          two: {
            text: "That it's easier to run two queries and copy the number from the first into the second.",
            reply: 'Until the data changes and the copied number is no longer valid. Check the debrief.',
            effects: { 0: { text: 'You came away with copying values by hand instead of calculating them in the query.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
