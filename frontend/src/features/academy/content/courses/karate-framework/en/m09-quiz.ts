import type { QuizQuestion } from '../../../../engine/types'

/** Quiz before and after mission 10 (Your framework). English translation of ../m09-quiz.ts. */
export const m09QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k9pre_once',
      conceptId: 'callsingle',
      question: 'Six features use callonce for the login. How many logins happen in one run?',
      options: ['1', '6', 'One per scenario', 'None'],
      correct: 1,
      explanation: 'callonce is once per feature; for once per run there is karate.callSingle.',
    },
    {
      id: 'k9pre_print',
      conceptId: 'revision',
      question: 'A scenario does a GET, checks status 200 and does print response. What does it catch if the API returns wrong data?',
      options: ['Everything', 'Nothing: it only fails if the status changes', 'Whatever shows up in the print', 'The types of the fields'],
      correct: 1,
      explanation: 'print checks nothing: only a match on the body catches wrong data.',
    },
    {
      id: 'k9pre_schema',
      conceptId: 'estructura',
      question: 'The same schema is copied into five features. Best option?',
      options: ['Leave it as it is', 'A JSON file loaded with read() from each feature', 'Copy it into karate-config.js as text', 'Remove the schemas'],
      correct: 1,
      explanation: 'A single file: if the contract changes, you change it in one place.',
    },
    {
      id: 'k9pre_token',
      conceptId: 'revision',
      question: 'A test has a token copied from the console. What is the problem?',
      options: ['None', 'It expires, and it is also a secret in the repository', 'It is slower', 'It does not work in parallel'],
      correct: 1,
      explanation: 'It works today on one machine; tomorrow it gives 401. And a secret does not belong in the code.',
    },
  ],
  post: [
    {
      id: 'k9post_single',
      conceptId: 'callsingle',
      question: 'Where do you normally put karate.callSingle for the login?',
      options: ['In every Background', 'In karate-config.js, passing it the configuration', 'In the Java runner', 'In the login feature'],
      correct: 1,
      explanation: 'karate-config.js runs before every scenario, and the cache makes the login happen only once.',
    },
    {
      id: 'k9post_util',
      conceptId: 'estructura',
      question: 'What makes a feature a good utility?',
      options: ['Having many scenarios', 'Having @ignore, doing one thing and taking arguments', 'Being in the runner’s folder', 'Using print'],
      correct: 1,
      explanation: 'A small piece that does not run on its own and is parameterized.',
    },
    {
      id: 'k9post_review',
      conceptId: 'revision',
      question: 'When reviewing, which question is the most useful?',
      options: ['Does it pass on your machine?', 'What would fail if the API broke?', 'How many scenarios does it have?', 'Does it use the latest Karate version?'],
      correct: 1,
      explanation: 'A test that cannot fail protects nothing.',
    },
    {
      id: 'k9post_conv',
      conceptId: 'convenciones',
      question: 'Which convention makes the pipeline jobs work?',
      options: ['Names in English', 'Every scenario has @smoke or @regression', 'One feature per person', 'Comments on every step'],
      correct: 1,
      explanation: 'The runners pick scenarios by tags: a scenario without a tag can be left out.',
    },
  ],
}
