import type { Lesson } from '../../../../engine/types'

/** Sergio’s micro-lessons (Karate course · mission 7). */
export const m06LessonsEn: Lesson[] = [
  {
    id: 'negativos',
    question: 'Which negative cases are worth automating?',
    conceptId: 'negativos',
    cost: 5,
    body: `The ones a partner can actually trigger, one per rule:
- **Format** (400): malformed ids, missing mandatory fields, wrong types.
- **Doesn’t exist** (404): missing account or transfer.
- **Not allowed** (405, 409, 422): method not allowed, confirming twice, insufficient funds.
- **Security** (401, 403): no token, no scope.

There are many and they look alike: they go in a **Scenario Outline** with \`status\` and \`code\` columns. And you always check the **code**, not just the status: two different errors can share a 404.`,
  },
  {
    id: 'esquema',
    question: 'How do I validate the format of every error at once?',
    conceptId: 'errores',
    cost: 5,
    body: `With a reusable schema in the Background:
\`\`\`
* def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }
\`\`\`
and in every negative case:
\`\`\`
And match response == errorSchema
\`\`\`
\`##string\` is **optional**: only validations include \`field\`. An error in another format (a generic framework 404, a Java stack trace) breaks the partners who read \`code\`: it’s a contract bug even if the status is right.`,
  },
  {
    id: 'retry',
    question: 'How do I wait for something that finishes “later”?',
    conceptId: 'retry',
    cost: 5,
    body: `With **retry until** right before \`method\`:
\`\`\`
Given path 'transfers', id
And retry until response.status == 'COMPLETED'
When method get
\`\`\`
Karate repeats the request until the condition holds (it can use \`response\`, \`responseStatus\`, \`responseHeaders\`). If it runs out of attempts, the step fails with **too many retry attempts**.

No fixed sleeps: they always wait too long, and the day it takes a bit longer they fail anyway.`,
  },
  {
    id: 'configure',
    question: 'How many times does Karate retry?',
    conceptId: 'retry',
    cost: 3,
    body: `By default, **3 attempts every 3000 ms** (about 6 s). You change it with:
\`\`\`
* configure retry = { count: 10, interval: 1000 }
\`\`\`
Choose according to the contract: if processing can take up to 8 s, polling every second with 10 attempts covers it with room to spare. Don’t set 100 attempts “just in case”: a test that takes minutes to fail is a problem too.`,
  },
  {
    id: 'cabeceras',
    question: 'How do I check a response header?',
    conceptId: 'errores',
    cost: 3,
    body: `With **responseHeaders**: each header is a **list** of values.
\`\`\`
And match responseHeaders['Retry-After'][0] == '#regex [0-9]+'
\`\`\`
In 5xx errors the headers matter as much as the body: \`Retry-After\` tells the partner when they can retry without flooding us.`,
  },
]
