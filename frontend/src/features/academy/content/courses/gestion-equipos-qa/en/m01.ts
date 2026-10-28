import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m01CuelloBotella } from '../m01-cuello-botella'
import { missionEn } from './missionEn'
import { FICHA_QA_MANUAL_EN } from './shared'

/** Course 4: QA Team Management · Mission 1 — The bottleneck. English version of ../m01-cuello-botella.ts. */
export const m01CuelloBotellaEn = missionEn(
  m01CuelloBotella,
  {
    title: 'The bottleneck',
    subtitle: 'Manual QA: make the flow visible, prioritize the queue by risk, propose agreements and receive feedback.',
    playerRole: 'Manual QA · Cards squad',
    dayLabel: 'Wednesday · year 1',
    appLabel: 'Sprint',
    wikiLabel: 'Wiki · Cards squad',
    verdicts: {
      good: {
        title: 'The bottleneck was the flow',
        body: 'The team leaves the retro with three agreements, the critical limit bug does not reach production and Raúl stops talking about “QA is slow”.',
      },
      ok: {
        title: 'Sprint closed, cause untouched',
        body: 'You got the day done, but some of the cause is still there. Check the debrief to see what comes back in sprint 15.',
      },
      bad: {
        title: 'The queue has your name on it',
        body: 'Without data or agreements, “QA is the bottleneck” stays as the truth. Replay the mission starting with the sprint flow.',
      },
    },
    briefing: {
      title: 'Year 1 · The bottleneck',
      paragraphs: [
        'A few months after your first release. It is day 9 of sprint 14 and there are six stories in “Ready for QA”. Today you only have time to test three.',
        "It is the third sprint in a row like this. Raúl asks whether QA is the bottleneck and the retro is at 16:00.",
        'Your role is still manual QA, but today it takes more than testing: making visible why this happens and proposing how to change it.',
      ],
      goals: [
        'At the daily, make the queue visible and ask the team for help testing.',
        'Prioritize the queue by risk: in the “Sprint” app, choose the three stories you test today.',
        'Analyze the sprint flow to bring data, not feelings.',
        "Answer Raúl with data, without blaming anyone and without asking for what isn't yours to ask.",
        'Prepare up to three team agreements that tackle the cause.',
        "At the retro, receive Diego's feedback without getting defensive.",
      ],
    },
    scenes: {
      mail_raul: {
        subject: 'Sprint 14: stuck in QA again',
        body: 'Hi:\n\nSprint 14 closes tomorrow and once again there are 6 stories in “Ready for QA”. It is the third sprint in a row. What is going on? Is QA the bottleneck?\n\nWe will talk about it at the 16:00 retro.\n\nRaúl',
      },
      mail_laura: {
        subject: 'Before the retro',
        body: 'Hi:\n\nRaúl is annoyed and QA is going to come up at the retro. One piece of advice: bring data, not feelings. In the “Sprint” app you can pull out how the work has flowed.\n\nAnd another: whatever is agreed in a retro has to be in the team’s hands. Asking for more people or more days is not.\n\nLaura',
      },
      daily: {
        subject: '09:15 · Daily · Cards squad',
        body: "**Diego:** Last night I handed you three more stories. Do you have them today? We close tomorrow.\n\n**Marta:** I need everything closed for the review 😬",
        choices: {
          team: {
            text: "There are 6 stories waiting and today I have time for 3. I'll test the ones with the most risk. For the others, can someone from development test them with my cases? I'll pass them to you at 10.",
            reply: 'Count me in: give me the alias and color cases and I will test them.',
            effects: { 4: { text: 'At the daily you made the queue visible, prioritized by risk and asked the team to help test.' } },
          },
          overtime: {
            text: "Don't worry, I'll test them all today even if I stay late.",
            reply: 'Legend! 🙌',
            effects: { 3: { text: 'You committed to testing everything through overtime: the problem stays hidden and comes back next sprint.' } },
          },
          blame: {
            text: "It's not my fault you hand me everything on the last day.",
            reply: 'Sure… but someone has to test it, right?',
            effects: { 2: { text: 'You pointed at development at the daily: you may be right, but without data or a proposal it only creates defensiveness.' } },
          },
        },
      },
      marta_color: {
        body: 'Hey, can you test KOB-438 (card color) first? It is what shines most in tomorrow’s review 🎨',
        choices: {
          risk: {
            text: "Today I'm going by risk: the payment, the daily limit and the mandatory notifications come first, because if they fail there is money and the regulator involved. If there's time left I'll test the color; if not, you show it at the review saying it is untested. If you still want it first, we'll see it with Laura.",
            reply: 'Put that way… yes, better the limit does not fail 😅. I will show it with the warning.',
            effects: { 3: { text: 'You explained to Marta why risk goes before the showy, without leaving her without options.' } },
          },
          yes: {
            text: "OK, I'll test it first.",
            reply: 'Thanks! 💜',
            effects: { 1: { text: 'You agreed to put the showiest above the riskiest.' } },
          },
        },
      },
      raul_hallway: {
        subject: '13:00 · Raúl stops you in the kitchen',
        body: '**Raúl:** Listen, no beating around the bush: is QA the bottleneck? Does the squad need another QA?',
        choices: {
          data: {
            text: "I looked at the sprint data: 6 of 8 stories reached me in the last two days, for 5 of 9 days nothing new reached me, and only 3 had their criteria reviewed before development. With another QA we would have the same queue on day 9. The bottleneck is the flow, and at the retro I'll propose how to change it.",
            reply: "I didn't expect that. OK, no hiring for now: let's see what you propose at the retro.",
            effects: { 3: { text: "You answered Raúl with flow data, without blaming anyone and without asking for what isn't yours to decide." } },
          },
          hire: {
            text: 'Yes, we would need another QA.',
            reply: "I see… I'll talk to management, but I don't promise anything. And meanwhile, what?",
            effects: { 2: { text: 'You asked for another QA without data: it neither tackles the cause nor is it a decision for your role.' } },
          },
          sorry: {
            text: "Maybe… I'll try to go faster.",
            reply: "OK, we'll count on it.",
            effects: { 1: { text: 'You accepted being the bottleneck without looking at the data: the problem stays where it was, now with your name on it.' } },
          },
        },
      },
      laura_data: {
        body: 'Two hours until the retro. Have you looked at the sprint flow in the “Sprint” app yet? Without data, the retro will stay at opinions.',
      },
      test_risk_ok: {
        body: "I saw the daily limit thing: two simultaneous payments skip the limit. Good thing you tested it today. Well prioritized 👏",
        onDeliver: { 3: { text: 'You tested today the three highest-risk stories and found the critical daily-limit bug.' } },
      },
      test_risk_gap: {
        body: "You've tested three stories, but one of the riskier ones was left out. Start there tomorrow.",
        onDeliver: { 2: { text: 'You chose what to test without ordering the queue by risk: a critical story was left untested.' } },
      },
      proposal_ok: {
        body: "I saw your proposals for the retro: all three tackle the flow and the team can fulfil them. Very well chosen.",
      },
      proposal_bad: {
        body: "Careful with one of your proposals: it either doesn't tackle the cause or the team can't decide it in a retro. It's already sent, but think about it for next time.",
      },
      retro: {
        subject: '16:00 · Sprint 14 retro',
        body: "**Laura:** What can we improve?\n\n**Diego:** I'll be frank: for me the problem is that QA takes a long time. Stories sit waiting for days.",
        choices: {
          data_proposal: {
            text: "Thanks for saying it, Diego. I want to understand it: which story did you notice most stalled? (listen) I'll show you the sprint data: 6 of 8 stories reached QA in the last two days. It's not a person, it's the flow. I propose three agreements I prepared.",
            reply: "Seen that way… truth is we release the big ones all at the end. Let's try the agreements this sprint.",
            effects: {
              2: {
                then: { 3: { text: 'You received the feedback without getting defensive, showed the data and the team accepted agreements that tackle the cause.' } },
                else: { 1: { text: 'You brought data, but a proposal did not tackle the cause or was not in the team’s hands: the queue will come back.' } },
              },
            },
          },
          data_only: {
            text: "Thanks for saying it, Diego. I'll show you the data: 6 of 8 stories reached QA in the last two days. What can we change together?",
            reply: "Hmm, splitting stories? I don't know… let's think about it for next time.",
            effects: { 3: { text: 'You brought data but no proposal: the retro ended without concrete agreements.' } },
          },
          defend: {
            text: "That's not true. The problem is you, handing me everything on the last day.",
            reply: 'What a way to start the retro…',
            effects: { 1: { text: 'You answered the feedback defensively and blaming: even if the flow was the problem, the conversation closed.' } },
          },
          accept: {
            text: "You're right, sorry. I'll try to go faster.",
            reply: 'OK, thanks.',
            effects: { 2: { text: 'You accepted the feedback without checking it: receiving well is not agreeing with everything, it is understanding it and looking at the facts.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** Intense day. What are you taking away from the retro?',
        choices: {
          lesson: {
            text: "That when QA looks like the bottleneck, it is almost always the flow: you have to make it visible with data, prioritize the queue by risk and propose agreements the team can keep. And that feedback is listened to before answering.",
            reply: "That's it. And what you did today is half the job of a QA Engineer: improving how the team works, not just testing.",
          },
          more: {
            text: 'That we need more QA.',
            reply: 'Maybe someday. But check the debrief to see what would have happened with another QA and the same flow.',
            effects: { 0: { text: 'You kept “we are short of QA”: the course comes back to it when you are a QA Manager (mission 8).' } },
          },
        },
      },
    },
    docs: {
      ficha_rol: FICHA_QA_MANUAL_EN,
      flujo: {
        title: 'How we work on Cards',
        updatedLabel: 'Laura Méndez · QA Lead',
        body: `## The sprint
- 10-day sprints. Review and retro on the last day.
- A story is “Done” when it is developed, tested and deployed to staging.

## Signs that the flow is getting stuck
- Many stories reach QA at once, at the end of the sprint.
- QA has nothing to test in the first days.
- Big stories that can only be tested whole.
- Acceptance criteria that are discovered while testing.

## The retro
- We talk about facts, not people.
- At most two or three changes are agreed, ones that depend on the team itself.
- They are reviewed at the next retro.`,
      },
    },
    bugs: {
      'C-LIMITE': {
        title: 'The daily limit can be exceeded with two simultaneous payments and it reaches production',
        explanation: 'KOB-433 was the riskiest story in the queue and it was left untested.',
        technique: 'Prioritize the testing queue by risk (impact × probability).',
      },
      'C-NORMATIVA': {
        title: 'Dollar payments do not notify the customer: regulatory non-compliance',
        explanation: 'The mandatory notification (KOB-435) was left untested while something less critical was tested.',
        technique: 'Regulatory risk counts as high impact.',
      },
      'C-COLA': {
        title: 'Sprint 15 again closes with six stories in “Ready for QA”',
        explanation: 'Without team agreements on the flow (criteria first, WIP, small stories, devs who test), the queue repeats.',
        technique: 'Team agreements that tackle the cause.',
      },
      'C-CULPA': {
        title: 'Management is left with the idea that “QA is slow” and another QA is requested without changing anything',
        explanation: 'Without data, the easiest explanation is a person.',
        technique: 'Make the flow visible with data, no culprits.',
      },
      'C-RITMO': {
        title: 'You work until eleven two nights and the next sprint you perform at half',
        explanation: 'Overtime hides the problem and makes it chronic.',
        technique: 'Sustainable pace: the team adjusts the commitment, not your nights.',
      },
      'C-RELACION': {
        title: 'The relationship with Diego cools and bugs get argued twice as much',
        explanation: 'Answering feedback defensively closes the conversation.',
        technique: 'Receiving feedback: thank, ask, check against facts.',
      },
    },
    prevention: {
      title: 'Sprint 15',
      intro: 'What you did today decides how the next sprint goes.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Daily limit tested in time', explanation: 'The riskiest story in the queue, tested first.' },
        1: { label: 'Mandatory notification tested', explanation: 'Regulatory risk goes ahead of the showy.' },
        2: { label: 'Team agreements on the flow', explanation: 'Criteria before developing, WIP limit, small stories and devs who test: changes the team can make.' },
        3: { label: 'Data instead of culprits', explanation: '6 of 8 stories arrived in the last two days: the problem was the flow, not a person.' },
        4: { label: 'Sustainable pace', explanation: "You didn't commit to getting everything out through overtime." },
        5: { label: 'Feedback received', explanation: 'You listened to Diego before answering.' },
      },
    },
    concepts: {
      role_qa_manual: {
        title: 'Responsibilities of the manual QA',
        summary: 'Owns their tests, their bug reports and their status. Decides how to test and when to ask for help. Does not decide whether a business risk is accepted: reports it.',
      },
      risk_ownership: {
        title: 'Who decides the risk',
        summary: 'QA reports and recommends; the business owner decides to ship, cut scope or delay.',
      },
      risk_queue: {
        title: 'Prioritizing the queue by risk',
        summary: 'When there is not time for everything, first what does the most damage if it fails and is most likely to fail: money, regulation and big changes before the showy.',
      },
      flow_visibility: {
        title: 'Making the flow visible',
        summary: 'When work reaches QA, how long it waits, how big it is and whether it had clear criteria. With data, the conversation stops being about people.',
      },
      team_agreements: {
        title: 'Team agreements',
        summary: 'Two or three changes that tackle the cause and depend on the team: criteria reviewed before development, WIP limit, small stories, devs who test.',
      },
      data_not_blame: {
        title: 'Data, not culprits',
        summary: 'Faced with “QA is the bottleneck”, neither blame development nor accept the blame: show how the work flows.',
      },
      receive_feedback: {
        title: 'Receiving feedback',
        summary: 'Thank, ask to understand and check against facts. Neither defend yourself nor agree with everything.',
      },
      sustainable_pace: {
        title: 'Sustainable pace',
        summary: 'Overtime to make it to the close hides the problem and makes it chronic.',
      },
    },
    seniorTips: [
      "At the daily: 6 stories, 3 today, the riskiest; ask the team to test the others with your cases.",
      "Plan for the day: KOB-431 (payments), KOB-433 (daily limit) and KOB-435 (mandatory notification).",
      "To Marta: the color later; if there isn't time, she shows it warning that it is untested.",
      'Analyze the flow before 13:00: that way you reach Raúl with data.',
      'Agreements: criteria reviewed first, WIP limit, small stories or devs who test. No more people, more days, weekends or “only the happy path”.',
      'At the retro: thanks, ask which story he noticed stalled, show the data and propose.',
    ],
    lessons: {
      queue: {
        question: "I don't have time to test everything. Where do I start?",
        body: `By **risk**, which is impact times probability:
- **Impact:** what happens if it fails in production? Customer money and the regulator at the top; a color or an alias, at the bottom.
- **Probability:** how much has it changed? A new integration or concurrent logic fails more than a text field.

The showy is not the risky. And whatever you don't test, say so: “untested” is useful information for whoever decides.`,
      },
      flow: {
        question: 'How do I show that the problem is not me?',
        body: `Don't try to prove it isn't you: **show how the work flows**.
- What day did each story reach QA?
- How many days did QA have nothing new to test?
- How big were the stories?
- Did they have their criteria reviewed before development?

If almost everything arrives in the last days, the bottleneck is the team's flow. With another QA, the queue would be the same on day 9.`,
      },
      agreements: {
        question: 'What do I propose at the retro?',
        body: `Two or three agreements that **tackle the cause** and **depend on the team**:
- QA reviews the criteria before development starts (shift-left).
- Work-in-progress limit: if two stories are waiting for QA, nobody starts another and people help test.
- Smaller stories, arriving throughout the sprint.
- Devs test their story with QA's cases before handing it over.

These don't work: more people (the retro does not decide that), more days (mini-waterfall), weekends or testing only the happy path (they hide the problem).`,
      },
      blame: {
        question: 'Raúl asks me whether QA is the bottleneck. What do I tell him?',
        body: `Neither “it's development's fault” nor “yes, I'll go faster”.

1. **Flow data:** when work arrives and in what state.
2. **Conclusion without culprits:** “the problem is how the work flows, not a person”.
3. **Next step:** “at the retro I'll propose how to change it”.

Asking for another QA is not yours to do either: headcount is others' decision, and without changing the flow it fixes nothing.`,
      },
      feedback: {
        question: "I've been criticized in front of everyone. How do I respond?",
        body: `1. **Thank them** for saying it to your face: it is better than hearing it in the hallways.
2. **Ask** to understand: “which story did you notice most stalled?”.
3. **Check against facts**, without attacking: “the data says that…”.
4. **Propose** something concrete.

Receiving feedback well is neither agreeing with everything nor defending against everything: it is understanding what is true and acting.`,
      },
      pace: {
        question: "Isn't it better to stay late and get everything out?",
        body: `Once, maybe. As a system, no:
- **It hides the problem:** the sprint “closes” and nobody changes anything.
- **It makes it chronic:** the next sprint is planned counting on your nights.
- **It wears you out:** tiredness brings mistakes and bugs that slip through.

The professional thing is to say what there is time to test and let the team adjust the commitment.`,
      },
    },
    quiz: {
      pre: {
        g1pre_queue: {
          question: 'You have 6 stories waiting and today you can only test 3. What criterion do you use to choose?',
          options: ['By order of arrival', 'The ones the PO asks for the demo', 'By risk: impact if they fail and probability that they fail', 'The smallest, to close more'],
          explanation: 'Risk (impact × probability) decides what gets tested first when there is not time for everything.',
        },
        g1pre_flow: {
          question: 'Your EM says QA is the bottleneck. What data helps most to understand what is happening?',
          options: ["How many bugs you've found", 'What day each story reached QA and in what state', "How many hours you've worked", 'How many automated tests there are'],
          explanation: 'When and how work reaches QA shows whether the problem is a person or the flow.',
        },
        g1pre_agree: {
          question: 'Which of these retro agreements best tackles a QA queue at the end of the sprint?',
          options: ['Hire another QA', 'Extend the sprint by two days', 'QA tests only the happy path', 'Limit work in progress and have the team help test'],
          explanation: 'Limiting WIP makes the team finish instead of start and spreads the testing.',
        },
        g1pre_blame: {
          question: 'At the daily they hand you three more stories on the second-to-last day. What do you do?',
          options: ['Complain that they always arrive late', 'Make the queue visible, prioritize by risk and ask for help testing', 'Test everything even if you stay late', 'Say nothing and do what you can'],
          explanation: 'Making it visible, prioritizing and asking for help turns the problem into a team matter.',
        },
        g1pre_feedback: {
          question: 'A colleague says at the retro that “QA takes too long”. What is the best first reaction?',
          options: ['Thank them and ask what they noticed, before giving your version', 'Explain right away that it is not your fault', 'Apologize and promise to go faster', 'Ask to talk in private'],
          explanation: 'First understand; then check against facts and propose.',
        },
        g1pre_pace: {
          question: 'Why is it not a good idea to get each sprint close through overtime?',
          options: ['Because it is forbidden', 'Because it hides the problem and makes it chronic', 'Because the devs get annoyed', 'It does not matter if it is always done'],
          explanation: 'The sprint seems to close well and nobody changes the cause.',
        },
      },
      post: {
        g1post_queue: {
          question: 'Which story would you test first: a card color change or a spending limit with simultaneous payments?',
          options: ['The color, because the PO shows it', 'The spending limit, for impact and probability of failure', 'It makes no difference', 'The one that arrived first'],
          explanation: 'Customer money and new concurrent logic: high impact and probability.',
        },
        g1post_flow: {
          question: '6 of 8 stories reached QA in the last two days of the sprint. What does it indicate?',
          options: ['That QA is slow', 'A team flow problem: the work piles up at the end', 'That more devs are needed', 'Nothing relevant'],
          explanation: 'If everything arrives at the end, any QA would be the bottleneck: it is the flow.',
        },
        g1post_agree: {
          question: 'What makes a proposal for the retro good?',
          options: ['That management approves it', 'That it tackles the cause and depends on the team itself', 'That it is ambitious: the more, the better', 'That QA proposes it'],
          explanation: 'Two or three changes on the cause, which the team can make and review at the next retro.',
        },
        g1post_blame: {
          question: 'Why is it not your role to ask for another QA at the retro?',
          options: ['Because it is never needed', 'Because headcount is decided by another role and without changing the flow it does not fix the queue', 'Because it looks bad', 'Because QAs do not speak at retros'],
          explanation: 'The retro agrees on team changes; headcount is decided by managers with data.',
        },
        g1post_feedback: {
          question: 'Receiving harsh feedback well means…',
          options: ['Agreeing to avoid conflict', 'Defending your work point by point', 'Understanding what is true, checking it against facts and acting', 'Ignoring it if you disagree'],
          explanation: 'Neither surrender nor defend: understand, check and act.',
        },
        g1post_pace: {
          question: "If you don't have time to test what was committed, the professional thing is…",
          options: ['Stay as many hours as it takes', 'Test faster skipping cases', 'Say what there is time to test and let the team adjust the commitment', 'Mark it as tested and review it later'],
          explanation: 'Transparency and adjusting the commitment as a team, not chronic overtime.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({ laura: 'QA Lead · your manager', sergio: 'QA Automation · Cards', marta: 'Product Owner · Payments', diego: 'Backend developer · Cards' }),
)
