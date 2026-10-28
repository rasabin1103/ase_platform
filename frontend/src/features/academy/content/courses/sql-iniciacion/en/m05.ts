import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m05Agrupar } from '../m05-agrupar'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 5 — Grouping. English version of ../m05-agrupar.ts. */
export const m05AgruparEn = missionEn(
  m05Agrupar,
  {
    title: 'Grouping',
    subtitle: 'GROUP BY and HAVING: one figure per group.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Monday · week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Reports by group',
        body: 'Diego has his dashboard, Marta her figures by type and her offices, Nuria her reasons and Carmen her ownership control. And the segments report adds up to the 40 customers.',
      },
      ok: { title: 'You group, but something slipped through', body: 'You already use GROUP BY, although a task or a trap fell by the wayside. Check the debrief.' },
      bad: { title: 'Groups left undone', body: 'Several tasks were left undone. Replay the mission: GROUP BY, HAVING and WHERE before grouping.' },
    },
    briefing: {
      title: 'Week 2 · Grouping',
      paragraphs: [
        'Monday of the second week. On Friday you gave one figure for the whole table; today the team wants one figure per group: by city, by status, by type, by reason.',
        'The tasks compare rows, so the order does not matter unless it is asked for. The columns, in the order they are requested.',
      ],
      goals: [
        'Group with GROUP BY and combine with COUNT, SUM and AVG.',
        'Put only grouped columns and aggregates in the SELECT.',
        'Filter rows with WHERE before grouping and groups with HAVING afterwards.',
        "Don't hide the NULL group.",
      ],
    },
    docs: {
      chuleta_grupos: {
        title: 'Cheat sheet: GROUP BY and HAVING',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Shape
\`\`\`
SELECT group_column, AGGREGATE(...)
FROM table
WHERE condition_on_rows
GROUP BY group_column
HAVING condition_on_groups
ORDER BY ...;
\`\`\`

## Rules
- In the SELECT: GROUP BY columns and aggregates. Nothing else.
- WHERE filters rows **before**; HAVING filters groups **after** (and can use aggregates).
- NULLs form their own group.
- Several columns in the GROUP BY = one group per combination.`,
      },
    },
    sqlLab: {
      starter: '-- One row per group\nSELECT ciudad, COUNT(*) AS clientes\nFROM clientes\nGROUP BY ciudad;',
      retos: {
        por_ciudad: {
          title: 'Customers per city',
          description: 'How many customers there are **in each city**. Columns `ciudad` and `clientes`.',
          hint: '`SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad`.',
        },
        por_estado: {
          title: 'Transfers by status',
          description: 'For each status: the `estado`, **how many** transfers there are and the **total amount**. Three columns, in that order.',
          hint: '`SELECT estado, COUNT(*), SUM(importe) FROM transferencias GROUP BY estado`.',
        },
        por_tipo: {
          title: 'Accounts by type',
          description: 'For each account type: the `tipo`, the **number of accounts** and the **average balance** rounded to 2 decimals.',
          hint: '`COUNT(*)` and `ROUND(AVG(saldo), 2)`, grouping by `tipo`.',
        },
        abiertas_motivo: {
          title: 'Open incidents by reason',
          description: 'Only the **open** incidents, grouped **by reason**: `motivo` and how many there are.',
          hint: 'First keep the open rows (`WHERE cerrada_en IS NULL`) and then group by `motivo`.',
        },
        ciudades_grandes: {
          title: 'Cities with more than 4 customers',
          description: '`ciudad` and number of `clientes` of the cities with **more than 4 customers**.',
          hint: 'Group by city and filter the groups with `HAVING COUNT(*) > 4`.',
        },
        multicuenta: {
          title: 'Customers with more than one account',
          description: '`cliente_id` and **how many accounts** they have, only for customers with **more than one**.',
          hint: 'In the `cuentas` table: group by `cliente_id` and use `HAVING COUNT(*) > 1`.',
        },
      },
    },
    bugs: {
      'C-PANEL': { title: 'The transfers dashboard comes out empty', explanation: "Diego didn't receive the figures by status.", technique: 'GROUP BY with COUNT and SUM.' },
      'C-CAMPANA': {
        title: 'The savings campaign is designed without figures by type',
        explanation: "Marta didn't receive the number of accounts or the average balance by type.",
        technique: 'GROUP BY with ROUND(AVG(…)).',
      },
      'C-NURIA': {
        title: "Customer support doesn't know which reason to tackle first",
        explanation: "Nuria didn't receive the open incidents by reason.",
        technique: 'WHERE before GROUP BY.',
      },
      'C-OFICINAS': {
        title: 'The offices are planned without knowing where the customers are',
        explanation: "Marta didn't receive the cities with more than 4 customers.",
        technique: 'HAVING on COUNT(*).',
      },
      'C-TITULARES': {
        title: 'The ownership control is left undone',
        explanation: "Carmen didn't receive the customers with several accounts.",
        technique: 'GROUP BY cliente_id HAVING COUNT(*) > 1.',
      },
      'C-HAVING': {
        title: 'Diego filters groups by hand in a spreadsheet',
        explanation: 'Without HAVING, groups are filtered outside the database.',
        technique: 'HAVING for groups, WHERE for rows.',
      },
      'C-SEGMENTOS': {
        title: 'The segments report adds up to 38 customers instead of 40',
        explanation: 'The NULL group was hidden or mistaken for a fault.',
        technique: 'Label the NULL group with COALESCE.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "What happened with Monday's reports.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: "Diego's dashboard", explanation: 'Figures by status.' },
        1: { label: 'Figures by type', explanation: 'Number and average balance.' },
        2: { label: "Nuria's reasons", explanation: 'WHERE and then GROUP BY.' },
        3: { label: 'New offices', explanation: 'HAVING COUNT(*) > 4.' },
        4: { label: 'Ownership', explanation: 'Customers with several accounts.' },
        5: { label: 'HAVING in the query', explanation: 'No filtering by hand.' },
        6: { label: 'Complete segments', explanation: 'The NULL group, labelled.' },
      },
    },
    concepts: {
      group_by: { title: 'GROUP BY', summary: 'Gathers the rows with the same value and calculates the aggregates of each group.' },
      group_select: { title: 'What goes in the SELECT', summary: 'GROUP BY columns and aggregates; nothing else.' },
      having: { title: 'HAVING', summary: 'Filters groups after grouping; it can use aggregates.' },
      where_vs_having: { title: 'WHERE versus HAVING', summary: 'WHERE filters rows before grouping; HAVING, groups after.' },
      group_null: { title: 'The NULL group', summary: 'NULLs form their own group: label it instead of hiding it.' },
    },
    seniorTips: [
      'Read the GROUP BY cheat sheet in the wiki.',
      'Inés: SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad.',
      'Diego: SELECT estado, COUNT(*), SUM(importe) FROM transferencias GROUP BY estado.',
      'Marta: SELECT tipo, COUNT(*), ROUND(AVG(saldo), 2) FROM cuentas GROUP BY tipo.',
      'Nuria: … FROM incidencias WHERE cerrada_en IS NULL GROUP BY motivo.',
      'Marta: … GROUP BY ciudad HAVING COUNT(*) > 4.',
      'Carmen: SELECT cliente_id, COUNT(*) FROM cuentas GROUP BY cliente_id HAVING COUNT(*) > 1.',
      'With Inés: HAVING for groups; the NULL group is labelled, not hidden.',
    ],
    lessons: {
      group_by: {
        question: 'How do I get one figure per group?',
        body: `With \`GROUP BY\` and the column that defines the groups:

\`SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad;\`

PostgreSQL gathers the rows with the same city and calculates the \`COUNT(*)\` of each group. Result: **one row per city**.`,
      },
      select: {
        question: 'Which columns can I put in the SELECT?',
        body: `Only two things:

- the columns that are in the \`GROUP BY\`;
- aggregates (\`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\`, \`MAX\`).

\`SELECT ciudad, nombre, COUNT(*) … GROUP BY ciudad\` gives an error: there are many names in a group. You can group by several columns: \`GROUP BY ciudad, segmento\` gives one row for each combination.`,
      },
      having: {
        question: 'How do I keep only some groups?',
        body: `With \`HAVING\`, after the \`GROUP BY\`:

\`SELECT ciudad, COUNT(*) FROM clientes GROUP BY ciudad HAVING COUNT(*) > 4;\`

\`HAVING\` is like a \`WHERE\` for groups: it can use aggregates.`,
      },
      where_having: {
        question: 'WHERE or HAVING?',
        body: `- \`WHERE\` filters **rows**, before grouping. It cannot use aggregates.
- \`HAVING\` filters **groups**, after grouping.

They can be combined:

\`\`\`
SELECT motivo, COUNT(*) AS abiertas
FROM incidencias
WHERE cerrada_en IS NULL      -- only open rows
GROUP BY motivo
HAVING COUNT(*) > 1;          -- only reasons with more than one
\`\`\`

Order: \`SELECT\` → \`FROM\` → \`WHERE\` → \`GROUP BY\` → \`HAVING\` → \`ORDER BY\` → \`LIMIT\`.`,
      },
      null_group: {
        question: 'What happens with NULLs when grouping?',
        body: `All the NULLs in the column form **a group of their own**. The result has a row with an empty cell.

Don't hide it without thinking: they are real rows. Label it:

\`SELECT COALESCE(segmento, 'sin segmento') AS segmento, COUNT(*) FROM clientes GROUP BY segmento;\``,
      },
    },
    quiz: {
      pre: {
        s5pre_group: {
          question: 'What does `SELECT ciudad, COUNT(*) FROM clientes GROUP BY ciudad` return?',
          options: ['One row with the total number of customers', 'One row per city with its customers', 'All the rows sorted by city', 'An error'],
          explanation: 'GROUP BY gives one row per group.',
        },
        s5pre_select: {
          question: 'Why does `SELECT ciudad, nombre, COUNT(*) FROM clientes GROUP BY ciudad` fail?',
          options: ['A WHERE is missing', 'nombre is neither in the GROUP BY nor aggregated', 'COUNT needs a column', 'You cannot group by text'],
          explanation: 'In the SELECT, only grouped columns or aggregates.',
        },
        s5pre_having: {
          question: 'How do you keep the cities with more than 4 customers?',
          options: ['WHERE COUNT(*) > 4', 'HAVING COUNT(*) > 4', 'LIMIT 4', 'GROUP BY ciudad > 4'],
          explanation: 'Groups are filtered with HAVING.',
        },
        s5pre_where_having: {
          question: 'What does WHERE filter in a query with GROUP BY?',
          options: ['The groups, after grouping', 'The rows, before grouping', 'The columns', 'Nothing: WHERE cannot be used with GROUP BY'],
          explanation: 'WHERE acts on rows before grouping.',
        },
        s5pre_multi: {
          question: '`GROUP BY ciudad, segmento` returns…',
          options: ['One row per city', 'One row per segment', 'One row for each combination of city and segment', 'An error'],
          explanation: 'Grouping by several columns forms one group per combination.',
        },
        s5pre_null: {
          question: 'When grouping by segment, what happens to the customers without a segment?',
          options: ['They disappear', 'They form their own group (NULL)', "They're added to “estandar”", 'They give an error'],
          explanation: 'NULLs form a group of their own.',
        },
      },
      post: {
        s5post_group: {
          question: 'How do you get the total transfer amount by status?',
          options: ['SELECT estado, SUM(importe) FROM transferencias GROUP BY estado', 'SELECT SUM(importe) FROM transferencias WHERE estado', 'SELECT estado, importe FROM transferencias GROUP BY importe', 'SELECT SUM(estado) FROM transferencias'],
          explanation: 'Group column + aggregate + GROUP BY.',
        },
        s5post_order: {
          question: 'Which is the correct order?',
          options: ['SELECT, FROM, GROUP BY, WHERE, HAVING', 'SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY', 'SELECT, FROM, HAVING, GROUP BY, WHERE', 'SELECT, GROUP BY, FROM, WHERE'],
          explanation: 'WHERE before GROUP BY; HAVING after; ORDER BY at the end.',
        },
        s5post_having: {
          question: 'Seven cities: two with more than 4 customers and five with exactly 4. How many rows does `HAVING COUNT(*) > 4` give?',
          options: ['7', '5', '2', '0'],
          explanation: '“More than 4” leaves out those with 4.',
        },
        s5post_where_having: {
          question: 'You want the open incidents by reason. Where does `cerrada_en IS NULL` go?',
          options: ['In the HAVING', 'In the WHERE', 'In the GROUP BY', 'In the SELECT'],
          explanation: 'It is a condition on rows: WHERE, before grouping.',
        },
        s5post_null: {
          question: 'A report by segment has an empty row with 2 customers. What do you do?',
          options: ['Delete it from the report', 'Label it with COALESCE: they are real customers without a segment', 'Put a 0', 'Check the GROUP BY because it is failing'],
          explanation: 'It is a real group; hiding it makes the total not add up.',
        },
        s5post_select: {
          question: 'Can a column that is in the GROUP BY go in the SELECT?',
          options: ['Yes', 'No, only aggregates', 'Only if it is inside COUNT', 'Only with DISTINCT'],
          explanation: 'Grouped columns have one value per group.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Week 2: figures by group',
        body: "Good morning and welcome to week 2!\n\nOn Friday you gave one figure for the whole table. Today you give **one figure per group**: customers **per city**, amount **per status**, accounts **per type**. That is `GROUP BY`.\n\nTo start:\n\n- **How many customers there are in each city.** Two columns: `ciudad` and `clientes`.\n\nInés",
      },
      ines_ok: {
        body: 'Seven rows, one per city. That is the idea: `GROUP BY ciudad` gathers the rows with the same city and `COUNT(*)` counts those in each group. And now `ciudad` can go in the SELECT, because it is in the GROUP BY.',
      },
      diego_estado: {
        body: 'Hi. For the transfers service dashboard I need, **for each status**: the `estado`, **how many** transfers there are and the **total amount**.',
      },
      diego_thanks: { body: '103 completed, 10 pending and 7 rejected. Just what I needed for the dashboard. Thanks!' },
      marta_tipo: { body: 'Hi! Can you get me, **by account type**, the `tipo`, the **number of accounts** and the **average balance** rounded to 2 decimals?' },
      marta_tipo_thanks: { body: 'Savings accounts have on average four times more balance than checking ones. It helps me for the campaign. Thanks!' },
      ines_having: {
        subject: "11:00 · Inés: “It won't let me filter the COUNT”",
        body: "**Inés:** Diego wanted the cities with more than 4 customers and wrote:\n\n`SELECT ciudad, COUNT(*) FROM clientes WHERE COUNT(*) > 4 GROUP BY ciudad;`\n\nError: aggregates cannot be used in the WHERE. How do you explain it to him?",
        choices: {
          having: {
            text: 'The WHERE is applied to each row **before** grouping, when there is no COUNT yet. To filter the groups once counted there is `HAVING`, which goes after the GROUP BY: `GROUP BY ciudad HAVING COUNT(*) > 4`.',
            reply: 'Exactly. WHERE filters rows, HAVING filters groups. And you can use both in the same query.',
            effects: { 2: { text: 'WHERE filters rows before grouping; HAVING filters groups after.' } },
          },
          order: {
            text: 'He has to put the WHERE after the GROUP BY.',
            reply: 'That gives a syntax error. After the GROUP BY, the filter is called HAVING.',
            effects: { 0: { text: 'Moving the WHERE does not help: to filter groups there is HAVING.' } },
          },
          two: {
            text: 'Do it in two steps: get the table and then look by hand at the ones above 4.',
            reply: 'With seven cities it works; with seven thousand, no. HAVING does it in the same query.',
            effects: { 0: { text: 'You were going to filter by hand what HAVING does.' } },
          },
        },
      },
      nuria_motivos: {
        body: "Hi. For the team meeting I want the **open** incidents grouped **by reason**: `motivo` and how many **open** ones there are of each. I'm not interested in the closed ones.",
      },
      nuria_thanks: { body: '“Cambio de datos” has three open. Now I know where to start. Thanks!' },
      marta_grandes: { body: "We're going to open offices in the cities with **more than 4 customers**. Which ones are they? `ciudad` and number of `clientes`." },
      marta_grandes_thanks: { body: 'Madrid and Barcelona. The others have exactly 4: “more than 4” leaves them out. Good!' },
      carmen_multicuenta: { body: 'For the ownership control I need the customers with **more than one account**: `cliente_id` and **how many accounts** they have.' },
      carmen_thanks: { body: 'Thirteen customers with two accounts each. None with more: good. Thanks.' },
      ines_nullgroup: {
        subject: '15:00 · Inés: “There is a segment with no name”',
        body: "**Inés:** Marta has grouped the customers by segment:\n\n`SELECT segmento, COUNT(*) FROM clientes GROUP BY segmento;`\n\nShe gets estandar, premium, joven… and a fourth row with the segment **blank** and a 2. She asks whether it is a fault. What do you tell her?",
        choices: {
          nullgroup: {
            text: "It's not a fault: GROUP BY gathers all the NULLs into a group of their own. They are last week's two customers with no segment. For the report, she should label it with `COALESCE(segmento, 'sin segmento')` instead of removing it, because those two customers exist.",
            reply: "That's it. That group is information: hiding it would make the total not match the 40 customers.",
            effects: { 3: { text: 'GROUP BY creates a group for the NULLs: label it, do not hide it.' } },
          },
          hide: {
            text: 'She should add `WHERE segmento IS NOT NULL` and remove that row, it looks ugly.',
            reply: "Then the report will add up to 38 customers instead of 40, and nobody will know why. Better to label them.",
            effects: { 0: { text: 'You hid a real group and the total no longer adds up.' } },
          },
          bug: {
            text: "It's a GROUP BY fault with text.",
            reply: 'GROUP BY does exactly what it should: NULLs form their own group.',
            effects: { 0: { text: "You blamed GROUP BY for the data's NULLs." } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the day with Inés',
        body: '**Inés:** Today you made real reports, by group. What are you taking away?',
        choices: {
          lesson: {
            text: 'That GROUP BY gives one row per group, that in the SELECT only grouped columns and aggregates go, that WHERE filters rows before and HAVING groups after, and that NULLs form their own group.',
            reply: "Perfect. With this you have everything for a single table. Tomorrow: joining tables with JOIN.",
          },
          many: {
            text: "That it's easier to write one query with a WHERE for each city.",
            reply: 'Seven queries today, seventy tomorrow. GROUP BY does it in one. Check the debrief.',
            effects: { 0: { text: 'You came away with repeating queries instead of grouping.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support', laura: 'QA Lead' }),
)
