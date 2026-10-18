import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { canonicalUrl } from './seo'

function upsert(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

/**
 * Canónica y og:url de cada página pública, según la ruta actual.
 *
 * index.html ya no lleva una canónica fija: con una canónica a la portada en
 * el HTML inicial, Google trataba todas las páginas de la SPA como duplicados
 * de la home y no las indexaba. Se monta en PublicLayout.
 */
export function RouteSeo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const url = canonicalUrl(pathname)
    upsert(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        return link
      },
      'href',
      url,
    )
    upsert(
      'meta[property="og:url"]',
      () => {
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'og:url')
        return meta
      },
      'content',
      url,
    )
  }, [pathname])
  return null
}
