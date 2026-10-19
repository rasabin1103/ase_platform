import type { CodeLabModel } from '../../../../karate/types'
import { M09_SOLUTION_CONFIG } from '../m09-lab'
import { EXAM_MIN_SCENARIOS, M10_PATHS, m10Lab } from '../m10-lab'
import { filesEn, retosEn } from './shared'

/** English translation of ../m10-lab.ts (same structure, checks and paths). */

const ORDERS_EN = `@regression
Feature: Kobalto Open API · standing orders

  Background:
    * url baseUrl

  # The contract is in the wiki: “Standing orders (exam)”.
  # Write your scenarios here (or create more features with “New file”).
`

const LOGIN_EN = `@ignore
Feature: reusable login

  Scenario: get a token
    * def scope = karate.get('scope', 'accounts:read transfers:write')
    Given url baseUrl
    And path 'auth', 'token'
    And request { clientId: '#(clientId)', clientSecret: '#(clientSecret)', scope: '#(scope)' }
    When method post
    Then status 200
    * def token = response.access_token
`

const UTIL_EN = `@ignore
Feature: utility · create a test account

  Scenario: test account
    * def saldo = karate.get('balance', 100)
    Given url baseUrl
    And path 'sandbox', 'accounts'
    And request { balance: '#(saldo)', currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
`

const NIGHTLY_EN = `package openapi;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// Nightly job: the whole regression, in parallel.
class OpenApiRunner {

    @Test
    void regression() {
        Results results = Runner.path("classpath:openapi")
                .tags("~@ignore")
                .outputCucumberJson(true)
                .parallel(4);
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}
`

const CONFIG_EN = M09_SOLUTION_CONFIG.replace(
  '// Un token para toda la ejecución (todos los features y todos los hilos).',
  '// One token for the whole run (every feature and every thread).',
)

export const m10LabEn: CodeLabModel = {
  ...m10Lab,
  pipeline: m10Lab.pipeline && {
    ...m10Lab.pipeline,
    jobs: m10Lab.pipeline.jobs.map((j) => (j.id === 'nightly' ? { ...j, label: 'Nightly · regression', trigger: 'every night (02:00)' } : j)),
  },
  files: filesEn(m10Lab.files, {
    [M10_PATHS.orders]: ORDERS_EN,
    [M10_PATHS.login]: LOGIN_EN,
    [M10_PATHS.util]: UTIL_EN,
    [M10_PATHS.nightly]: NIGHTLY_EN,
    [M10_PATHS.config]: CONFIG_EN,
  }),
  retos: retosEn(m10Lab.retos, {
    contrato: {
      title: 'Contract of an order',
      description: 'Validate the full response of a standing order (create or fetch) against its contract: **all** its fields, with markers wherever the value is not fixed.',
      hint: '',
    },
    encadenar: {
      title: 'Create and fetch',
      description: 'Create an order and then fetch it by its id, checking that what was stored is what you sent.',
      hint: '',
    },
    limites: {
      title: 'Boundary values',
      description: 'A `Scenario Outline` with at least **4 rows** that tests the edges of the creation rules (amount, start date…), with rows that are accepted and rows that are rejected.',
      hint: '',
    },
    negativos: {
      title: 'Invalid input',
      description: 'At least **3** creation cases with invalid data that expect **400** and check which field fails, covering at least **2 different fields**.',
      hint: '',
    },
    cancelar: {
      title: 'Cancel',
      description: 'Cancel an order (`DELETE`) and check that, afterwards, it shows up as **CANCELLED**.',
      hint: '',
    },
    permisos: {
      title: 'Permissions',
      description: 'Prove that a **read-only** token (`accounts:read`) **cannot cancel** an order.',
      hint: '',
    },
    datos: {
      title: 'Your own data',
      description: 'Each account allows only a few active orders. Make sure **all** the orders the suite creates come from **test accounts** created by the scenarios themselves, in at least 3 scenarios.',
      hint: '',
    },
    pipeline: {
      title: 'In the nightly run',
      description: `Launch the **nightly** job (in parallel and breaking the build if anything fails) with at least **${EXAM_MIN_SCENARIOS} scenarios** and no failures caused by the tests.`,
      hint: '',
    },
  }),
}
