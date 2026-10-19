import type { QuizQuestion } from '../../../../engine/types'

/** Pre- and post-test for mission 8 (The third party that doesn’t respond). */
export const m07QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k7pre_why',
      conceptId: 'dobles',
      question: 'The card processor’s sandbox is down and doesn’t let you trigger errors. What lets you keep testing?',
      options: ['Nothing: you have to wait', 'A mock of the processor that responds with what you need', 'Testing in production', 'Removing the call to the processor'],
      correct: 1,
      explanation: 'A test double takes the third party’s place and responds on demand.',
    },
    {
      id: 'k7pre_order',
      conceptId: 'mock',
      question: 'In a Karate mock, two scenarios meet the condition. Which one responds?',
      options: ['The last one', 'The first one in the file', 'Both', 'Neither: it errors'],
      correct: 1,
      explanation: 'The first one that holds wins: specific cases at the top and the catch-all at the end.',
    },
    {
      id: 'k7pre_slow',
      conceptId: 'mock',
      question: 'How does a Karate mock simulate a third party that takes 5 seconds?',
      options: ['* def responseDelay = 5000', '* sleep 5000', '* def responseStatus = 504', 'It can’t'],
      correct: 0,
      explanation: 'responseDelay delays the mock’s response (in ms).',
    },
    {
      id: 'k7pre_timeout',
      conceptId: 'dobles',
      question: 'The processor doesn’t respond in time. What should a payments service do?',
      options: ['Approve the payment so as not to bother the customer', 'Fail the payment (e.g. 504) without approving it', 'Retry indefinitely', 'Return an empty 200'],
      correct: 1,
      explanation: 'Without the processor’s authorization, the payment can’t be treated as approved.',
    },
  ],
  post: [
    {
      id: 'k7post_bind',
      conceptId: 'mock',
      question: 'karate.start with port: 8090 in the Background: the second scenario fails with BindException. Why?',
      options: ['The mock has an error', 'The Background runs for every scenario and tries to take the port again', 'Port 8090 is forbidden', '@ignore is missing'],
      correct: 1,
      explanation: 'Start it once per feature with callonce.',
    },
    {
      id: 'k7post_contract',
      conceptId: 'dobles',
      question: 'Your mock approves everything it receives and the suite is green. What’s the risk?',
      options: ['None', 'That we send requests the real third party would reject and we don’t see it', 'That the mock is slow', 'That the runner fails'],
      correct: 1,
      explanation: 'The mock must validate the request as the third party would (karate.match with a schema).',
    },
    {
      id: 'k7post_match',
      conceptId: 'dobles',
      question: 'What does karate.match(request, schema) return?',
      options: ['true or false', 'An object with pass and message', 'It throws an error if it doesn’t match', 'The schema'],
      correct: 1,
      explanation: 'It returns { pass, message } without failing the scenario: ideal for mock conditions.',
    },
    {
      id: 'k7post_real',
      conceptId: 'dobles',
      question: 'With every case covered by mocks, what’s missing before launch?',
      options: ['Nothing', 'A test against the real service confirming that the mock tells the truth', 'More mocks', 'Deleting the mocks'],
      correct: 1,
      explanation: 'The mock represents what we believe about the third party; it has to be checked against the real one.',
    },
  ],
}
