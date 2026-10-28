import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m11Estrategia } from '../m11-estrategia'
import { missionEn } from './missionEn'
import { FICHA_HEAD_OF_QA_EN } from './shared'

/** Course 4: QA Team Management · Mission 11 — The strategy. English version of ../m11-estrategia.ts. */
export const m11EstrategiaEn = missionEn(
  m11Estrategia,
  {
    title: 'The strategy',
    subtitle: 'Head of QA: metrics management understands, organizational model, phased investment, aligning QA Managers and winning over skeptics.',
    playerRole: 'Head of QA',
    dayLabel: 'Tuesday · year 8',
    appLabel: 'Strategy',
    wikiLabel: 'Wiki · Quality',
    verdicts: {
      good: {
        title: 'Quality, everybody’s business',
        body: 'The committee approves the first phase. A year later, the payments pilot has halved incidents and time to production, and the QA Managers present the results. Eight years after your first sign-off, QA is no longer the gate.',
      },
      ok: {
        title: 'Strategy approved halfway',
        body: 'The committee sees value, but something slows the change: the metrics, the model, the people or the allies. Check the debrief to see what.',
      },
      bad: {
        title: 'A plan nobody buys',
        body: 'The committee postpones the decision and the area stays as it was. Replay the mission starting with the metrics.',
      },
    },
    briefing: {
      title: 'Year 8 · The strategy',
      paragraphs: [
        'After the transfers incident, the board wants a three-year quality plan, not a patch.',
        'On Thursday you present it to the executive committee. Today at 16:00 you rehearse it with Irene.',
        'For it to pass, your QA Managers and the CTO have to leave that room with you.',
      ],
      goals: [
        'Read the Head of QA role sheet.',
        'Align your QA Managers with the change.',
        'Win over the CTO, who believes quality is QA’s business.',
        'Prepare the strategy: metrics, model, investment, roadmap and people.',
        'Rehearse with Irene and answer what happens if nothing is done.',
      ],
    },
    scenes: {
      mail_irene: {
        subject: 'Quality strategy for the committee',
        body: "Hi:\n\nOn Thursday you present to the executive committee the quality strategy for the next three years. After the transfers incident, the board wants to see a plan, not a patch.\n\nToday at 16:00 you and I rehearse it. You have the “Strategy” app.\n\nIrene · CEO",
      },
      mail_laura: {
        subject: 'Eight years later',
        body: "I saw you sign off your first release afraid. Now it is up to you to change how the whole company works.\n\nA tip for the committee: speak their language (money, customers, speed) and ask for a concrete decision. And don't do it alone: the QA Managers and the CTO have to leave that room with you.\n\nLaura",
      },
      managers: {
        subject: '09:30 · Your QA Managers',
        body: "**Héctor:** If we embed the QAs in the squads, what happens to my area? We lose control of quality.",
        choices: {
          involve: {
            text: "That risk is real, and that is why I want you in the design. Each one leads a piece: Héctor, the policy of risks accepted by their owner; Sergio, the common quality platform. We present it together and your role grows: you go from reviewing at the end to making quality work across forty squads.",
            reply: "If I lead the risk policy, I'm in. It's exactly what we were missing in the incident.",
            effects: { 3: { text: 'You turned the skeptical QA Managers into owners of a part of the change.' } },
          },
          impose: {
            text: "It's the decision. You'll have to adapt.",
            reply: "OK. We'll see how it goes.",
            effects: { 1: { text: 'You imposed the change on those who have to carry it out.' } },
          },
          calm: {
            text: "Relax, actually nothing is going to change.",
            reply: 'Then what is the strategy for?',
            effects: { 0: { text: 'You denied the change to avoid the conversation: they will find out at the committee.' } },
          },
        },
      },
      raul_skeptic: {
        body: "I heard you want developers to test more. Quality is QA's business. I don't want my teams to lose time.",
        choices: {
          data: {
            text: "I understand you: I don't want to slow your teams down, I want the opposite. Today a change waits 5 of its 12 days for QA at the end. What a developer catches in minutes, we find in days. I propose measuring it with your teams in the payments pilot: if the time to production doesn't go down, we review it.",
            reply: "If we measure it and the lead time goes down, count me in.",
            effects: { 3: { text: 'You won over the skeptic with his own metric and a measurable pilot.' } },
          },
          escalate: {
            text: 'Irene will decide at the committee.',
            reply: "We'll discuss it there, then.",
            effects: { 0: { text: 'You took the disagreement to the committee instead of resolving it beforehand.' } },
          },
          yield: {
            text: 'OK, QA will keep testing everything at the end.',
            reply: "That's what I like.",
            effects: { 0: { text: 'You gave up the fundamental change to avoid conflict.' } },
          },
        },
      },
      strat_ok: {
        body: "I saw your strategy: business metrics, hybrid model, phased investment, pilot and a plan for the people. That gets approved.",
      },
      rehearsal: {
        subject: '16:00 · Rehearsal with Irene',
        body: "**Irene:** Imagine I'm the committee. You have ten minutes.",
        choices: {
          story: {
            text: "Poor quality cost us €2.1M last year and four serious incidents; moreover, each change waits five days for QA. The cause: QA as the only gate. I propose a hybrid model, phased investment tied to metrics, a pilot in payments in the first year and a plan so no QA is left behind. I ask you to approve the first phase. Every quarter you will see four numbers: cost, incidents, time to production and escaped defects.",
            reply: 'Clear, short and with a concrete request. That is how we approve it.',
            effects: { 4: { text: 'You presented the strategy in the committee’s language and asked for a concrete decision.' } },
          },
          tech: {
            text: "I start with our 14,000 automated tests and 78% coverage.",
            reply: 'I got lost in the second minute. What do I have to decide?',
            effects: { 0: { text: "You spoke QA's language, not the committee's." } },
          },
          all: {
            text: 'Forty slides with all the detail, so nothing is missing.',
            reply: "We won't reach slide ten.",
            effects: { 0: { text: 'You brought all the detail and no clear request.' } },
          },
        },
      },
      irene_inaction: {
        body: "One more: the board always asks what happens if we do nothing. What do you answer?",
        choices: {
          cost: {
            text: "We keep paying about €2M a year in poor quality, and another incident like the transfers one is a matter of time. With the strategy, the goal is to halve it in two years, and you will see it quarter by quarter.",
            reply: 'That is what they need to hear: the cost of doing nothing and a measurable goal.',
            effects: { 3: { text: 'You gave the cost of not acting and a measurable goal.' } },
          },
          fear: {
            text: 'That the regulator will certainly sanction us.',
            reply: "Certainly? You can't claim that in front of the board.",
            effects: { 0: { text: 'You exaggerated the risk: the board stops believing the rest.' } },
          },
          unknown: {
            text: "I don't know, honestly.",
            reply: 'Then you have until Thursday to find out.',
            effects: { 0: { text: "You didn't have the cost of not acting." } },
          },
        },
      },
      closing: {
        subject: '17:00 · The last coffee with Laura',
        body: '**Laura:** Eight years. From signing off your first release to changing how the company works. What are you taking away?',
        choices: {
          lesson: {
            text: "That in each role the responsibilities change, but not what matters: telling the truth about risk, letting whoever should decide decide, and caring for people. As Head of QA, that becomes strategy: metrics management understands, a model in which QA is not the gate and a change made with the people.",
            reply: 'That is the whole career. Congratulations.',
          },
          power: {
            text: 'That now at last I have the power to be listened to.',
            reply: 'Power did not get you here. Check the debrief.',
            effects: { 0: { text: 'You kept the power of the position: the strategy works through influence and data.' } },
          },
        },
      },
    },
    docs: {
      ficha_head: FICHA_HEAD_OF_QA_EN,
      committee_guide: {
        title: 'How to present to the executive committee',
        updatedLabel: 'Irene Sáez · CEO',
        body: `## What the committee wants to know
- What the problem is, in money, customers and speed.
- What you propose and how much it costs.
- What it has to decide today.
- How it will know whether it works.

## Format
- Ten minutes. The detail, in an appendix.
- A concrete request at the end.
- What happens if nothing is done, without exaggerating.`,
      },
    },
    bugs: {
      'C-METRICAS': {
        title: 'The committee does not see the value: you talked about tests and coverage',
        explanation: "QA's internal metrics do not help management decide.",
        technique: 'Cost of poor quality, incidents, time to production and escaped defects.',
      },
      'C-MODELO': {
        title: 'The new model again makes QA the gate (or eliminates it)',
        explanation: 'Centralizing more, dispersing with nothing in common or eliminating QA repeats or worsens the problems.',
        technique: 'Hybrid model with a common platform and risks accepted by their owner.',
      },
      'C-PERSONAS': {
        title: 'Manual QAs fear for their jobs and the best leave',
        explanation: 'Replacing people or staying silent about them breaks the area’s trust.',
        technique: 'Transition plan with training and career.',
      },
      'C-MANAGERS': {
        title: 'The QA Managers hold back the change in their areas',
        explanation: 'A change imposed on those who have to carry it out is complied with on paper.',
        technique: 'Involve them and give them a piece to lead.',
      },
      'C-CTO': {
        title: 'Development does not take on its part of quality',
        explanation: 'Without the CTO, quality remains “QA’s business”.',
        technique: 'His metric and a measurable pilot.',
      },
      'C-COMITE': {
        title: 'The committee postpones the decision',
        explanation: 'Without a clear presentation, a concrete request and the cost of not acting, there is no decision.',
        technique: 'The problem in their language, proposal, request and cost of doing nothing.',
      },
    },
    prevention: {
      title: 'A year later',
      intro: 'A strategy is measured by what changes in the company.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Business metrics', explanation: 'Cost, incidents, time to production and escaped defects.' },
        1: { label: 'Hybrid model', explanation: 'QA in the squads, common platform and risks accepted by their owner.' },
        2: { label: 'Plan for the people', explanation: 'Training and career for the manual QAs.' },
        3: { label: 'QA Managers on board', explanation: 'Héctor leads the risk policy; Sergio, the platform.' },
        4: { label: 'CTO in favor', explanation: 'Pilot measured with his metric.' },
        5: { label: 'Committee convinced', explanation: 'First phase approved, with the cost of not acting on the table.' },
      },
    },
    concepts: {
      role_head_of_qa: {
        title: 'Responsibilities of the Head of QA',
        summary: 'Quality strategy, model and culture; investment and policies; measured by the cost of poor quality and management’s trust.',
      },
      quality_metrics: {
        title: 'Metrics for management',
        summary: 'Cost of poor quality, incidents, time to production and escaped defects; not tests or coverage.',
      },
      quality_model: {
        title: 'QA organizational model',
        summary: 'Centralized, embedded or hybrid with a common platform; and a plan for the people during the transition.',
      },
      exec_pitch: {
        title: 'Presenting to the committee',
        summary: 'The problem in their language, the proposal, phased investment, a concrete request and the cost of not acting.',
      },
      lead_change: {
        title: 'Leading the change',
        summary: 'Listen to the risk the skeptics see, give them a piece and use measurable pilots.',
      },
    },
    seniorTips: [
      'To the QA Managers: your risk is real; Héctor leads the risk policy and Sergio the platform.',
      'To the CTO: five of twelve days waiting for QA; pilot measured with time to production.',
      'Metrics: cost of poor quality, incidents, time to production and escaped defects.',
      'Strategy: hybrid model, phased investment, pilot in payments and a transition plan for the manual QAs.',
      'To Irene: problem, cause, proposal and “approve the first phase”; if nothing is done, about €2M a year and another incident.',
    ],
    lessons: {
      metrics: {
        question: 'Which metrics do I take to an executive committee?',
        body: `The ones that speak their language: **money, customers and speed**.
- Cost of poor quality.
- Serious incidents.
- Time from code to production.
- Defects that reach the customer.

Number of tests, coverage or bugs found are internal metrics: useful for the team, but they do not tell the committee what to decide.`,
      },
      model: {
        question: 'Which QA organizational model do I choose?',
        body: `- **Centralized:** control, but QA becomes the gate and the bottleneck.
- **Embedded with nothing in common:** fast, but each squad reinvents.
- **Hybrid:** QA in the squads, a common **quality platform** (environments, data, tools) and a small standards team. Risks are accepted by their owner.

There is no perfect model: choose the one that solves your problems today (here, the gate and the wait).`,
      },
      invest: {
        question: 'How do I ask for investment?',
        body: `**In phases and tied to metrics**: the first phase is approved now and the following ones are released if the numbers improve. Management risks little and decides with data.

And always state the **cost of doing nothing**: it is the argument that weighs most.`,
      },
      pitch: {
        question: 'How do I present to the committee?',
        body: `1. **The problem in their language:** €2.1M, four incidents, five days of waiting.
2. **The cause**, in one sentence.
3. **The proposal:** model, investment, roadmap and people.
4. **The concrete request:** “approve the first phase”.
5. **How you will see it:** four numbers every quarter.

Ten minutes. The detail, in the appendix.`,
      },
      change: {
        question: 'How do I get the skeptics to join?',
        body: `- **Listen to the risk they see**: it is usually real.
- **Give them a piece of the change**: whoever leads a part defends it.
- **Use their metric**: for the CTO, the time to production.
- **Propose a measurable pilot** with an exit condition.

Imposing gets compliance; involving gets commitment.`,
      },
      people: {
        question: 'What happens to the manual QAs in the new model?',
        body: `They know the business better than anyone. A **transition plan**, with training in automation and quality and a technical and management career, turns that knowledge into an advantage.

Replacing them breaks the trust of the whole area. And staying silent fills the silence with fear: the best leave first.`,
      },
    },
    quiz: {
      pre: {
        g11pre_metrics: {
          question: 'Which metric does an executive committee understand best?',
          options: ['Number of automated tests', 'Cost of poor quality', 'Code coverage', 'Bugs found by QA'],
          explanation: 'Money, customers and speed.',
        },
        g11pre_model: {
          question: 'Your central QA is a bottleneck and caused an incident by being the only gate. Which model do you propose?',
          options: ['Centralize more', 'Eliminate QA', 'Hybrid: QA in the squads, common platform and risks accepted by their owner', 'Let each squad do what it wants'],
          explanation: 'It solves the gate without losing what is common.',
        },
        g11pre_invest: {
          question: 'How do you ask the committee for investment?',
          options: ['All at once', 'Without figures', 'Have the CTO ask for it', 'In phases tied to metrics'],
          explanation: 'Low risk and a decision with data.',
        },
        g11pre_pitch: {
          question: 'How does a good presentation to the committee end?',
          options: ['With a concrete request for a decision', 'With questions', 'With the technical detail', 'With a thank you'],
          explanation: 'The committee is there to decide.',
        },
        g11pre_change: {
          question: 'A QA Manager fears losing control with the new model. What do you do?',
          options: ['Impose it', 'Give them a piece of the change to lead', 'Tell them nothing will change', 'Wait for them to leave'],
          explanation: 'Whoever leads a part defends it.',
        },
        g11pre_people: {
          question: 'What do you do with the manual QAs in the new model?',
          options: ['Replace them', 'Say nothing', 'Transition plan with training and career', 'Leave them as they are'],
          explanation: 'Change with the people.',
        },
      },
      post: {
        g11post_metrics: {
          question: 'Why not take code coverage to the committee?',
          options: ['Because it is low', 'Because it is secret', 'Because it changes a lot', 'Because it does not connect with the business'],
          explanation: 'An internal metric.',
        },
        g11post_model: {
          question: 'What does the common quality platform bring in the hybrid model?',
          options: ['Environments, data and tools that each squad does not reinvent', 'A QA who signs off everything', 'More meetings', 'Nothing'],
          explanation: 'What is common is shared.',
        },
        g11post_invest: {
          question: 'The board asks what happens if you do nothing. What do you answer?',
          options: ['That we will certainly be sanctioned', 'The current cost of poor quality and a measurable goal', "That you don't know", 'That the CTO will say'],
          explanation: 'The cost of not acting, without exaggerating.',
        },
        g11post_pitch: {
          question: 'How long should your presentation to the committee be?',
          options: ['An hour', 'Forty slides', 'About ten minutes, with the detail in an appendix', 'As long as it takes'],
          explanation: 'Short and clear.',
        },
        g11post_change: {
          question: 'The CTO does not want his developers to test more. What do you do?',
          options: ['Take it to the committee', 'Give in', 'Impose it on him', 'Use his metric (time to production) and a measurable pilot'],
          explanation: 'His metric and a pilot.',
        },
        g11post_people: {
          question: 'If you stay silent about what will happen to the manual QAs…',
          options: ['Fear fills the silence and the best leave', 'Nothing happens', 'They adapt on their own', 'Morale improves'],
          explanation: 'Communicate the transition plan.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    irene: 'CEO',
    raul: 'CTO',
    laura: 'VP Engineering · your mentor',
    hector: 'QA Manager · Cards',
    sergio: 'QA Manager · Payments',
  }),
)
