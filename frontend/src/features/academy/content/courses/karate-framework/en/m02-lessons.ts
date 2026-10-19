import type { Lesson } from '../../../../engine/types'

/** Sergio's micro-lessons (Karate course · mission 3). English translation of ../m02-lessons.ts. */
export const m02LessonsEn: Lesson[] = [
  {
    id: 'config',
    question: 'What is karate-config.js?',
    conceptId: 'config',
    cost: 5,
    body: `A file at the root of the tests with **a function** that Karate runs **before every scenario**. What it returns becomes global variables for all the features.
\`\`\`
function fn() {
  var env = karate.env || 'sandbox';
  var config = { baseUrl: 'https://api.kobalto.test/v1' };
  if (env == 'pre') {
    config.baseUrl = 'https://api.pre.kobalto.test/v1';
  }
  return config;
}
\`\`\`
The features use \`baseUrl\` without knowing where it comes from. A mistake here makes **every** scenario fail: if everything turns red at once, look at the config.`,
  },
  {
    id: 'env',
    question: 'How do I pick the environment when I run?',
    conceptId: 'config',
    cost: 3,
    body: `With the **karate.env** system property:
\`\`\`
mvn test -Dkarate.env=pre
\`\`\`
Inside the config you read it with \`karate.env\` (it is \`null\` if not set, hence the \`|| 'sandbox'\`). In the IDE, the \`-Dkarate.env=\` selector at the top does the same.`,
  },
  {
    id: 'headers',
    question: 'How do I send a header on every request?',
    conceptId: 'headers',
    cost: 5,
    body: `- **header** \`x-api-key = 'abc'\`: only for the next request.
- **configure headers**: for all of them. In the config: \`karate.configure('headers', { 'x-api-key': key })\`. In a feature: \`* configure headers = { … }\`.
- It also accepts a **function** that is evaluated on each request (useful for tokens that change).
- To remove a configured header in one particular scenario: \`header x-api-key = null\`.`,
  },
  {
    id: 'secrets',
    question: 'Where do I put the API key?',
    conceptId: 'secrets',
    cost: 5,
    body: `**Never in the code.** Anything that goes into Git can be read by anyone with access, and it stays in the history even if you delete it.

The pipeline keeps it in its secrets manager and passes it at run time:
\`\`\`
mvn test -Dkarate.env=pre -Dkobalto.apiKey=$KOBALTO_PRE_KEY
\`\`\`
In the config: \`karate.properties['kobalto.apiKey']\`. If a key ever gets published, it is **rotated** (changed) immediately.`,
  },
  {
    id: 'env_data',
    question: 'What about data that changes from one environment to another?',
    conceptId: 'env_data',
    cost: 3,
    body: `Each environment has its own data: ACC-1001 exists in sandbox but not in pre. Whatever depends on the environment goes in the config:
\`\`\`
config.accountId = env == 'pre' ? 'ACC-2001' : 'ACC-1001';
\`\`\`
and the feature uses \`Given path 'accounts', accountId\`.

For a scenario that only makes sense in one environment: \`* if (karate.env != 'pre') karate.abort()\` as the first step (it ends the scenario without failing), or a tag such as \`@pre\` and filter by tags in the pipeline.`,
  },
  {
    id: 'response_headers',
    question: 'How do I check a response header?',
    conceptId: 'headers',
    cost: 3,
    body: `Response headers live in **responseHeaders**, and each one is a **list** (a header can appear more than once):
\`\`\`
And match responseHeaders['x-correlation-id'][0] == correlationId
\`\`\`
If the header does not come back, \`responseHeaders['x-correlation-id']\` does not exist and the step fails when it reads \`[0]\`: the console shows you which headers came back (\`1 < …\`).`,
  },
]
