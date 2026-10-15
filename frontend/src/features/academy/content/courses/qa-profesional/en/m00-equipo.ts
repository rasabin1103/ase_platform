import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m00LessonsEn } from './m00-lessons'
import { m00QuizEn } from './m00-quiz'
import { m00ScenesEn } from './m00-scenes'

/**
 * Course 2: Professional QA · Mission 0 — New team (CTFL 1.4, 1.5 and 2.1).
 * English translation of ../m00-equipo.ts (same structure and ids).
 *
 * First day as the quality lead of the Business squad. The player proposes
 * the test process (activities, testware and roles), completes the
 * traceability matrix for Carmen and defends the whole-team approach with
 * independence. Whatever is missing from the process is paid for in the sprints.
 */
export const m00EquipoEn: Mission = {
  id: 'm00-equipo',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 0,
  title: 'New team',
  subtitle: 'Test process: activities, testware, roles, traceability and the whole team.',
  world: kobaltoWorldEn,
  playerRole: 'QA for the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Monday',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-process',
  appLabel: 'Process',
  hideBugList: true,
  initialMetrics: {},
  lessons: m00LessonsEn,
  mentor: 'laura',
  quiz: m00QuizEn,
  verdicts: {
    good: {
      title: 'A process that makes sense',
      body: 'Raúl approves your proposal as the squad’s process, Carmen has her traceability, and Tomás and Sofía already talk about “our” tests.',
    },
    ok: {
      title: 'A good start, with gaps',
      body: 'The squad now has a process, but some pieces are failing. Check the debrief to see the consequences of each gap.',
    },
    bad: {
      title: 'Everyone their own way',
      body: 'Without a clear process, traceability or a team, everything stays as it was. Replay the mission starting with the guide in the wiki.',
    },
  },

  briefing: {
    title: 'Monday: new team',
    paragraphs: [
      'Six months after your first day at Kobalto, you are no longer a junior. You have just been assigned to the new Kobalto Business squad, which builds accounts, cards and invoices for freelancers and small businesses.',
      'Here everyone tests their own way and nobody knows what has been tested. Raúl wants a process proposal for the 3:00 PM committee, and Carmen needs the traceability for “Team cards” for an audit at 2:00 PM.',
      'Today is not about finding bugs, but about building the system that will make sure they get found.',
    ],
    goals: [
      'At the daily, defend the whole team’s role in quality without giving up independence.',
      'Propose the process: activities in order, the testware of each one and who owns it.',
      'Complete the traceability matrix and send it to Carmen before 2:00 PM.',
      'Don’t let test completion disappear from the process.',
      'At the committee, explain when QA gets involved in each story.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m00ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_proceso',
      title: 'Test process guide',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_activities' },
        { kind: 'unlock', conceptId: 'testware' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Activities (CTFL 1.4.1)
- **Test planning**: objectives and approach. Produces the **test plan**.
- **Test monitoring and control**: compare progress against the plan and correct course. Produces **test progress reports**. It is continuous throughout the process.
- **Test analysis**: study the test basis and decide **what** to test. Produces prioritized **test conditions**.
- **Test design**: decide **how** to test it. Produces **test cases**.
- **Test implementation**: prepare everything needed for execution. Produces **test procedures, data and scripts**.
- **Test execution**: run the tests and compare results. Produces **test logs** and **defect reports**.
- **Test completion**: when a milestone ends, archive, evaluate and learn. Produces the **test completion report** with lessons learned.

## Roles (CTFL 1.4.5)
- **Test management**: test planning, test monitoring and control, and test completion.
- **Testing**: test analysis, design, implementation and execution.

The process is tailored to the context (risks, deadlines, team), but the activities always exist, even if they sometimes overlap or are informal.`,
    },
    {
      id: 'guia_traza',
      title: 'Traceability: why and how',
      updatedLabel: 'Risk & Compliance',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'traceability' }],
      body: `## What it is for
- Knowing which requirements are tested (coverage) and which have open defects.
- Analyzing the impact of a change: which tests need to be rerun.
- Providing evidence in audits.

## The chain
Story → test condition → test case → result or defect. Each link connects to the previous one.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-07',
      title: 'Team cards (epic)',
      status: 'In progress',
      type: 'story',
      description: 'Cards for a small business’s employees: H1 spending limit per employee, H2 card blocking, H3 monthly expense report. The test cases and defects are in the test management tool, but not linked.',
      acceptanceCriteria: ['Each story has linked test conditions and test cases.', 'Open defects can be associated with the story they affect.'],
      comments: [{ author: 'carmen', body: 'For the audit I need the full chain, not a loose list of test cases.' }],
      actions: [],
    },
  ],

  bugs: [
    { id: 'P-ORDEN', title: 'Test cases are designed before deciding what to test: cases that cover no condition', severity: 'medium', explanation: 'Without the order analysis → design → implementation → execution, the team writes test cases without knowing which conditions they cover.', technique: 'Test process activities in logical order (CTFL 1.4.1).', preventedBy: 'proc.order' },
    { id: 'P-TESTWARE', title: 'Test data and scripts get lost between sprints', severity: 'medium', explanation: 'Nobody knew which work product came out of each activity, so nobody kept it.', technique: 'Testware of each activity (CTFL 1.4.3).', preventedBy: 'proc.testware' },
    { id: 'P-ROLES', title: 'Nobody decides when to stop testing or reports progress', severity: 'high', explanation: 'With the roles swapped, test monitoring and control had no owner.', technique: 'Test management vs. testing role (CTFL 1.4.5).', preventedBy: 'proc.roles' },
    { id: 'P-CIERRE', title: 'The next sprint repeats the same mistakes', severity: 'medium', explanation: 'Without test completion there are no lessons learned and no archived testware.', technique: 'Test completion as a test process activity.', preventedBy: 'proc.closure' },
    { id: 'P-TRAZA', title: 'The audit cannot verify which requirements are tested', severity: 'high', explanation: 'Without the chain story → condition → test case → defect there is no demonstrable coverage.', technique: 'Traceability (CTFL 1.4.4).', preventedBy: 'trace.ok' },
    { id: 'P-INDEP', title: 'Integration defects reach production', severity: 'critical', explanation: 'Each dev only tested their own code: nobody looked at the system independently.', technique: 'Whole team with independence of testing (CTFL 1.5.2 and 1.5.3).', preventedBy: 'team.indep' },
  ],

  prevention: {
    title: 'Your test process',
    intro: 'Each piece of the process prevents a specific problem in the upcoming sprints.',
    preventedLabel: 'Problems the squad won’t have',
    appearedLabel: 'Problems that will arrive in the upcoming sprints',
    rules: [
      { flag: 'team.indep', label: 'Whole team with independence', explanation: 'Devs test their own code and QA brings an independent view at system level.' },
      { flag: 'proc.order', label: 'Activities in order', explanation: 'Planning first, completion last, and analysis → design → implementation → execution. Monitoring and control is continuous.' },
      { flag: 'proc.testware', label: 'Testware of each activity', explanation: 'Plan, progress reports, conditions, test cases, procedures and data, logs and defects, and completion report.' },
      { flag: 'proc.roles', label: 'Roles correctly assigned', explanation: 'Test management: planning, monitoring and control, and completion. Testing: everything else.' },
      { flag: 'proc.closure', label: 'Test completion in the process', explanation: 'Thirty minutes at the end of the milestone to archive and learn.' },
      { flag: 'trace.ok', label: 'Full traceability', explanation: 'Story → condition → test case → defect, with no gaps.' },
      { flag: 'sdlc.early', label: 'QA from the start of the lifecycle', explanation: 'Every development activity has its test activity; analysis and design start as soon as there is a story.' },
    ],
  },

  concepts: [
    { id: 'test_activities', title: 'Test process activities', summary: 'Test planning, monitoring and control, analysis, design, implementation, execution and completion. They are tailored to the context. (CTFL 1.4.1–1.4.2)' },
    { id: 'testware', title: 'Testware', summary: 'Work products of each activity: test plan, progress reports, test conditions, test cases, procedures and data, test logs, defect reports and test completion report. (CTFL 1.4.3)' },
    { id: 'traceability', title: 'Traceability', summary: 'Links between the test basis, testware and results: it allows you to measure coverage, analyze the impact of changes and provide evidence. (CTFL 1.4.4)' },
    { id: 'test_roles', title: 'Roles in testing', summary: 'Test management (planning, monitoring and control, completion) and testing (analysis, design, implementation, execution). (CTFL 1.4.5)' },
    { id: 'whole_team', title: 'Whole-team approach', summary: 'Any team member with the necessary skills can perform any task; quality is everyone’s responsibility. (CTFL 1.5.2)' },
    { id: 'independence', title: 'Independence of testing', summary: 'An independent tester finds different defects from the author’s because of their different biases. It is usually best to combine several levels of independence. (CTFL 1.5.3)' },
    { id: 'sdlc_testing', title: 'Testing in the software development lifecycle', summary: 'Every development activity has a corresponding test activity; test analysis and design start as soon as there is a test basis; testers review drafts. Early testing. (CTFL 2.1.2 and 2.1.5)' },
  ],
  debriefConcepts: ['test_activities', 'testware', 'traceability', 'test_roles', 'whole_team', 'independence', 'sdlc_testing'],
  seniorTips: [
    'At the daily: devs with their unit tests and QA with an independent view; it’s not “one or the other.”',
    'Order: 1 planning · 2 monitoring and control (it’s continuous) · 3 analysis · 4 design · 5 implementation · 6 execution · 7 completion.',
    'Test management owns planning, monitoring and control, and completion; the tester does the rest.',
    'Matrix: D1 comes from T5 (the €500 boundary) → C1 → H1; D2 comes from T3 → C3 → H2.',
    'Send the matrix before 2:00 PM and don’t remove test completion even if Tomás calls it paperwork.',
    'At the committee: QA gets involved from refinement.',
  ],
}
