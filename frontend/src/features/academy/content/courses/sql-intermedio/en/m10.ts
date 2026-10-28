import { EXAM_TODAY } from '../../../../sql/prestamosDb'
import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m10Examen } from '../m10-examen'
import { missionEn } from './missionEn'

/** Course 6: Intermediate SQL · Practical exam. English version of ../m10-examen.ts. */
export const m10ExamenEn = missionEn(
  m10Examen,
  {
    title: 'Practical exam',
    subtitle: 'Three hours, no hints: ten multi-step tasks on loans, payments and customers. Pass with 70 out of 100.',
    playerRole: 'QA · Data · Kobalto',
    dayLabel: 'Monday · month 2, week 3',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Practical exam passed',
        body: 'You solved multi-step tasks without help: subqueries, WITH, windows, joins, data quality and views. This counts toward the certificate.',
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
        'Monday of week 3, 09:00. The loans committee meets at noon and needs multi-step answers: loans, installments, customers and card payments.',
        'You have three hours and ten tasks, one for each mission of the course. There is no mentor and no hints: the description of the tables is in the wiki.',
        'Each task is worth 10 points. You pass with 70 out of 100. You are in the test environment: do not modify data (query tasks are compared against the starting data). The last task asks you to create a view. If you make a mistake, "Restore" puts it back as it was.',
      ],
      goals: [
        'Read in the wiki what the tables look like.',
        'Solve the ten tasks in the console (10 points each).',
        "Don't modify data: only create the view that is asked for.",
        'Submit before 12:00.',
      ],
    },
    scenes: {
      mail_exam: {
        subject: 'Intermediate SQL practical exam',
        body: "Good morning:\n\nToday is your practical exam. In the console you have **ten tasks** on loans and installments (`prestamos`, `cuotas`) and the usual tables, including `pagos_tarjeta` and `comercios`. The description of the new tables is in the wiki: \"Loans: tables\".\n\n- You have until **12:00**.\n- Each task is worth **10 points**; you pass with **70**.\n- No hints and no help from Inés: today you are on your own.\n- You are in the test environment. **Don't touch data**: only create the view of the last task.\n\nGood luck.\nLaura",
      },
      reminder: { body: 'You have 30 minutes left. Check that the tasks you have done are still green and submit at 12:00.' },
      closing: {
        subject: '12:00 · Submission',
        body: "**Laura:** Time's up. Are you submitting?",
        choices: { submit: { text: 'Submit the exam.', reply: "Received. Here's the result." } },
      },
    },
    docs: {
      prestamos: {
        title: 'Loans: tables',
        updatedLabel: 'Data team',
        body: `## prestamos (loans)
- \`id\`, \`cliente_id\` → \`clientes.id\`
- \`importe\` (numeric), \`plazo_meses\` (integer: 12, 24, 36, 48 or 60), \`tipo_interes\` (numeric, in %)
- \`estado\`: **solicitado**, **aprobado**, **rechazado** or **cancelado** (requested, approved, rejected, cancelled)
- \`solicitado_en\` (date) and \`aprobado_en\` (date; empty if not approved)

## cuotas (installments)
- \`id\`, \`prestamo_id\` → \`prestamos.id\`
- \`numero\` (1, 2, 3…), \`vence_en\` (date), \`importe\` (numeric)
- \`pagada_en\` (date; empty if not paid)

## The usual ones
\`clientes\`, \`cuentas\`, \`tarjetas\`, \`transferencias\`, \`incidencias\`, \`comercios\` and \`pagos_tarjeta\`. A card payment reaches its customer through \`pagos_tarjeta\` → \`tarjetas\` → \`cuentas\`.

## Rules
- Today is **${EXAM_TODAY}**: an installment is **overdue** if \`vence_en\` is earlier than today. Don't use CURRENT_DATE.

## Grading
- 10 tasks × 10 points. Pass: 70.`,
      },
    },
    sqlLab: {
      starter: '-- Practical exam: prestamos and cuotas tables, and the usual ones\nSELECT *\nFROM prestamos\nLIMIT 5;',
      retos: {
        e1_sobre_media: {
          title: '1 · Above the average',
          description: '`id` and `importe` of the loans (any status) whose amount is **greater than the average of all the loans**, without typing the average by hand.',
          requires: { 0: { message: 'The query itself has to calculate the average.' } },
        },
        e2_grandes_deudores: {
          title: '2 · More than €20,000 approved',
          description: '`id`, `nombre` and `total_aprobado` of the customers whose sum of **approved** loans is above **€20,000**.',
        },
        e3_solicitudes_mes: {
          title: '3 · Requests per month',
          description: '`mes` (the first day of the month, as a date) and number of loan `solicitudes` (requests) of each month, according to `solicitado_en`.',
        },
        e4_sin_tarjeta: {
          title: '4 · With a loan and no card payments',
          description: '`cliente_id` of the customers who have some **approved** loan but **no card payment at all**.',
        },
        e5_plazos: {
          title: '5 · Statuses per term, in columns',
          description: 'One row per `plazo_meses` with the number of `aprobados` (approved) and `rechazados` (rejected) loans in two columns.',
        },
        e6_mayor_por_plazo: {
          title: '6 · The largest of each term',
          description: '`plazo_meses`, `id` and `importe` of the loan with the **highest amount of each term** (any status).',
        },
        e7_cobrado: {
          title: '7 · Collected per month and running total',
          description: 'Of the **paid** installments: `mes` of the payment (first day of the month, as a date), `cobrado` (collected) in that month and `acumulado` (running total) from the first month.',
          requires: { 0: { message: 'The running total is calculated with a window function.' } },
        },
        e8_cuotas_por_prestamo: {
          title: '8 · Paid and pending installments',
          description: 'For **all** the **approved** loans (also the ones without installments): `id`, number of installments `pagadas` (paid) and `pendientes` (pending), 0 if there are none.',
        },
        e9_primera_impagada: {
          title: '9 · The first unpaid installment',
          description: `For each loan with **overdue** (before ${EXAM_TODAY}) **unpaid** installments: \`prestamo_id\`, \`numero\` and \`vence_en\` of the **oldest** one.`,
        },
        e10_vista: {
          title: '10 · The resumen_prestamos view',
          description: 'Create the view **`resumen_prestamos`** with one row per `estado`, the number of `prestamos` and the `importe_total`.',
          requires: { 0: { message: 'This task is done by creating a view.' } },
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
  kobaltoDataWorldEn({ marta: 'Product Owner · Loans', laura: 'QA Lead · examiner' }),
)

// Debrief summary: one line per task, as in the Spanish version.
m10ExamenEn.prevention!.rules = m10ExamenEn.sqlLab!.retos.map((r) => ({
  flag: `reto.${r.id}`,
  label: r.title,
  explanation: r.description.replace(/\*\*|`/g, ''),
}))
