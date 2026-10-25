import { describe, expect, it } from 'vitest'
import { INITIAL_PR, setComment, submitReview, type CommentKind, type PrState } from './prLogic'

function review(map: Record<string, CommentKind>) {
  let s: PrState = INITIAL_PR
  for (const [h, k] of Object.entries(map)) s = setComment(s, h, k).state
  return submitReview(s)
}
const GOOD: Record<string, CommentKind> = { h1: 'helpful', h2: 'helpful', h3: 'helpful', h4: 'nit', h5: 'none', h6: 'praise' }

describe('app Revisión (curso 4 · misión 3)', () => {
  it('la revisión buena: problemas con el porqué, gustos opcionales y reconocer lo bien hecho', () => {
    const r = review(GOOD)
    expect(r.event.cost).toBe(20)
    expect(r.event.flags).toEqual(['review.submitted', 'review.caught', 'review.kind', 'review.ok'])
  })

  it('un comentario seco detecta el problema pero no es amable', () => {
    const flags = review({ ...GOOD, h1: 'harsh' }).event.flags
    expect(flags).toEqual(expect.arrayContaining(['review.caught', 'review.harsh']))
    expect(flags).not.toContain('review.kind')
  })

  it('arreglarlo tú y bloquear por gustos se detectan', () => {
    expect(review({ ...GOOD, h2: 'rewrite' }).event.flags).toContain('review.took_over')
    expect(review({ ...GOOD, h4: 'helpful' }).event.flags).toContain('review.nitpicky')
  })

  it('sin comentar el bloque 1, el test débil pasa la revisión', () => {
    expect(review({ ...GOOD, h1: 'none' }).event.flags).not.toContain('review.caught')
  })

  it('no se puede cambiar tras enviar', () => {
    const r = review(GOOD)
    expect(setComment(r.state, 'h1', 'harsh').state.comments.h1).toBe('helpful')
  })
})
