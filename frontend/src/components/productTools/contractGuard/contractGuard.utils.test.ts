import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import type { CgFinding } from '../../../api/contractGuard.api'
import {
  cgErrorInfo,
  countByCategory,
  filterFindings,
  parseJsonInput,
  parseUtcDate,
  sortFindings,
  statusForbidsBody,
} from './contractGuard.utils'

function finding(over: Partial<CgFinding>): CgFinding {
  return {
    id: 'f', rule_id: 'r', category: 'response', severity: 'informational', location: 'GET /a',
    description: 'd', previous_value: null, current_value: null, recommendation: 'rec', ...over,
  }
}

describe('sortFindings', () => {
  it('ordena por gravedad y deja una severidad desconocida al final', () => {
    const sorted = sortFindings([
      finding({ id: '1', severity: 'informational' }),
      finding({ id: '2', severity: 'breaking' }),
      finding({ id: '3', severity: 'nueva' as never }),
      finding({ id: '4', severity: 'potentially_breaking' }),
    ])
    expect(sorted.map((f) => f.id)).toEqual(['2', '4', '1', '3'])
  })
})

describe('filterFindings', () => {
  const all = [
    finding({ id: '1', severity: 'breaking', category: 'request', location: 'POST /pets', description: 'Campo obligatorio nuevo' }),
    finding({ id: '2', severity: 'informational', category: 'servers', description: 'Cambia el servidor' }),
  ]
  it('filtra por severidad, categoría y texto', () => {
    expect(filterFindings(all, { severities: new Set(['breaking']), category: null, query: '' }).map((f) => f.id)).toEqual(['1'])
    expect(filterFindings(all, { severities: new Set(), category: 'servers', query: '' }).map((f) => f.id)).toEqual(['2'])
    expect(filterFindings(all, { severities: new Set(), category: null, query: 'obligatorio' }).map((f) => f.id)).toEqual(['1'])
    expect(filterFindings(all, { severities: new Set(), category: null, query: '' })).toHaveLength(2)
  })
  it('cuenta por categoría de mayor a menor', () => {
    expect(countByCategory([...all, finding({ id: '3', category: 'request' })])).toEqual([['request', 2], ['servers', 1]])
  })
})

describe('parseUtcDate', () => {
  it('trata como UTC una fecha sin zona y respeta la que la trae', () => {
    expect(parseUtcDate('2026-10-21T10:00:00').toISOString()).toBe('2026-10-21T10:00:00.000Z')
    expect(parseUtcDate('2026-10-21T12:00:00+02:00').toISOString()).toBe('2026-10-21T10:00:00.000Z')
  })
})

describe('parseJsonInput', () => {
  it('distingue vacío, null real y JSON inválido', () => {
    expect(parseJsonInput('   ')).toEqual({ ok: false, error: 'empty' })
    expect(parseJsonInput('null')).toEqual({ ok: true, value: null })
    expect(parseJsonInput('{"a":1}')).toEqual({ ok: true, value: { a: 1 } })
    expect(parseJsonInput('{a:1}').ok).toBe(false)
  })
})

describe('statusForbidsBody', () => {
  it('HEAD, 1xx, 204, 205 y 304 no llevan cuerpo', () => {
    expect(statusForbidsBody('GET', 204)).toBe(true)
    expect(statusForbidsBody('head', 200)).toBe(true)
    expect(statusForbidsBody('GET', 100)).toBe(true)
    expect(statusForbidsBody('GET', 200)).toBe(false)
  })
})

describe('cgErrorInfo', () => {
  it('lee code, message y details del formato de la pasarela', () => {
    const err = new AxiosError('x', '422', undefined, undefined, {
      status: 422, statusText: '', headers: {}, config: {} as never,
      data: { detail: { code: 'validation_error', message: 'Invalid request', details: [{ location: ['body', 'baseline_id'], message: 'Input should be a valid UUID' }] } },
    })
    expect(cgErrorInfo(err, 'fallback')).toEqual({
      status: 422, code: 'validation_error', message: 'Invalid request',
      details: [{ location: 'baseline_id', message: 'Input should be a valid UUID' }],
    })
  })
  it('usa el texto de detail o el genérico', () => {
    const plain = new AxiosError('x', '500', undefined, undefined, {
      status: 500, statusText: '', headers: {}, config: {} as never, data: { detail: 'boom' },
    })
    expect(cgErrorInfo(plain, 'fallback').message).toBe('boom')
    expect(cgErrorInfo(new Error('x'), 'fallback')).toEqual({ status: null, code: null, message: 'fallback', details: [] })
  })
})
