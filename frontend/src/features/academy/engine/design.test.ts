import { describe, expect, it } from 'vitest'
import { m00PrimerDia as mission } from '../content/courses/testing-fundamentals/m00-primer-dia'
import { m00Design as model } from '../content/courses/testing-fundamentals/m00-design'
import { designCoverage } from './design'
import { replay, step, summarize } from './engine'
import type { Action } from './types'

const A = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6']
const add = (area: string, input: string, expectAccept: boolean): Action => ({ type: 'designAdd', area, input, expectAccept })

describe('modelo de diseño de KOB-142', () => {
  it('clasifica importes en particiones y límites', () => {
    expect(model.classify('amount', '150')).toEqual(['valid'])
    expect(model.classify('amount', '-50')).toEqual(['negative'])
    expect(model.classify('amount', '0')).toEqual(['zero'])
    expect(model.classify('amount', '5000')).toEqual(['max_boundary'])
    expect(model.classify('amount', '5000,01')).toEqual(['comma_decimal', 'above_max_boundary'])
    expect(model.classify('amount', 'abc')).toEqual(['non_numeric'])
  })

  it('calcula el resultado esperado según la especificación', () => {
    expect(model.expected('amount', '5000')).toBe(true)
    expect(model.expected('amount', '5000.01')).toBe(false)
    expect(model.expected('iban', 'ES31 9101 0001 1202 0001 2345')).toBe(false)
    expect(model.expected('daily', '4000 + 2000')).toBe(true)
    expect(model.expected('daily', '4000 + 2500')).toBe(false)
    expect(model.expected('concept', '141 caracteres')).toBe(false)
  })

  it('sabe qué bug revelaría cada caso', () => {
    expect(model.reveals?.('amount', '-50', A)).toBe('B2')
    expect(model.reveals?.('amount', '10,50', A)).toBe('B3')
    expect(model.reveals?.('amount', '5000.50', A)).toBe('B1')
    expect(model.reveals?.('iban', 'ES31 9101 0001 1202 0001 2345', A)).toBe('B4')
    expect(model.reveals?.('daily', '4000 + 2500', A)).toBe('B6')
    expect(model.reveals?.('double', 'doble clic', A)).toBe('B5')
    expect(model.reveals?.('amount', '150', A)).toBeUndefined()
  })
})

describe('diseño de pruebas en el motor', () => {
  it('añadir casos consume tiempo y la revisión de Laura llega por chat', () => {
    let s = replay(mission, 1, [{ type: 'start' }, add('amount', '150', true), add('amount', '-50', false)])
    expect(s.designCases).toHaveLength(2)
    expect(s.clock).toBe(4)
    s = step(mission, s, { type: 'designReview' })
    const review = s.messages.at(-1)!
    expect(review.from).toBe('laura')
    expect(review.body).toContain('2 casos')
    expect(review.body).toContain('Importe')
    expect(s.clock).toBe(14)
  })

  it('la cobertura y los errores de resultado esperado se calculan', () => {
    const s = replay(mission, 1, [
      { type: 'start' },
      add('amount', '150', true),
      add('amount', '5000', false), // incorrecto: 5000 se acepta
      add('double', 'doble clic', false),
    ])
    const cov = designCoverage(mission, s)!
    expect(cov.coreCovered).toBe(3)
    expect(cov.expectedErrors).toBe(1)
    expect(cov.cases[1].missingRules).toBe(true) // no preguntó a la PO
    expect(cov.revealingCases).toBeGreaterThanOrEqual(1) // doble envío siempre; 5000 si sale la variante B1b
    expect(cov.designedBeforeExecuting).toBe(true)
  })

  it('el diseño completo suma rigor en el debrief', () => {
    const base: Action[] = [{ type: 'start' }]
    const full: Action[] = [
      ...base,
      add('amount', '150', true),
      add('amount', '0', false),
      add('amount', '-50', false),
      add('amount', '0.01', true),
      add('amount', '5000', true),
      add('amount', '5000.01', false),
      add('amount', '10,50', true),
      add('iban', 'ES30 9101 0001 1202 0001 2345', true),
      add('iban', 'ES31 9101 0001 1202 0001 2345', false),
      add('iban', 'ES12', false),
      add('beneficiary', 'Ana', true),
      add('beneficiary', '', false),
      add('concept', '140 caracteres', true),
      add('concept', '141 caracteres', false),
      add('daily', '3000 + 2000', true),
      add('daily', '3000 + 3000', true),
      add('daily', '4000 + 2500', false),
      add('double', 'doble clic', false),
    ]
    const s = replay(mission, 1, full)
    const cov = designCoverage(mission, s)!
    expect(cov.ratio).toBe(1)
    expect(cov.expectedErrors).toBe(0)
    const end = step(mission, replay(mission, 1, [...full, { type: 'endDay' }]), { type: 'wait', minutes: 0 })
    expect(summarize(mission, end).stars.rigor).toBeGreaterThan(summarize(mission, replay(mission, 1, [...base, { type: 'endDay' }])).stars.rigor)
  })
})
