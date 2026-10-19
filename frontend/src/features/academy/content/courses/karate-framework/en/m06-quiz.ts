import type { QuizQuestion } from '../../../../engine/types'

/** Pre- and post-test for mission 7 (When everything fails). */
export const m06QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k6pre_code',
      conceptId: 'negativos',
      question: 'In a negative case, what should you check besides the status?',
      options: ['Nothing else', 'The error code (two different errors can share a status)', 'Only the response time', 'That the body is empty'],
      correct: 1,
      explanation: 'ACCOUNT_NOT_FOUND and TRANSFER_NOT_FOUND are both 404: the code tells which one it is.',
    },
    {
      id: 'k6pre_opt',
      conceptId: 'errores',
      question: "What does “field: '##string'” mean in a schema?",
      options: ['That field is mandatory', 'That field is optional; if present, it’s a string', 'That field is null', 'That field is a number'],
      correct: 1,
      explanation: 'With ## the field can be missing or null.',
    },
    {
      id: 'k6pre_async',
      conceptId: 'retry',
      question: 'An API responds 202 and processes the operation later. How does Karate test it properly?',
      options: ['With a 30 s sleep', 'Polling with retry until up to the final status', 'Checking only the 202', 'It can’t be tested'],
      correct: 1,
      explanation: 'retry until polls at an interval until the condition holds, with a maximum number of attempts.',
    },
    {
      id: 'k6pre_500',
      conceptId: 'negativos',
      question: 'An amount sent as text returns 500. What should it return?',
      options: ['500 is fine: it’s an error', 'A validation 400, stating the field', '200, ignoring the amount', '404'],
      correct: 1,
      explanation: 'Bad input from the client is a 4xx; a 5xx means a server failure.',
    },
  ],
  post: [
    {
      id: 'k6post_default',
      conceptId: 'retry',
      question: 'Without configuring anything, how long does retry until wait at most?',
      options: ['Forever', '3 attempts every 3 s (about 6 s)', '10 attempts every second', '1 attempt'],
      correct: 1,
      explanation: 'By default count 3 and interval 3000; you change it with configure retry.',
    },
    {
      id: 'k6post_too_many',
      conceptId: 'retry',
      question: '“too many retry attempts: 10” on a transfer to another bank, while an internal one passes. What do you do?',
      options: ['Raise the count to 100', 'Look at the last response: if it’s still PROCESSING beyond what the contract says, it’s a bug', 'Add a sleep', 'Remove the test'],
      correct: 1,
      explanation: 'If it doesn’t finish within the contract’s time, the problem is in the API, not in the wait.',
    },
    {
      id: 'k6post_schema',
      conceptId: 'errores',
      question: 'A 404 arrives as { timestamp, status, error, path } without code or traceId. Is it a bug?',
      options: ['No: the status is 404, which is what’s expected', 'Yes: it breaks the contract’s common error format', 'Only if the message is in English', 'It depends on the partner'],
      correct: 1,
      explanation: 'Partners read code and traceId: a different format breaks the contract.',
    },
    {
      id: 'k6post_header',
      conceptId: 'errores',
      question: 'How do you check that a 503 includes Retry-After?',
      options: ["match response.Retry-After == '#present'", "match responseHeaders['Retry-After'][0] == '#regex [0-9]+'", 'status 503 is enough', "header Retry-After = '#number'"],
      correct: 1,
      explanation: 'Response headers are in responseHeaders, each one as a list.',
    },
  ],
}
