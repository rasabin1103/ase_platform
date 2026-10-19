import { describe, expect, it } from 'vitest'
import { parseTrailer, trailerJsonLd, youtubeEmbedUrl, youtubeId } from './trailer'

const ID = 'dQw4w9WgXcQ'

describe('trailer', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}?si=x`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://m.youtube.com/watch?v=${ID}&t=3s`,
  ])('reconoce %s como YouTube', (url) => {
    expect(youtubeId(url)).toBe(ID)
    expect(parseTrailer(url)).toEqual({ kind: 'youtube', id: ID })
  })

  it('acepta archivos de vídeo https propios', () => {
    expect(parseTrailer('https://cdn.example.com/t.mp4')).toEqual({ kind: 'file', src: 'https://cdn.example.com/t.mp4' })
  })

  it.each([null, '', '   ', 'https://example.com/page', 'http://cdn.example.com/t.mp4', 'nope'])('ignora %s', (v) => {
    expect(parseTrailer(v)).toBeNull()
  })

  it('embebe sin cookies y sin sugerencias ajenas', () => {
    expect(youtubeEmbedUrl(ID)).toContain('youtube-nocookie.com/embed/')
    expect(youtubeEmbedUrl(ID)).toContain('rel=0')
  })

  it('genera VideoObject', () => {
    const ld = trailerJsonLd({ kind: 'youtube', id: ID }, { name: 'Tráiler', description: 'd', uploadDate: '2026-10-19' })
    expect(ld['@type']).toBe('VideoObject')
    expect(ld.thumbnailUrl).toContain(ID)
    expect(ld.uploadDate).toBe('2026-10-19')
  })
})
