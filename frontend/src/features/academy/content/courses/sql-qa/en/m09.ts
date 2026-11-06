import { m09Rendimiento } from '../m09-rendimiento'
import { COMMON_EN, missionEn } from './missionEn'

/** Course 8: SQL for QA · Mission 9 — Performance regressions. English version of ../m09-rendimiento.ts. */
export const m09RendimientoEn = missionEn(m09Rendimiento, {
  ...COMMON_EN,
  title: 'Performance regressions',
  subtitle: 'Two versions face to face: time per call, calls per request, indexes and estimates.',
  dayLabel: 'Friday · month 4, week 2',
  verdicts: {
    good: {
      title: 'Version 1.9, measured',
      body: "You found the two queries that are slower per call, the two that are called dozens of times per request, the two new ones, where the time goes, the two missing indexes and the plans that estimate badly. And without confusing \"more total time\" with \"slower\".",
    },
    ok: { title: 'Performance half measured', body: 'You already compare versions with SQL, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Version 1.9 goes out as it is', body: 'Several tasks were left undone and the new version reaches production slower. Replay the mission with the cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Performance regressions',
    paragraphs: [
      "Friday. Version 1.9 of the app goes out on Monday. In the performance environment the same load test was run with **1.8** and with **1.9**, and every query was recorded in `log_consultas`. Today QA says whether 1.9 is slower, and why.",
      'Each task is done when the query returns exactly the rows and columns asked for.',
    ],
    goals: [
      'Compare the mean time per call between versions.',
      'Normalise per request to find queries that are called too often (N+1).',
      "Find the version's new queries.",
      'Calculate what share of the total time each query takes.',
      'Check in the catalog that the expected indexes exist.',
      'Detect plans that estimate the rows badly.',
    ],
  },
  docs: {
    chuleta_rendimiento: {
      title: "Load test: what's there and how to read it",
      updatedLabel: 'Laura Méndez · QA',
      body: `## Tables
- \`log_consultas(version, consulta_id, texto, llamadas, tiempo_total_ms, peticiones)\`: per version and query, how many times it ran (calls) and how much time it added up. \`peticiones\` is the number of HTTP requests in the test (it isn't the same in both versions).
- \`planes_capturados(version, consulta_id, filas_estimadas, filas_reales)\`: what the planner expected and what came out (estimated and actual rows).
- \`indices_esperados(tabla, indice)\`: the indexes that should exist.
- \`pg_indexes\`: the indexes that **exist** (PostgreSQL catalog; \`schemaname = 'public'\`).

## How to read it
| Measure | Formula | What it tells |
|---|---|---|
| Mean per call | \`tiempo_total_ms / llamadas\` | whether the **query** is slower |
| Calls per request | \`llamadas / peticiones\` | whether the **code** calls it too often |
| Weight | \`tiempo_total_ms / SUM(…)\` | where the time goes |

Careful: \`llamadas / peticiones\` are integers. Cast to numeric (\`llamadas::numeric\`) or the division truncates.

## Criteria for 1.9
- Regression: mean per call **more than 50 %** worse than in 1.8.
- N+1: **more than 10** calls per request.
- Bad estimate: actual and estimated differ by **10 times or more** (in either direction).`,
    },
  },
  sqlLab: {
    starter: '-- Both versions, query by query\nSELECT *\nFROM log_consultas\nORDER BY consulta_id, version;',
    retos: {
      regresiones: {
        title: 'Queries slower per call',
        description: 'The queries whose **mean per call** in 1.9 is **more than 50 %** higher than in 1.8: `consulta_id`, `media_18` and `media_19` (ms per call, rounded to 2 decimals).',
        hint: "Join `log_consultas` with itself (`a.version = '1.8'`, `b.version = '1.9'`, same `consulta_id`) and `WHERE b.tiempo_total_ms / b.llamadas > 1.5 * a.tiempo_total_ms / a.llamadas`.",
      },
      n_mas_1: {
        title: 'Queries called too often',
        description: 'The queries that in 1.9 run **more than 10 times per request**: `consulta_id` and `llamadas_por_peticion` (rounded to 1 decimal).',
        hint: "`ROUND(llamadas::numeric / peticiones, 1)` and `WHERE version = '1.9' AND llamadas::numeric / peticiones > 10`.",
      },
      nuevas: {
        title: 'New queries in 1.9',
        description: 'The queries that appear in **1.9** and **not** in 1.8: `consulta_id` and `texto`.',
        hint: "`WHERE version = '1.9' AND NOT EXISTS (SELECT 1 FROM log_consultas v WHERE v.version = '1.8' AND v.consulta_id = n.consulta_id)`.",
      },
      peso: {
        title: 'Where the time goes',
        description: 'The **3** queries in 1.9 that add up the most **total time**, from most to least: `consulta_id`, `total_ms` and `porcentaje` (of the total time of **all** queries in 1.9, rounded to 1 decimal).',
        hint: '`ROUND(100 * tiempo_total_ms / SUM(tiempo_total_ms) OVER (), 1)`, `ORDER BY tiempo_total_ms DESC LIMIT 3`. The window is calculated before the LIMIT.',
      },
      indices: {
        title: 'Missing indexes',
        description: "The indexes in `indices_esperados` that **don't exist** in the database: `tabla` and `indice`.",
        hint: "`FROM indices_esperados e WHERE NOT EXISTS (SELECT 1 FROM pg_indexes i WHERE i.schemaname = 'public' AND i.tablename = e.tabla AND i.indexname = e.indice)`.",
      },
      estimaciones: {
        title: 'Plans that estimate badly',
        description: 'The **1.9** plans where estimated and actual rows differ by **10 times or more**, over or under: `consulta_id`, `filas_estimadas` and `filas_reales`.',
        hint: "`WHERE version = '1.9' AND GREATEST(filas_estimadas, filas_reales) >= 10 * LEAST(filas_estimadas, filas_reales)`.",
      },
    },
  },
  bugs: {
    'C-MARTA': { title: 'Opening a card in the app runs 60 queries', explanation: 'Q3 is called once per transaction (N+1) and nobody looked at calls per request.', technique: 'llamadas / peticiones between versions.' },
    'C-CARMEN': { title: 'A new query scans all the customers in a city', explanation: 'Q7 arrived with 1.9 and nobody had measured it.', technique: "The new version's queries that weren't in the previous one." },
    'C-NURIA': { title: 'Customer Service gets complaints about slowness and nobody knows where to start', explanation: 'Nobody calculated that Q2 takes 86 % of the time.', technique: 'Weight of each query over the total.' },
    'C-DIEGO': { title: 'The transactions list takes 24 ms per call', explanation: 'The index on transfers by source account is missing.', technique: 'Compare the expected indexes with pg_indexes.' },
    'C-INES': { title: 'The planner chooses badly in three 1.9 queries', explanation: 'It estimated 3 rows where there were 60, 1 where there were 400 and 250 where there were 20.', technique: 'Estimated versus actual rows, in both directions.' },
    'C-TOTAL': { title: 'A query that was already fast gets optimised', explanation: 'Q3 added up 30 times more time, but each call took the same: the problem was the number of calls.', technique: 'Mean per call and calls per request, separately.' },
    'C-JUGUETE': { title: '1.9 passes the performance test and is slow in production', explanation: 'It was measured with 50 rows, where everything fits in memory and any plan is fast.', technique: 'Measure with a production-like data volume.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: 'What happened with version 1.9.',
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's app", explanation: 'No N+1.' },
      1: { label: "Carmen's queries", explanation: 'The new ones, measured.' },
      2: { label: "Nuria's complaints", explanation: 'We know where the time goes.' },
      3: { label: "Diego's indexes", explanation: 'The missing ones, created.' },
      4: { label: "Inés's plans", explanation: 'Estimates reviewed.' },
      5: { label: 'Per call', explanation: 'Not by total.' },
      6: { label: 'Real volume', explanation: 'No toy databases.' },
    },
  },
  concepts: {
    media: { title: 'Mean per call', summary: 'tiempo_total / llamadas: what the query takes each time. That is what is compared between versions.' },
    n_mas_1: { title: 'N+1', summary: 'A query the code runs once for each item in a list: it shows up in calls per request.' },
    nuevas: { title: 'New queries', summary: "What the new version runs and the previous one didn't: it has nothing to compare against and has to be measured." },
    peso: { title: 'Weight over the total', summary: 'SUM(…) OVER (): what percentage of the time each query takes, to start where there is the most to gain.' },
    catalogo_indices: { title: 'Indexes in the catalog', summary: 'pg_indexes says which indexes exist; it is compared with the ones that should exist.' },
    estimaciones: { title: 'Estimated and actual rows', summary: 'If the planner is wrong by 10 times or more, it can choose a bad plan.' },
    volumen: { title: 'Data volume', summary: 'Performance is measured with production-sized data: with few rows, everything is fast.' },
  },
  seniorTips: [
    'Read how to read the load test in the wiki.',
    'Laura: log_consultas with itself by consulta_id and the 1.9 mean > 1.5 × the 1.8 mean.',
    'Marta: llamadas::numeric / peticiones > 10 in 1.9.',
    'Carmen: 1.9 NOT EXISTS in 1.8.',
    'Nuria: SUM(tiempo_total_ms) OVER () for the percentage and LIMIT 3.',
    "Diego: indices_esperados NOT EXISTS in pg_indexes (schemaname = 'public').",
    'Inés: GREATEST and LEAST to compare in both directions.',
    'With Laura: mean per call, not total; and production-like volume.',
  ],
  lessons: {
    media: {
      question: 'How do I know if a query is slower?',
      body: `By comparing its **mean per call** between versions, not its total time:

\`\`\`
SELECT a.consulta_id,
       a.tiempo_total_ms / a.llamadas AS media_18,
       b.tiempo_total_ms / b.llamadas AS media_19
FROM log_consultas a
JOIN log_consultas b ON b.consulta_id = a.consulta_id AND b.version = '1.9'
WHERE a.version = '1.8';
\`\`\`

The total time also goes up if the query is called more times, or if the test made more requests. The mean per call says whether **the query** got worse.`,
    },
    n_mas_1: {
      question: 'What is an N+1 and how do I see it?',
      body: `The code asks for a list (1 query) and then, for each item, another query (N). Each one is fast; together, they're not.

It shows up in the **calls per request**:

\`\`\`
SELECT consulta_id, version, ROUND(llamadas::numeric / peticiones, 1)
FROM log_consultas ORDER BY consulta_id, version;
\`\`\`

Q3 goes from 2 to 60 per request with the same mean per call: the query is fine, the code calls it too often. It's fixed in the code (a JOIN or an \`IN\`), not with an index.`,
    },
    nuevas: {
      question: 'Why do I look at new queries separately?',
      body: `Because a comparison between versions with a JOIN only sees the queries that are **in both**. The new ones have nothing to compare against and slip through:

\`\`\`
SELECT consulta_id, texto FROM log_consultas n
WHERE version = '1.9'
  AND NOT EXISTS (SELECT 1 FROM log_consultas v
                  WHERE v.version = '1.8' AND v.consulta_id = n.consulta_id);
\`\`\`

Each new query gets reviewed: its plan, its calls per request, its indexes.`,
    },
    peso: {
      question: 'Where do I start improving?',
      body: `With the query that takes the most **total** time. With a window over the whole version:

\`\`\`
SELECT consulta_id, tiempo_total_ms,
       ROUND(100 * tiempo_total_ms / SUM(tiempo_total_ms) OVER (), 1) AS porcentaje
FROM log_consultas WHERE version = '1.9'
ORDER BY tiempo_total_ms DESC LIMIT 3;
\`\`\`

The window is calculated before the LIMIT, so the percentage is over all of them. Improving a query that weighs 1 % by 50 % isn't noticeable; one that weighs 86 % is.`,
    },
    catalogo_indices: {
      question: 'How do I check the indexes are there?',
      body: `In the catalog: \`pg_indexes\` has one row per index that **exists**.

\`\`\`
SELECT e.tabla, e.indice
FROM indices_esperados e
WHERE NOT EXISTS (SELECT 1 FROM pg_indexes i
                  WHERE i.schemaname = 'public'
                    AND i.tablename = e.tabla AND i.indexname = e.indice);
\`\`\`

A migration that didn't create an index gives no error: it only makes the query slower. This test finds it first.`,
    },
    estimaciones: {
      question: 'What do the estimated rows tell me?',
      body: `What the planner **thought** it was going to find. It chooses the plan with that: an index for few rows, a scan for many.

If it's wrong by 10 times or more, the plan can be bad. In **both directions**:

\`\`\`
WHERE GREATEST(filas_estimadas, filas_reales) >= 10 * LEAST(filas_estimadas, filas_reales)
\`\`\`

Estimating 1 and finding 400 is as bad as estimating 250 and finding 20. It's usually fixed with up-to-date statistics (\`ANALYZE\`).`,
    },
    volumen: {
      question: 'What data is performance measured with?',
      body: `With a **production-like volume**. With 50 rows everything fits in memory, any plan takes 1 ms and a missing index isn't noticed.

Plans change with table size: what is a fast scan with little data is a disaster with millions. A performance test with toy data only proves that it's fast with toy data.`,
    },
  },
  quiz: {
    pre: {
      q9pre_media: { question: 'To know whether a query is slower in the new version, what do you compare?', options: ['The total time', 'The mean time per call', 'The number of calls', 'The text'], explanation: 'The total also depends on how many times it is called.' },
      q9pre_n1: { question: 'A query goes from 2 to 60 calls per request with the same mean. What is it?', options: ['A slow query', 'An N+1 in the code', 'A missing index', 'Nothing'], explanation: "It's fixed in the code." },
      q9pre_div: { question: '`90000 / 1500` with two integers in PostgreSQL. And `5 / 2`?', options: ['60 and 2.5', '60 and 2', '60.0 and 2.5', 'Error'], explanation: 'Between integers, division truncates.' },
      q9pre_nuevas: { question: "A JOIN between 1.8's and 1.9's queries. Which queries don't come out?", options: ['None', "1.9's new ones", 'The slowest ones', "1.8's ones"], explanation: 'They have no match.' },
      q9pre_idx: { question: 'Where do you check whether an index exists?', options: ['In log_consultas', 'In pg_indexes', 'In the app', 'In EXPLAIN'], explanation: 'The catalog.' },
      q9pre_vol: { question: 'A performance test with 50 rows per table. What does it detect?', options: ['Everything', 'Almost nothing: with few rows everything is fast', 'The N+1s', 'The missing indexes'], explanation: 'You need production-like data.' },
    },
    post: {
      q9post_total: { question: 'Q3 goes from 300 to 9000 total ms and its mean stays at 0.1 ms. What do you do?', options: ['Add an index to Q3', "Find out why it's called 30 times more", 'Nothing', 'Rewrite Q3'], explanation: 'The problem is the number of calls.' },
      q9post_over: { question: 'What does `SUM(tiempo_total_ms) OVER ()` calculate?', options: ['A sum per group', 'The sum of all rows, repeated on each row', 'An error without GROUP BY', 'A running total'], explanation: 'A window without partitions.' },
      q9post_limit: { question: 'With `… OVER () … LIMIT 3`, over which rows is the percentage calculated?', options: ['Over the 3', 'Over all of them', 'Over the first', 'It depends'], explanation: 'The window comes before the LIMIT.' },
      q9post_est: { question: 'Estimated 250, actual 20. Is it a bad estimate with the 10-times criterion?', options: ['No, there are rows to spare', "Yes: it's wrong by 12.5 times", 'Only if it were the other way round', "You can't know"], explanation: 'Both directions count.' },
      q9post_nuevas: { question: 'Q7 is new in 1.9 and has no index. Does the comparison of means between versions detect it?', options: ['Yes', "No: it isn't in 1.8", "Only if it's slow", 'Only with EXPLAIN'], explanation: 'You have to look for the new ones separately.' },
      q9post_peticiones: { question: "1.9's test made 1500 requests and 1.8's, 1400. Do you compare total times?", options: ['Yes', 'No: you have to normalise (per call or per request)', "Only if they're similar", "It doesn't matter"], explanation: 'More load, more total time.' },
    },
  },
  scenes: {
    mail_laura: {
      subject: '1.9 goes out on Monday',
      body: "Good morning.\n\nLast day of the week and of the month: 1.9 goes out on Monday. We have the 1.8 and 1.9 load test in `log_consultas`; how to read it is in the wiki.\n\nFirst:\n\n- The queries whose **mean per call** in 1.9 is **more than 50 %** higher than in 1.8: `consulta_id`, `media_18` and `media_19` (ms, 2 decimals).\n\nLaura",
    },
    laura_ok: { body: 'Q2 goes from 2 to 24 ms per call: twelve times more. Q5, from 20 to 32. Those two really are slower.' },
    marta_n1: {
      body: 'Hi! In 1.9 the card page shows the transactions in more detail. Are there queries that run **more than 10 times per request**? `consulta_id` and `llamadas_por_peticion` (1 decimal).',
    },
    marta_thanks: { body: "Q3, 60 per request: one for each transaction on the page. And Q8, 20.5: the merchant's name, one by one. I'll pass it to Diego. Thanks!" },
    carmen_nuevas: {
      body: 'Hi. For Risk, every new query on customers gets reviewed. Which queries appear in **1.9** and **not** in 1.8? `consulta_id` and `texto`.',
    },
    carmen_thanks: { body: 'Q7, customers by city with their accounts, and Q8, merchants. I want to review Q7. Thanks.' },
    laura_total: {
      subject: '11:00 · Laura: "Q3 is 30 times slower"',
      body: '**Laura:** Rubén compared each query\'s **total time** between versions and says Q3 "is 30 times slower" (from 300 to 9000 ms) and that it needs an index. What do you tell him?',
      choices: {
        media: {
          text: "That Q3 is **not** slower: it takes 0.1 ms per call in both versions. What has changed is **how many times it's called** (from 2 to 60 per request): an N+1 in the code. An index doesn't fix it. You have to look at the **mean per call** and the **calls per request** separately, and the total only to know where the time goes.",
          reply: 'Exactly. The total mixes two different problems with two different fixes.',
          effects: { 2: { text: 'Mean per call and calls per request, separately.' } },
        },
        indice: {
          text: "That he's right: an index on cards will fix it.",
          reply: "Q3 already searches by primary key. That index exists and the query is fast: it's called 30 times more.",
          effects: { 0: { text: 'You agreed to optimise a query that was already fast.' } },
        },
        carga: {
          text: "That it'll be the load: 1.9 had more requests.",
          reply: "It had 7 % more, not thirty times more. Normalise and you'll see.",
          effects: { 0: { text: 'You blamed the load for what was an N+1.' } },
        },
      },
    },
    nuria_peso: {
      body: 'Hi. The 1.9 beta customers say "everything is slow". Where does the time go? The **3** queries that add up the most total time in 1.9: `consulta_id`, `total_ms` and `porcentaje` of the total (1 decimal).',
    },
    nuria_thanks: { body: 'Q2 takes 86.5 % of the time: the transactions list. Now I know what to answer. Thanks!' },
    diego_indices: {
      body: "Hey. The Q2 thing sounds like an index to me. We have the list of the ones there should be in `indices_esperados`. Which ones **don't exist**? `tabla` and `indice`.",
    },
    diego_thanks: { body: "`transferencias_origen_idx` (Q2) and `cuentas_cliente_idx` (Q7) are missing. The 1.9 migration dropped them and didn't create them again. I'm adding them. Thanks!" },
    ines_estimaciones: {
      body: 'Hi. I have the plans captured during the test. In which **1.9** ones do estimated and actual rows differ by **10 times or more**, in either direction? `consulta_id`, `filas_estimadas` and `filas_reales`.',
    },
    ines_thanks: { body: "Q2 overestimates, Q4 and Q7 underestimate. The statistics weren't recalculated after the load: an ANALYZE and I'll capture them again. Thanks." },
    laura_volumen: {
      subject: '15:00 · Laura: "in my environment everything runs at 1 ms"',
      body: '**Laura:** Rubén says he repeated the test in his local environment, with the 50-rows-per-table test database, and that **every** 1.9 query takes 1 ms. "There\'s no regression." What do you answer?',
      choices: {
        volumen: {
          text: "That with 50 rows **everything** is fast: it all fits in memory, any plan works and a missing index isn't noticed. Performance is measured with a **production-like volume**, which is where plans change. His test only says it's fast with toy data.",
          reply: "That's it. A performance test has to be able to fail.",
          effects: { 3: { text: 'Performance measured with production volume.' } },
        },
        local: {
          text: "That's perfect: if it runs fine locally, it'll run fine.",
          reply: "Locally 1.8 also ran fine without Q2's index. With 50 rows you don't see anything.",
          effects: { 0: { text: 'You accepted a performance test with toy data.' } },
        },
        produccion: {
          text: "That we should test it directly in production and see.",
          reply: "That means the customers run the test for us. You need an environment with real volume, beforehand.",
          effects: { 0: { text: 'You suggested measuring performance with the customers.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the week with Laura',
      body: '**Laura:** Two slower queries, two N+1s, two new ones, two missing indexes and three plans that estimate badly. What are you taking away?',
      choices: {
        lesson: {
          text: "That between versions you compare the mean per call (whether the query got worse) and the calls per request (whether the code calls it too often), always normalising; that new queries are looked at separately; that the weight tells you where to start; that indexes are checked in the catalog and estimates in both directions; and that all of it is measured with production volume.",
          reply: "Very good. With this you have the whole month. On Monday, the practical exam: ten tasks, one from each day.",
        },
        total: {
          text: "That it's enough to compare the test's total time between versions.",
          reply: "The total went up, yes, but it doesn't tell you why or where. Check the debrief.",
          effects: { 0: { text: 'You came away with the total time.' } },
        },
      },
    },
  },
})
