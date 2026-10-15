import { describe, expect, it } from 'vitest'
import { INITIAL_INCIDENT, breakdown, disableFlag, query, reproduce, rollback } from './incidentLogic'

describe('incident console · English', () => {
  it('breakdown numbers do not depend on the language', () => {
    const es = breakdown('amount', { endpoint: 'instant' }, 'I1', false)
    const en = breakdown('amount', { endpoint: 'instant' }, 'I1', false, 'en')
    const nums = (rows: typeof es) => rows.map((r) => [r.id, r.requests, r.errors, r.rate])
    expect(nums(en)).toEqual(nums(es))
    expect(en.map((r) => r.label)).toEqual(['Up to €1,000', 'Over €1,000'])
  })

  it('actions keep flags, bugs and costs with English summaries', () => {
    const q = query(INITIAL_INCIDENT, 'endpoint', { os: 'android' }, ['I1'], [], 'en')
    expect(q.event.summary).toMatch(/^Errors by operation \(OS = Android\)/)
    expect(disableFlag(INITIAL_INCIDENT, 'instant_fees_v2', 30, ['I1'], [], 'en').event.flags).toEqual(disableFlag(INITIAL_INCIDENT, 'instant_fees_v2', 30, ['I1']).event.flags)
    expect(rollback(INITIAL_INCIDENT, 30, 'en').event.flags).toEqual(rollback(INITIAL_INCIDENT, 30).event.flags)
    const input = { endpoint: 'instant', os: 'android', version: '5.1.0', amount: 'high', account: 'new' }
    const ko = reproduce(INITIAL_INCIDENT, input, ['I1'], [], 'en')
    expect(ko.event.bugs).toEqual(['I1'])
    expect(ko.event.summary).toContain('FAILS')
    expect(ko.event.summary).toContain('local format')
  })
})
