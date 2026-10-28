import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m03Junior } from '../m03-junior'
import { missionEn } from './missionEn'
import { FICHA_QA_ENGINEER_EN } from './shared'

/** Course 4: QA Team Management · Mission 3 — The junior. English version of ../m03-junior.ts. */
export const m03JuniorEn = missionEn(
  m03Junior,
  {
    title: 'The junior',
    subtitle: 'QA Engineer: mentor without doing their job, review code with tact, mistakes without culprits and tell their Lead what you see.',
    playerRole: 'QA Engineer · Cards squad',
    dayLabel: 'Monday · year 2',
    appLabel: 'Review',
    wikiLabel: 'Wiki · Cards squad',
    verdicts: {
      good: {
        title: 'A junior who dares',
        body: "Lucía learns the why of each change, reports her mistakes within minutes and the system no longer lets anyone aim at production by accident. And Laura knows how to help her.",
      },
      ok: {
        title: 'A good mentor, halfway',
        body: "Lucía moves forward, but something from today will cost her: a harsh review, a badly handled mistake or a conversation you didn't have. Check the debrief.",
      },
      bad: {
        title: "A junior who doesn't ask",
        body: 'Between dry reviews, blame and shortcuts, Lucía learns not to ask and to hide her mistakes. Replay the mission reading the mentoring guide first.',
      },
    },
    briefing: {
      title: "Year 2 · Lucía's mentor",
      paragraphs: [
        "You are still a QA Engineer on Cards. Today Lucía arrives, Kobalto's first junior QA, and Laura asks you to be her technical mentor.",
        "You are not her boss: Laura is. Your role is for Lucía to learn, find her place and dare to ask and to make mistakes.",
        'Today it is about welcoming her and reviewing her first pull request. And something will go wrong.',
      ],
      goals: [
        'Read the role sheet and the mentoring guide.',
        'Give Lucía a concrete plan for her first week.',
        'Review her first PR in the “Review” app: what lets bugs through, with the why; your tastes, as optional; what is well done, acknowledged.',
        'If she makes a mistake, handle it without culprits and fix the system.',
        "Tell Laura what you see, without acting as the boss.",
      ],
    },
    tools: {
      2: { lockedMessage: "Lucía hasn't uploaded her first PR yet. It will arrive mid-morning." },
    },
    scenes: {
      mail_laura: {
        subject: "Lucía starts today: you'll be her mentor",
        body: "Hi:\n\nToday Lucía joins us, our first junior QA. I am her manager, but I want you to be her technical mentor: to help her find her bearings, learn to automate and feel safe to ask.\n\nAn important nuance: mentoring is not being her boss nor doing her job. I left a guide in the wiki.\n\nLaura",
      },
      welcome: {
        subject: '09:30 · Welcome coffee with Lucía',
        body: "**Lucía:** Hi! I'm a bit nervous, to be honest. Where do I start?",
        choices: {
          plan: {
            text: "It's normal to be nervous. This week: today the environment with me; tomorrow a small but real task, the statement tests, and I review your first PR. Ask anything you want: there are no silly questions here, and I ask too.",
            reply: 'Phew, that helps. Thanks 😊',
            effects: { 3: { text: 'You gave Lucía a concrete plan: accompanied environment, a small real task, review and permission to ask.' } },
          },
          wiki: {
            text: "Here's the wiki. Read all of it this week and then tell me.",
            reply: 'OK… all of it?',
            effects: { 1: { text: 'You sent Lucía to read the wiki alone: onboarding without practice or company is slow and lonely.' } },
          },
          watch: {
            text: 'For now sit with me and watch how I work for a couple of weeks.',
            reply: 'OK.',
            effects: { 0: { text: 'You proposed watching: she learns something, but without a task of her own she takes longer to become autonomous.' } },
          },
        },
      },
      pr_ready: {
        body: "I uploaded my first PR! Monthly statement tests (PR #482). It's in the “Review” app. Be honest, but… be kind 😅",
      },
      pr_thanks: {
        body: "Thanks for the review! I didn't know about retry until or about creating the account per test. I'm changing it now.",
        onDeliver: { 1: { text: 'Your review explained the why, with suggestions and without taking the work from her: Lucía learned and fixes it herself.' } },
      },
      pr_hurt: {
        body: "OK… I saw the review. Sorry for the mistakes.",
        onDeliver: { 1: { text: 'Your review was a wall: dry comments or changes made by you. Lucía does not learn the why and will ask for fewer reviews.' } },
      },
      pr_good: {
        body: "I read your review of Lucía's PR. What blocks, with the why, the quirks marked as optional and a “well done” where it was due. That's how you teach.",
      },
      prod_alert: {
        body: "🚨 Someone launched 5,000 requests against the PRODUCTION API from the QA runner. I've already cut it off, but the security alert went off. Is it yours?",
      },
      lucia_mistake: {
        body: "I think it was me 😰. I was testing the statement load script and the default configuration pointed to production. I didn't notice. I'm so sorry…",
        choices: {
          blameless: {
            text: "Thanks for telling us so fast: that is the most important thing. Breathe. We stop the script, confirm it to Iván and then see why it was so easy to launch against production. That is a failure of the system, not just yours.",
            reply: 'OK… thanks. I thought you were going to fire me 😅',
            effects: { 3: { text: 'You thanked Lucía for reporting quickly and put the focus on the system, not on blaming her.' } },
          },
          blame: {
            text: "How could you? You have to be more careful, this is serious.",
            reply: 'I know… sorry.',
            effects: { 1: { text: 'You blamed Lucía: next time she makes a mistake, she will think twice before saying so.' } },
          },
          cover: {
            text: "Don't worry, I'll tell Iván it was me and it's fine.",
            reply: 'Really? Thanks…',
            effects: { 2: { text: 'You took the blame yourself to protect her: nobody learns what happened and the system flaw is still there.' } },
          },
        },
      },
      postmortem: {
        subject: '15:00 · Postmortem: load against production',
        body: "**Iván:** Let's review what happened and how to prevent it from happening again.",
        choices: {
          system: {
            text: "Lucía, will you tell us the sequence? (…) Thanks. What failed is that the script's default configuration pointed to production and that the QA runner had production credentials. Actions: staging by default; production credentials only in a pipeline with approval; and a warning if someone targets production. Lucía, will you take care of the warning?",
            reply: 'I will. And thanks for letting me tell it.',
            effects: { 3: { text: 'Blameless postmortem: Lucía told the sequence, the system was fixed and she takes part in the solution.' } },
          },
          person: {
            text: "Lucía made a mistake and I already told her to be more careful. I don't think anything more is needed.",
            reply: 'And if tomorrow it happens to someone else? The script still points to production by default.',
            effects: { 1: { text: 'You closed the postmortem with “be more careful”: the system that allowed the error is unchanged.' } },
          },
          mine: {
            text: "It was my doing, I launched the script. It's already fixed.",
            reply: 'OK… and what exactly did you fix?',
            effects: { 1: { text: 'You kept the version that it was you: the postmortem could not understand what really happened.' } },
          },
        },
      },
      laura_asks: {
        subject: '16:00 · Laura: how do you see Lucía?',
        body: "**Laura:** You have her closer than I do. How do you see her after this week and today's scare?",
        choices: {
          facts: {
            text: "She learns fast, she's meticulous and today she reported the mistake within five minutes, which is what I value most. She finds it hard to ask and to set up environments. I think small, clear tasks and more pair work for a few weeks would help her. Her evaluation is yours: I tell you what I see.",
            reply: 'Perfect, that helps me a lot. I’ll note the pair work.',
            effects: { 3: { text: 'You gave Laura facts, strengths, needs and a proposal, and left the evaluation to her.' } },
          },
          judge: {
            text: "She's not ready. I'd take her off the squad.",
            reply: "I'll decide that with more information. What are you basing it on, apart from today?",
            effects: { 1: { text: 'You stepped out of your mentor role and judged Lucía for one mistake: evaluating is her manager’s job.' } },
          },
          fine: {
            text: 'Fine, all good.',
            reply: "Mmm, OK. If you see anything, tell me.",
            effects: { 0: { text: 'You did not give Laura the information you had: it is hard for her to help Lucía without it.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** How was your first time as a mentor?',
        choices: {
          lesson: {
            text: "That mentoring is accompanying without doing her job: a real task, reviews that explain the why, a mistake handled without blame and telling you what I see without acting as the boss.",
            reply: 'Exactly. Many of the Leads I know started like this, mentoring.',
          },
          faster: {
            text: 'That I would go faster doing her tasks myself.',
            reply: 'Today, yes. In six months you would have double the work and a junior who does not know how to do it.',
            effects: { 0: { text: 'You kept “I’ll do it myself”: the shortcut that stops the team from growing.' } },
          },
        },
      },
    },
    docs: {
      ficha_engineer: FICHA_QA_ENGINEER_EN,
      mentoria: {
        title: 'Technical mentoring guide',
        updatedLabel: 'Laura Méndez · QA Lead',
        body: `## What mentoring is
- Accompanying someone to learn the trade: you teach them, review their work and give them confidence.
- It is **not** being their boss (that is their Lead) nor doing their job.

## First week
- Environment with company, a small real task, and a review with time to explain.
- Make it clear that asking is normal.

## Reviewing the code of someone just starting
- What lets bugs through: blocking, with the why and a suggestion.
- Your tastes: “nit (optional)” or nothing.
- What is well done: say so.
- Don't fix their branch yourself: that way they don't learn.

## When they make a mistake
- Thank them for saying it early.
- Ask what failed in the system that allowed it, not who.

## With their Lead
- Tell them what you see (facts, strengths, needs). The evaluation is theirs.`,
      },
    },
    bugs: {
      'C-EXTRACTO': {
        title: 'A statement with wrongly calculated amounts reaches production: the test only checked the 200',
        explanation: "The review did not detect that Lucía's test did not check the content.",
        technique: 'In review, what lets bugs through is blocking.',
      },
      'C-REPITE': {
        title: 'A month later, another script launches load against production again',
        explanation: 'The error was treated as a personal slip and the system that allowed it was not corrected.',
        technique: 'Blameless postmortem: what allowed the error and what we change.',
      },
      'C-ESCONDE': {
        title: 'Next time Lucía makes a mistake, it takes her two days to say so',
        explanation: 'If making mistakes brings blame (or someone takes the blame for you), people learn to hide errors.',
        technique: 'Thank people for reporting early and kind reviews.',
      },
      'C-LENTA': {
        title: 'Lucía takes three months to become autonomous',
        explanation: 'Without a concrete plan and a real task from the start, onboarding drags on.',
        technique: 'Onboarding with accompanied practice and a small, real task.',
      },
      'C-A-CIEGAS': {
        title: 'Laura evaluates Lucía without the information you had',
        explanation: "The mentor sees the day to day; if they don't tell it (or judge instead of telling), their Lead decides blind.",
        technique: 'Tell facts, strengths and needs; the evaluation is the Lead’s.',
      },
    },
    prevention: {
      title: "Lucía's first months",
      intro: 'How you accompanied her today decides how she grows.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'The weak test, caught in review', explanation: 'Only checking the 200 let an empty or wrongly calculated statement through.' },
        1: { label: 'System fixed', explanation: 'Staging by default; production credentials only with approval; a warning if production is targeted.' },
        2: { label: 'Lucía dares to make mistakes', explanation: 'A kind review and a mistake handled without blame.' },
        3: { label: 'Onboarding with practice', explanation: 'Environment with company, small real task, and review.' },
        4: { label: 'Her Lead has the information', explanation: 'Facts, strengths, needs and a proposal, without judging.' },
      },
    },
    concepts: {
      role_qa_engineer: {
        title: 'Responsibilities of the QA Engineer',
        summary: "Owns the squad's automation and helps others write good tests. Mentoring is part of the role; evaluating people is not.",
      },
      onboarding: {
        title: 'A good onboarding',
        summary: 'Accompanied environment, a small real task from the start, a review with time and explicit permission to ask.',
      },
      code_review_kind: {
        title: 'Reviewing code to teach',
        summary: 'What lets bugs through is blocking, with the why and a suggestion; tastes, optional; what is well done, acknowledged. Without fixing it for the other person.',
      },
      blameless: {
        title: 'Mistakes without culprits',
        summary: 'Thank people for reporting early, understand the sequence and fix what allowed the error. “Be more careful” changes nothing; neither does taking the blame for someone else.',
      },
      mentor_not_boss: {
        title: 'Mentor, not boss',
        summary: 'The mentor accompanies and tells what they see; the evaluation and decisions about the person belong to their manager.',
      },
    },
    seniorTips: [
      'Welcome: environment with you today, tomorrow the statement tests and PR review. Asking is normal.',
      'PR: blocks 1, 2 and 3 blocking with the why (only the 200, shared account, fixed wait); 4 and 5 as “nit” or nothing; the 6th, acknowledge it.',
      'Never “This is wrong.” nor fix her branch yourself.',
      'Production mistake: thanks for reporting, you stop the script and the system is reviewed.',
      'Postmortem: let her tell it, fix the default configuration and credentials, and she takes part in the solution.',
      'To Laura: facts, strengths, needs and a proposal. Evaluating is her thing.',
    ],
    lessons: {
      mentor: {
        question: 'How is being a mentor different from being her boss?',
        body: `**Mentor:**
- you teach the trade;
- you review her work;
- you give confidence;
- you tell what you see.

**Her Lead (her boss):**
- distributes the work;
- evaluates;
- decides about her career.

If you judge (“she's not ready”) or decide for her, you step out of the role. And if you do her job, you don't help her either: she doesn't learn.`,
      },
      onboarding: {
        question: 'What does a good first week look like for a junior?',
        body: `1. **Day 1:** the environment, with you next to her.
2. **Day 2:** a **small but real** task, one that reaches production.
3. **A review with time** to explain the why.
4. **Explicit permission to ask:** “there are no silly questions here”.

Reading the whole wiki alone or spending weeks watching you work doesn't teach as much as doing something real with support.`,
      },
      review: {
        question: "How do I review the code of someone who's just starting?",
        body: `Separate three things:
- **What lets bugs through or breaks other things:** blocking, with **the why** and **a suggestion**.
- **Your tastes** (names, style): “nit (optional)” or nothing.
- **What is good:** say so. That way she knows what to repeat.

Avoid “This is wrong.” with no explanation. And don't fix her branch yourself: you take away exactly what she had to learn.`,
      },
      blameless: {
        question: 'The junior launched something against production by mistake. What do I do?',
        body: `1. **Thank her for saying it early:** it is the most valuable thing.
2. **Contain the problem:** stop, notify whoever needs to know.
3. **Blameless postmortem.** The question is not “who”, but “what allowed it to happen”. For example: a dangerous default configuration, or credentials where they shouldn't be.
4. **Have her take part in the solution.**

“Be more careful” changes nothing. And taking the blame yourself doesn't either: nobody learns and the system stays the same.`,
      },
      lead: {
        question: 'Her Lead asks me how the junior is doing. What do I say?',
        body: `What you see, with facts:
- **Strengths:** “she learns fast, she's meticulous”.
- **Where she struggles:** “asking, setting up environments”.
- **What would help her:** “small, clear tasks, more pair work”.

Neither “all good” so as not to complicate things, nor “I would take her off the squad”. The first leaves her Lead without information; the second is their decision, not yours.`,
      },
    },
    quiz: {
      pre: {
        g3pre_onboarding: {
          question: 'A junior QA arrives. Which first week helps her most?',
          options: ['Reading the whole wiki alone', 'Watching how you work for two weeks', 'Environment with company, a small real task, and a review', 'A critical task so she proves herself'],
          explanation: 'Real practice, accompanied and with review.',
        },
        g3pre_review: {
          question: "In a junior's PR, a test only checks the 200 code. What comment do you leave?",
          options: ['“This is wrong.”', "You fix it on her branch", 'Nothing, she will learn', 'Blocking: why it lets bugs through and a suggestion'],
          explanation: 'What lets bugs through is blocking, with the why and a suggestion.',
        },
        g3pre_nit: {
          question: 'A variable is called “x” and you would name it differently. What do you do?',
          options: ['Block the PR until she changes it', 'A “nit (optional)” or nothing', 'Change it yourself', '“This is wrong.”'],
          explanation: 'Style tastes do not block.',
        },
        g3pre_blameless: {
          question: 'The junior accidentally launches a load test against production and tells you right away. What comes first?',
          options: ['Thank her for reporting, contain it and then see what allowed the error', 'Tell her to be more careful', 'Say it was you', 'Escalate it to her Lead as misconduct'],
          explanation: 'Reporting early is appreciated; then the system is fixed.',
        },
        g3pre_mentor: {
          question: 'You are the mentor of a junior. What is NOT yours?',
          options: ['Reviewing her code', 'Teaching her the trade', 'Evaluating her performance and deciding whether she stays on the squad', 'Telling her Lead what you see'],
          explanation: 'Evaluating and deciding belongs to her manager.',
        },
        g3pre_role: {
          question: 'Why is mentoring part of the QA Engineer role?',
          options: ["It isn't", "Because helping others write good tests multiplies the team's quality", 'Because it means less work for them', 'Because HR asks for it'],
          explanation: "The QA Engineer improves the team's quality, not just their own.",
        },
      },
      post: {
        g3post_onboarding: {
          question: 'Which phrase helps a new person ask the most?',
          options: ['“Read the documentation before asking”', '“Ask only if it is urgent”', '“You’ll figure it out”', '“There are no silly questions here, and I ask too”'],
          explanation: 'Giving explicit permission to ask.',
        },
        g3post_review: {
          question: "Why shouldn't you fix the junior's code on her branch yourself?",
          options: ['Because you take away exactly what she had to learn', 'Because it takes you longer', 'Because it cannot be done', 'Because it is rude'],
          explanation: 'Reviewing is teaching: she fixes it herself with your explanation.',
        },
        g3post_praise: {
          question: 'In the PR there is a very well done negative case. What do you do?',
          options: ['Nothing: the good is not commented on', 'Acknowledge it in a comment', 'Change it to your style', 'Ask for more cases like that'],
          explanation: 'Acknowledging what is well done tells her what to repeat.',
        },
        g3post_blameless: {
          question: 'In a blameless postmortem, which question guides the conversation?',
          options: ['Who was it?', 'How do we keep it from being known?', 'What allowed it to happen and what do we change?', 'Who has to apologize?'],
          explanation: 'The focus is on the system, not the person.',
        },
        g3post_cover: {
          question: 'Why is it not a good idea to say the mistake was yours to protect the junior?',
          options: ['Because you could be sanctioned', 'Because nobody learns what happened and the system that allowed it stays the same', "Because it's a lie, though it doesn't matter", 'It is a good idea'],
          explanation: 'Covering it up prevents fixing the system.',
        },
        g3post_mentor: {
          question: 'Her Lead asks you how the junior is doing. Which answer is better?',
          options: ['“All good”', '“I would take her off the squad”', '“Ask her”', 'Facts, strengths, needs and a proposal; the evaluation is theirs'],
          explanation: 'Inform without judging or deciding for her Lead.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    laura: "QA Lead · your manager and Lucía's",
    lucia: 'Junior QA · just arrived',
    diego: 'Backend developer · Cards',
    ivan: 'Platform / DevOps',
  }),
)
