import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m00LaFirma } from '../m00-la-firma'
import { missionEn } from './missionEn'
import { FICHA_QA_MANUAL_EN } from './shared'

/** Course 4: QA Team Management · Mission 0 — The sign-off. English version of ../m00-la-firma.ts. */
export const m00LaFirmaEn = missionEn(
  m00LaFirma,
  {
    title: 'The sign-off',
    subtitle: 'Manual QA: honest status, bugs with evidence, priorities and who decides the risk.',
    playerRole: 'Manual QA · Cards squad',
    dayLabel: 'Thursday · year 1',
    wikiLabel: 'Wiki · Cards squad',
    verdicts: {
      good: {
        title: 'Your sign-off is worth something',
        body: 'The demo goes well, Diego fixes the bug in time and Laura and Marta know that when you say “tested” it is tested.',
      },
      ok: {
        title: 'Release saved, with loose threads',
        body: 'The release ships, but some decision costs you the following week. Check the debrief to see which responsibility of the role was left lame.',
      },
      bad: {
        title: 'A worthless sign-off',
        body: 'Surprises in the demo, a bug in production and less trust in your statuses. Replay the mission reading the role sheet first.',
      },
    },
    briefing: {
      title: 'Year 1 · Manual QA on the Cards squad',
      paragraphs: [
        'Kobalto has six squads and you are the manual QA on Cards. Your manager is Laura, the QA Lead.',
        "Tomorrow at 10:00 Marta shows the virtual cards (KOB-412) to a partner bank. You still have almost everything to test, there is an open bug that development can't reproduce and the go/no-go is at 16:30.",
        'This course is about responsibilities: what falls to you in each role and what someone else decides. You start with the first one.',
      ],
      goals: [
        'Read your role sheet in the wiki: what you own, what you decide and what you escalate.',
        'Give an honest status at the daily: done, pending, blockers and risk.',
        'Get bug KOB-415 accepted with evidence, not with insistence.',
        "Prioritize: the demo's critical path first, and negotiate what you don't have time for.",
        "Don't sign off what you haven't tested, but offer alternatives.",
        'Arrive at the go/no-go with the status in writing and a recommendation.',
      ],
    },
    scenes: {
      mail_laura: {
        subject: 'Your first release on Cards',
        body: "Good morning!\n\nTomorrow “Virtual cards” (KOB-412) ships and today is your day to test it. I left your role sheet in the wiki: what is yours, what someone else decides and when you need to let me know.\n\nAt 16:30 we hold the go/no-go with Marta and Raúl. There I need your real status, not the pretty one.\n\nLaura",
      },
      mail_marta: {
        subject: 'Tomorrow demo with the partner bank 🙏',
        body: 'Hi:\n\nTomorrow at 10:00 we show the virtual cards to the partner bank. It is the most important demo of the quarter. I need KOB-412 marked as tested today no matter what, so Raúl gives the OK.\n\nThanks,\nMarta · Product Owner · Payments',
      },
      daily: {
        subject: '09:15 · Daily · Cards squad',
        body: "**Laura:** Let's go fast. How is the testing of the virtual cards going?\n\n**Marta:** Tell me it's almost done, please 😅",
        choices: {
          honest: {
            text: "I have the sign-up tested. Today I still need the payment, the block, the dollar payment and the daily limits. There is an open bug in the payment (KOB-415) that Diego can't reproduce. Risk: I won't get to everything; I'm starting with the critical path.",
            reply: 'Thanks, now I know where we stand. Let me know if you will not make it by noon.',
            effects: { 4: { text: 'At the daily you gave an honest status: done, pending, blockers and risk.' } },
          },
          fine: {
            text: "It's going well, almost done. I'll finish today.",
            reply: 'Great! So tomorrow demo 🎉',
            effects: { 2: { text: 'You said “almost done” when most of it was missing: an optimistic status takes away from others the option to react in time.' } },
          },
          blame: {
            text: "Badly: Diego won't accept my bug and nobody can test like this.",
            reply: "Hey, I didn't say it isn't a bug, I said I can't reproduce it.",
            effects: { 2: { text: "You gave the status by blaming a person: the problem was the bug without evidence, not Diego." } },
          },
        },
      },
      diego_reject: {
        body: "I looked at your KOB-415 (double charge when pressing “Pay” twice). It doesn't happen on my machine: I tried it ten times. Should I close it as “not reproducible”?",
        choices: {
          evidence: {
            text: "I attached to the ticket the video, the exact steps, the test user and the log time. It happens on mobile with a slow network: the second tap arrives before the button gets disabled. Shall we look at it together for 10 minutes?",
            reply: "OK, with a slow network I see it. You're right: it's ours. I'll fix it today.",
            effects: { 3: { text: 'You defended the bug with evidence and offered to look at it together: Diego accepted it without argument.' } },
          },
          later: {
            text: "Don't close it yet: let me prepare steps and evidence and I'll send them in a bit.",
            reply: 'OK, send it when you have it.',
          },
          escalate: {
            text: "I'll tell Laura, let her decide.",
            reply: "Seriously? If you send me how to reproduce it I'll look at it, no need to make a drama.",
            effects: { 2: { text: 'You escalated to Laura before giving Diego what he needed to reproduce the bug.' } },
          },
          close: {
            text: "If it doesn't happen to you, close it.",
            reply: 'Closed 👍',
            effects: { 2: { text: 'You let a real bug be closed to avoid the argument.' } },
          },
        },
      },
      diego_accepts: {
        body: 'I saw the video and the steps: with a slow network I can reproduce it. It is ours, I will fix it today. Thanks for the evidence 🙌',
        onDeliver: { 2: { text: 'With steps, data and video, Diego reproduced and accepted the bug.' } },
      },
      sergio_ask: {
        body: 'Hey, can you give me a hand with the test data for the regression? It is about two hours. I need it for Monday, but if you do it today you take a weight off me 🙏',
        choices: {
          negotiate: {
            text: "Today I can't without putting KOB-412 at risk, which ships tomorrow. On Friday first thing I'll give you an hour for the data. If it were more urgent than the release, Laura should decide.",
            reply: 'Works for me, I get there with time to spare on Monday. Thanks for saying it clearly.',
            effects: { 3: { text: "You negotiated Sergio's request: what you can do, when, and who decides if there is a conflict." } },
          },
          yes: {
            text: 'Sure! I will start right now.',
            reply: "You're the best! 🙌",
            effects: { 1: { text: "You said yes without looking at your priorities: an hour and a half less for tomorrow's release." } },
          },
          no: {
            text: 'Not now.',
            reply: 'OK…',
            effects: { 1: { text: "You said no without an alternative: you protected your time, but Sergio doesn't know when he will get help." } },
          },
        },
      },
      marta_pressure: {
        subject: '12:30 · Marta stops you in the hallway',
        body: "**Marta:** Look, I need you to mark KOB-412 as tested now. Raúl only gives the OK if QA has signed. If something odd shows up tomorrow, we fix it on Monday. Can you help me?",
        choices: {
          options: {
            text: "I can't sign off as tested what I haven't tested. What I can do: test the demo's critical path now, and at 16:30 give you in writing what is tested, what is not and with what risk. If you decide to go with that risk, you and Raúl decide it knowing it.",
            reply: "OK… it's not what I wanted to hear, but I understand. Prioritize the demo.",
            effects: { 3: { text: "You didn't sign without testing and offered alternatives: QA reports the risk and the business decides whether to take it." } },
          },
          sign: {
            text: "OK, I'll mark it as tested and keep testing this afternoon.",
            reply: 'Thanks! You save my demo 🙏',
            effects: { 2: { text: 'You signed off as tested something untested: your signature stopped meaning anything and the risk stayed hidden.' } },
          },
          block: {
            text: "No. Until I've tested everything, nothing ships.",
            reply: 'And since when do you decide what ships? I will talk to Raúl.',
            effects: { 2: { text: "You blocked the release on your own: deciding whether to take a risk is not the manual QA's job. Yours is to report it well." } },
          },
        },
      },
      env_down: {
        body: 'Heads-up: Cards staging is down because of a deployment. I estimate half an hour. Sorry 🙏',
        onDeliver: { 1: { text: 'Unexpected event: staging was down for half an hour.' } },
      },
      laura_checkin: {
        body: 'How is it going? The go/no-go is at 16:30.',
        choices: {
          help: {
            text: "I'm cutting it close: the demo's critical path will be done, but I won't have time for the dollar payment and the daily limits. Shall we present it like that at the go/no-go, and you help me tomorrow with whatever is left?",
            reply: "Good that you tell me now and not at 16:29. At the go/no-go we'll say it as it is and tomorrow I'll help you with the limits.",
            effects: { 3: { text: 'You asked for help in time, with what you were missing and a concrete proposal.' } },
          },
          done: {
            text: "I've got everything tested.",
            reply: "Great! See you at the go/no-go.",
          },
          fine: {
            text: 'All under control 👍',
            reply: 'Perfect.',
            effects: { 0: { else: { 2: { text: 'You said “all under control” without having finished: Laura could not help you while there was still time.' } } } },
          },
        },
      },
      gonogo: {
        subject: '16:30 · Go/no-go · Virtual cards',
        body: '**Raúl:** Tomorrow is the demo. QA, how is KOB-412?',
        choices: {
          clear: {
            text: "Tested and fine: sign-up, payment in euros and block. KOB-415 (double charge on a slow network) is accepted and Diego fixes it today. Not tested: dollar payment and daily limits, which are not in the demo. I recommend doing the demo in euros and turning off dollars until it is tested. It is all in the ticket. The decision is yours.",
            reply: 'This is how decisions should be made. Demo in euros and dollars off until Monday. Go.',
            effects: { 3: { text: 'At the go/no-go you gave a clear status, in writing, with a recommendation, and left the decision to whoever it belongs to.' } },
          },
          clear_open: {
            text: "Tested and fine: sign-up, payment in euros and block. Open risk: KOB-415, double charge if “Pay” is pressed twice on a slow network; Diego hasn't reproduced it yet. Not tested: dollar payment and daily limits, which are not in the demo. I recommend a demo in euros, with a single tap, and turning off dollars until it is tested. It is all in the ticket. The decision is yours.",
            reply: 'Clear, and with the risk on the table. Demo in euros, dollars off, and Diego looks at KOB-415 with you tomorrow first thing. Go.',
            effects: { 3: { text: 'At the go/no-go you gave a clear status, in writing, with the open risk and a recommendation, and left the decision to whoever it belongs to.' } },
          },
          all_open: {
            text: "The whole scope tested: sign-up, payments in euros and dollars, block and daily limits. Open risk: KOB-415, double charge if “Pay” is pressed twice on a slow network; Diego hasn't reproduced it yet. I recommend doing the demo with a single tap and not enabling payment for customers until it is fixed. It is all in the ticket. The decision is yours.",
            reply: 'Clear and complete. Demo with care on the payment and Diego looks at KOB-415 with you tomorrow first thing. Go.',
            effects: { 3: { text: 'At the go/no-go you gave a complete status, in writing, with the open risk and a recommendation.' } },
          },
          allgood: {
            text: "Everything is tested and fine.",
            reply: 'Perfect, go.',
            effects: { 0: { else: { 2: { text: 'You said everything was tested and fine when it was not: the go was decided with false information.' } } } },
          },
          unsure: {
            text: "I don't know if we'll make it… I haven't had time for everything and I haven't written it down.",
            reply: "With “I don't know” I can't decide. Laura, can you give me something concrete within an hour?",
            effects: { 1: { text: 'You arrived at the go/no-go without a concrete status: whoever had to decide could not.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** First release with you. What are you taking away from today?',
        choices: {
          lesson: {
            text: "That my job is not to decide whether it ships, but that whoever decides knows exactly what is tested and with what risk. And for that: evidence, an honest status, negotiated priorities and asking for help in time.",
            reply: "That's being QA. And it is exactly what you will ask of others when you lead a team.",
          },
          gate: {
            text: "That QA is the last barrier: if I don't test everything, nothing should ship.",
            reply: 'That idea is going to haunt you. Check the debrief to see who decides what.',
            effects: { 0: { text: 'You kept “QA is the gate”: the course comes back to that idea when you lead.' } },
          },
        },
      },
    },
    docs: {
      ficha_rol: FICHA_QA_MANUAL_EN,
      gonogo: {
        title: 'Go/no-go at Kobalto: who decides what',
        updatedLabel: 'Raúl Ortega · Engineering Manager',
        body: `## Before the meeting
- QA leaves the testing status in the ticket: tested, untested, open defects and risk.

## In the meeting
- **QA** reports and recommends.
- **Development** explains the status of the fixes.
- **Product** (PO) and the **Engineering Manager** decide: ship, ship with reduced scope or delay.

## Golden rule
Nobody signs off as tested what is not tested. Shipping with a known risk is a legitimate business decision; shipping with a hidden risk is not.`,
      },
    },
    tickets: {
      'KOB-412': {
        title: 'Virtual cards: sign-up, payment and block',
        status: 'In testing',
        description:
          "As a customer I want to create a virtual card instantly and use it to pay online. Scope: card sign-up, payment in euros, block and unblock, payment in dollars and daily spending limits. Tomorrow it is shown in the demo with the partner bank (sign-up, payment in euros and block).",
        acceptanceCriteria: [
          'The card is created in under 5 seconds and appears in the app.',
          'A payment in euros is charged only once.',
          'A blocked card rejects payments and can be unblocked.',
          "A payment in dollars is converted at the day's exchange rate.",
          'The configured daily limit cannot be exceeded.',
        ],
        comments: {
          0: { body: 'For tomorrow’s demo what matters are the sign-up, the payment in euros and the block.' },
          1: { body: 'Before the go/no-go, leave the testing status here, even if incomplete.' },
          2: {
            body: 'QA status: tested and OK the sign-up, the payment in euros and the block. Open defect: KOB-415. Untested: payment in dollars and daily limits. Recommendation: demo in euros and turn off dollars until tested.',
          },
          3: {
            body: 'QA status: sign-up tested. Still untested: payment in euros, block, payment in dollars and daily limits. Open defect: KOB-415. High risk for the demo.',
          },
          4: {
            body: 'QA status: the whole scope tested (sign-up, payments in euros and dollars, block and daily limits). Defect KOB-415 accepted by development and being fixed.',
          },
          5: {
            body: 'QA status: the whole scope tested (sign-up, payments in euros and dollars, block and daily limits). Open risk: KOB-415, double charge on a slow network, not yet reproduced by development.',
          },
        },
        actions: {
          critical: {
            label: "Test the demo's critical path (sign-up, payment in euros and block)",
            effects: { 3: { text: 'You tested the demo’s critical path first: what carried the most risk.' } },
          },
          rest: {
            label: 'Test the rest (payment in dollars and daily limits)',
            effects: { 2: { text: 'You had time to test the whole scope.' } },
          },
          status: {
            label: 'Write the testing status in the ticket (tested, untested, defects, risk)',
            effects: { 3: { text: 'You left the testing status in writing before the go/no-go.' } },
          },
          sign: {
            label: 'Mark as “Tested by QA”',
            effects: {
              0: {
                then: { 0: { text: 'You signed off KOB-412 after testing its whole scope.' } },
                else: { 2: { text: 'You marked KOB-412 as tested without having tested its whole scope.' } },
              },
            },
          },
        },
      },
      'KOB-415': {
        title: 'Double charge when pressing “Pay” twice',
        status: 'In review by development',
        description: 'Pressing “Pay” twice in a row with the virtual card creates two charges. Seen once on the test phone.',
        comments: {
          0: { body: "I can't reproduce it locally. Steps?" },
          1: { body: 'Reproduced with a slow network: the button is not disabled until the server responds. I will fix it today.' },
        },
        actions: {
          evidence: {
            label: 'Reproduce it and attach evidence (steps, test user, slow network, video and log time)',
            effects: { 3: { text: 'You reproduced KOB-415 and attached evidence: with a slow network the button is not disabled in time.' } },
          },
        },
      },
    },
    bugs: {
      'C-DEMO': {
        title: 'The demo with the partner bank fails on the dollar payment, which nobody had tested',
        explanation: 'Without a clear status at the go/no-go, nobody decided to turn off what was not tested.',
        technique: 'QA reports the risk with a recommendation; the business decides with information.',
      },
      'C-BUG': {
        title: 'KOB-415 reaches production: double charges and complaints to Customer Support',
        explanation: 'The bug was closed or stayed in debate because it had no reproducible evidence.',
        technique: 'Bug reports with evidence and a conversation with development before escalating.',
      },
      'C-CONFIANZA': {
        title: 'Laura and Marta stop trusting your testing statuses',
        explanation: 'An “almost there”, an untested sign-off or a false “all good” make your word useless for deciding.',
        technique: 'Honest status and sign-off only of what is tested.',
      },
      'C-SORPRESA': {
        title: "Laura finds out at the go/no-go itself that you won't make it and can no longer help you",
        explanation: 'Asking for help late is the same as not asking.',
        technique: 'Escalate early, with what is missing and a proposal.',
      },
      'C-SOBRECARGA': {
        title: 'You finish at ten at night and Sergio still does not know when he will get his data',
        explanation: 'Saying yes to everything, or no without an alternative, is not prioritizing.',
        technique: 'Negotiate: what you can do, when, and who decides if there is a conflict.',
      },
    },
    prevention: {
      title: 'The following week',
      intro: 'Each responsibility of the role you covered prevented a specific problem in the days after the release.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Clear status at the go/no-go', explanation: 'Tested, untested, open defects and recommendation, in writing. Whoever has to decide, decides.' },
        1: { label: 'Bug accepted with evidence', explanation: 'Steps, data, conditions (slow network) and video: the bug stops being an opinion.' },
        2: { label: 'Your word is worth something', explanation: 'Honest status at the daily, no sign-off without testing and no false “all good”.' },
        3: { label: 'Help asked for in time', explanation: 'At 15:00, with what was missing and a proposal, not at 16:29.' },
        4: { label: 'Negotiated priorities', explanation: 'Neither yes to everything nor a plain no: what, when and who decides.' },
      },
    },
    concepts: {
      role_qa_manual: {
        title: 'Responsibilities of the manual QA',
        summary: 'Owns their tests, their bug reports and their status. Decides how to test and when to ask for help. Does not decide whether a business risk is accepted: reports it.',
      },
      honest_status: {
        title: 'Honest testing status',
        summary: 'Done, pending, blockers and risk, with facts and not feelings. An optimistic status takes away from others the option to react.',
      },
      evidence_based: {
        title: 'Bugs with evidence',
        summary: 'Steps, data, environment, conditions and evidence (video, log). Separate the problem from the person and offer to look at it together before escalating.',
      },
      risk_ownership: {
        title: 'Who decides the risk',
        summary: 'QA reports and recommends; the business owner decides to ship, cut scope or delay. Never sign off as tested what is not.',
      },
      priority_negotiation: {
        title: 'Negotiating priorities',
        summary: 'With several requests: what you can do, when, what you stop doing and who decides if they clash (your Lead).',
      },
      ask_help: {
        title: 'Asking for help in time',
        summary: 'As soon as you see you will not make it, with what is missing and a concrete proposal. Asking late is almost the same as not asking.',
      },
    },
    seniorTips: [
      'The role sheet first: it tells you what is yours and what someone else decides.',
      'At the daily: done, pending, blockers and risk. “Almost done” is not a status.',
      'Before arguing with Diego, reproduce KOB-415 and attach the evidence; then offer to look at it together.',
      'To Sergio: not today, an hour tomorrow, and if it is more urgent than the release, let Laura decide.',
      "To Marta: you don't sign off the untested, but you prioritize her demo and give her the status in writing so she can decide.",
      "The demo's critical path first; write the status in the ticket before 16:30.",
      "At 15:00, if you won't make it, tell Laura with a proposal.",
    ],
    lessons: {
      role: {
        question: 'What is mine as a manual QA and what is not?',
        body: `**It is yours:**
- your tests and their evidence;
- your bug reports;
- your status: what is tested, what is not and what risk you see.

**You decide:**
- how and in what order you test (risk first);
- when you ask for help.

**You don't decide:**
- whether to ship with a risk: that belongs to the business owner;
- which request goes first when they clash: that belongs to your Lead.

Your job is for whoever decides to do so with the best information possible.`,
      },
      status: {
        question: 'How do I give a testing status that is useful?',
        body: `Four parts, in this order:
1. **Done:** what is tested and how it went.
2. **Pending:** what is missing and how long you estimate.
3. **Blockers:** what holds you back (environment, an unaccepted bug, data).
4. **Risk:** what can happen if it ships today.

Avoid “almost done”, “it's going well” or “I think”. An optimistic status helps nobody: it takes away from others the chance to react while there is still time.`,
      },
      reject: {
        question: 'A developer rejects my bug: what do I do?',
        body: `1. **Reproduce it** and find the condition that triggers it (slow network, a data value, a device).
2. **Attach evidence:** exact steps, data, environment, video and log time.
3. **Talk about the problem, not the person:** “it happens on a slow network” instead of “you haven't tested it properly”.
4. **Offer to look at it together** for ten minutes.
5. Only if there is still no agreement, **escalate** to your Lead with the facts.

A bug without evidence is an opinion; with evidence it is a fact.`,
      },
      sign: {
        question: "I'm asked to sign off something I haven't tested. What do I do?",
        body: `Don't sign, but don't just say no either:
- **Explain** what is tested and what is not.
- **Offer options:** test the critical part first, reduce the scope, turn off what is untested or delay.
- **Put it in writing** in the ticket.
- **Leave the decision to whoever it belongs to:** shipping with a known risk is a legitimate business decision. What is not legitimate is hiding the risk behind your signature.

Blocking the release on your own is also stepping out of your role.`,
      },
      priorities: {
        question: "I'm asked for three things at once. Which do I say yes to?",
        body: `Between “yes to everything” and “no” there is a better answer:
- **What I can do** and **when** (“not today; tomorrow first thing, one hour”).
- **What I would stop doing** if I do it now.
- **Who decides** if two requests clash: your Lead, not you or whoever asks the loudest.

Saying yes to everything seems kind, but ends in late deliveries for everyone.`,
      },
      help: {
        question: 'When do I have to ask for help?',
        body: `**Early:** as soon as the estimate doesn't add up, not in the final meeting.

**Concrete:** what is missing, how much time and what you propose (help, reducing the scope or warning at the go/no-go).

Asking for help is not weakness: it gives your Lead the information to do their job. What hurts is the surprise.`,
      },
    },
    quiz: {
      pre: {
        g0pre_role: {
          question: 'As a manual QA, which of these decisions is NOT yours?',
          options: ['In what order you test what was assigned', 'Whether the product ships with a known risk', 'When to ask your Lead for help', 'What evidence you attach to a bug'],
          explanation: 'Shipping with a known risk is decided by the business owner. You give them the information to decide.',
        },
        g0pre_status: {
          question: "You are two thirds short on testing and at the daily they ask how it's going. Which answer is better?",
          options: ['“Done this; pending that; blocked by this; risk: I won’t get to everything”', '“Going well, almost done”', '“Badly, development doesn’t help me”', '“I’ll tell you at the end of the day”'],
          explanation: 'Done, pending, blockers and risk lets others react in time.',
        },
        g0pre_reject: {
          question: 'A developer says your bug “is not reproducible”. What do you do first?',
          options: ['Escalate it to your Lead', 'Close it to avoid arguing', 'Reopen it with maximum priority', 'Reproduce it, attach steps, data and evidence, and offer to look at it together'],
          explanation: 'With evidence the bug stops being an opinion; escalating is the last step, not the first.',
        },
        g0pre_sign: {
          question: "The PO asks you to mark as tested a story you haven't finished testing. What do you do?",
          options: ['Mark it so as not to block', 'Refuse and block the release', 'Not sign it, offer options and give the status in writing so they can decide', 'Ask her to sign it herself'],
          explanation: "You don't sign the untested, but you don't decide either: you give options and the information to decide.",
        },
        g0pre_prio: {
          question: 'A colleague asks you for two hours of help the day before a release you are testing. What do you answer?',
          options: ['Yes, right now', 'What you can do and when; if it is more urgent than the release, let your Lead decide', 'No, plain and simple', 'To ask someone else'],
          explanation: 'Negotiating priorities means saying what, when and who decides if they clash.',
        },
        g0pre_help: {
          question: "When is it best to tell your Lead that you won't manage to test what was committed?",
          options: ['At the go/no-go meeting', 'When there is no remedy left', 'Never: it is your responsibility to deliver', 'As soon as you see it does not add up, with what is missing and a proposal'],
          explanation: 'Early and concrete: that way your Lead can still help you or adjust the plan.',
        },
      },
      post: {
        g0post_role: {
          question: "Which sentence best describes the manual QA's responsibility in a release?",
          options: ['Being the last barrier: if not everything is tested, it does not ship', 'Signing what product asks for', 'That whoever decides knows exactly what is tested and with what risk', 'Fixing the bugs they find'],
          explanation: 'The manual QA reports with evidence; the risk decision belongs to the business.',
        },
        g0post_status: {
          question: 'Why does an optimistic testing status do harm?',
          options: ['Because it makes the daily longer', 'Because it takes away from others the chance to react in time', 'Because it forces you to write more', 'It does no harm if you make it in the end'],
          explanation: 'If the problem is discovered late, there are no options left: no help, no scope cut, no planned delay.',
        },
        g0post_reject: {
          question: 'What turns a disputed bug into an accepted bug?',
          options: ['Insisting more', 'The Lead saying so', 'Setting critical severity', 'Reproducible steps, data, conditions and evidence'],
          explanation: 'Reproducible evidence changes the conversation from “opinion” to “fact”.',
        },
        g0post_sign: {
          question: 'At the go/no-go, who decides to ship with a known risk?',
          options: ['The business owner (PO and Engineering Manager), with the information from QA', 'The manual QA', 'Development', 'Nobody: if there is risk, it does not ship'],
          explanation: 'Shipping with a known risk is legitimate if decided knowingly by the business owner.',
        },
        g0post_prio: {
          question: "Two urgent requests clash and you can't do both. Who should decide?",
          options: ['Whoever asks the loudest', 'You, however you feel like it', 'Both at once, half-done', 'Your Lead, who sees the team’s priorities'],
          explanation: "When priorities clash, whoever has the team's overview decides: your Lead.",
        },
        g0post_help: {
          question: 'What makes a request for help useful?',
          options: ['Making it at the end so as not to bother', 'That it is early, concrete and comes with a proposal', 'Making it in writing to the whole team', 'Asking for more time without explaining'],
          explanation: 'Early, concrete and with a proposal: that way it is possible to act.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({ laura: 'QA Lead · your manager', sergio: 'QA Automation · Cards', marta: 'Product Owner · Payments' }),
)
