import type { Lesson } from '../../../../engine/types'

/** Sergio's micro-lessons (Karate course · mission 6). English translation of ../m05-lessons.ts. */
export const m05LessonsEn: Lesson[] = [
  {
    id: 'call',
    question: 'How do I reuse a feature from another one?',
    conceptId: 'call',
    cost: 5,
    body: `With **call** and \`read()\` of the feature:
\`\`\`
* def auth = call read('auth/login.feature')
* print auth.token
\`\`\`
Karate runs the called feature and returns **all its variables** in an object (\`auth.token\`, \`auth.response\`…). The called feature sees the caller’s variables (\`baseUrl\`, \`clientId\`…).

If you call it without assigning (\`* call read('auth/login.feature')\`), its variables — and its \`configure headers\` — go straight into the calling scenario.`,
  },
  {
    id: 'args',
    question: 'How do I pass data to the feature I call?',
    conceptId: 'call',
    cost: 3,
    body: `With a JSON object after the call:
\`\`\`
* def ro = call read('auth/login.feature') { scope: 'accounts:read' }
\`\`\`
Inside the called feature, each key is a variable (\`scope\`) and the whole object is in \`__arg\`. For a default value when it isn’t passed: \`* def scope = karate.get('scope', 'accounts:read transfers:write')\`.`,
  },
  {
    id: 'callonce',
    question: 'When do I use callonce instead of call?',
    conceptId: 'callonce',
    cost: 5,
    body: `**callonce** runs the called feature **only once per feature file** and stores the result; after that it reuses it.
\`\`\`
Background:
  * def auth = callonce read('auth/login.feature')
\`\`\`
Use it for anything expensive or rate-limited (requesting a token, creating base data). Careful: what it returns is shared; if a scenario needs a token of its own (to revoke it, for example), use \`call\` in that scenario.`,
  },
  {
    id: 'ignore',
    question: 'Why @ignore on the login?',
    conceptId: 'call',
    cost: 3,
    body: `The runner executes **every** feature in the folder. A feature meant to be called (login, creating data) isn’t a test on its own: run by itself it may fail or clutter the report.

\`@ignore\` above \`Feature:\` excludes it from the normal run, but \`call\` still executes it.`,
  },
  {
    id: 'oauth',
    question: 'What should you test about authentication?',
    conceptId: 'auth',
    cost: 5,
    body: `Besides the login working:
- **No token** or a made-up one: 401.
- **Scopes** (least privilege): a token without permission for something gets 403, even if it’s valid.
- **Revocation**: a revoked token stops working instantly (401).
- **Wrong credentials**: a clean 401, never a 500 with internal stack traces.

These are negative tests nobody sees if they only use the app: that’s why they have to be in the suite.`,
  },
]
