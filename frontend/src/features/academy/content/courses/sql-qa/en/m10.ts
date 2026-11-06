import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m10Examen } from '../m10-examen'
import { ROLES_EN, missionEn } from './missionEn'

/** Course 8: SQL for QA · Practical exam. English version of ../m10-examen.ts. */
export const m10ExamenEn = missionEn(
  m10Examen,
  {
    title: 'Practical exam',
    subtitle: 'Three hours, no hints: ten QA tasks with SQL on the database. Pass with 70 out of 100.',
    playerRole: 'QA · Kobalto',
    dayLabel: 'Monday · month 4, week 3',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · QA',
    verdicts: {
      good: {
        title: 'Practical exam passed',
        body: 'Without help, you tested with SQL what the app did, the edges, the test data, the rules that must return zero, a reconciliation, a migration, a report, some states, some rules and a new version. This counts toward the certificate.',
      },
      ok: { title: 'Practical exam passed', body: 'Passed. Check the detail to see which tasks were left along the way.' },
      bad: {
        title: 'Practical exam not passed',
        body: "You haven't reached 70 yet. See which tasks were missing, review the mission for each one and try again: the exam can be retaken.",
      },
    },
    briefing: {
      title: 'Practical exam',
      paragraphs: [
        'Monday, 09:00. Several teams are waiting for answers from QA before noon.',
        'You have three hours and ten tasks, one for each mission of the course. There is no mentor and no hints: the tables are described in the wiki.',
        'Each task is worth 10 points. You pass with 70 out of 100. You are in the test environment. The query tasks are compared against the starting data. Task 3 creates test data and task 9 tests rules: for those, what the database ends up like is checked. Don\'t change anything that isn\'t asked for. If you make a mistake, "Restore" puts everything back as it was at the start (it also undoes what you had already changed).',
      ],
      goals: [
        'Read in the wiki what the tables look like.',
        'Solve the ten tasks in the console (10 points each).',
        'Change only what task 3 asks for; task 9 must leave no trace.',
        'Submit before 12:00.',
      ],
    },
    scenes: {
      mail_exam: {
        subject: 'SQL for QA practical exam',
        body: 'Good morning:\n\nToday is your practical exam. In the console you have **ten tasks**, one for each mission of the course. The tables are described in the wiki: "Exam tables".\n\n- You have until **12:00**.\n- Each task is worth **10 points**; you pass with **70**.\n- No hints and no help: today you are on your own.\n- Task **3** creates test data; task **9** tests rules and must leave nothing behind. The rest are queries.\n\nGood luck.\nLaura',
      },
      reminder: { body: 'You have 30 minutes left. Check that the tasks you have done are still green and that you have no open transaction. Submit at 12:00.' },
      closing: {
        subject: '12:00 · Submission',
        body: "**Laura:** Time's up. Are you submitting?",
        choices: { submit: { text: 'Submit the exam.', reply: "Received. Here's the result." } },
      },
    },
    docs: {
      tablas: {
        title: 'Exam tables',
        updatedLabel: 'QA team',
        body: `## App runs
- \`ejecuciones(ejecucion, referencia, importe, resultado_ui)\`: what the app requested in each test run (R-0305, R-0306).
- \`transferencias(id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en)\`: the \`concepto\` is the run's \`referencia\`.
- \`cuentas(id, cliente_id, iban, tipo, saldo, abierta_en, estado)\` (accounts).

## Payments
- \`pagos_tarjeta(id, tarjeta_id, comercio_id, importe, estado, pagado_en)\`: estado **aceptado**, **rechazado** or **devuelto** (accepted, rejected, refunded); \`pagado_en\` is a timestamp.
- \`comercios(id, nombre, …)\` (merchants) and \`liquidaciones(pago_id, importe, fecha_operacion, …)\`: what the processor settled.

## Customers and migration
- \`clientes(id, nombre, apellidos, email, ciudad, fecha_alta, segmento)\`.
- \`clientes_v2(id, nombre_completo, email, ciudad_id, segmento, alta)\` and \`ciudades(id, nombre)\`. Rules: \`nombre || ' ' || apellidos\`, \`lower(trim(email))\`, the city by name in \`ciudades\`, empty segment → \`'sin_segmento'\`, \`alta\` = \`fecha_alta\`.

## Incidents
\`incidencias(id, cliente_id, canal, motivo, abierta_en, cerrada_en)\`: \`canal\` is chat, telefono or email.

## Orders
\`ordenes_historial(id, orden_id, estado, cambiado_en)\`.

## Applications
\`solicitudes(id, cliente_id, importe, plazo_meses, estado, revisada_en)\`. Test with \`probar('statement', …)\`: it returns \`ok\` or the SQLSTATE and undoes it.

## Performance
\`log_consultas(version, consulta_id, texto, llamadas, tiempo_total_ms, peticiones)\`, versions 1.8 and 1.9.

## Grading
- 10 tasks × 10 points. Pass: 70.
- Queries: the result is compared with the one from the starting data.
- Tasks 3 and 9: what the database ends up like is checked.`,
      },
    },
    sqlLab: {
      starter: '-- Practical exam: start by looking at the tables\nSELECT *\nFROM ejecuciones\nLIMIT 5;',
      retos: {
        e1_ejecucion: {
          title: '1 · What the app requested and what was stored',
          description: "For **each** reference of run **R-0306**: `referencia`, `importe_app` (what the app requested) and `importe_bd` (the amount of the transfer with that concepto; empty if it wasn't created).",
        },
        e2_estados_febrero: {
          title: '2 · February payments by status',
          description: 'Number of card `pagos` in **February 2026** (the whole 28th) per `estado`.',
        },
        e3_incidencias_prueba: {
          title: '3 · Test incidents',
          description: "Create the test incidents **9301 to 9330** (30) for customer **3**: `motivo` 'Prueba QA', `canal` 'chat' for the odd ones and 'email' for the even ones, `abierta_en` for 9301 on **2026-03-01 00:00** and each one **an hour** after the previous one, and not closed. Don't change anything else.",
        },
        e4_cuentas_inexistentes: {
          title: "4 · Transfers with accounts that don't exist",
          description: "The transfers whose **source** or **destination** account (if it has one) **doesn't exist** in `cuentas`: `id`, `cuenta_origen_id` and `cuenta_destino_id`.",
        },
        e5_liquidado: {
          title: '5 · Wrongly settled payments',
          description: "The **accepted February** payments whose **settled** amount (the sum of all their settlements; 0 if there are none) is **different** from their amount, even by one cent: `pago_id`, `importe_app` and `liquidado`.",
        },
        e6_migracion: {
          title: '6 · Wrongly migrated customers',
          description: "The `id`s of the customers in `clientes` whose row in `clientes_v2` **isn't exactly the expected one** according to the wiki's rules (in any column), **or doesn't exist**.",
        },
        e7_devueltos: {
          title: '7 · Refunds per merchant',
          description: 'For **each merchant** (including those without any), the number of **refunded** payments in **February 2026**: `comercio_id` and `devueltos`.',
        },
        e8_estados_repetidos: {
          title: '8 · Repeated states in the history',
          description: 'The orders that go through the same state **more than once** in their history: `orden_id`, `estado` and `veces`.',
        },
        e9_plazos: {
          title: "9 · Changing an application's term",
          description: 'Try to **change** the term of application **2** to **12**, **36**, **60**, **72** and **empty** (NULL), each case separately and without leaving any change: `plazo` and `resultado` (what `probar` returns).',
          requires: { 0: { message: 'Each case is tested with `probar(…)`.' } },
        },
        e10_por_peticion: {
          title: '10 · Time per request',
          description: 'The queries that are in both versions and whose **time per request** (`tiempo_total_ms / peticiones`) in 1.9 is **more than 50 %** higher than in 1.8: `consulta_id`, `ms_peticion_18` and `ms_peticion_19` (rounded to 2 decimals).',
        },
      },
    },
    prevention: {
      title: 'Exam tasks',
      intro: 'What you achieved in the practical exam.',
      preventedLabel: 'Tasks achieved',
      appearedLabel: 'Tasks',
    },
  },
  kobaltoDataWorldEn({ ...ROLES_EN, laura: 'QA Lead · examiner' }),
)

// Debrief summary: one line per task, as in the Spanish version.
m10ExamenEn.prevention!.rules = m10ExamenEn.sqlLab!.retos.map((r) => ({
  flag: `reto.${r.id}`,
  label: r.title,
  explanation: r.description.replace(/\*\*|`/g, ''),
}))
