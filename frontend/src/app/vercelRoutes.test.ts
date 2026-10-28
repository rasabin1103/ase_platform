import { describe, expect, it } from 'vitest'
import routerSource from './router.tsx?raw'
import seoShellsSource from '../../scripts/seo-shells.mjs?raw'
import vercelSource from '../../vercel.json?raw'

/**
 * Vercel solo sirve la SPA para las rutas de la lista blanca de vercel.json;
 * cualquier otra devuelve el 404 real (dist/404.html). Si se añade una ruta de
 * primer nivel al router sin añadirla ahí, esa página daría 404 en producción:
 * este test lo impide.
 */
const routerPaths = [...routerSource.matchAll(/path:\s*'(\/[^']*)'/g)].map((m) => m[1])
const firstSegments = new Set(
  routerPaths.filter((p) => p !== '/' && p !== '*').map((p) => p.split('/')[1]).filter((s) => !s.startsWith(':')),
)

const vercel = JSON.parse(vercelSource) as { rewrites: { source: string; destination: string }[] }
const spaRule = vercel.rewrites.find((r) => r.destination === '/app-shell.html')

describe('vercel.json: lista blanca de rutas de la SPA', () => {
  it('existe la regla que sirve app-shell.html y no hay un comodín que oculte los 404', () => {
    expect(spaRule).toBeDefined()
    expect(vercel.rewrites.some((r) => r.source === '/(.*)')).toBe(false)
  })

  it('cubre todos los primeros segmentos del router', () => {
    const allowed = new Set(spaRule!.source.match(/^\/\(([^)]*)\)/)![1].split('|'))
    const missing = [...firstSegments].filter((s) => !allowed.has(s))
    expect(missing).toEqual([])
  })

  it('no lista segmentos que ya no existen en el router', () => {
    const allowed = spaRule!.source.match(/^\/\(([^)]*)\)/)![1].split('|')
    expect(allowed.filter((s) => !firstSegments.has(s))).toEqual([])
  })
})

describe('prerender SEO: rutas con HTML propio', () => {
  const shellPaths = [...seoShellsSource.matchAll(/^\s+path:\s*'([^']+)'/gm)].map((m) => m[1])

  it('cada ruta prerenderizada existe en el router', () => {
    for (const p of shellPaths) expect(routerPaths).toContain(p)
  })

  it('incluye la portada y las páginas públicas principales', () => {
    for (const p of ['/', '/pricing', '/catalog', '/academy', '/blog', '/contact', '/privacy-policy']) {
      expect(shellPaths).toContain(p)
    }
  })
})
