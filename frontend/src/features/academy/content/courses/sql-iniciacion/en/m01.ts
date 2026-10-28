import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m01Filtrar } from '../m01-filtrar'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 1 — Only what matters. English version of ../m01-filtrar.ts. */
export const m01FiltrarEn = missionEn(
  m01Filtrar,
  {
    title: 'Only what matters',
    subtitle: 'WHERE: comparisons, text, AND/OR, IN and date ranges.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Tuesday · week 1',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Everyone with their own rows',
        body: 'Marta has her campaigns well targeted, Carmen her complete audit, Nuria her invitations and Diego now knows why Sunday was missing.',
      },
      ok: { title: 'You filter, but something slipped through', body: 'You already use WHERE, although a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'Too many rows (or none)', body: 'Several tasks were left undone or with the wrong filter. Replay the mission with the WHERE cheat sheet at hand.' },
    },
    briefing: {
      title: 'Week 1 · Only what matters',
      paragraphs: [
        'Second day at Kobalto. You already know how to get columns; today the team wants specific rows: those of one city, those above an amount, those of one week.',
        'Each task is done when your query returns exactly the rows requested: not one more, not one less.',
      ],
      goals: [
        'Filter with WHERE and the comparison operators.',
        'Write text correctly: single quotes and exact capitalization.',
        'Combine conditions with AND, OR and IN.',
        'Filter a date range without losing the last day.',
        'Always check that the number of rows makes sense.',
      ],
    },
    docs: {
      chuleta_where: {
        title: 'Cheat sheet: filtering with WHERE',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Shape
\`SELECT columns FROM table WHERE condition;\`

## Comparing
- \`=\` · \`<>\` · \`>\` · \`<\` · \`>=\` · \`<=\`
- Numbers without quotes: \`saldo > 10000\`.
- Text and dates in single quotes: \`ciudad = 'Madrid'\`, \`fecha_alta >= '2025-01-01'\`.

## Combining
- \`AND\`: both. \`OR\`: either. \`NOT\`: the opposite.
- \`IN ('a', 'b')\`: any of the list.
- \`BETWEEN x AND y\`: between the two, both included.
- AND goes before OR: when mixing them, use **parentheses**.

## Values in Kobalto
- \`clientes.segmento\`: estandar, premium, joven.
- \`cuentas.estado\`: activa, bloqueada, cerrada. \`cuentas.tipo\`: corriente, ahorro.
- \`transferencias.estado\`: completada, pendiente, rechazada.`,
      },
    },
    sqlLab: {
      starter: "-- Filter rows with WHERE\nSELECT *\nFROM clientes\nWHERE ciudad = 'Madrid';",
      retos: {
        madrid: {
          title: 'The customers in Madrid',
          description: 'All the columns of the customers whose `ciudad` is **Madrid**.',
          hint: "After the `FROM`, `WHERE ciudad = 'Madrid'`. The text goes in single quotes and with a capital “M”.",
        },
        saldo_alto: {
          title: 'Accounts with a lot of balance',
          description: 'The `iban`, the `tipo` and the `saldo` of the accounts with a balance **greater than €10,000**.',
          hint: 'Numbers go without quotes and without a thousands separator: `saldo > 10000`.',
        },
        no_activas: {
          title: 'Accounts that are not active',
          description: 'The `id`, the `iban` and the `estado` of all the accounts whose status is **not** “activa”.',
          hint: 'More than one status is not “activa”. Instead of naming them all, use “different from”: `<>`.',
        },
        sur: {
          title: 'Customers from Seville or Málaga',
          description: 'The `nombre`, the `apellidos` and the `ciudad` of the customers from **Sevilla or Málaga**.',
          hint: "`ciudad IN ('Sevilla', 'Málaga')`, or two complete conditions joined with `OR`. Mind the accent on Málaga.",
        },
        jovenes_madrid: {
          title: 'Young people in Madrid',
          description: 'The `nombre` and the `email` of the customers in the **joven** segment who live in **Madrid**.',
          hint: 'Both conditions must hold at the same time: `AND`. The segment values are lowercase and without accents.',
        },
        semana: {
          title: 'A week of transfers',
          description: '`id`, `importe`, `estado` and `creada_en` of the transfers from **Monday 19 to Sunday 25 January 2026**, both days included.',
          hint: "`creada_en` has a time: `'2026-01-25'` is that day at 00:00. Ask from the 19th (included) up to the 26th (excluded): `>=` and `<`.",
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'The savings campaign goes out without a list of accounts', explanation: "Marta's task was left undone.", technique: 'Comparing numbers with > in the WHERE.' },
      'C-CARMEN': { title: 'The audit is missing the blocked and closed accounts', explanation: "Carmen didn't receive the accounts that are not active.", technique: 'Different from: <>.' },
      'C-NURIA': { title: 'Nobody invites the customers from Seville and Málaga to the event', explanation: 'Nuria was left without the Andalusia list.', technique: 'IN or complete conditions with OR.' },
      'C-CAMPANA': {
        title: 'The youth card is offered to customers who are not young',
        explanation: 'Without the filtered list, Marta writes to every customer in Madrid.',
        technique: 'Two conditions with AND.',
      },
      'C-SEMANA': {
        title: "Diego's weekly report loses Sunday's transfers",
        explanation: 'BETWEEN with dates without a time cuts the last day at 00:00.',
        technique: 'Range >= start AND < next day.',
      },
      'C-COMILLAS': {
        title: 'Nuria says in a meeting that there are no customers in Madrid',
        explanation: "With 'madrid' in lowercase you get zero rows, and zero rows look like an answer.",
        technique: 'Single quotes, exact text and checking surprising results.',
      },
      'C-PRECEDENCIA': {
        title: 'A list of young customers includes every customer in Madrid',
        explanation: 'Mixing AND and OR without parentheses changes what the query asks for.',
        technique: 'Parentheses or IN when combining AND and OR.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with Tuesday's tasks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Savings campaign', explanation: 'Accounts with more than €10,000.' },
        1: { label: "Carmen's audit", explanation: 'All the accounts that are not active.' },
        2: { label: 'Event in Andalusia', explanation: 'Customers from Seville or Málaga.' },
        3: { label: 'Youth card', explanation: 'Young and in Madrid, at the same time.' },
        4: { label: "Diego's report", explanation: 'The whole week, Sunday included.' },
        5: { label: 'Zero rows checked', explanation: 'Single quotes and exact capitalization.' },
        6: { label: 'AND and OR properly grouped', explanation: 'Parentheses when mixing them.' },
      },
    },
    concepts: {
      where_basic: { title: 'WHERE', summary: 'Filters the rows: only those that meet the condition come out.' },
      comparison_ops: { title: 'Comparison operators', summary: '=, <>, >, <, >= and <=; numbers without quotes.' },
      text_quotes: { title: 'Text in single quotes', summary: 'Single quotes for text and dates; the comparison is exact, capitals included.' },
      and_or: { title: 'AND, OR and NOT', summary: 'AND requires both conditions; with OR one is enough.' },
      in_list: { title: 'IN', summary: 'Any of a list of values: shorter and safer than several ORs.' },
      between_dates: { title: 'BETWEEN and date ranges', summary: 'BETWEEN includes the ends; with date and time, better >= start and < next day.' },
      precedence: { title: 'AND before OR', summary: 'When mixing AND and OR, parentheses to say exactly what you mean.' },
    },
    seniorTips: [
      'Read the WHERE cheat sheet in the wiki.',
      "Inés: SELECT * FROM clientes WHERE ciudad = 'Madrid'.",
      'Marta: SELECT iban, tipo, saldo FROM cuentas WHERE saldo > 10000.',
      "Carmen: SELECT id, iban, estado FROM cuentas WHERE estado <> 'activa'.",
      "Nuria: SELECT nombre, apellidos, ciudad FROM clientes WHERE ciudad IN ('Sevilla', 'Málaga').",
      "Marta: SELECT nombre, email FROM clientes WHERE ciudad = 'Madrid' AND segmento = 'joven'.",
      "Diego: … WHERE creada_en >= '2026-01-19' AND creada_en < '2026-01-26'.",
      'With Inés: single quotes and exact capitalization; AND goes before OR.',
    ],
    lessons: {
      where: {
        question: 'How do I keep only some of the rows?',
        body: `With \`WHERE\` and a condition, after the \`FROM\`:

\`SELECT nombre, ciudad FROM clientes WHERE ciudad = 'Madrid';\`

Only the rows where the condition is true come out. The order of the parts is always the same: \`SELECT\` → \`FROM\` → \`WHERE\` (and \`LIMIT\` at the end).`,
      },
      operators: {
        question: 'What comparisons can I make?',
        body: `- \`=\` equal
- \`<>\` (or \`!=\`) different
- \`>\` greater · \`<\` less
- \`>=\` greater or equal · \`<=\` less or equal

Numbers go without quotes and with a decimal point: \`saldo > 10000\`, \`importe <= 99.90\`. Never \`10.000\` with a thousands dot.`,
      },
      quotes: {
        question: 'Why does my text “not exist” or find nothing?',
        body: `- **Text** and **dates** go in **single quotes**: \`ciudad = 'Madrid'\`, \`fecha_alta >= '2025-01-01'\`.
- Without quotes, PostgreSQL thinks \`madrid\` is a **column**. With **double** quotes too: double quotes are for column names.
- \`=\` compares the **exact** text: \`'madrid'\` is not \`'Madrid'\`, and an extra space does not match either.

Zero rows is not an error: it is a result. If it surprises you, check the condition.`,
      },
      and_or: {
        question: 'How do I combine several conditions?',
        body: `- \`AND\`: **both** must hold. \`ciudad = 'Madrid' AND segmento = 'joven'\`.
- \`OR\`: **one** is enough. \`ciudad = 'Sevilla' OR ciudad = 'Málaga'\`.
- \`NOT\` negates a condition.

**Careful:** \`AND\` is evaluated before \`OR\`. If you mix the two, use parentheses:

\`WHERE (ciudad = 'Madrid' OR ciudad = 'Barcelona') AND segmento = 'joven'\``,
      },
      in: {
        question: 'Is there anything shorter than many ORs?',
        body: `\`IN\` with a list of values:

\`WHERE ciudad IN ('Sevilla', 'Málaga', 'Bilbao')\`

It is the same as three \`OR\`s, but shorter and without parenthesis problems. \`NOT IN\` does the opposite.

A typical mistake: \`WHERE ciudad = 'Sevilla' OR 'Málaga'\`. Each part of the \`OR\` must be a complete condition.`,
      },
      between: {
        question: 'How do I filter a date range?',
        body: `\`BETWEEN a AND b\` includes both ends: \`saldo BETWEEN 1000 AND 5000\`.

With **dates with a time** (\`timestamp\`, like \`creada_en\`) there is a trap: \`'2026-01-25'\` means the 25th **at 00:00**. So

\`creada_en BETWEEN '2026-01-19' AND '2026-01-25'\`

leaves out everything that happened on the 25th. The safe way is to use the **next** day without including it:

\`creada_en >= '2026-01-19' AND creada_en < '2026-01-26'\``,
      },
    },
    quiz: {
      pre: {
        s1pre_where: {
          question: 'Where does the WHERE go in a query?',
          options: ['Before the SELECT', 'Between SELECT and FROM', 'After the FROM', 'At the end, after the LIMIT'],
          explanation: 'SELECT → FROM → WHERE → LIMIT.',
        },
        s1pre_ops: {
          question: 'How do you ask for the accounts whose status is NOT “activa”?',
          options: ["WHERE estado = NOT 'activa'", "WHERE estado <> 'activa'", 'WHERE estado != activa', 'WHERE NOT estado'],
          explanation: '<> (or !=) means different, and the text goes in single quotes.',
        },
        s1pre_quotes: {
          question: 'Which one is correct in PostgreSQL?',
          options: ['WHERE ciudad = Madrid', 'WHERE ciudad = "Madrid"', "WHERE ciudad = 'Madrid'", 'WHERE ciudad = (Madrid)'],
          explanation: 'Text goes in single quotes; double quotes are for column names.',
        },
        s1pre_and: {
          question: "What does `WHERE ciudad = 'Madrid' AND ciudad = 'Sevilla'` return?",
          options: ['The customers in Madrid and those in Sevilla', 'No rows: a city cannot be both at once', 'An error', 'Only those in Madrid'],
          explanation: 'AND requires both conditions to hold in the same row. For “one or the other” you use OR or IN.',
        },
        s1pre_in: {
          question: "What is equivalent to `ciudad IN ('Sevilla', 'Málaga')`?",
          options: ["ciudad = 'Sevilla' AND ciudad = 'Málaga'", "ciudad = 'Sevilla' OR 'Málaga'", "ciudad = 'Sevilla' OR ciudad = 'Málaga'", "ciudad LIKE 'Sevilla, Málaga'"],
          explanation: 'IN is a short form of several ORs with complete conditions.',
        },
        s1pre_between: {
          question: 'Does BETWEEN 10 AND 20 include the values 10 and 20?',
          options: ['Yes, both', 'Only 10', 'Only 20', 'Neither'],
          explanation: 'BETWEEN includes both ends.',
        },
      },
      post: {
        s1post_where: {
          question: 'What does WHERE do?',
          options: ['Chooses columns', 'Chooses which rows appear in the result', 'Sorts the rows', 'Changes the data in the table'],
          explanation: 'WHERE filters rows; columns are chosen in the SELECT.',
        },
        s1post_ops: {
          question: 'How do you write “balance greater than ten thousand”?',
          options: ['saldo > 10.000', "saldo > '10.000 €'", 'saldo > 10000', 'saldo >> 10000'],
          explanation: 'Numbers go without quotes or thousands separator.',
        },
        s1post_quotes: {
          question: "`WHERE ciudad = 'madrid'` returns 0 rows, but there are customers in Madrid. Why?",
          options: ['The table is empty', 'The comparison is case-sensitive: “madrid” is not “Madrid”', 'Double quotes are missing', "WHERE doesn't work with text"],
          explanation: '= compares the exact text, capitals included.',
        },
        s1post_precedence: {
          question: "`WHERE ciudad = 'Madrid' OR ciudad = 'Bilbao' AND segmento = 'premium'` returns…",
          options: ['The premium customers of Madrid and Bilbao', 'All those in Madrid and the premium ones in Bilbao', 'Only the premium ones in Bilbao', 'An error'],
          explanation: "AND goes before OR. For the premium customers of both cities: (… OR …) AND segmento = 'premium'.",
        },
        s1post_between: {
          question: '`creada_en` is a date with a time. Which condition includes the whole of 25 January?',
          options: ["creada_en BETWEEN '2026-01-19' AND '2026-01-25'", "creada_en <= '2026-01-25'", "creada_en >= '2026-01-19' AND creada_en < '2026-01-26'", "creada_en = '2026-01-25'"],
          explanation: "'2026-01-25' is that day at 00:00. Up to the next day without including it, and the whole 25th is in.",
        },
        s1post_in: {
          question: "What does `WHERE estado NOT IN ('activa')` return?",
          options: ['The active accounts', 'The accounts that are not active', 'An error: NOT IN needs two values', 'Nothing'],
          explanation: 'NOT IN leaves out the values in the list; with just one it is equivalent to <>.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Today: keeping only the rows that matter',
        body: "Good morning!\n\nYesterday you got columns. Today it's time to **filter rows**: almost nobody wants the whole table, they want “the customers in Madrid” or “the accounts with more than €10,000”. That's what `WHERE` is for.\n\nTo warm up:\n\n- Get all the data of the **customers in Madrid**.\n\nIn the wiki I've left you a `WHERE` cheat sheet. Today you'll be busy: Marta, Carmen (Risk), Nuria and Diego have all asked me about you.\n\nInés",
      },
      ines_ok: {
        body: 'Twelve customers in Madrid. See? `WHERE` lets through only the rows that meet the condition. And notice the single quotes around “Madrid”: text always goes like that.',
      },
      marta_saldo: {
        body: "Hi again! We're preparing a savings campaign for customers with a lot of balance. Can you get me the `iban`, the `tipo` and the `saldo` of the accounts with **more than €10,000**?",
      },
      marta_saldo_thanks: { body: 'Eleven accounts, all savings. Just what I expected. Thanks!' },
      carmen_estado: {
        body: "Hi, I'm Carmen, from Risk and Compliance. For the quarterly audit I need the `id`, the `iban` and the `estado` of all the accounts that are **not active**, whatever the reason.",
      },
      carmen_thanks: {
        body: "Two blocked and one closed. I'm glad you didn't filter only by “bloqueada”: the closed one had to come out too. Thanks.",
      },
      ines_comillas: {
        subject: '11:00 · Inés: “Nuria says we have no customers in Madrid”',
        body: "**Inés:** Nuria tried this:\n\n`SELECT * FROM clientes WHERE ciudad = madrid;`\n\nIt gave her an error: “The column “madrid” does not exist”. She tried `WHERE ciudad = 'madrid'`, got **zero rows** and was about to say in her meeting that we have no customers in Madrid. What do you tell her?",
        choices: {
          quotes: {
            text: 'Two things: without single quotes, PostgreSQL looks for a column called madrid. And with quotes, the text has to be exact: “madrid” is not “Madrid”. Zero rows is not an error, it is an answer that needs checking.',
            reply: "Exactly. The dangerous thing isn't the error but the zero rows: they look like an answer. If a result surprises you, check the condition before you report it.",
            effects: { 3: { text: 'Text goes in single quotes and is compared as it is, capitals included. Zero rows gets checked too.' } },
          },
          double: {
            text: 'She has to use double quotes: `ciudad = "Madrid"`.',
            reply: 'In PostgreSQL double quotes are for column and table names. `"Madrid"` would look for a column again. Text goes in single quotes.',
            effects: { 0: { text: 'Double quotes name columns; text goes in single quotes.' } },
          },
          none: {
            text: "If it returns zero rows, there must be no customers in Madrid.",
            reply: 'There are twelve. The problem is the lowercase “m”: the comparison is case-sensitive.',
            effects: { 0: { text: 'You accepted zero rows without checking the condition.' } },
          },
        },
      },
      nuria_sur: {
        body: "Hi! Next month we're holding an event for customers in Andalusia. Can you get me the `nombre`, the `apellidos` and the `ciudad` of the customers from **Sevilla or Málaga**?",
      },
      nuria_thanks: { body: 'Eight people, four from each city. Perfect for the invitations!' },
      marta_jovenes: {
        body: "One more thing: we're launching the youth card, only in Madrid for now. I need the `nombre` and the `email` of the customers in the **joven** segment who live in **Madrid**. Only those, I don't want to write to anyone it doesn't apply to.",
      },
      marta_jovenes_thanks: { body: "Three customers. Not many, but they are what they are. Thanks!" },
      diego_semana: {
        body: "Hey, I need to compare with my report: `id`, `importe`, `estado` and `creada_en` of the transfers from the week of **Monday 19 to Sunday 25 January 2026, both days included**. My script gives me five and it doesn't add up.",
      },
      diego_thanks: {
        body: "Six! I was missing Sunday afternoon's. My script used `BETWEEN '2026-01-19' AND '2026-01-25'` and that cuts Sunday at 00:00. I'm changing it right now.",
      },
      ines_parentesis: {
        subject: '15:00 · Inés: “Why do 14 come out?”',
        body: "**Inés:** Marta wanted the young customers from Madrid **or** Barcelona, which should be five. Diego wrote this and gets 14:\n\n`SELECT * FROM clientes WHERE ciudad = 'Madrid' OR ciudad = 'Barcelona' AND segmento = 'joven';`\n\nWhat is going on?",
        choices: {
          parens: {
            text: "AND is evaluated before OR, so the query asks for “everyone in Madrid” or “the young ones in Barcelona”. You have to group with parentheses: `(ciudad = 'Madrid' OR ciudad = 'Barcelona') AND segmento = 'joven'`, or use `ciudad IN ('Madrid', 'Barcelona')`.",
            reply: "That's it. When you mix AND and OR, add parentheses even if you think they aren't needed. And check the number of rows: if you expected five and get 14, something is off.",
            effects: { 3: { text: 'AND goes before OR: when mixing them, parentheses (or IN).' } },
          },
          order: {
            text: 'The segment condition has to come first.',
            reply: "`segmento = 'joven' AND ciudad = 'Madrid' OR ciudad = 'Barcelona'` fails too: now every customer in Barcelona comes out. The order doesn't fix it; parentheses do.",
            effects: { 0: { text: 'Changing the order of the conditions does not fix mixing AND and OR.' } },
          },
          data: {
            text: 'Some customers must have the wrong segment.',
            reply: 'The data is fine. It is the query: AND is evaluated before OR.',
            effects: { 0: { text: 'You blamed the data for a fault in the query.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: "**Inés:** Today you've filtered everything. What are you taking away?",
        choices: {
          lesson: {
            text: "That WHERE decides which rows come out, that text goes in single quotes and as it is, that when I mix AND and OR I use parentheses and that with dates and times the last day is counted to the end. And that I always check whether the number of rows makes sense.",
            reply: 'Very good. Tomorrow: sorting results and searching for similar text.',
          },
          excel: {
            text: "That it's easier to get everything and filter in Excel.",
            reply: 'With twelve customers, maybe. With millions of rows, no. Check the debrief.',
            effects: { 0: { text: 'You came away with filtering outside the database: WHERE exists precisely so you don\'t have to.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support' }),
)
