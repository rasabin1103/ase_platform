import type { QuizQuestion } from '../../../../engine/types'

/** Quiz before and after mission 1 (Hello, Karate). English translation of ../m00-quiz.ts. */
export const m00QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k0pre_method',
      conceptId: 'feature_anatomy',
      question: 'In a Karate scenario, which step actually sends the HTTP request?',
      options: ['path', 'url', 'method', 'request'],
      correct: 2,
      explanation: 'url, path, param and request only prepare the request; method fires it.',
    },
    {
      id: 'k0pre_status',
      conceptId: 'assertions',
      question: 'A scenario ends with “Then status 200” and nothing else. What does it guarantee?',
      options: ['That the response is correct', 'Only that the HTTP code is 200', 'That the JSON meets the contract', 'Nothing: status checks nothing'],
      correct: 1,
      explanation: 'status only looks at the code. A 200 with wrong data would pass too: a match is missing.',
    },
    {
      id: 'k0pre_bg',
      conceptId: 'background',
      question: 'When do the Background steps run?',
      options: ['Once at the start of the file', 'Before each scenario', 'After each scenario', 'Only if a scenario fails'],
      correct: 1,
      explanation: 'The Background repeats before each scenario, which keeps every scenario independent.',
    },
    {
      id: 'k0pre_gwt',
      conceptId: 'feature_anatomy',
      question: "Changing “Given path 'health'” to “* path 'health'”…",
      options: ['breaks the test', 'changes the execution order', 'changes nothing: Gherkin keywords are for readability', 'turns the step into a comment'],
      correct: 2,
      explanation: 'Given, When, Then, And, But and * are equivalent in Karate.',
    },
  ],
  post: [
    {
      id: 'k0post_response',
      conceptId: 'feature_anatomy',
      question: 'After “When method get”, where is the response body?',
      options: ['In the request variable', 'In the response variable', 'You have to read it with print', 'In responseStatus'],
      correct: 1,
      explanation: 'response holds the body (already parsed JSON) and responseStatus the code.',
    },
    {
      id: 'k0post_red',
      conceptId: 'red_test',
      question: 'The wiki says ACC-1003 is BLOCKED. Your test expects BLOCKED and the API returns ACTIVE. What do you do?',
      options: ['Change the test to ACTIVE so it passes', 'Delete the scenario', 'Report a bug with the scenario as evidence and leave the test as it is', 'Tag it @ignore until Thursday'],
      correct: 2,
      explanation: 'The test asks for what the specification says: the API is at fault. The test stays red until the fix.',
    },
    {
      id: 'k0post_baseurl',
      conceptId: 'background',
      question: 'Why “url baseUrl” instead of the full URL in each scenario?',
      options: ['Because Karate does not accept full URLs', 'So the same suite can run against another environment without touching the tests', 'Because it is faster', 'Because baseUrl validates the certificate'],
      correct: 1,
      explanation: 'baseUrl comes from karate-config.js and changes per environment; the tests do not.',
    },
    {
      id: 'k0post_path',
      conceptId: 'feature_anatomy',
      question: "With “url baseUrl” (https://api.kobalto.test/v1), which URL does “path 'accounts', 'ACC-1001'” call?",
      options: ['https://api.kobalto.test/accounts/ACC-1001', 'https://api.kobalto.test/v1/accounts,ACC-1001', 'https://api.kobalto.test/v1/accounts/ACC-1001', 'https://api.kobalto.test/v1?accounts=ACC-1001'],
      correct: 2,
      explanation: 'Each path argument is a segment appended to the url with “/”.',
    },
  ],
}
