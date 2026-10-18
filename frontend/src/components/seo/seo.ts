import { useEffect } from 'react'
import { SITE_URL } from './JsonLd'

/** URL canónica de una ruta: dominio público + ruta, sin query, hash ni barra final. */
export function canonicalUrl(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/'
  return `${SITE_URL}${path === '/' ? '/' : path}`
}

/** Página que no debe indexarse (404, privadas): añade robots noindex mientras está montada. */
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'robots')
    meta.setAttribute('content', 'noindex')
    document.head.appendChild(meta)
    const canonical = document.head.querySelector('link[rel="canonical"]')
    canonical?.remove()
    return () => {
      meta.remove()
    }
  }, [])
}
