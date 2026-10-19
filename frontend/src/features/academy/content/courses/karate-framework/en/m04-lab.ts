import type { CodeLabModel } from '../../../../karate/types'
import { M04_DATA_PATH, M04_FEATURE_PATH, m04Lab } from '../m04-lab'
import { RUNNER_JAVA_EN, filesEn, retosEn } from './shared'

/** English translation of ../m04-lab.ts: same lab, only the text changes. */

const FEATURE = `Feature: Kobalto Open API · transfer rules

  # The rules are in the wiki: “Transfers · rules for partners”.
  # Today: one scenario, lots of data.

  Background:
    * url baseUrl

  Scenario: €500 transfer
    * def amount = 500
    * def body = read('payloads/transfer.json')
    Given path 'transfers'
    And request body
    When method post
    Then status 201
`

const DATA = `[
  { "name": "invalid IBAN", "patch": { "toIban": "ES12" }, "status": 400, "code": "INVALID_IBAN" }
]
`

export const m04LabEn: CodeLabModel = {
  ...m04Lab,
  files: filesEn(m04Lab.files, {
    [M04_FEATURE_PATH]: FEATURE,
    [M04_DATA_PATH]: DATA,
    'src/test/java/openapi/OpenApiTest.java': RUNNER_JAVA_EN,
  }),
  snippets: [
    { label: 'Scenario Outline', code: "Scenario Outline: amount <amount> → <status>\n  * def body = read('payloads/transfer.json')\n  Given path 'transfers'\n  And request body\n  When method post\n  Then status <status>\n\n  Examples:\n    | amount! | status |\n    | 500     | 201    |" },
    { label: 'Examples', code: 'Examples:\n  | amount! | status |\n  | 0.01    | 201    |' },
    { label: '| read() |', code: "Examples:\n  | read('data/negativos.json') |" },
    { label: 'karate.merge', code: "* def body = karate.merge(read('payloads/transfer.json'), patch)" },
    { label: "'x'.repeat(n)", code: "* set body.concept = 'x'.repeat(len)" },
    { label: 'match code', code: 'And match response.code == code' },
  ],
  retos: retosEn(m04Lab.retos, {
    outline: {
      title: 'One scenario, lots of data',
      description: 'Turn the scenario into a `Scenario Outline` with an `Examples:` table of at least **3 amounts**. Each row is an independent test in the report.',
      hint: 'Change `Scenario:` to `Scenario Outline:`, use `<amount>` where the value goes and add the table. Careful: a plain column arrives as **text**; with `amount!` it arrives as a number.',
    },
    limites: {
      title: 'The edges',
      description: 'The rules say: minimum **€0.01**, maximum **€1,000** per transfer on personal accounts. Test just on each side of every edge: `0.01`, `1000` and `1000.01` (and `0` if you like).',
      hint: 'One value inside and one outside each limit (boundary value analysis). Amounts as numbers: column `amount!`. And the expected result of each row in another column (`status`).',
    },
    codigos: {
      title: 'The expected result, in the table',
      description: 'Each row states what should happen: the `status` (and, if you like, the error code) comes from a column. One table with rows expecting **201** and rows expecting an error.',
      hint: '`Then status <status>` with a `status` column. To check the error: a `code` column and `And match response.code == code` (or `<code>` in quotes).',
    },
    negativos: {
      title: 'The error matrix',
      description: 'Cover at least **4 different errors** from the specification: invalid IBAN, different currency, blocked account, no balance, over the limit…',
      hint: 'Sandbox data: ACC-1004 is in dollars, ACC-1003 is blocked and ACC-1002 has a balance of 0. With `karate.merge(body, patch)` you change only the field for each case.',
    },
    json: {
      title: 'The data, outside the feature',
      description: 'Move the error matrix to `data/negativos.json` and use it as **dynamic Examples**: `| read(\'data/negativos.json\') |`. Each object is a row, with its types.',
      hint: "Under `Examples:` a single cell: `| read('data/negativos.json') |`. Each key of the object is a variable (`patch`, `status`, `code`…) and `<name>` works in the title.",
    },
    concepto: {
      title: 'The 140-character concept',
      description: 'Carmen reminds you that the concept of a SEPA transfer allows up to **140 characters**. Test 140 (accepted) and 141 (rejected).',
      hint: "A table with `len!` and `* set body.concept = 'x'.repeat(len)`: it generates a text of that length without typing it.",
    },
  }),
}
