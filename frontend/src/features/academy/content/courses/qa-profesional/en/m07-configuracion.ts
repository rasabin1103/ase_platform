import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m07LessonsEn } from './m07-lessons'
import { m07QuizEn } from './m07-quiz'
import { m07ScenesEn } from './m07-scenes'

/**
 * Course 2: Professional QA · Mission 7 — Which version is it? (CTFL 5.4, 2.3 and 5.5).
 * English version of m07-configuracion.ts (same structure, translated text only).
 */
export const m07ConfiguracionEn: Mission = {
  id: 'm07-configuracion',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 7,
  title: 'Which version is it?',
  subtitle: 'Configuration management, maintenance testing, impact analysis and defect reports.',
  world: kobaltoWorldEn,
  playerRole: 'QA on the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Tuesday',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-config',
  appLabel: 'Configuration',
  hideBugList: true,
  initialMetrics: {},
  lessons: m07LessonsEn,
  mentor: 'laura',
  quiz: m07QuizEn,
  verdicts: {
    good: {
      title: "You know what you're testing",
      body: 'The "impossible" bug was explained, the fix was verified on its build, the configuration is under control and the migration is tested where it matters.',
    },
    ok: {
      title: 'Half-tracked versions',
      body: 'You found part of the problem, but some piece of configuration or maintenance will show. Check the debrief.',
    },
    bad: {
      title: 'Testing blind',
      body: 'Without knowing which version was in each environment, things were closed and reopened without grounds. Replay the mission starting with the environment comparison.',
    },
  },

  briefing: {
    title: 'Tuesday: which version is it?',
    paragraphs: [
      'Elena sees on staging that recurring invoices round VAT down. Tomás can\'t reproduce it locally and, while he\'s at it, asks you to close EMP-231 because "it\'s already pushed".',
      'On top of that, the e-invoicing vendor is migrating to its API v2 on Monday and Raúl needs to know which regression tests to run in three days.',
      'In the "Configuration" app you have the tracer: environment comparison, build history, defect report and impact analysis.',
    ],
    goals: [
      'Compare the environments and find the cause and the item that is not under version control.',
      'Decide on which build EMP-231 can be verified.',
      'Write a reproducible defect report, with exact versions.',
      'Identify the maintenance trigger and narrow down the regression testing by impact.',
      'Bring the configuration under control and defend the regression scope to Raúl.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: m07ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_configuracion',
      title: 'Configuration management at Kobalto',
      updatedLabel: 'Maintained by Iván Torres',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'config_mgmt' },
        { kind: 'unlock', conceptId: 'confirmation' },
      ],
      body: `## What it is (CTFL 5.4)
A discipline for **identifying, controlling and tracking** configuration items: code, builds, schemas, configuration files, flags, data and the testware itself (test cases, scripts, test data).

- Each item has a unique identifier and a version.
- You know which versions make up each build or environment (**baseline**), and changes go through change control.
- That way any test and any defect can be traced to an exact version and reproduced.
- In DevOps it is automated as part of the pipeline (CI/CD).

## Kobalto rule
Nothing is changed by hand in an environment. If it isn't in the repository and isn't deployed through the pipeline, it doesn't exist.

## Verifying a fix
A **confirmation test** is run on the build that contains the fix. Always check which build is deployed before closing or reopening a defect.`,
    },
    {
      id: 'guia_mantenimiento',
      title: 'Maintenance testing and defects',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'maintenance' },
        { kind: 'unlock', conceptId: 'impact_analysis' },
        { kind: 'unlock', conceptId: 'defect_report' },
      ],
      body: `## Triggers (CTFL 2.3)
- **Modifications**: enhancements, fixes, planned patches.
- **Upgrades or migrations of the operational environment**: change of platform, external service or data.
- **Retirement**: a system or part of it is no longer used (data archiving and restoration).

## Impact analysis
Before changing anything: which parts are affected, what the consequences are and **which regression testing is needed**. It relies on traceability and on knowing the dependencies. Full regression out of fear = wasted time; no regression = unmanaged risk.

## Defect report (CTFL 5.5)
Identifier, concise title, date and author, **test object and test environment with versions**, context, steps to reproduce, **expected and actual results**, severity and priority, status and references.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'P-CAUSA', title: "Two days hunting the VAT bug in the code: it was staging's billing.yml", severity: 'medium', explanation: "Nobody compared the environments' configuration.", technique: 'Compare environments item by item.', preventedBy: 'config.found' },
    { id: 'P-FIX', title: 'EMP-231 was closed without being deployed and due-date handling fails in production', severity: 'critical', explanation: 'The fix was merged, but not in the staging build.', technique: 'Confirmation testing on the build that contains the fix.', preventedBy: 'fix.verified' },
    { id: 'P-INFORME', title: 'The VAT defect bounces back three times: "cannot reproduce"', severity: 'medium', explanation: "The report didn't say which version or configuration it happened with.", technique: 'Report with environment, versions and expected vs. actual result.', preventedBy: 'report.ok' },
    { id: 'P-CONFIG', title: 'Rounding changes again on the next deployment', severity: 'high', explanation: 'billing.yml was still not under version control.', technique: 'Configuration in the repository and deployed through the pipeline.', preventedBy: 'config.controlled' },
    { id: 'P-IMPACTO', title: 'Credit notes fail with the new vendor: nobody tested them', severity: 'high', explanation: 'Without impact analysis, an affected feature was left out.', technique: 'Impact analysis following the dependencies.', preventedBy: 'impact.ok' },
    { id: 'P-REGRESION', title: 'The migration arrives without the right regression testing', severity: 'high', explanation: "Full regression that doesn't fit the deadline, or none at all.", technique: 'Regression narrowed by impact and defended with numbers.', preventedBy: 'regression.impact' },
  ],

  prevention: {
    title: 'Your tracing',
    intro: 'Knowing which version is being tested and what each change touches prevents very specific problems.',
    preventedLabel: 'Problems you prevent',
    appearedLabel: 'Problems that will show up',
    rules: [
      { flag: 'config.found', label: 'Cause in the configuration', explanation: 'staging had billing.yml with round: down.' },
      { flag: 'fix.verified', label: 'Fix verified on its build', explanation: 'EMP-231 goes into #412; it was deployed and verified on that build.' },
      { flag: 'report.ok', label: 'Reproducible report', explanation: 'Specific title, exact versions and €7.00 expected vs. €6.99 actual.' },
      { flag: 'config.controlled', label: 'Configuration under version control', explanation: 'billing.yml in the repository and deployed through the pipeline.' },
      { flag: 'impact.ok', label: 'Impact properly scoped', explanation: 'Issuing, recurring invoices, credit notes and PDF.' },
      { flag: 'regression.impact', label: 'Regression based on impact', explanation: 'Three days where the migration hits, not five and a half out of fear.' },
    ],
  },

  concepts: [
    { id: 'config_mgmt', title: 'Configuration management', summary: 'Identifying, controlling and tracking items (code, builds, schemas, configuration, flags, data, testware) so that every test and every defect can be traced to an exact version. (CTFL 5.4)' },
    { id: 'confirmation', title: 'Confirmation and regression testing', summary: 'Confirmation: check that the fix corrects the defect, on the build that contains it. Regression: check that the change has not broken anything else. (CTFL 2.2.3)' },
    { id: 'maintenance', title: 'Maintenance testing', summary: 'Triggered by modifications, upgrades or migrations of the operational environment, and retirement. (CTFL 2.3)' },
    { id: 'impact_analysis', title: 'Impact analysis', summary: 'Before a change, identify which parts are affected in order to decide which regression tests to run. (CTFL 2.3)' },
    { id: 'defect_report', title: 'Defect report', summary: 'Title, test object and environment with versions, steps, expected vs. actual, severity, priority and status: what is needed to reproduce it. (CTFL 5.5)' },
  ],
  debriefConcepts: ['config_mgmt', 'confirmation', 'maintenance', 'impact_analysis', 'defect_report'],
  seniorTips: [
    'Cause and unversioned item: billing.yml (round: down on staging, edited by hand).',
    'EMP-231 goes into #412 and staging has #409: deploy #412 and verify on it.',
    'Report: specific title, environment with exact versions and €7.00 expected vs. €6.99 actual.',
    "The vendor's migration is a migration / operational environment upgrade trigger.",
    'Impact: issuing, recurring invoices, credit notes and PDF (3 days). The rest is covered by the automated regression suite.',
  ],
}
