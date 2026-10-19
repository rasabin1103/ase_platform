import type { CodeLabModel } from '../../../../karate/types'
import { PAYMENTS_BASE, PROCESSOR_TIMEOUT_MS } from '../../../../karate/apis/kobaltoPayments'
import { M07_CONFIG_PATH, M07_MOCK_PATH, M07_PAYMENTS_PATH, m07Lab } from '../m07-lab'
import { RUNNER_JAVA_EN, filesEn, retosEn } from './shared'

/** English translation of ../m07-lab.ts: same server, checks and paths; only the text changes. */

const CONFIG = `function fn() {
  // Payments service started locally (mvn spring-boot:run -Plocal).
  // It calls Paynexo at PROCESSOR_URL=http://localhost:8090.
  var config = {
    baseUrl: '${PAYMENTS_BASE}'
  };
  return config;
}
`

const PAYMENTS = `Feature: card payments (payments service running locally)

  Background:
    * url baseUrl
    # The service calls Paynexo at localhost:8090: that's where we start the mock.
    # Only once per feature (callonce): the port can't be taken twice.
    * def startMock = function() { return karate.start({ mock: 'mocks/paynexo.feature', port: 8090 }) }
    * def mock = callonce startMock

  Scenario: approved payment
    Given path 'cards', 'CRD-1001', 'payments'
    And request { amount: 25.5, currency: 'EUR', merchant: 'Café Central' }
    When method post
    Then status 201
    And match response.status == 'APPROVED'
`

const MOCK = `@ignore
Feature: Paynexo mock (card processor)

  # Each Scenario is a condition on the request that reaches the mock.
  # The FIRST one that holds wins. It responds with response, responseStatus,
  # responseHeaders and responseDelay (ms).
  # The one at the bottom, with no condition, catches everything else.

  Background:
    * print 'Paynexo mock started'

  Scenario:
    * def responseStatus = 501
    * def response = { error: 'not_implemented', detail: 'the mock does not know how to respond to this yet' }
`

const RUNNER_PATH = 'src/test/java/payments/PaymentsTest.java'

export const m07LabEn: CodeLabModel = {
  ...m07Lab,
  files: filesEn(m07Lab.files, {
    [M07_PAYMENTS_PATH]: PAYMENTS,
    [M07_MOCK_PATH]: MOCK,
    [M07_CONFIG_PATH]: CONFIG,
    [RUNNER_PATH]: {
      ...RUNNER_JAVA_EN,
      path: RUNNER_PATH,
      content: RUNNER_JAVA_EN.content.replace('package openapi;', 'package payments;').replace('class OpenApiTest', 'class PaymentsTest').replace('-Dtest=OpenApiTest', '-Dtest=PaymentsTest'),
    },
  }),
  snippets: [
    { label: 'approve', code: "Scenario: pathMatches('/v2/authorizations') && methodIs('post')\n  * def response = { result: 'APPROVED', authCode: 'A1B2C3' }" },
    { label: 'decline', code: "Scenario: pathMatches('/v2/authorizations') && request.merchant == 'DENEGADO'\n  * def response = { result: 'DECLINED', reason: 'INSUFFICIENT_FUNDS' }" },
    { label: 'responseStatus', code: '* def responseStatus = 503' },
    { label: 'responseDelay', code: '* def responseDelay = 5000' },
    { label: 'validate request', code: "Scenario: pathMatches('/v2/authorizations') && !karate.match(request, authRequest).pass\n  * def responseStatus = 400\n  * def response = { error: 'invalid_request' }" },
    { label: 'karate.start', code: "* def startMock = function() { return karate.start({ mock: 'mocks/paynexo.feature', port: 8090 }) }\n* def mock = callonce startMock" },
  ],
  retos: retosEn(m07Lab.retos, {
    mock: {
      title: 'Your first mock',
      description: 'Teach the mock to **approve**: a `Scenario` for `POST /v2/authorizations` that responds `{ result: \'APPROVED\', authCode: … }`. The payment with card CRD-1001 must come out **201 APPROVED** with that authCode.',
      hint: "Above the scenario with no condition: `Scenario: pathMatches('/v2/authorizations') && methodIs('post')` and inside it `* def response = { result: 'APPROVED', authCode: 'A1B2C3' }`. Order matters: the first one that holds wins.",
    },
    denegado: {
      title: 'Declined payment',
      description: 'Paynexo declines with `{ result: \'DECLINED\', reason: … }`. Make the mock decline (for example, depending on the merchant) and check that Kobalto responds **422** `PAYMENT_DECLINED` with the **same reason** (`reason`).',
      hint: "`Scenario: pathMatches('/v2/authorizations') && request.merchant == 'DENEGADO'` with `reason: 'INSUFFICIENT_FUNDS'`. In the test: `match response.reason == 'INSUFFICIENT_FUNDS'`.",
    },
    caida: {
      title: 'Paynexo fails',
      description: 'If Paynexo responds with a **5xx**, Kobalto must return **502** `PROCESSOR_ERROR`. Simulate it with `responseStatus` in the mock.',
      hint: "`Scenario: pathMatches('/v2/authorizations') && request.merchant == 'CAIDO'` with `* def responseStatus = 503`. In the test: `status 502` and `match response.code == 'PROCESSOR_ERROR'`.",
    },
    tabla: {
      title: 'One merchant per case',
      description: 'Gather the cases in a `Scenario Outline`: at least **4 rows** that take the mock down different paths and **3 different** Kobalto codes (201, 422, 502…).',
      hint: 'Columns `merchant`, `status` (and whatever else you need). In the mock, one condition per merchant (`request.merchant == …`).',
    },
    lento: {
      title: 'Paynexo is slow',
      description: `Carmen: the service waits for Paynexo **${PROCESSOR_TIMEOUT_MS / 1000} s** at most. If it takes longer, the payment must fail with **504** \`PROCESSOR_TIMEOUT\`, never be approved. Simulate the slowness with \`responseDelay\`.`,
      hint: "`Scenario: pathMatches('/v2/authorizations') && request.merchant == 'LENTO'` with `* def responseDelay = 5000` and an approved response. In the test: `status 504`.",
    },
    contrato: {
      title: 'The mock guards the contract',
      description: 'Nico: Paynexo v2 takes the amount in **whole cents** (€25.50 → 2550) and rejects anything else with **400**. Make your mock validate the request with a schema and respond 400 if it doesn’t match; then a payment **with decimals** must still come out 201.',
      hint: "Background: `* def authRequest = { amount: '#? _ > 0 && _ % 1 == 0', currency: '#regex [A-Z]{3}', merchant: '#string', cardToken: '#string', reference: '#string' }`. First scenario: `pathMatches('/v2/authorizations') && !karate.match(request, authRequest).pass` → `responseStatus = 400`.",
    },
  }),
}
