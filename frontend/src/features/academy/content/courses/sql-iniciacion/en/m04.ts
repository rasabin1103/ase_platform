import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m04Contar } from '../m04-contar'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 4 — Counting. English version of ../m04-contar.ts. */
export const m04ContarEn = missionEn(
  m04Contar,
  {
    title: 'Counting',
    subtitle: 'COUNT, SUM, AVG, MIN, MAX and ROUND: from lists to figures.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Friday · week 1',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'The figures add up',
        body: "Marta goes to the committee with the total balance, Diego sizes things with the right average, Carmen has her extremes and Laura her counts. And nobody is going to say the typical transfer is €900.",
      },
      ok: { title: 'Figures with an asterisk', body: 'You already use the aggregates, but a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: "Figures that don't add up", body: 'Several tasks were left undone. Replay the mission: COUNT, SUM, AVG, MIN and MAX.' },
    },
    briefing: {
      title: 'Week 1 · Counting',
      paragraphs: [
        "Friday, last day of the first week. Today nobody wants lists: they want figures. How many, how much, the average, the maximum.",
        'The tasks are met with aggregate functions: typing the figure in by hand does not count.',
      ],
      goals: [
        'Count rows with COUNT(*) and values with COUNT(column) and COUNT(DISTINCT).',
        'Sum and average with SUM and AVG, filtering first with WHERE.',
        'Round with ROUND.',
        'Get extremes with MIN and MAX.',
        'Distrust an average without looking at the extremes.',
      ],
    },
    docs: {
      chuleta_agregados: {
        title: 'Cheat sheet: counting and summarizing',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Aggregate functions
- \`COUNT(*)\`: rows · \`COUNT(col)\`: rows with no NULL in col · \`COUNT(DISTINCT col)\`: distinct values.
- \`SUM(col)\` · \`AVG(col)\` · \`MIN(col)\` · \`MAX(col)\`. They all ignore NULLs.
- \`ROUND(value, 2)\`: round to 2 decimals.

## Rules
- \`WHERE\` filters **before** aggregating.
- Without GROUP BY they return **one row**: don't mix in loose columns.
- Give them aliases: \`COUNT(*) AS total\`.
- Before giving an average, look at MIN and MAX.`,
      },
    },
    sqlLab: {
      starter: '-- Summarize many rows into one figure\nSELECT COUNT(*) AS total\nFROM clientes;',
      retos: {
        total_clientes: {
          title: 'How many customers?',
          description: 'The **number of customers**: one row, one column.',
          hint: '`SELECT COUNT(*) FROM clientes`.',
        },
        saldo_activas: {
          title: 'Total balance of the active accounts',
          description: 'The **sum of the balance** of the accounts with status **activa**. One figure.',
          hint: "`SUM(saldo)` and a `WHERE estado = 'activa'`.",
        },
        media_completadas: {
          title: 'Average amount of the completed ones',
          description: 'The **average amount** of the **completed** (`completada`) transfers, rounded to **2 decimals**.',
          hint: "`ROUND(AVG(importe), 2)` with `WHERE estado = 'completada'`.",
        },
        extremos: {
          title: 'The smallest and the largest',
          description: 'The **minimum** and **maximum** amount of the transfers, in columns `minimo` and `maximo`.',
          hint: '`MIN(importe) AS minimo, MAX(importe) AS maximo` in the same SELECT.',
        },
        conceptos: {
          title: 'Total and with a description',
          description: 'In one row: the **total** number of transfers and how many **have a description**. Columns `total` and `con_concepto`.',
          hint: '`COUNT(*)` counts all the rows; `COUNT(concepto)` only those with a description.',
        },
        ciudades_distintas: {
          title: 'In how many cities?',
          description: 'The number of **distinct cities** where there are customers. One figure.',
          hint: '`COUNT(DISTINCT ciudad)`.',
        },
      },
    },
    bugs: {
      'C-COMITE': { title: 'Marta goes to the committee without the total balance', explanation: "Marta's task was left undone.", technique: 'SUM with WHERE.' },
      'C-MOTOR': { title: 'The payments engine is sized by eye', explanation: "Diego didn't receive the average amount.", technique: 'ROUND(AVG(…), 2).' },
      'C-TRIMESTRAL': { title: "The quarterly Risk report comes out without extremes", explanation: "Carmen didn't receive the minimum and maximum.", technique: 'MIN and MAX in the same SELECT.' },
      'C-EXTRACTO': {
        title: "The statement test doesn't know how many rows without a description to expect",
        explanation: "Laura didn't receive the counts.",
        technique: 'COUNT(*) versus COUNT(column).',
      },
      'C-CIUDADES': {
        title: 'The presentation says there are customers in 40 cities',
        explanation: 'Counting cities without DISTINCT counts customers.',
        technique: 'COUNT(DISTINCT ciudad).',
      },
      'C-MEZCLA': {
        title: 'Nuria gets stuck on an error she does not understand',
        explanation: 'Mixing loose columns with aggregates gives an error without GROUP BY.',
        technique: 'Aggregates on their own or with GROUP BY.',
      },
      'C-MEDIA': {
        title: 'A slide says the typical transfer is €893',
        explanation: 'Four huge transfers inflate the average.',
        technique: 'Look at MIN, MAX and the average without extremes, or the median.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with Friday's figures.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Marta's committee", explanation: 'Total balance of the active accounts.' },
        1: { label: 'Payments engine', explanation: 'Average of the completed ones.' },
        2: { label: 'Risk report', explanation: 'Minimum and maximum.' },
        3: { label: 'Statement test', explanation: 'COUNT(*) and COUNT(concepto).' },
        4: { label: 'Cities', explanation: 'COUNT(DISTINCT ciudad).' },
        5: { label: 'Error understood', explanation: 'Aggregates without loose columns.' },
        6: { label: 'Average with context', explanation: 'Extremes before the average.' },
      },
    },
    concepts: {
      count_rows: { title: 'COUNT(*)', summary: 'Counts rows; with WHERE, only those that meet the condition.' },
      count_column: { title: 'COUNT(column) and COUNT(DISTINCT)', summary: "COUNT(col) doesn't count NULL; COUNT(DISTINCT col) counts distinct values." },
      sum_avg: { title: 'SUM and AVG', summary: 'Sum and average of the rows the WHERE lets through; they ignore NULLs.' },
      round: { title: 'ROUND', summary: 'Rounds the result to the decimals requested.' },
      min_max: { title: 'MIN and MAX', summary: 'The smallest and the largest value, also for dates and text.' },
      aggregate_rows: { title: 'One aggregate, one row', summary: "Without GROUP BY, aggregates return one row: they don't mix with loose columns." },
      average_outliers: { title: 'The average and the extremes', summary: 'A few extreme values move the average a lot.' },
    },
    seniorTips: [
      'Read the aggregates cheat sheet in the wiki.',
      'Inés: SELECT COUNT(*) FROM clientes.',
      "Marta: SELECT SUM(saldo) FROM cuentas WHERE estado = 'activa'.",
      "Diego: SELECT ROUND(AVG(importe), 2) FROM transferencias WHERE estado = 'completada'.",
      'Carmen: SELECT MIN(importe) AS minimo, MAX(importe) AS maximo FROM transferencias.',
      'Laura: SELECT COUNT(*) AS total, COUNT(concepto) AS con_concepto FROM transferencias.',
      'Marta: SELECT COUNT(DISTINCT ciudad) FROM clientes.',
      'With Inés: aggregates without loose columns; the average is inflated by the extremes.',
    ],
    lessons: {
      count: {
        question: 'How do I count rows?',
        body: `\`SELECT COUNT(*) FROM clientes;\`

It returns **one row with one figure**. Combine it with \`WHERE\` to count only some:

\`SELECT COUNT(*) FROM clientes WHERE ciudad = 'Madrid';\`

Give it an alias so the column isn't called “count”: \`COUNT(*) AS clientes\`.`,
      },
      count_column: {
        question: 'Are COUNT(*) and COUNT(column) the same?',
        body: `No:

- \`COUNT(*)\` counts **rows**.
- \`COUNT(concepto)\` counts the rows where \`concepto\` is **not NULL**.
- \`COUNT(DISTINCT ciudad)\` counts the **distinct values** (without NULL).

That is why \`COUNT(*) - COUNT(concepto)\` tells you how many transfers have no description.`,
      },
      sum_avg: {
        question: 'How do I add up or take the average?',
        body: `- \`SUM(saldo)\`: sum.
- \`AVG(importe)\`: average.

\`SELECT SUM(saldo) AS total FROM cuentas WHERE estado = 'activa';\`

The \`WHERE\` is applied **before** adding: only the rows that meet it go in. Both functions **ignore NULLs**: they don't count as zero.`,
      },
      round: {
        question: 'How do I get rid of so many decimals?',
        body: `\`ROUND(value, decimals)\`:

\`SELECT ROUND(AVG(importe), 2) AS media FROM transferencias;\`

Without the second number it rounds to an integer. Round **at the end**, on the result: if you round each row before adding, the total may not add up.`,
      },
      min_max: {
        question: 'How do I get the smallest and the largest value?',
        body: `\`SELECT MIN(importe) AS minimo, MAX(importe) AS maximo FROM transferencias;\`

They work with numbers, dates (the oldest and the most recent) and text (the first and last in alphabetical order). You can put several aggregates in the same \`SELECT\`.`,
      },
      one_row: {
        question: "Why can't I ask for nombre and COUNT(*) at the same time?",
        body: `Without \`GROUP BY\`, a query with aggregates returns **a single row** that summarizes all of them. A loose column like \`nombre\` has many values, and they don't fit in one row:

\`SELECT nombre, COUNT(*) FROM clientes;\` → error.

Either everything in the \`SELECT\` is aggregated, or you group with \`GROUP BY\` (the next mission).`,
      },
      outliers: {
        question: 'Can I always trust the average?',
        body: `The average is very sensitive to **extreme values**: four transfers of €12,000 raise the average of all of them from about €430 to €893.

Before giving an average:

- look at \`MIN\` and \`MAX\`;
- compare with the average without the extremes (with a \`WHERE\`);
- if you are after “the typical”, the **median** usually describes it better. In PostgreSQL: \`percentile_cont(0.5) WITHIN GROUP (ORDER BY importe)\`.`,
      },
    },
    quiz: {
      pre: {
        s4pre_count: {
          question: 'What does `SELECT COUNT(*) FROM clientes` return?',
          options: ['All the rows of clientes', 'One row with the number of customers', 'The number of columns', 'An error'],
          explanation: 'An aggregate summarizes all the rows into one.',
        },
        s4pre_count_col: {
          question: 'There are 120 transfers and 9 have no description. What does `COUNT(concepto)` return?',
          options: ['120', '111', '9', 'NULL'],
          explanation: "COUNT(column) doesn't count NULLs.",
        },
        s4pre_sum: {
          question: 'How do you add up the balance of the active accounts?',
          options: ["SELECT SUM(saldo) FROM cuentas WHERE estado = 'activa'", 'SELECT saldo + saldo FROM cuentas', 'SELECT TOTAL saldo FROM cuentas', 'SELECT SUM(*) FROM cuentas WHERE activa'],
          explanation: 'SUM(column) with the WHERE that chooses the rows.',
        },
        s4pre_round: {
          question: 'What does `ROUND(956.987, 2)` return?',
          options: ['956.98', '956.99', '957', '956.987'],
          explanation: 'It rounds to 2 decimals.',
        },
        s4pre_minmax: {
          question: 'What does `MAX(fecha_alta)` return?',
          options: ['The oldest date', 'The most recent date', 'The number of dates', 'An error: MAX only works with numbers'],
          explanation: 'MAX with dates gives the most recent.',
        },
        s4pre_mix: {
          question: 'Why does `SELECT nombre, COUNT(*) FROM clientes` fail?',
          options: ['COUNT needs a column', 'It mixes a loose column with an aggregate without GROUP BY', 'A WHERE is missing', "nombre doesn't exist"],
          explanation: 'The aggregate returns one row; nombre has many values.',
        },
      },
      post: {
        s4post_count: {
          question: 'How do you count the customers in Madrid?',
          options: ["SELECT COUNT(*) FROM clientes WHERE ciudad = 'Madrid'", 'SELECT COUNT(Madrid) FROM clientes', "SELECT * FROM clientes WHERE COUNT = 'Madrid'", "COUNT clientes WHERE ciudad = 'Madrid'"],
          explanation: 'COUNT(*) counts the rows the WHERE lets through.',
        },
        s4post_distinct: {
          question: 'How do you count in how many distinct cities there are customers?',
          options: ['COUNT(ciudad)', 'COUNT(DISTINCT ciudad)', 'DISTINCT COUNT(*)', 'SUM(ciudad)'],
          explanation: 'COUNT(DISTINCT column) counts distinct values.',
        },
        s4post_avg_null: {
          question: 'Balances 100, 200 and NULL. What does `AVG(saldo)` return?',
          options: ['100', '150', 'NULL', '0'],
          explanation: 'AVG ignores NULLs: (100 + 200) / 2.',
        },
        s4post_outliers: {
          question: 'Almost all transfers are under €900, but the average is €893. What is going on?',
          options: ['There is an error in AVG', 'A few very high amounts inflate the average', 'The average is always the most common value', 'Transfers are missing'],
          explanation: 'The average is sensitive to extremes: look at MIN, MAX and the median.',
        },
        s4post_minmax: {
          question: 'Can you ask for `MIN(importe)` and `MAX(importe)` in the same query?',
          options: ['No, you need one query per aggregate', 'Yes, separated by a comma in the SELECT', 'Only with GROUP BY', 'Only with UNION'],
          explanation: 'Several aggregates fit in the same SELECT.',
        },
        s4post_round: {
          question: 'Where do you put the ROUND to give the average with 2 decimals?',
          options: ['ROUND(AVG(importe), 2)', 'AVG(ROUND(importe))', 'AVG(importe, 2)', 'ROUND(importe) AVG'],
          explanation: 'You round the result, at the end.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Friday: from lists to figures',
        body: "Last day of the week!\n\nUntil now you returned rows. But many questions don't want a list, they want **a figure**: how many customers, how much money, what is the average. That's what **aggregate functions** are for: `COUNT`, `SUM`, `AVG`, `MIN` and `MAX`. They summarize many rows into one.\n\nTo start, the simplest one:\n\n- **How many customers do we have?** A single figure.\n\nInés",
      },
      ines_ok: { body: 'Forty. Notice: one row, one column. `COUNT(*)` counts rows, whatever they contain.' },
      marta_saldo: { body: "Hi! For Monday's committee I need the **total balance** of the **active** accounts. Just one figure." },
      marta_saldo_thanks: { body: 'Almost €400,000. I will note it down just like that. Thanks!' },
      diego_media: {
        body: "Hey. I'm sizing the new payments engine: what is the **average amount** of the **completed** transfers? Rounded to **2 decimals**, please.",
      },
      diego_thanks: { body: '€956.99. Higher than I thought… I will ask you about it later.' },
      ines_mezcla: {
        subject: "11:00 · Inés: “It gives me an error and I don't know why”",
        body: "**Inés:** Nuria wanted to see how many customers there are and, while at it, their names:\n\n`SELECT nombre, COUNT(*) FROM clientes;`\n\nAnd she gets: “The column “clientes.nombre” must be in the GROUP BY or inside an aggregate function”. How do you explain it to her?",
        choices: {
          aggmix: {
            text: "`COUNT(*)` summarizes the 40 rows into **one**, but `nombre` has 40 different values: PostgreSQL doesn't know which to put in that single row. Either ask for just the figure, or get the names in another query. If she wants a count per group, that's `GROUP BY`.",
            reply: "Perfect. An aggregate without GROUP BY returns a single row, so the other columns also have to be aggregated. On Monday we'll see GROUP BY.",
            effects: { 2: { text: 'Without GROUP BY, an aggregate returns one row: it does not mix with loose columns.' } },
          },
          distinct: {
            text: 'It is missing a DISTINCT in front of nombre.',
            reply: 'There would still be many names for a single row. The problem is mixing a loose column with an aggregate.',
            effects: { 0: { text: 'DISTINCT does not fix mixing columns with aggregates.' } },
          },
          twice: {
            text: 'Tell her to run it twice; sometimes the first time fails.',
            reply: "The error says exactly what's wrong: read it. It's the query, not luck.",
            effects: { 0: { text: 'You ignored the error message.' } },
          },
        },
      },
      carmen_extremos: {
        body: 'For the quarterly report I need the amount of the **smallest** transfer and of the **largest** one, in two columns called `minimo` and `maximo`.',
      },
      carmen_thanks: { body: 'From €6.90 to €15,700. A huge gap. Thanks.' },
      laura_conceptos: {
        body: 'Hi. For the statement test I want two figures in one row: the **total** number of transfers and how many **have a description**. Columns `total` and `con_concepto`.',
      },
      laura_thanks: { body: "120 and 111: nine without a description, like yesterday. It adds up. Good catch that COUNT(concepto) doesn't count NULLs!" },
      marta_ciudades: { body: 'Last one of the day: in **how many distinct cities** do we have customers? One figure.' },
      marta_ciudades_thanks: { body: 'Seven. Have a good weekend!' },
      ines_media: {
        subject: '15:00 · Inés: “Is the typical transfer €900?”',
        body: "**Inés:** Marta wants to put on a slide: “The typical transfer at Kobalto is €893”, which is the average of all of them. But if you look at the data, almost all of them are between €5 and €900. What do you recommend to her?",
        choices: {
          outliers: {
            text: "That the average is inflated by four transfers of more than €12,000. I'd look at MIN and MAX, also calculate the average without those four (about €430) and tell her that “typical” isn't the average: either she explains it, or she uses the median.",
            reply: 'Very good. The average is very sensitive to extreme values. Before giving an average, look at MIN and MAX.',
            effects: { 3: { text: 'A few extreme values move the average a lot: look at MIN and MAX before giving it.' } },
          },
          round: {
            text: 'That she should round it to €900, it looks cleaner.',
            reply: "Rounding doesn't change the problem: the typical transfer is not €900.",
            effects: { 0: { text: 'You rounded a figure that was telling something else.' } },
          },
          ok: {
            text: "That the average is the average; if it comes out €893, it's €893.",
            reply: 'The number is right, but the sentence is not: “typical” suggests the usual, and the usual is about €400.',
            effects: { 0: { text: 'You accepted an average distorted by a few values.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the week with Inés',
        body: "**Inés:** First week done. You can already get columns, filter, sort, deal with NULLs and give figures. What are you taking away from today?",
        choices: {
          lesson: {
            text: "That COUNT(*) counts rows and COUNT(column) only those that are not NULL, that SUM, AVG, MIN and MAX summarize many rows into one, that they don't mix with loose columns and that before giving an average I look at the extremes.",
            reply: 'Very good. On Monday: figures by group, with GROUP BY. Have a good weekend!',
          },
          calc: {
            text: "That it's safer to export the rows and add them up with a calculator.",
            reply: 'With 120 rows, maybe. With 40 million, no. Check the debrief.',
            effects: { 0: { text: 'You came away with calculating outside the database.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support', laura: 'QA Lead' }),
)
