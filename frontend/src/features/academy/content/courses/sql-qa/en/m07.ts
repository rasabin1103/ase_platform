import { m07Estados } from '../m07-estados'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 8: SQL for QA · Mission 7 — States and transitions. English version of ../m07-estados.ts. */
export const m07EstadosEn = missionEn(m07Estados, {
  ...COMMON_EN,
  title: 'States and transitions',
  subtitle: "Each order's history against its current state and against the allowed transitions.",
  dayLabel: 'Wednesday · month 4, week 2',
  verdicts: {
    good: {
      title: 'Every order, the way it should go',
      body: "You found the orders whose state isn't their history's, the forbidden jumps, the order stuck for days, the one that doesn't start at creada, the one without history and the ones that take more than an hour. And with LAG properly partitioned and a fixed reference date.",
    },
    ok: { title: 'States half reviewed', body: 'You already test states with SQL, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'The orders still do as they please', body: 'Several tasks were left undone and the state jumps are still there. Replay the mission with the cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · States and transitions',
    paragraphs: [
      'Wednesday. Payment orders go through states: creada (created), pendiente (pending) and, at the end, completada (completed), rechazada (rejected) or cancelada (cancelled). Each change is stored in `ordenes_historial`, and `transiciones_validas` says which steps are allowed.',
      'The test data snapshot is from **2 March 2026 at 12:00**. Each task is done when the query returns exactly the rows and columns asked for.',
    ],
    goals: [
      "Get each order's last state from its history.",
      'Rebuild each step with LAG, order by order.',
      'Compare the steps with the table of valid transitions.',
      'Find stuck orders with a fixed reference date.',
      "Find orders without history or that don't start where they should.",
      'Measure how long each order takes from one state to another.',
    ],
  },
  docs: {
    chuleta_estados: {
      title: 'Payment orders: states and transitions',
      updatedLabel: 'Diego Ruiz · Backend',
      body: `## Tables
- \`ordenes(id, cliente_id, importe, estado, creada_en)\`: the **current state**.
- \`ordenes_historial(id, orden_id, estado, cambiado_en)\`: **every** state change, with its time.
- \`transiciones_validas(desde, hasta)\`: the allowed steps (from, to).

## Rules
1. Every order starts at **creada** and has a history.
2. Every step in the history is in \`transiciones_validas\`.
3. The state in \`ordenes\` is the **last** one in its history.
4. An order must not stay **pendiente** for more than **48 hours**.
5. From creada to its final state, **60 minutes** at most.

## Reference date
The test data is a snapshot from **2026-03-02 12:00**. Use it as "now": \`now()\` is the date of the day you run it.`,
    },
  },
  sqlLab: {
    starter: "-- An order's history\nSELECT *\nFROM ordenes_historial\nWHERE orden_id = 4\nORDER BY cambiado_en;",
    retos: {
      estado_distinto: {
        title: "Orders whose state isn't their history's",
        description: 'Among the orders with history, those whose state in `ordenes` is **different** from the **last** one in their history: `id`, `estado` and `ultimo`.',
        hint: '`SELECT DISTINCT ON (orden_id) orden_id, estado FROM ordenes_historial ORDER BY orden_id, cambiado_en DESC` gives you the last one; join it to `ordenes` and compare.',
      },
      transiciones_invalidas: {
        title: "Steps that aren't allowed",
        description: 'Each step in the history (from one state to the **next** one of the same order, by time) that is **not** in `transiciones_validas`: `orden_id`, `desde` and `hasta`.',
        hint: '`LAG(estado) OVER (PARTITION BY orden_id ORDER BY cambiado_en) AS desde` and `NOT EXISTS (SELECT 1 FROM transiciones_validas v WHERE v.desde = t.desde AND v.hasta = t.hasta)`, without the first row of each order.',
        requires: { 0: { message: 'Each order has its own history: `LAG(…) OVER (PARTITION BY orden_id ORDER BY cambiado_en)`.' } },
      },
      atascadas: {
        title: 'Orders stuck in pendiente',
        description: 'The orders that are **still pending** and whose last change was **more than 48 hours** before the reference date (**2026-03-02 12:00**): `id` and `pendiente_desde`.',
        hint: "`WHERE o.estado = 'pendiente'`, `GROUP BY o.id` and `HAVING MAX(h.cambiado_en) < TIMESTAMP '2026-03-02 12:00' - INTERVAL '48 hours'`.",
        forbid: { 0: { message: "With `now()` the result depends on the day you run it. Use the reference date: `TIMESTAMP '2026-03-02 12:00'`." } },
      },
      sin_creada: {
        title: "Orders that don't start at creada",
        description: "The orders whose **first** history state (by time) is **not** `creada`: `orden_id` and `estado` (the first one they have).",
        hint: "`SELECT DISTINCT ON (orden_id) orden_id, estado FROM ordenes_historial ORDER BY orden_id, cambiado_en` and drop the ones that start at `'creada'`.",
      },
      sin_historial: {
        title: 'Orders without history',
        description: 'The orders that have **not a single row** in `ordenes_historial`: `id` and `estado`.',
        hint: '`FROM ordenes o WHERE NOT EXISTS (SELECT 1 FROM ordenes_historial h WHERE h.orden_id = o.id)`.',
      },
      lentas: {
        title: 'Orders that take more than an hour',
        description: 'The orders that take **more than 60 minutes** from `creada` to their final state (`completada`, `rechazada` or `cancelada`), according to the history: `orden_id` and `minutos`.',
        hint: "`MIN(cambiado_en) FILTER (WHERE estado = 'creada')`, `MAX(cambiado_en) FILTER (WHERE estado IN ('completada', 'rechazada', 'cancelada'))`, the subtraction in a `HAVING … > INTERVAL '60 minutes'` and `EXTRACT(EPOCH FROM …) / 60` for the minutes.",
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'A completed order goes back to pending and is charged twice', explanation: 'Nobody checked the history steps against the allowed transitions.', technique: 'LAG per order + NOT EXISTS in transiciones_validas.' },
    'C-CARMEN': { title: 'A customer waits a week for a pending order', explanation: 'Nobody was looking for stuck orders.', technique: 'Pending orders with their last change before the reference date − 48 h.' },
    'C-NURIA': { title: "Customer Service can't explain where an order comes from", explanation: 'Its history starts at pendiente: the creation is missing.', technique: 'The first state of each history.' },
    'C-DIEGO': { title: 'A completed order leaves no trace', explanation: 'The state was changed without writing to the history.', technique: 'NOT EXISTS: orders without a single history row.' },
    'C-INES': { title: 'The service agreement is breached without anyone knowing', explanation: 'Seven orders took more than an hour and nobody was measuring it.', technique: 'Duration between states with FILTER.' },
    'C-LAG': { title: "The transitions test gives 25 failures that don't exist", explanation: "LAG without PARTITION BY compares an order's last state with the next order's first one.", technique: "PARTITION BY the entity whose history you're walking." },
    'C-AHORA': { title: 'The stuck-orders test changes its result every day', explanation: 'It used now() on a fixed data snapshot: today every pending order looks stuck.', technique: 'A fixed reference date in tests.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: 'What happened with the payment orders.',
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's charges", explanation: 'Only allowed steps.' },
      1: { label: "Carmen's customers", explanation: 'No stuck orders.' },
      2: { label: "Nuria's creations", explanation: 'All start at creada.' },
      3: { label: "Diego's trace", explanation: 'All with history.' },
      4: { label: "Inés's times", explanation: 'Durations measured.' },
      5: { label: 'LAG per order', explanation: 'PARTITION BY.' },
      6: { label: 'Reference date', explanation: 'No now().' },
    },
  },
  concepts: {
    ultimo_estado: { title: 'The last state', summary: 'DISTINCT ON (key) … ORDER BY key, date DESC: one row per entity, the most recent one.' },
    lag: { title: 'LAG per entity', summary: 'LAG(estado) OVER (PARTITION BY orden_id ORDER BY cambiado_en): the previous state of the same order.' },
    transiciones: { title: 'Valid transitions', summary: "Each (from, to) pair in the history is looked up in the table of allowed steps; what isn't there is a defect." },
    atasco: { title: 'Stuck states', summary: 'Entities that stay in an intermediate state for longer than allowed.' },
    referencia: { title: 'Reference date', summary: 'In tests on a data snapshot, "now" is a fixed date, not now().' },
    huerfanas: { title: 'Entities without history', summary: "NOT EXISTS: what should have a trace and doesn't." },
    duraciones: { title: 'Durations between states', summary: 'MIN/MAX with FILTER per state and the subtraction of timestamps; EXTRACT(EPOCH …) to turn it into minutes.' },
  },
  seniorTips: [
    'Read the state rules and the reference date in the wiki.',
    'Laura: DISTINCT ON (orden_id) … ORDER BY orden_id, cambiado_en DESC and compare it with ordenes.estado.',
    'Marta: LAG with PARTITION BY orden_id and NOT EXISTS in transiciones_validas.',
    "Carmen: pending orders with MAX(cambiado_en) < TIMESTAMP '2026-03-02 12:00' - INTERVAL '48 hours'.",
    "Nuria: DISTINCT ON by ascending time and the ones that don't start at creada.",
    'Diego: ordenes NOT EXISTS in ordenes_historial.',
    'Inés: MAX and MIN with FILTER per state, the subtraction and EXTRACT(EPOCH …) / 60.',
    'With Laura: LAG partitioned by order and a reference date instead of now().',
  ],
  lessons: {
    ultimo_estado: {
      question: "How do I get each order's last state?",
      body: `With \`DISTINCT ON\`: one row per order, the first one according to the ORDER BY.

\`\`\`
SELECT DISTINCT ON (orden_id) orden_id, estado
FROM ordenes_historial
ORDER BY orden_id, cambiado_en DESC;
\`\`\`

The ORDER BY has to start with the same column as the DISTINCT ON. With \`cambiado_en\` ascending you get the **first** one. (In other databases: \`ROW_NUMBER() OVER (PARTITION BY orden_id ORDER BY cambiado_en DESC) = 1\`.)`,
    },
    lag: {
      question: 'How do I see each step of the history?',
      body: `\`LAG\` gives you the value of the previous row. With \`PARTITION BY\`, the previous one **of the same order**:

\`\`\`
SELECT orden_id,
       LAG(estado) OVER (PARTITION BY orden_id ORDER BY cambiado_en) AS desde,
       estado AS hasta
FROM ordenes_historial;
\`\`\`

The first row of each order has \`desde\` NULL: it isn't a step. Without PARTITION BY, an order's last state becomes the "from" of the next one.`,
    },
    transiciones: {
      question: 'How do I check that each step is allowed?',
      body: `With the steps in a subquery, looking up each pair in the transitions table:

\`\`\`
SELECT orden_id, desde, hasta
FROM (…steps with LAG…) t
WHERE desde IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM transiciones_validas v
                  WHERE v.desde = t.desde AND v.hasta = t.hasta);
\`\`\`

Zero rows: every order followed the flow. Each row is a jump, a step back or a repeated step.`,
    },
    atasco: {
      question: 'How do I find stuck orders?',
      body: `The ones that are **still** in an intermediate state and whose last change is before the limit:

\`\`\`
SELECT o.id, MAX(h.cambiado_en) AS pendiente_desde
FROM ordenes o JOIN ordenes_historial h ON h.orden_id = o.id
WHERE o.estado = 'pendiente'
GROUP BY o.id
HAVING MAX(h.cambiado_en) < TIMESTAMP '2026-03-02 12:00' - INTERVAL '48 hours';
\`\`\`

A pending order from last night isn't stuck yet; one from a week ago is.`,
    },
    referencia: {
      question: 'Why not use now()?',
      body: `Because the test data is a **snapshot** of a specific day, and \`now()\` is the day you run it. Today, with \`now()\`, **every** pending order looks stuck, and tomorrow the result changes again: the test isn't repeatable.

In tests, "now" is a fixed value: \`TIMESTAMP '2026-03-02 12:00'\` (or a parameter). That way the same query gives the same today and a year from now.`,
    },
    huerfanas: {
      question: "What if an order doesn't have a history?",
      body: `Then no query that starts from the history will see it: neither the last-state one nor the transitions one. You have to look for it from \`ordenes\`:

\`\`\`
SELECT o.id, o.estado
FROM ordenes o
WHERE NOT EXISTS (SELECT 1 FROM ordenes_historial h WHERE h.orden_id = o.id);
\`\`\`

An order without history is a state change someone made without leaving a trace.`,
    },
    duraciones: {
      question: 'How do I measure how long an order takes?',
      body: `With aggregates filtered by state, in a single pass:

\`\`\`
SELECT orden_id,
       EXTRACT(EPOCH FROM
         MAX(cambiado_en) FILTER (WHERE estado IN ('completada', 'rechazada', 'cancelada'))
       - MIN(cambiado_en) FILTER (WHERE estado = 'creada')) / 60 AS minutos
FROM ordenes_historial
GROUP BY orden_id;
\`\`\`

Subtracting two timestamps gives an INTERVAL; \`EXTRACT(EPOCH …)\` turns it into seconds. If one of the two states is missing, the result is NULL and the order doesn't come out in a \`> 60\`.`,
    },
  },
  quiz: {
    pre: {
      q7pre_ultimo: { question: '`DISTINCT ON (orden_id) … ORDER BY orden_id, cambiado_en DESC`. Which row comes out for each order?', options: ['The first one', 'The most recent one', 'A random one', 'All of them'], explanation: 'The ORDER BY decides which.' },
      q7pre_lag: { question: 'What does `LAG(estado)` return on the first row of each partition?', options: ['The same state', 'NULL', 'The last state', 'An error'], explanation: "There's no previous row." },
      q7pre_part: { question: '`LAG(estado) OVER (ORDER BY cambiado_en)` without PARTITION BY. What happens?', options: ['Nothing', 'It mixes states from different orders', 'It gives an error', 'It orders by orden_id'], explanation: 'You need PARTITION BY orden_id.' },
      q7pre_trans: { question: 'How do you detect a step that is not allowed?', options: ['Counting states', 'Looking up each (from, to) pair in the table of valid transitions', 'Looking at the last state', 'With a CHECK'], explanation: 'NOT EXISTS.' },
      q7pre_ref: { question: 'The test data is from 2 March. What do you use as "now"?', options: ['now()', "TIMESTAMP '2026-03-02 12:00'", 'CURRENT_DATE', "It doesn't matter"], explanation: "The snapshot's date." },
      q7pre_huerf: { question: 'An order has no history. Does a query that starts from `ordenes_historial` find it?', options: ['Yes', 'No', "Only if it's completed", 'Only with LAG'], explanation: 'You have to start from ordenes.' },
    },
    post: {
      q7post_now: { question: 'A stuck-orders test with `now()` on a data snapshot from months ago. What does it return?', options: ['The stuck ones', 'Every pending order', 'None', 'An error'], explanation: 'They all look old.' },
      q7post_null: { question: 'Why `desde IS NOT NULL` when looking for steps that are not allowed?', options: ['For performance', "Because each order's first row isn't a step", 'Because NULL is a state', "It isn't needed"], explanation: 'Without it, every creation would be a failure.' },
      q7post_atasco: { question: 'An order pending for 16 hours, with a 48-hour limit. Is it stuck?', options: ['Yes', 'No, not yet', 'It depends on the amount', 'Only if it has no history'], explanation: "It's still within the deadline." },
      q7post_filter: { question: "What does `MIN(cambiado_en) FILTER (WHERE estado = 'creada')` do?", options: ["Filters the query's rows", 'Calculates the minimum only over the rows in state creada', 'Gives an error', 'Counts the created ones'], explanation: 'The FILTER only affects that aggregate.' },
      q7post_vuelta: { question: 'An order goes from completada to pendiente. What does the transitions test detect?', options: ['Nothing', 'The step completada → pendiente', 'Only the last state', "That it's stuck"], explanation: "It isn't in transiciones_validas." },
      q7post_ultimo: { question: 'What do you check the state in the `ordenes` table against?', options: ['Against the first state in the history', 'Against the last state in its history', 'Against transiciones_validas', 'Against nothing'], explanation: 'They must match.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: 'Payment orders and their states',
      body: "Good morning.\n\nToday it's the payment order flow. Each state change is stored in `ordenes_historial` and the rules are in the wiki. The data snapshot is from 2 March at 12:00.\n\nTo start:\n\n- Among the orders with history, those whose state in `ordenes` is **different** from the **last** one in their history: `id`, `estado` and `ultimo`.\n\nLaura",
    },
    laura_ok: { body: '4 says completada and its history ends at pendiente; 11 says rechazada and its history, completada. Two orders lying about themselves.' },
    marta_transiciones: {
      body: 'Hi! The flow is creada → pendiente → completada, rechazada or cancelada, and it\'s in `transiciones_validas`. Which history steps are **not** allowed? `orden_id`, `desde` and `hasta`.',
    },
    marta_thanks: { body: '4 goes back to pending after being completed (it could be charged twice!), 7 skips pendiente and 10 repeats pendiente. I\'m opening three incidents. Thanks!' },
    carmen_atascadas: {
      body: 'Hi. An order shouldn\'t stay pending for more than 48 hours. With the snapshot date (2 March, 12:00), which ones have been pending for longer? `id` and `pendiente_desde`.',
    },
    carmen_thanks: { body: "16, pending since 25 February. 19 is from last night, it's still within the deadline. Thanks." },
    laura_lag: {
      subject: '11:00 · Laura: "25 invalid transitions"',
      body: '**Laura:** Rubén did the same transitions test with `LAG(estado) OVER (ORDER BY cambiado_en)` and he gets **25** invalid steps, almost all "completada → creada". What\'s wrong with it?',
      choices: {
        particion: {
          text: 'That without **PARTITION BY orden_id**, LAG takes the previous row **of the whole table**: one order\'s last state becomes the "from" of the next one. Those "completada → creada" are the border between two orders, not a failure. The history is walked order by order.',
          reply: "That's it. Twenty-five false alarms hide the three real ones.",
          effects: { 2: { text: "LAG with PARTITION BY the history's entity." } },
        },
        excluir: {
          text: 'That he should remove the "completada → creada" ones with a `WHERE` and that\'s it.',
          reply: 'That covers up the symptom: borders like "rechazada → creada" or "pendiente → creada" would still come out, and a real one could stay hidden.',
          effects: { 0: { text: 'You filtered the false positives instead of fixing the LAG.' } },
        },
        datos: {
          text: "That the test data is wrong: there are too many failures.",
          reply: "The data is fine. It's the query that compares different orders.",
          effects: { 0: { text: 'You blamed the data for a query error.' } },
        },
      },
    },
    nuria_inicio: {
      body: "Hi. A customer is asking about an order and, in the history, I can't see when it was created. Which orders **don't start** at `creada`? `orden_id` and `estado` (the first one they have).",
    },
    nuria_thanks: { body: "20, which starts directly at pendiente. Now I know why I couldn't find the creation. Thanks!" },
    diego_historial: {
      body: "Hey. There's a closing process that changes the orders' state directly in `ordenes`. I'm afraid some don't have a history. Which ones have **not a single row** in `ordenes_historial`? `id` and `estado`.",
    },
    diego_thanks: { body: "21: completed and without a trace. None of the other tests saw it because they all start from the history. I'll fix it. Thanks!" },
    ines_lentas: {
      body: 'Hi. The service agreement says an order reaches its final state within **60 minutes** at most from its creation. Which ones take longer, according to the history? `orden_id` and `minutos`.',
    },
    ines_thanks: { body: 'Seven orders, between 65 and 85 minutes. Nobody was measuring it. Thanks.' },
    laura_ahora: {
      subject: '15:00 · Laura: "today they\'re all stuck"',
      body: "**Laura:** Rubén's automated stuck-orders test uses `now() - INTERVAL '48 hours'`. Yesterday, in his environment, it gave one. Today it gives **both** pending orders, and last night's isn't stuck. What would you change?",
      choices: {
        referencia: {
          text: 'That the test data is a **snapshot** from 2 March, and `now()` is the day it runs: each day the result is different. The test has to use a **fixed reference date** (the snapshot\'s, or a parameter), so it gives the same today and a year from now.',
          reply: "Exactly. A test that depends on the clock isn't repeatable.",
          effects: { 3: { text: 'A fixed reference date instead of now().' } },
        },
        margen: {
          text: 'That he should raise the limit to a week so fewer come out.',
          reply: "With that you stop seeing the real one… and in a month they'll all come out again.",
          effects: { 0: { text: 'You changed the rule so the test passes.' } },
        },
        recargar: {
          text: 'That he should reload the data every morning so it is up to date.',
          reply: 'Data that changes every day makes the test even less repeatable. The date is what has to stay still.',
          effects: { 0: { text: 'You tried to move the data instead of fixing the date.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Laura',
      body: '**Laura:** Twenty-one orders, seven with something odd. What are you taking away?',
      choices: {
        lesson: {
          text: "That states are tested against their history: the current state is the history's last one, each step (with LAG per order) is in the valid transitions, everything starts where it should, nothing stays stuck (with a fixed reference date, not now()), everything has a trace and durations are measured.",
          reply: "Very good. Tomorrow, the database's own rules: constraints and triggers.",
        },
        actual: {
          text: "That it's enough to check each order's current state.",
          reply: "The current state doesn't tell how it got there: today, five of the seven problems were along the way. Check the debrief.",
          effects: { 0: { text: 'You came away with only the current state.' } },
        },
      },
    },
  },
})
