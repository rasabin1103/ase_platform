import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m04Estandar } from '../m04-estandar'
import { missionEn } from './missionEn'
import { FICHA_QA_ARCHITECT_EN } from './shared'

/** Course 4: QA Team Management · Mission 4 — Five squads, five frameworks. English version of ../m04-estandar.ts. */
export const m04EstandarEn = missionEn(
  m04Estandar,
  {
    title: 'Five squads, five frameworks',
    subtitle: 'QA Architect: influence without authority, minimum standard, RFC and ADR, incremental migration and governed exceptions.',
    playerRole: 'QA Architect · Platform',
    dayLabel: 'Tuesday · year 3',
    appLabel: 'RFC',
    wikiLabel: 'Wiki · Platform',
    verdicts: {
      good: {
        title: 'A standard that gets used',
        body: 'Three squads sign up for the pilot, Payments migrates the critical part without stopping its releases and Raúl can see what is tested within a quarter.',
      },
      ok: {
        title: 'Standard published, adoption halfway',
        body: 'The standard exists, but not every squad will follow it. Check the debrief to see where it breaks.',
      },
      bad: {
        title: 'A paper standard',
        body: 'Mandatory in the document, ignored in practice. Replay the mission starting by listening to the squads.',
      },
    },
    briefing: {
      title: 'Year 3 · QA Architect on Platform',
      paragraphs: [
        'Kobalto now has 16 squads. You have been named QA Architect: your job is the technical testing decisions common to everyone.',
        'Five squads automate with five different tools. Raúl wants a single, mandatory framework next month.',
        "The nuance: the squads don't report to you. What you decide will only work if they adopt it.",
      ],
      goals: [
        'Read the QA Architect role sheet.',
        "Steer Raúl's order toward his real goal, with an approach that can be adopted.",
        'Study the squad map and write an RFC: scope, how the tool is chosen, migration and exceptions.',
        "Answer the squads' comments and publish the ADR.",
        'Present the standard at the guild as a shared decision.',
        'Give Raúl realistic dates.',
      ],
    },
    scenes: {
      mail_raul: {
        subject: 'An automation standard, now',
        body: "Hi:\n\nCongratulations on the QA Architect position. First assignment: we have five squads with five different tools and there is no way to know what is tested. I want a single framework for everyone, mandatory, next month.\n\nWe talk at 9:30.\n\nRaúl · Head of Engineering",
      },
      mail_laura: {
        subject: 'A tip for your new role',
        body: "Congratulations!\n\nA tip from someone who has seen three “standards” fail: as QA Architect you have no authority over the squads. If it is imposed from above, they will comply on paper and skip it in practice.\n\nYou have the role sheet in the wiki and the “RFC” app with the map of how each squad works.\n\nLaura · Payments QA Lead",
      },
      raul_meeting: {
        subject: '09:30 · Raúl: the standard',
        body: "**Raúl:** We make it mandatory and in a month everybody on the same tool. Any problem?",
        choices: {
          rfc: {
            text: "I share the goal, but if we impose it without the squads they will comply on paper. I propose an RFC with them: a minimum standard for what worries you (comparable reports, data and pipeline), a recommended tool for new work and a six-week pilot with two squads. I'll bring you real adoption, not a document.",
            reply: "As long as I can see what is tested across all squads within a quarter, that works for me. Go ahead.",
            effects: { 3: { text: "You steered Raúl's order toward his real goal (seeing what is tested) with an approach the squads can adopt." } },
          },
          impose: {
            text: "No problem: I'll make it mandatory and in a month it's done.",
            reply: "That's what I like to hear!",
            effects: { 2: { text: 'You agreed to impose the standard in one month: with no real authority over the squads, it is a promise you cannot keep.' } },
          },
          resist: {
            text: "I don't think anything needs standardizing: each squad knows what it needs.",
            reply: "Well, I need to know what is tested. If you don't solve it, I'll solve it my own way.",
            effects: { 1: { text: "You denied Management's problem: the real problems (reports, data, pipeline) are still there." } },
          },
        },
      },
      hector_worried: {
        body: "Hey, word is you're going to force us to throw out our 1,200 Postman tests. Is that true? We release every Friday…",
        choices: {
          listen: {
            text: "Nobody is going to throw anything away without talking about it. I'm going to send an RFC to the five squads and I want Payments to comment on it first: your case is exactly the one I most care about fitting.",
            reply: "OK, that calms me down. I'll comment on it in detail.",
            effects: { 2: { text: 'You reassured Héctor without promising anything you do not control and invited him to take part.' } },
          },
          yes: {
            text: "Yes, that's how it is: it comes from above.",
            reply: "Great… well, we'll see how we do it.",
            effects: { 1: { text: 'You hid behind “it comes from above”: Payments gets defensive before reading anything.' } },
          },
          promise: {
            text: "Don't worry, it won't affect you.",
            reply: 'Perfect then!',
            effects: { 0: { text: "You promised Payments wouldn't be affected: it is a promise the standard won't be able to fully keep." } },
          },
        },
      },
      rfc_good: {
        body: "I read your RFC: common minimum, criteria and pilot, incremental migration and exceptions at the guild. That's how it gets adopted. Now, on to the comments.",
      },
      rfc_imposed: {
        body: "I read the RFC. A mandatory tool and everybody migrating this quarter… In Cards we'll do it, but I'm telling you Payments and Onboarding are going to do their own thing.",
        onDeliver: { 2: { text: 'The RFC imposed a tool or an immediate migration: squads with a different context disengage.' } },
      },
      adr_ok: {
        body: "I saw your reply and the ADR. With reports and pipeline now, and help for the 50 critical ones, this I can sell in Payments. Thanks for listening.",
      },
      adoption_ok: {
        body: "Three squads have already signed up for the pilot before the guild. That is influence without authority.",
      },
      guild: {
        subject: '14:30 · QA Guild: the standard',
        body: '**Laura:** Tell us where the standard ended up.',
        choices: {
          together: {
            text: "This is what we decided all together, and it is in the ADR: the common minimum, the recommended tool for new APIs, migration when the code is touched and the exceptions that we will review here every month. The pilot is run by Cards and Payments; in six weeks we review it with data.",
            reply: "This is a pleasure. And having the exceptions reviewed here seems very healthy to me.",
            effects: { 3: { text: 'You presented the standard as a shared, documented decision with periodic review.' } },
          },
          mandate: {
            text: 'The standard is this one and it is mandatory from Monday.',
            reply: 'And what we commented on in the RFC? Why did you ask for it then?',
            effects: { 1: { text: 'You presented the standard as an order: the squads’ comments look like they were a formality.' } },
          },
          unfinished: {
            text: "I haven't closed it yet, I'll tell you later.",
            reply: 'OK… but the rumor is already going around the squads.',
            effects: { 0: { text: 'You arrived at the guild without a published decision.' } },
          },
        },
      },
      raul_expect: {
        subject: '16:30 · Raúl: when is everything migrated?',
        body: '**Raúl:** OK, and when do I have the five squads on the standard?',
        choices: {
          realistic: {
            text: "What worried you, seeing what is tested across all squads, you have within a quarter: common reports and pipeline. New work, already on the standard; the critical part, migrated in two quarters; the rest, when touched. I'll show you the adoption every month.",
            reply: 'Works for me. What I need is visibility, and you give me that in a quarter.',
            effects: { 3: { text: 'You gave Raúl realistic dates centered on his goal and a monthly adoption indicator.' } },
          },
          month: {
            text: 'Next month, as you asked.',
            reply: "Perfect, I'll tell the committee.",
            effects: { 1: { text: 'You promised everything migrated in a month: Raúl tells the committee and it will not be met.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** How was your first standard?',
        choices: {
          lesson: {
            text: "That without authority, a standard only exists if the squads adopt it: solve the real problem with the common minimum, decide with criteria and pilots, migrate without stopping delivery and have the exceptions seen and reviewed by everybody.",
            reply: 'That is real architecture: documents that people use.',
          },
          authority: {
            text: 'That this role needs more authority to impose things.',
            reply: 'With authority they would comply on paper. Check the debrief.',
            effects: { 0: { text: 'You kept that authority is missing: the role works through influence.' } },
          },
        },
      },
    },
    docs: {
      ficha_architect: FICHA_QA_ARCHITECT_EN,
      rfc_adr: {
        title: 'RFC and ADR: how we decide on Platform',
        updatedLabel: 'Platform',
        body: `## RFC (request for comments)
- A written proposal: problem, options, proposal and what is out of scope.
- It is shared with those affected before deciding. Every comment gets an answer.

## ADR (architecture decision record)
- The final decision: context, decision, consequences and exceptions.
- It stays in the repository: anyone can see why it was decided.

## Good practices
- Solve the real problem with the minimum necessary.
- Explicit criteria and a pilot before generalizing.
- Incremental migration: don't stop delivery.
- Exceptions visible and reviewed as a group, not approved by one person.`,
      },
    },
    bugs: {
      'C-PAPEL': {
        title: 'After three months, the standard is only followed on paper',
        explanation: "Without listening to the squads, solving their context and governing the exceptions, everyone goes back to their own thing.",
        technique: 'RFC with those affected, comments answered with judgement and a pilot.',
      },
      'C-PAGOS': {
        title: 'Payments freezes its 1,200 tests and stops testing while it “migrates”',
        explanation: 'An immediate migration for the biggest squad with weekly releases forces it to choose between testing and complying.',
        technique: 'Incremental migration with help for the critical part.',
      },
      'C-CUELLO': {
        title: 'Every exception waits for your approval: you become the bottleneck',
        explanation: 'If all exceptions go through one person, the standard moves at their pace.',
        technique: 'Exceptions in the ADR, reviewed at the guild.',
      },
      'C-PROMESA': {
        title: 'Raúl announced “everything migrated in a month” and you lose credibility with the committee',
        explanation: "Promising what doesn't depend on you, or without a realistic migration plan.",
        technique: "Realistic dates centered on Management's goal.",
      },
      'C-UI': {
        title: 'Onboarding builds its own “standard” for the web interface',
        explanation: 'The UI was left out without saying so or opening another path.',
        technique: 'Make explicit what is out of scope and how it will be handled.',
      },
    },
    prevention: {
      title: 'Three months later',
      intro: 'A standard is measured by its adoption, not by the document.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Real adoption', explanation: 'A well-posed RFC and the three comments incorporated with judgement.' },
        1: { label: 'Payments migrates without stopping', explanation: 'Reports and pipeline now; the 1,200 tests when touched; help with the 50 critical ones.' },
        2: { label: 'Governed exceptions', explanation: 'ADR and monthly guild, not your approval one by one.' },
        3: { label: 'Realistic expectations', explanation: 'Visibility in a quarter, the critical part in two and adoption measured every month.' },
        4: { label: 'Explicit scope', explanation: 'The UI outside this version, with its own RFC.' },
      },
    },
    concepts: {
      role_qa_architect: {
        title: 'Responsibilities of the QA Architect',
        summary: 'Owns the common testing standards and technical decisions. Has no authority over the squads nor budget: measured by real adoption.',
      },
      influence: {
        title: 'Influencing without authority',
        summary: "Understand the goal of whoever asks, listen to those affected, decide with data and pilots, and don't promise what doesn't depend on you.",
      },
      minimum_standard: {
        title: 'Minimum standard',
        summary: "Solve the real problem (reports, data, pipeline) with the common minimum and leave room for each squad's context.",
      },
      rfc_adr: {
        title: 'RFC and ADR',
        summary: 'Propose in writing to those affected, answer every comment and document the decision with its context and exceptions.',
      },
      incremental_migration: {
        title: 'Incremental migration',
        summary: 'The new with the standard, the existing when touched and a deadline only for the critical: without stopping delivery.',
      },
      governance_guild: {
        title: 'Governed exceptions',
        summary: 'Exceptions documented and reviewed as a group (the guild), neither approved one by one by a single person nor forbidden.',
      },
    },
    seniorTips: [
      "To Raúl: his goal is to know what is tested. RFC, common minimum and a six-week pilot.",
      'To Héctor: nothing without talking about it; have Payments comment on the RFC first.',
      'RFC: minimum standard, criteria and pilot, incremental migration and exceptions at the guild.',
      'Comments: Payments applies reports and pipeline now and migrates when touching, with help for the 50 critical ones; Notifications, an exception if it meets the minimum; the UI, out of scope with its own RFC.',
      'At the guild: it is a shared decision and it is in the ADR.',
      'To Raúl: visibility in a quarter, the critical part in two and monthly adoption.',
    ],
    lessons: {
      role: {
        question: 'What does a QA Architect do that a QA Engineer does not?',
        body: `The QA Engineer looks after the automation **of their squad**. The QA Architect decides what is **common to all**: standards, tools, testing architecture.

The big change: **you have no authority over the squads**. They are not your team. Your success is measured by whether they adopt what you propose, not by the document you publish.`,
      },
      influence: {
        question: "I'm asked to impose something on teams that don't depend on me. What do I do?",
        body: `1. **Find the real goal** of whoever asks. Raúl doesn't want “a tool”: he wants to know what is tested.
2. **Listen to those affected before deciding.**
3. **Decide with criteria and data**, ideally with a pilot.
4. **Don't promise what doesn't depend on you:** neither “everybody in a month” nor “it won't affect you”.

What is imposed gets complied with on paper. What is built with the teams gets used.`,
      },
      minimum: {
        question: 'One tool for everything or each one their own?',
        body: `Neither. Ask yourself **what problem has to be solved**:
- Reports that can't be compared? → common format.
- Data that is not reused? → test data conventions.
- Chaotic execution? → how it runs in the pipeline.

That is the **minimum standard**. For new work, a **recommended** tool. The rest, let each context decide: testing a UI is not the same as an API, nor a Python team the same as a Java one.`,
      },
      rfc: {
        question: 'What is an RFC and what is an ADR for?',
        body: `**RFC:** your proposal in writing (problem, options, proposal and what is left out) shared **before deciding**. Every comment is answered: incorporating it, explaining why not or leaving it out of scope.

**ADR:** the final decision, with context, consequences and exceptions. It stays in the repository. A year from now someone will know why it was decided that way.`,
      },
      migration: {
        question: 'How do I migrate 2,000 tests without stopping anybody?',
        body: `**Incremental migration:**
- the **new**, already on the standard;
- the **existing**, when it is touched;
- **a deadline only for the critical**, with help.

An “everybody migrates this quarter” forces the team with the most volume to choose between testing and complying. And complying on paper always wins.`,
      },
      governance: {
        question: 'How do I manage exceptions to the standard?',
        body: `- **No exceptions:** the standard breaks at the first case that doesn't fit.
- **You approve them one by one:** you become the bottleneck.
- **What works:** exceptions documented in the ADR, with their reason, and reviewed every month at the QA guild. That way they are visible, decided with shared criteria and don't depend on one person.`,
      },
    },
    quiz: {
      pre: {
        g4pre_role: {
          question: "How is a QA Architect's success measured?",
          options: ['By the real adoption of what they propose', 'By the number of standards published', 'By the tools they know', 'By the tests they write'],
          explanation: 'Without authority over the squads, what counts is what they adopt.',
        },
        g4pre_influence: {
          question: 'Your director wants a single mandatory framework in a month. What do you do first?',
          options: ['Impose it', 'Refuse', 'Wait for him to forget', 'Find his real goal and propose an approach the squads can adopt'],
          explanation: 'Steer toward the real goal with an adoptable approach.',
        },
        g4pre_minimum: {
          question: "The problem is that the squads' reports can't be compared. What do you standardize?",
          options: ["Everyone's tool", 'The report format (and the minimum necessary)', 'Nothing', 'The test names'],
          explanation: 'The minimum standard tackles the real problem.',
        },
        g4pre_rfc: {
          question: 'When is an RFC shared with the affected teams?',
          options: ['After deciding', 'Never, it is an internal document', 'Before deciding, to collect comments', 'Only if they ask'],
          explanation: 'The RFC is for deciding with those affected.',
        },
        g4pre_migration: {
          question: 'A squad has 1,200 tests and releases every week. What migration do you propose?',
          options: ['Everything this quarter', 'New work on the standard, existing when touched and the critical with a date and help', 'That it never migrates', 'That it stops a sprint to migrate'],
          explanation: 'Incremental: without stopping delivery.',
        },
        g4pre_gov: {
          question: 'How would you manage exceptions to the standard?',
          options: ['No exceptions', 'You approve them one by one', 'Each squad decides without saying anything', 'Documented in the ADR and reviewed at the guild'],
          explanation: 'Visible, with shared criteria and no bottleneck.',
        },
      },
      post: {
        g4post_role: {
          question: 'What does a QA Architect NOT have?',
          options: ['Responsibility for the common standards', 'Ability to propose technical decisions', 'Direct authority over the squads', 'A voice in the QA guild'],
          explanation: 'The squads do not report to them: they influence, they do not command.',
        },
        g4post_influence: {
          question: 'A QA from another squad asks if you will force them to change everything. What do you answer?',
          options: ['“Nothing without talking about it: comment on the RFC, your case matters to me”', '“Yes, it comes from above”', '“Don’t worry, it doesn’t affect you”', '“I don’t know anything”'],
          explanation: "Without hiding or promising what doesn't depend on you, and inviting them to take part.",
        },
        g4post_minimum: {
          question: 'A Python squad has few tests that work well with pytest. With a minimum standard…',
          options: ['It must migrate to the recommended tool', 'It stays outside the standard', 'It is forbidden to automate', 'It can keep pytest if it meets the common minimum, as a documented exception'],
          explanation: 'The standard seeks common results, not uniformity for its own sake.',
        },
        g4post_rfc: {
          question: 'A squad comments that the RFC does not cover the web interface. What do you do?',
          options: ['Ignore it', 'Explicitly leave it out of scope and open a separate RFC', 'Force the API tool to be used for the UI too', 'Withdraw the RFC'],
          explanation: 'Explicit scope and a path for what is left out.',
        },
        g4post_migration: {
          question: 'What happens if you force the squad with the most tests to migrate everything at once?',
          options: ['It migrates faster', 'Nothing', 'It has to choose between testing and complying, and stops testing or complies on paper', 'It gets motivated'],
          explanation: 'Immediate migration puts delivery and quality at risk.',
        },
        g4post_expect: {
          question: 'Your director asks when all squads will be on the standard. What do you answer?',
          options: ['Realistic dates centered on his goal and a monthly adoption indicator', '“Next month”', '“I don’t know”', '“When each squad wants”'],
          explanation: 'Realistic and measurable expectations.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    raul: 'Head of Engineering',
    laura: 'QA Lead · Payments',
    hector: 'QA · Payments',
    sergio: 'QA Automation · Payments',
    diego: 'Tech Lead · Cards',
    nerea: 'QA · Accounts',
  }),
)
