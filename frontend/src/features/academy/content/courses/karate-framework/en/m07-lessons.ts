import type { Lesson } from '../../../../engine/types'

/** Sergio’s micro-lessons (Karate course · mission 8). */
export const m07LessonsEn: Lesson[] = [
  {
    id: 'mock',
    question: 'How do you write a mock in Karate?',
    conceptId: 'mock',
    cost: 5,
    body: `It’s a \`.feature\` in which **each Scenario is a condition** on the incoming request:
\`\`\`
Scenario: pathMatches('/v2/authorizations') && methodIs('post')
  * def response = { result: 'APPROVED', authCode: 'A1B2C3' }
\`\`\`
**The first one that holds** wins. Inside you have \`request\`, \`requestHeaders\`, \`pathParams\`… and you respond with \`response\`, \`responseStatus\` (200 by default), \`responseHeaders\` and \`responseDelay\`.

A \`Scenario:\` with no condition, at the end, catches everything else. And \`@ignore\` on the mock, so the runner doesn’t run it as a test.`,
  },
  {
    id: 'start',
    question: 'How do I start the mock from a test?',
    conceptId: 'mock',
    cost: 3,
    body: `With **karate.start**:
\`\`\`
* def mock = karate.start({ mock: 'mocks/paynexo.feature', port: 8090 })
\`\`\`
Without \`port\`, it picks a free one (\`mock.port\`). With a fixed port —the one the service under test expects— it can only be started **once**: if you put it as is in the Background, the second scenario fails with *BindException*. That’s why it’s wrapped in a function and called with \`callonce\`.`,
  },
  {
    id: 'casos',
    question: 'How do I trigger each response from the third party?',
    conceptId: 'mock',
    cost: 5,
    body: `Pick a piece of the request you control from the test (the merchant, the amount, a header) and write one condition per case:
\`\`\`
Scenario: pathMatches('/v2/authorizations') && request.merchant == 'CAIDO'
  * def responseStatus = 503
Scenario: pathMatches('/v2/authorizations') && request.merchant == 'LENTO'
  * def responseDelay = 5000
\`\`\`
That way a \`Scenario Outline\` walks through every path: approved, declined, error, slowness.`,
  },
  {
    id: 'contrato',
    question: 'Why validate the request in the mock?',
    conceptId: 'dobles',
    cost: 5,
    body: `A mock that approves everything hides the errors in **what we send**. If the real third party would reject the request, your mock must reject it too:
\`\`\`
Background:
  * def authRequest = { amount: '#? _ > 0 && _ % 1 == 0', currency: '#regex [A-Z]{3}', … }
Scenario: pathMatches('/v2/authorizations') && !karate.match(request, authRequest).pass
  * def responseStatus = 400
\`\`\`
\`karate.match(actual, expected)\` returns \`{ pass, message }\`: the same match as always, without failing anything.`,
  },
  {
    id: 'dobles',
    question: 'Does a mock replace the real service?',
    conceptId: 'dobles',
    cost: 3,
    body: `No. The mock responds with **what you believe** the third party does. It’s for what the real one won’t let you do: rare cases on demand, speed, independence from its availability.

But it has to be checked: a short test against the real sandbox (or a shared contract) confirms that the mock tells the truth. Without that, you can have a green suite against an imaginary Paynexo.`,
  },
]
