import type { Lesson } from '../../../../engine/types'

/** Sergio's micro-lessons (Karate course · mission 10). English translation of ../m09-lessons.ts. */
export const m09LessonsEn: Lesson[] = [
  {
    id: 'callsingle',
    question: 'callonce or callSingle?',
    conceptId: 'callsingle',
    cost: 5,
    body: `- **callonce**: once **per feature**. Six features, six runs.
- **karate.callSingle**: once **per run**, for every feature and every thread.

You normally use it in \`karate-config.js\` and pass it what it needs, because the called feature does not see the configuration:
\`\`\`
var auth = karate.callSingle('classpath:openapi/auth/login.feature', config);
karate.configure('headers', { Authorization: 'Bearer ' + auth.token });
\`\`\`
That way no feature has to remember the login.`,
  },
  {
    id: 'estructura',
    question: 'How do I organize the suite’s files?',
    conceptId: 'estructura',
    cost: 5,
    body: `A structure anyone understands at first sight:
\`\`\`
src/test/java/
  karate-config.js        ← environment, login (callSingle), headers
  common/                 ← reusable utilities (@ignore)
  openapi/
    accounts.feature …    ← one feature per resource
    auth/login.feature    ← @ignore
    schemas/*.json        ← reusable contracts
    OpenApiRunner.java
\`\`\`
A JSON schema is loaded with \`read('schemas/error.json')\` (path relative to the feature) or \`read('classpath:openapi/schemas/error.json')\`.`,
  },
  {
    id: 'utilidades',
    question: 'How do I build a reusable utility?',
    conceptId: 'estructura',
    cost: 3,
    body: `A feature with \`@ignore\` that does one single thing and takes arguments:
\`\`\`
@ignore
Feature: utility · create a test account
  Scenario:
    * def saldo = karate.get('balance', 100)
    Given url baseUrl
    And path 'sandbox', 'accounts'
    …
    * def cuenta = response
\`\`\`
You use it with \`* def r = call read('classpath:common/cuenta-prueba.feature') { balance: 250 }\` and \`r.cuenta.id\`. If tomorrow the way accounts are created changes, you touch a single file.`,
  },
  {
    id: 'revision',
    question: 'What do I look at when reviewing someone else’s tests?',
    conceptId: 'revision',
    cost: 5,
    body: `Passing is not enough. Ask yourself **what would fail if the API broke**:
- Does it check the **body** or only the status? \`print\` checks nothing.
- Are there **hard-coded** URLs, tokens or data that expire or change per environment?
- **Copied** scenarios that should be an Outline?
- Does it depend on data that other tests change?

A test that always passes protects nothing. And explain the reason behind every comment: the PR author learns too.`,
  },
  {
    id: 'convenciones',
    question: 'What are conventions for?',
    conceptId: 'convenciones',
    cost: 3,
    body: `So the suite looks written by a single person and reviews focus on what matters. Few, written down and checkable:
- Every scenario with \`@smoke\` or \`@regression\` (the jobs depend on it).
- No full URLs or secrets in the features.
- Each scenario has its own data.
- Contracts in \`schemas/\`, utilities in \`common/\`.`,
  },
]
