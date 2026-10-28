import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m07Conversacion } from '../m07-conversacion'
import { missionEn } from './missionEn'
import { FICHA_QA_LEAD_EN } from './shared'

/** Course 4: QA Team Management · Mission 7 — The difficult conversation. English version of ../m07-conversacion.ts. */
export const m07ConversacionEn = missionEn(
  m07Conversacion,
  {
    title: 'The difficult conversation',
    subtitle: 'QA Lead: feedback with facts, finding the cause, a plan with measurable goals, documenting, mediating and protecting confidentiality.',
    playerRole: 'QA Lead · Payments and Cards',
    dayLabel: 'Thursday · year 4',
    appLabel: '1:1',
    wikiLabel: 'Wiki · Payments QA',
    verdicts: {
      good: {
        title: 'A conversation that changes things',
        body: "Lucía knows what has to change and has help to do it; in six weeks she closes her stories and asks for help in time. The team has not found out anything that was not theirs to know.",
      },
      ok: {
        title: 'Conversation held, change halfway',
        body: 'You took the step, but something was left lame: the cause, the plan, the record or the team. Check the debrief to see what failed.',
      },
      bad: {
        title: 'A conversation that makes things worse',
        body: "Lucía doesn't know what to change, the team talks about her case and People has a plan that doesn't hold up. Replay the mission starting with the preparation.",
      },
    },
    briefing: {
      title: 'Year 4 · The difficult conversation',
      paragraphs: [
        'Three months ago you moved Lucía to Cards to relieve Pablo. Since then she has been performing below expectations.',
        "Nerea complains that she redoes Lucía's tests, the team is starting to talk and Andrea, from People, asks whether to open an improvement plan.",
        "Today at 12:00 you have the 1:1 with Lucía. What you prepare beforehand decides how it will go.",
      ],
      goals: [
        'Read the QA Lead role sheet.',
        "Handle Nerea's complaint without exposing Lucía.",
        'Prepare the 1:1 in the “1:1” app: concrete examples and a script. Before 12:00.',
        'In the conversation, look for the cause and agree a measurable plan in writing.',
        'Answer People about the improvement plan.',
        'Mediate between Nerea and Lucía.',
      ],
    },
    scenes: {
      mail_andrea: {
        subject: 'Lucía: do we open an improvement plan?',
        body: "Hi:\n\nI am getting comments that Lucía has been below expectations for a few months. Do we open a formal improvement plan? If so, I need you to tell me today so I can prepare it.\n\nWe talk at 14:00.\n\nAndrea · People Partner",
      },
      mail_laura: {
        subject: 'Your first difficult conversation',
        body: "Hi:\n\nToday you have the 1:1 with Lucía at 12:00. Prepare it in the “1:1” app: what is expected of her, concrete examples and a script.\n\nTwo things I learned late: the first clear conversation goes before any formal plan, and what happens to a person on the team is not discussed with the rest.\n\nLaura · QA Manager",
      },
      nerea_complaint: {
        body: "Once again I had to redo Lucía's limit tests. This can't go on, and I'm not the only one who thinks so.",
        choices: {
          private: {
            text: "Thanks for telling me directly. I'll take care of talking to Lucía; I won't tell you the details, just as I wouldn't tell yours. This afternoon the three of us will see how you coordinate on Cards.",
            reply: 'OK. Sounds good.',
            effects: { 2: { text: "You listened to Nerea's complaint, took charge and did not share Lucía's situation." } },
          },
          agree: {
            text: "I know, it's a problem. We'll see what People says.",
            reply: 'People? Ah… OK.',
            effects: { 1: { text: 'You told Nerea that People is involved: Lucía’s situation starts to circulate.' } },
          },
          dismiss: {
            text: "Do what you can, it's not your problem.",
            reply: 'Yes, but I am the one who has to redo it.',
            effects: { 1: { text: "You downplayed Nerea's complaint: the friction between them keeps growing." } },
          },
        },
      },
      hector_rumor: {
        body: "Hey, at the coffee machine they're saying Lucía is on thin ice. Is it true? Are you going to fire her?",
        choices: {
          confidential: {
            text: "I don't talk about anyone on the team's situation with others, just as I wouldn't talk about yours. If something affects you, you and I will see it.",
            reply: "You're right. Sorry.",
            effects: {
              0: {
                then: { 2: { text: 'You protected Lucía’s confidentiality without lying to Héctor.' } },
                else: { 0: { text: 'You answered Héctor well, but what you told Nerea is already circulating on the team.' } },
              },
            },
          },
          share: {
            text: 'Between us: People is considering an improvement plan.',
            reply: "Wow. I won't say anything…",
            effects: { 2: { text: 'You shared Lucía’s situation with Héctor.' } },
          },
          deny: {
            text: "No way, all good.",
            reply: 'Right… if you say so.',
            effects: { 0: { text: 'You denied something the team is seeing: you protect Lucía, but lose credibility.' } },
          },
        },
      },
      prep_ok: {
        body: "I saw your preparation: concrete facts, questions to understand the cause, a measurable plan and a shared summary. You're doing well.",
      },
      talk: {
        subject: '12:00 · 1:1 with Lucía',
        body: "**Lucía:** Hi. You said you wanted to talk about how things are going…",
        choices: {
          prepared: {
            text: "Yes. I bring you three concrete situations: sprint 14, with three stories untested at the close and the release moved two days; the limits plan, which arrived two days late without warning; and the last four dailies, with the story blocked for a week without asking for help. Before anything else, I want to understand what is going on. What is hard for you?",
            reply: 'OK… Yes, the sprint 14 thing was my fault. It’s just that…',
            effects: { 3: { text: 'You opened with concrete facts and their impact, and asked before judging.' } },
          },
          improvise: {
            text: "I see you as weak lately. What's wrong?",
            reply: "Weak? I don't know what you mean… I do what I can.",
            effects: { 0: { text: 'You opened with a vague judgement: Lucía gets defensive.' } },
          },
          threat: {
            text: 'Your performance is not acceptable and People is going to open an improvement plan.',
            reply: '…OK. Anything else?',
            effects: { 2: { text: "You started with the consequence: Lucía shut down and you didn't find out what was happening to her." } },
          },
        },
      },
      talk_defensive: {
        subject: '1:1 with Lucía (continued)',
        body: "**Lucía:** If there's something I'm doing wrong, tell me clearly.",
        choices: {
          reframe: {
            text: "You're right, I put it badly. Let's go to facts: sprint 14, the limits plan that arrived late and the story blocked for a week without asking for help. I want to understand what is going on.",
            reply: "OK. That's better… It's just that…",
            effects: { 1: { text: 'You admitted you started badly and went back to the facts: the conversation recovers.' } },
          },
          insist: {
            text: 'You know what I mean.',
            reply: "No, I don't know.",
            effects: { 1: { text: 'Without concrete examples, Lucía leaves not knowing what she has to change.' } },
          },
        },
      },
      talk_cause: {
        subject: 'Lucía tells what is going on',
        body: "**Lucía:** Since you moved me to Cards I don't understand the domain. Nobody explained to me how the limits or the authorizations work, and after the production mistake I'm embarrassed to ask again. So I get stuck and say nothing.",
        choices: {
          plan: {
            text: "Thanks for telling me. I propose two weeks pairing with Pablo to learn Cards. Goals for the next six weeks: test plans ready before the story reaches QA, warning me if you are blocked for more than a day and closing the sprint stories. We'll have a 1:1 every week and review at six weeks. This afternoon I'll send you the summary.",
            reply: "OK. With Pablo next to me I think it's possible. Thanks for telling me clearly.",
            effects: {
              5: { text: 'You tackled the cause (Cards without training) with concrete support, measurable goals and a review date.' },
              6: {
                then: { 1: { text: 'You sent her the summary in writing: facts, agreements, goals and date.' } },
                else: { 0: { text: 'You did not share in writing what was agreed.' } },
              },
            },
          },
          pip: {
            text: "I understand, but we're going to open a formal plan with People anyway.",
            reply: 'Ah. OK.',
            effects: { 0: { text: 'You listened to the cause and responded with a formal plan instead of support.' } },
          },
          comfort: {
            text: "Don't worry, I'm sure it will gradually improve.",
            reply: 'I hope so…',
            effects: { 0: { text: 'You were kind, but without a plan or goals nothing changes.' } },
          },
        },
      },
      andrea_pip: {
        subject: '14:00 · Andrea (People): improvement plan?',
        body: "**Andrea:** What do we do about Lucía? Do I open the improvement plan?",
        choices: {
          plan_first: {
            text: "Not yet. Today she had clear feedback for the first time and we found the cause: we didn't train her on Cards. We agreed measurable six-week goals with support, and it is in writing. If she doesn't improve with that, we open the formal plan with you.",
            reply: "Perfect, that's exactly the right order. I'll leave you a template for the follow-up.",
            effects: { 3: { text: 'First clear feedback, cause and support; the formal plan only if that does not work.' } },
          },
          pip_now: {
            text: 'Yes, open it now.',
            reply: "Has she had clear feedback before? Because if not, the plan won't hold up.",
            effects: { 1: { text: 'You asked for a formal plan without a prior clear conversation or support.' } },
          },
          nothing: {
            text: "Nothing needed, she'll improve on her own.",
            reply: 'OK, but if in three months we are still the same, what has changed?',
            effects: { 0: { text: 'You let the problem pass without a plan.' } },
          },
        },
      },
      mediation: {
        subject: '15:00 · Nerea and Lucía: how you work on Cards',
        body: "**Nerea:** Well, here we are.",
        choices: {
          agreement: {
            text: "We're not here to judge anyone, but to agree how you work together. What does each of you need from the other? I propose that Nerea reviews Lucía's cases before running them, not after, and we review it in two weeks.",
            reply: 'That saves me redoing it, and she learns sooner. Works for me.',
            effects: { 2: { text: 'You mediated on how they work together, with a concrete agreement and review date.' } },
          },
          judge: {
            text: 'Nerea is right: Lucía, you have to improve your tests.',
            reply: '…',
            effects: { 1: { text: 'You sided with one in front of the other: the meeting turned into a trial.' } },
          },
          separate: {
            text: "Better that you don't work together for now.",
            reply: "But we're the only two QAs on Cards…",
            effects: { 0: { text: 'Separating them avoids friction today, but does not solve how to work together.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** How was your first difficult conversation?',
        choices: {
          lesson: {
            text: "That you have to go with facts and their impact, ask before judging and look for the cause; that the plan needs measurable goals, support and to be in writing, and that what concerns one person is not discussed with the rest.",
            reply: 'That is caring for someone: telling them the truth with respect and helping them change it.',
          },
          avoid: {
            text: "That it's better to avoid these conversations as long as possible.",
            reply: 'Avoiding them is what got us here. Check the debrief.',
            effects: { 0: { text: 'You kept “avoid difficult conversations”: arriving late makes them harder.' } },
          },
        },
      },
    },
    docs: {
      ficha_lead: FICHA_QA_LEAD_EN,
      feedback_guide: {
        title: 'Difficult feedback and improvement plans',
        updatedLabel: 'Andrea Gil · People',
        body: `## Before the conversation
- Concrete examples: situation, behavior and impact. No judgements and no third-party opinions.

## In the conversation
- Say why you are there, with facts.
- Ask and listen: look for the cause.
- Agree measurable goals, the support and the review date.

## Afterwards
- Written summary the same day, shared with the person.
- The formal improvement plan only comes if, with clear feedback and support, there is no change.
- Confidentiality: it is not discussed with the rest of the team.`,
      },
    },
    bugs: {
      'C-INJUSTO': {
        title: 'People opens a formal plan without prior feedback and it has to be withdrawn',
        explanation: 'A formal plan without a clear conversation, cause or prior support is unfair and does not hold up.',
        technique: 'First clear feedback and a plan with support; the formal one only if it does not work.',
      },
      'C-CAUSA': {
        title: 'Lucía is still stuck on Cards: nobody tackled the cause',
        explanation: 'Without training in the new domain, no “try harder” changes anything.',
        technique: 'Ask, listen and give concrete support for the cause.',
      },
      'C-VAGO': {
        title: "Lucía doesn't know what she has to change",
        explanation: "Without concrete facts, feedback sounds like judgement and can't be acted on.",
        technique: 'Situation, behavior and impact.',
      },
      'C-RUMOR': {
        title: "The whole team talks about Lucía's situation",
        explanation: 'What the Lead shares “between us” circulates, and the person loses trust in their Lead and the team.',
        technique: 'Confidentiality without lying.',
      },
      'C-CONFLICTO': {
        title: 'Nerea and Lucía stop talking to each other',
        explanation: 'Unmediated friction grows until the work on Cards suffers.',
        technique: 'Mediate on how they work together, with a concrete agreement.',
      },
      'C-PAPEL': {
        title: "After six weeks nobody remembers the same thing about what was agreed",
        explanation: 'Without a shared summary, the review turns into “I understood something else”.',
        technique: 'Written summary the same day, shared with the person.',
      },
    },
    prevention: {
      title: 'Six weeks later',
      intro: 'A difficult conversation is measured by what changes afterwards.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Concrete feedback', explanation: 'Three facts with their impact, no judgements.' },
        1: { label: 'Cause tackled', explanation: 'Two weeks pairing with Pablo to learn Cards.' },
        2: { label: 'In writing', explanation: 'Shared summary with goals and review date.' },
        3: { label: 'Formal plan at its time', explanation: 'Only if there is no change with feedback and support.' },
        4: { label: 'Confidentiality', explanation: 'Neither Nerea nor Héctor knew more than was theirs to know.' },
        5: { label: 'Conflict mediated', explanation: 'Nerea reviews beforehand instead of redoing afterwards.' },
      },
    },
    concepts: {
      role_qa_lead: {
        title: 'Responsibilities of the QA Lead',
        summary: 'The people on their team: that they know what is expected, that they grow and that they can work. Escalates to their Manager low performance that does not improve with feedback and support.',
      },
      sbi_feedback: {
        title: 'Feedback with facts',
        summary: 'Situation, behavior and impact. No judgements, no third-party opinions and no sandwich.',
      },
      root_cause: {
        title: 'Finding the cause',
        summary: 'Expectations, knowledge, capacity or something personal: ask and listen before proposing.',
      },
      improvement_plan: {
        title: 'Plan with measurable goals',
        summary: 'Verifiable goals, concrete support and a review date. The formal plan, later and only if needed.',
      },
      documentation: {
        title: 'Documenting the conversation',
        summary: 'Written summary the same day, shared with the person: facts, agreements, goals and date.',
      },
      mediation: {
        title: 'Mediating a conflict',
        summary: 'Take charge, talk about how they work and not about who is right, and close a concrete agreement.',
      },
      confidentiality: {
        title: 'Confidentiality',
        summary: "A person's situation is not discussed with the rest, without lying.",
      },
    },
    seniorTips: [
      "To Nerea: thanks for telling me; I'll take care of it and this afternoon we'll see how you coordinate.",
      "To Héctor: I don't talk about anyone on the team's situation, just as I wouldn't talk about yours.",
      'Preparation: the three facts (sprint 14, limits plan, dailies), direct opening, open questions, six-week goals and a shared summary.',
      'To Lucía: facts, ask and listen; two weeks with Pablo, measurable goals and a weekly 1:1.',
      'To Andrea: not yet; if she does not improve with this plan, we open the formal one.',
      'With Nerea and Lucía: how you work, not who is right; review beforehand instead of redoing.',
    ],
    lessons: {
      sbi: {
        question: 'How do I give feedback about something that is going wrong?',
        body: `With the **situation, behavior, impact** model:
- **Situation:** when and where (“in sprint 14”).
- **Behavior:** what was seen, without interpreting (“three stories reached the close untested”).
- **Impact:** what it caused (“the release moved two days”).

No judgements about the person (“you're slow”) and no opinions from others (“Nerea says that…”). And no sandwich: the message gets lost among the praise.`,
      },
      cause: {
        question: 'Why look for the cause before proposing anything?',
        body: `Low performance is a symptom. The usual causes:
- they don't know what is expected (unclear expectations);
- they don't know how to do it (training, new domain);
- they can't (load, tools, blockers);
- something personal.

Only the last one is private; the others are usually the **Lead's responsibility**. Ask openly and listen: “What is hard for you? What would you need?”.`,
      },
      plan: {
        question: 'What does a good improvement plan look like?',
        body: `- **Measurable goals:** what has to happen, not “try harder”.
- **Concrete support:** training, pairing, weekly 1:1.
- **Deadline and review date:** for example, six weeks.
- **In writing and shared:** a summary the same day.

The **formal improvement plan** with People comes later, if there is no change with clear feedback and support. Opening it without that is unfair and does not hold up.`,
      },
      record: {
        question: 'Why document the conversation?',
        body: `Because in six weeks nobody remembers the same thing. A summary **shared with the person**: facts, agreements, goals and review date.

Notes only for yourself are not an agreement. And if one day a formal process is needed, what counts is that there was clear feedback and support, in writing.`,
      },
      mediation: {
        question: 'Two people on the team clash. What do I do?',
        body: `- Listen to each one separately and **take charge**: it is not “their problem”.
- Together, talk about **how they work**, not about who is right.
- Look for a **concrete agreement** (for example, review beforehand instead of redoing afterwards) and a date to review it.

Never judge one in front of the other.`,
      },
      confidential: {
        question: 'The team asks about a colleague. What do I say?',
        body: `What happens to a person on the team **is not discussed with the rest**: not the performance, nor People, nor the plans.

Without lying: “I don't talk about anyone on the team's situation, just as I wouldn't talk about yours”. Denying everything (“all good”) costs you credibility; telling it “between us” is known within an hour.`,
      },
    },
    quiz: {
      pre: {
        g7pre_sbi: {
          question: 'Which is the best example for giving feedback?',
          options: ['“You’re slow”', '“In sprint 14, three stories reached the close untested and the release moved two days”', '“Nerea says you don’t get it”', '“Lately I see you as weak”'],
          explanation: 'Situation, behavior and impact.',
        },
        g7pre_cause: {
          question: 'A QA has been performing worse since changing squad. What do you do first?',
          options: ['Ask for an improvement plan', 'Tell her to try harder', 'Ask what is hard for her and listen', 'Send her back to her previous squad'],
          explanation: 'Without the cause, the plan tackles the symptom.',
        },
        g7pre_plan: {
          question: 'When is a formal improvement plan opened with People?',
          options: ['At the first problem', 'Never', 'When another colleague asks for it', 'When, with clear feedback and support, there is no change'],
          explanation: 'First the clear conversation and the support.',
        },
        g7pre_record: {
          question: 'How do you document a conversation about performance?',
          options: ['Written summary shared with the person', 'Notes only for you', 'No need', 'An email to People without copying her'],
          explanation: 'Both parties remember the same thing.',
        },
        g7pre_mediation: {
          question: 'A QA complains that she redoes another QA’s work. What do you do?',
          options: ['Agree with her in front of the other', 'Take charge and agree with both how they work together', 'Tell her it is not her problem', 'Separate them'],
          explanation: 'How they work, not who is right.',
        },
        g7pre_conf: {
          question: 'A QA asks you whether a colleague is going to be fired. What do you answer?',
          options: ['“Between us, yes”', '“No way, all good”', '“I don’t talk about anyone on the team’s situation, just as I wouldn’t talk about yours”', '“Ask her”'],
          explanation: 'Confidentiality without lying.',
        },
      },
      post: {
        g7post_sbi: {
          question: 'What problem does “sandwich” feedback (praise, criticism, praise) have?',
          options: ['It is too harsh', 'It is too long', 'None', 'The message gets lost among the praise'],
          explanation: 'The person keeps the praise.',
        },
        g7post_cause: {
          question: "Lucía doesn't know Cards because nobody trained her. Whose cause is that?",
          options: ["Lucía's", "The Lead's, who moved her to the squad without training", "People's", "Nerea's"],
          explanation: 'Many causes are the Lead’s responsibility.',
        },
        g7post_plan: {
          question: 'Which is a measurable goal?',
          options: ['Test plans ready before the story reaches QA', 'Trying harder', 'Having a better attitude', 'Being more involved'],
          explanation: 'It can be checked whether it is met.',
        },
        g7post_record: {
          question: 'What should the conversation summary include?',
          options: ['Your opinions about the person', 'What other colleagues say', 'Facts, agreements, goals and review date', 'Only the date'],
          explanation: 'What is needed to review progress fairly.',
        },
        g7post_mediation: {
          question: 'Which agreement helps two QAs who clash the most?',
          options: ['That they do not work together', 'That the Lead decides who is right', 'None: they will sort it out', 'Reviewing the cases before running them, with a date to review the agreement'],
          explanation: 'A concrete agreement about how they work.',
        },
        g7post_conf: {
          question: "You tell a QA that People is involved in her colleague's case. What happens?",
          options: ['Nothing, she is trustworthy', 'The situation starts circulating on the team', 'The relationship improves', 'It gets resolved sooner'],
          explanation: '“Between us” is known within an hour.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    laura: 'QA Manager · your manager',
    andrea: 'People Partner · People',
    hector: 'QA · Payments · your team',
    lucia: 'QA · Cards · your team',
    nerea: 'QA · Cards · your team',
    pablo: 'QA · Cards · your team',
  }),
)
