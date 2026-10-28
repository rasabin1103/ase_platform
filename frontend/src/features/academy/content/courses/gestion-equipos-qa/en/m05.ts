import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m05Comprar } from '../m05-comprar'
import { missionEn } from './missionEn'
import { FICHA_QA_ARCHITECT_EN } from './shared'

/** Course 4: QA Team Management · Mission 5 — Build or buy. English version of ../m05-comprar.ts. */
export const m05ComprarEn = missionEn(
  m05Comprar,
  {
    title: 'Build or buy',
    subtitle: 'QA Architect: evaluation criteria, three-year total cost, pilot with success criteria, vendor exit and safe test data.',
    playerRole: 'QA Architect · Platform',
    dayLabel: 'Monday · year 3',
    appLabel: 'Evaluation',
    wikiLabel: 'Wiki · Platform',
    verdicts: {
      good: {
        title: 'A decision that holds up',
        body: 'The pilot meets the criteria, Risk gives the green light, Platform integrates the tool and the committee approves with the real cost.',
      },
      ok: { title: 'Good tool, fragile decision', body: 'The platform works, but something was left uncovered. Check the debrief to see what it cost you.' },
      bad: {
        title: 'Decided by the demo and the invoice',
        body: 'Without criteria or total cost, the decision unravels as soon as reality arrives. Replay the mission starting with the criteria.',
      },
    },
    briefing: {
      title: 'Year 3 · Build or buy',
      paragraphs: [
        'Setting up a test environment takes three days and several squads copy production data to test.',
        'A platform for ephemeral environments and test data has to be chosen. A vendor pushes with a discount, Platform wants to build it and Raúl asks for the three-year cost for the committee.',
        "Your job is not to choose the tool you like best: it is a recommendation that Management can defend.",
      ],
      goals: [
        'Define the evaluation criteria before comparing.',
        "Answer the vendor without letting their deadline decide for you.",
        'Include Platform in the evaluation with the same criteria.',
        'Compare the three-year total cost of the three options.',
        'Agree with Risk how the data is protected.',
        'Send your recommendation with a pilot and conditions, and prepare it with Raúl for the committee.',
      ],
    },
    scenes: {
      mail_raul: {
        subject: 'Environments platform: recommendation for the committee',
        body: "Hi:\n\nOn Thursday I take the ephemeral environments and test data platform to the committee. I need your recommendation today: buy, build or open source, with the three-year cost. I don't want surprises next year.\n\nYou have the “Evaluation” app with what we have gathered.\n\nRaúl · Head of Engineering",
      },
      mail_laura: {
        subject: 'Before comparing prices',
        body: "A tip: decide the criteria first and then look at the options, not the other way around. And distrust two phrases: “free” (open source also costs people) and “only this week”.\n\nLaura",
      },
      vendor_call: {
        subject: "09:20 · Call from Olga (Sandbloq)",
        body: "**Olga:** Thanks for yesterday's demo. I offer you a 30% discount with a three-year contract if you sign before Friday. It is an end-of-quarter offer: I won't be able to repeat it.",
        choices: {
          pilot: {
            text: "Thanks, Olga. Before deciding we need a 4-week pilot with our pipeline and anonymized data, and to see the exit clause and data export in the contract. We decide with the results, not by the date.",
            reply: "Understood. We can do the pilot and I'll send you the draft with the exit clause.",
            effects: { 2: { text: "You did not give in to the vendor's urgency: you asked for a pilot and an exit clause." } },
          },
          sign: {
            text: 'I am interested. Prepare the contract and I will pass it to Raúl.',
            reply: "Perfect! I'll send it to you today.",
            effects: { 2: { text: "You let the vendor's date set your decision, before evaluating anything." } },
          },
          later: {
            text: "I'll look at it and tell you something.",
            reply: "Perfect, I'll call you on Thursday to close it.",
            effects: { 0: { text: 'You postponed the answer to the vendor without asking for a pilot or conditions.' } },
          },
        },
      },
      ivan_build: {
        body: "I heard you're going to buy an environments tool. We do that in two sprints with open source, and we pay no licenses. Why don't you leave it to us?",
        choices: {
          fair: {
            text: "Building is in the evaluation, with the same criteria as buying. Help me with a realistic estimate that includes anonymization and maintenance, and with your capacity: that way the comparison is fair.",
            reply: "Sounds fair. With maintenance and anonymization… it's not two sprints, honestly. I'll send you the numbers.",
            effects: { 2: { text: 'You included Platform in the evaluation with the same criteria and their own estimate.' } },
          },
          no: {
            text: "You don't have time. We're going to buy.",
            reply: 'Right. Nobody asked us.',
            effects: { 1: { text: 'You dismissed Platform without listening: it feels left out of a decision it will have to integrate.' } },
          },
          yes: {
            text: 'OK, if you say two sprints, build it.',
            reply: 'Great! We start on Monday.',
            effects: { 1: { text: 'You accepted a “two sprints” estimate without counting anonymization or maintenance.' } },
          },
        },
      },
      criteria_ok: {
        body: 'Good criteria: they come from the problem (data, deadline, pipeline, cost, exit and maintenance) and not from the demo. Now yes, on to comparing.',
      },
      tco_partial: {
        body: "I saw your comparison. If you only count some of the items, free software looks free and commercial looks expensive. Raúl asked for the three-year cost: people, infrastructure and exit also cost money. You can still redo it.",
      },
      tco_ok: {
        body: 'That is how you compare: with people, infrastructure and exit, “no licenses” stops being “free”.',
      },
      carmen_data: {
        subject: '13:00 · Carmen (Risk): data on an external platform',
        body: '**Carmen:** I hear the test data platform may be an external SaaS. Will Kobalto customer data leave?',
        choices: {
          anon: {
            text: "It must not. Only synthetic or anonymized data before leaving Kobalto, a data processing agreement with the vendor, and we verify it in the pilot: zero real data is a success criterion.",
            reply: "That works. Send me the contract when you have it and I'll review the pilot.",
            effects: { 3: { text: 'You agreed with Risk that no real data leaves: anonymization, processing agreement and verification in the pilot.' } },
          },
          test: {
            text: "It's test data, there's no risk.",
            reply: 'Today the squads copy production data to test. That is customer data.',
            effects: { 1: { text: 'You assumed that test data carries no risk, when today it is copied from production.' } },
          },
          later: {
            text: "We'll see once it's signed.",
            reply: "After signing, nothing gets negotiated any more.",
            effects: { 0: { text: 'You left data protection until after signing.' } },
          },
        },
      },
      rec_good: {
        body: "I read your recommendation: total cost, pilot with criteria, exit and review after a year. It is what I can defend at the committee.",
      },
      committee: {
        subject: '16:00 · Raúl: preparing the committee',
        body: "**Raúl:** Tell me in two minutes what I take to the committee on Thursday.",
        choices: {
          present: {
            text: "The recommendation, the criteria I decided it with and the three-year total cost of the three options; the risks with their mitigation (data, vendor dependency, integration), the pilot with its success criteria and when we will review the decision.",
            reply: 'Perfect. With that the committee can decide.',
            effects: {
              0: {
                then: { 3: { text: 'You presented a recommendation with criteria, total cost, risks, pilot and review.' } },
                else: { 0: { text: "You presented the recommendation with a good structure, but it doesn't hold up: check the debrief for the criteria, the cost or the conditions." } },
              },
            },
          },
          licences: {
            text: "The cheapest in licenses is building it: we pay nothing.",
            reply: 'And who maintains it? The committee is going to ask me.',
            effects: { 1: { text: 'You took only the licenses to the committee, without total cost or risks.' } },
          },
          whatever: {
            text: 'All three are fine. You decide.',
            reply: 'That is why I asked you for a recommendation.',
            effects: { 1: { text: 'You gave no recommendation: it is exactly what they were asking for.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** What are you taking away from your first big purchase?',
        choices: {
          lesson: {
            text: "That the criteria come first and the options after; that the total cost is compared, not the licenses; that the demo does not replace a pilot with success criteria, and that a decision needs an exit and a review date.",
            reply: 'That is deciding like an architect: with criteria, complete numbers and an exit door.',
          },
          cheapest: {
            text: 'That in the end the cheapest wins.',
            reply: 'The cheapest in licenses or over three years? Check the debrief.',
            effects: { 0: { text: 'You kept “the cheapest wins”: it depends on which costs you count.' } },
          },
        },
      },
    },
    docs: {
      ficha_architect: FICHA_QA_ARCHITECT_EN,
      eval_guide: {
        title: 'How we evaluate tools on Platform',
        updatedLabel: 'Platform',
        body: `## Before looking at options
- Write down the problem and the criteria. The essentials first.

## Comparing
- The same questions for all options, including building.
- Three-year total cost: licenses, setup, people, infrastructure and exit.

## Deciding
- Bounded pilot with measurable success criteria.
- With a vendor: exit clause, data export and processing agreement if there is personal data.
- A date to review the decision.`,
      },
    },
    bugs: {
      'C-SORPRESA': {
        title: 'The first year costs double the budget: nobody counted the people',
        explanation: 'Comparing only licenses hides the cost of maintaining and operating the platform.',
        technique: 'Three-year total cost with all items.',
      },
      'C-ATADOS': {
        title: 'At renewal, the vendor raises the price 40% and you cannot leave',
        explanation: 'Without an exit clause or data export, or with a closed contract, you lose the ability to negotiate.',
        technique: 'Exit clause, export in an open format and no long contracts before the pilot.',
      },
      'C-DATOS': {
        title: 'Real customer data ends up on the test platform',
        explanation: 'Data copied from production is personal data: without anonymizing or a contract, it is non-compliance.',
        technique: 'Synthetic or anonymized data, processing agreement and verification in the pilot.',
      },
      'C-DEMO': {
        title: "The tool doesn't fit your pipeline: the demo didn't show it",
        explanation: 'Without a pilot with success criteria, you decide with what the vendor chose to show.',
        technique: 'Bounded pilot with your pipeline, your anonymized data and measurable criteria.',
      },
      'C-SOMBRA': {
        title: 'Platform builds its own tool in parallel',
        explanation: 'A team that does not take part in the decision does not adopt it and ends up duplicating the work.',
        technique: 'Include their option in the evaluation with the same criteria.',
      },
      'C-COMITE': {
        title: 'The committee sends the proposal back: it does not hold up',
        explanation: 'Without criteria, total cost, risks and a plan, Management cannot approve.',
        technique: 'Clear recommendation with criteria, total cost, risks, pilot and review.',
      },
    },
    prevention: {
      title: 'A year later',
      intro: 'A purchase decision is measured when the invoice, the renewal and the first audit arrive.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Total cost', explanation: 'Licenses, setup, people, infrastructure and exit.' },
        1: { label: 'Vendor exit', explanation: 'Exit clause and data export, no closed contract before the pilot.' },
        2: { label: 'Data protected', explanation: 'Anonymization, processing agreement and verification with Risk.' },
        3: { label: 'Pilot with criteria', explanation: '4 weeks, two squads, measurable criteria and signing only if they are met.' },
        4: { label: 'Platform included', explanation: 'Their option evaluated with the same criteria and their own estimate.' },
        5: { label: 'Committee convinced', explanation: 'Recommendation with criteria, cost, risks, pilot and review.' },
      },
    },
    concepts: {
      role_qa_architect: {
        title: 'Responsibilities of the QA Architect',
        summary: 'Owns the common technical testing decisions. Has no budget: proposes with its cost and risks, and Management decides.',
      },
      eval_criteria: {
        title: 'Evaluation criteria',
        summary: 'They come from the problem and the constraints, and are set before looking at options.',
      },
      tco: {
        title: 'Three-year total cost',
        summary: 'Licenses, setup, people, infrastructure and exit. “No licenses” is not “free”.',
      },
      build_vs_buy: {
        title: 'Build or buy',
        summary: 'Build what differentiates you; buy what is common. With real capacity and evaluating both options with the same criteria.',
      },
      pilot_success: {
        title: 'Pilot with success criteria',
        summary: 'Bounded, with your pipeline and your anonymized data, measurable criteria defined beforehand and a decision at the end.',
      },
      vendor_lockin: {
        title: 'Vendor dependency',
        summary: 'Exit clause, data export, no long contracts before the pilot and a review date.',
      },
      test_data_privacy: {
        title: 'Test data and privacy',
        summary: 'Copied from production, it is customer data: synthetic or anonymized, with a processing agreement.',
      },
    },
    seniorTips: [
      'Criteria: anonymization, a one-quarter deadline, pipeline, total cost, exit and maintenance. No demos, discounts or fashions.',
      'To Olga: pilot with your pipeline and anonymized data, and an exit clause before talking about dates.',
      'To Iván: his option enters with the same criteria and an estimate that includes maintenance.',
      'Cost: all items. Buying comes out cheapest over three years and is the only thing that arrives in a quarter.',
      'To Carmen: synthetic or anonymized data, processing agreement and verification in the pilot.',
      'Recommendation: buy, 4-week pilot with criteria, exit clause, sign only if the pilot meets them and review at 12 months.',
    ],
    lessons: {
      criteria: {
        question: 'Where do I start when evaluating tools?',
        body: `With the **criteria**, before looking at options. They come from the problem and the constraints:
- what cannot fail (here, anonymized data);
- the deadline Management asks for;
- integration with what you already have;
- total cost and who maintains it;
- how to exit if it does not work.

If you look at the demos first, you end up choosing criteria that justify the one you liked most.`,
      },
      tco: {
        question: 'What is the three-year total cost?',
        body: `Everything the option costs over its life, not just the invoice:
- **licenses**;
- **setup:** development, integration and training;
- **people** to maintain it;
- **infrastructure**;
- **exit:** migrating if you ever change.

“No licenses” is not “free”: building or open source usually costs mostly people, and people are the most expensive thing.`,
      },
      build_buy: {
        question: 'Build or buy?',
        body: `Build what **differentiates** you from the rest or what nobody sells the way you need it. Buy what is **common** and that others maintain better than you.

And look at **real capacity**: if the team that would build it has a full backlog, building means not doing something else or doing it late.

Include the team that wants to build in the evaluation: with the same criteria, their numbers often change from “two sprints” to something more realistic.`,
      },
      pilot: {
        question: 'How do I run a pilot that helps me decide?',
        body: `- **Bounded:** a few weeks and two representative teams.
- **With your reality:** your pipeline and your data (anonymized), not the demo's.
- **With measurable success criteria before starting:** for example, an environment in under 15 minutes and zero real data.
- **With a decision at the end:** sign only if they are met.

A pilot without criteria or an end is not a pilot: it is an undecided rollout.`,
      },
      lockin: {
        question: 'How do I avoid being tied to a vendor?',
        body: `- **Exit clause** and **data export** in an open format, in the contract from the start.
- **Don't sign long-term before the pilot**, even with a discount: the urgency is the vendor's, not yours.
- **Review date** with usage and cost metrics.

Negotiate before signing: afterwards you have nothing left to negotiate with.`,
      },
      privacy: {
        question: 'What risk does test data carry?',
        body: `If it is copied from production, **it is customer data**, with all its obligations (GDPR).

- Use **synthetic or anonymized data** before it leaves your environment.
- With an external vendor, a **data processing agreement**.
- Make it a **pilot success criterion** and tell Risk before signing, not after.`,
      },
    },
    quiz: {
      pre: {
        g5pre_criteria: {
          question: 'You have to choose a tool among three. What do you do first?',
          options: ['Watch the three demos', 'Define the evaluation criteria from the problem', 'Ask for prices', 'Ask what the competition uses'],
          explanation: 'Criteria come before options.',
        },
        g5pre_tco: {
          question: 'An open source option has no licenses. Its three-year cost is…',
          options: ['Zero', 'Only the infrastructure', 'The setup, the people who maintain it, the infrastructure and the exit', 'Impossible to calculate'],
          explanation: 'No licenses is not free: people are usually the most expensive part.',
        },
        g5pre_build: {
          question: 'When does it make the most sense to build a tool?',
          options: ['Always: it is cheaper', 'When the team asks for it', 'Never', 'When it differentiates you or nobody sells it the way you need it, and you have capacity to maintain it'],
          explanation: 'Build what differentiates; buy what is common.',
        },
        g5pre_pilot: {
          question: 'What does a pilot need to be of any use?',
          options: ['Measurable success criteria defined before starting', 'Lasting at least six months', 'Including all teams', 'Being run by the vendor'],
          explanation: 'Without prior criteria, there is no way to decide at the end.',
        },
        g5pre_lockin: {
          question: 'The vendor offers a 30% discount if you sign three years this week. What do you do?',
          options: ['Sign: it is a lot of money', 'Ask for a pilot and an exit clause, and decide with the results', 'Cut the relationship', 'Sign one year'],
          explanation: 'The urgency is the vendor’s; you decide with data.',
        },
        g5pre_privacy: {
          question: 'The squads copy production data to test. That data is…',
          options: ['Test data, no risk', "The squad's responsibility", 'Customer data, with its obligations', 'Anonymized data'],
          explanation: 'Copied from production, it is still personal data.',
        },
      },
      post: {
        g5post_criteria: {
          question: 'Which is NOT a good criterion for choosing the platform?',
          options: ['Integration with the pipeline', 'Three-year total cost', 'Maintenance effort', 'The best demo'],
          explanation: 'The demo shows what the vendor chooses, not your case.',
        },
        g5post_tco: {
          question: 'Counting only licenses, buying looks the most expensive. With the total cost…',
          options: ['Buying is still the most expensive', 'The comparison can change completely', 'It makes no difference', 'Building is still free'],
          explanation: 'People, infrastructure and exit change the picture.',
        },
        g5post_build: {
          question: 'Platform says it will build it in two sprints. What do you do?',
          options: ['Include the option in the evaluation with the same criteria and an estimate with maintenance', 'Accept it', 'Dismiss it without talking', 'Let them decide'],
          explanation: 'Fair comparison and a realistic estimate.',
        },
        g5post_pilot: {
          question: 'What is the best pilot design?',
          options: ['No pilot: there are references', 'Six months open with all squads', '4 weeks, two squads, anonymized data and measurable criteria', 'The one the vendor proposes'],
          explanation: 'Bounded, with your reality and with success criteria.',
        },
        g5post_lockin: {
          question: 'Which condition avoids being tied to the vendor?',
          options: ['A three-year contract', 'Paying in advance', 'Using all its features', 'An exit clause and data export in an open format'],
          explanation: 'Being able to leave without losing the data.',
        },
        g5post_privacy: {
          question: 'Risk asks whether customer data will go out to the SaaS. What do you answer?',
          options: ['“We’ll see when signing”', '“No: synthetic or anonymized data, processing agreement and verification in the pilot”', '“It is test data”', '“Ask the vendor”'],
          explanation: 'Before signing and verified in the pilot.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    raul: 'Head of Engineering',
    laura: 'QA Lead · Payments',
    ivan: 'Platform Lead',
    carmen: 'Risk & Compliance',
  }),
)
