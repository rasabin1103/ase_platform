import type { CodeLabModel } from '../../../../karate/types'
import { M03_FEATURE_PATH, m03Lab } from '../m03-lab'
import { RUNNER_JAVA_EN, filesEn, retosEn } from './shared'

/** Replaces each Spanish fragment with its English text; fails loudly if a fragment is missing. */
function tr(content: string, pairs: [string, string][]): string {
  return pairs.reduce((acc, [es, en]) => {
    if (!acc.includes(es)) throw new Error(`m03-lab (en): fragment not found: ${es}`)
    return acc.replace(es, en)
  }, content)
}

const FEATURE_EN = tr(m03Lab.files.find((f) => f.path === M03_FEATURE_PATH)?.content ?? '', [
  ['Feature: Kobalto Open API · transferencias', 'Feature: Kobalto Open API · transfers'],
  ['# Hoy: crear (POST), leer (GET) y confirmar una transferencia.', '# Today: create (POST), read (GET) and confirm a transfer.'],
  ['# La especificación está en la wiki: «Transferencias (beta)».', '# The specification is in the wiki: “Transfers (beta)”.'],
  ['Scenario: crear una transferencia', 'Scenario: create a transfer'],
  ['# Comprueba aquí el código y la respuesta.', '# Check the status code and the response here.'],
])

/** English translation of ../m03-lab.ts: same checks, server and paths; only the text changes. */
export const m03LabEn: CodeLabModel = {
  ...m03Lab,
  files: filesEn(m03Lab.files, {
    [M03_FEATURE_PATH]: FEATURE_EN,
    [RUNNER_JAVA_EN.path]: RUNNER_JAVA_EN,
  }),
  retos: retosEn(m03Lab.retos, {
    crear: {
      title: 'Create a transfer',
      description: '`POST /transfers` with a JSON body (`request`): check that it responds **201** and that the transfer starts with `status` `PENDING` and an `id`.',
      hint: "After `When method post`: `Then status 201` and `And match response contains { id: '#string', status: 'PENDING' }`.",
    },
    fichero: {
      title: 'The body in a file',
      description: 'Move the body to `payloads/transfer.json` and read it with `read()`. To make it work for any test, use **embedded expressions** (`"#(amount)"`) instead of fixed values.',
      hint: "In the JSON: `\"amount\": \"#(amount)\"`. In the scenario, before reading it: `* def amount = 25`, then `* def body = read('payloads/transfer.json')` and `And request body`.",
    },
    encadenar: {
      title: 'Create and read: chaining',
      description: 'A 201 tells you it was created, not what was stored. Save the `id` from the response (`def`) and read it with `GET /transfers/{id}`: the `amount` must be **exactly** the one you sent. Try it with decimals (150.75).',
      hint: '`* def transferId = response.id`, then `Given path \'transfers\', transferId` · `When method get` · `Then status 200` · `And match response.amount == amount`. No hand-written ids: every run creates a new one.',
    },
    confirmar: {
      title: 'Confirm and see the effect',
      description: 'Confirm the transfer (`POST /transfers/{id}/confirm` → `COMPLETED`) and check the **effect**: the account’s available balance (`GET /accounts/{id}/balance`) goes down by exactly the amount.',
      hint: 'Read the balance first (`* def before = response.available`), create and confirm, then read it again: `And match response.available == before - amount`.',
    },
    doble: {
      title: 'Confirm twice',
      description: 'Carmen asks what happens if a partner retries the confirmation. According to the specification, the second confirmation responds **409** `TRANSFER_ALREADY_COMPLETED` and does not charge again.',
      hint: 'In the same scenario: create, confirm (200) and confirm the same `transferId` again: `Then status 409` and `match response.code == \'TRANSFER_ALREADY_COMPLETED\'`.',
    },
    fondos: {
      title: 'Not enough balance',
      description: 'A partner asks what we return if the customer doesn’t have enough money. Try a transfer for **more** than the available balance: **422** `INSUFFICIENT_FUNDS`.',
      hint: 'With `set` you change one field of the body: `* set body.amount = 999999`. Or use ACC-1002, which has a balance of 0.',
    },
  }),
}
