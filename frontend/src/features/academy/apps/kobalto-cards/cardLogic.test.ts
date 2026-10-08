import { describe, expect, it } from 'vitest'
import { CARD_BUGS as B, INITIAL_CARDS, exportCsv, freezeLabel, parseLimit, purchase, screenshot, setLimit, toggleFreeze, type Env } from './cardLogic'

const env = (over: Partial<Env> = {}): Env => ({ device: 'ios', lang: 'es', profile: 'personal', ...over })
const none: string[] = []

describe('tarjetas · congelar', () => {
  it('sin bugs, una tarjeta congelada rechaza las compras', () => {
    const s = toggleFreeze(INITIAL_CARDS, env({ device: 'android' }), { active: none }).state
    const r = purchase(s, env({ device: 'android' }), '20', { active: none })
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toEqual([])
  })

  it('C1: en Android la congelación no llega al servidor', () => {
    const b = { active: [B.androidFreeze] }
    const s1 = toggleFreeze(INITIAL_CARDS, env({ device: 'android' }), b).state
    const r = purchase(s1, env({ device: 'android' }), '20', b)
    expect(r.ok).toBe(true)
    expect(r.event.bugs).toEqual([B.androidFreeze])
    const s2 = toggleFreeze(INITIAL_CARDS, env(), b).state
    expect(purchase(s2, env(), '20', b).ok).toBe(false)
  })

  it('C1b: la segunda congelación no llega al servidor', () => {
    const b = { active: [B.secondFreeze] }
    let s = toggleFreeze(INITIAL_CARDS, env(), b).state
    expect(purchase(s, env(), '20', b).ok).toBe(false)
    s = toggleFreeze(s, env(), b).state
    s = toggleFreeze(s, env(), b).state
    const r = purchase(s, env(), '20', b)
    expect(r.ok).toBe(true)
    expect(r.event.bugs).toEqual([B.secondFreeze])
  })

  it('C-R1: tras el fix, en Android no se descongela', () => {
    const b = { active: [B.androidFreeze], fixed: [B.androidFreeze], regressions: [B.androidUnfreeze] }
    let s = toggleFreeze(INITIAL_CARDS, env({ device: 'android' }), b).state
    s = toggleFreeze(s, env({ device: 'android' }), b).state
    const r = purchase(s, env({ device: 'android' }), '20', b)
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toEqual([B.androidUnfreeze])
  })
})

describe('tarjetas · límite mensual', () => {
  it('interpreta el separador de miles según el idioma', () => {
    expect(parseLimit('1.000', 'es')).toBe(1000)
    expect(parseLimit('1,000', 'en')).toBe(1000)
    expect(parseLimit('1000', 'en')).toBe(1000)
    expect(parseLimit('10,5', 'es')).toBeNaN()
  })

  it('C2: en inglés «1,000» se guarda como 1 €, y las compras se rechazan', () => {
    const b = { active: [B.englishLimit] }
    const r = setLimit(INITIAL_CARDS, env({ lang: 'en' }), '1,000', b)
    expect(r.event.bugs).toEqual([B.englishLimit])
    expect(r.state.accounts.personal.limit).toBe(1)
    const p = purchase(r.state, env({ lang: 'en' }), '20', b)
    expect(p.ok).toBe(false)
    expect(p.event.bugs).toEqual([B.englishLimit])
    expect(setLimit(INITIAL_CARDS, env({ lang: 'en' }), '1000', b).event.bugs).toEqual([])
    expect(setLimit(INITIAL_CARDS, env(), '1.000', b).event.bugs).toEqual([])
  })

  it('C2b: la cuenta Joven acepta límites de más de 500 €', () => {
    const b = { active: [B.youthLimit] }
    expect(setLimit(INITIAL_CARDS, env({ profile: 'joven' }), '3000', b).event.bugs).toEqual([B.youthLimit])
    expect(setLimit(INITIAL_CARDS, env({ profile: 'joven' }), '3000', { active: none }).ok).toBe(false)
    expect(setLimit(INITIAL_CARDS, env({ profile: 'joven' }), '500', b).event.bugs).toEqual([])
  })
})

describe('tarjetas · exportar y capturas', () => {
  it('C3: el CSV no incluye el último día del rango', () => {
    const b = { active: [B.exportLastDay] }
    const r = exportCsv(INITIAL_CARDS, env(), '2026-09-01', '2026-09-30', b)
    expect(r.rows).toHaveLength(7)
    expect(r.event.bugs).toEqual([B.exportLastDay])
    expect(exportCsv(INITIAL_CARDS, env(), '2026-09-01', '2026-09-29', b).event.bugs).toEqual([])
    expect(exportCsv(INITIAL_CARDS, env(), '2026-09-01', '2026-09-30', { active: none }).rows).toHaveLength(8)
  })

  it('C5: empresa con más de un año da error 500', () => {
    const b = { active: [B.businessExport] }
    expect(exportCsv(INITIAL_CARDS, env({ profile: 'empresa' }), '2025-01-01', '2026-09-30', b).event.bugs).toEqual([B.businessExport])
    expect(exportCsv(INITIAL_CARDS, env({ profile: 'empresa' }), '2025-10-01', '2026-09-30', b).ok).toBe(true)
    expect(exportCsv(INITIAL_CARDS, env(), '2025-01-01', '2026-09-30', b).ok).toBe(true)
  })

  it('C4: la errata solo aparece en español y la captura es la evidencia', () => {
    const b = { active: [B.typo] }
    expect(freezeLabel(env(), false, b)).toBe('Conjelar tarjeta')
    expect(freezeLabel(env({ lang: 'en' }), false, b)).toBe('Freeze card')
    expect(screenshot(INITIAL_CARDS, env(), 'card', b).bugs).toEqual([B.typo])
    expect(screenshot(INITIAL_CARDS, env(), 'card', { active: none }).bugs).toEqual([])
  })
})
