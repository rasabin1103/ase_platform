import type { Doc } from '../../../../engine/types'
import type { CodeLabFile, CodeReto } from '../../../../karate/types'
import { API_REFERENCE_DOC, BASIC_SNIPPETS, KARATE_CONFIG_JS, RUNNER_JAVA } from '../shared'

/**
 * Common pieces of the Karate course in English. Translation of ../shared.ts:
 * same paths, same structure; only the text (comments, labels) changes.
 * The helpers for the retos (requested, accountRequested, correct…) are
 * language-neutral: import them from ../shared.
 */

export const KARATE_CONFIG_JS_EN: CodeLabFile = {
  ...KARATE_CONFIG_JS,
  content: `function fn() {
  // Configuration shared by every feature.
  // karate.env picks the environment (sandbox by default).
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1'
  };
  if (env == 'pre') {
    config.baseUrl = 'https://api.pre.kobalto.test/v1';
  }
  return config;
}
`,
}

export const RUNNER_JAVA_EN: CodeLabFile = {
  ...RUNNER_JAVA,
  content: `package openapi;

import com.intuit.karate.junit5.Karate;

// JUnit 5 runner: runs the .feature files in this folder.
// On your machine: mvn test -Dtest=OpenApiTest
class OpenApiTest {

    @Karate.Test
    Karate testAll() {
        return Karate.run().relativeTo(getClass());
    }
}
`,
}

export const API_REFERENCE_DOC_EN: Doc = {
  ...API_REFERENCE_DOC,
  title: 'Kobalto Open API v1 · Reference (sandbox)',
  updatedLabel: 'Maintained by Nicolás Prado',
  body: `## Base
- Sandbox URL: **https://api.kobalto.test/v1** (in the tests, the **baseUrl** variable).
- Every response is JSON.

## Endpoints
- **GET /health** → 200 with { status: "UP", service, version }.
- **GET /accounts** → 200 with { items, page, size, total }. Filters: **status** (ACTIVE, BLOCKED, CLOSED), **page** (from 1), **size** (1–100).
- **GET /accounts/{id}** → 200 with the account. The id has the format ACC-0000.
- **GET /accounts/{id}/balance** → 200 with { accountId, available, currency, updatedAt }.

## Account
- **id** (string, ACC-0000) · **iban** (string, ES + 22 digits, no spaces) · **holder** (string, account holder)
- **type** (PERSONAL or BUSINESS) · **currency** (EUR or USD) · **balance** (number, never text)
- **status** (ACTIVE, BLOCKED or CLOSED) · **createdAt** (ISO 8601 date)
- A **BLOCKED** account accepts no operations: partners must see it as blocked.

## Errors
- Common format: { code, message, traceId }.
- **400 INVALID_ACCOUNT_ID**: the id does not have the ACC-0000 format.
- **404 ACCOUNT_NOT_FOUND**: the account does not exist.
- **400 INVALID_STATUS / INVALID_PAGE / INVALID_SIZE**: invalid filters.

## Sandbox data
- **ACC-1001** · Lucía Martín Ortega · EUR · ACTIVE
- **ACC-1002** · Hugo Benítez Sola · EUR · ACTIVE (balance 0)
- **ACC-1003** · Grupo Almendra SL · EUR · **BLOCKED** (Compliance)
- **ACC-1004** · Irene Castro Vidal · **USD** · ACTIVE
- **ACC-1005** · Mateo Ruiz Prieto · EUR · CLOSED`,
}

export const BASIC_SNIPPETS_EN = BASIC_SNIPPETS.map((s) => (s.label === 'Scenario' ? { ...s, code: "Scenario: what should happen\n  Given path 'health'\n  When method get\n  Then status 200" } : s))

/** English text for the retos of a lab; the check functions stay the same objects. */
export type RetoText = Pick<CodeReto, 'title' | 'description' | 'hint'>

export function retosEn(retos: CodeReto[], text: Record<string, RetoText>): CodeReto[] {
  return retos.map((r) => {
    const t = text[r.id]
    if (!t) throw new Error(`missing English text for reto ${r.id}`)
    return { ...r, ...t }
  })
}

/** Same files with English content (same paths and order). */
export function filesEn(files: CodeLabFile[], content: Record<string, string | CodeLabFile>): CodeLabFile[] {
  return files.map((f) => {
    const c = content[f.path]
    if (c === undefined) return f
    return typeof c === 'string' ? { ...f, content: c } : c
  })
}
