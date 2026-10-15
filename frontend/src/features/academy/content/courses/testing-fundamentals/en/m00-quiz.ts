import type { QuizQuestion } from '../../../../engine/types'

/**
 * Pre- and post-mission quiz for mission 0 (English version). Same concepts,
 * different contexts, to measure whether the player transfers what they learned.
 */
export const m00QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'pre_partitions',
      conceptId: 'equivalence',
      question: 'A field accepts ages from 18 to 65. Which set of values covers one equivalence partition each?',
      options: ['18, 30 and 65', '10, 30 and 80', '1, 2, 3 and 4', 'Only 30, the typical value'],
      correct: 1,
      explanation: 'There are three groups: below (10), inside (30) and above (80). 18 and 65 are boundary values, not different partitions.',
    },
    {
      id: 'pre_boundaries',
      conceptId: 'boundary_values',
      question: 'A payment allows a maximum of €100 per transaction. Which pair of values best tests the upper boundary?',
      options: ['€50 and €100', '€99 and €200', '€100 and €100.01', '€0 and €100'],
      correct: 2,
      explanation: 'Right at the limit (€100, valid) and just outside it (€100.01, invalid): that is where «>» gets mixed up with «>=».',
    },
    {
      id: 'pre_static',
      conceptId: 'static_testing',
      question: 'An acceptance criterion says «the amount must be valid». What do you do first?',
      options: [
        'I test whatever seems reasonable to me',
        'I consider it tested if I don\'t see errors',
        'I wait for a customer to report it',
        'I ask the PO what exactly it means and write it down',
      ],
      correct: 3,
      explanation: 'An ambiguous requirement is a defect. Clarifying it before testing (static testing) is the cheapest option.',
    },
    {
      id: 'pre_report',
      conceptId: 'bug_anatomy',
      question: 'What is essential in a defect report?',
      options: [
        'Steps to reproduce it, expected result and actual result',
        'Who caused the error',
        'Just a screenshot',
        'Keep it short: «doesn\'t work»',
      ],
      correct: 0,
      explanation: 'If the developer cannot reproduce it, they cannot fix it. Steps, expected, actual and evidence.',
    },
    {
      id: 'pre_retest',
      conceptId: 'regression',
      question: 'The developer tells you a bug has been fixed. What do you do?',
      options: [
        'I close it: I trust the team',
        'I ask them to close it',
        'I re-test the case on the new build and repeat the related test cases',
        'I wait to see if it fails in production',
      ],
      correct: 2,
      explanation: 'QA opens and QA closes: re-test the failed case and run regression on the related ones, always on the new build.',
    },
    {
      id: 'pre_risk',
      conceptId: 'risk_based',
      question: 'You have one hour and five areas to test. How do you decide the order?',
      options: ['Alphabetical order', 'By likelihood of failure × impact', 'I start with the quickest', 'Whatever the developer says'],
      correct: 1,
      explanation: 'Risk-based testing: first whatever is most likely to fail and has the most impact if it fails.',
    },
  ],
  post: [
    {
      id: 'post_partitions',
      conceptId: 'equivalence',
      question: 'A «number of passengers» field accepts 1 to 9. Which values cover one partition each?',
      options: ['1, 5 and 9', '5, 5 and 5', '0, 5 and 12', '1, 2 and 3'],
      correct: 2,
      explanation: 'Below (0), inside (5) and above (12). 1 and 9 would be the boundary values.',
    },
    {
      id: 'post_boundaries',
      conceptId: 'boundary_values',
      question: 'A password accepts 8 to 20 characters. Which values do you test for the lower boundary?',
      options: ['7 and 8 characters', '8 and 20 characters', '1 and 100 characters', '10 and 15 characters'],
      correct: 0,
      explanation: 'Just outside (7, invalid) and right at the limit (8, valid).',
    },
    {
      id: 'post_static',
      conceptId: 'static_testing',
      question: 'The story says «the account limits are respected», without figures, and the wiki has some from months ago. What do you do?',
      options: [
        'I use the ones in the wiki',
        'I ask the PO for the exact figures before designing the test cases',
        'I test with random values',
        'I ignore it, it\'s not my job',
      ],
      correct: 1,
      explanation: 'Documentation can be out of date; the source of truth is the PO, and their answer must be recorded in the ticket.',
    },
    {
      id: 'post_report',
      conceptId: 'bug_anatomy',
      question: 'The developer cannot reproduce your bug. What is your report almost certainly missing?',
      options: ['A higher severity', 'A longer title', 'The exact steps with the data used, and the evidence', 'More context about the demo'],
      correct: 2,
      explanation: 'Exact data and evidence (the execution or the log) are what make it reproducible.',
    },
    {
      id: 'post_retest',
      conceptId: 'regression',
      question: 'After a fix to the decimal format, what else should you test besides the failed case?',
      options: [
        'Nothing else',
        'The test cases with decimals that worked before',
        'Only the login',
        'Nothing: I\'ll test in production',
      ],
      correct: 1,
      explanation: 'A change can break what used to work: that is a regression, and it is detected by repeating related test cases.',
    },
    {
      id: 'post_risk',
      conceptId: 'risk_based',
      question: 'In a payments app, with little time: what do you test first, the reference text or the amount with decimals?',
      options: [
        'The reference, it\'s quicker',
        'Both at the same time, superficially',
        'Neither: the developer tests it',
        'The amount: higher likelihood of failure and much more impact',
      ],
      correct: 3,
      explanation: 'The amount combines complex logic (high likelihood) with money (high impact).',
    },
  ],
}
