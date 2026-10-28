import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m00PrimeraConsulta } from '../m00-primera-consulta'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 0 — Your first query. English version of ../m00-primera-consulta.ts. */
export const m00PrimeraConsultaEn = missionEn(
  m00PrimeraConsulta,
  {
    title: 'Your first query',
    subtitle: 'SELECT, columns, aliases and LIMIT against a real PostgreSQL database.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Monday · week 1',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'First day, first data',
        body: 'Marta took her figures to the meeting, Nuria pasted her list as it was and Diego already knows what the transfers look like. All with SELECT and FROM.',
      },
      ok: { title: 'A good start', body: 'You can already query data, but one of the tasks fell by the wayside. Check the debrief to see which.' },
      bad: { title: 'Half a first day', body: 'The team was left waiting. Replay the mission: SELECT, FROM, AS and LIMIT solve everything.' },
    },
    briefing: {
      title: 'Week 1 · Your first query',
      paragraphs: [
        'You start as a junior QA at Kobalto, a neobank. Inés, from the data team, has given you access to the database.',
        'Today you will get requests from several people. Each one is done when your query returns the right result.',
        'The database is real PostgreSQL. It is a read-only replica: experiment as much as you like.',
      ],
      goals: [
        'Read in the wiki what the database looks like.',
        'Run your first query on the clientes table.',
        'Get only the columns you are asked for.',
        'Give columns clear names with AS.',
        'Explore a table with just a few rows (LIMIT).',
      ],
    },
    docs: {
      db_kobalto: {
        title: 'What the Kobalto database looks like',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Tables
- **clientes**: one row per customer (first name, last name, email, city, sign-up date and segment).
- **cuentas**: each customer's accounts (\`cliente_id\` points to clientes). IBAN, type (checking or savings), balance, status.
- **tarjetas**: the cards of each account (\`cuenta_id\`), with their daily limit and expiry date.
- **transferencias**: each transfer, with the source account, the destination account (empty if it goes to another bank), the amount and the status.
- **incidencias**: what customers report to customer support.

## How to query
- \`SELECT columns FROM table;\`
- Names are lowercase and without accents: \`fecha_alta\`, not “Sign-up date”.
- Text goes in single quotes: \`'Madrid'\`.

## Rules
- It is a **read-only** replica.
- On big tables, explore with \`LIMIT\`.`,
      },
    },
    sqlLab: {
      starter: '-- Write your query here and press “Run” (Ctrl/Cmd + Enter)\nSELECT * FROM clientes;',
      retos: {
        clientes: {
          title: 'Your first query',
          description: 'Show **all the columns** of the `clientes` table.',
          hint: 'Columns go after `SELECT`; `*` means “all”. The table goes after `FROM`.',
        },
        contacto: {
          title: 'Only what you need',
          description: 'Show only the `nombre`, `apellidos` and `email` of the customers, in that order.',
          hint: 'Write the columns separated by commas, in the order you want them: `SELECT col1, col2, col3 FROM ...`',
        },
        cuentas: {
          title: 'The accounts for the meeting',
          description: 'Marta wants the `iban`, the `tipo` and the `saldo` of **all** the accounts.',
          hint: 'Look in the explorer for the name of the accounts table and its columns.',
        },
        alias: {
          title: 'Columns with a clear name',
          description: "For Nuria's report: the customer's name as `cliente`, their `ciudad` and the sign-up date as `alta`, in that order.",
          hint: 'Each column can have an alias: `column AS new_name`.',
        },
        vistazo: {
          title: 'A look at the transfers',
          description: 'Diego wants **just 5 rows** of `transferencias`, with all their columns.',
          hint: 'At the end of the query, `LIMIT` and the number of rows you want.',
        },
      },
    },
    bugs: {
      'C-MARTA': { title: 'Marta goes to the meeting without the account figures', explanation: "Marta's task was left undone.", technique: 'SELECT with the columns you are asked for.' },
      'C-NURIA': { title: "Nuria's report comes out with columns nobody understands", explanation: 'Without aliases, the report shows the technical column names.', technique: 'Aliases with AS.' },
      'C-DIEGO': { title: 'Diego codes blind without seeing what the transfers look like', explanation: "Diego didn't get the sample rows.", technique: 'Exploring with LIMIT.' },
      'C-REPLICA': {
        title: 'A SELECT * of 40 million rows leaves the replica gasping',
        explanation: 'Asking for a whole huge table just to “see what it looks like” slows down the entire team.',
        technique: 'A few rows with LIMIT and only the columns you need.',
      },
      'C-COMA': {
        title: 'A report comes out with names in the “email” column',
        explanation: 'A forgotten comma turns one column into the alias of another, without any error.',
        technique: 'Check that the result has the columns you asked for.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with each of Monday's tasks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Figures for Marta', explanation: 'IBAN, type and balance of all the accounts.' },
        1: { label: "Nuria's report", explanation: 'Columns renamed with AS.' },
        2: { label: 'Sample for Diego', explanation: 'Five rows with LIMIT.' },
        3: { label: 'Exploring without overloading', explanation: 'LIMIT on big tables.' },
        4: { label: 'Checking the result', explanation: 'Spotting the missing comma.' },
      },
    },
    concepts: {
      select_from: { title: 'SELECT and FROM', summary: 'SELECT with the columns (or * for all) and FROM with the table.' },
      select_columns: { title: 'Choosing columns', summary: 'Ask only for the columns you need, in the order you want them.' },
      column_alias: { title: 'Column alias', summary: 'AS changes the name of a column in the result, not in the table.' },
      limit_rows: { title: 'LIMIT', summary: 'Returns only a few rows: the safe way to explore big tables.' },
      sql_errors: { title: "Reading errors (and what doesn't error)", summary: 'Read the message, check names, commas and quotes, and check the result columns.' },
      readonly_replica: { title: 'Read-only replica', summary: 'A copy of production to query without loading it or changing data.' },
    },
    seniorTips: [
      'Read in the wiki what the database looks like before you start.',
      'Customers: SELECT * FROM clientes. Contact: SELECT nombre, apellidos, email FROM clientes.',
      'Marta: SELECT iban, tipo, saldo FROM cuentas.',
      'Nuria: SELECT nombre AS cliente, ciudad, fecha_alta AS alta FROM clientes.',
      'Diego: SELECT * FROM transferencias LIMIT 5.',
      'With Inés: LIMIT to explore; and the missing comma turns email into an alias.',
    ],
    lessons: {
      select: {
        question: 'How do you read a SELECT query?',
        body: `A query says **which columns** you want and **from which table**:

\`SELECT nombre, email FROM clientes;\`

- \`SELECT\` is followed by the columns, separated by commas.
- \`*\` means “all the columns”.
- \`FROM\` names the table.
- The final \`;\` marks the end of the statement.

Capitalization does not matter (\`select\` works too), but writing keywords in capitals makes it easier to read.`,
      },
      columns: {
        question: 'Why not always use SELECT *?',
        body: `\`SELECT *\` is fine for **exploring** a small table. For anything else, ask for the columns you need:

- it is faster (the database sends less data);
- the result is easier to understand;
- if columns are added to the table tomorrow, your query still returns the same thing.

Columns come out **in the order you write them**.`,
      },
      alias: {
        question: 'How do I change the name of a column in the result?',
        body: `With \`AS\`:

\`SELECT nombre AS cliente, fecha_alta AS alta FROM clientes;\`

The alias only changes the name **in the result**, not in the table. If you want an alias with spaces or capitals, put it in double quotes: \`AS "Sign-up date"\`.`,
      },
      limit: {
        question: 'How do I see only a few rows?',
        body: `With \`LIMIT\` at the end:

\`SELECT * FROM transferencias LIMIT 5;\`

It is the safe way to **explore** a big table. Careful: without an \`ORDER BY\` (you will see it in mission 2), PostgreSQL does not guarantee **which** five rows it returns.`,
      },
      errors: {
        question: "What do I do when a query gives an error (or doesn't)?",
        body: `- **Read the message**: it usually says what is missing and where (“column “emial” does not exist”).
- Check **names** in the table explorer, **commas** between columns and single **quotes** for text.
- Watch out for what does **not** give an error: \`SELECT nombre email\` (no comma) returns the nombre column with the alias “email”. Always check that the result has the columns you asked for.`,
      },
      replica: {
        question: 'What is a read-only replica?',
        body: `A **copy** of the production database that updates itself and that you can **only query**. It lets analytics, reporting and QA avoid loading the main database or changing data by mistake.

If you try an \`UPDATE\` or a \`DELETE\` here, the console will tell you it is read-only. You will modify data later, in the test environment.`,
      },
    },
    quiz: {
      pre: {
        s0pre_select: {
          question: 'Which query returns all the columns of the clientes table?',
          options: ['GET * FROM clientes', 'SELECT * FROM clientes', 'SELECT clientes', 'SHOW clientes'],
          explanation: 'SELECT, the columns (or *) and FROM with the table.',
        },
        s0pre_columns: {
          question: 'In what order do the columns of `SELECT email, nombre FROM clientes` come out?',
          options: ['In the table order', 'Alphabetical', 'email and then nombre', 'It depends on the day'],
          explanation: 'In the order you write them.',
        },
        s0pre_alias: {
          question: 'What does `SELECT fecha_alta AS alta FROM clientes` do?',
          options: ['Renames the column in the table', 'Filters the customers who signed up', 'Gives an error', 'Shows the fecha_alta column with the name “alta” in the result'],
          explanation: 'The alias only changes the name in the result.',
        },
        s0pre_limit: {
          question: 'You want to see what a table with millions of rows looks like. What do you do?',
          options: ['SELECT * FROM table LIMIT 10', 'SELECT * FROM table', 'Export it to Excel', 'Count the rows by hand'],
          explanation: 'A few rows are enough to explore.',
        },
        s0pre_errors: {
          question: 'What does `SELECT nombre email FROM clientes` (no comma) return?',
          options: ['A syntax error', 'One column with the names, called email', 'Two columns: nombre and email', 'Nothing'],
          explanation: 'Without the comma, “email” is an alias of nombre.',
        },
        s0pre_replica: {
          question: 'On a read-only replica…',
          options: ['You can delete data carefully', 'You cannot query', 'You can query, but not modify data', 'The data is made up'],
          explanation: 'It lets you query without risk.',
        },
      },
      post: {
        s0post_select: {
          question: 'Which word names the table the data comes from?',
          options: ['SELECT', 'WHERE', 'AS', 'FROM'],
          explanation: 'FROM names the table.',
        },
        s0post_columns: {
          question: 'What is a good reason not to use SELECT * in a report?',
          options: ['Asking only for the columns you need is faster and clearer', 'SELECT * gives an error in PostgreSQL', 'SELECT * only returns one row', 'None'],
          explanation: 'Less data and a clearer, more stable result.',
        },
        s0post_alias: {
          question: 'How do you write an alias with spaces?',
          options: ["AS 'Sign-up date'", 'AS "Sign-up date"', 'AS Sign-up date', 'You cannot'],
          explanation: 'Aliases with spaces go in double quotes.',
        },
        s0post_limit: {
          question: 'Without ORDER BY, which rows does LIMIT 5 return?',
          options: ['The first 5 by id, always', 'The 5 most recent', 'Any five rows: which ones is not guaranteed', 'The last 5'],
          explanation: 'Without an explicit order, there is no guarantee.',
        },
        s0post_errors: {
          question: 'PostgreSQL says “column "emial" does not exist”. What do you check first?',
          options: ['The permissions', 'That the table has data', 'The connection', 'How the column name is spelled'],
          explanation: 'It is almost always a typo in the name.',
        },
        s0post_replica: {
          question: 'Why give QA access to a replica instead of production?',
          options: ['To query without loading the main database or being able to change data by mistake', 'So the data is different', 'So queries are slower', 'So they can delete data'],
          explanation: 'Querying without risk and without loading production.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Welcome: you now have access to the database',
        body: "Welcome to Kobalto!\n\nI'm Inés, from the data team. I've given you **read-only** access to the database replica: you can query whatever you like without fear of breaking anything.\n\nYou have the “SQL console” app: the tables on the left, the editor in the middle and the tasks on the right. To get started, here are two:\n\n- Look at the whole `clientes` table.\n- Get just the first name, last name and email.\n\nIn the wiki you have “What the Kobalto database looks like”. Today requests from the team will keep coming in: don't worry, they can all be solved with what you see today.\n\nInés",
      },
      ines_ok: {
        body: 'Perfect! You get the idea: after SELECT go the columns you want, in the order you want them. Asking only for what you need is faster and clearer than the asterisk.',
      },
      marta_cuentas: {
        body: "Hi, welcome! I hear you already have access to the database. Can you get me the IBAN, the type and the balance of all the accounts? I have a meeting at 11:00 and I want to take it with me.",
      },
      marta_thanks: { body: "Great, exactly what I needed! I'm taking it to the meeting." },
      ines_limit: {
        subject: '11:00 · Coffee with Inés',
        body: "**Inés:** How was the first morning? Let me tell you something: in production, the transfers table has about 40 million rows. If one day you want to see what they look like, what do you do?",
        choices: {
          limit: {
            text: 'I ask for just a few rows with LIMIT, and only the columns I need. To see what they look like, five or ten are enough.',
            reply: 'Exactly. A SELECT * with no limit on 40 million rows can leave the replica gasping for the whole team.',
            effects: { 3: { text: 'To explore a big table, a few rows (LIMIT) and only the columns you need.' } },
          },
          all: {
            text: "A SELECT * of the table and I'll look at whatever comes out.",
            reply: 'With 40 million rows, that can take minutes and slow down the whole team. A few rows is better.',
            effects: { 0: { text: 'You were about to ask for 40 million rows just to see what a table looks like.' } },
          },
          excel: {
            text: 'I ask someone to send it to me in an Excel file.',
            reply: "That's what the console is for. And an Excel file with 40 million rows won't open.",
            effects: { 0: { text: 'You thought of asking for the data instead of querying it yourself.' } },
          },
        },
      },
      nuria_alias: {
        body: "Hi, I'm Nuria, from customer support. I have to paste a list into a report and the columns have weird names. Can you get it for me with columns people can understand? I want `cliente` (the name), `ciudad` and `alta` (the sign-up date).",
      },
      nuria_thanks: { body: "That's more like it! I'll paste it as it is. Thanks." },
      diego_vistazo: {
        body: "Hey, I'm Diego, backend. I'm working on the transfers service and I want to see what the real data looks like. Can you send me a few rows of `transferencias`? 5 is enough for me, but with all the columns.",
      },
      diego_thanks: { body: 'Perfect, this gives me an idea of the columns and of how the amounts and dates come. Thanks!' },
      ines_coma: {
        subject: '15:00 · Inés: “What do you see here?”',
        body: '**Inés:** Diego sent me this query and says he gets people\'s names in the "email" column:\n\n`SELECT nombre email FROM clientes;`\n\nWhat is going on?',
        choices: {
          comma: {
            text: 'There is a comma missing between nombre and email. Without it, PostgreSQL understands that “email” is an alias of the nombre column: it returns a single column, with the names, called email.',
            reply: "That's it. And it doesn't give an error, which is the dangerous part: it looks like it works. Always check that the columns are the ones you asked for.",
            effects: { 3: { text: 'You saw that a forgotten comma turns one column into the alias of another, without any error.' } },
          },
          table: {
            text: "The clientes table doesn't have an email column.",
            reply: 'It does: look at it in the explorer. The problem is something else.',
            effects: { 0: { text: 'You looked for the fault in the table, not in the query.' } },
          },
          bug: {
            text: "It must be a database bug.",
            reply: 'PostgreSQL does exactly what we ask it to. The problem is in the query.',
            effects: { 0: { text: 'You blamed the database for a fault in the query.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: "**Inés:** First day done. What are you taking away?",
        choices: {
          lesson: {
            text: 'That with SELECT and FROM I can already answer a lot of questions: ask only for the columns I need, give them clear names with AS, explore with LIMIT and always check that the result is what I asked for.',
            reply: "That's it. Tomorrow we start filtering rows: that's where it gets interesting.",
          },
          excel: {
            text: 'That the easiest thing is to export everything and look at it in Excel.',
            reply: 'For tables of 40 million rows no Excel can cope. Check the debrief.',
            effects: { 0: { text: "You came away with exporting everything: SQL exists precisely so you don't have to." } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support' }),
)
