import { describe, expect, it } from 'vitest'
import { markdownToReadableText } from './catalogDescription'

describe('markdownToReadableText', () => {
  it('quita las marcas de Markdown y conserva párrafos y viñetas', () => {
    const md = '**No vas a ver vídeos.** Vas a [trabajar](https://x).\n\n### Así es un día\n- 09:15 · Un *bug* en producción\n- 11:30 · El caso feliz'
    expect(markdownToReadableText(md)).toBe('No vas a ver vídeos. Vas a trabajar.\n\nAsí es un día\n• 09:15 · Un bug en producción\n• 11:30 · El caso feliz')
  })

  it('devuelve cadena vacía sin descripción', () => {
    expect(markdownToReadableText(undefined)).toBe('')
  })

  it('no rompe los asteriscos sueltos ni los porcentajes', () => {
    expect(markdownToReadableText('100 % de cobertura')).toBe('100 % de cobertura')
  })
})
