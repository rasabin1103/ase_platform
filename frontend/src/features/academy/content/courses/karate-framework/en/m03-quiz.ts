import type { QuizQuestion } from '../../../../engine/types'

/** Quiz before and after mission 4 (POST and chaining). English translation of ../m03-quiz.ts. */
export const m03QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k3pre_request',
      conceptId: 'payloads',
      question: 'In Karate, which step sets the JSON body of a POST?',
      options: ['body', 'request', 'json', 'payload'],
      correct: 1,
      explanation: 'request sets the body of the next request; method post sends it.',
    },
    {
      id: 'k3pre_embedded',
      conceptId: 'payloads',
      question: 'In a JSON file read with read(), what does "#(amount)" do?',
      options: ['Checks that amount is a number', 'Replaces it with the value of the amount variable', 'It’s a comment', 'Leaves it as literal text'],
      correct: 1,
      explanation: 'Embedded expressions are replaced by the value of the variable when the file is read.',
    },
    {
      id: 'k3pre_chain',
      conceptId: 'chaining',
      question: 'You have just created a transfer. How do you read it in the next step?',
      options: ['By copying the id from the console into the feature', "* def transferId = response.id and path 'transfers', transferId", 'With read() of the id', 'You can’t in the same scenario'],
      correct: 1,
      explanation: 'Save the value from the response with def and use it in the next request.',
    },
    {
      id: 'k3pre_409',
      conceptId: 'http_codes',
      question: 'Confirming a transfer that is already completed should respond…',
      options: ['200, again', '404', '409 Conflict', '500'],
      correct: 2,
      explanation: '409: the operation clashes with the current state of the resource.',
    },
  ],
  post: [
    {
      id: 'k3post_get',
      conceptId: 'chaining',
      question: 'The POST returns 201 with amount 150.75. Why do a GET of the transfer afterwards?',
      options: ['There’s no need', 'To check what was really stored, which may not match the POST response', 'To make the test take longer', 'Because Karate requires it'],
      correct: 1,
      explanation: 'The POST response may echo what you sent; the GET shows what was actually stored.',
    },
    {
      id: 'k3post_effect',
      conceptId: 'chaining',
      question: 'What is the best proof that confirming a transfer works?',
      options: ['That it responds 200', "That the status changes to 'COMPLETED'", 'That the account balance goes down by exactly the amount', 'That the response takes less than 1 s'],
      correct: 2,
      explanation: 'The effect on the balance is what matters to the customer; the others are necessary but not sufficient.',
    },
    {
      id: 'k3post_set',
      conceptId: 'payloads',
      question: 'You want to test “not enough balance” with the same JSON as the happy path. What do you do?',
      options: ['Copy the file and change the amount', '* set body.amount = 999999 before request', 'Write another feature', 'Change the account balance'],
      correct: 1,
      explanation: 'set changes one field of the body without duplicating the file.',
    },
    {
      id: 'k3post_422',
      conceptId: 'http_codes',
      question: 'A transfer above the balance, with a well-formed body, should respond…',
      options: ['400 Bad Request', '422 Unprocessable Entity', '201 Created', '409 Conflict'],
      correct: 1,
      explanation: '422: the request is valid but the business rule does not allow it.',
    },
  ],
}
