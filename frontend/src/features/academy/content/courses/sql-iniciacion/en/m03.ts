import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m03Nulos } from '../m03-nulos'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 3 — The gaps. English version of ../m03-nulos.ts. */
export const m03NulosEn = missionEn(
  m03Nulos,
  {
    title: 'The gaps',
    subtitle: 'NULL, IS NULL, COALESCE and CASE.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Thursday · week 1',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'No gap gets past you',
        body: 'Nuria has her open incidents, Marta leaves nobody out of the campaign, Laura knows what to expect from the PDF and Carmen has her risk report.',
      },
      ok: { title: 'A NULL slipped in', body: 'You can already tell NULL apart, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'The gaps won', body: 'Several tasks were left undone or with rows missing. Replay the mission: IS NULL, COALESCE and CASE.' },
    },
    briefing: {
      title: 'Week 1 · The gaps',
      paragraphs: [
        'Fourth day at Kobalto. Today the tasks have something in common: missing data. Customers without a segment, incidents not closed, transfers without a description.',
        'In SQL, “no data” is called NULL and it does not behave like a normal value. Today you learn to find it, not to lose it along the way and to replace it.',
      ],
      goals: [
        'Find the gaps with IS NULL and IS NOT NULL.',
        'Keep NULLs in mind when you filter with <>.',
        'Replace NULL with a value using COALESCE.',
        'Label rows with CASE.',
      ],
    },
    docs: {
      chuleta_null: {
        title: 'Cheat sheet: NULL, COALESCE and CASE',
        updatedLabel: 'Inés Moreno · Data',
        body: `## What NULL is
“No data”. It is not 0 or ''.

## Where there is NULL in Kobalto
- \`clientes.segmento\`: customer with no segment assigned.
- \`incidencias.cerrada_en\`: incident still open.
- \`transferencias.cuenta_destino_id\`: transfer to another bank.
- \`transferencias.concepto\`: transfer without a description.

## Rules
- You search with \`IS NULL\` / \`IS NOT NULL\`. **Never** with \`= NULL\`.
- \`<>\`, \`NOT IN\`, \`>\`… leave out the NULLs. If you want them: \`OR column IS NULL\`.
- An operation with NULL gives NULL.
- \`COALESCE(column, 'default value')\`.

## CASE
\`CASE WHEN condition THEN value WHEN … ELSE value END AS name\` — the first one that holds wins.`,
      },
    },
    sqlLab: {
      starter: '-- Find the gaps with IS NULL\nSELECT id, nombre, apellidos\nFROM clientes\nWHERE segmento IS NULL;',
      retos: {
        sin_segmento: {
          title: 'Customers without a segment',
          description: '`id`, `nombre` and `apellidos` of the customers who **have no segment**.',
          hint: '`= NULL` never works. Use `WHERE segmento IS NULL`.',
        },
        abiertas: {
          title: 'Incidents not closed',
          description: '`id`, `cliente_id`, `motivo` and `abierta_en` of the incidents that **have no closing date**.',
          hint: 'An open incident has an empty `cerrada_en`: `IS NULL`.',
        },
        externas: {
          title: 'Transfers to other banks',
          description: '`id`, `importe` and `estado` of the transfers **with no destination account** in Kobalto.',
          hint: '`cuenta_destino_id IS NULL`.',
        },
        no_premium: {
          title: 'Everyone who is not premium',
          description: '`id`, `nombre` and `segmento` of the customers who are **not premium**, including those who **have no segment**.',
          hint: "`segmento <> 'premium'` leaves out the NULLs. Add them with `OR segmento IS NULL`.",
        },
        sin_concepto: {
          title: 'Description or “Sin concepto”',
          description: '`id` and `concepto` of **all** the transfers; if there is no description, the text **Sin concepto**. The column must be called `concepto`.',
          hint: "`COALESCE(concepto, 'Sin concepto') AS concepto`.",
        },
        nivel: {
          title: 'Balance level',
          description: '`id`, `saldo` and `nivel` of each account: **negativo** (< 0), **bajo** (< 1,000), **medio** (< 10,000) or **alto** (the rest).',
          hint: "`CASE WHEN saldo < 0 THEN 'negativo' WHEN saldo < 1000 THEN 'bajo' … ELSE 'alto' END AS nivel`. The order of the WHENs matters.",
        },
      },
    },
    bugs: {
      'C-NURIA': { title: 'Eight open incidents are still waiting', explanation: "Nuria didn't receive the list of incidents not closed.", technique: 'IS NULL.' },
      'C-DIEGO': {
        title: 'The connector with other banks is tested without real data',
        explanation: "Diego didn't receive the transfers without a destination account.",
        technique: 'IS NULL on the missing key.',
      },
      'C-PREMIUM': {
        title: 'The premium campaign forgets the customers with no segment',
        explanation: '<> leaves out the NULLs: the draft said 31 instead of 33.',
        technique: "<> 'premium' OR IS NULL.",
      },
      'C-PDF': {
        title: 'The PDF statement comes out with blank cells',
        explanation: 'Laura had nothing to compare the transfers without a description against.',
        technique: 'COALESCE with a default value.',
      },
      'C-RIESGO': { title: 'The risk report comes out without labels', explanation: "Carmen didn't receive the level of each account.", technique: 'CASE WHEN … END.' },
      'C-ISNULL': {
        title: 'Customer support reports that there are no open incidents',
        explanation: '= NULL returns zero rows without giving an error.',
        technique: 'IS NULL, never = NULL.',
      },
      'C-ETIQUETA': {
        title: 'Two customers show up in the app without a name',
        explanation: 'Concatenating with a NULL gives NULL.',
        technique: 'COALESCE before operating.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with Thursday's tasks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Open incidents', explanation: 'cerrada_en IS NULL.' },
        1: { label: 'Connector tests', explanation: 'Transfers without a destination account.' },
        2: { label: 'Complete premium campaign', explanation: 'Including customers with no segment.' },
        3: { label: 'Statement without gaps', explanation: 'COALESCE with “Sin concepto”.' },
        4: { label: 'Risk report', explanation: 'Level of each account with CASE.' },
        5: { label: 'IS NULL, not = NULL', explanation: 'Zero rows checked.' },
        6: { label: 'Complete labels', explanation: 'COALESCE before concatenating.' },
      },
    },
    concepts: {
      null_meaning: { title: 'What NULL is', summary: '“No data”: neither 0 nor an empty text.' },
      is_null: { title: 'IS NULL', summary: 'Gaps are searched with IS NULL / IS NOT NULL; = NULL is never true.' },
      null_logic: { title: 'NULL in comparisons and operations', summary: '<> and friends leave out the NULLs, and an operation with NULL gives NULL.' },
      coalesce: { title: 'COALESCE', summary: 'Returns the first value that is not NULL: a default value.' },
      case_when: { title: 'CASE', summary: 'Creates a column according to conditions; the first one that holds wins.' },
    },
    seniorTips: [
      'Read the NULL cheat sheet in the wiki.',
      'Inés: SELECT id, nombre, apellidos FROM clientes WHERE segmento IS NULL.',
      'Nuria: … FROM incidencias WHERE cerrada_en IS NULL.',
      'Diego: SELECT id, importe, estado FROM transferencias WHERE cuenta_destino_id IS NULL.',
      "Marta: … WHERE segmento <> 'premium' OR segmento IS NULL.",
      "Laura: SELECT id, COALESCE(concepto, 'Sin concepto') AS concepto FROM transferencias.",
      "Carmen: CASE WHEN saldo < 0 THEN 'negativo' WHEN saldo < 1000 THEN 'bajo' WHEN saldo < 10000 THEN 'medio' ELSE 'alto' END AS nivel.",
      'With Inés: IS NULL instead of = NULL; NULL is contagious: COALESCE.',
    ],
    lessons: {
      null: {
        question: 'What exactly is NULL?',
        body: `NULL means **“no data”** or “unknown”. It is not the same as:

- \`0\`: a balance of zero is a piece of data; a NULL balance is not.
- \`''\`: an empty text is a text; NULL is nothing.

In Kobalto there is NULL wherever information is missing: a customer without a segment, an incident without a closing date, a transfer without a description or to another bank (no destination account).`,
      },
      is_null: {
        question: 'How do I search for the rows with a gap?',
        body: `With \`IS NULL\`, and the opposite with \`IS NOT NULL\`:

\`SELECT * FROM incidencias WHERE cerrada_en IS NULL;\`

\`= NULL\` **does not work**: it does not give an error, but returns zero rows. Comparing anything with NULL gives “unknown”, never true. Not even \`NULL = NULL\` is true.`,
      },
      logic: {
        question: "Why doesn't <> return the NULLs?",
        body: `\`WHERE segmento <> 'premium'\` leaves out those whose segment is NULL: for PostgreSQL, “is NULL different from premium?” is **unknown**, and WHERE only lets **true** through.

If you want to include them, say so:

\`WHERE segmento <> 'premium' OR segmento IS NULL\`

The same happens with \`NOT IN\`, \`>\`, \`<\`… And NULL “spreads” through operations: \`'Ana (' || NULL || ')'\` gives NULL, and so does \`100 + NULL\`.`,
      },
      coalesce: {
        question: "How do I put a value when there's no data?",
        body: `\`COALESCE\` returns the **first value in the list that is not NULL**:

\`SELECT id, COALESCE(concepto, 'Sin concepto') AS concepto FROM transferencias;\`

If \`concepto\` has a value, it comes out as it is; if it is NULL, “Sin concepto” comes out. Add an alias: otherwise the column is called “coalesce”.`,
      },
      case: {
        question: 'How do I create a column with labels depending on a value?',
        body: `With \`CASE\`:

\`\`\`
SELECT id, saldo,
  CASE
    WHEN saldo < 0 THEN 'negativo'
    WHEN saldo < 1000 THEN 'bajo'
    ELSE 'normal'
  END AS nivel
FROM cuentas;
\`\`\`

They are evaluated **in order** and the first condition that holds wins: that is why \`saldo < 0\` goes before \`saldo < 1000\`. Without \`ELSE\`, whatever matches nothing stays NULL. Finish with \`END\` and give it an alias.`,
      },
    },
    quiz: {
      pre: {
        s3pre_meaning: {
          question: 'What does NULL mean in a cell?',
          options: ['Zero', 'An empty text', 'That there is no data', 'An error'],
          explanation: 'NULL is the absence of data: neither 0 nor an empty text.',
        },
        s3pre_isnull: {
          question: 'How do you search for the incidents with no closing date?',
          options: ['WHERE cerrada_en = NULL', 'WHERE cerrada_en IS NULL', "WHERE cerrada_en = ''", 'WHERE cerrada_en = 0'],
          explanation: 'IS NULL; = NULL is never true.',
        },
        s3pre_logic: {
          question: "There are 2 customers with no segment and 7 premium out of 40. How many does `WHERE segmento <> 'premium'` return?",
          options: ['33', '31', '40', '7'],
          explanation: 'The NULLs stay out: 40 − 7 premium − 2 with no segment = 31.',
        },
        s3pre_coalesce: {
          question: "What does `COALESCE(NULL, 'Sin concepto')` return?",
          options: ['NULL', "'Sin concepto'", 'An error', 'An empty string'],
          explanation: 'COALESCE returns the first value that is not NULL.',
        },
        s3pre_case: {
          question: 'How does a CASE expression end?',
          options: ['With END', 'With ELSE', 'With THEN', 'With ;'],
          explanation: 'CASE … WHEN … THEN … ELSE … END.',
        },
        s3pre_prop: {
          question: 'What is `100 + NULL`?',
          options: ['100', '0', 'NULL', 'Error'],
          explanation: 'Almost any operation with NULL gives NULL.',
        },
      },
      post: {
        s3post_meaning: {
          question: 'A transfer has `cuenta_destino_id` NULL. In Kobalto this means…',
          options: ['That the account is number 0', 'That it goes to another bank (there is no Kobalto account)', 'That it is rejected', 'That it is a database error'],
          explanation: 'NULL indicates there is no destination account in Kobalto.',
        },
        s3post_isnull: {
          question: '`WHERE cerrada_en = NULL` returns 0 rows. Why?',
          options: ['There are no open incidents', 'Comparing with NULL gives “unknown”, never true', 'NULL needs to be in quotes', 'The column does not accept NULL'],
          explanation: 'To ask about NULL: IS NULL.',
        },
        s3post_logic: {
          question: 'How do you include customers with no segment in “everyone who is not premium”?',
          options: ["WHERE segmento <> 'premium'", "WHERE segmento <> 'premium' OR segmento IS NULL", "WHERE segmento NOT IN ('premium', NULL)", "WHERE segmento != 'premium'"],
          explanation: 'NULLs have to be asked for explicitly with IS NULL.',
        },
        s3post_coalesce: {
          question: "`SELECT COALESCE(concepto, 'Sin concepto') FROM transferencias` without an alias. What is the column called?",
          options: ['concepto', 'coalesce', 'Sin concepto', 'column1'],
          explanation: 'Without an alias, PostgreSQL uses the function name. Add AS concepto.',
        },
        s3post_case: {
          question: "Balance -50. What does `CASE WHEN saldo < 1000 THEN 'bajo' WHEN saldo < 0 THEN 'negativo' END` return?",
          options: ['negativo', 'bajo', 'NULL', 'Both'],
          explanation: 'The first condition that holds wins: the order of the WHENs matters.',
        },
        s3post_prop: {
          question: "What does `'Ana (' || segmento || ')'` return if segmento is NULL?",
          options: ['Ana ()', 'Ana (NULL)', 'NULL', 'Ana'],
          explanation: 'NULL spreads through concatenation; use COALESCE.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Today: the gaps (NULL)',
        body: "Good morning!\n\nToday it's something that confuses everybody at first: **NULL**. It is what a cell holds when **there is no data**: a customer without a segment, an incident without a closing date, a transfer without a description. It is not 0 or an empty text: it is “unknown”.\n\nTo start:\n\n- Get the `id`, the `nombre` and the `apellidos` of the customers who **have no segment**.\n\nHint: `= NULL` doesn't work. I explain it in the wiki.\n\nInés",
      },
      ines_ok: {
        body: "Two customers without a segment. That's it, `IS NULL`. And note: the segment shouldn't be allowed to stay empty. That's another anomaly for the list.",
      },
      nuria_abiertas: {
        body: 'Good morning. My boss wants to know which incidents are still **not closed**. Those are the ones with no date in `cerrada_en`. Can you send me `id`, `cliente_id`, `motivo` and `abierta_en`?',
      },
      nuria_thanks: { body: 'Eight open, some from months ago. I will get on them. Thanks!' },
      diego_externas: {
        body: "Hey. Transfers to **other banks** have no destination account in Kobalto: `cuenta_destino_id` is empty. To test the new connector I need `id`, `importe` and `estado` of all of those.",
      },
      diego_thanks: { body: '24, one in every five. I can use all of them for the tests. Thanks!' },
      ines_isnull: {
        subject: '11:00 · Inés: “There are no open incidents”',
        body: "**Inés:** Before asking you, Nuria had tried this:\n\n`SELECT * FROM incidencias WHERE cerrada_en = NULL;`\n\nZero rows, no error. She almost told her boss nothing was open. What happened?",
        choices: {
          isnull: {
            text: "Any comparison with NULL gives “unknown”, never true, not even `NULL = NULL`. That's why no rows come out. To ask about gaps you have to use `IS NULL` (or `IS NOT NULL`).",
            reply: "Exactly. `= NULL` doesn't give an error, which is the treacherous part. For NULL, always `IS NULL`.",
            effects: { 3: { text: 'You do not compare NULL with =: you ask with IS NULL.' } },
          },
          quotes: {
            text: "She had to write `cerrada_en = 'NULL'`, in quotes.",
            reply: 'That would compare with the text “NULL”, and it also gives an error because cerrada_en is a date. NULL is not a text.',
            effects: { 0: { text: 'NULL is not the text “NULL”.' } },
          },
          none: {
            text: "If it returns zero, they must all be closed.",
            reply: 'There are eight open. Zero rows again, and again there was reason to be suspicious.',
            effects: { 0: { text: 'You accepted zero rows without checking the condition.' } },
          },
        },
      },
      marta_no_premium: {
        body: "Hi. We're going to offer the move to premium to everyone who **is not premium yet**, including those with no segment. I need `id`, `nombre` and `segmento` of all of them.",
      },
      marta_no_premium_thanks: {
        body: "33, with the two with no segment included. The draft they gave me yesterday said 31; now I see why. Thanks!",
      },
      laura_concepto: {
        body: "Hi. We're testing the PDF statement and, when a transfer has no description, a blank cell comes out. I want to compare with what should come out: `id` and `concepto` of **all** the transfers, and when there is no description, the text **Sin concepto**. The column must be called `concepto`.",
      },
      laura_thanks: { body: 'Perfect: nine without a description. Now I know which rows to check in the PDF.' },
      carmen_nivel: {
        body: 'For the risk report I want each account with a label according to its balance: `id`, `saldo` and a `nivel` column that says **negativo** (less than 0), **bajo** (less than 1,000), **medio** (less than 10,000) or **alto** (the rest).',
      },
      carmen_thanks: {
        body: 'One negative, one low, 39 medium and 11 high. I already had the negative one on my radar thanks to Inés. Thanks.',
      },
      ines_contagio: {
        subject: '15:00 · Inés: “Two customers have disappeared”',
        body: "**Inés:** Diego has prepared a label for the app:\n\n`SELECT nombre || ' (' || segmento || ')' AS etiqueta FROM clientes;`\n\nAlmost everyone gets “Ana (premium)”, but two get an **empty** label, without even a name. Why?",
        choices: {
          coalesce: {
            text: "They are the two customers with no segment. Almost any operation with NULL gives NULL: joining texts, adding… You have to put a default value: `COALESCE(segmento, 'sin segmento')`.",
            reply: 'That\'s it: NULL "spreads" through operations. COALESCE gives you the first value that is not NULL.',
            effects: { 3: { text: 'An operation with NULL gives NULL: COALESCE puts in a default value.' } },
          },
          bug: {
            text: "It's a fault in the `||` operator; better to concatenate in the app.",
            reply: 'The operator works: it is NULL, which propagates. In the app the same would happen if it is not handled.',
            effects: { 0: { text: 'You blamed the operator for what NULL does.' } },
          },
          data: {
            text: 'The segment will have to be filled in by hand in the database.',
            reply: 'Maybe that data needs correcting, but the label has to work even when a piece of data is missing. That is solved in the query.',
            effects: { 0: { text: "You thought of fixing the data, not of making the query cope with the gaps." } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you have wrestled with the gaps. What are you taking away?',
        choices: {
          lesson: {
            text: 'That NULL is “no data”: you search for it with IS NULL, it stays out of comparisons (also of <>), it spreads through operations and it is replaced with COALESCE. And that CASE lets me label rows.',
            reply: 'Very good. Tomorrow we start counting and adding up, and NULL has something to say there too.',
          },
          zero: {
            text: 'That the best thing is to treat NULL as if it were a zero.',
            reply: "An unknown balance is not a balance of zero. Check the debrief.",
            effects: { 0: { text: 'You came away thinking NULL is zero: it is “unknown”.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support', laura: 'QA Lead' }),
)
