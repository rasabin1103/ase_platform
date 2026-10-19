import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m05LabEn } from './m05-lab'
import { m05LessonsEn } from './m05-lessons'
import { m05QuizEn } from './m05-quiz'
import { m05ScenesEn } from './m05-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * Course 3: Karate Framework · Mission 6 — Tokens and reuse.
 * English translation of ../m05-auth.ts (same structure and ids).
 *
 * The API moves to OAuth2 with scopes and a limit of tokens per minute. The
 * player moves the login into a reusable feature (@ignore), calls it with call
 * and callonce, passes it arguments and runs negative tests for scopes and
 * revocation.
 */
export const m05AuthEn: Mission = {
  id: 'm05-auth',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 5,
  title: 'Tokens and reuse',
  subtitle: 'call and callonce, reusable features, arguments, @ignore, OAuth2: scopes and revocation.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Monday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m05LabEn,
  initialMetrics: {},
  lessons: m05LessonsEn,
  mentor: 'sergio',
  quiz: m05QuizEn,
  verdicts: {
    good: {
      title: 'Authentication under control',
      body: 'A reusable login, one token per feature and negative tests for scopes and revocation. Your suite looks after security as much as functionality.',
    },
    ok: {
      title: 'It works, but…',
      body: 'The suite authenticates, but the login is still repeated or some security test was left undone. Check the debrief.',
    },
    bad: {
      title: 'Copy-pasting the login',
      body: 'A login repeated in every scenario hits the API limit and doesn’t test security. Replay the mission starting with the lesson “How do I reuse a feature from another one?”.',
    },
  },

  briefing: {
    title: 'Monday: tokens',
    paragraphs: [
      'After the security audit, Open API 1.6 requires an OAuth2 token on every call. Tokens have scopes, and the endpoint that issues them allows only 5 requests per minute.',
      'Sergio adapted the suite in a hurry this morning by copying the login into every scenario. With more scenarios, the suite will hit the limit.',
      'Today you turn the login into a reusable piece and test what really matters about authentication: that each token can only do what it should, and that a revoked token dies instantly.',
    ],
    goals: [
      'In the stand-up, propose how the suite authenticates.',
      'Move the login to auth/login.feature and call it with call.',
      'Make sure the login doesn’t run on its own (@ignore) and that one token is requested per feature (callonce).',
      'Prove that a read-only token can’t move money (403).',
      'Prove that a revoked token stops working (401).',
      'Decide with data whether the aggregator gets access.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m05ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'oauth',
      title: 'OAuth2 authentication (Open API 1.6)',
      updatedLabel: 'Maintained by Iván Torres',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'auth' },
        { kind: 'flag', key: 'doc.oauth' },
      ],
      body: `## Requesting a token · POST /auth/token
- Body: **clientId**, **clientSecret** and **scope** (optional; by default all of the client’s scopes, separated by spaces).
- **200** with { access_token, token_type: "Bearer", expires_in: 300, scope }.
- Wrong credentials: **401 INVALID_CLIENT**. Unknown scope: **400 INVALID_SCOPE**.
- Limit: **5 requests per minute** per client. Above that: **429 TOO_MANY_REQUESTS** with a Retry-After header.

## Using the token
- Header **Authorization: Bearer <access_token>** on all of /accounts and /transfers.
- No token: **401 UNAUTHORIZED**. Unknown token: **401 INVALID_TOKEN**.

## Scopes (least privilege)
- **accounts:read**: query accounts, balances and transfers.
- **transfers:write**: create and confirm transfers.
- Valid token without the required scope: **403 INSUFFICIENT_SCOPE**.

## Revoking · POST /auth/revoke
- Body: { token }. **200** { revoked: true }.
- From then on the token gets **401 TOKEN_REVOKED**.

## QA client (sandbox)
- clientId and clientSecret in karate-config.js (in pre and prod they would arrive as pipeline properties).`,
    },
    API_REFERENCE_DOC_EN,
  ],

  tickets: [
    {
      id: 'API-31',
      title: 'OAuth2 with scopes for partners',
      status: 'In QA',
      type: 'story',
      description: 'As the security officer, I want partners to use OAuth2 tokens with scopes, and to be able to revoke them, to limit what each one can do.',
      acceptanceCriteria: ['Every call carries a valid token.', 'A token without the required scope gets 403.', 'A revoked token gets 401 immediately.'],
      comments: [{ author: 'ivan', body: 'Deployed to sandbox with a limit of 5 tokens/min per client.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-SCOPE',
      title: 'A token with only accounts:read can create transfers',
      severity: 'critical',
      explanation: 'The scope check was only applied to GET routes: any valid token could move money, even one belonging to a read-only partner.',
      technique: 'Negative authorization test: a token with the minimum scope and an operation it shouldn’t allow (403).',
      fix: { delay: 60, note: 'Scopes are now checked on every route. Deployed to sandbox.' },
      repro: { groups: [['scope', 'accounts:read', 'read-only'], ['transfer', '201', '403', 'create']], ask: 'Which scope did you request the token with, which operation did you run and which code came back?' },
    },
    {
      id: 'KA-REVOKE',
      title: 'A revoked token keeps working',
      severity: 'high',
      explanation: 'The revocation was stored, but validation used a token cache that was never invalidated: the token stayed alive until it expired.',
      technique: 'Chaining: request a token, revoke it and use it afterwards in the same scenario (401 TOKEN_REVOKED).',
      fix: { delay: 90, note: 'Revoking now invalidates the token cache. Deployed.' },
      repro: { groups: [['revok', 'revoke'], ['200', '401', 'still', 'works']], ask: 'What did you do with the token after revoking it, and which code came back?' },
    },
    {
      id: 'KA-AUTH500',
      title: 'Wrong credentials return 500 with an internal stack trace',
      severity: 'medium',
      explanation: 'A wrong secret caused a NullPointerException: besides the wrong code, the response exposed internal server details.',
      technique: 'Negative login test: wrong credentials → 401 INVALID_CLIENT.',
      fix: { delay: 90, note: 'Wrong credentials return 401 with no stack traces. Deployed.' },
      repro: { groups: [['secret', 'credential', 'clientsecret', 'clientid'], ['500', 'nullpointer', 'trace', '401']], ask: 'Which credentials did you send, and what did the API answer?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'Where your suite’s authentication stood at the end of the day.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that showed up',
    rules: [
      { flag: 'reto.login', label: 'Login in its own feature', explanation: "auth/login.feature: POST /auth/token and * def token = response.access_token." },
      { flag: 'reto.call', label: 'Login called with call, not copied', explanation: "* def auth = call read('auth/login.feature') and configure headers with the token." },
      { flag: 'reto.ignore', label: 'The login doesn’t run on its own', explanation: '@ignore above Feature: in login.feature.' },
      { flag: 'reto.callonce', label: 'One token per feature', explanation: "callonce in the Background: no more than 3 tokens for the whole suite." },
      { flag: 'reto.scope', label: 'Read-only token → 403', explanation: "call read('auth/login.feature') { scope: 'accounts:read' } and POST /transfers." },
      { flag: 'reto.revoke', label: 'Revoked token → 401', explanation: 'Its own token via call, POST /auth/revoke and use it afterwards.' },
    ],
  },

  concepts: [
    { id: 'call', title: 'call and reusable features', summary: "call read('x.feature') runs another feature and returns its variables; it accepts arguments ({ … }). Without assigning it, it shares variables and headers. @ignore keeps it from running on its own." },
    { id: 'callonce', title: 'callonce', summary: 'Runs the called feature once per feature file and reuses the result: for anything expensive or rate-limited (tokens). What it returns is shared across scenarios.' },
    { id: 'auth', title: 'Testing authentication', summary: 'No token 401, no scope 403, revoked 401, bad credentials 401 with no stack traces. Negative tests nobody sees if they only use the app.' },
  ],
  debriefConcepts: ['call', 'callonce', 'auth'],
  seniorTips: [
    'Read “OAuth2 authentication” in the wiki: endpoints, scopes, limit and codes.',
    "auth/login.feature with url baseUrl inside, POST /auth/token and * def token = response.access_token. And @ignore.",
    "Background: * def auth = callonce read('auth/login.feature') and configure headers with Authorization.",
    "Scopes: karate.get('scope', …) in the login and call … { scope: 'accounts:read' } → POST /transfers → 403.",
    'Revocation: its own token via call (not the shared one), revoke, then use it → 401.',
    'Also test wrong credentials: they should give 401, nothing else.',
  ],
}
