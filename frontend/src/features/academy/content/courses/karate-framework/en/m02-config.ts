import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m02LabEn } from './m02-lab'
import { m02LessonsEn } from './m02-lessons'
import { m02QuizEn } from './m02-quiz'
import { m02ScenesEn } from './m02-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * Course 3: Karate Framework · Mission 3 — One test, three environments.
 * English translation of ../m02-config.ts (same structure and ids).
 *
 * The suite has to run in the pipeline against pre-production: another URL,
 * other data and a mandatory key that cannot be in the code. The player edits
 * karate-config.js, configures common headers, reads the secret from
 * karate.properties and proves with a negative test that without a key there is no data.
 */
export const m02ConfigEn: Mission = {
  id: 'm02-config',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 2,
  title: 'One test, three environments',
  subtitle: 'karate-config.js, karate.env, common headers, secrets and per-environment data.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Wednesday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m02LabEn,
  initialMetrics: {},
  lessons: m02LessonsEn,
  mentor: 'sergio',
  quiz: m02QuizEn,
  verdicts: {
    good: {
      title: 'Ready for the pipeline',
      body: 'The same suite runs in sandbox and in pre without touching a single test, with no secrets in the code, and it proved a security flaw before it reached production.',
    },
    ok: {
      title: 'Almost in the pipeline',
      body: 'The suite runs in more than one environment, but something still depends on where it runs, or some risk went untested. Check the debrief.',
    },
    bad: {
      title: 'Tied to one environment',
      body: 'A suite that only works in one place is no use in a pipeline. Replay the mission, starting with the lesson “What is karate-config.js?”.',
    },
  },

  briefing: {
    title: 'Wednesday: the pipeline',
    paragraphs: [
      'Tomorrow the Open API goes to production. Iván has set up the pipeline: deploy to pre-production, run your suite against pre and, if it’s green, promote.',
      'But the suite only knows how to talk to the sandbox. Pre has another URL, other data, and requires a key that must not appear in the code.',
      'Today you turn the suite into something that runs in any environment just by changing karate.env. And Carmen will want proof that, without a key, nobody can read data.',
    ],
    goals: [
      'In the meeting, propose how to run the same suite in every environment.',
      'Set up karate-config.js for sandbox and pre depending on karate.env.',
      'Send the key on every pre request without writing it in the code.',
      'Get the suite green in both environments without touching the features between runs.',
      'Prove that pre returns 401 without a key, and add the correlation id the partners ask for.',
      'Decide with evidence at the 16:30 go/no-go.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m02ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'entornos',
      title: 'Open API environments',
      updatedLabel: 'Maintained by Iván Torres',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'config' },
        { kind: 'flag', key: 'doc.envs' },
      ],
      body: `## Environments
- **sandbox** · https://api.kobalto.test/v1 · open, sample data (ACC-1001 to ACC-1005).
- **pre** · https://api.pre.kobalto.test/v1 · a copy of production with its own data. Requires **x-api-key** on everything except /health.
- **prod** · https://api.kobalto.com/v1 · from Thursday. Smoke only (@smoke).

## Pre data
- **ACC-2001** · Carla Domínguez Ríos · EUR · ACTIVE
- **ACC-2002** · Talleres Ebro SL · EUR · ACTIVE
- **ACC-2003** · Pablo Ferrer Gil · USD · ACTIVE (balance 0)
- **ACC-2004** · Comercial Duero SA · EUR · BLOCKED

## Pre key
- **x-api-key** header. Without it: **401 MISSING_API_KEY**; with a wrong key: **401 INVALID_API_KEY**.
- In the pipeline it arrives as the system property **kobalto.apiKey** from the secrets manager. **Never** in the repository.

## Traceability
- If the request carries **x-correlation-id**, the response returns the same header with the same value (in every environment).

## How the pipeline runs
- \`mvn test -Dkarate.env=pre -Dkobalto.apiKey=$KOBALTO_PRE_KEY\``,
    },
    API_REFERENCE_DOC_EN,
  ],

  tickets: [
    {
      id: 'API-18',
      title: 'The Karate suite runs in the pipeline against pre',
      status: 'In progress',
      type: 'story',
      description: 'As the platform team, we want to run the Open API suite against pre-production on every deployment so we can decide whether to promote to production.',
      acceptanceCriteria: [
        'The same suite runs in sandbox and in pre by changing only karate.env.',
        'No secrets in the repository.',
        'There is a check that pre rejects requests without a key.',
      ],
      comments: [{ author: 'ivan', body: 'The pipeline already passes -Dkarate.env=pre and -Dkobalto.apiKey.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-KEY',
      title: 'Pre returns an account’s detail without x-api-key',
      severity: 'critical',
      explanation: 'The authentication filter excluded the detail route by mistake: anyone without a key could read an account’s data. In production it would have been a data leak.',
      technique: 'Negative security test: the same request without the header (header x-api-key = null) must return 401.',
      fix: { delay: 60, note: 'The authentication filter now covers every /accounts route. Deployed to pre.' },
      repro: { groups: [['x-api-key', 'api key', 'api-key', 'apikey', 'key'], ['200', '401', 'without']], ask: 'Which endpoint, in which environment, and what status comes back without the header versus the expected one?' },
    },
    {
      id: 'KA-CORR',
      title: 'Pre does not return the x-correlation-id header',
      severity: 'medium',
      explanation: 'The pre proxy stripped the header from the response. Partners would not be able to trace their calls in production.',
      technique: 'Check the response headers (responseHeaders) and run the same suite in each environment.',
      fix: { delay: 90, note: 'The pre proxy now lets x-correlation-id through. Deployed.' },
      repro: { groups: [['x-correlation-id', 'correlation', 'correlation id'], ['pre', 'preproduction', 'not return', 'missing', 'absent', 'undefined', 'no header']], ask: 'Which header is missing, in which environment, and what value did you send?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'Where the suite stood for the pipeline at the end of the day.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that showed up',
    rules: [
      { flag: 'reto.entornos', label: 'karate-config.js picks the URL from karate.env', explanation: "if (env == 'pre') { config.baseUrl = 'https://api.pre.kobalto.test/v1'; }" },
      { flag: 'reto.clave', label: 'The key on every request with configure headers', explanation: "karate.configure('headers', { 'x-api-key': … }) in the pre branch." },
      { flag: 'reto.secreto', label: 'No secrets in the code', explanation: "karate.properties['kobalto.apiKey'], which the pipeline passes with -Dkobalto.apiKey." },
      { flag: 'reto.datos', label: 'Green in sandbox and in pre with the same features', explanation: 'accountId in the config per environment: ACC-1001 in sandbox, ACC-2001 in pre.' },
      { flag: 'reto.sinclave', label: 'Negative test: no key, 401', explanation: 'header x-api-key = null, and karate.abort() outside pre.' },
      { flag: 'reto.correlacion', label: 'Correlation id on every request and checked in the response', explanation: "match responseHeaders['x-correlation-id'][0] == correlationId" },
    ],
  },

  concepts: [
    { id: 'config', title: 'karate-config.js and karate.env', summary: 'A function Karate runs before every scenario. Depending on karate.env (-Dkarate.env=pre) it returns the URL, data and configuration; the features don’t know which environment they run in.' },
    { id: 'headers', title: 'Common headers', summary: 'configure headers adds headers to every request; header, only to the next one; null removes it. responseHeaders[name][0] reads the response headers.' },
    { id: 'secrets', title: 'Secrets out of the code', summary: 'Keys and tokens arrive as system properties (karate.properties) from the pipeline’s secrets manager. A published key gets rotated.' },
    { id: 'env_data', title: 'Per-environment data and scenarios', summary: 'Whatever changes between environments (test ids) goes in the config. Scenarios specific to one environment: karate.abort() or tags.' },
  ],
  debriefConcepts: ['config', 'headers', 'secrets', 'env_data'],
  seniorTips: [
    'Read “Open API environments” in the wiki: the pre URL, data and key.',
    "In the config: if (env == 'pre') with the pre URL, and try it with the -Dkarate.env=pre selector.",
    "The key: karate.properties['kobalto.apiKey'] and karate.configure('headers', …). Never the value in the code.",
    "accountId in the config (ACC-1001 / ACC-2001) and Given path 'accounts', accountId in the feature.",
    "Negative test: header x-api-key = null → 401. With * if (karate.env != 'pre') karate.abort() it doesn’t break sandbox.",
    "x-correlation-id in the configured headers and match responseHeaders['x-correlation-id'][0] == correlationId.",
    'If something fails only in pre, compare it with sandbox before reporting.',
  ],
}
