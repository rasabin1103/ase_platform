import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m09Recortes } from '../m09-recortes'
import { missionEn } from './missionEn'
import { FICHA_QA_MANAGER_EN } from './shared'

/** Course 4: QA Team Management · Mission 9 — Cuts. English version of ../m09-recortes.ts. */
export const m09RecortesEn = missionEn(
  m09Recortes,
  {
    title: 'Cuts',
    subtitle: 'QA Manager: prioritize by risk, capacity plan, protect key people, agree the scope with the business and communicate honestly.',
    playerRole: 'QA Manager · Everyday Banking',
    dayLabel: 'Monday · year 6',
    appLabel: 'Capacity',
    wikiLabel: 'Wiki · Everyday Banking QA',
    verdicts: {
      good: {
        title: 'A cut that breaks nothing',
        body: 'The area saves what was asked without layoffs, the critical stays covered, Héctor stays leading the automation and the team trusts you because you told them straight.',
      },
      ok: {
        title: 'Numbers add up, collateral damage',
        body: 'You reached the saving, but something broke along the way: risk, people or trust. Check the debrief to see what.',
      },
      bad: {
        title: 'Cutting without criteria',
        body: 'Savings were made where it hurt most and it was told badly. Replay the mission starting with the capacity plan.',
      },
    },
    briefing: {
      title: 'Year 6 · 20% less',
      paragraphs: [
        'The committee has closed the budget: Everyday Banking QA has €400k less next year.',
        'The rumor is already going around the team, the CTO has his own idea and someone key is receiving offers.',
        'At 15:00 Laura needs your plan for the committee. At 16:00 you tell the team.',
      ],
      goals: [
        'Read the QA Manager role sheet.',
        'Answer the rumor without denying or getting ahead of decisions.',
        'Build a capacity plan that reaches €400k without touching the critical or the key people.',
        'Agree with the business what stops being tested.',
        'Present the plan to Laura and communicate it to the team.',
        'Retain the key person who has another offer.',
      ],
    },
    scenes: {
      mail_laura: {
        subject: 'Budget 2027: 20% less',
        body: "Hi:\n\nThe committee has closed the 2027 budget: Engineering goes down 20%. For Everyday Banking QA that is €400k less.\n\nI need your capacity plan at 15:00. If layoffs can be avoided, better, but the proposal is yours: what matters is that the critical stays covered and that the team understands it.\n\nYou have the “Capacity” app.\n\nLaura · VP Engineering",
      },
      sergio_rumor: {
        body: "The rumor is going around that there are cuts. The team is nervous, and Javier asked me whether his job is at risk. What do I tell them?",
        choices: {
          honest: {
            text: "The truth: there is a budget adjustment and there are no decisions yet. This afternoon at 16:00 I'll tell the whole team what we know. As for Javier, that we'll tell him first. Don't promise him anything we don't know.",
            reply: 'OK. I can say that without lying.',
            effects: { 2: { text: 'You gave your lead an honest answer and a date to tell everything.' } },
          },
          deny: {
            text: "Tell them there's nothing, to stay calm.",
            reply: 'OK… although everybody knows something is going on.',
            effects: { 1: { text: 'You denied something the team already senses: when the announcement comes, you will lose credibility.' } },
          },
          leak: {
            text: "Yes, and we'll probably touch performance. But don't say it.",
            reply: 'Performance? Ugh. Javier is going to be a wreck.',
            effects: { 1: { text: 'You got ahead of a decision that had not been made, and to someone who should not have heard it.' } },
          },
        },
      },
      raul_outsource: {
        body: 'The easiest thing: outsource all the regression, payments included, and you have the saving. Shall we do it?',
        choices: {
          risk: {
            text: "The back-office regression yes, it is low risk. Payments no: the vendor doesn't know the domain or the anti-fraud, and a failure there costs more than the whole saving. I'll bring you the plan with the numbers.",
            reply: "Works for me if the 400 adds up.",
            effects: { 2: { text: 'You separated what can be outsourced from what is critical, with a risk argument.' } },
          },
          yes: {
            text: "OK, I'll include it.",
            reply: 'Perfect!',
            effects: { 0: { text: 'You accepted outsourcing the critical without evaluating the risk.' } },
          },
          no: {
            text: "No way, we're not outsourcing anything.",
            reply: 'Then explain to me where the 400 comes from.',
            effects: { 1: { text: 'You closed the door on a reasonable lever without offering an alternative.' } },
          },
        },
      },
      plan_ok: {
        body: "I saw the plan: more than €400k without layoffs, with payments and cards intact and the key people in. What you stop testing will need to be accepted by the business in writing.",
      },
      marta_scope: {
        subject: '13:00 · Marta (Product): “What happens with my releases?”',
        body: "**Marta:** I hear QA is cutting. What is going to happen with my releases?",
        choices: {
          agree: {
            text: "The critical stays the same: payments and cards are not touched. We stop manually testing the low-risk internal apps. I'll explain which ones and what could fail, and I need you to accept that risk in writing. If something changes, we review it.",
            reply: "That seems reasonable. Send it to me and I'll sign it.",
            effects: { 2: { text: 'The business knows and accepts in writing the risk of what stops being tested.' } },
          },
          hide: {
            text: "Don't worry, you won't notice anything.",
            reply: 'Perfect.',
            effects: { 0: { text: 'You hid from the business what stops being tested: when it fails, nobody knew.' } },
          },
          blame: {
            text: "Ask management, they are the ones cutting.",
            reply: "I'm asking you, you're the one who knows what you stop doing.",
            effects: { 1: { text: 'You hid behind management instead of explaining the impact.' } },
          },
        },
      },
      committee: {
        subject: '15:00 · Laura: the plan for the committee',
        body: "**Laura:** Tell me the plan in two minutes. What do I take to the committee?",
        choices: {
          present: {
            text: "More than €400k without firing anyone: we don't replace two departures, we outsource the back-office regression and move those three people to the critical, we stop manually testing low-risk internal apps with the business's approval and we keep a single tool. Payments, cards and performance intact. The cost: less margin. We review it in six months.",
            reply: "Clear and defensible. I approve it and take it like that.",
            effects: { 3: { text: 'You presented a plan prioritized by risk, without layoffs and with its cost explained.' } },
          },
          equal: {
            text: '20% less for each team, equally. It is the fairest.',
            reply: "Payments too? Equal may not be the fairest with the risk.",
            effects: { 0: { text: 'Cutting equally does not prioritize: the critical loses the same as what does not matter.' } },
          },
          seniors: {
            text: 'The fastest: let go of the three most expensive seniors.',
            reply: 'And who knows about payments afterwards?',
            effects: { 1: { text: 'You proposed saving with the people who sustain the critical risk.' } },
          },
        },
      },
      all_hands: {
        subject: '16:00 · Meeting with the whole team',
        body: "**Sergio:** We're all here. Tell us.",
        choices: {
          honest: {
            text: "I'll tell you everything I know. The budget goes down 20%. Nobody loses their job. We will not replace the two departures; the back-office regression will be done by a vendor and those who did it move to payments and cards; we stop manually testing low-risk internal apps. There will be less margin and we will review it in six months. Ask whatever you want, and this week you have a 1:1 with your lead.",
            reply: 'Thanks for telling it like this, straight.',
            effects: { 3: { text: 'You communicated what changes, why and what does not, with room for questions.' } },
          },
          spin: {
            text: "It's a great opportunity to be more efficient!",
            reply: '…',
            effects: { 0: { text: 'You sold a cut as an opportunity: the team notices you are not telling them the truth.' } },
          },
          minimal: {
            text: 'There are cuts. Your leads will be telling you.',
            reply: 'And that’s it?',
            effects: { 0: { text: 'You delegated the announcement to the leads without giving information.' } },
          },
        },
      },
      hector_offer: {
        body: "I'm telling you before anyone else: another company called me. With the cuts… what future do I have here?",
        choices: {
          retain: {
            text: "Thanks for telling me. You are key. I won't promise a raise that doesn't exist this year, but I propose that you lead the automation of the cards regression, and review your salary at the next window. Tomorrow we talk about it in a 1:1.",
            reply: "That does interest me. We'll talk tomorrow.",
            effects: { 2: { text: 'You retained a key person with a real challenge and without promises you cannot keep.' } },
          },
          match: {
            text: "I'll match whatever they offer you.",
            reply: 'With a 20% smaller budget? OK…',
            effects: { 0: { text: 'You promised money you do not have this year.' } },
          },
          go: {
            text: "If you leave, I'll understand.",
            reply: 'OK. I see.',
            effects: { 0: { text: 'You did nothing to retain a key person.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** Hard day. What are you taking away?',
        choices: {
          lesson: {
            text: "That you cut by risk and not equally: the critical and the key people last. That what stops being done is accepted by the business in writing. And that you communicate early and honestly, without promises you cannot keep.",
            reply: 'That is managing in bad times: hard decisions told straight.',
          },
          numbers: {
            text: 'That what mattered was making the numbers add up.',
            reply: 'Numbers add up in many ways. Check the debrief.',
            effects: { 0: { text: 'You kept the numbers: the how decides what happens afterwards.' } },
          },
        },
      },
    },
    docs: {
      ficha_manager: FICHA_QA_MANAGER_EN,
      cuts_guide: {
        title: 'Budget adjustments: how we manage them',
        updatedLabel: 'Laura Méndez · VP Engineering',
        body: `## The plan
- Each lever with its saving, the risk it leaves uncovered and who it affects.
- The critical and the key people, last.
- Departures that are not replaced before layoffs.

## With the business
- What stops being tested is accepted by its owner, in writing.

## With the team
- Early, complete and unvarnished. What changes, why and what does not change.
- 1:1 with their leads that same week.`,
      },
    },
    bugs: {
      'C-CRITICO': {
        title: 'A payments failure reaches production: the outsourced regression did not cover it',
        explanation: 'Outsourcing the critical to someone who does not know the domain saves less than a failure costs.',
        technique: 'Outsource only the low-risk.',
      },
      'C-PERSONAS': {
        title: 'You lose whoever sustained payments or the performance of the campaigns',
        explanation: 'Cutting key people leaves uncovered what matters most.',
        technique: 'Protect the key people and save through other levers.',
      },
      'C-FUGA': {
        title: 'Héctor accepts the other offer',
        explanation: 'In a cut, key people are the first to receive offers.',
        technique: 'A real challenge and a commitment you can keep.',
      },
      'C-RUMOR': {
        title: 'The rumor travels faster than the information',
        explanation: 'Denying or getting ahead of decisions feeds uncertainty.',
        technique: 'Say what is known and when the rest will be told.',
      },
      'C-ALCANCE': {
        title: "An internal app fails and the business didn't know it was no longer tested",
        explanation: 'Reducing scope without the risk owner accepting it shifts the blame to QA.',
        technique: 'Explain what stops being tested and have the business accept it in writing.',
      },
      'C-MORAL': {
        title: 'The team feels deceived and morale drops',
        explanation: 'A vague or varnished announcement breaks trust.',
        technique: 'Communicate early, completely and unvarnished, with room for questions.',
      },
    },
    prevention: {
      title: 'Six months later',
      intro: 'A cut is measured by what keeps working afterwards.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'The critical, intact', explanation: 'Payments and cards stay in the hands of those who know the domain.' },
        1: { label: 'Key people in', explanation: 'Neither the payments seniors nor performance before the campaigns.' },
        2: { label: 'Héctor stays', explanation: 'He leads the cards automation.' },
        3: { label: 'Rumor handled', explanation: 'The truth and a date, without denying or getting ahead.' },
        4: { label: 'Scope accepted', explanation: 'The business signed what stops being tested.' },
        5: { label: 'Told straight', explanation: 'What changes, why and what does not, with questions and 1:1.' },
      },
    },
    concepts: {
      role_qa_manager: {
        title: 'Responsibilities of the QA Manager',
        summary: 'Capacity, budget and people of several teams. Escalates to their VP the cuts that affect risk coverage.',
      },
      risk_priority: {
        title: 'Cutting by risk',
        summary: 'First duplications and the low-risk; the critical and whoever sustains it, last.',
      },
      capacity_plan: {
        title: 'Capacity plan',
        summary: 'Each lever with its saving, its risk and who it affects; with its cost explained and a review date.',
      },
      key_people: {
        title: 'Key people',
        summary: 'Those who sustain the critical risk or a unique capability. Retain them with challenges and commitments that can be kept.',
      },
      honest_comms: {
        title: 'Communicating honestly',
        summary: 'Early, complete, unvarnished and with room for questions. Neither deny nor get ahead.',
      },
      scope_acceptance: {
        title: 'Scope accepted by the business',
        summary: 'What stops being tested is accepted by its owner in writing.',
      },
    },
    seniorTips: [
      "To Sergio: there's an adjustment, no decisions yet and at 16:00 we'll tell everything.",
      'To Raúl: back-office yes, payments no, and why.',
      'Plan: do not replace departures, outsource the back-office, reduce low-risk scope, a single tool and automate cards. Nothing from payments, seniors, performance or training.',
      'To Marta: what stops being tested, what could fail and have her sign it.',
      'To the team: what changes, why, what does not change (nobody loses their job), questions and 1:1.',
      'To Héctor: lead the automation and review his salary at the next window, without promising money.',
    ],
    lessons: {
      priority: {
        question: 'Where do I start cutting?',
        body: `With **what covers the least risk**, not equally across all teams:
1. Duplications with no value (two tools that do the same).
2. The low-risk: outsource or stop testing manually, **with the business informed and in agreement**.
3. Departures that are not replaced, before layoffs.

The critical (customer money, regulator) and the people who sustain it, **last**.`,
      },
      plan: {
        question: 'What is a capacity plan?',
        body: `For each lever: **how much it saves**, **what risk it leaves uncovered** and **who it affects**.

A good plan:
- reaches the target;
- leaves the critical intact;
- keeps the key people;
- says what it costs (less margin) and when it is reviewed.

“20% for each team” is not a plan: it is not deciding.`,
      },
      people: {
        question: 'Who are the key people?',
        body: `Those who sustain the critical risk or a capability nobody else has: whoever knows payments and anti-fraud, or whoever knows how to run load tests before a campaign.

In a cut they are **the first to receive offers**. Retaining them is not always money: a real challenge, visibility and a commitment you can keep. Never promise what you do not have.`,
      },
      comms: {
        question: 'How do I communicate a cut?',
        body: `- **Early:** the rumor always arrives first. If there are no decisions yet, say so and give a date.
- **Complete:** what changes, why, what does not change and how it affects each person.
- **Unvarnished:** it is not “an opportunity”.
- **With room:** open questions and 1:1 with their leads.

Neither deny what the team senses nor get ahead of decisions that have not been made.`,
      },
      scope: {
        question: "If I stop testing something, who do I tell?",
        body: `**Whoever owns the risk**: the business. Explain what stops being tested and what could fail, and have them **accept it in writing**.

If you hide it (“you won't notice anything”), when it fails it will be QA's fault and nobody will have decided anything.`,
      },
      say_no: {
        question: 'The CTO proposes outsourcing everything. What do I do?',
        body: `Separate: **the low-risk yes**, the critical no, and explain it with the **cost of a failure** against the saving.

Closing yourself off to everything (“no way”) leaves you without arguments. Accepting everything (“OK”) shifts the risk to someone who does not know the domain.`,
      },
    },
    quiz: {
      pre: {
        g9pre_priority: {
          question: 'You have to cut 20%. What is most reasonable?',
          options: ['20% less for each team', 'Cut the lowest-risk first and protect the critical', 'Let go of the most expensive', 'Eliminate training'],
          explanation: 'Prioritize by risk.',
        },
        g9pre_plan: {
          question: 'What must each lever of a capacity plan state?',
          options: ['Only how much it saves', 'Who proposed it', 'How much it saves, what risk it leaves uncovered and who it affects', 'When it is applied'],
          explanation: 'Saving, risk and people.',
        },
        g9pre_people: {
          question: 'A key person tells you they have another offer and there is no budget for raises. What do you do?',
          options: ['Match the offer', 'Let them go', 'Promise a raise next year', 'Offer a real challenge and a commitment you can keep'],
          explanation: 'Retain without promising what you do not have.',
        },
        g9pre_comms: {
          question: 'The cuts rumor is going around and there are no decisions yet. What do you tell the team?',
          options: ['That there is an adjustment, that there are no decisions yet and when you will tell them', 'That there is nothing', 'Nothing', 'What you think will happen'],
          explanation: 'Honesty and a date.',
        },
        g9pre_scope: {
          question: 'You are going to stop manually testing some low-risk apps. Who must accept it?',
          options: ['Nobody', 'The business, in writing', 'The QA team', 'The vendor'],
          explanation: 'The risk owner.',
        },
        g9pre_out: {
          question: 'Which regression would you outsource first?',
          options: ['Payments', 'Anti-fraud', 'The low-risk internal back-office', 'All of it'],
          explanation: 'The low-risk, and the people to the critical.',
        },
      },
      post: {
        g9post_priority: {
          question: 'Why is “20% for each team” a bad idea?',
          options: ['Because it is unfair to the leads', 'Because it is slow', 'Because it saves little', 'Because the critical loses the same as what does not matter'],
          explanation: 'It does not prioritize by risk.',
        },
        g9post_plan: {
          question: 'Which lever saves without touching risk or people?',
          options: ['Keeping one of two duplicated tools', 'Closing performance', 'Letting go of the seniors', 'Outsourcing payments'],
          explanation: 'Duplication with no value.',
        },
        g9post_people: {
          question: 'Why not close performance before the campaigns?',
          options: ['Because Javier is new', 'Because a critical need arrives in three months and nobody else can do it', 'Because it is expensive', 'It makes no difference'],
          explanation: 'A unique capability for a near risk.',
        },
        g9post_comms: {
          question: 'What must NOT be missing when announcing a cut?',
          options: ['That it is an opportunity', 'The budget figures of other areas', 'What changes, why and what does not change', 'An email from People'],
          explanation: 'Complete information.',
        },
        g9post_scope: {
          question: 'The business asks what will happen to its releases. What do you answer?',
          options: ['“You won’t notice anything”', '“Ask management”', '“We’ll see”', 'What stops being tested, what could fail and that they accept it in writing'],
          explanation: 'Transparency with the risk owner.',
        },
        g9post_out: {
          question: 'The CTO wants to outsource all regression. What do you answer?',
          options: ['The low-risk yes; the critical no, with the cost of a failure against the saving', 'Yes', 'No to all', 'Let Procurement decide'],
          explanation: 'Separate by risk.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    laura: 'VP Engineering · your manager',
    raul: 'CTO',
    marta: 'Head of Product',
    sergio: 'QA Lead · Payments · your team',
    hector: 'QA Lead · Cards · your team',
    nerea: 'QA · your area',
    pablo: 'QA · your area',
    lucia: 'QA · your area',
  }),
)
