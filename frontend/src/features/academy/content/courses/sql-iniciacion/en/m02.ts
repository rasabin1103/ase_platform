import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m02Ordenar } from '../m02-ordenar'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 2 — Sorting and searching. English version of ../m02-ordenar.ts. */
export const m02OrdenarEn = missionEn(
  m02Ordenar,
  {
    title: 'Sorting and searching',
    subtitle: 'ORDER BY, LIKE and ILIKE, and DISTINCT to remove duplicates.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Wednesday · week 1',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Everything in its place',
        body: 'Carmen reviews the transfers that matter, Nuria found the customer, Laura has her emails and Marta her lists. And along the way you uncovered a negative balance and a duplicate email.',
      },
      ok: { title: 'You sort, but not everything', body: 'You already use ORDER BY and LIKE, although a task or a trap slipped past you. Check the debrief.' },
      bad: { title: 'Messy lists', body: 'Several tasks were left undone or in the wrong order. Replay the mission: ORDER BY, DESC, LIKE with % and DISTINCT.' },
    },
    briefing: {
      title: 'Week 1 · Sorting and searching',
      paragraphs: [
        "Third day at Kobalto. The team no longer wants just rows: they want them in order (“the top 10”, “from A to Z”) and they want to search for text they don't remember in full.",
        'When a task asks for an order, the order counts: the same rows unsorted do not meet it.',
      ],
      goals: [
        'Sort with ORDER BY, ascending and descending.',
        'Get “the first N” with ORDER BY and LIMIT.',
        'Sort by several columns.',
        'Search text with LIKE and ILIKE.',
        'Remove duplicates with DISTINCT.',
      ],
    },
    docs: {
      chuleta_orden: {
        title: 'Cheat sheet: sorting and searching',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Order of the parts
\`SELECT … FROM … WHERE … ORDER BY … LIMIT …;\`

## Sorting
- \`ORDER BY saldo\` → from lowest to highest (ASC, the default).
- \`ORDER BY saldo DESC\` → from highest to lowest.
- \`ORDER BY ciudad, fecha_alta DESC\` → by city and, on a tie, by date descending.
- Without ORDER BY there is no guaranteed order.

## Searching text
- \`LIKE 'Ana%'\` starts with · \`'%ez'\` ends with · \`'%serra%'\` contains. \`_\` = one character.
- \`ILIKE\`: the same, ignoring capitals.

## No duplicates
- \`SELECT DISTINCT ciudad FROM clientes;\` (DISTINCT looks at the whole row).`,
      },
    },
    sqlLab: {
      starter: '-- Sort with ORDER BY (ASC or DESC)\nSELECT iban, saldo\nFROM cuentas\nORDER BY saldo;',
      retos: {
        saldos: {
          title: 'From lowest to highest balance',
          description: 'The `iban` and the `saldo` of all the accounts, **from lowest to highest balance**.',
          hint: '`ORDER BY saldo` at the end. Ascending is the default order.',
        },
        top10: {
          title: 'The 10 highest transfers',
          description: '`id`, `importe`, `estado` and `creada_en` of the **10 transfers with the highest amount**, from the highest to the lowest.',
          hint: 'Sort by amount from highest to lowest (`DESC`) and keep 10 rows (`LIMIT`).',
        },
        serrano: {
          title: 'Finding a Serrano',
          description: '`id`, `nombre`, `apellidos` and `email` of the customers with **Serrano** in their surnames, whether it is the first or the second.',
          hint: "LIKE with `%` on both sides means “contains”: `apellidos LIKE '%Serrano%'`. With ILIKE you can forget about capitals.",
        },
        ciudades: {
          title: 'Cities without repeats',
          description: 'The **cities** where there are customers, each **only once** and in **alphabetical order**. A single column.',
          hint: '`SELECT DISTINCT ciudad` removes the repeats; then, `ORDER BY ciudad`.',
        },
        dominio: {
          title: 'correo.es emails',
          description: 'The `id` and the `email` of the customers whose email **ends in `@correo.es`**.',
          hint: "`%` at the front means “anything before”: `email LIKE '%@correo.es'`.",
        },
        por_ciudad: {
          title: 'By city and by sign-up',
          description: '`nombre`, `apellidos`, `ciudad` and `fecha_alta` of all the customers, sorted by **city (A→Z)** and, within each city, **from the most recent sign-up to the oldest**.',
          hint: 'Two columns in the ORDER BY, separated by a comma. Each with its own order: `ORDER BY ciudad, fecha_alta DESC`.',
        },
      },
    },
    bugs: {
      'C-CARMEN': {
        title: 'Carmen reviews small transfers and misses the €12,000 ones',
        explanation: 'Without the top 10, the large-transactions control does not see the four highest.',
        technique: 'ORDER BY … DESC LIMIT 10.',
      },
      'C-NURIA': { title: 'Nuria cannot find the customer who is calling her', explanation: 'Without the search by surname, Nuria cannot identify him.', technique: "LIKE '%Serrano%' or ILIKE." },
      'C-CIUDADES': { title: "Marta's slide repeats cities", explanation: 'The list of cities arrived without removing repeats.', technique: 'SELECT DISTINCT … ORDER BY.' },
      'C-LAURA': { title: 'The email fix is tested without the affected customers', explanation: "Laura didn't receive the correo.es emails.", technique: "LIKE '%@correo.es'." },
      'C-ORDEN': {
        title: 'The offices report comes out unsorted',
        explanation: "Without the order by city and date, you can't see who is new in each city.",
        technique: 'ORDER BY with two columns.',
      },
      'C-LIKE': {
        title: 'A search “does not find” customers who do exist',
        explanation: 'LIKE without % looks for the exact text and is case-sensitive.',
        technique: '% wildcards and ILIKE.',
      },
      'C-DISTINCT': { title: 'A report says there are 40 cities', explanation: 'DISTINCT with more columns does not remove the repeated city.', technique: 'DISTINCT looks at the whole row.' },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with Wednesday's tasks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Carmen's control", explanation: 'The 10 highest transfers.' },
        1: { label: "Nuria's call", explanation: 'Serrano as first or second surname.' },
        2: { label: "Marta's slide", explanation: 'Cities without repeats.' },
        3: { label: "Laura's tests", explanation: 'correo.es emails.' },
        4: { label: 'Offices report', explanation: 'City and sign-up date.' },
        5: { label: 'Searches that find', explanation: '% and ILIKE.' },
        6: { label: 'DISTINCT used properly', explanation: 'Only the columns that must not repeat.' },
      },
    },
    concepts: {
      order_by: { title: 'ORDER BY', summary: 'Sorts the result; without it there is no guaranteed order.' },
      order_desc: { title: 'DESC and the first N', summary: 'DESC reverses the order; with LIMIT it gives “the N highest”.' },
      order_multi: { title: 'Sorting by several columns', summary: 'The second column breaks ties; each with its own ASC or DESC.' },
      like_patterns: { title: 'LIKE and wildcards', summary: '% is anything and _ one character; without % it is an exact comparison.' },
      ilike_case: { title: 'ILIKE and capitals', summary: 'LIKE is case-sensitive; ILIKE is not.' },
      distinct: { title: 'DISTINCT', summary: 'Removes repeated rows, comparing all the columns of the SELECT.' },
    },
    seniorTips: [
      'Read the sorting and searching cheat sheet in the wiki.',
      'Inés: SELECT iban, saldo FROM cuentas ORDER BY saldo.',
      'Carmen: SELECT id, importe, estado, creada_en FROM transferencias ORDER BY importe DESC LIMIT 10.',
      "Nuria: SELECT id, nombre, apellidos, email FROM clientes WHERE apellidos ILIKE '%serrano%'.",
      'Marta: SELECT DISTINCT ciudad FROM clientes ORDER BY ciudad.',
      "Laura: SELECT id, email FROM clientes WHERE email LIKE '%@correo.es'.",
      'Marta: … ORDER BY ciudad, fecha_alta DESC.',
      'With Inés: LIKE needs % and is case-sensitive; DISTINCT looks at the whole row.',
    ],
    lessons: {
      order: {
        question: 'How do I sort the result?',
        body: `With \`ORDER BY\` and the column, near the end of the query:

\`SELECT iban, saldo FROM cuentas ORDER BY saldo;\`

- By default it is **ascending**: lowest to highest, A to Z, oldest date to most recent.
- Without \`ORDER BY\`, PostgreSQL **does not guarantee any order**, even if it seems to.
- Order of the parts: \`SELECT\` → \`FROM\` → \`WHERE\` → \`ORDER BY\` → \`LIMIT\`.`,
      },
      desc: {
        question: 'And from highest to lowest? And “the first 10”?',
        body: `\`DESC\` reverses the order:

\`SELECT id, importe FROM transferencias ORDER BY importe DESC LIMIT 10;\`

With \`ORDER BY ... DESC LIMIT n\` you get “the n highest”. Without \`DESC\` you would get the n **lowest**, and without \`ORDER BY\` any n.`,
      },
      multi: {
        question: 'Can I sort by several columns?',
        body: `Yes, separated by commas. The second only decides when the first ties:

\`ORDER BY ciudad, fecha_alta DESC\`

First by city (A→Z) and, within each city, from the most recent sign-up to the oldest. Each column carries its own \`ASC\` or \`DESC\`: the \`DESC\` at the end does **not** apply to \`ciudad\`.`,
      },
      like: {
        question: 'How do I search for a piece of text?',
        body: `With \`LIKE\` and wildcards:

- \`%\` = anything (including nothing). \`_\` = exactly one character.
- \`'Serrano%'\` starts with Serrano · \`'%Serrano'\` ends with · \`'%Serrano%'\` contains.
- \`'%@correo.es'\` = emails from that domain.

Without \`%\`, \`LIKE 'Serrano'\` is the same as \`= 'Serrano'\`: only the exact text.`,
      },
      ilike: {
        question: "And if I don't know how the capitals are written?",
        body: `\`LIKE\` is case-sensitive: \`'%serrano%'\` does not find “Serrano”.

In PostgreSQL you have \`ILIKE\`, which is not:

\`WHERE apellidos ILIKE '%serrano%'\`

In other databases it is done with \`LOWER(apellidos) LIKE '%serrano%'\`. Accents do count: “Martin” does not find “Martín”.`,
      },
      distinct: {
        question: 'How do I remove the repeats?',
        body: `\`SELECT DISTINCT ciudad FROM clientes;\`

\`DISTINCT\` removes repeated **rows**, looking at **all** the columns of the \`SELECT\`. \`SELECT DISTINCT ciudad, nombre\` only removes repeated city-name pairs, so the city will still appear many times.

Combine it with \`ORDER BY\` to get a clean, sorted list.`,
      },
    },
    quiz: {
      pre: {
        s2pre_order: {
          question: 'In what order do the rows of `SELECT * FROM cuentas` come out without ORDER BY?',
          options: ['By id', 'By creation date', 'In no guaranteed order', 'Alphabetical'],
          explanation: 'Without ORDER BY there is no guaranteed order, even if it sometimes looks like there is.',
        },
        s2pre_desc: {
          question: 'How do you get the 3 transfers with the highest amount?',
          options: ['ORDER BY importe LIMIT 3', 'ORDER BY importe DESC LIMIT 3', 'LIMIT 3 ORDER BY importe DESC', 'WHERE importe = MAX LIMIT 3'],
          explanation: 'DESC for “from highest to lowest” and LIMIT at the end.',
        },
        s2pre_multi: {
          question: 'In `ORDER BY ciudad, fecha_alta DESC`, how is the city sorted?',
          options: ['Descending', 'Ascending (A→Z)', 'It is not sorted', 'It depends on the date'],
          explanation: 'Each column has its own order; without DESC it is ascending.',
        },
        s2pre_like: {
          question: "What does `email LIKE '%@correo.es'` find?",
          options: ['Emails that start with @correo.es', 'Emails that end in @correo.es', "The exact email '%@correo.es'", 'All the emails'],
          explanation: '% at the front means “anything before”: it ends in @correo.es.',
        },
        s2pre_ilike: {
          question: "Does `apellidos LIKE '%serrano%'` find “Iván Serrano Molina”?",
          options: ['Yes', 'No: LIKE is case-sensitive', 'Only if it is the first surname', 'It gives an error'],
          explanation: 'LIKE is case-sensitive; ILIKE is not.',
        },
        s2pre_distinct: {
          question: 'What does `SELECT DISTINCT ciudad FROM clientes` do?',
          options: ['Counts the cities', 'Returns each city only once', 'Sorts the cities', 'Returns the first city'],
          explanation: 'DISTINCT removes repeated rows.',
        },
      },
      post: {
        s2post_order: {
          question: 'Where does the ORDER BY go?',
          options: ['Before the WHERE', 'After the WHERE and before the LIMIT', 'After the LIMIT', 'Inside the SELECT'],
          explanation: 'SELECT → FROM → WHERE → ORDER BY → LIMIT.',
        },
        s2post_desc: {
          question: '`ORDER BY importe LIMIT 10` returns…',
          options: ['The 10 with the highest amount', 'The 10 with the lowest amount', 'Any 10', 'The 10 most recent'],
          explanation: 'Without DESC the order is ascending: the smallest ones come out.',
        },
        s2post_extremes: {
          question: 'Why does sorting help to find odd data?',
          options: ['Because it corrects the data', 'Because extreme values (negative, huge, empty) come out first or last', 'Because it deletes duplicates', "It doesn't help"],
          explanation: 'A negative balance or a huge amount shows up at the very top or bottom.',
        },
        s2post_like: {
          question: "`apellidos LIKE 'Serrano%'` does not find “Lucía Iglesias Serrano”. Why?",
          options: ['Because of the accent', "Because 'Serrano%' looks for surnames that START with Serrano", "Because LIKE doesn't work with surnames", 'Because DISTINCT is missing'],
          explanation: "For “contains” you need % on both sides: '%Serrano%'.",
        },
        s2post_ilike: {
          question: 'What is the difference between LIKE and ILIKE in PostgreSQL?',
          options: ['ILIKE is faster', 'ILIKE ignores the difference between upper and lower case', "ILIKE doesn't accept %", 'None'],
          explanation: 'ILIKE = LIKE ignoring case.',
        },
        s2post_distinct: {
          question: '`SELECT DISTINCT ciudad, nombre FROM clientes` returns 40 rows. Why?',
          options: ['DISTINCT is broken', 'DISTINCT looks at the whole row: each city-name pair is different', 'ORDER BY is missing', 'There are 40 cities'],
          explanation: 'DISTINCT compares all the columns of the SELECT.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Today: sorting and searching',
        body: "Hi!\n\nUntil now the rows came out in any order. Today you learn to **sort them** with `ORDER BY` and to **search for similar text** with `LIKE`.\n\nTo start:\n\n- Get the `iban` and the `saldo` of all the accounts, **from lowest to highest balance**. Look closely at the first rows.\n\nInés",
      },
      ines_ok: {
        body: "Did you see the first one? An account with a **negative balance**, -€245.30. Kobalto accounts shouldn't be able to go negative. Sorting is the fastest way to see the extremes: odd values show up at the very top or bottom. I'll pass it on to Carmen.",
      },
      carmen_top: {
        body: 'Hello. For the large-transactions control I need the **10 transfers with the highest amount**, from the highest to the lowest: `id`, `importe`, `estado` and `creada_en`.',
      },
      carmen_thanks: {
        body: 'Four above €12,000 and then a huge jump down to those under €900. I will review those four one by one. Thanks.',
      },
      nuria_serrano: {
        body: "I have a customer on the phone who doesn't remember his email. He only says his surname is **Serrano**, but I don't know whether it is his first or second surname. Can you get me `id`, `nombre`, `apellidos` and `email` of all the customers with Serrano in their surnames?",
      },
      nuria_thanks: { body: "Four. With the first name I know which one it is. You saved my call!" },
      ines_like: {
        subject: '11:00 · Inés: “LIKE finds nothing”',
        body: "**Inés:** Before asking you, Nuria had tried this:\n\n`SELECT * FROM clientes WHERE apellidos LIKE 'serrano';`\n\nZero rows, and she almost told the customer he wasn't in our database. Why does it find nothing?",
        choices: {
          like: {
            text: "For two reasons. Without `%`, LIKE looks for the exact text: it would only find someone whose surnames were just “serrano”. And LIKE is case-sensitive. You have to use `LIKE '%Serrano%'` or, without worrying about capitals, `ILIKE '%serrano%'`.",
            reply: 'Exactly. `%` is “anything”, and `ILIKE` is LIKE without capitals. And once more: zero rows does not mean it does not exist.',
            effects: { 3: { text: 'LIKE needs % for “contains” and is case-sensitive; ILIKE is not.' } },
          },
          equals: {
            text: 'She should use `=` instead of LIKE.',
            reply: '`=` also looks for the exact text: “Serrano Molina” is not equal to “serrano”. For “contains” you need LIKE with `%`.',
            effects: { 0: { text: '= is no use for searching a piece of text.' } },
          },
          missing: {
            text: "If it doesn't come out, the customer isn't registered.",
            reply: 'There are four customers with Serrano in their surnames. The problem is the pattern.',
            effects: { 0: { text: 'You accepted zero rows without checking the pattern.' } },
          },
        },
      },
      marta_ciudades: {
        body: 'Hi. For a slide I need the **list of cities** where we have customers, **without repeats** and in alphabetical order. Just the `ciudad` column.',
      },
      marta_ciudades_thanks: { body: 'Seven cities. The slide looks spotless. Thanks!' },
      laura_dominio: {
        body: "Hi, I'm Laura, QA Lead. There's an incident: Kobalto's emails aren't reaching **correo.es** addresses. To test the fix I need the `id` and the `email` of all the customers whose email is from that domain, that is, that **end in `@correo.es`**.",
      },
      laura_thanks: {
        body: "Eleven addresses… and one repeated: 12 and 27 have the same email. That shouldn't happen; I'll log it as a separate bug. Good job!",
      },
      marta_orden: {
        body: 'One last favor: for the offices meeting I want the customers **sorted by city** (A to Z) and, **within each city, from the most recent sign-up to the oldest**. Columns: `nombre`, `apellidos`, `ciudad` and `fecha_alta`.',
      },
      marta_orden_thanks: { body: 'This way you can see at a glance who is new in each city. Perfect!' },
      ines_distinct: {
        subject: '15:00 · Inés: “40 cities?”',
        body: "**Inés:** Diego wanted the cities without repeats, but also to see some sample names, and wrote this:\n\n`SELECT DISTINCT ciudad, nombre FROM clientes;`\n\nHe gets 40 rows and the city repeated loads of times. Doesn't DISTINCT remove the repeats?",
        choices: {
          distinct: {
            text: "DISTINCT removes whole repeated rows, not one column. “Madrid, Ana” and “Madrid, Pablo” are different rows. To get the cities without repeats, `SELECT DISTINCT ciudad` with no other columns.",
            reply: "That's it. DISTINCT looks at the complete row. If you add columns, you change what counts as repeated.",
            effects: { 2: { text: 'DISTINCT applies to the whole row, not to the first column.' } },
          },
          order: {
            text: 'It needs an ORDER BY ciudad so they get grouped.',
            reply: 'Sorting would put them together, but 40 rows would still come out. The problem is what DISTINCT compares.',
            effects: { 0: { text: 'Sorting does not remove repeats.' } },
          },
          bug: {
            text: "DISTINCT doesn't work well with text.",
            reply: 'It works perfectly; what happens is that it compares the whole row.',
            effects: { 0: { text: 'You blamed DISTINCT for what the query was asking.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you found a negative balance and a duplicate email just by sorting and searching. What are you taking away?',
        choices: {
          lesson: {
            text: 'That ORDER BY sets the order (and without it none is guaranteed), that DESC reverses it, that I can sort by several columns, that LIKE needs % and is case-sensitive, and that DISTINCT looks at the whole row. And that sorting helps to see odd data.',
            reply: "Perfect. Tomorrow: the gaps, that is, NULL values. They'll give you more than one surprise.",
          },
          excel: {
            text: "That for sorting it's easier to copy it into a spreadsheet.",
            reply: 'And every time the data changes, copy it again. Check the debrief.',
            effects: { 0: { text: 'You came away with sorting outside the database.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support', laura: 'QA Lead' }),
)
