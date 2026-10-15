import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m04LessonsEn } from './m04-lessons'
import { m04QuizEn } from './m04-quiz'
import { m04ScenesEn } from './m04-scenes'

/**
 * Course 2: Professional QA · Mission 4 — Expert intuition (CTFL 4.4).
 * English version of m04-exploratoria.ts (same structure, translated text only).
 */
export const m04ExploratoriaEn: Mission = {
  id: 'm04-exploratoria',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 4,
  title: 'Expert intuition',
  subtitle: 'Experience-based techniques: exploratory testing with charters, error guessing and checklists.',
  world: kobaltoWorldEn,
  playerRole: 'QA on the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Thursday',
  duration: 480,
  appActionCost: 10,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-explore',
  appLabel: 'Exploration',
  initialMetrics: {},
  lessons: m04LessonsEn,
  mentor: 'laura',
  quiz: m04QuizEn,
  verdicts: {
    good: {
      title: 'Intuition with method',
      body: "You found what the checklist couldn't see, stopped the dangerous issue in time, and the team keeps a better checklist.",
    },
    ok: {
      title: 'Good findings, little method',
      body: 'You found things, but something about the charter, the report or the 1:00 PM decision went wrong. Check the debrief.',
    },
    bad: {
      title: 'The checklist said green',
      body: 'The new features shipped without being explored. Replay the mission starting with a charter focused on what is new.',
    },
  },

  briefing: {
    title: 'Thursday: expert intuition',
    paragraphs: [
      'The new "Team Cards" panel reaches staging with little documentation: just Elena\'s release notes. At 1:00 PM Raúl decides whether it ships on Friday.',
      "There's no time to design formal test cases for everything. You have the team checklist, your experience of where software usually fails, and time-boxed exploratory sessions with a charter.",
      'In the "Exploration" app you choose where and how to attack. Whatever you find gets reported on the Board, with the note as evidence.',
    ],
    goals: [
      'Organize the exploration into chartered sessions: which areas, to discover what, and for how long.',
      'Focus first on what is new and riskiest.',
      'Use error guessing attacks and report each bug with its evidence.',
      'At 1:00 PM, give Raúl a risk-based go/no-go recommendation.',
      "Improve the team checklist with what worked today.",
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m04ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'notas_v2',
      title: 'Release notes · Team Cards v2',
      updatedLabel: 'Elena Prieto',
      readCost: 3,
      onRead: [{ kind: 'flag', key: 'notes.read' }],
      body: `## What's new
- **Freeze and unfreeze** cards from the panel (previously only from the mobile app).
- **Invite employees by email**: they activate their card from the link.
- **Export the month's expenses** as CSV for the accountants.

## Unchanged
- Card creation and limit changes (apart from visual tweaks).`,
    },
    {
      id: 'guia_exploratoria',
      title: 'Exploratory testing and error guessing guide',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'exploratory' },
        { kind: 'unlock', conceptId: 'error_guessing' },
      ],
      body: `## Exploratory session
- **Charter**: "Explore [area] with [resources] to discover [information]".
- **Timebox**: 30, 60 or 90 minutes.
- During the session you learn, design and execute at the same time, taking notes.
- At the end: **session report** (what was covered, what was found, what remains).

## Error guessing: typical attacks
Empty fields, boundary and out-of-range values, special characters, double click, going back or reloading, expired session, concurrent operations and duplicate data.

## When it fits
Poor specifications, little time, or to complement more formal techniques.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-40',
      title: 'Team Cards v2 · validation before Friday',
      status: 'In testing',
      type: 'story',
      description: 'New: freeze from the panel, email invitation and CSV export. Minimal documentation. Go/no-go decision at 1:00 PM.',
      acceptanceCriteria: ['Risk-based go/no-go recommendation.', 'Bugs reported with evidence.'],
      comments: [{ author: 'tomas', body: 'Ran the team checklist yesterday: all OK.' }],
      actions: [],
    },
  ],

  bugs: [
    { id: 'X-SESION', title: 'With an expired session, "Freeze" shows success but the card keeps paying', severity: 'critical', explanation: 'The call fails because the session expired, but the UI shows success without checking the response.', technique: 'Error guessing: expired session on a new, critical operation.', fix: { delay: 60, note: 'Now, if the session has expired, the user is asked to log in again and no success message is shown.' } },
    { id: 'X-DOBLE', title: 'Double-clicking "Create card" creates two cards', severity: 'high', explanation: 'The button is not disabled after the first submission and the server does not prevent duplicates.', technique: 'Error guessing: double click / repeated submission.', fix: { delay: 45 } },
    { id: 'X-NEG', title: 'A negative limit is accepted and the card ends up with no limit', severity: 'high', explanation: 'Range validation only existed on card creation, not on limit changes.', technique: "Out-of-range values on a screen the checklist didn't cover.", fix: { delay: 45 } },
    { id: 'X-INVITA', title: 'Inviting the same email twice creates two employees', severity: 'medium', explanation: 'The invitation does not check whether the email already exists.', technique: 'Error guessing: duplicate data.', fix: { delay: 60 } },
    { id: 'X-CSV', title: 'A description containing ";" shifts the CSV columns', severity: 'medium', explanation: 'The exporter does not escape the separator.', technique: 'Error guessing: special characters in an export.', fix: { delay: 60 } },
    { id: 'X-TILDE', title: 'Names with ñ or accents come out garbled on the virtual card', severity: 'medium', explanation: 'The virtual card uses an encoding other than UTF-8.', technique: 'Error guessing: special characters.', fix: { delay: 60 } },
  ],

  prevention: {
    title: 'How you explored',
    intro: 'Experience-based techniques work better with a bit of method.',
    preventedLabel: '',
    appearedLabel: '',
    rules: [
      { flag: 'charter.used', label: 'You explored with a charter and a timebox', explanation: 'Areas, goal and time defined before starting.' },
      { flag: 'charter.risk', label: 'The charter focused on what is new', explanation: "Freeze, invite and export: where the risk is and where the checklist doesn't reach." },
      { flag: 'charter.focus', label: 'Goal aimed at business risk', explanation: 'Cards that pay when they shouldn\'t, not "the UI looks nice".' },
      { flag: 'session.report', label: 'You closed sessions with a report', explanation: 'What was covered, what was found and what remains open.' },
      { flag: 'gonogo.right', label: 'Risk-based go/no-go', explanation: 'No-go because of the critical freeze bug, with the rest scheduled.' },
      { flag: 'checklist.improved', label: 'Checklist improved', explanation: 'With the attacks that actually found failures.' },
    ],
  },

  concepts: [
    { id: 'error_guessing', title: 'Error guessing', summary: 'Anticipating errors, defects and failures based on knowledge of how software has failed before. Applied methodically through "attacks". (CTFL 4.4.1)' },
    { id: 'exploratory', title: 'Exploratory testing', summary: 'Designing, executing and evaluating tests at the same time while learning about the test object. Done in sessions with a charter and a timebox. Useful with poor specifications or little time. (CTFL 4.4.2)' },
    { id: 'checklist_based', title: 'Checklist-based testing', summary: "A checklist captures the team's experience, but it has to be kept alive: what it doesn't know, it doesn't see. (CTFL 4.4.3)" },
    { id: 'experience_based', title: 'Experience-based test techniques', summary: 'They leverage the knowledge of testers, developers and users. They complement black-box and white-box techniques. (CTFL 4.4)' },
  ],
  debriefConcepts: ['experience_based', 'error_guessing', 'exploratory', 'checklist_based'],
  seniorTips: [
    'First session: "Freeze" and "Invite", goal "cards that pay when they shouldn\'t", 60 min.',
    'Freeze × expired session is the critical bug: report it before 1:00 PM and recommend no-go.',
    'Second session: "Export" and "Limit change" (special characters and negative values).',
    "The team checklist comes out green: it doesn't see the new features or limit changes with negative values.",
    'Close each session with a report and add the attacks that worked to the checklist (double click, expired session, special characters, duplicates).',
  ],
}
