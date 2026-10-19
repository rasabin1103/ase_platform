import type { Lesson } from '../../../../engine/types'

/** Sergio's micro-lessons (Karate course · mission 4). English translation of ../m03-lessons.ts. */
export const m03LessonsEn: Lesson[] = [
  {
    id: 'request',
    question: 'How do I send a JSON body?',
    conceptId: 'payloads',
    cost: 3,
    body: `With **request** before \`method post\` (or put/patch):
\`\`\`
Given path 'transfers'
And request { fromAccount: 'ACC-1001', amount: 25, currency: 'EUR' }
When method post
Then status 201
\`\`\`
Karate sets \`Content-Type: application/json\` on its own. Like \`path\`, the body is reset after each request.`,
  },
  {
    id: 'read',
    question: 'How do I move the body to a file?',
    conceptId: 'payloads',
    cost: 5,
    body: `\`read()\` reads a file relative to the feature (or with \`classpath:\`):
\`\`\`
* def amount = 150.75
* def body = read('payloads/transfer.json')
\`\`\`
Inside the JSON, **embedded expressions** \`"#(amount)"\` are replaced, when the file is read, by the value of the variable (with its type: a number, not text). That’s why the variables are defined **before** the \`read\`.

With \`##(variable)\` the key disappears if the variable is null: handy for optional fields.`,
  },
  {
    id: 'chain',
    question: 'How do I use what one request returns in the next one?',
    conceptId: 'chaining',
    cost: 5,
    body: `By saving it with **def** before the next request (afterwards, \`response\` will be a different one):
\`\`\`
* def transferId = response.id
Given path 'transfers', transferId
When method get
Then status 200
And match response.amount == amount
\`\`\`
Never hand-write an id that the test itself creates: every run generates a new one. The **Location** header (\`responseHeaders['Location'][0]\`) also tells you where the created resource is.`,
  },
  {
    id: 'set',
    question: 'How do I change a field of the body for another case?',
    conceptId: 'payloads',
    cost: 3,
    body: `- \`* set body.amount = 999999\` changes a field.
- \`* remove body.concept\` removes it (to test required fields).
- \`* copy otro = body\` makes an independent copy (if you modify \`otro\`, \`body\` doesn’t change).

That way the same file serves the happy path and the negative cases.`,
  },
  {
    id: 'effect',
    question: 'What should you check after a POST?',
    conceptId: 'chaining',
    cost: 5,
    body: `In layers:
1. **The response**: 201 and what it returns (\`id\`, \`status\`).
2. **What was stored**: a GET of the created resource. The POST response may echo what you sent even if something else was stored.
3. **The effect**: what changes somewhere else (the balance after confirming).
4. **The rules**: repeating the operation (idempotency, 409), limits (not enough balance, 422), invalid data (400).`,
  },
  {
    id: 'codes',
    question: 'What do 201, 400, 409 and 422 mean?',
    conceptId: 'http_codes',
    cost: 3,
    body: `- **201 Created**: resource created (usually with \`Location\`).
- **400 Bad Request**: the request is malformed or missing fields.
- **404 Not Found**: what you ask for does not exist.
- **409 Conflict**: it clashes with the current state (confirming something already confirmed).
- **422 Unprocessable Entity**: the request is correct, but the business rule doesn’t allow it (not enough balance).

Checking the **exact status code** matters: partners build their app around it.`,
  },
]
