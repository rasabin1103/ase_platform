import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m10Incidente } from '../m10-incidente'
import { missionEn } from './missionEn'
import { FICHA_HEAD_OF_QA_EN } from './shared'

/** Course 4: QA Team Management · Mission 10 — The big incident. English version of ../m10-incidente.ts. */
export const m10IncidenteEn = missionEn(
  m10Incidente,
  {
    title: 'The big incident',
    subtitle: 'Head of QA: crisis with Compliance, blameless postmortem, protecting people without hiding failures and turning it into organizational changes.',
    playerRole: 'Head of QA',
    dayLabel: 'Monday · year 7',
    appLabel: 'Postmortem',
    wikiLabel: 'Wiki · Quality',
    verdicts: {
      good: {
        title: 'A crisis that changes the company',
        body: 'The regulator closes the file with the actions under way, Pablo keeps warning about risks and, three months later, known risks are decided by their owner. QA has stopped being the only gate.',
      },
      ok: { title: 'Crisis contained, lesson halfway', body: 'The fire was put out, but something that caused it is still there. Check the debrief to see what.' },
      bad: {
        title: 'Looking for culprits',
        body: 'There was a culprit and nothing changed: the next known risk will ship the same way, and nobody will warn. Replay the mission starting with the crisis committee.',
      },
    },
    briefing: {
      title: 'Year 7 · Head of QA',
      paragraphs: [
        'You are Head of QA of a digital bank with 40 squads and 70 QAs.',
        'Over the weekend 3,200 instant transfers were duplicated. Today it is in the press and the regulator asks for a report within 72 hours.',
        'At 10:00, crisis committee. Someone is going to ask where QA was.',
      ],
      goals: [
        'Read the Head of QA role sheet.',
        'Give Compliance the facts, early and unvarnished.',
        "At the crisis committee, take on QA's part without looking for culprits.",
        'Prepare the postmortem in the “Postmortem” app: system causes and actions.',
        'Protect whoever warned about the risk.',
        'Turn the incident into organizational changes and correct the report to the regulator.',
      ],
    },
    scenes: {
      mail_irene: {
        subject: 'Crisis committee at 10:00',
        body: "Good morning:\n\nOver the weekend 3,200 instant transfers were duplicated. Today it is in the press and the regulator asks for a preliminary report within 72 hours.\n\nCrisis committee at 10:00. I want to understand what happened and what we are going to change.\n\nIrene · CEO",
      },
      carmen_facts: {
        body: "The regulator asks for a preliminary report within 72 hours. I need QA's facts, unvarnished. What can you give me?",
        choices: {
          facts: {
            text: "Today I'll send you the timeline, with what we know and what we don't yet, including ticket PAG-412 where QA warned about the risk. No assumptions.",
            reply: 'Perfect. With the regulator, early transparency is worth more than a perfect report late.',
            effects: { 2: { text: 'You gave Compliance the facts early, including what does not make anyone look good.' } },
          },
          minimize: {
            text: "It was an isolated case. There's no need to go into so much detail.",
            reply: "Isolated, with 3,200 customers? The regulator won't see it that way.",
            effects: { 1: { text: 'You downplayed the incident to Compliance.' } },
          },
          wait: {
            text: 'When we have the complete postmortem, in a few weeks.',
            reply: 'We have 72 hours, not weeks.',
            effects: { 0: { text: 'You were going to give the facts late to someone with a regulator deadline.' } },
          },
        },
      },
      crisis: {
        subject: '10:00 · Crisis committee',
        body: "**Irene:** Tell me.\n\n**Raúl:** What I want to know is where QA was. Pablo signed off the release.",
        choices: {
          own: {
            text: "QA signed off, and it was a known risk: it was in PAG-412. I take on QA's part. But the useful question is not who signed, it is why a known risk reached production without anyone with authority accepting it. Now: compensate customers today and disable the retries. The postmortem, this afternoon and blameless.",
            reply: 'Agreed. Compensation today and postmortem this afternoon.',
            effects: { 3: { text: "You took on QA's part without looking for culprits and brought the conversation to customers and the system." } },
          },
          defend: {
            text: 'QA warned in the ticket. The fault is Product’s, who pushed to ship on Friday.',
            reply: 'So now it’s my fault?',
            effects: { 2: { text: 'You passed the blame to Product: the committee turns into a war between areas.' } },
          },
          scapegoat: {
            text: 'Pablo made a mistake signing off. We will take measures.',
            reply: 'Good, let it be known there are consequences.',
            effects: { 2: { text: 'You singled out Pablo, who had warned about the risk.' } },
          },
        },
      },
      pablo_worried: {
        body: "I was told I came up at the committee. Are they going to fire me? I warned in the ticket…",
        choices: {
          support: {
            text: "Nobody is going to single you out. You warned, and you did what the system asked of you; what we are going to change is the system. At the postmortem, tell what happened calmly. And if you need to talk, I'm here.",
            reply: 'Thanks. Really.',
            effects: { 2: { text: 'You protected Pablo without hiding the failure: the system is what changes.' } },
          },
          cold: {
            text: "We'll see at the postmortem.",
            reply: 'OK…',
            effects: { 0: { text: 'You left Pablo with uncertainty at the worst moment.' } },
          },
          blame: {
            text: 'You signed off, Pablo.',
            reply: '…Understood.',
            effects: { 1: { text: 'You told Pablo that it was his fault.' } },
          },
        },
      },
      pm_ok: {
        body: "I read your draft: five system causes, no person, and an action for each. The first is the one that changes everything: that risks be decided by their owner and not by QA.",
      },
      postmortem: {
        subject: '14:00 · Incident postmortem',
        body: "**Raúl:** Let's begin. How do we approach it?",
        choices: {
          blameless: {
            text: "It is a blameless postmortem: we are not looking for who, but for why the system allowed a known risk to reach production. Pablo, tell us the timeline. Then we go over the five causes and agree an owner and date for each action.",
            reply: "This way anyone dares to tell what they saw. I'll take the action on risks accepted in writing.",
            effects: { 3: { text: 'You led a blameless postmortem, with system causes and actions with owners.' } },
          },
          names: {
            text: 'Let’s start with who signed off and why.',
            reply: '…',
            effects: { 0: { text: 'You opened the postmortem looking for a person: nobody tells what they know.' } },
          },
          skip: {
            text: "No postmortem needed: we already know what happened.",
            reply: 'And what do we change, then?',
            effects: { 0: { text: 'Without a postmortem, the system that allowed the failure stays the same.' } },
          },
        },
      },
      irene_change: {
        subject: '15:30 · Irene: “What changes?”',
        body: "**Irene:** The board asks me for more QA. Do we double the payments QA team and demand double sign-off?",
        choices: {
          org: {
            text: "More signatures would not have prevented it: the risk was already signed and warned about. What changes is that QA stops being the only gate. Risks are accepted by their owner, and quality goes into the system: an environment with retries, alerts, gradual deployment and idempotency. Every month I'll bring you the cost of poor quality. I'll detail it in the strategy.",
            reply: 'That is what I want to take to the board: what changes, not whom we punish.',
            effects: { 3: { text: 'You turned the incident into organizational changes, not into more control.' } },
          },
          more_qa: {
            text: 'Yes: more QA and double sign-off on all payments releases.',
            reply: 'Good, anybody can understand that.',
            effects: { 0: { text: 'You reinforced the idea that QA is the gate: the next known risk will ship the same way, with two signatures.' } },
          },
          luck: {
            text: 'It was bad luck: the payments network failed.',
            reply: 'The board will not accept “bad luck”.',
            effects: { 1: { text: 'You attributed the incident to bad luck, with a risk that had been warned about.' } },
          },
        },
      },
      carmen_report: {
        body: "The draft report to the regulator says “cause: human error by a QA”. Do we leave it like that? It is the quickest.",
        choices: {
          correct: {
            text: "No: it is neither true nor helpful. The regulator wants to know what failed and what we are changing. I'm sending you now the five system causes, each with its action, owner and date.",
            reply: 'Much better. A report like that closes the file sooner.',
            effects: { 2: { text: 'The report to the regulator explains causes and actions, it does not blame a person.' } },
          },
          keep: {
            text: "Leave it, it's the quickest.",
            reply: 'OK. Although they will ask for measures about that person…',
            effects: { 0: { text: 'You let the official report blame a QA.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** Your first big crisis as Head of QA. What are you taking away?',
        choices: {
          lesson: {
            text: "That in a crisis customers and facts come first, early and unvarnished. That you take on your own part without looking for culprits, that people who warned are protected, and that the incident becomes system changes: QA cannot keep being the only gate.",
            reply: "Exactly. That “QA is the gate” thing you lived on your first day… now it is up to you to change it.",
          },
          control: {
            text: 'That we need more control over releases.',
            reply: 'More control is more gate. Check the debrief.',
            effects: { 0: { text: 'You kept more control: it is what made QA the only gate.' } },
          },
        },
      },
    },
    docs: {
      ficha_head: FICHA_HEAD_OF_QA_EN,
      pm_guide: {
        title: 'Blameless postmortems',
        updatedLabel: 'Quality',
        body: `## Principle
- People did the reasonable thing with what they knew and the system they had.

## How
- Timeline with facts.
- For each “someone did X”: why did the system allow it or fail to detect it?
- Each cause, one action with an owner and date.

## What we do not do
- Look for culprits or sanctions.
- Actions that only add control (more signatures) without changing the system.`,
      },
    },
    bugs: {
      'C-REGULADOR': {
        title: 'The regulator opens a file for lack of transparency',
        explanation: 'Minimizing or delaying the facts to Compliance and the regulator worsens the penalty.',
        technique: 'Facts early, with what is known and what is not.',
      },
      'C-REPITE': {
        title: 'Three months later, another known risk reaches production',
        explanation: 'Without organizational changes, QA is still the only gate and nobody decides the next warning either.',
        technique: 'Risks accepted by their owner and quality inside the system.',
      },
      'C-CHIVO': {
        title: 'Pablo leaves and the team learns not to warn',
        explanation: 'Singling out whoever warned, or leaving them alone, teaches everyone to stay quiet.',
        technique: 'Protect people without hiding the failure.',
      },
      'C-CULPA': {
        title: 'The postmortem ends in culprits and nobody tells what they know',
        explanation: 'Without a blameless analysis, the system causes do not come out.',
        technique: 'Blameless postmortem, with system causes and actions with owners.',
      },
      'C-INFORME': {
        title: 'The report blames a QA and the regulator asks for measures that do not tackle the cause',
        explanation: 'A report with “human error” diverts the measures toward one person.',
        technique: 'System causes with their actions in the report.',
      },
      'C-GUERRA': {
        title: 'QA and Product spend months blaming each other',
        explanation: 'If the crisis committee turns into looking for culprits between areas, collaboration breaks.',
        technique: 'Take on your own part and bring the conversation to the system.',
      },
    },
    prevention: {
      title: 'Three months later',
      intro: 'A major incident is measured by what the company learns from it.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Transparency', explanation: 'Facts to Compliance on the first day.' },
        1: { label: 'Committee without culprits', explanation: 'Own part taken on and focus on customers and the system.' },
        2: { label: 'Whoever warned, protected', explanation: 'Pablo stays and keeps warning.' },
        3: { label: 'Blameless postmortem', explanation: 'Five system causes, five actions with owners.' },
        4: { label: 'Organizational change', explanation: 'Risks are decided by their owner; quality, inside the system.' },
        5: { label: 'Truthful report', explanation: 'Causes and actions, not “human error”.' },
      },
    },
    concepts: {
      role_head_of_qa: {
        title: 'Responsibilities of the Head of QA',
        summary: 'Quality strategy, model and culture. Escalates business and regulatory risks to the committee; measured by the cost of poor quality and management’s trust.',
      },
      crisis_transparency: {
        title: 'Transparency in a crisis',
        summary: 'Customers first; facts early to Compliance and the regulator, with what is known and what is not; no minimizing.',
      },
      blameless_culture: {
        title: 'Blameless culture',
        summary: 'The question is why the system allowed it, not who. If a culprit is sought, the next warning does not arrive.',
      },
      system_causes: {
        title: 'System causes',
        summary: 'Environments, risk governance, monitoring, deployment and design; each cause with an action with an owner and date.',
      },
      protect_people: {
        title: 'Protecting people',
        summary: 'Take on your own part, single out nobody, talk early with those affected and correct reports that blame a person.',
      },
      org_change: {
        title: 'From incident to organizational change',
        summary: 'QA stops being the only gate: risks are accepted by their owner and quality is built into the system.',
      },
    },
    seniorTips: [
      'To Carmen: the timeline today, with what we know and what we do not, including PAG-412.',
      "At the committee: I take on QA's part; the useful question is why the system allowed it. Customers today, postmortem this afternoon.",
      'To Pablo: nobody is going to single you out; what changes is the system.',
      'Postmortem: the five system causes, no person, and the five actions (risks accepted by their owner, retry simulator, alert, gradual deployment and idempotency).',
      'To Irene: more signatures would not have prevented it; QA stops being the only gate.',
      'To Carmen: out with “human error”; causes and actions with owner and date.',
    ],
    lessons: {
      crisis: {
        question: 'What do I do first in a crisis?',
        body: `1. **The customers:** stop the damage and compensate.
2. **The facts, early:** to Compliance and the regulator, with what is known and what is not. Better transparent today than perfect in three weeks.
3. **No minimizing:** “isolated case” with thousands of customers destroys trust.
4. **The analysis, afterwards**, calmly and without culprits.`,
      },
      blameless: {
        question: 'What is a blameless postmortem?',
        body: `It starts from one idea: **people did the reasonable thing with what they knew and with the system they had**. The question is not “who?”, but “why did the system allow it?”.

If a culprit is sought, people stop telling what they know, and the next warning does not arrive. It does not mean hiding failures: it means putting them where they can be fixed.`,
      },
      causes: {
        question: 'How do I find the system causes?',
        body: `For each “someone did X”, ask **why the system made it possible or failed to detect it**:
- Could it be tested? (environments)
- Who could decide about the risk? (governance)
- How long did it take us to find out? (monitoring)
- How much impact could it have at once? (deployment)
- Did the design prevent it? (architecture)

Each cause, an action with an owner and date.`,
      },
      people: {
        question: 'How do I protect people without hiding the failure?',
        body: `- **Take on your area's part** in public.
- **Single out nobody**, least of all whoever warned.
- **Talk to the affected person** early: uncertainty and rumors do more damage than the incident.
- **Correct reports** that blame a person: it is neither true nor useful, and the regulator will ask for measures that do not tackle the cause.`,
      },
      gate: {
        question: 'Why is “more QA” not the solution?',
        body: `Because the risk **was already signed and warned about**. If QA is the only gate, quality is “QA's thing” and nobody else decides about risks.

The organizational change:
- risks are accepted by **their business owner**;
- quality **inside the system**: environments, alerts, gradual deployment and design;
- the **cost of poor quality** at the committee, every month.`,
      },
      role: {
        question: 'What changes as Head of QA?',
        body: `You no longer sign off releases nor lead teams directly: **you own the quality strategy, model and culture**. In an incident, your job is for the company to learn: facts to the regulator, protection for people and changes in the organization.

You are measured by the cost of poor quality, serious incidents and management's trust.`,
      },
    },
    quiz: {
      pre: {
        g10pre_crisis: {
          question: 'The regulator asks for a preliminary report within 72 hours. What do you give Compliance?',
          options: ['The complete postmortem, in a few weeks', 'Today’s facts, with what is known and what is not', 'A summary without details', 'Nothing until there are culprits'],
          explanation: 'Early transparency.',
        },
        g10pre_blameless: {
          question: 'At the crisis committee they ask “where was QA?”. What do you answer?',
          options: ['That it was Product’s fault', 'That the QA who signed off made a mistake', 'Take on QA’s part and bring the question to why the system allowed it', 'That QA has nothing to do with it'],
          explanation: 'Without culprits and without hiding your own part.',
        },
        g10pre_causes: {
          question: 'Which is a system cause?',
          options: ['Pablo signed off', 'The developer made a mistake', 'Product pushed', 'There was no environment to test the retries'],
          explanation: 'A condition of the system, not a person.',
        },
        g10pre_people: {
          question: 'The QA who warned about the risk fears for his job. What do you do?',
          options: ['Talk to him early: nobody is going to single him out and what changes is the system', 'Wait for the postmortem', 'Tell him he signed off', 'Nothing'],
          explanation: 'Protect whoever warned.',
        },
        g10pre_org: {
          question: 'The board asks for more QA and double sign-off. What do you propose?',
          options: ['Double sign-off', 'That risks be accepted by their owner and quality built into the system', 'Freeze releases', 'More QA on every team'],
          explanation: 'QA stops being the only gate.',
        },
        g10pre_role: {
          question: 'What does a Head of QA own?',
          options: ['The sign-off of every release', 'The 1:1s of every QA', 'The quality strategy, model and culture', 'The payments tests'],
          explanation: 'Strategy and culture, not signatures.',
        },
      },
      post: {
        g10post_crisis: {
          question: 'What damages the regulator’s trust most?',
          options: ['Giving the facts early', 'Acknowledging what is not known', 'Explaining the actions', 'Saying it was an isolated case with thousands of customers'],
          explanation: 'Minimizing.',
        },
        g10post_blameless: {
          question: 'Why a blameless postmortem?',
          options: ['So people tell what they know and the system gets fixed', 'So nobody has consequences', 'To go faster', 'Because People asks for it'],
          explanation: 'If a culprit is sought, the next warning does not arrive.',
        },
        g10post_causes: {
          question: 'It took eight hours to learn of the failure, and through social media. What cause is that?',
          options: ['Bad luck', 'Lack of monitoring: there was no duplicate alert', 'QA’s mistake', 'The on-call’s mistake'],
          explanation: 'A system cause with its action.',
        },
        g10post_people: {
          question: 'The report to the regulator says “human error by a QA”. What do you do?',
          options: ['Leave it', 'Remove the name and leave “human error”', 'Correct it with the system causes and their actions', 'Ask the QA to review it'],
          explanation: 'Neither true nor useful.',
        },
        g10post_org: {
          question: 'Why would double sign-off not have prevented the incident?',
          options: ['Because it is expensive', 'Because nobody complies', 'Because QAs do not know how to sign', 'Because the risk was already signed and warned about: someone with authority needed to decide it'],
          explanation: 'The problem was risk governance.',
        },
        g10post_role: {
          question: 'With which metric do you bring quality to the executive committee?',
          options: ['Number of tests', 'Cost of poor quality', 'Open bugs', 'Code coverage'],
          explanation: 'A metric management understands.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    irene: 'CEO',
    carmen: 'Head of Risk & Compliance',
    raul: 'CTO',
    marta: 'Head of Product',
    laura: 'VP Engineering · your mentor',
    pablo: 'QA · Payments',
    ivan: 'Head of Platform',
  }),
)
