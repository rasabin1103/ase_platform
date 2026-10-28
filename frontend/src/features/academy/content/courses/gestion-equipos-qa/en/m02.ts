import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m02Suite } from '../m02-suite'
import { missionEn } from './missionEn'
import { FICHA_QA_ENGINEER_EN } from './shared'

/** Course 4: QA Team Management · Mission 2 — The suite nobody looks at. English version of ../m02-suite.ts. */
export const m02SuiteEn = missionEn(
  m02Suite,
  {
    title: 'The suite nobody looks at',
    subtitle: 'QA Engineer: understand before deciding, quarantine with an owner, ask for time with data and have each squad look after its tests.',
    playerRole: 'QA Engineer · Cards squad',
    dayLabel: 'Tuesday · year 2',
    appLabel: 'Suite',
    wikiLabel: 'Wiki · Cards squad',
    verdicts: {
      good: {
        title: 'Red means something again',
        body: 'The pipeline goes from 60% to 95% green, the intermittent limit bug is fixed before production and each squad looks after its tests.',
      },
      ok: { title: 'Better than yesterday', body: 'The suite has improved, but something that made it unreliable is still there. Check the debrief to see what.' },
      bad: {
        title: 'Fake green',
        body: 'The pipeline may look better, but it hides problems and still depends on you. Replay the mission investigating before deciding.',
      },
    },
    briefing: {
      title: 'Year 2 · QA Engineer on Cards',
      paragraphs: [
        'A year after your first releases, you have moved into automation: now you are the QA Engineer of the Cards squad.',
        'Your first assignment: the regression pipeline is red 40% of the time, devs merge on red without looking and some are already disabling tests on the sly.',
        "Your role is no longer just testing: it is making sure the team can trust its safety net.",
      ],
      goals: [
        'Read the QA Engineer role sheet.',
        'In the “Suite” app, investigate why each of the eight tests fails before deciding.',
        'Decide with judgement: fix, quarantine with an owner, delete or report a bug.',
        'Ask Marta and Raúl for time with data and a measurable goal.',
        "Don't hide the problems: no loose “skips” and no blind retries.",
        'Get each squad to own its tests.',
      ],
    },
    scenes: {
      mail_laura: {
        subject: 'Your first assignment as QA Engineer',
        body: "Congratulations on the new role!\n\nI left the role sheet in the wiki. Your first assignment is not small: the regression pipeline is red 40% of the time and devs are already merging on red without looking. That way the suite is useless.\n\nYou have the “Suite” app with the eight tests that cause almost all the reds. Before touching anything, understand why each one fails.\n\nLaura",
      },
      diego_skip: {
        body: 'Confession 🙈: last night I added a “skip” to three tests that were blocking my merge. They always fail, right? This way at least we can work.',
        choices: {
          quarantine: {
            text: "I understand the frustration, and thanks for telling me. But a plain “skip” gets forgotten and the test ends up dead. Today I'll look at them: meanwhile, I'll move them to quarantine with a ticket, owner and date. That way they don't block you and they're not lost.",
            reply: 'Sounds fair. I prefer that to going behind everyone’s back.',
            effects: { 3: { text: 'You turned Diego’s “skips” into a quarantine with ticket, owner and date, without scolding him.' } },
          },
          fine: {
            text: 'Well done, they always fail anyway.',
            reply: '😎',
            effects: { 1: { text: 'You approved tests disabled in silence: nobody will look at them again.' } },
          },
          scold: {
            text: "You can't skip tests! Remove them right now.",
            reply: "OK, OK… but then I can't merge anything.",
            effects: { 1: { text: 'You scolded Diego without giving him an alternative: the problem was the suite, not him.' } },
          },
        },
      },
      sergio_retries: {
        body: "Here's a trick: in Payments we put 3 automatic retries on all tests and now the pipeline is always green 😎. Copy it and done.",
        choices: {
          no: {
            text: "Thanks, but retries hide problems: a test that fails 1 in 10 may be catching a real intermittent bug. I'd rather understand why each one fails.",
            reply: "Hmm… truth is in Payments we no longer know which test is fine and which isn't. Tell me what you find.",
            effects: { 2: { text: 'You did not apply retries blindly: artificial green hides intermittent bugs.' } },
          },
          yes: {
            text: 'Great! I will copy it right now.',
            reply: "You'll see how green it gets! 💚",
            effects: { 2: { text: 'You put automatic retries on the whole suite: the pipeline looks green, but it no longer distinguishes an unstable test from an intermittent bug.' } },
          },
        },
      },
      planning: {
        subject: '12:30 · Marta and Raúl: how much time do you need?',
        body: '**Raúl:** We want the pipeline fixed, but the sprint is full of stories.\n\n**Marta:** How much time do you need, and for what exactly?',
        choices: {
          data: {
            text: "Eight tests cause 90% of the reds and I already know why each one fails. I ask for 20% of my time for two sprints, and for each squad to fix its own tests with my help. Measurable goal: pipeline green more than 95% of the time. We review it in two weeks.",
            reply: "With a goal like that, yes. We'll reserve it for you and review it in two weeks.",
            effects: { 3: { text: 'You asked for time with data, a concrete scope and a measurable goal.' } },
          },
          rewrite: {
            text: 'The suite is badly made: I need the whole sprint to rewrite it from scratch.',
            reply: "A whole sprint without stories… no. And who tells me the new one won't end up the same?",
            effects: { 1: { text: 'You asked to rewrite everything without data: expensive, risky and no guarantee that the new one won’t end up the same.' } },
          },
          free: {
            text: "No time needed, I'll fix it in my spare time.",
            reply: "Great, then I won't plan it.",
            effects: { 1: { text: 'You offered to do it “in spare time”: invisible work that nobody plans and that ends up not getting done.' } },
          },
        },
      },
      bug_found: {
        body: "Wow! The concurrent limit test was a real bug: with two simultaneous payments the limit gets skipped. We'll fix it this week. Good thing we didn't silence it.",
        onDeliver: { 3: { text: 'You discovered that an “unstable” test was catching a real intermittent bug and you reported it.' } },
      },
      suite_ok: {
        body: "I saw your decisions about the suite: fix what is worth it, quarantine with an owner for KYC, delete the dead and report the real bug. By the book.",
      },
      suite_gaps: {
        body: "I saw your decisions. Some don't fit the cause: look at which test was hiding a real bug, which one tested something that no longer exists and which one is too valuable to delete.",
      },
      ownership: {
        subject: "15:30 · Session with the squads: whose tests are they?",
        body: "**Diego:** OK, the suite is going to improve. But when a test breaks next week, who fixes it? You?",
        choices: {
          owners: {
            text: "Each test has its owner squad in the report I published. I propose a rule: whoever breaks a test fixes it before merging, and I help you with patterns (waits by condition, own data per test, doubles for external dependencies). If a test is unstable, quarantine with a ticket and date, never a loose “skip”.",
            reply: "Sounds fair. And the patterns thing is great for me, I didn't know how to do waits properly.",
            effects: { 3: { text: 'Each squad became owner of its tests, with clear rules and your help: you stop being the bottleneck.' } },
          },
          mine: {
            text: "I'll take care of all the tests, you focus on coding.",
            reply: 'Perfect! 🙌',
            effects: { 1: { text: 'You kept all the tests: devs stop looking after them and you become the quality bottleneck.' } },
          },
          vague: {
            text: "Well, all of us together, we'll see as we go.",
            reply: "Sure… “all of us together” usually means “nobody”.",
            effects: { 0: { text: 'You left test ownership undefined.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** What are you taking away from your first assignment as QA Engineer?',
        choices: {
          lesson: {
            text: "That a failing test is information, not noise: first understand why, then decide. And that my job is not to maintain all the tests myself, but for the team to trust the suite and know how to look after it.",
            reply: 'Exactly. A suite nobody trusts is worse than having no suite.',
          },
          green: {
            text: 'That the important thing is for the pipeline to be green.',
            reply: 'Green is not the same as reliable. Check the debrief.',
            effects: { 0: { text: 'You kept “that it be green”: the goal is for red to mean something.' } },
          },
        },
      },
    },
    docs: {
      ficha_engineer: FICHA_QA_ENGINEER_EN,
      flaky: {
        title: 'Unstable tests: typical causes and what to do',
        updatedLabel: 'Kobalto QA community',
        body: `## Typical causes
- **Fixed waits** (sleep): they depend on how fast the environment is.
- **Shared data** between tests that step on each other.
- **External dependencies** (providers, sandboxes) that go down.
- **Dates and time zones.**
- **Obsolete tests** of features that no longer exist.
- **A real intermittent product bug:** races, concurrency, caches. It is the case that must never be hidden.

## What to do
- **Fix** if the test adds value and the cause is the test.
- **Quarantine** if it adds value but fixing it is costly: out of the blocking pipeline, but still running, with a ticket, owner and date.
- **Delete** if it tests something that no longer exists or duplicates others without adding value.
- **Report a bug** if what fails is the product.

## What not to do
- Disable in silence (“skip” without a ticket).
- General automatic retries: green stops meaning anything.`,
      },
    },
    bugs: {
      'C-CARRERA': {
        title: 'The race condition in the card limit reaches production: the test that detected it was silenced',
        explanation: 'The “unstable” concurrent limit test was catching a real intermittent bug. With quarantine, deletion, retries or “fixing the test”, it was hidden.',
        technique: 'Investigate the cause before deciding; an intermittent failure can be the product’s.',
      },
      'C-ROJO': {
        title: 'The pipeline is still unreliable and devs still merge without looking at it',
        explanation: 'Decisions that do not tackle each test’s cause, or retries that cover everything.',
        technique: 'Fix, quarantine, delete or report according to each test’s cause.',
      },
      'C-SKIP': {
        title: "Diego's “skips” get forgotten: three dead tests for months",
        explanation: 'A test disabled without a ticket or owner never comes back.',
        technique: 'Quarantine with ticket, owner and date.',
      },
      'C-INVISIBLE': {
        title: 'You spend the sprint fixing tests without anybody planning it or seeing it',
        explanation: 'Without agreed time and a goal, quality work is done on the sly or not done.',
        technique: 'Ask for time with data and a measurable goal.',
      },
      'C-DUENOS': {
        title: 'Every test that breaks falls back on you',
        explanation: 'If QA owns all the tests, the squads stop looking after them.',
        technique: 'Each squad owns its tests; the QA Engineer sets rules and helps.',
      },
    },
    prevention: {
      title: 'Two sprints later',
      intro: 'What you decided today about the suite decides whether the team trusts the pipeline again.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Intermittent bug caught', explanation: "The concurrent limit test wasn't unstable: the product was failing. It was reported and failures weren't covered with retries." },
        1: { label: 'Reliable pipeline', explanation: 'Each test with the decision that fits its cause and no general retries.' },
        2: { label: 'Nothing disabled in silence', explanation: 'The “skips” moved to quarantine with ticket, owner and date.' },
        3: { label: 'Time agreed with data', explanation: '20% for two sprints and a goal: more than 95% green.' },
        4: { label: 'Each squad looks after its tests', explanation: 'Whoever breaks a test fixes it; you set the rules and help.' },
      },
    },
    concepts: {
      role_qa_engineer: {
        title: 'Responsibilities of the QA Engineer',
        summary: "Owns the squad's automation, its tools, data and environments. Decides what to automate and what to do with a test. Does not decide sprint time (negotiates it) nor fix everybody's tests alone.",
      },
      flaky_triage: {
        title: 'Triage of unstable tests',
        summary: 'Cause first, then decision: fix (if it adds value and the test is at fault), quarantine (if it adds value and is expensive), delete (if it adds nothing) or report a bug (if the product fails).',
      },
      quarantine: {
        title: 'Quarantine, not “skip”',
        summary: 'A test leaving the blocking pipeline keeps running, with a ticket, owner and date. Disabling it in silence is burying it.',
      },
      retries_hide: {
        title: 'Retries hide problems',
        summary: 'Retrying every test gives a green that can no longer tell an unstable test from a real intermittent bug.',
      },
      negotiate_capacity: {
        title: 'Asking for time with data',
        summary: 'What causes the problem, how much time, for what and with what measurable goal. Neither “rewrite everything” nor “in my spare time”.',
      },
      test_ownership: {
        title: 'Each squad owns its tests',
        summary: 'Whoever breaks a test fixes it before merging. The QA Engineer sets the rules, teaches patterns and helps, but does not own everything.',
      },
    },
    seniorTips: [
      'To Diego: thanks for telling me; his “skips” move to quarantine with ticket, owner and date.',
      'Investigate the eight tests before deciding anything.',
      'T1, T3, T4 and T6: fix (waits, simulate the provider, own data, time zone). T2: report a bug (the product fails!). T5 and T8: delete. T7: quarantine.',
      'To Sergio: no general retries.',
      'To Marta and Raúl: 8 tests, 90% of the reds, 20% for two sprints and a goal of more than 95% green.',
      'Publish the report with the owner squad of each test and propose “whoever breaks it, fixes it”.',
    ],
    lessons: {
      role: {
        question: 'What changes from manual QA to QA Engineer?',
        body: `You still test, but now you are responsible for the **team's safety net**: the automated suite, its data, its environments and that it is reliable.

**It is yours:**
- deciding what to automate;
- deciding what to do with a test that adds nothing;
- teaching others to write good tests.

**It is not yours:**
- deciding sprint time: it is negotiated;
- owning all the tests: each squad looks after its own.`,
      },
      triage: {
        question: 'A test fails one time in ten. What do I do?',
        body: `First, **why it fails**. Look at the logs of the failures, not just the last one.

Depending on the cause:
- **The test is at fault:** fixed waits, shared data, time zone. If it adds value, **fix it**.
- **It depends on something external:** simulate it in the pipeline and keep the real check separate.
- **It adds value, but fixing it is expensive:** **quarantine** with ticket, owner and date.
- **It tests something that no longer exists or is duplicated:** **delete it**.
- **The product fails:** **report the bug**. An intermittent failure can be a real race.`,
      },
      quarantine: {
        question: "What's the difference between quarantining and disabling a test?",
        body: `**Quarantine:**
- the test leaves the pipeline that blocks the merge, but **keeps running** (for example, every night);
- it has a **ticket**, an **owner** and a **date** to come back or disappear.

**Disabling it** (“skip”, commenting it out):
- nobody looks at it again;
- six months from now nobody knows why it is that way.

If someone disables tests in order to work, don't scold them: the problem is the suite. Offer them quarantine.`,
      },
      retries: {
        question: "Why don't I just put automatic retries and be done?",
        body: `Because green stops meaning anything:
- a test with badly done waits passes on the second try, and nobody fixes it;
- a **real intermittent bug** (a race, a cache) also passes on the second try, and **reaches production**.

Retries can make sense very narrowly, on a specific test and for a known reason. As a general solution, they hide the problem.`,
      },
      capacity: {
        question: 'How do I ask for time to fix the suite?',
        body: `With what the decision-maker needs:
- **The problem, with data:** “8 tests cause 90% of the reds”.
- **What you ask for:** “20% of my time for two sprints”.
- **What for:** “pipeline green more than 95%”.
- **When we review it:** “in two weeks”.

Avoid the extremes: “the whole sprint to rewrite it” scares people and guarantees nothing. “In my spare time” makes it invisible, and it doesn't get done.`,
      },
      ownership: {
        question: 'Who fixes a test when it breaks?',
        body: `**Whoever breaks it**, before merging. Every test has an owner squad.

The QA Engineer:
- sets the **rules**: no “skip”; quarantine, with a ticket;
- teaches **patterns**: waits by condition, own data per test, doubles for what is external;
- **helps** when needed.

If you keep all the tests, devs stop looking after them and you become the quality bottleneck.`,
      },
    },
    quiz: {
      pre: {
        g2pre_role: {
          question: 'As a QA Engineer, what are you responsible for?',
          options: ['All the tests of all the squads', "That the squad's automated suite is reliable, fast and useful", 'Sprint time', 'Only writing new tests'],
          explanation: "The team's safety net: reliable, fast and useful.",
        },
        g2pre_triage: {
          question: 'A test fails now and then. What do you do first?',
          options: ['Disable it', 'Put retries on it', 'Delete it', 'Investigate why it fails'],
          explanation: 'Without knowing the cause you cannot decide well.',
        },
        g2pre_quarantine: {
          question: 'What is putting a test in quarantine?',
          options: ['Commenting it out in the code', 'Deleting it temporarily', 'Taking it out of the blocking pipeline but still running it, with ticket, owner and date', 'Running it only locally'],
          explanation: 'It leaves the critical path without disappearing.',
        },
        g2pre_retries: {
          question: 'What is the main risk of putting automatic retries on the whole suite?',
          options: ['That they hide real intermittent product bugs', 'That the pipeline takes a bit longer', 'That devs complain', 'None'],
          explanation: 'An intermittent bug also passes on the second try.',
        },
        g2pre_capacity: {
          question: 'You need time to fix the suite. How do you ask for it?',
          options: ['Ask for the whole sprint to rewrite it', 'Do it in your spare time', 'With data on the problem, concrete time and a measurable goal', 'Wait for them to offer it'],
          explanation: 'The decision-maker needs problem, cost and goal.',
        },
        g2pre_owner: {
          question: 'A dev breaks a test with their change. Who should fix it?',
          options: ['The QA Engineer', 'Whoever broke it, before merging', 'Nobody: it gets disabled', 'The QA Lead'],
          explanation: 'Each squad owns its tests.',
        },
      },
      post: {
        g2post_role: {
          question: 'What does the QA Engineer NOT decide on their own?',
          options: ['How much of the sprint time goes to the suite', 'What to automate', 'What to do with a test that adds nothing', 'What test patterns to teach'],
          explanation: 'Sprint time is negotiated with the PO and the EM.',
        },
        g2post_triage: {
          question: 'Investigating an “unstable” test you see that the product lets a limit be exceeded with two simultaneous payments. What do you do?',
          options: ['Put it in quarantine', 'Fix the test so it does not fail', 'Report a bug to the squad', 'Put retries on it'],
          explanation: 'The product is failing: it is a real intermittent bug.',
        },
        g2post_quarantine: {
          question: 'A very valuable test fails because of a slow service and fixing it takes a week. What do you do today?',
          options: ['Delete it', 'Leave it blocking the pipeline', 'Disable it in silence', 'Quarantine with ticket, owner and date'],
          explanation: 'It leaves the critical path without being lost.',
        },
        g2post_retries: {
          question: 'Another team’s pipeline is “always green” thanks to general retries. What does it mean?',
          options: ['That their suite is excellent', 'That green no longer distinguishes an unstable test from an intermittent bug', 'That they have no bugs', 'That you should copy it'],
          explanation: 'Green is not the same as reliable.',
        },
        g2post_capacity: {
          question: 'Why is fixing the suite “in your spare time” a bad idea?',
          options: ['Because it is invisible work nobody plans and it ends up not getting done', 'Because it is slower', 'Because it cannot be done', 'It is not a bad idea'],
          explanation: 'What is not planned is not prioritized.',
        },
        g2post_owner: {
          question: 'What happens if the QA Engineer stays as owner of all the tests?',
          options: ['The suite improves', 'Nothing', 'More tests are written', 'Devs stop looking after them and the QA Engineer becomes the bottleneck'],
          explanation: 'Quality belongs to the team; the QA Engineer sets rules and helps.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({ laura: 'QA Lead · your manager', marta: 'Product Owner · Payments', diego: 'Backend developer · Cards', sergio: 'QA Automation · Payments' }),
)
