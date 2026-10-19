import type { QuizQuestion } from '../../../../engine/types'

/** Quiz before and after mission 5 (Data-driven). English translation of ../m04-quiz.ts. */
export const m04QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k4pre_outline',
      conceptId: 'outline',
      question: 'A Scenario Outline with 6 rows in Examples: how many scenarios does Karate run?',
      options: ['1', '6', '7', 'It depends on the Background'],
      correct: 1,
      explanation: 'One scenario per row of the table.',
    },
    {
      id: 'k4pre_bva',
      conceptId: 'boundaries',
      question: 'Rule: “up to €1,000 per transfer”. Which pair of amounts tests it best?',
      options: ['500 and 5,000', '1,000 and 1,000.01', '0 and 10,000', '999 and 1,001'],
      correct: 1,
      explanation: 'Just inside and just outside the edge: that’s where a > instead of >= shows up.',
    },
    {
      id: 'k4pre_text',
      conceptId: 'outline',
      question: 'In an Examples table, the cell | 500 | in the amount column arrives as…',
      options: ['The number 500', 'The text "500"', 'null', 'It depends on the API'],
      correct: 1,
      explanation: 'Cells are text unless the column name ends in ! (amount!).',
    },
    {
      id: 'k4pre_copy',
      conceptId: 'outline',
      question: 'You have 8 identical scenarios that only change the amount. What do you do?',
      options: ['Nothing, they read better that way', 'A Scenario Outline with an 8-row table', 'A while loop in JavaScript', 'Delete 7 of them'],
      correct: 1,
      explanation: 'The steps once, the data in the table.',
    },
  ],
  post: [
    {
      id: 'k4post_dynamic',
      conceptId: 'outline',
      question: "What does “Examples: | read('data/casos.json') |” do?",
      options: ['Reads the file as text into a variable', 'Uses each object in the JSON as a row of the outline', 'Validates the JSON', 'Nothing: it isn’t valid syntax'],
      correct: 1,
      explanation: 'Dynamic Examples: one row per object, each key a variable with its type.',
    },
    {
      id: 'k4post_concept',
      conceptId: 'boundaries',
      question: 'The concept allows up to 140 characters. Which lengths do you test?',
      options: ['10 and 500', '140 and 141', '0 and 140', 'Only 140'],
      correct: 1,
      explanation: 'The exact edge (140, accepted) and the first value outside it (141, rejected).',
    },
    {
      id: 'k4post_random',
      conceptId: 'boundaries',
      question: 'Why not generate random amounts on every run?',
      options: ['Karate can’t do it', 'If one fails it’s hard to reproduce, and the exact edge may never come up', 'It’s always slower', 'Because the API doesn’t accept decimals'],
      correct: 1,
      explanation: 'A few well-chosen, deterministic data points find more and can always be reproduced.',
    },
    {
      id: 'k4post_merge',
      conceptId: 'outline',
      question: 'What is karate.merge(body, patch) for in a table of negative cases?',
      options: ['To delete the body', 'To change only each case’s fields on top of a valid body', 'To compare two JSON documents', 'To read a file'],
      correct: 1,
      explanation: 'Each row changes one field; the rest of the body is valid, so the error you get is the one you’re after.',
    },
  ],
}
