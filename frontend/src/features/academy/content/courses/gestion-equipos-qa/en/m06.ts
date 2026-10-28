import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m06PrimerEquipo } from '../m06-primer-equipo'
import { missionEn } from './missionEn'
import { FICHA_QA_LEAD_EN } from './shared'

/** Course 4: QA Team Management · Mission 6 — Your first team. English version of ../m06-primer-equipo.ts. */
export const m06PrimerEquipoEn = missionEn(
  m06PrimerEquipo,
  {
    title: 'Your first team',
    subtitle: 'QA Lead: expectations, fair distribution, first 1:1, delegating so they grow and backing your team’s risks.',
    playerRole: 'QA Lead · Payments',
    dayLabel: 'Monday · year 4',
    appLabel: 'Team',
    wikiLabel: 'Wiki · Payments QA',
    verdicts: {
      good: {
        title: 'A team, not five QAs',
        body: 'The release ships with the risk under control, Héctor keeps warning in time, Sergio has his challenge and Lucía gains confidence. Your team works without you having to do everything.',
      },
      ok: {
        title: 'First week survived',
        body: 'You got the day done, but someone on the team will notice in the coming weeks. Check the debrief to see who and why.',
      },
      bad: {
        title: 'A boss, not a Lead',
        body: 'The team does what you say, but stops warning you about risks and stops growing. Replay the mission starting with the role sheet.',
      },
    },
    briefing: {
      title: 'Year 4 · QA Lead of Payments',
      paragraphs: [
        'Four years have passed since your first release. Kobalto now has 20 squads and today you start as QA Lead of Payments, with five people reporting to you. Two of them, Sergio and Héctor, were your colleagues.',
        'Marta, now Head of Product, wants to ship instant transfers on Thursday, and Héctor does not want to sign them off. Sound familiar? Years ago that pressure was put on you. Today it comes from above, and the QA who says “it is not ready” is on your team.',
        'Your job is no longer to test better than anyone, but for your team to be able to do it.',
      ],
      goals: [
        'Read the QA Lead role sheet: what is yours now and what no longer is.',
        'At the first meeting, make clear what to expect from you, without disappearing or controlling everything.',
        'Distribute the sprint in the “Team” app thinking about each person’s strengths, growth and load.',
        'Prepare and hold the first 1:1 with Sergio, who applied for your position.',
        "Back Héctor in front of Marta and take the risk and the options to whoever decides.",
        'Look after whoever is overloaded and whoever is insecure.',
      ],
    },
    scenes: {
      mail_laura: {
        subject: 'Welcome to the QA Lead role',
        body: "Congratulations!\n\nFrom today you lead the Payments QA team: Héctor, Sergio, Lucía, Nerea and Pablo. I left the role sheet in the wiki. In short: you are no longer measured by what you test yourself, but by what the team achieves and how people grow.\n\nThis week: get to know your people, distribute the sprint wisely and hold your first 1:1 with Sergio. You know he also applied for the position.\n\nLaura · QA Manager",
      },
      mail_marta: {
        subject: 'Instant transfers: Thursday it ships, no matter what',
        body: "Hi, and congratulations on the position.\n\nOn Thursday the instant transfers ship: it is committed with management. Héctor has been raising objections and at this point we can't. I'm asking you to rein him in.\n\nSee you at 15:00.\n\nMarta · Head of Product · Payments",
      },
      kickoff: {
        subject: '09:30 · First meeting with your team',
        body: "**Laura:** I officially introduce you to your new QA Lead. I'll leave you with them.\n\n**Héctor:** Well… so what changes now?",
        choices: {
          expectations: {
            text: "My job changes: now it is for you to be able to do yours well. Removing blockers, distributing with judgement, giving you feedback and backing you when you warn about a risk. This week I'll have a 1:1 with each of you. Tell me what works and what doesn't.",
            reply: "Works for me. I'm going to ask you to back risks sooner than you think 😅",
            effects: { 3: { text: 'At your first meeting you made clear what changes: your job is for the team to be able to work.' } },
          },
          same: {
            text: "Nothing, we continue as before: I'm just another member of the team.",
            reply: 'Ah, OK… and who decides then when we disagree?',
            effects: { 2: { text: 'You avoided the role: “I’m just one of you” leaves the team not knowing who decides or what to expect from you.' } },
          },
          control: {
            text: 'From now on everything goes through me: any decision, you consult me first.',
            reply: '…OK.',
            effects: { 4: { text: 'You centralized all decisions: the team stops deciding and you become the bottleneck.' } },
          },
        },
      },
      pablo_overload: {
        body: "Hey, do you have a moment? I'm covering three Cards squads at once and I can't keep up. This month I've already left two stories badly tested. I didn't want to start by complaining to you…",
        choices: {
          act: {
            text: "Thanks for telling me, really: this is how I want it to work. This week I won't give you anything new outside your squads. And I'll take your load data to Laura: three squads for one person is a capacity problem, not yours.",
            reply: "Phew, thanks. I didn't expect you to get it so fast.",
            effects: { 3: { text: 'You listened to Pablo, protected him this week and escalated the capacity to whoever decides it.' } },
          },
          everyone: {
            text: "That's how it is, we're all at full capacity.",
            reply: 'Right…',
            effects: { 1: { text: "You downplayed Pablo's overload: next time he won't warn you." } },
          },
        },
      },
      one2one_sergio: {
        subject: '11:30 · First 1:1 with Sergio',
        body: "**Sergio:** I'll be honest with you: it bothered me that it wasn't me. It's nothing against you, but I don't really know how this is going to go.",
        choices: {
          prepared: {
            text: "Thanks for telling me; I'd rather talk about it than pretend nothing happened. I care that you feel comfortable. What would you like to do this year? And how do you prefer I give you feedback? On my side, this sprint I proposed that you lead the automation of the payments regression: it is the most visible technical project in the area.",
            reply: "OK… that does appeal to me. And I prefer direct feedback, in private. Thanks for not dodging the subject.",
            effects: { 3: { text: 'You prepared the 1:1: you named the situation, asked about his goals and gave him a challenge to match.' } },
          },
          listen: {
            text: 'Thanks for telling me. I prefer to talk about it. What would you need to feel comfortable on the team?',
            reply: "I don't know… something that motivates me, I guess. I'll think about it.",
            effects: { 1: { text: 'You listened to Sergio, but without preparation or anything concrete to offer, the 1:1 was left halfway.' } },
          },
          boss: {
            text: 'I understand, but the decision is made and now I am your boss. I hope you accept it.',
            reply: 'Understood.',
            effects: { 1: { text: 'You answered with hierarchy: Sergio complies, but disconnects.' } },
          },
        },
      },
      hector_risk: {
        body: "I told you at the meeting 😅. Instant transfers: with amounts over €10,000 the anti-fraud doesn't trigger in 1 of every 20 cases. I have it documented. I'm not signing it off for Thursday.",
        choices: {
          back: {
            text: "Thanks for warning early, that's exactly what I need. At 15:00 we go to Marta together: you tell the data and I back you. We go with options, not a “no”: the decision to ship is hers, but with all the information.",
            reply: "Perfect. I'll send you the report with the 20 cases and the amounts.",
            effects: { 3: { text: 'You backed Héctor and gave him visibility: he presents his data, you support him and bring options.' } },
          },
          sign: {
            text: "Let's not block: sign it off for Thursday and we'll look at it afterwards.",
            reply: 'Seriously? I thought you of all people would understand this.',
            effects: { 2: { text: 'You asked Héctor to sign off something with a known risk: it is the same pressure you received as a manual QA, now passed downward.' } },
          },
          takeover: {
            text: "Leave it to me, I'll talk to Marta. You keep testing.",
            reply: "OK… although I'd have liked to tell it myself.",
            effects: { 2: { text: 'You took the risk to Marta on your own: you protect him, but you take away the visibility he wanted.' } },
          },
        },
      },
      marta_meeting: {
        subject: "15:00 · Marta and Raúl: Thursday's release",
        body: "**Marta:** I'll be direct: Héctor is blocking Thursday. I need you to rein him in.",
        choices: {
          options: {
            text: "Héctor is not blocking: he is reporting a risk, and he did it in time. Héctor, tell it. (…) There are two options: ship on Thursday with transfers over €10,000 disabled until the fix, or delay a week. I recommend the first. The decision is yours.",
            reply: "With a €10,000 limit we ship on Thursday anyway. Well spotted, Héctor. Decided.",
            effects: { 3: { text: 'You defended Héctor in front of management, gave him the floor and brought options to whoever decides.' } },
          },
          options_alone: {
            text: "Héctor is not blocking: he is reporting a risk. Above €10,000 the anti-fraud fails in 1 of every 20 cases. Options: ship with that amount disabled or delay a week. I recommend the first. The decision is yours.",
            reply: 'With a €10,000 limit we ship on Thursday anyway. Decided.',
            effects: { 2: { text: 'You brought options to whoever decides, but you told what Héctor had discovered yourself.' } },
          },
          side_marta: {
            text: "You're right, Marta. I'll talk to him so he signs it.",
            reply: 'Thanks, I knew I could count on you.',
            effects: { 2: { text: 'You overruled your QA in front of management and hid a known risk.' } },
          },
          gate: {
            text: "If my team says it's not ready, it doesn't ship. Period.",
            reply: "QA doesn't decide what ships, it informs. And without options you don't help me decide.",
            effects: { 1: { text: 'You turned QA into the gate: backing your team is not deciding for the business.' } },
          },
        },
      },
      lucia_doubt: {
        body: "Can I ask you something? You gave me the savings screen and I'm afraid of failing again like last month…",
        choices: {
          support: {
            text: "I gave it to you on purpose: it's low risk, perfect for gaining confidence. Tomorrow spend 30 minutes with Héctor on the approach and then you go. On Thursday we review it together. And if you make a mistake, we look at it and learn: that's what it's for.",
            reply: 'OK. That leaves me much calmer 😊',
            effects: { 2: { text: 'You delegated to Lucía with concrete support: someone to start with, a moment to review and permission to make mistakes.' } },
          },
          doit: {
            text: "Don't worry, if you want I'll do it.",
            reply: 'Ah… OK. Thanks.',
            effects: { 1: { text: 'You took the task from Lucía: you spare her the fear, but also the chance to grow.' } },
          },
          cheer: {
            text: 'You can do it! Cheer up.',
            reply: 'Thanks…',
            effects: { 0: { text: 'You encouraged Lucía, but gave no concrete support.' } },
          },
        },
      },
      reparto_ok: {
        body: "I saw the sprint distribution: each task to whoever fits best and thinking about how each person grows. That's how you lead.",
      },
      reparto_gaps: {
        body: "I saw the distribution. Careful: some task doesn't fit the person, their moment or what you have to do now as a Lead.",
      },
      one2one_ok: {
        body: 'Well prepared, the 1:1 with Sergio: talking about the uncomfortable thing, about his goals and about what he needs from you.',
      },
      closing: {
        subject: '17:00 · Coffee with Laura (now, your manager)',
        body: '**Laura:** First day as a Lead. What was hardest?',
        choices: {
          lesson: {
            text: "Letting go: not taking the hard stuff myself and letting each one carry their own with support. And understanding that backing Héctor wasn't blocking the release, but taking his risk to whoever decides. Years ago I was in his place.",
            reply: "That's it. Your job is no longer to be the best QA, but for your team to be.",
          },
          doer: {
            text: 'That I would go faster doing everything myself.',
            reply: 'Today, yes. In three months you would have a team that does not know how to do anything without you. Check the debrief.',
            effects: { 0: { text: 'You kept “I’ll do it myself”: it is the most common trap of the first year as a Lead.' } },
          },
        },
      },
    },
    docs: {
      ficha_lead: FICHA_QA_LEAD_EN,
      primer_1a1: {
        title: 'Guide: your first 1:1 with each person',
        updatedLabel: 'Laura Méndez · QA Manager',
        body: `## What it is for
The 1:1 is the other person's space, not your follow-up meeting.

## In the first one
- Ask what motivates them and where they want to grow.
- Agree how you will give each other feedback.
- Ask what they need from you.
- If something is uncomfortable (someone who applied for your position, a recent conflict), name it yourself. Ignoring it does not make it go away.

## Avoid
- Going over tasks: that is what the board and the daily are for.
- Asking for opinions about other colleagues.
- Using hierarchy to close a difficult conversation.`,
      },
    },
    bugs: {
      'C-ANTIFRAUDE': {
        title: 'Transfers over €10,000 ship without anti-fraud: fraud in the first week',
        explanation: 'The risk Héctor saw did not reach whoever decides with options, or was covered up so as not to “block”.',
        technique: 'The Lead backs their QA and takes the risk and the options to the business owner.',
      },
      'C-SILENCIO': {
        title: 'Héctor stops warning about risks: “why, if they don’t back me”',
        explanation: "If a QA warns about a risk and their Lead doesn't support them, the team learns to stay quiet.",
        technique: 'Back your team when they warn in time.',
      },
      'C-SERGIO': {
        title: 'Sergio asks to change teams after two months',
        explanation: 'A former colleague who applied for the position needs it to be talked about and a challenge to match.',
        technique: 'Prepared first 1:1: name the uncomfortable thing, his goals, what he needs.',
      },
      'C-REPARTO': {
        title: 'Nobody grows and the team depends on you for everything',
        explanation: 'Tasks to the wrong person, the critical to the junior or the hard to you: the team does not learn.',
        technique: 'Delegate according to strengths, growth and load.',
      },
      'C-PABLO': {
        title: 'Pablo burns out and leaves Kobalto',
        explanation: 'Three squads for one person was a capacity problem that nobody escalated.',
        technique: 'Listen to the overload and escalate the capacity with data.',
      },
      'C-LUCIA': {
        title: "Lucía stops asking and makes mistakes from not daring",
        explanation: 'Delegating without support, or taking the task away, leaves her just as insecure.',
        technique: 'Delegate with support: who to start with, when to review and permission to make mistakes.',
      },
    },
    prevention: {
      title: 'Your first months as a Lead',
      intro: "Each decision today with a person on your team shows in the following weeks.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Risk taken to whoever decides', explanation: "Héctor wasn't blocking: he was informing. Options and recommendation, and the business decides." },
        1: { label: 'Your team knows you back them', explanation: 'You supported Héctor without overruling him or asking him to sign.' },
        2: { label: 'First 1:1 with Sergio well handled', explanation: 'You named the uncomfortable thing, asked about his goals and gave him a visible challenge.' },
        3: { label: 'Distribution that makes people grow', explanation: 'Each task to whoever fits best; neither the junior with the critical, nor you with the hard, nor more load on someone who cannot keep up.' },
        4: { label: 'Capacity escalated', explanation: 'You protected Pablo this week and took the data to your QA Manager.' },
        5: { label: 'Delegating with support', explanation: 'Lucía starts with Héctor, you review together on Thursday and she can make mistakes.' },
      },
    },
    concepts: {
      role_qa_lead: {
        title: 'Responsibilities of the QA Lead',
        summary: "Owns the team's people, the distribution and the feedback. Decides who takes what and how the team works. Does not decide whether a business risk is accepted nor headcount. Is no longer the best QA on the team.",
      },
      delegate_grow: {
        title: 'Delegating so they grow',
        summary: 'Each task according to strengths, growth and load. The critical to whoever knows most; controlled risk to whoever is learning; nothing new to whoever cannot keep up. Delegate with support, not let go.',
      },
      first_one_on_one: {
        title: 'The first 1:1',
        summary: "It is the other person's space: motivation, goals, how to give feedback and what they need from you. The uncomfortable is named.",
      },
      back_your_team: {
        title: 'Backing your team',
        summary: 'When someone warns about a risk in time, you support them and give them visibility. If you overrule them, the team learns to stay quiet.',
      },
      risk_ownership_lead: {
        title: 'The Lead and the risk decision',
        summary: 'Neither “sign it” nor “if QA says no, it does not ship”: you take the risk, the options and a recommendation to whoever decides.',
      },
      capacity: {
        title: 'Capacity and overload',
        summary: "Sustained overload is a capacity problem, not the person's. The Lead protects in the short term and escalates with data.",
      },
    },
    seniorTips: [
      'First meeting: what changes (your job is for the team to be able to work) and a 1:1 with each one this week.',
      'Distribution: transfers → Héctor; automation → Sergio; savings screen → Lucía; performance → Nerea; Cards criteria → Pablo. Nothing for you.',
      'Prepare the 1:1 with Sergio: the fact that he applied for the position, his goals, how he wants feedback and what he needs from you.',
      'To Pablo: thanks for warning, nothing new this week and you take the data to Laura.',
      'To Héctor: thanks, you go together to Marta, he tells the data and you back him.',
      'With Marta: Héctor informs, he does not block; options (€10,000 limit or delay) and the business decides.',
      'To Lucía: low risk on purpose, she starts with Héctor and you review together.',
    ],
    lessons: {
      role: {
        question: 'What really changes when moving from QA to QA Lead?',
        body: `**Before** you were measured by what you tested yourself. **Now**, by what your team achieves and by how people grow.

It is yours:
- the distribution of work;
- the 1:1s and feedback;
- removing blockers;
- backing your team.

It is no longer yours:
- taking the hard stuff “because I do it faster”;
- deciding whether the business accepts a risk;
- headcount: your QA Manager decides that.

The two traps of the first month: acting as if nothing had changed (“I'm just one of you”) or controlling everything (“everything goes through me”).`,
      },
      delegate: {
        question: "How do I distribute the team's work?",
        body: `Look at three things for each person:
1. **Strengths:** the critical to whoever knows most.
2. **Growth:** what someone wants to learn, if the risk allows it.
3. **Load and moment:** nothing new to whoever cannot keep up; controlled risk to whoever is insecure.

And delegate **with support**: who to start with, when to review it and permission to make mistakes. Delegating is not letting go nor getting the task off your plate.`,
      },
      one2one: {
        question: 'What does a good first 1:1 look like?',
        body: `It is **their** half hour, not your follow-up meeting:
- What motivates you? Where do you want to grow?
- How do you prefer I give you feedback?
- What do you need from me?

If something is uncomfortable (someone applied for your position, a recent conflict), **name it yourself**. Pretending nothing happened or pulling rank only makes it worse.`,
      },
      peers: {
        question: 'Two of my team were my colleagues. How do I handle it?',
        body: `- **Don't pretend nothing changes:** it does, and you both know it.
- **Don't impose hierarchy:** the trust you had is your best asset.
- **Talk about expectations:** what you expect, what each one expects from you, and how you will give each other feedback.
- If one applied for the position, offer a visible challenge to match. It is not a consolation prize: it is making use of their talent.`,
      },
      back: {
        question: "My QA doesn't want to sign off and product asks me to “rein them in”.",
        body: `It is the same scene you lived as a manual QA, now from above.
1. **Thank them** for warning in time: it is what you want from your team.
2. **Review** the data and the risk with your QA.
3. **Go with your QA**: let them tell the data and you back them.
4. **Bring options and a recommendation**: cut scope, disable or delay.
5. **The business decides.**

If you ask them to sign, or overrule them in front of product, your team learns to stay quiet about risks.`,
      },
      capacity: {
        question: "Someone on my team tells me they can't keep up. What do I do?",
        body: `1. **Thank them** for telling you: it is the information you need most.
2. **Protect in the short term:** nothing new this week and take away what you can.
3. **Escalate with data** to your QA Manager: load, squads, what is being left untested.

“We're all at full capacity” is the fastest way to lose a good person.`,
      },
    },
    quiz: {
      pre: {
        g6pre_role: {
          question: 'You have just moved up to QA Lead. What are you measured by now?',
          options: ['By the bugs you find yourself', 'By what your team achieves and how people grow', 'By the hours you work', 'By the tests you automate'],
          explanation: 'The Lead is measured by the team, not by individual output.',
        },
        g6pre_delegate: {
          question: 'You have a critical task for Thursday and an insecure junior QA. Who do you give it to?',
          options: ['The junior, so she learns', 'You do it, you are faster', 'Whoever has the least work, whoever it is', 'Whoever knows the domain best'],
          explanation: 'The critical to whoever knows most; to the junior, something with controlled risk.',
        },
        g6pre_one2one: {
          question: 'Which topic is LEAST appropriate for the first 1:1 with someone on your team?',
          options: ['What motivates them', 'How they prefer to receive feedback', 'What they think of their colleagues', 'What they need from you'],
          explanation: 'Asking for opinions about colleagues in the first 1:1 opens the door to gossip.',
        },
        g6pre_back: {
          question: "A QA on your team doesn't want to sign off a release because of a real risk. Product asks you to convince them. What do you do?",
          options: ['You support them and together bring the risk and options to whoever decides', 'You ask them to sign so as not to block', 'You say that if QA says no, it does not ship', 'You talk to product yourself without involving them'],
          explanation: 'Back the team and bring options to whoever decides.',
        },
        g6pre_capacity: {
          question: "Someone on your team covers three squads and tells you they can't keep up. Which answer is better?",
          options: ['“We’re all at full capacity”', '“Do what you can”', 'Protect them this week and escalate the capacity with data to your manager', 'Tell them to organize themselves better'],
          explanation: 'Protect in the short term and escalate capacity to whoever decides it.',
        },
        g6pre_risk: {
          question: 'As QA Lead, do you decide whether a release ships with a known risk?',
          options: ['Yes, it is the Lead’s responsibility', 'No: you bring the risk, the options and a recommendation to whoever decides', 'Only if the risk is high', 'The QA who tested it decides'],
          explanation: 'The Lead informs and recommends; the business owner decides.',
        },
      },
      post: {
        g6post_role: {
          question: 'At your first meeting as a Lead, which message is better?',
          options: ['“My job is for you to be able to do yours well: blockers, distribution, feedback and backing”', '“We continue as before, I’m just another member”', '“Everything goes through me from now on”', '“We’ll talk later”'],
          explanation: 'Neither disappearing nor controlling everything: explain what changes and what to expect from you.',
        },
        g6post_delegate: {
          question: 'What is “delegating with support”?',
          options: ['Giving the task and disappearing', 'Taking the task away if they have doubts', 'Giving the task saying who to start with, when to review it and that they can make mistakes', 'Reviewing every step they take'],
          explanation: 'Delegating with support is not letting go, nor doing it yourself, nor micromanaging.',
        },
        g6post_one2one: {
          question: 'A former colleague applied for your position. In the first 1:1…',
          options: ['You avoid the subject so as not to make it awkward', 'You remind them you are now their manager', 'You tell them nothing will change', 'You name it, ask about their goals and look for a challenge to match'],
          explanation: 'Name the uncomfortable and align their goals with a visible challenge.',
        },
        g6post_back: {
          question: 'What does your team learn if you overrule, in front of product, a QA who warned about a risk?',
          options: ['To be faster', 'To stay quiet about risks', 'To sign off better', 'Nothing, it is part of the job'],
          explanation: 'If warning in time has no backing, people stop warning.',
        },
        g6post_capacity: {
          question: "A person's sustained overload is…",
          options: ['A capacity problem the Lead must escalate with data', 'A personal organization problem', 'Normal in QA teams', 'Something fixed with overtime'],
          explanation: 'It is capacity: the Lead protects and escalates to whoever decides headcount.',
        },
        g6post_risk: {
          question: 'What do you bring to the meeting with product about a release with a real risk?',
          options: ['A flat “no”', 'A signature so as not to block', 'The data, options (cut, disable or delay) and a recommendation', 'Nothing: let the QA decide'],
          explanation: 'Data, options and recommendation; the business decides.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    laura: 'QA Manager · your manager',
    marta: 'Head of Product · Payments',
    raul: 'Engineering Director',
    hector: 'QA · Payments · your team',
    sergio: 'QA Automation · your team',
    lucia: 'Junior QA · your team',
    nerea: 'QA · Payments · your team',
    pablo: 'QA · Cards · your team',
  }),
)
