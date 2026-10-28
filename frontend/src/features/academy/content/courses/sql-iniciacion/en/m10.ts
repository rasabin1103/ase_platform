import { EXAM_TODAY } from '../../../../sql/prestamosDb'
import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m10Examen } from '../m10-examen'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Practical exam. English version of ../m10-examen.ts. */
export const m10ExamenEn = missionEn(
  m10Examen,
  {
    title: 'Practical exam',
    subtitle: 'Three hours, no hints: ten tasks on the loans tables. Pass with 70 out of 100.',
    playerRole: 'QA · Kobalto',
    dayLabel: 'Monday · week 3',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Practical exam passed',
        body: 'You solved real tasks on tables you did not know, without help. This counts toward the certificate.',
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
        "Monday of week 3, 09:00. Kobalto is launching personal loans and the team needs data before the launch meeting. The `prestamos` and `cuotas` tables are new: nobody has taught them to you.",
        'You have three hours and ten tasks, one for each mission of the course. There is no mentor and no hints: the description of the tables is in the wiki.',
        'Each task is worth 10 points. You pass with 70 out of 100. You are in the test environment: do not modify data except in the task that asks for it (query tasks are compared against the starting data). If you make a mistake, "Restore" puts it back as it was.',
      ],
      goals: [
        'Read in the wiki what the loans tables look like.',
        'Solve the ten tasks in the console (10 points each).',
        'Modify data only in the task that asks for it, and carefully.',
        'Submit before 12:00.',
      ],
    },
    scenes: {
      mail_exam: {
        subject: 'Practical exam: loans',
        body: "Good morning:\n\nToday is your practical exam. In the console you have **ten tasks** on the new tables `prestamos` and `cuotas` (and the usual ones). Their description is in the wiki: “Loans: tables”.\n\n- You have until **12:00**.\n- Each task is worth **10 points**; you pass with **70**.\n- No hints and no help from Inés: today you are on your own.\n- You are in the test environment. **Do not touch data** except in the task that asks for it.\n\nGood luck.\nLaura",
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
        body: `## prestamos
- \`id\`, \`cliente_id\` → \`clientes.id\`
- \`importe\` (numeric), \`plazo_meses\` (integer), \`tipo_interes\` (numeric, in %)
- \`estado\`: **solicitado**, **aprobado**, **rechazado** or **cancelado**
- \`solicitado_en\` (date) and \`aprobado_en\` (date; empty if not approved)

## cuotas
- \`id\`, \`prestamo_id\` → \`prestamos.id\`
- \`numero\` (1, 2, 3…), \`vence_en\` (date), \`importe\` (numeric)
- \`pagada_en\` (date; empty if not paid)

## Business rules
- Today is **${EXAM_TODAY}**: an installment is **overdue** if \`vence_en\` is earlier than today.
- Every approved loan should have its installments generated.

## Grading
- 10 tasks × 10 points. Pass: 70.`,
      },
    },
    sqlLab: {
      starter: '-- Practical exam: the new tables are prestamos and cuotas\nSELECT *\nFROM prestamos\nLIMIT 5;',
      retos: {
        e1_catalogo: {
          title: '1 · Loan catalog',
          description: 'For **all** loans: `id`, the amount named `importe_solicitado` and the term named `meses`.',
        },
        e2_aprobados: {
          title: '2 · Medium approved loans',
          description: '`id`, `cliente_id` and `importe` of the **approved** loans with an amount **between 5,000 and 15,000 €** (both included).',
        },
        e3_top: {
          title: '3 · The five largest',
          description: '`id` and `importe` of the **5 loans with the highest amount**, from largest to smallest.',
        },
        e4_tramos: {
          title: '4 · Requests by bracket',
          description: 'For loans **with no approval date** and in **solicitado** status: `id`, `importe` and `tramo`, which is **pequeño** (under 5,000), **mediano** (under 15,000) or **grande** (the rest).',
        },
        e5_impagadas: {
          title: '5 · Overdue unpaid installments',
          description: `How many installments are **overdue** (before ${EXAM_TODAY}) and **unpaid**, and their total amount. One row, columns \`impagadas\` and \`importe_impagado\`.`,
        },
        e6_estados: {
          title: '6 · Summary by status',
          description: 'By status: `estado`, **number of loans** and **average amount** rounded to 2 decimals, only for statuses with **more than 3 loans**.',
        },
        e7_clientes: {
          title: '7 · Approved loans with their customer',
          description: 'For **approved** loans: loan `id` and the customer’s `nombre`, `apellidos` and `email`.',
        },
        e8_sin_cuotas: {
          title: '8 · Approved loans without installments',
          description: 'The `id` of the **approved** loans that have **no installment** generated.',
        },
        e9_interes: {
          title: '9 · Interest rate review',
          description: 'Set `tipo_interes` to **7.50** on **approved** loans of **more than 20,000 €**. No others.',
        },
        e10_recordatorios: {
          title: '10 · Reminders table',
          description: 'Create **recordatorios**: `id` (integer, primary key), `cuota_id` (integer, mandatory, references `cuotas(id)`), `canal` (text, mandatory, only **email** or **sms**) and `enviado_en` (date, mandatory).',
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
