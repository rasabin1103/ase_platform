import type { CodeLabModel } from '../../../../karate/types'
import { m01Lab } from '../m01-lab'
import { filesEn, retosEn, KARATE_CONFIG_JS_EN, RUNNER_JAVA_EN } from './shared'

const FEATURE_EN = `Feature: Kobalto Open API · accounts contract

  # Yesterday: smoke. Today: contract. A contract test validates the SHAPE of
  # the response (fields, types and formats), not specific data.

  Background:
    * url baseUrl

  Scenario: account detail
    Given path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response.id == 'ACC-1001'
    # Validate the full contract here with fuzzy markers:
    # And match response == { id: '#string', ... }
`

/** IDE for mission 2: contracts with match and fuzzy markers. English text only. */
export const m01LabEn: CodeLabModel = {
  ...m01Lab,
  files: filesEn(m01Lab.files, {
    'src/test/java/openapi/accounts.feature': FEATURE_EN,
    'src/test/java/karate-config.js': KARATE_CONFIG_JS_EN,
    'src/test/java/openapi/OpenApiTest.java': RUNNER_JAVA_EN,
  }),
  snippets: [
    { label: 'schema', code: "And match response == { id: '#string', iban: '#string', holder: '#string', type: '#string', currency: '#string', balance: '#number', status: '#string', createdAt: '#string' }" },
    { label: 'def schema', code: "* def account = { id: '#string', iban: '#regex ES\\\\d{22}', holder: '#string', type: '#string', currency: '#string', balance: '#number', status: '#string', createdAt: '#string' }" },
    { label: 'param', code: "And param status = 'ACTIVE'" },
    { label: 'match each', code: 'And match each response.items == account' },
    { label: 'contains', code: "And match each response.items contains { status: 'ACTIVE' }" },
    { label: '#regex', code: "'#regex ES\\\\d{22}'" },
    { label: '#?', code: "'#number? _ >= 0'" },
    { label: '##string', code: "'##string'" },
  ],
  retos: retosEn(m01Lab.retos, {
    esquema: {
      title: 'The contract of an account',
      description: '`match response == { … }` on an account’s detail, with **all** the fields in the reference and fuzzy markers (`#string`, `#number`…) instead of specific values.',
      hint: "The eight fields: id, iban, holder, type, currency, balance, status and createdAt. `balance: '#number'`, the rest `'#string'` for now. With `==`, one key too many or too few makes the match fail.",
    },
    reutiliza: {
      title: 'One schema, many tests',
      description: 'Store the schema in a variable with `def` (ideally in the `Background`) and use it in the `match`: `match response == account`.',
      hint: "In the Background: `* def account = { id: '#string', … }`. In the scenario: `And match response == account`.",
    },
    formato: {
      title: 'More than types: formats',
      description: 'Refine the schema: `#regex` for the IBAN (ES and 22 digits) and a predicate for the balance (`#number? _ >= 0`). It must still pass.',
      hint: "`iban: '#regex ES\\\\d{22}'` (in a Karate string the backslash is written twice) and `balance: '#number? _ >= 0'`.",
    },
    lista: {
      title: 'The active accounts filter',
      description: '`GET /accounts` with `param status = \'ACTIVE\'`: check that **every** account in `response.items` is active with `match each`.',
      hint: "`And match each response.items contains { status: 'ACTIVE' }`. `contains` only compares the keys you write.",
    },
    tipos: {
      title: 'The contract of each element',
      description: 'The elements of `response.items` are accounts: validate each one against the schema (`match each response.items == account`).',
      hint: 'Reuse the Background variable. If something fails, read the message: `$[1].balance | not a number` tells you the element and the field.',
    },
    evolucion: {
      title: 'Version 1.5',
      description: 'Nico has deployed 1.5. According to the changelog, it adds the optional field `alias`. Adapt the schema (`##string`: may be missing or null) and run again. Whatever still fails: is it a compatible change or a bug?',
      hint: "`alias: '##string'` in the schema. A new, optional, documented field is compatible. A field that partners use disappearing is not.",
    },
  }),
}
