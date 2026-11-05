import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m10Examen } from '../m10-examen'
import { missionEn } from './missionEn'

const JUNIO = "SELECT * FROM movimientos WHERE cuenta_id = 7 AND fecha BETWEEN '2025-06-01' AND '2025-06-30'"

/** Course 7: Advanced SQL · Practical exam. English version of ../m10-examen.ts. */
export const m10ExamenEn = missionEn(
  m10Examen,
  {
    title: 'Practical exam',
    subtitle: 'Three hours, no hints: ten query and change tasks on the database. Pass with 70 out of 100.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Monday · month 4, week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Practical exam passed',
        body: 'Without help, you solved recursive, window, subtotal and JSON queries, and you changed the database with care: data moved, rules, functions, indexes and a materialized view. This counts toward the certificate.',
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
        'Monday, 09:00. Several teams are waiting for answers and changes to the database before noon.',
        'You have three hours and ten tasks, one for each mission of the course. There is no mentor and no hints: the tables are described in the wiki.',
        'Each task is worth 10 points. You pass with 70 out of 100. You are in the test environment. The first five tasks are queries and are compared against the starting data; the last five change the database and what it ends up like is checked. Don\'t change anything that isn\'t asked for. If you make a mistake, "Restore" puts everything back as it was at the start (it also undoes what you had already changed).',
      ],
      goals: [
        'Read in the wiki what the tables look like.',
        'Solve the ten tasks in the console (10 points each).',
        'Change only what tasks 6 to 10 ask for.',
        'Submit before 12:00.',
      ],
    },
    scenes: {
      mail_exam: {
        subject: 'Advanced SQL practical exam',
        body: 'Good morning:\n\nToday is your practical exam. In the console you have **ten tasks**, one for each mission of the course. The tables are described in the wiki: "Exam tables".\n\n- You have until **12:00**.\n- Each task is worth **10 points**; you pass with **70**.\n- No hints and no help from Inés: today you are on your own.\n- Tasks **1 to 5** are queries. Tasks **6 to 10** change the database: do only what they ask.\n\nGood luck.\nLaura',
      },
      reminder: { body: "You have 30 minutes left. Check that the tasks you have done are still green and that you have no open transaction. Submit at 12:00." },
      closing: {
        subject: '12:00 · Submission',
        body: "**Laura:** Time's up. Are you submitting?",
        choices: { submit: { text: 'Submit the exam.', reply: "Received. Here's the result." } },
      },
    },
    docs: {
      tablas: {
        title: 'Exam tables',
        updatedLabel: 'Data team',
        body: `## empleados (employees)
\`id\`, \`nombre\`, \`puesto\`, \`departamento\`, \`jefe_id\` → \`empleados.id\` (empty for the CEO), \`salario\`, \`alta\`

## pagos_tarjeta and comercios
- \`pagos_tarjeta\` (card payments): \`id\`, \`tarjeta_id\`, \`comercio_id\`, \`importe\`, \`estado\` (**aceptado**, **rechazado** or **devuelto**: accepted, rejected, refunded), \`pagado_en\` (timestamp)
- \`comercios\` (merchants): \`id\`, \`nombre\`, \`categoria\` (may be empty), \`ciudad\`

## prestamos and cuotas
- \`prestamos\` (loans): \`id\`, \`cliente_id\`, \`importe\`, \`plazo_meses\`, \`tipo_interes\`, \`estado\`, \`solicitado_en\`, \`aprobado_en\`
- \`cuotas\` (instalments): \`id\`, \`prestamo_id\`, \`numero\`, \`vence_en\`, \`importe\`, \`pagada_en\`

## eventos_app
\`id\`, \`cliente_id\`, \`tipo\` (login, transferencia, error, ajuste), \`ocurrido_en\`, \`datos\` (jsonb). In errors: \`{"codigo", "pantalla", "reintentos", "detalle": {…}}\`.

## incidencias and incidencias_archivo
Same structure: \`id\`, \`cliente_id\`, \`canal\`, \`motivo\`, \`abierta_en\`, \`cerrada_en\` (empty if still open).

## movimientos
60,000 rows: \`id\`, \`cuenta_id\`, \`fecha\`, \`importe\`, \`tipo\`, \`concepto\`, \`estado\`.

## Grading
- 10 tasks × 10 points. Pass: 70.
- 1 to 5: the result is compared with the one from the starting data.
- 6 to 10: what the database ends up like is checked.`,
      },
    },
    sqlLab: {
      starter: '-- Practical exam: start by looking at the tables\nSELECT *\nFROM empleados\nLIMIT 5;',
      retos: {
        e1_equipo_jorge: {
          title: "1 · Jorge's whole team",
          description: 'Everyone who reports to **Jorge Llorente** (`id` 2), at any level: `id`, `nombre` and `nivel` (1 for direct reports, 2 for the next level…).',
          requires: { 0: { message: 'This task is solved with a recursive query (`WITH RECURSIVE`).' } },
        },
        e2_diferencia: {
          title: '2 · Each 2026 payment against the previous one',
          description: 'Of the card payments of **2026**: `id`, `tarjeta_id`, `importe` and `diferencia` (difference) with the **previous payment of the same card** (by `pagado_en` and, if they tie, by `id`). The previous one can be from 2025: it is only empty for the card\'s first payment.',
        },
        e3_mediana: {
          title: '3 · Median per category',
          description: 'For each merchant `categoria` (the empty one too), the **median** amount of the **accepted** payments, rounded to 2 decimals: `categoria` and `mediana`.',
        },
        e4_subtotales: {
          title: '4 · Loans with subtotals',
          description: 'Number of `prestamos` and `importe_total` per `estado` and `plazo_meses`, with a **subtotal per status** and the **grand total** (in those rows, the grouped column is empty).',
        },
        e5_errores_pantalla: {
          title: '5 · Errors per screen',
          description: 'Of the **error** events: `pantalla` (screen, as text), number of `errores` and `media_reintentos` (the average of `reintentos`, rounded to 2 decimals).',
        },
        e6_archivar: {
          title: '6 · Archive the 2025 incidents',
          description: 'Move to `incidencias_archivo` the incidents **closed before 1 January 2026**, in **a single statement**: out of `incidencias` and into the archive.',
          requires: { 0: { message: 'In a single statement: a DELETE … RETURNING inside a WITH and an INSERT.' } },
        },
        e7_cuota_unica: {
          title: '7 · Instalments without repeats',
          description: 'Make `cuotas` refuse **two instalments with the same number for the same loan**. If there is a repeated one, delete the **copy** (the one with the highest `id`) and keep the original.',
          requires: { 0: { message: 'This task is done with a unique rule.' } },
        },
        e8_total_pagado: {
          title: '8 · The total_pagado function',
          description: 'Create the function **`total_pagado(p_tarjeta integer)`** that returns the sum of the amount of that card\'s **accepted** payments, and **0** if it has none.',
          requires: { 0: { message: 'This task is done by creating a function.' } },
        },
        e9_indice: {
          title: "9 · An index for June's statement",
          description: `Create the index that lets **both conditions** of this query be solved with it: \`${JUNIO}\`.`,
          requires: { 0: { message: 'This task is done by creating an index.' } },
        },
        e10_matview: {
          title: '10 · The pagos_por_comercio materialized view',
          description: 'Create the **materialized view** `pagos_por_comercio` with one row per merchant: `comercio_id`, number of **accepted** `pagos` and their `total`.',
          requires: { 0: { message: 'This task is done with a materialized view.' } },
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
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', laura: 'QA Lead · examiner' }),
)

// Debrief summary: one line per task, as in the Spanish version.
m10ExamenEn.prevention!.rules = m10ExamenEn.sqlLab!.retos.map((r) => ({
  flag: `reto.${r.id}`,
  label: r.title,
  explanation: r.description.replace(/\*\*|`/g, ''),
}))
