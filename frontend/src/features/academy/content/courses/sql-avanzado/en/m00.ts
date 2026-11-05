import { m00Jerarquias } from '../m00-jerarquias'
import { COMMON_EN, missionEn } from './missionEn'

const RECURSIVE = { 0: { message: 'This task is solved with a recursive query: `WITH RECURSIVE …`.' } }

/** Course 7: Advanced SQL · Mission 0 — Who reports to whom. English version of ../m00-jerarquias.ts. */
export const m00JerarquiasEn = missionEn(m00Jerarquias, {
  ...COMMON_EN,
  title: 'Who reports to whom',
  subtitle: 'WITH RECURSIVE: hierarchies, chains of command, paths and cycles.',
  dayLabel: 'Monday · month 3',
  verdicts: {
    good: {
      title: 'Trees walked from end to end',
      body: 'Marta has her invitation tree, Carmen her approval chain, Nuria the org chart with paths, Diego the full teams and Laura the import cycle found. And no query was left spinning.',
    },
    ok: { title: 'Recursive queries, halfway there', body: 'You already walk hierarchies, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Hierarchies by hand, level by level', body: 'Several tasks were left undone. Replay the mission with the recursive queries cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 3 · Who reports to whom',
    paragraphs: [
      'Your third month at Kobalto begins. JOINs and windows are no longer enough: today the data is shaped like a tree. Employees with their boss, customers who invite other customers.',
      'A JOIN goes down one level; to go down all of them, a recursive query. Each task is done when your query, with `WITH RECURSIVE`, returns exactly what is asked.',
    ],
    goals: [
      'Write a recursive query: initial part, UNION ALL and recursive part.',
      'Go down a hierarchy calculating the level of each row.',
      'Go up the chain of command to the root.',
      'Build the full path of each node.',
      'Count everything below each node, not just the direct ones.',
      'Protect the recursive query against cycles.',
    ],
  },
  docs: {
    chuleta_recursivas: {
      title: 'Cheat sheet: recursive queries',
      updatedLabel: 'Inés Moreno · Data',
      body: `## New tables
- \`empleados\` (employees): id, nombre, puesto, departamento, \`jefe_id\` (boss → empleados.id; empty for the CEO), salario, alta.
- \`invitaciones\` (invitations): \`cliente_id\` (the invited customer), \`invitado_por\` (who invited them), invitado_en.

## Shape
\`\`\`
WITH RECURSIVE arbol AS (
  SELECT …                       -- 1. initial part: the starting point
  UNION ALL
  SELECT …                       -- 2. recursive part: joins the table with «arbol»
  FROM empleados e JOIN arbol a ON e.jefe_id = a.id
)
SELECT … FROM arbol;
\`\`\`
PostgreSQL repeats part 2 with the new rows of the previous round until none comes out.

## Down or up
| I want | Join |
|---|---|
| The ones who report to X (down) | \`e.jefe_id = a.id\` |
| The bosses of X (up) | \`e.id = a.jefe_id\` |

## Columns carried along
- Level: \`1\` in the initial part, \`a.nivel + 1\` in the recursive one.
- Path: \`nombre\` in the initial part, \`a.ruta || ' > ' || e.nombre\` in the recursive one.

## Cycles
If the data has a cycle, the recursive query never ends. Keep the visited nodes (\`ARRAY[id]\`, \`ruta || id\`, \`NOT id = ANY(ruta)\`) or use \`CYCLE column SET es_ciclo USING ruta\`.`,
    },
  },
  sqlLab: {
    starter:
      "-- Everyone who reports to Raúl (id 6), at any level\nWITH RECURSIVE equipo AS (\n  SELECT id, nombre, 1 AS nivel\n  FROM empleados\n  WHERE jefe_id = 6\n  UNION ALL\n  SELECT e.id, e.nombre, q.nivel + 1\n  FROM empleados e\n  JOIN equipo q ON e.jefe_id = q.id\n)\nSELECT * FROM equipo;",
    retos: {
      organigrama: {
        title: "Raúl's whole team",
        description: '`id`, `nombre` and `nivel` of **every** employee who reports to Raúl Ortega (id 6), directly or indirectly. `nivel` = 1 for his direct reports.',
        hint: 'Initial part: the ones with `jefe_id = 6` and `1 AS nivel`. Recursive part: `empleados e JOIN equipo q ON e.jefe_id = q.id` with `q.nivel + 1`.',
        requires: RECURSIVE,
      },
      arbol_invitaciones: {
        title: "Customer 1's invitation tree",
        description: '`cliente_id` and `generacion` of all the customers who arrived **thanks to customer 1**, directly or indirectly (`generacion` = 1 for the ones they invited).',
        hint: 'Initial part: `invitaciones WHERE invitado_por = 1`. Recursive part: the ones invited by someone in the tree, `i.invitado_por = a.cliente_id`.',
        requires: RECURSIVE,
      },
      cadena_aprobacion: {
        title: "Víctor's approval chain",
        description: '`nivel`, `id`, `nombre` and `puesto` of Víctor Peña (id 28) and **all his bosses** up to the CEO, **sorted by `nivel`** (0 = Víctor, 1 = his direct boss…).',
        hint: 'This time you go up: initial part `WHERE id = 28` with `0 AS nivel`; recursive part `JOIN cadena c ON e.id = c.jefe_id` (carry `jefe_id` along). At the end, `ORDER BY nivel`.',
        requires: RECURSIVE,
      },
      rutas: {
        title: 'The org chart with paths',
        description: '`id` and `ruta` of **each** employee, with the path from the CEO separated by ` > ` (for example, `Beatriz Sáez > Lucía Herrero > Nuria Vidal`).',
        hint: "Initial part: the CEO (`jefe_id IS NULL`) with `nombre AS ruta`. Recursive part: `r.ruta || ' > ' || e.nombre`, joining `e.jefe_id = r.id`.",
        requires: RECURSIVE,
      },
      equipo_total: {
        title: 'How many people each boss has',
        description: '`id`, `nombre` and `equipo_total` of each employee who has someone below them: the number of people who report to them **at any level**.',
        hint: 'A recursive query of (boss, person) pairs: the initial part with each `jefe_id` and `id`; the recursive one goes down a level keeping the same boss. Then `GROUP BY` the boss and `COUNT(*)`.',
        requires: RECURSIVE,
      },
      ciclos: {
        title: 'Customers caught in a cycle',
        description: 'One column `cliente_id` with the customers who, following who invited them, **come back to themselves** (a cycle in `invitaciones`). The query has to end: protect it against cycles.',
        hint: 'Carry the path: `ARRAY[cliente_id]` in the initial part and `ruta || i.cliente_id` in the recursive one, mark `i.cliente_id = ANY(ruta)` as a cycle and stop when it is one. Or use `CYCLE invitado_por SET es_ciclo USING ruta`.',
        requires: RECURSIVE,
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'The top ambassadors prize falls short', explanation: "Marta only counted customer 1's direct invitees, not all their descendants.", technique: 'A recursive query going down, with a generation.' },
    'C-CARMEN': { title: 'An expense is approved without going through the whole chain', explanation: 'Without the full chain, the approval stopped at the direct boss.', technique: 'A recursive query going up to the root.' },
    'C-NURIA': { title: 'The intranet org chart comes out flat', explanation: "Nuria didn't have each person's path.", technique: 'Carrying a text path in the recursive query.' },
    'C-DIEGO': { title: 'Boss permissions only see the direct reports', explanation: 'Diego counted the teams with a one-level JOIN.', technique: '(boss, person) pairs at any level.' },
    'C-LAURA': { title: 'The referral fees calculation hangs every night', explanation: 'Nobody found the 36 ↔ 39 cycle from the import.', technique: 'Path of visited nodes or CYCLE.' },
    'C-CICLO': { title: 'A recursive report brings down the data console', explanation: 'An unprotected recursive query entered the cycle and never ended.', technique: 'Path of visited nodes, CYCLE or a depth limit.' },
    'C-DIRECCION': { title: 'A team report shows the bosses instead of the reports', explanation: 'The join of the recursive part was the wrong way round.', technique: 'Down: e.jefe_id = a.id; up: e.id = a.jefe_id.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Monday's tasks.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's ambassadors", explanation: "Customer 1's whole tree." },
      1: { label: "Carmen's approval", explanation: 'The full chain up to the CEO.' },
      2: { label: "Nuria's org chart", explanation: 'One path per person.' },
      3: { label: "Diego's permissions", explanation: 'Teams at any level.' },
      4: { label: "Laura's import", explanation: 'The 36 ↔ 39 cycle, found.' },
      5: { label: 'Recursive queries that end', explanation: 'Protection against cycles.' },
      6: { label: 'Recursive queries in the right direction', explanation: 'Down or up, on purpose.' },
    },
  },
  concepts: {
    recursive_cte: { title: 'WITH RECURSIVE', summary: 'Initial part UNION ALL recursive part: it repeats with the new rows until none comes out.' },
    recursive_levels: { title: 'Levels', summary: 'A column that starts at 1 (or 0) and adds 1 each round: the depth of each row.' },
    recursive_up: { title: 'Going up the hierarchy', summary: 'Joining e.id = a.jefe_id takes each node to its parent, up to the root.' },
    recursive_path: { title: 'Paths', summary: 'Carrying a text or an array that grows each round: the path from the root.' },
    recursive_aggregate: { title: 'Counting everything below', summary: '(boss, person) pairs at any level and then GROUP BY.' },
    recursive_cycles: { title: 'Cycles', summary: 'With a cycle the recursive query never ends: path of visited nodes, CYCLE or a depth limit.' },
    recursive_direction: { title: 'The direction of the join', summary: 'Down: e.jefe_id = a.id. Up: e.id = a.jefe_id. The wrong way round, you get another tree.' },
  },
  seniorTips: [
    'Read the recursive queries cheat sheet in the wiki.',
    'Inés: initial jefe_id = 6 with 1 AS nivel; recursive empleados e JOIN equipo q ON e.jefe_id = q.id with q.nivel + 1.',
    'Marta: initial invitaciones WHERE invitado_por = 1; recursive i.invitado_por = a.cliente_id with a.generacion + 1.',
    'Carmen: initial WHERE id = 28 with 0 AS nivel, carrying jefe_id; recursive e.id = c.jefe_id; ORDER BY nivel.',
    "Nuria: initial the CEO with nombre AS ruta; recursive r.ruta || ' > ' || e.nombre.",
    'Diego: (jefe_id, id) pairs and the recursive part goes down keeping the boss; GROUP BY boss and COUNT(*).',
    'Laura: ARRAY[cliente_id] AS ruta, ruta || i.cliente_id, i.cliente_id = ANY(ruta) as the cycle and WHERE NOT ciclo.',
    'With Inés: protect the recursive query against cycles, and check which way the join goes.',
  ],
  lessons: {
    basic: {
      question: 'What is a recursive query?',
      body: `A \`WITH\` that uses itself. It has two parts joined by \`UNION ALL\`:

\`\`\`
WITH RECURSIVE equipo AS (
  SELECT id, nombre FROM empleados WHERE jefe_id = 6     -- initial
  UNION ALL
  SELECT e.id, e.nombre
  FROM empleados e JOIN equipo q ON e.jefe_id = q.id      -- recursive
)
SELECT * FROM equipo;
\`\`\`

PostgreSQL runs the initial part, then the recursive one with those rows, then again with the new rows… until a round returns nothing. A normal JOIN goes down **one** level; the recursive query goes down **all** of them.`,
    },
    levels: {
      question: 'How do I know which level each row is at?',
      body: `Carry a column that grows each round:

\`\`\`
SELECT id, nombre, 1 AS nivel FROM empleados WHERE jefe_id = 6
UNION ALL
SELECT e.id, e.nombre, q.nivel + 1
FROM empleados e JOIN equipo q ON e.jefe_id = q.id
\`\`\`

The columns of both parts have to match in number and type, as in any UNION. If one part gives \`integer\` and the other \`bigint\`, or one \`varchar\` and the other \`text\`, cast the initial one (\`::text\`).`,
    },
    up: {
      question: 'And to go up to the top boss?',
      body: `You turn the join around: from each row, to the employee whose \`id\` is its \`jefe_id\`.

\`\`\`
WITH RECURSIVE cadena AS (
  SELECT id, nombre, jefe_id, 0 AS nivel FROM empleados WHERE id = 28
  UNION ALL
  SELECT e.id, e.nombre, e.jefe_id, c.nivel + 1
  FROM empleados e JOIN cadena c ON e.id = c.jefe_id
)
SELECT nivel, id, nombre FROM cadena ORDER BY nivel;
\`\`\`

To join with the boss you have to **carry** \`jefe_id\` in both parts. It ends by itself at the CEO, who has no boss.`,
    },
    path: {
      question: 'How do I build the full path?',
      body: `Like the level, but with text:

\`\`\`
SELECT id, nombre AS ruta FROM empleados WHERE jefe_id IS NULL
UNION ALL
SELECT e.id, r.ruta || ' > ' || e.nombre
FROM empleados e JOIN rutas r ON e.jefe_id = r.id
\`\`\`

With an array (\`ARRAY[id]\` and \`r.ruta || e.id\`) the path also tells you where you have been: it is the basis for detecting cycles.`,
    },
    aggregate: {
      question: 'How do I count everyone who reports to each boss?',
      body: `Generate every (boss, person) pair at any level and then group:

\`\`\`
WITH RECURSIVE bajo AS (
  SELECT jefe_id AS jefe, id AS persona FROM empleados WHERE jefe_id IS NOT NULL
  UNION ALL
  SELECT b.jefe, e.id FROM empleados e JOIN bajo b ON e.jefe_id = b.persona
)
SELECT jefe, COUNT(*) AS equipo_total FROM bajo GROUP BY jefe;
\`\`\`

The recursive part goes down from each person, but **keeps the boss** of the initial pair.`,
    },
    cycles: {
      question: 'What happens if there is a cycle?',
      body: `If A points to B and B to A, each round finds new rows and the recursive query **never ends**. Three defences:

- **Path of visited nodes**: carry \`ARRAY[id]\`, mark \`id = ANY(ruta)\` as a cycle and don't go on from there (\`WHERE NOT ciclo\`).
- **CYCLE** (PostgreSQL 14+): \`… ) CYCLE column SET es_ciclo USING ruta\` does the same by itself.
- **Depth limit**: \`WHERE nivel < 20\` in the recursive part, as a safety net.

In the console, an endless recursive query cuts itself off after a few seconds with a warning.`,
    },
    direction: {
      question: 'How do I know whether I am going down or up?',
      body: `Look at which column of the table joins with which column of the CTE:

| Join | Goes towards |
|---|---|
| \`e.jefe_id = a.id\` | The ones who report to the rows of \`a\` (down) |
| \`e.id = a.jefe_id\` | The boss of each row of \`a\` (up) |

If the result brings people you don't expect (bosses instead of reports), the join is the wrong way round. Check with a known case: Raúl has 4 direct reports.`,
    },
  },
  quiz: {
    pre: {
      a0pre_basic: { question: 'What joins the two parts of a recursive query?', options: ['JOIN', 'UNION ALL (or UNION)', 'WHERE', 'GROUP BY'], explanation: 'Initial part UNION ALL recursive part.' },
      a0pre_end: { question: 'When does a recursive query end?', options: ['After 10 rounds', 'When a round returns no new rows', 'When it reaches the table', 'Never'], explanation: 'It repeats while rows come out.' },
      a0pre_levels: { question: 'To know the depth of each row…', options: ['ROW_NUMBER()', 'A column that starts at 1 and adds 1 in the recursive part', 'COUNT(*)', "You can't"], explanation: 'It is carried along each round.' },
      a0pre_up: { question: 'To go up from an employee to their boss, the recursive part joins…', options: ['e.jefe_id = c.id', 'e.id = c.jefe_id', 'e.id = c.id', 'e.jefe_id = c.jefe_id'], explanation: "The boss is the employee whose id is the row's jefe_id." },
      a0pre_cycles: { question: '36 invited 39 and 39 invited 36. What does an unprotected recursive query following the invitations do?', options: ['It returns two rows', 'It never ends', 'It gives a syntax error', 'It ignores the cycle'], explanation: 'Each round finds a new row.' },
      a0pre_path: { question: 'How is the path from the root built?', options: ["Carrying r.ruta || ' > ' || e.nombre", 'With GROUP BY', 'With ORDER BY', 'With LAG'], explanation: 'The path grows each round.' },
    },
    post: {
      a0post_basic: { question: 'What advantage does a recursive query have over chaining JOINs?', options: ['None', 'It reaches every level without knowing how many there are', 'It is always shorter', 'It needs no tables'], explanation: 'With JOINs you would have to write one per level.' },
      a0post_levels: { question: 'The initial part gives `1 AS nivel` (integer) and the recursive one `q.nivel + 1`. How many rows of level 1 are there if you select the ones with jefe_id = 6?', options: ['One', 'The ones who report directly to Raúl', 'All of them', 'None'], explanation: 'Level 1 = direct reports.' },
      a0post_up: { question: 'Going up from Víctor, why does the recursive query end?', options: ['Because of the ORDER BY', "Because the CEO has no boss and the next round finds no rows", 'Because of the LIMIT', 'Because there is a cycle'], explanation: "A NULL jefe_id doesn't join with anyone." },
      a0post_aggregate: { question: 'To count the reports of each boss at any level…', options: ['COUNT per jefe_id', '(boss, person) pairs with a recursive query and GROUP BY boss', 'A CROSS JOIN', 'A window'], explanation: 'COUNT per jefe_id only counts the direct ones.' },
      a0post_cycles: { question: 'Which of these protects a recursive query against a cycle?', options: ['ORDER BY', 'NOT id = ANY(ruta) carrying the path', 'DISTINCT in the final query', 'LIMIT at the end'], explanation: 'Or CYCLE, or a depth limit.' },
      a0post_direction: { question: "You wanted Raúl's reports and Jorge and Beatriz come out. What's going on?", options: ['Data is missing', 'The join of the recursive part goes up: you have to join e.jefe_id = q.id', 'A DISTINCT is missing', 'There is a cycle'], explanation: 'e.id = q.jefe_id goes up.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: 'Month 3: data shaped like a tree',
      body: "Welcome to your third month!\n\nUntil now, a JOIN was enough to join a row with its match. But some data forms **trees**: each employee has a boss, who has another boss… In the replica you have two new tables: **`empleados`** (employees, with `jefe_id`, their boss) and **`invitaciones`** (who invited whom in \"invite a friend\").\n\nA JOIN goes down one level. To go down all of them, a **recursive query**: `WITH RECURSIVE`.\n\nTo start:\n\n- **Raúl Ortega**'s whole team (id 6), at any level: `id`, `nombre` and `nivel` (1 = reports to him directly).\n\nInés",
    },
    ines_ok: {
      body: 'Eight people: four direct reports, three at level 2 and Víctor, the intern, at level 3. With JOINs you would have had to write one JOIN per level… and know how many levels there are.',
    },
    marta_invitaciones: {
      body: 'Hi! We are going to reward the best "invite a friend" ambassadors. I want **all the customers who arrived thanks to customer 1**: the ones they invited, the ones those invited, and so on. `cliente_id` and `generacion` (1 = invited directly by customer 1).',
    },
    marta_thanks: { body: 'Fifteen customers over four generations! I only saw their three direct invitees. Customer 1 takes the prize.' },
    carmen_cadena: {
      body: 'Hi. Compliance: an expense from Víctor Peña (id 28) has to go through **all his bosses** up to the CEO. I need the chain: `nivel` (0 = Víctor, 1 = his direct boss…), `id`, `nombre` and `puesto`, **sorted by level**.',
    },
    carmen_thanks: { body: 'Six people, from Víctor to Beatriz. The approval should have gone through Laura and Raúl: now I can prove it. Thanks.' },
    ines_ciclo: {
      subject: '11:00 · Inés: "The console never finishes"',
      body: "**Inés:** Diego wanted to see customer 36's invitation chain and wrote:\n\n`WITH RECURSIVE r AS (SELECT cliente_id, invitado_por, 1 AS n FROM invitaciones WHERE cliente_id = 36 UNION ALL SELECT r.cliente_id, i.invitado_por, n + 1 FROM r JOIN invitaciones i ON i.cliente_id = r.invitado_por) SELECT * FROM r;`\n\nThe console kept thinking and in the end cut the query off for \"too many intermediate rows\". What happened?",
      choices: {
        guard: {
          text: 'There is a **cycle**: 36 was invited by 39 and 39 by 36. Each round finds a "new" row (with another `n`) and the recursive query never ends. It has to be protected: carry the path of visited customers and stop when one repeats (`NOT … = ANY(ruta)`), or use `CYCLE`, and as a safety net a depth limit.',
          reply: "Exactly. In production nobody cuts it off: it stays there hogging the server. Any recursive query over data you don't control needs protection against cycles.",
          effects: { 2: { text: 'With data that may have cycles, a path of visited nodes, CYCLE or a depth limit.' } },
        },
        union: {
          text: 'That he should change `UNION ALL` to `UNION`, which removes repeats.',
          reply: "With the `n` column, each row is different from the previous one: UNION sees no repeats and still doesn't end. It would only help if the rows were identical.",
          effects: { 0: { text: "UNION doesn't stop a cycle if the rows carry a level or a path." } },
        },
        console: {
          text: 'That the console has a very low limit: he should ask for more memory.',
          reply: 'With more memory it would take longer to be cut off, nothing else. The query never ends because the data has a cycle.',
          effects: { 0: { text: "You blamed the limit for a query that couldn't end." } },
        },
      },
    },
    nuria_rutas: {
      body: 'Hi. For the customer support intranet I want the **org chart with paths**: for **each** employee, their `id` and their `ruta` from the CEO, with the names separated by ` > ` (like `Beatriz Sáez > Lucía Herrero > Nuria Vidal`).',
    },
    nuria_thanks: { body: "Twenty-eight paths. The longest is Víctor's, with six names. Thanks!" },
    diego_equipos: {
      body: 'Hey. In the internal app a boss has to be able to see the requests of **everyone** who reports to them, not just their direct reports. To size it: `id`, `nombre` and `equipo_total` of each employee who has someone below them.',
    },
    diego_thanks: { body: 'Twelve bosses, and Beatriz with twenty-seven below her. I had only counted direct reports: Raúl had four and there are actually eight. Thanks!' },
    laura_ciclos: {
      body: "Hi. The nightly referral fees calculation hangs and I suspect the last import of `invitaciones`. Are there customers who, following who invited them, **come back to themselves**? One column `cliente_id`. And make sure your query ends, please.",
    },
    laura_thanks: { body: "36 and 39, inviting each other. I'm opening a bug for the import and another one so the table doesn't accept cycles. Thanks!" },
    ines_direccion: {
      subject: '15:00 · Inés: "Does Raúl have the CEO on his team?"',
      body: "**Inés:** Diego prepared another version of Raúl's team:\n\n`WITH RECURSIVE equipo AS (SELECT id, nombre FROM empleados WHERE id = 6 UNION ALL SELECT e.id, e.nombre, e.jefe_id … JOIN equipo q ON e.id = q.jefe_id) …`\n\nAnd he gets Raúl, Jorge and Beatriz. What do you tell him?",
      choices: {
        direction: {
          text: "That the join goes **up**: `e.id = q.jefe_id` looks for the boss of each row, so it climbs from Raúl to Jorge and to Beatriz. To go down you have to join `e.jefe_id = q.id` (the employees whose boss is already in the team). And to check it with something he knows: Raúl has four direct reports.",
          reply: "That's it. The recursive query does exactly what you tell it, in the direction you tell it. It's always worth checking against a case you know.",
          effects: { 3: { text: 'Down: e.jefe_id = a.id. Up: e.id = a.jefe_id. And check against a known case.' } },
        },
        data: {
          text: "That the table's `jefe_id` values must be loaded wrong.",
          reply: "The data is fine: Raúl's org chart came out perfect this morning. What changes is the join.",
          effects: { 0: { text: 'You blamed the data for a join the wrong way round.' } },
        },
        filter: {
          text: 'That he should filter out Jorge and Beatriz with a `WHERE id NOT IN (1, 2)`.',
          reply: 'It would remove those two rows, but none of his reports would come out. The problem is the direction.',
          effects: { 0: { text: 'You patched the result instead of fixing the query.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Inés',
      body: '**Inés:** Today you walked trees. What are you taking away?',
      choices: {
        lesson: {
          text: 'That a recursive query has an initial part and a recursive one joined by `UNION ALL`; that by carrying columns I get the level or the path; that the direction of the join decides whether I go down or up; that to count everything below I generate pairs; and that with data that may have cycles I have to protect it.',
          reply: "Very good. Tomorrow, the window functions you didn't see last month: frames, first, last and nth.",
        },
        joins: {
          text: 'That with three or four JOINs in a row you reach almost every level.',
          reply: 'Until someone adds one more level to the org chart. Check the debrief.',
          effects: { 0: { text: 'You came away with chaining JOINs instead of a recursive query.' } },
        },
      },
    },
  },
})
