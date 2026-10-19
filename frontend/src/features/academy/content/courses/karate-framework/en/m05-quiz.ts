import type { QuizQuestion } from '../../../../engine/types'

/** Quiz before and after mission 6 (Tokens and reuse). English translation of ../m05-quiz.ts. */
export const m05QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k5pre_call',
      conceptId: 'call',
      question: "What does “* def auth = call read('login.feature')” return?",
      options: ['Only the status code', 'An object with the variables of the called feature', 'The text of the feature', 'Nothing: call doesn’t return anything'],
      correct: 1,
      explanation: 'call returns all the variables of the called feature: auth.token, auth.response…',
    },
    {
      id: 'k5pre_once',
      conceptId: 'callonce',
      question: 'A feature with 10 scenarios uses “callonce read(\'login.feature\')” in the Background. How many times does the login run?',
      options: ['10', '1', '0', '11'],
      correct: 1,
      explanation: 'callonce runs once per feature and reuses the result.',
    },
    {
      id: 'k5pre_ignore',
      conceptId: 'call',
      question: 'Why do you tag a reusable login feature with @ignore?',
      options: ['So it can’t be called', 'So it doesn’t run on its own like any other test', 'To make it faster', 'To hide the secret'],
      correct: 1,
      explanation: '@ignore excludes it from the normal run; call still executes it.',
    },
    {
      id: 'k5pre_scope',
      conceptId: 'auth',
      question: 'A valid token with the accounts:read scope tries to create a transfer. What should the API answer?',
      options: ['201', '401', '403', '500'],
      correct: 2,
      explanation: '403: the token is valid (so not 401) but it has no permission for that.',
    },
  ],
  post: [
    {
      id: 'k5post_args',
      conceptId: 'call',
      question: 'How do you ask the login for a token with a specific scope?',
      options: ["* call read('login.feature') scope=accounts:read", "* def ro = call read('login.feature') { scope: 'accounts:read' }", "* def scope = call 'accounts:read'", 'You can’t: the login is fixed'],
      correct: 1,
      explanation: 'Arguments go in a JSON object after the call.',
    },
    {
      id: 'k5post_429',
      conceptId: 'callonce',
      question: 'The suite fails with 429 TOO_MANY_REQUESTS on /auth/token. What do you do?',
      options: ['Report a critical bug', 'Request fewer tokens: callonce in the Background', 'Add waits between scenarios', 'Remove the tests'],
      correct: 1,
      explanation: 'It’s the documented limit: the suite requests too many tokens.',
    },
    {
      id: 'k5post_revoke',
      conceptId: 'callonce',
      question: 'To test revocation, why not use the shared callonce token?',
      options: ['Because callonce doesn’t return a token', 'Because revoking it breaks the other scenarios that use it', 'Because it’s slower', 'It makes no difference'],
      correct: 1,
      explanation: 'A scenario that destroys shared data breaks the others: request a token of its own with call.',
    },
    {
      id: 'k5post_500',
      conceptId: 'auth',
      question: 'With a wrong secret, the API answers 500 with “NullPointerException”. Is that right?',
      options: ['Yes, it’s an error', 'No: it should be a clean 401, with no internal stack traces', 'Yes, if the message is clear', 'It depends on the partner'],
      correct: 1,
      explanation: 'Bad credentials are an expected 401; a 500 with stack traces also leaks internal details.',
    },
  ],
}
