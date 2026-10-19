import type { QuizQuestion } from '../../../../engine/types'

/** Quiz before and after mission 3 (One test, three environments). English translation of ../m02-quiz.ts. */
export const m02QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k2pre_when',
      conceptId: 'config',
      question: 'When does Karate run the function in karate-config.js?',
      options: ['Once, when Maven starts', 'Before every scenario', 'Only if a scenario fails', 'When it is called with read()'],
      correct: 1,
      explanation: 'It runs before every scenario, and what it returns becomes global variables.',
    },
    {
      id: 'k2pre_env',
      conceptId: 'config',
      question: 'How do you tell the suite which environment to run in?',
      options: ['By changing the URL in every feature', 'With -Dkarate.env=pre at run time', 'With a @pre tag on every scenario', 'By creating another karate-config.js'],
      correct: 1,
      explanation: 'karate.env arrives as a system property and the config decides what changes.',
    },
    {
      id: 'k2pre_secret',
      conceptId: 'secrets',
      question: 'Where should the pre-production API key live?',
      options: ['In karate-config.js, so nobody forgets it', 'In a comment in the feature', 'In the pipeline’s secrets manager, which passes it at run time', 'In the README'],
      correct: 2,
      explanation: 'Secrets never go into the repository: they are injected at run time.',
    },
    {
      id: 'k2pre_headers',
      conceptId: 'headers',
      question: 'What does “configure headers” do?',
      options: ['Adds headers to every following request', 'Checks the response headers', 'Only affects the next request', 'Deletes every header'],
      correct: 0,
      explanation: 'header is for one request; configure headers, for all of them.',
    },
  ],
  post: [
    {
      id: 'k2post_data',
      conceptId: 'env_data',
      question: 'The suite passes in sandbox, and in pre the detail of ACC-1001 fails with 404. What is most likely?',
      options: ['A bug in pre', 'The account id is hard-coded in the feature and does not exist in pre', 'The key is wrong', 'Karate does not support pre'],
      correct: 1,
      explanation: 'Each environment has its own data: the id must come from the config for each environment.',
    },
    {
      id: 'k2post_leak',
      conceptId: 'secrets',
      question: 'Someone pushes the pre key to the repository and deletes it the next day. What should you do?',
      options: ['Nothing: it is gone', 'Rotate the key: it is still in the Git history', 'Make the repository private', 'Rename the variable'],
      correct: 1,
      explanation: 'Whatever goes into Git stays in the history. An exposed key gets rotated.',
    },
    {
      id: 'k2post_null',
      conceptId: 'headers',
      question: 'The headers are configured with x-api-key. How do you test a request without the key?',
      options: ['By deleting the config', 'header x-api-key = null in that scenario', "header x-api-key = ''", 'You can’t'],
      correct: 1,
      explanation: 'A null value removes the header for that request only.',
    },
    {
      id: 'k2post_resp',
      conceptId: 'headers',
      question: 'How do you read the x-correlation-id header from the response?',
      options: ["response['x-correlation-id']", "responseHeaders['x-correlation-id'][0]", 'header x-correlation-id', "karate.env['x-correlation-id']"],
      correct: 1,
      explanation: 'responseHeaders stores each header as a list: [0] is the first value.',
    },
  ],
}
