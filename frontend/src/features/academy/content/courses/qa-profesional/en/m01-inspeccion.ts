import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m01LessonsEn } from './m01-lessons'
import { m01QuizEn } from './m01-quiz'
import { m01ReviewEn } from './m01-review'

/**
 * Course 2: Professional QA · Mission 1 — The inspection (CTFL 3.1 and 3.2).
 * English translation of ../m01-inspeccion.ts (same structure and ids).
 *
 * The Recurring invoicing specification goes to development at 4:00 PM.
 * Carmen demands a formal review. The player plans it (type and roles),
 * prepares, holds the meeting, handles the author and follows up.
 * Whatever isn't found today shows up as bugs once it reaches development.
 */
export const m01InspeccionEn: Mission = {
  id: 'm01-inspeccion',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 1,
  title: 'The inspection',
  subtitle: 'Static testing: review types, roles, process and success factors.',
  world: kobaltoWorldEn,
  playerRole: 'QA for the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Monday',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-inspection',
  appLabel: 'Review Room',
  hideBugList: true,
  initialMetrics: {},
  requirementsReview: m01ReviewEn,
  lessons: m01LessonsEn,
  mentor: 'laura',
  quiz: m01QuizEn,
  verdicts: {
    good: {
      title: 'A textbook inspection',
      body: 'Carmen files your minutes as an example for the audit, and Tomás admits the review saved him a week of reworking code.',
    },
    ok: {
      title: 'Review done, with gaps',
      body: 'The specification improved, but some defects slipped through to development. Check which type, which roles or which process step was missing.',
    },
    bad: {
      title: 'A box-ticking review',
      body: 'Without the right type, the right people or a follow-up, the review is just a formality. Replay the mission starting with the planning.',
    },
  },

  briefing: {
    title: 'Monday: the inspection',
    paragraphs: [
      'Six months after your first day, you are no longer a junior: you have been assigned to the new Kobalto Business squad. Its first big feature, recurring invoicing for freelancers and small businesses, goes to development today at 4:00 PM.',
      'The specification was written by Elena, the PO, and Carmen (Compliance) demands a formal review: invoicing is regulated and she wants evidence of who reviewed what.',
      'It’s up to you to organize it: choose the review type, who takes part and in what role, prepare, run the meeting tactfully and check that everything gets fixed. Whatever isn’t found today will be coded wrong tomorrow.',
    ],
    goals: [
      'Plan the review in the Review Room: a type that fits the objective and the right roles.',
      'Do your individual review: mark the defects in the specification.',
      'Hold the meeting and handle the author by focusing on the document.',
      'Follow up on the fixes before 4:00 PM.',
      'Give Raúl and Carmen a review report with evidence.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'wiki' },
    { tool: 'app' },
    {
      tool: 'review',
      enabledWhen: { kind: 'flag', key: 'review.convened' },
      lockedMessage: 'First plan and convene the review in the Review Room.',
    },
    { tool: 'tickets' },
  ],

  scenes: [
    {
      id: 'mail_raul',
      channel: 'email',
      from: 'raul',
      at: 0,
      subject: 'Welcome to the Business squad',
      body: 'Hi!\n\nAs of today you are the QA person for the **Kobalto Business** squad. First mission: the **Recurring invoicing (KOB-E-12)** specification goes to development **today at 4:00 PM**.\n\nCarmen wants it reviewed first. Organize it however you see fit: you can plan it in the **Review Room**. At 4:00 PM I want to know whether it’s ready.\n\nRaúl',
    },
    {
      id: 'mail_carmen',
      channel: 'email',
      from: 'carmen',
      at: 0,
      subject: 'KOB-E-12: I need formal evidence',
      body: 'Hi,\n\nInvoicing is **regulated** (numbering, corrective invoices, invoice records). Before it gets coded I need a review with **evidence**: who reviewed it, which defects were found and how they were closed.\n\nIf you want me in the review, count me in; I know the regulations.\n\nCarmen López · Risk & Compliance',
    },
    {
      id: 'mail_elena',
      channel: 'email',
      from: 'elena',
      at: 0,
      subject: 'Recurring invoicing spec',
      body: 'Hi 👋\n\nHere’s the recurring invoicing specification. I wrote it in a rush on Friday, but I think it’s pretty clear 😊\n\nLet me know if you need anything.\n\nElena · PO Business',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'raul',
      with: ['tomas', 'elena', 'laura'],
      at: 0,
      subject: 'Daily · Business squad',
      body: '**Tomás:** A formal review of the spec? I’ll read it in ten minutes, and if I see something I’ll tell Elena. Long meetings are a waste of time.\n\n**Raúl:** What do you propose?',
      choices: [
        {
          id: 'formal',
          text: 'This is regulated invoicing: a defect in the spec today is one sentence; in production, it’s incorrectly issued invoices. I propose a short formal review, with prior preparation, the right people and minutes for Carmen.',
          cost: 10,
          reply: 'OK, convince us with the result.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'unlock', conceptId: 'static_testing' },
            { kind: 'note', tone: 'good', text: 'You defended the value of reviewing a regulated document early, with a proportionate format.' },
          ],
        },
        {
          id: 'informal',
          text: 'OK, let Tomás read it and give Elena his comments.',
          cost: 5,
          reply: '👍',
          replyFrom: 'tomas',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You accepted an informal read of a regulated document.' },
          ],
        },
        {
          id: 'later',
          text: 'Let’s not waste time on the document: we’ll test it once it’s coded.',
          cost: 5,
          reply: 'Hmm… Carmen won’t be happy.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'unlock', conceptId: 'static_testing' },
            { kind: 'note', tone: 'bad', text: 'You proposed waiting for the code instead of reviewing the specification (static testing).' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 120,
      when: { kind: 'notFlag', key: 'review.convened' },
      body: 'Have you convened the review yet? Watch the clock: individual preparation and the meeting take time. The review guide is in the wiki in case you’re unsure about the type or the roles.',
      onDeliver: [{ kind: 'unlock', conceptId: 'review_types' }],
    },
    {
      id: 'carmen_type',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'review.convened' }, { kind: 'notFlag', key: 'review.type.inspection' }] },
      body: 'I’ve seen the invitation. For compliance I need an **inspection**: preparation, defect log and verified closure. Any other format won’t work as evidence for the audit.',
      onDeliver: [
        { kind: 'score', key: 'risk', add: -1 },
        { kind: 'unlock', conceptId: 'review_types' },
        { kind: 'note', tone: 'bad', text: 'The review type didn’t fit the objective (regulatory evidence): an inspection was needed.' },
      ],
    },
    {
      id: 'laura_manager',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'role.manager.in' },
      body: 'You’ve invited Raúl to the meeting. Careful: with the boss in the room, people tend to keep quiet about what they see. Management is needed to provide time and resources, not as a reviewer.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'review_roles' },
        { kind: 'note', tone: 'bad', text: 'You brought management into the review meeting: less openness to point out defects.' },
      ],
    },
    {
      id: 'laura_roles_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'review.roles.ok' },
      body: 'Nice invitation 👌 An inspection, a moderator who isn’t the author, a scribe for the minutes, Carmen with the regulations and Raúl out of the room. Now, time to prepare.',
      onDeliver: [
        { kind: 'score', key: 'rigor', add: 1 },
        { kind: 'unlock', conceptId: 'review_roles' },
        { kind: 'note', tone: 'good', text: 'You convened an inspection with the right roles.' },
      ],
    },
    {
      id: 'laura_scribe',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'role.no_scribe' },
      body: 'Who’s going to take the minutes? Without a scribe, the defects are left up in the air and Carmen won’t have any evidence.',
      onDeliver: [{ kind: 'note', tone: 'bad', text: 'Nobody was recording the defects in the meeting.' }],
    },
    {
      id: 'meeting_tension',
      channel: 'meeting',
      from: 'elena',
      with: ['tomas', 'carmen'],
      when: { kind: 'flag', key: 'review.submitted' },
      subject: 'Review meeting · KOB-E-12',
      body: '**Elena:** OK… that’s a lot of defects for a spec I wrote in a rush. Is it really that bad? I feel a bit singled out.',
      choices: [
        {
          id: 'document',
          text: 'We’re reviewing the document, not you. Every defect we find today is a bug we won’t have to fix in code. And most of them are details you only see when reading as a group.',
          cost: 5,
          reply: 'Put that way… OK, I’ll get on with the fixes.',
          replyFrom: 'elena',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'review_success' },
            { kind: 'note', tone: 'good', text: 'You kept the meeting focused on the product, not the author.' },
          ],
        },
        {
          id: 'blunt',
          text: 'Well, honestly, it does have quite a few mistakes.',
          cost: 5,
          reply: '…',
          replyFrom: 'elena',
          effects: [
            { kind: 'score', key: 'communication', add: -2 },
            { kind: 'unlock', conceptId: 'review_success' },
            { kind: 'note', tone: 'bad', text: 'You gave feedback on the person rather than on the document.' },
          ],
        },
        {
          id: 'drop',
          text: 'If it bothers you, we can leave the minor ones out of the minutes.',
          cost: 5,
          reply: 'Well… if you say so.',
          replyFrom: 'elena',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You offered not to log defects to avoid conflict.' },
          ],
        },
      ],
    },
    {
      id: 'elena_fixed',
      channel: 'chat',
      from: 'elena',
      when: { kind: 'flag', key: 'review.submitted' },
      body: 'I’ve uploaded the corrected version of the spec (v2) with everything from the minutes. Can you check it before it goes to development?',
      onDeliver: [{ kind: 'unlock', conceptId: 'review_process' }],
    },
    {
      id: 'handoff',
      channel: 'meeting',
      from: 'raul',
      with: ['tomas', 'carmen', 'elena'],
      at: 420,
      subject: '4:00 PM · KOB-E-12 handoff to development',
      body: '**Raúl:** The spec is going to development. How did the review go?',
      onDeliver: [
        { kind: 'if', when: { kind: 'notFlag', key: 'clarify.iva' }, then: [{ kind: 'flag', key: 'fu.safe' }] },
        { kind: 'preventBugs' },
      ],
      choices: [
        {
          id: 'report',
          text: 'Inspection report: participants and roles, defects found during preparation and in the meeting, all fixed by Elena and verified in the follow-up. Carmen has the minutes.',
          requires: { kind: 'all', of: [{ kind: 'flag', key: 'review.followup' }, { kind: 'flag', key: 'review.type.inspection' }] },
          cost: 15,
          reply: 'This is exactly what I need for the audit. Thank you.',
          replyFrom: 'carmen',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'You closed the review with a report and evidence: fixes verified in the follow-up.' },
          ],
        },
        {
          id: 'no_followup',
          text: 'We reviewed the spec and Elena fixed everything in the minutes.',
          requires: { kind: 'flag', key: 'review.submitted' },
          cost: 15,
          reply: 'And who checked that the fixes are correct?',
          replyFrom: 'carmen',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You closed the review without checking the fixes.' }],
        },
        {
          id: 'nothing',
          text: 'There wasn’t time to review it fully; whatever it is will come up in testing.',
          cost: 15,
          reply: 'Then I can’t give the compliance sign-off.',
          replyFrom: 'carmen',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'note', tone: 'bad', text: 'The specification went to development without a complete review.' },
          ],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '5:00 PM · Coffee with Laura',
      body: '**Laura:** How was your first review as the person in charge?',
      choices: [
        {
          id: 'lesson',
          text: 'That a review isn’t just reading a document: it’s choosing the type for the objective, bringing together the right people in the right roles, preparing, talking about the document and not the author, and checking the fixes.',
          requires: { kind: 'flag', key: 'review.submitted' },
          reply: 'Exactly. And now you also have the metrics to improve the next one.',
          effects: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'waste',
          text: 'That formal reviews are too slow.',
          reply: 'Check the debrief to see how many bugs were born from what wasn’t reviewed.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You focused on the cost of the review, not on its return.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_revisiones',
      title: 'Team review guide',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'review_types' },
        { kind: 'unlock', conceptId: 'review_roles' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Review types
- **Informal review**: no process, no record. Quick questions.
- **Walkthrough**: the author leads the reading; reviewers don’t usually prepare. Educate and build consensus.
- **Technical review**: technical reviewers with preparation. Consensus and technical decisions.
- **Inspection**: individual preparation, moderator, scribe, defect log and metrics. Maximum number of defects and **evidence** (regulations, audits).

## Roles
- **Manager**: decides what gets reviewed and provides time and resources. Does not take part in the meeting.
- **Author**: writes and fixes the document.
- **Moderator (facilitator)**: runs the meeting and keeps it a safe environment. Never the author.
- **Scribe**: records defects and decisions (the minutes).
- **Reviewers**: different perspectives (business, development, regulations, testing).

## Process
1. Planning · 2. Review initiation · 3. Individual review (with a checklist) · 4. Communication and analysis (meeting) · 5. Fixing and reporting (follow-up).

## Success factors
A clear objective, the right type, preparation, feedback on the document and not on the person, no hierarchical pressure in the room, and follow-up on the fixes.`,
    },
    {
      id: 'checklist',
      title: 'Specification checklist',
      updatedLabel: 'QA team',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'review_process' }],
      body: `## Before accepting a specification
- Are there sentences that contradict each other across sections (dates, amounts, statuses)?
- Are **dates and calendars** defined for every case (days that don’t exist, public holidays)?
- Do **amounts** state what base they are calculated on, in what order, and how they are rounded?
- What happens when something **fails** (retries, limits, final state)?
- Are the specific **regulations** that apply, and their requirements, cited?
- Are all requirements **verifiable** (no “fast,” “easy,” “intuitive”)?
- What happens with **changes** in the middle of a cycle (plans, prices)?`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-12',
      title: 'Functional specification · Recurring invoicing for Kobalto Business customers',
      status: 'In review',
      type: 'story',
      description: 'Business customers set up recurring invoices for their own customers: issuing, numbering, amounts, payment collection and corrections. It goes to development today at 4:00 PM. The full document is in the “Review” tool.',
      acceptanceCriteria: ['The specification is reviewed before going to development.', 'The defects found are logged, fixed and verified.', 'Compliance receives evidence of the review.'],
      comments: [
        { author: 'elena', body: 'Written in a rush on Friday, but I think it’s clear 😊' },
        { author: 'tomas', body: 'As soon as it goes to development I’ll get started; we’re tight on time.' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'E-FECHA', title: 'Some invoices are issued on the 1st and others on the sign-up date', severity: 'medium', explanation: 'The spec said both; each part of the code implemented one of them.', technique: 'Review: look for contradictions between sections.', preventedBy: 'clarify.fecha' },
    { id: 'E-NUM', title: 'Invoice numbering has gaps when invoices are voided (non-compliant)', severity: 'critical', explanation: 'Nobody specified the gap-free sequential numbering required by law.', technique: 'Review with a regulatory perspective (Compliance as a reviewer).', preventedBy: 'clarify.numeracion' },
    { id: 'E-IVA', title: 'VAT is calculated on the total and doesn’t match the sum of the lines', severity: 'high', explanation: '“On the amount” was interpreted as the invoice total, without per-line discounts or per-line rounding.', technique: 'Technical review: ask about the base, order and rounding of every calculation.', preventedBy: 'clarify.iva' },
    { id: 'E-PLAN', title: 'Changing plans charges the full month for both plans', severity: 'medium', explanation: 'The spec didn’t say what happened to the current month.', technique: 'Review: mid-cycle changes (checklist).', preventedBy: 'clarify.prorrateo' },
    { id: 'E-REINT', title: 'Failed payments are retried indefinitely', severity: 'high', explanation: '“It is retried,” with no number or interval: the code retries every hour, forever.', technique: 'Review: what happens when something fails, and what is the final state.', preventedBy: 'clarify.reintentos' },
    { id: 'E-BORRAR', title: 'Issued invoices can be deleted', severity: 'critical', explanation: 'The spec allowed deleting and reissuing; the regulations require corrective invoices.', technique: 'Review with a regulatory perspective.', preventedBy: 'clarify.rectificativa' },
    { id: 'E-RAPIDO', title: 'Nobody knows what sending time is acceptable', severity: 'low', explanation: '“Fast” can’t be tested: there is no criterion for the performance tests.', technique: 'Review: unverifiable requirements.', preventedBy: 'clarify.rapido' },
    { id: 'E-NORMA', title: 'The invoice record required by the regulations is not implemented', severity: 'high', explanation: '“Complies with the regulations in force” didn’t say which ones or what their requirements were.', technique: 'Checklist-based review: specific, verifiable regulations.', preventedBy: 'clarify.normativa' },
    { id: 'E-FU', title: 'The VAT fix was only half done: the example still calculates on the total', severity: 'high', explanation: 'Elena fixed the rule but not the example; without follow-up, development implemented the example.', technique: 'Fixing and reporting: verify each fix in the minutes (follow-up).', preventedBy: 'fu.safe' },
  ],

  concepts: [
    { id: 'static_testing', title: 'Static testing', summary: 'Examining work products without executing them. It finds defects (not failures) very early, when fixing them is cheapest. (CTFL 3.1)' },
    { id: 'review_types', title: 'Review types', summary: 'Informal review, walkthrough, technical review and inspection: chosen according to the objective. An inspection is the most formal and leaves evidence. (CTFL 3.2.4)' },
    { id: 'review_roles', title: 'Roles in a review', summary: 'Manager (out of the room), author, moderator (never the author), scribe, reviewers with different perspectives, and review leader. (CTFL 3.2.3)' },
    { id: 'review_process', title: 'Review process', summary: 'Planning, review initiation, individual review (with a checklist), communication and analysis, and fixing and reporting with follow-up. (CTFL 3.2.2)' },
    { id: 'review_success', title: 'Success factors', summary: 'The right objective and type, preparation, feedback on the product and not the person, no hierarchical pressure, and follow-up. (CTFL 3.2.5)' },
  ],
  debriefConcepts: ['static_testing', 'review_types', 'review_roles', 'review_process', 'review_success'],
  seniorTips: [
    'Read Carmen’s email: “evidence” for an audit calls for an inspection, not an informal read.',
    'Roles: Laura (or you) moderates, Sofía is the scribe and a reviewer, Tomás and Carmen review, Raúl stays out of the room, Elena is the author.',
    'Hand out the checklist: Carmen spots the regulations that aren’t named.',
    'Really prepare: nobody else is going to find the date contradiction or the “fast.”',
    'In the meeting, talk about the document, not about Elena.',
    'Follow up before 4:00 PM: a half-done fix is still a bug.',
  ],
}
