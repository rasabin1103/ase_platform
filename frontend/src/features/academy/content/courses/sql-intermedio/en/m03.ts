import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m03Conjuntos } from '../m03-conjuntos'
import { ROLES_EN, missionEn } from './missionEn'

const op = (word: 'UNION' | 'INTERSECT' | 'EXCEPT') => ({ 0: { message: `This task is solved by putting two queries together with \`${word}\`.` } })

/** Course 6: Intermediate SQL · Mission 3 — Putting results together. English version of ../m03-conjuntos.ts. */
export const m03ConjuntosEn = missionEn(
  m03Conjuntos,
  {
    title: 'Putting results together',
    subtitle: 'UNION, UNION ALL, INTERSECT and EXCEPT: lists that are added, crossed and subtracted.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Thursday · month 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Lists that add up',
        body: 'Marta has her complete January report, Carmen her two customers to review, Nuria her tutorial, Diego account 999 found before migrating and Laura her merchants with history.',
      },
      ok: { title: 'Lists put together, halfway there', body: 'You already use UNION, INTERSECT and EXCEPT, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'Lists crossed by hand', body: 'Several tasks were left undone. Replay the mission with the set operations cheat sheet at hand.' },
    },
    briefing: {
      title: 'Month 2 · Putting results together',
      paragraphs: [
        'Thursday. Today the answers come from putting two queries together: the ones in one list or in another, in both, or in one and not in the other.',
        'Each task says how the lists are combined: your query has to use that operator and return exactly what is asked.',
      ],
      goals: [
        'Put two lists together without repeats with UNION.',
        'Put movements together with UNION ALL, without losing rows.',
        'Cross two lists with INTERSECT.',
        'Subtract one list from another with EXCEPT.',
        'Keep the columns in the same number, order and type.',
      ],
    },
    docs: {
      chuleta_conjuntos: {
        title: 'Cheat sheet: putting results together',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Operators
| Operator | Returns |
|---|---|
| \`A UNION B\` | What is in A or in B, without repeats |
| \`A UNION ALL B\` | All the rows of A and of B |
| \`A INTERSECT B\` | What is in A and in B |
| \`A EXCEPT B\` | What is in A and not in B |

## Rules
- Same number of columns, same order, compatible types: they are paired **by position**.
- The column names come from the first query.
- A single \`ORDER BY\`, at the end.
- A fixed column (\`'tarjeta' AS tipo\`) says where each row comes from.

## So you don't get it wrong
- Are you going to add up or count? \`UNION ALL\`.
- Do you want a list of distinct values? \`UNION\`.
- \`EXCEPT\` is not symmetric.`,
      },
    },
    sqlLab: {
      starter: '-- Two queries, one list\nSELECT cuenta_origen_id AS cuenta_id FROM transferencias\nUNION\nSELECT cuenta_destino_id FROM transferencias\nWHERE cuenta_destino_id IS NOT NULL;',
      retos: {
        cuentas_movidas: {
          title: 'Accounts with some transfer',
          description: 'The accounts that have taken part in some transfer, as **origin or destination**, without repeats and without the empty ones: one column `cuenta_id`.',
          hint: '`cuenta_origen_id` from one query, `UNION`, `cuenta_destino_id` (not null) from another.',
          requires: op('UNION'),
        },
        movimientos_enero: {
          title: 'Movements of January 2026',
          description: "**Completed** transfers and **accepted** card payments of **January 2026**, in one list: `tipo` ('transferencia' or 'tarjeta'), `id`, `importe` and `fecha`.",
          hint: "`SELECT 'transferencia' AS tipo, id, importe, creada_en AS fecha FROM transferencias WHERE …` `UNION ALL` `SELECT 'tarjeta', id, importe, pagado_en FROM pagos_tarjeta WHERE …`. January, with a date range.",
          requires: op('UNION'),
        },
        rechazo_e_incidencia: {
          title: 'Rejected payment and a blocked-card ticket',
          description: "`cliente_id` of the customers with **some rejected card payment** who **also** have a ticket with reason **'Tarjeta bloqueada'** (blocked card).",
          hint: 'First list: `pagos_tarjeta` → `tarjetas` → `cuentas` (to get to the `cliente_id`), only rejected ones. `INTERSECT`. Second: `cliente_id` of `incidencias` with that reason.',
          requires: op('INTERSECT'),
        },
        sin_pagos: {
          title: 'Customers who have never paid by card',
          description: '`id` and `nombre` of the customers who have **no card payment at all**.',
          hint: '`SELECT id, nombre FROM clientes` `EXCEPT` the `c.id, c.nombre` of customers joined to accounts, cards and payments.',
          requires: op('EXCEPT'),
        },
        destinos_inexistentes: {
          title: "Destination accounts that don't exist",
          description: 'The `cuenta_destino_id` (not empty) of `transferencias` that **do not exist** in `cuentas`. One column.',
          hint: '`SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL` `EXCEPT` `SELECT id FROM cuentas`.',
          requires: op('EXCEPT'),
        },
        comercios_dos_anios: {
          title: 'Merchants with payments in both years',
          description: '`comercio_id` of the merchants with **accepted** payments in **2025** and **also** in **2026**.',
          hint: 'Two queries on `pagos_tarjeta` with different date ranges, combined with `INTERSECT`.',
          requires: op('INTERSECT'),
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'The January report comes out without movements', explanation: "Marta didn't get the combined list of transfers and payments.", technique: 'UNION ALL with a type column.' },
      'C-CARMEN': { title: 'Two customers still have their card blocked by mistake', explanation: "Carmen didn't cross rejected payments with tickets.", technique: 'INTERSECT.' },
      'C-NURIA': { title: 'The payments tutorial reaches every customer', explanation: 'Without the list of customers with no payments, Nuria sent it to everyone.', technique: 'EXCEPT.' },
      'C-DIEGO': { title: 'The transfers migration fails in production', explanation: 'Nobody spotted destination account 999, which does not exist.', technique: 'EXCEPT as an integrity check.' },
      'C-LAURA': { title: 'The regression tests use merchants with no history', explanation: "Laura didn't have the merchants with payments in both years.", technique: 'INTERSECT.' },
      'C-UNION': { title: 'The January report is €17.55 short', explanation: 'UNION removed a movement with the same amount as another.', technique: 'UNION ALL to add up or count.' },
      'C-COLUMNAS': { title: 'A listing mixes amounts with identifiers', explanation: 'UNION paired columns in swapped order without giving an error.', technique: 'Same columns, in the same order.' },
    },
    prevention: {
      title: 'At the end of the day',
      intro: "What happened with Thursday's tasks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'January report', explanation: 'Transfers and payments together.' },
        1: { label: "Carmen's review", explanation: 'Customers in both lists.' },
        2: { label: "Nuria's tutorial", explanation: 'Customers with no payments.' },
        3: { label: "Diego's migration", explanation: 'Account 999, found.' },
        4: { label: "Laura's regression", explanation: 'Merchants with two years of data.' },
        5: { label: 'Complete totals', explanation: 'UNION ALL for movements.' },
        6: { label: 'Columns in their place', explanation: 'Same order in both queries.' },
      },
    },
    concepts: {
      union_distinct: { title: 'UNION', summary: 'What is in one list or in the other, without repeats.' },
      union_all: { title: 'UNION ALL', summary: 'All the rows of both queries: to add up or count movements.' },
      intersect_op: { title: 'INTERSECT', summary: 'What is in both lists.' },
      except_op: { title: 'EXCEPT', summary: 'What is in the first list and not in the second; it is not symmetric.' },
      setop_columns: { title: 'Columns by position', summary: 'Same number, order and types; names from the first query; ORDER BY at the end.' },
      setop_vs_join: { title: 'Sets or JOIN', summary: 'JOIN puts columns side by side; UNION and friends, rows underneath or compared lists.' },
    },
    seniorTips: [
      'Read the putting results together cheat sheet in the wiki.',
      'Inés: cuenta_origen_id AS cuenta_id … UNION … cuenta_destino_id … WHERE cuenta_destino_id IS NOT NULL.',
      "Marta: 'transferencia' AS tipo, id, importe, creada_en AS fecha … UNION ALL 'tarjeta', id, importe, pagado_en …, January with a range.",
      "Carmen: cliente_id of rejected payments (pagos → tarjetas → cuentas) INTERSECT cliente_id of incidencias 'Tarjeta bloqueada'.",
      'Nuria: SELECT id, nombre FROM clientes EXCEPT c.id, c.nombre of customers with payments.',
      'Diego: non-null cuenta_destino_id EXCEPT SELECT id FROM cuentas.',
      'Laura: comercio_id accepted in 2025 INTERSECT comercio_id accepted in 2026.',
      'With Inés: to add up, UNION ALL; and columns are paired by position.',
    ],
    lessons: {
      union: {
        question: 'What does UNION do?',
        body: `It puts the results of two queries **one below the other** and removes the repeated rows:

\`\`\`
SELECT cuenta_origen_id AS cuenta_id FROM transferencias
UNION
SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL;
\`\`\`

An account that has sent and received comes out **once**. It is the way to say "the ones in one list **or** in the other".`,
      },
      union_all: {
        question: 'And UNION ALL?',
        body: `The same, but **without removing repeats**: it returns all the rows of both queries. It is faster (it doesn't have to look for duplicates) and it is what you want to put movements together and then add them up or count them.

\`\`\`
SELECT 'transferencia' AS tipo, id, importe, creada_en AS fecha FROM transferencias WHERE …
UNION ALL
SELECT 'tarjeta', id, importe, pagado_en FROM pagos_tarjeta WHERE …;
\`\`\`

The fixed column \`'transferencia'\`/\`'tarjeta'\` says where each row comes from.`,
      },
      intersect: {
        question: 'How do I get what is in both lists?',
        body: `With \`INTERSECT\`: only the rows that **both** queries return (without repeats).

\`\`\`
SELECT comercio_id FROM pagos_tarjeta WHERE pagado_en < '2026-01-01'
INTERSECT
SELECT comercio_id FROM pagos_tarjeta WHERE pagado_en >= '2026-01-01';
\`\`\`

It could be done with \`IN\` or \`EXISTS\`, but with INTERSECT it reads as it is: "this list **and** this other one".`,
      },
      except: {
        question: 'And what is in one and not in the other?',
        body: `\`EXCEPT\`: the rows of the **first** query that are **not** in the second. The order matters: \`A EXCEPT B\` is not \`B EXCEPT A\`.

\`\`\`
SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL
EXCEPT
SELECT id FROM cuentas;
\`\`\`

It is a great QA tool: "what should exist and doesn't". Alternative: \`NOT EXISTS\`.`,
      },
      columns: {
        question: 'What rules do the columns have?',
        body: `The queries are combined **by position**:

- Same **number** of columns (otherwise, an error).
- **Compatible** types in each position (text with text, numbers with numbers).
- Same **order**: if you swap two columns of the same type, there is no error… and the result is garbage.
- The **names** come from the first query.
- An \`ORDER BY\` goes **at the end** and sorts the whole result.`,
      },
      vs_join: {
        question: 'UNION or JOIN?',
        body: `They do different things:

- **JOIN** puts columns **side by side**: a row with data of the customer and of their account.
- **UNION / INTERSECT / EXCEPT** put rows **underneath**, or compare lists: same columns, rows from two places.

If your result has the columns of both tables, it is a JOIN. If they are the same columns coming from two queries, it is a set operation.`,
      },
    },
    quiz: {
      pre: {
        i3pre_union: {
          question: 'An account appears as origin and as destination. How many times does it come out with `… UNION …`?',
          options: ['Once', 'Twice', 'None', 'It depends on the order'],
          explanation: 'UNION removes the repeated rows.',
        },
        i3pre_union_all: {
          question: 'What is the difference between UNION and UNION ALL?',
          options: ['None', 'UNION ALL keeps the repeated rows', 'UNION ALL sorts the result', 'UNION ALL only works for numbers'],
          explanation: 'UNION ALL returns all the rows; UNION removes repeats.',
        },
        i3pre_intersect: {
          question: '`A INTERSECT B` returns…',
          options: ['What is in A or in B', 'What is in A and in B', 'What is in A and not in B', 'A and B side by side'],
          explanation: 'The intersection of the two lists.',
        },
        i3pre_except: {
          question: 'What does `SELECT id FROM clientes EXCEPT SELECT cliente_id FROM cuentas` return?',
          options: ['Customers with an account', 'Customers without any account', 'Accounts without a customer', 'An error'],
          explanation: 'The ones in the first list that are not in the second.',
        },
        i3pre_columns: {
          question: '`SELECT id, importe FROM transferencias UNION SELECT id FROM pagos_tarjeta`:',
          options: ['It works', 'Error: different number of columns', 'It fills in with NULL', 'It only combines the id'],
          explanation: 'Both queries have to return the same number of columns.',
        },
        i3pre_vs: {
          question: 'You want one row per customer with their name and the IBAN of their account. What do you use?',
          options: ['UNION', 'JOIN', 'INTERSECT', 'EXCEPT'],
          explanation: 'Columns from two tables in the same row: JOIN.',
        },
      },
      post: {
        i3post_union: {
          question: 'When do you use plain UNION?',
          options: ['To add up movements', 'For a list of distinct values coming from two queries', 'To join tables by a key', 'Never'],
          explanation: 'For example, the accounts that have sent or received.',
        },
        i3post_union_all: {
          question: "You put together January's payments and transfers (only the amount) with UNION and add them up. There are two of €17.55. What happens?",
          options: ['It adds up correctly', 'One of the €17.55 is missing', 'It counts €17.55 three times', 'Error'],
          explanation: 'UNION leaves a single row with 17.55. To add up, UNION ALL.',
        },
        i3post_intersect: {
          question: 'Customers with rejected payments and also with tickets. With INTERSECT, which columns do both queries have to return?',
          options: ['Any', 'The same ones, in the same order (here, cliente_id)', 'All the columns of clientes', 'None'],
          explanation: 'It compares row by row, by position.',
        },
        i3post_except: {
          question: 'Is `A EXCEPT B` the same as `B EXCEPT A`?',
          options: ['Yes', 'No: each one gives what is left over from the first list', 'Only if they have the same rows', 'Only with numbers'],
          explanation: 'EXCEPT is not symmetric.',
        },
        i3post_columns: {
          question: '`SELECT id, importe FROM transferencias UNION SELECT importe, id FROM pagos_tarjeta`:',
          options: ['It gives an error', 'It works and mixes amounts with ids without warning', 'It pairs by name and comes out fine', 'It sorts by id'],
          explanation: 'Both are numbers: they are combined by position without an error.',
        },
        i3post_order: {
          question: 'In `… UNION ALL …`, where does the ORDER BY go?',
          options: ['In each query', 'At the end, and it sorts the whole result', "You can't sort", 'Before the UNION'],
          explanation: 'A single ORDER BY at the end.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'One list with two queries',
        body: 'Good morning.\n\nSometimes the answer does not come from one query, but from **putting two together**: the ones in one list **or** in another (`UNION`), in both (`INTERSECT`) or in one and not in the other (`EXCEPT`). Both queries have to return the same columns, in the same order.\n\nTo start:\n\n- The list of **accounts that have taken part in some transfer**, as origin or as destination, without repeats: one column `cuenta_id`.\n\nInés',
      },
      ines_ok: {
        body: "Fifty-three accounts. Did you see 999 in the list? That account doesn't exist in `cuentas`. Keep it in mind, someone is going to ask about it.",
      },
      marta_enero: {
        body: "Hi! For the January report I want **all the movements of January 2026** in a single list: the **completed** transfers and the **accepted** card payments. Columns: `tipo` ('transferencia' or 'tarjeta'), `id`, `importe` and `fecha`.",
      },
      marta_thanks: { body: 'Thirty-seven movements, each with its type. Perfect for the report!' },
      carmen_cruce: {
        body: "Hi. I want the customers who have had **some rejected card payment** and who have **also** opened a ticket for **'Tarjeta bloqueada'** (blocked card): the ones in both lists. Only `cliente_id`.",
      },
      carmen_thanks: { body: "Two customers. I'll review them by hand: blocking their card may have been our mistake. Thanks." },
      ines_union_all: {
        subject: '11:00 · Inés: "She\'s €17.55 short"',
        body: '**Inés:** Marta added up the January amount like this:\n\n`SELECT SUM(importe) FROM (SELECT importe FROM pagos_tarjeta WHERE … UNION SELECT importe FROM transferencias WHERE …) m;`\n\nShe gets 36 movements and €24,098.08. Your list has 37 and adds up to €24,115.63. Exactly one movement of €17.55 is missing. Where is it?',
        choices: {
          union_all: {
            text: '`UNION` **removes the repeated rows**: there were two movements of €17.55 and, since only the amount was selected, they ended up as a single row. To put movements together you use `UNION ALL`, which keeps them all (and is also faster). Plain `UNION` only when you want a list without repeats.',
            reply: 'Exactly. UNION is "list of distinct values"; UNION ALL is "all the rows". To add up, almost always UNION ALL.',
            effects: { 2: { text: 'To add up or count movements, UNION ALL: UNION removes the repeated rows.' } },
          },
          rounding: {
            text: "It must be a rounding problem with the decimals.",
            reply: "It's a whole movement that is missing, not a few cents. Count the rows of both versions.",
            effects: { 0: { text: 'You looked for a rounding issue where a row was missing.' } },
          },
          data: {
            text: 'That there is a duplicate payment in the database and UNION fixed it.',
            reply: "They are two different payments that are worth the same, on different days. UNION can't tell them apart because it only sees the amount.",
            effects: { 0: { text: 'You accepted a total that was missing a movement.' } },
          },
        },
      },
      nuria_sin_pagos: {
        body: 'Hi. We are going to send a card payment tutorial to the customers who **have never paid by card**: all the customers **except** the ones who have some payment. I need `id` and `nombre`.',
      },
      nuria_thanks: { body: 'Eight customers for the tutorial. Thanks!' },
      diego_huerfanas: {
        body: "Hey. Before migrating the transfers I want to know which **destination accounts** appear in `transferencias` but **don't exist** in `cuentas` (not counting the empty ones, which belong to other banks). One column with the id.",
      },
      diego_thanks: { body: "Only 999. The migration would have failed right on that one. I'm noting it down to fix it first. Thanks!" },
      laura_comercios: {
        body: 'Hi. For the regression tests I want merchants with data from both years: the ones with **accepted payments in 2025** and **also in 2026**. Only `comercio_id`.',
      },
      laura_thanks: { body: 'Twenty merchants with history in both years. That way I can compare before and after. Thanks!' },
      ines_columnas: {
        subject: '15:00 · Inés: "An id with decimals"',
        body: '**Inés:** Diego put transfers and payments together like this:\n\n`SELECT id, importe FROM transferencias UNION SELECT importe, id FROM pagos_tarjeta;`\n\nIt gives no error, but in the result there are rows with `id` 35.78 and `importe` 25, and 426 rows come out when there are 120 transfers and 306 payments. What happened?',
        choices: {
          columns: {
            text: 'UNION combines the columns **by position**, not by name: the first with the first and the second with the second. Diego put the amount where the id went. Both queries have to have the same columns, **in the same order** and of compatible types; the names come from the first query.',
            reply: "That's it. And since id and importe are both numbers, PostgreSQL doesn't complain: the mistake goes by silently. Always check the order of the columns.",
            effects: { 3: { text: 'UNION combines by position: same columns, same order.' } },
          },
          names: {
            text: 'That UNION pairs columns by name and got confused with the aliases.',
            reply: "The other way round: UNION doesn't look at the names, only at the position. That's why there was no error.",
            effects: { 0: { text: 'You thought UNION pairs by name.' } },
          },
          text: {
            text: 'That he should turn everything into text so it does not get mixed up.',
            reply: 'It would still put the amount in the id column, just as text. The problem is the order.',
            effects: { 0: { text: "Turning into text doesn't fix columns in the wrong place." } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you put together results from several queries. What are you taking away?',
        choices: {
          lesson: {
            text: 'That `UNION` combines without repeats and `UNION ALL` with all the rows; that `INTERSECT` gives what is in both and `EXCEPT` what is in the first and not in the second; and that columns are paired by position, so they have to match in number, order and type.',
            reply: 'Very good. Tomorrow we close the week with reports that fit in a single query.',
          },
          excel: {
            text: "That it's easier to get two lists and cross them in a spreadsheet.",
            reply: 'Until one of them has 300,000 rows. Check the debrief.',
            effects: { 0: { text: 'You came away with crossing lists by hand outside the database.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn(ROLES_EN),
)
