import { describe, expect, it } from 'vitest'
import { COMMENTS, INITIAL_RFC, choose, publishAdr, respond, sendRfc, type RfcState, type Section } from './rfcLogic'

function draft(choices: Record<Section['id'], string>) {
  let s: RfcState = INITIAL_RFC
  for (const [k, v] of Object.entries(choices)) s = choose(s, k as Section['id'], v).state
  return s
}
const GOOD = { scope: 'minimum', choice: 'criteria', migration: 'incremental', governance: 'adr_guild' } as const

describe('app RFC (curso 4 · misión 4)', () => {
  it('el RFC bueno: mínimo común, criterios y piloto, migración incremental y guild', () => {
    const r = sendRfc(draft(GOOD))
    expect(r.event.cost).toBe(20)
    expect(r.event.flags).toEqual(['rfc.sent', 'rfc.good', 'governance.ok', 'migration.ok'])
  })

  it('una herramienta obligatoria o migrar todo de golpe es imponer', () => {
    expect(sendRfc(draft({ ...GOOD, scope: 'one_tool' })).event.flags).toContain('rfc.imposed')
    const flags = sendRfc(draft({ ...GOOD, migration: 'big_bang' })).event.flags
    expect(flags).toContain('rfc.imposed')
    expect(flags).not.toContain('migration.ok')
    expect(flags).not.toContain('rfc.good')
  })

  it('no se puede enviar incompleto ni responder antes de enviar', () => {
    const half = choose(INITIAL_RFC, 'scope', 'minimum').state
    expect(sendRfc(half).event.action).toBe('noop')
    expect(respond(half, 'c_pagos', 'adapt').event.action).toBe('noop')
    expect(publishAdr(half).event.action).toBe('noop')
  })

  it('responder con criterio a los tres squads da adopción, Pagos y alcance', () => {
    let s = sendRfc(draft(GOOD)).state
    expect(choose(s, 'scope', 'one_tool').event.action).toBe('noop')
    expect(publishAdr(s).event.action).toBe('noop')
    for (const c of COMMENTS) s = respond(s, c.id, 'adapt').state
    const r = publishAdr(s)
    expect(r.event.cost).toBe(15)
    expect(r.event.flags).toEqual(['adr.published', 'pagos.ok', 'ui.scoped', 'adoption.ok'])
    expect(respond(r.state, 'c_ui', 'rule').event.action).toBe('noop')
  })

  it('una buena respuesta a Pagos no basta si la migración es de golpe', () => {
    let s = sendRfc(draft({ ...GOOD, migration: 'big_bang' })).state
    for (const c of COMMENTS) s = respond(s, c.id, 'adapt').state
    expect(publishAdr(s).event.flags).toEqual(['adr.published', 'ui.scoped'])
  })
})
