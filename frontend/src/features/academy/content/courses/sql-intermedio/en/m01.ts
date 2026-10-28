import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m01Cte } from '../m01-cte'
import { ROLES_EN, missionEn } from './missionEn'

const WITH = { 0: { message: 'This task is asked for in steps: start the query with `WITH step AS (…)`.' } }

/** Course 6: Intermediate SQL · Mission 1 — Step by step. English version of ../m01-cte.ts. */
export const m01CteEn = missionEn(
  m01Cte,
  {
    title: 'Step by step',
    subtitle: 'WITH: each step with its name, the query reads from top to bottom.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Tuesday · month 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Queries anyone can follow',
        body: 'Marta has her loyalty programme, Carmen her analysis by city, Nuria her calls, Diego the fees with the right average and Laura her test customers. And anyone can review each step.',
      },
      ok: { title: 'Named steps, halfway there', body: 'You already use WITH, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'Brackets inside brackets', body: 'Several tasks were left undone. Replay the mission with the WITH cheat sheet at hand.' },
    },
    briefing: {
      title: 'Month 2 · Step by step',
      paragraphs: [
        'Second day of the month. The tasks now need two or three steps: first a total per customer, then an average, then a filter. Today you will write them with WITH, one named step after another.',
        "Today's tasks are asked for in steps: the query has to start with WITH and return exactly what is asked.",
      ],
      goals: [
        'Write a step with WITH and use it as a table.',
        'Chain several steps separated by commas.',
        'Reuse a step twice in the same query.',
        'Understand that a WITH only lives inside its query.',
        'Bring the data to the right granularity before aggregating.',
      ],
    },
    docs: {
      chuleta_with: {
        title: 'Cheat sheet: queries in steps with WITH',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Shape
\`\`\`
WITH paso1 AS (
  SELECT …
),
paso2 AS (
  SELECT … FROM paso1 …
)
SELECT … FROM paso2 …;
\`\`\`
- A single \`WITH\` at the start; the steps, separated by **commas**; no comma before the final SELECT.
- Each step can use the previous ones, and the final query can use any of them, as many times as it wants.
- Give every calculated column an alias (\`SUM(saldo) AS saldo_total\`): it is the name the next steps will see.

## Scope
The WITH ends with its query (\`;\`). It does not create tables. For something reusable: a view.

## Granularity
Before aggregating: "one row of what?". Average per customer → first one row per customer with their total, then the average.

## Total balance of a customer
\`SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id\``,
      },
    },
    sqlLab: {
      starter: '-- A named step and the final query\nWITH saldos AS (\n  SELECT cliente_id, SUM(saldo) AS saldo_total\n  FROM cuentas\n  GROUP BY cliente_id\n)\nSELECT *\nFROM saldos;',
      retos: {
        saldo_alto: {
          title: 'More than €20,000 in total',
          description: 'With a step `saldos` (total balance of each customer): `id`, `nombre` and `saldo_total` of the customers with **more than €20,000** in total.',
          hint: 'The step sums by `cliente_id`; the final query joins `clientes` with `saldos` and filters `saldo_total > 20000`.',
          requires: WITH,
        },
        emisores: {
          title: 'More than €1,000 sent',
          description: '`id`, `nombre` and `total_enviado` of the customers who have sent **more than €1,000** in **completed** transfers, adding up all their accounts.',
          hint: 'A step `enviado` with `transferencias JOIN cuentas` (by `cuenta_origen_id`), only completed ones, grouped by `cliente_id`. Then `clientes JOIN enviado` with `total_enviado > 1000`.',
          requires: WITH,
        },
        sobre_media_ciudad: {
          title: 'Above the average of their city',
          description: '`id`, `nombre`, `ciudad` and `saldo_total` of the customers whose total balance is above the **average of the total balances of their city**.',
          hint: 'Two steps: `saldos` (one row per customer, with their city and total) and `medias` (AVG of `saldo_total` per city, over `saldos`). At the end, join the two by city and compare.',
          requires: WITH,
        },
        abiertas_saldo_bajo: {
          title: 'Open ticket and a low balance',
          description: '`id`, `nombre` and `saldo_total` of the customers with **some open ticket** (`cerrada_en` empty) and a total balance **below €5,000**.',
          hint: 'One step with the distinct `cliente_id` of open tickets and another with the balances. At the end, `clientes` joined to both.',
          requires: WITH,
        },
        segmentos: {
          title: 'Average balance per customer and segment',
          description: 'For each `segmento` (leaving out the customers with no segment): `segmento`, number of `clientes` and `saldo_medio` **per customer**, rounded to 2 decimals.',
          hint: 'First one row per customer with their segment and total balance; then `GROUP BY segmento` with `COUNT(*)` and `ROUND(AVG(saldo_total), 2)`.',
          requires: WITH,
        },
        sobre_media: {
          title: 'Above the average of everyone',
          description: '`cliente_id` and `saldo_total` of the customers whose total balance is above the **average of the total balances of all the customers**. The step `saldos`, written only once.',
          hint: 'In the final query, `FROM saldos WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos)`.',
          requires: WITH,
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'The loyalty programme starts without a list', explanation: "Marta didn't get the customers who send the most.", technique: 'A step that aggregates and a filter on it.' },
      'C-CARMEN': { title: 'The risk analysis by area has no data', explanation: 'Carmen was left without the customers above the average of their city.', technique: 'Two steps chained with WITH.' },
      'C-NURIA': { title: 'Customer support calls at random', explanation: "Nuria didn't have the list of customers with an open ticket and a low balance.", technique: 'Two steps and a final JOIN.' },
      'C-DIEGO': { title: 'The fees are calculated with the average per account', explanation: 'Without the average per customer, the fees of the standard segment come out almost €2,000 too low.', technique: 'One row per customer and then the average.' },
      'C-LAURA': { title: 'The test customers are picked by eye', explanation: "Laura didn't get the customers above the average.", technique: 'A step reused twice.' },
      'C-AMBITO': { title: 'A copied, outdated "saldos" table shows up', explanation: 'To reuse a WITH, someone copied the balances into a table nobody updates.', technique: 'WITH for one query; a view for something permanent.' },
      'C-GRANULARIDAD': { title: 'A report mixes averages per account and per customer', explanation: 'AVG over a JOIN with accounts gives an average per account.', technique: 'Bring the data to one row per customer before aggregating.' },
    },
    prevention: {
      title: 'At the end of the day',
      intro: "What happened with Tuesday's tasks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Marta's loyalty programme", explanation: 'Customers who send more than €1,000.' },
        1: { label: 'Risk by area', explanation: 'Two steps: balances and averages per city.' },
        2: { label: "Nuria's calls", explanation: 'Open ticket and a low balance.' },
        3: { label: "Diego's fees", explanation: 'Average per customer, not per account.' },
        4: { label: 'Test customers', explanation: 'One step used twice.' },
        5: { label: 'No copied tables', explanation: 'The WITH lives in its query.' },
        6: { label: 'Averages done right', explanation: 'First the granularity, then the aggregate.' },
      },
    },
    concepts: {
      cte_basic: { title: 'WITH (CTE)', summary: 'A named step that the final query uses as a table.' },
      cte_readability: { title: 'Readable queries', summary: 'Each step with a name that says what it calculates; the query reads from top to bottom.' },
      cte_chain: { title: 'Chained steps', summary: 'A single WITH, steps separated by commas; each one can use the previous ones.' },
      cte_reuse: { title: 'Reusing a step', summary: 'The same step is used several times in the query: the calculation is written once.' },
      cte_scope: { title: 'Scope of the WITH', summary: 'It only exists inside its query; for something permanent, a view.' },
      cte_grain: { title: 'Granularity', summary: '"One row of what?": bring the data to the right granularity before aggregating.' },
      cte_vs_subquery: { title: 'WITH or subquery', summary: 'A subquery for something simple; WITH for several steps or reused steps.' },
    },
    seniorTips: [
      'Read the WITH cheat sheet in the wiki.',
      'Inés: WITH saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id) SELECT c.id, c.nombre, s.saldo_total FROM clientes c JOIN saldos s ON … WHERE s.saldo_total > 20000.',
      'Marta: step enviado = completed transferencias JOIN cuentas by cuenta_origen_id, SUM per cliente_id; filter total_enviado > 1000.',
      'Carmen: steps saldos (per customer, with city) and medias (AVG per city over saldos); compare by joining on city.',
      'Nuria: steps abiertas (DISTINCT cliente_id with cerrada_en IS NULL) and saldos; saldo_total < 5000.',
      'Diego: one row per customer with segment and total; then COUNT(*) and ROUND(AVG(saldo_total), 2) per segment.',
      'Laura: FROM saldos WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos).',
      'With Inés: the WITH lives in its query; and before an average, "one row of what?".',
    ],
    lessons: {
      basic: {
        question: 'What is a WITH?',
        body: `A way to **give a name to a step** of the query (it is called a CTE, *common table expression*). Then the final query uses it as if it were a table:

\`\`\`
WITH saldos AS (
  SELECT cliente_id, SUM(saldo) AS saldo_total
  FROM cuentas
  GROUP BY cliente_id
)
SELECT c.id, c.nombre, s.saldo_total
FROM clientes c
JOIN saldos s ON s.cliente_id = c.id
WHERE s.saldo_total > 20000;
\`\`\`

It does the same as a subquery in the \`FROM\`, but it reads in order: first the step, then what is done with it.`,
      },
      chain: {
        question: 'Can I chain several steps?',
        body: `Yes: separated by **commas**, with a single \`WITH\` at the start. Each step can use the ones before it:

\`\`\`
WITH saldos AS (
  SELECT c.id, c.nombre, c.ciudad, SUM(a.saldo) AS saldo_total
  FROM clientes c JOIN cuentas a ON a.cliente_id = c.id
  GROUP BY c.id, c.nombre, c.ciudad
),
medias AS (
  SELECT ciudad, AVG(saldo_total) AS media
  FROM saldos
  GROUP BY ciudad
)
SELECT s.id, s.nombre, s.ciudad, s.saldo_total
FROM saldos s JOIN medias m ON m.ciudad = s.ciudad
WHERE s.saldo_total > m.media;
\`\`\`

Typical mistake: writing \`WITH\` in front of each step. It only goes once.`,
      },
      reuse: {
        question: 'Can I use the same step twice?',
        body: `Yes, as many times as you want inside the same query:

\`\`\`
WITH saldos AS (
  SELECT cliente_id, SUM(saldo) AS saldo_total
  FROM cuentas GROUP BY cliente_id
)
SELECT cliente_id, saldo_total
FROM saldos
WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos);
\`\`\`

The calculation is written **once**. If the definition of balance changes tomorrow, you touch it in a single place.`,
      },
      scope: {
        question: 'How long does a WITH last?',
        body: `As long as **its query**: up to the \`;\`. It does not create any table and is not stored in the database.

- Do you need it in another query? Repeat the \`WITH\`.
- Will you use it all the time? Save it as a **view** (\`CREATE VIEW\`, at the end of the course).
- Don't copy the data into a table: it goes out of date as soon as the data changes.`,
      },
      grain: {
        question: 'Average per account or per customer?',
        body: `Before aggregating, ask yourself **"one row of what?"** (the *granularity*).

\`AVG(a.saldo)\` over \`clientes JOIN cuentas\` is an average **per account**: the customer with two accounts counts twice, with the balance split. If you want the average **per customer**:

1. A step that leaves **one row per customer** with their total.
2. The average of those totals.

With \`WITH\` both steps are visible at a glance.`,
      },
      vs: {
        question: 'WITH or subquery?',
        body: `They do the same and PostgreSQL runs them in a similar way. Choose by readability:

- **Subquery**: a value or a simple list (\`WHERE x > (SELECT AVG…)\`).
- **WITH**: several steps, a step used more than once, or a query someone else is going to review.

Rule of thumb: if you need more than one level of brackets to understand it, move it to \`WITH\`.`,
      },
    },
    quiz: {
      pre: {
        i1pre_basic: {
          question: 'What does `WITH saldos AS (SELECT …) SELECT * FROM saldos` do?',
          options: ['It creates a table saldos in the database', 'It names a step that the final query uses as a table', 'It saves the query to use it tomorrow', 'Nothing: it gives an error'],
          explanation: 'A WITH (CTE) is a named step inside a query.',
        },
        i1pre_chain: {
          question: 'How do you write two steps?',
          options: ['WITH a AS (…) WITH b AS (…) SELECT …', 'WITH a AS (…), b AS (…) SELECT …', 'WITH a, b AS (…) SELECT …', "You can't: only one step"],
          explanation: 'A single WITH and the steps separated by commas.',
        },
        i1pre_scope: {
          question: 'After running a query with `WITH saldos AS (…)`, can you do `SELECT * FROM saldos` in another query?',
          options: ['Yes, it is saved', 'No: the WITH only exists inside its query', 'Yes, until you close the console', 'Only if you are an administrator'],
          explanation: 'It ends with its query; for something permanent, a view.',
        },
        i1pre_reuse: {
          question: 'Can the final query use the same step of the WITH twice?',
          options: ['No, only once', 'Yes, as many times as needed', 'Only in the FROM', 'Only with UNION'],
          explanation: 'For example in the FROM and in a subquery of the WHERE.',
        },
        i1pre_grain: {
          question: 'One customer has two accounts with €1,000 and €3,000; another, one with €2,000. What is the average balance **per customer**?',
          options: ['€2,000', '€3,000', '€6,000', '€1,500'],
          explanation: 'Totals per customer: 4,000 and 2,000 → average 3,000. Per account it would be 2,000.',
        },
        i1pre_vs: {
          question: 'When is a WITH better than a subquery?',
          options: ['Never', 'When there are several steps or a step is used more than once', 'Only for a value', 'When the query has no WHERE'],
          explanation: 'The WITH orders the steps and avoids repeating them.',
        },
      },
      post: {
        i1post_basic: {
          question: 'In `WITH saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id)`, which columns does `saldos` have?',
          options: ['All the columns of cuentas', 'cliente_id and saldo_total', 'Only saldo', 'None until the final SELECT'],
          explanation: 'The ones its SELECT returns, with their aliases.',
        },
        i1post_chain: {
          question: 'In `WITH saldos AS (…), medias AS (…)`, can `medias` use `saldos`?',
          options: ['Yes: each step can use the previous ones', 'No, they are independent', 'Only if they have the same name', 'Only with JOIN'],
          explanation: 'The steps are chained in order.',
        },
        i1post_scope: {
          question: 'The team wants to use "total balance per customer" in many reports. What do you propose?',
          options: ['Copying it into a table every day', 'A view', "A WITH and not closing the console", 'Sending the result by email'],
          explanation: 'The WITH is for one query; something reusable and always up to date is a view.',
        },
        i1post_reuse: {
          question: 'Customers with a balance above the average of everyone: what is the advantage of calculating `saldos` in a WITH?',
          options: ['None', 'The calculation is written once and used in the FROM and in the average', 'It is mandatory', 'It sorts the result'],
          explanation: 'A single place to maintain.',
        },
        i1post_grain: {
          question: '`AVG(a.saldo)` over `clientes JOIN cuentas` grouped by segment gives an average…',
          options: ['per customer', 'per account', 'per segment and customer', 'that is always wrong'],
          explanation: 'Each row of the JOIN is an account.',
        },
        i1post_vs: {
          question: 'A query has three levels of nested subqueries. What do you do before sending it for review?',
          options: ['Nothing', 'Rewrite it with WITH, one named step per level', 'Put it on one line', 'Remove the aliases'],
          explanation: 'Named steps are reviewed one by one.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Queries that read from top to bottom',
        body: "Good morning.\n\nYesterday you put queries inside queries. It works, but when there are three levels of brackets nobody understands anything (not even you, a week from now). Today you will use **WITH**: you give a name to each step and the final query uses those steps as if they were tables.\n\nTo start:\n\n- A first step `saldos` with the **total balance of each customer** (the sum of their accounts).\n- With it, the `id`, the `nombre` and the `saldo_total` of the customers who have **more than €20,000** in total.\n\nInés",
      },
      ines_ok: {
        body: 'Seven customers. Notice that the query already reads like a recipe: first I calculate the balances, then I filter. When someone reviews it, they will understand each step by its name.',
      },
      marta_emisores: {
        body: "Hi! For a loyalty programme I want the customers who have **sent more than €1,000** in **completed** transfers (adding up all their accounts). I need `id`, `nombre` and `total_enviado`. Do it in steps, because I'll want to reuse it later.",
      },
      marta_thanks: { body: 'Twenty-three customers. And even I understand the query: "sent per customer" and then "more than a thousand". Thanks!' },
      carmen_ciudad: {
        body: "Hi. For the risk analysis by area I need the customers whose **total balance** is **above the average of their city**: `id`, `nombre`, `ciudad` and `saldo_total`. Each city's average, calculated with the total balances of its customers, not with the individual accounts.",
      },
      carmen_thanks: { body: 'Twelve customers. And I can see the two named steps: balances and averages per city. That way I can audit it. Thanks.' },
      ines_ambito: {
        subject: '11:00 · Inés: "My WITH has disappeared"',
        body: '**Inés:** Diego wrote this in the console:\n\n`WITH saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id) SELECT * FROM saldos;`\n\nIt works. Then he ran `SELECT * FROM saldos WHERE saldo_total > 1000;` and it tells him the table "saldos" does not exist. What do you explain to him?',
        choices: {
          scope: {
            text: 'That a `WITH` only exists **inside the query where it is written**: it ends at the `;`. It does not create any table. To use it again you repeat the `WITH` in the new query, and if it will be used all the time, you save it as a **view**.',
            reply: "That's it. The WITH is a temporary name for a step of a single query. You will see views at the end of the course.",
            effects: { 2: { text: 'A WITH only lives inside its query; to reuse it all the time, a view.' } },
          },
          table: {
            text: 'That he should create a table `saldos` with `CREATE TABLE` and then he will always have it.',
            reply: 'The replica is read-only, and a copied table goes out of date as soon as the accounts change. For a step of one query, WITH; for something permanent, a view.',
            effects: { 0: { text: 'You proposed copying the data into a table that goes out of date.' } },
          },
          bug: {
            text: 'That the console lost the connection between the two queries.',
            reply: 'The connection is fine: the WITH is not saved anywhere, it only exists while its query runs.',
            effects: { 0: { text: 'You blamed the console for the scope of the WITH.' } },
          },
        },
      },
      nuria_abiertas: {
        body: 'Hi. I want to call first the customers who have **some open ticket** and also **a low balance** (less than €5,000 in total), because they tend to be the angriest. Can you send me `id`, `nombre` and `saldo_total`?',
      },
      nuria_thanks: { body: 'Three calls for this morning. Thanks!' },
      diego_segmentos: {
        body: 'Hey. For the new fee calculation I need, for each **segment** (customers with no segment left out), how many `clientes` there are and their `saldo_medio` **per customer** (the average of their total balances, with 2 decimals). Columns: `segmento`, `clientes`, `saldo_medio`.',
      },
      diego_thanks: { body: 'Three segments, with the average per customer. Just what I needed for the fees. Thanks!' },
      laura_media: {
        body: "Hi. To pick test customers I want the ones with a **total balance above the average of all the customers**: `cliente_id` and `saldo_total`. Calculate the balances once and use them twice, don't repeat the same calculation.",
      },
      laura_thanks: { body: "Twelve customers and the calculation written only once. If I change the definition of balance tomorrow, I only touch it in one place. Thanks!" },
      ines_granularidad: {
        subject: '15:00 · Inés: "Average of what?"',
        body: '**Inés:** Diego had tried this before:\n\n`SELECT c.segmento, COUNT(DISTINCT c.id), ROUND(AVG(a.saldo), 2) FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.segmento;`\n\nFor the standard segment he gets an average of €7,009. With your query it is €8,837. Which one is right and why don\'t they match?',
        choices: {
          grain: {
            text: "Diego's one averages **per account**: a customer with two accounts counts twice, with the balance split. He wanted the average **per customer**, so first you have to add up each customer's accounts (a step with `WITH`) and then average those totals.",
            reply: 'Exactly: before aggregating, ask yourself "one row of what?". First you bring the data to the granularity you want (one customer, one row) and then you aggregate.',
            effects: { 3: { text: 'First, one row per customer; then, the average.' } },
          },
          distinct: {
            text: 'Tell him to use `AVG(DISTINCT a.saldo)` so it does not count repeats.',
            reply: 'DISTINCT would remove equal balances of different customers and it would still be an average per account. The problem is not the repeats, it is the granularity.',
            effects: { 0: { text: "DISTINCT doesn't change the granularity of the average." } },
          },
          same: {
            text: "That it doesn't matter: both are \"average balance\".",
            reply: 'For the fees it does matter: almost €2,000 of difference per customer. They are two different questions.',
            effects: { 0: { text: 'You accepted two averages that answer different questions.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you wrote queries in steps. What are you taking away?',
        choices: {
          lesson: {
            text: 'That with `WITH` each step has a name and the query reads from top to bottom; that a step can use the previous ones and be used several times; that it only lives inside its query; and that before aggregating you have to bring the data to the right granularity.',
            reply: 'Very good. Tomorrow, dates and texts, with the card payments that have just arrived in the replica.',
          },
          nest: {
            text: "That nested subqueries do the same and it's shorter.",
            reply: 'You can, but nobody reviews three levels of brackets. Check the debrief.',
            effects: { 0: { text: 'You came away with nesting subqueries instead of naming the steps.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
