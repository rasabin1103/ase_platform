import { kobaltoTeamsWorldEn } from '../../../worlds/kobaltoTeams.en'
import { m08Contratar } from '../m08-contratar'
import { missionEn } from './missionEn'
import { FICHA_QA_MANAGER_EN } from './shared'

/** Course 4: QA Team Management · Mission 8 — Hiring. English version of ../m08-contratar.ts. */
export const m08ContratarEn = missionEn(
  m08Contratar,
  {
    title: 'Hiring',
    subtitle: 'QA Manager: profile based on what is missing, structured interview, biases, saying no with data, fast offer and onboarding.',
    playerRole: 'QA Manager · Everyday Banking',
    dayLabel: 'Tuesday · year 5',
    appLabel: 'Hiring',
    wikiLabel: 'Wiki · Everyday Banking QA',
    verdicts: {
      good: {
        title: 'Three hires that add up',
        body: 'Ana, Javier and Rocío accept, arrive with their plan and within three months cover what the area was missing. Raúl understands the “no” and the team trusts the process.',
      },
      ok: {
        title: 'Vacancies filled, process improvable',
        body: 'You hired, but something in the process was not fair, fast or evidence-based. Check the debrief to see what it cost you.',
      },
      bad: {
        title: 'Hiring by impressions',
        body: 'Without a profile or scorecard, pressure and impressions decided. Replay the mission starting with the profile.',
      },
    },
    briefing: {
      title: 'Year 5 · QA Manager of Everyday Banking',
      paragraphs: [
        'Now you lead three QA teams and their leads. You have three approved vacancies.',
        'The current process takes seven weeks and last month two candidates were lost. And the CTO has sent you a former colleague of his.',
        'There are five finalists. At 12:00 you have the hiring debate; decide afterwards.',
      ],
      goals: [
        'Read the QA Manager role sheet.',
        "Define the profile from what the area is missing, with an interview format and a process that work.",
        "Have the CTO's recommendation go through the same process, and manage the panel's conflicts of interest.",
        'At the debate, decide with evidence.',
        'Send the decision on the five finalists and explain it to Raúl.',
        'Close the offer and the onboarding.',
      ],
    },
    scenes: {
      mail_laura: {
        subject: 'Three approved vacancies',
        body: "Hi:\n\nYou now have the three QA vacancies for Everyday Banking approved. The current process takes seven weeks and last month we lost two candidates because of it.\n\nYou have the “Hiring” app: first the profile and the process; then, the panel scorecard with the five finalists. At 12:00 you have the hiring debate.\n\nLaura · VP Engineering",
      },
      mail_raul: {
        subject: 'Marcos',
        body: "Hi:\n\nI'm sending you the CV of Marcos Ibarra: we worked together for years and he's a star. Hire him and we save the process, which is painfully slow.\n\nRaúl · CTO",
      },
      andrea_marcos: {
        body: 'I got the CV of Marcos with a “from the CTO”. Do I skip the process and make him the offer right away?',
        choices: {
          same: {
            text: 'No: same process and same scorecard as the rest. It is fair for him and for the others, and that way the decision holds up.',
            reply: "Agreed, I'll put him in with the finalists.",
            effects: { 2: { text: "The CTO's recommended candidate goes through the same process as the others." } },
          },
          skip: {
            text: 'Yes, if it comes from the CTO, go ahead.',
            reply: "OK, I'll prepare the offer.",
            effects: { 2: { text: 'You were about to skip the process because of who recommended the candidate.' } },
          },
          discard: {
            text: "Discard him now: I don't want favorites.",
            reply: "Without interviewing him? That isn't fair either.",
            effects: { 0: { text: 'You discarded a candidate because of who recommended him, without evaluating him.' } },
          },
        },
      },
      sergio_coi: {
        body: "One thing: Ana Ferrer, the finalist, is a friend of mine from years ago. Can I be in her interview?",
        choices: {
          recuse: {
            text: "Thanks for saying so. Héctor does her interview in your place, and you interview the rest. I'll note it in the file so it is clear.",
            reply: 'Perfect, better this way.',
            effects: { 3: { text: 'You managed the conflict of interest: Sergio does not evaluate his friend and it is recorded.' } },
          },
          fine: {
            text: 'No problem, you know her better than anyone.',
            reply: 'Great!',
            effects: { 0: { text: 'You let Sergio evaluate a friend.' } },
          },
          quiet: {
            text: "Interview her, but don't tell anyone.",
            reply: 'Um… OK.',
            effects: { 0: { text: 'You hid a conflict of interest instead of managing it.' } },
          },
        },
      },
      process_ok: {
        body: "Good profile: it comes from what the area is missing, not from the years-old job ad. And with a scorecard, realistic exercise and two interviews in a week, we compare well and fast.",
      },
      debate: {
        subject: '12:00 · Hiring debate',
        body: "**Héctor:** About Rocío… she has no degree and comes from customer support. I don't know if she fits with us.",
        choices: {
          evidence: {
            text: "Let's go back to the scorecard. On API and pipeline she scored 3, and on explaining risks 4, the best score. She already supports a junior. The degree is not in the profile because it does not predict the work. What evidence do we have that she does not fit?",
            reply: 'Seen that way… you’re right: it was an impression, not a fact.',
            effects: { 3: { text: 'You moved the debate from impression to the scorecard’s evidence.' } },
          },
          agree: {
            text: "Yes, true: she's not the usual profile.",
            reply: 'Then discarded.',
            effects: { 0: { text: 'You accepted an impression about “the usual profile”.' } },
          },
          vote: {
            text: "Let's vote and be done.",
            reply: 'Two against one: out.',
            effects: { 0: { text: 'A vote without evidence turns impressions into a decision.' } },
          },
        },
      },
      hiring_ok: {
        body: "I saw the decision: Ana for automation, Javier for performance and Rocío for business and junior. It covers exactly what the area was missing.",
      },
      raul_marcos: {
        subject: '14:00 · Raúl: “How about Marcos?”',
        body: "**Raúl:** How about Marcos? You hired him, right?",
        choices: {
          data: {
            text: "No. He went through the same process as the rest and communicates very well, but on API and pipeline he scored 1 and has not automated in three years, which is exactly what we need. I gave him that feedback. If a consulting or business vacancy opens, I would see him very well there.",
            reply: "OK. If you measured him the same as the others, that works. Thanks for the feedback for him.",
            effects: { 3: { text: 'You told the CTO no with data from the same scorecard and gave him an alternative.' } },
          },
          cave: {
            text: "I'll fix it: we make him an offer too.",
            reply: "That's what I like to hear!",
            effects: { 3: { text: 'You hired, under pressure from the CTO, someone the scorecard did not support.' } },
          },
          vague: {
            text: "He didn't fit.",
            reply: "“He didn't fit”? That tells me nothing.",
            effects: { 0: { text: 'You said no without data: the CTO is left with the feeling that it was personal.' } },
          },
        },
      },
      andrea_offer: {
        body: 'Ana, Javier and Rocío have other offers. When do we answer them? And how do we plan their arrival?',
        choices: {
          fast: {
            text: "Offer today, by phone and in writing. And for each one: a buddy from their team, a 30, 60 and 90-day plan and their first 1:1 with their lead on the first day.",
            reply: "Done. That way we don't lose them.",
            effects: { 2: { text: 'Same-day answer and onboarding prepared: buddy, 30-60-90 plan and first 1:1.' } },
          },
          later: {
            text: "Next week, today I can't.",
            reply: 'OK… although one of them may not wait.',
            effects: { 0: { text: 'You delayed the offer: in a market with other offers, that costs candidates.' } },
          },
          wait: {
            text: "Let's wait in case someone better shows up.",
            reply: 'While we wait, they decide.',
            effects: { 0: { text: 'You waited for a hypothetical candidate and risked the real ones.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · Coffee with Laura',
        body: '**Laura:** What are you taking away from your first round of hiring as a Manager?',
        choices: {
          lesson: {
            text: "That the profile comes from what the team is missing; that everybody is compared with the same scorecard and a realistic exercise; that at the debate evidence rules, not impressions; that the CTO also gets told no with data, and that a fast offer and onboarding are part of hiring.",
            reply: 'That is hiring well: fair, fast and with what the team needs.',
          },
          gut: {
            text: 'That in the end you can tell right away who is good.',
            reply: 'Right away? That feeling is exactly what the scorecard corrects. Check the debrief.',
            effects: { 0: { text: 'You kept your gut feeling: it is the source of the biases the scorecard avoids.' } },
          },
        },
      },
    },
    docs: {
      ficha_manager: FICHA_QA_MANAGER_EN,
      hiring_guide: {
        title: 'How we hire at Kobalto',
        updatedLabel: 'Andrea Gil · People',
        body: `## Profile
- What the team needs, in observable criteria.
- Nothing that does not predict the work: degrees, years or specific tools.

## Interview
- Same questions, realistic exercise and a scorecard with a scale.
- Each interviewer scores separately before the debate.
- Whoever has a relationship with a candidate does not evaluate them.

## Decision and offer
- At the debate evidence rules.
- Answer within 48 hours at most.
- Onboarding: buddy, 30-60-90 day plan and first 1:1 with their lead.`,
      },
    },
    bugs: {
      'C-RUIDO': {
        title: 'Each interviewer measures something different and the process again takes seven weeks',
        explanation: 'Without a clear profile, scorecard or short process, the debate is about opinions and candidates leave.',
        technique: 'Profile from what is missing, structured interview and two interviews in a week.',
      },
      'C-SESGO': {
        title: "You discard the best candidate for not having “the usual profile”",
        explanation: "An impression of affinity weighs more than the scorecard's evidence.",
        technique: 'Ask “what evidence do we have?” and go back to the scorecard.',
      },
      'C-ENCAJE': {
        title: "The hires don't cover what the area is missing",
        explanation: 'Hiring by recommendation or by CV, and not by what the scorecard measures against the profile.',
        technique: 'Decide with the scorecard: Ana, Javier and Rocío.',
      },
      'C-INTERES': {
        title: 'The team believes Ana got in for being a friend of Sergio',
        explanation: 'An unmanaged conflict of interest stains a good hire.',
        technique: 'Set the interviewer aside and record it.',
      },
      'C-CTO': {
        title: "Raúl feels his recommendation was dismissed without explanation",
        explanation: 'A “no” without data sounds personal.',
        technique: 'Say no with the same scorecard and offer an alternative.',
      },
      'C-LENTO': {
        title: 'Ana accepts another offer while you were waiting',
        explanation: 'Good candidates have other offers and do not wait.',
        technique: 'Same-day offer and onboarding ready.',
      },
    },
    prevention: {
      title: 'Three months later',
      intro: 'A hire is measured when the person is already working with the team.',
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that arrived',
      rules: {
        0: { label: 'Profile and process', explanation: 'From what was missing, with a scorecard, realistic exercise and two interviews in a week.' },
        1: { label: 'Evidence, not impressions', explanation: "Rocío, valued by the scorecard and not by her CV." },
        2: { label: 'Hires that fit', explanation: 'Automation, performance and business with support for a junior.' },
        3: { label: 'Conflict of interest managed', explanation: "Sergio didn't evaluate his friend and it was recorded." },
        4: { label: '“No” with data', explanation: 'Raúl understands the decision and Marcos receives feedback.' },
        5: { label: 'Offer and onboarding', explanation: 'Same-day answer, buddy, 30-60-90 plan and first 1:1.' },
      },
    },
    concepts: {
      role_qa_manager: {
        title: 'Responsibilities of the QA Manager',
        summary: 'Several teams and their leads: hiring, capacity, budget and careers. Measured by capacity, retention and how their leads grow.',
      },
      hiring_profile: {
        title: 'Profile from the needs',
        summary: "What the team is missing, in observable criteria, without filters that don't predict the work.",
      },
      structured_interview: {
        title: 'Structured interview',
        summary: 'Same questions, realistic exercise, scorecard with a scale and individual scoring before the debate.',
      },
      interview_bias: {
        title: 'Biases in hiring',
        summary: 'Affinity, halo, first impression and conflicts of interest. Antidote: the scorecard’s evidence.',
      },
      fair_process: {
        title: 'Fair process',
        summary: 'The same process for everyone, including those who are recommended.',
      },
      say_no_with_data: {
        title: 'Saying no with data',
        summary: 'The same scorecard, the good acknowledged, what was missing against the profile and an alternative.',
      },
      onboarding_plan: {
        title: 'Offer and onboarding',
        summary: 'Fast answer, buddy, 30-60-90 day plan and first 1:1 with their lead.',
      },
    },
    seniorTips: [
      'Profile: API in the pipeline, performance, explaining risks and supporting a junior. No degrees, years, exact tool or “fit”.',
      'Structured interview with a realistic exercise; two interviews in a week.',
      'To Andrea: Marcos, same process. To Sergio: he does not interview his friend and it is recorded.',
      'At the debate: “what evidence do we have?” and go back to the scorecard.',
      'Decision: Ana, Javier and Rocío; Marcos and Luis, no.',
      'To Raúl: the same scorecard, the good acknowledged and an alternative for Marcos. To Andrea: offer today and onboarding ready.',
    ],
    lessons: {
      profile: {
        question: 'How do I define the profile of a vacancy?',
        body: `From **what the team is missing**, not from the usual job ad:
- What can nobody do? (here, performance)
- What is left undone? (automation in the pipeline)
- What does everyone else need? (supporting a junior, explaining risks)

Out with the filters that do not predict the work: degrees, inflated years, “knows our tool” (learned in weeks) or an undefined “must fit”.`,
      },
      structured: {
        question: 'What is a structured interview?',
        body: `- **The same questions** for all candidates.
- **A realistic exercise**, similar to the work (reviewing and extending a suite), not riddles.
- **A scorecard** with the profile criteria and a scale (1 to 4) with examples of each level.
- **Each interviewer scores separately** before the debate, so they do not influence each other.

And fast: two interviews in a week and an answer within 48 hours.`,
      },
      bias: {
        question: 'What biases appear when hiring?',
        body: `- **Affinity:** we like those who resemble us (“not the usual profile”).
- **Halo:** one good thing (a brilliant conversation) colors everything else.
- **First impression:** early nerves weigh more than the exercise.
- **Conflict of interest:** an interviewer who is a friend of the candidate.

Antidotes: scorecard, individual scoring, the question “what evidence do we have?” and setting aside whoever has a conflict.`,
      },
      fair: {
        question: 'An executive recommends someone to me. What do I do?',
        body: `The recommendation is welcome: it is a good source of candidates. But **the same process and the same scorecard** as the rest.

Skipping the process is unfair to the others and to the candidate himself: if he gets in without being evaluated, the team will know. And discarding him because of who recommended him is also unfair.`,
      },
      no: {
        question: 'How do I say no to someone with power?',
        body: `- **With the data from the same scorecard** you used for everyone.
- Acknowledge the good: “he communicates very well”.
- Explain what was missing against what the team needs.
- Offer an alternative: feedback for the candidate or a fit in another position.

“He didn't fit” sounds personal. A data point compared with the rest does not.`,
      },
      onboarding: {
        question: 'Does hiring end with the signature?',
        body: `No. Good candidates have other offers: **a fast answer**, the same day if you can.

And **onboarding** is part of hiring:
- a **buddy** from their team;
- a **30, 60 and 90-day plan**;
- the **first 1:1 with their lead** on the first day.

Without that, a good hire takes months to show.`,
      },
    },
    quiz: {
      pre: {
        g8pre_profile: {
          question: 'Where does the profile of a vacancy come from?',
          options: ['From the previous ad', 'From what the team is missing', 'From what the CTO asks for', 'From the profiles available in the market'],
          explanation: "The profile covers the team's real gaps.",
        },
        g8pre_structured: {
          question: 'What makes an interview comparable between candidates?',
          options: ['That the same person always does it', 'That it lasts long', 'Same questions, realistic exercise and a scorecard with criteria', 'That it is informal'],
          explanation: 'The same instrument for everyone.',
        },
        g8pre_bias: {
          question: 'An interviewer says of a candidate: “she’s not the usual profile”. Which bias may be present?',
          options: ['None', 'Technical confirmation bias', 'Salary anchoring bias', 'Affinity bias'],
          explanation: 'Preferring those who resemble us.',
        },
        g8pre_fair: {
          question: 'The CTO recommends a candidate. What do you do?',
          options: ['Include him in the same process as the rest', 'Make him the offer directly', 'Discard him', 'Give him an easier interview'],
          explanation: 'Same process and same scorecard.',
        },
        g8pre_no: {
          question: 'How do you explain to the CTO that you are not hiring his recommended candidate?',
          options: ['“He didn’t fit”', 'With the scorecard data against what the team needs, and an alternative for the candidate', 'You don’t explain it', '“People didn’t want to”'],
          explanation: 'Comparable data and respect.',
        },
        g8pre_onb: {
          question: 'Your three chosen candidates have other offers. When do you answer?',
          options: ['Next week', 'When you close more candidates', 'Today, with onboarding prepared', 'When People says so'],
          explanation: 'Good candidates do not wait.',
        },
      },
      post: {
        g8post_profile: {
          question: 'Which requirement should you NOT put in the profile?',
          options: ['Automates API tests in the pipeline', 'Explains risks to the business', 'Supports juniors', 'Knows exactly our tool'],
          explanation: 'It is learned in weeks.',
        },
        g8post_structured: {
          question: 'Why does each interviewer score separately before the debate?',
          options: ['So opinions do not spread', 'To go faster', 'So the most experienced decides', 'No need'],
          explanation: 'It prevents one voice from dragging the rest.',
        },
        g8post_bias: {
          question: 'A lead on the panel is a friend of a candidate. What do you do?',
          options: ['Nothing', 'Have him interview her, he knows her best', 'Have someone else interview her and record it', 'Discard the candidate'],
          explanation: 'Manage the conflict of interest.',
        },
        g8post_fair: {
          question: 'Why not skip the process for someone recommended?',
          options: ['Because People says so', 'It is unfair to the others and to the candidate himself', 'Because it takes less time', 'It does not matter if he is good'],
          explanation: 'A fair process protects everyone.',
        },
        g8post_no: {
          question: 'What makes your “no” to the CTO more credible?',
          options: ['Talking about his personality', 'Saying it quickly', 'Having someone else say it', 'The same scorecard used with everyone'],
          explanation: 'Comparable and objective.',
        },
        g8post_onb: {
          question: 'What does a good onboarding include?',
          options: ['Buddy, 30-60-90 day plan and first 1:1 with their lead', 'Access to the laptop', 'Reading the wiki', 'An online course'],
          explanation: 'Support, goals and a relationship with their lead.',
        },
      },
    },
  },
  kobaltoTeamsWorldEn({
    laura: 'VP Engineering · your manager',
    raul: 'CTO',
    andrea: 'People Partner · People',
    sergio: 'QA Lead · Payments · your team',
    hector: 'QA Lead · Cards · your team',
  }),
)
