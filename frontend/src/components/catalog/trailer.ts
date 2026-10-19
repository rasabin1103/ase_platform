/**
 * Tráiler opcional de un ítem del catálogo (backend: app/core/video_urls.py).
 * El backend guarda los enlaces de YouTube en forma canónica, pero aquí se
 * interpretan todas las variantes para que la vista previa del admin funcione
 * mientras se escribe.
 */

export type Trailer = { kind: 'youtube'; id: string } | { kind: 'file'; src: string }

const YT_ID = /^[A-Za-z0-9_-]{11}$/
const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

export function youtubeId(raw: string | null | undefined): string | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  let candidate: string | null = null
  if (host === 'youtu.be') {
    candidate = url.pathname.replace(/^\/+/, '').split('/')[0] ?? null
  } else if (YT_HOSTS.has(host)) {
    const path = url.pathname.replace(/\/+$/, '')
    if (path === '/watch') candidate = url.searchParams.get('v')
    else {
      const parts = path.split('/')
      if (parts.length >= 3 && ['shorts', 'embed', 'live', 'v'].includes(parts[1])) candidate = parts[2]
    }
  }
  return candidate && YT_ID.test(candidate) ? candidate : null
}

export function parseTrailer(raw: string | null | undefined): Trailer | null {
  const value = raw?.trim()
  if (!value) return null
  const id = youtubeId(value)
  if (id) return { kind: 'youtube', id }
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && /\.(mp4|webm)$/i.test(url.pathname)) return { kind: 'file', src: value }
  } catch {
    return null
  }
  return null
}

export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

/** Sin cookies hasta que se reproduce; `rel=0` limita las sugerencias al propio canal. */
export const youtubeEmbedUrl = (id: string, autoplay = true) =>
  `https://www.youtube-nocookie.com/embed/${id}?${autoplay ? 'autoplay=1&' : ''}rel=0&modestbranding=1&playsinline=1`

/** Datos estructurados schema.org/VideoObject del tráiler (SEO). */
export function trailerJsonLd(
  trailer: Trailer,
  opts: { name: string; description: string; uploadDate?: string | null; thumbnailUrl?: string | null },
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: opts.name,
    description: opts.description || opts.name,
  }
  if (opts.uploadDate) base.uploadDate = opts.uploadDate
  if (trailer.kind === 'youtube') {
    base.thumbnailUrl = youtubeThumbnail(trailer.id)
    base.embedUrl = youtubeEmbedUrl(trailer.id, false)
    base.contentUrl = `https://www.youtube.com/watch?v=${trailer.id}`
  } else {
    base.contentUrl = trailer.src
    if (opts.thumbnailUrl) base.thumbnailUrl = opts.thumbnailUrl
  }
  return base
}
