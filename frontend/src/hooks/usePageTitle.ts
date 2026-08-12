import { useEffect } from 'react'

const SITE_TITLE_SUFFIX = ' | Arce Sabin Engineering'

/** Sets a per-route <title> (and optionally the <meta name="description">)
 * so search engines don't see the same title/description on every page of
 * the SPA. Restores the previous values on unmount. */
export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title ? `${title}${SITE_TITLE_SUFFIX}` : previousTitle

    const meta = description ? document.querySelector('meta[name="description"]') : null
    const previousDescription = meta?.getAttribute('content') ?? null
    if (meta && description) {
      meta.setAttribute('content', description)
    }

    return () => {
      document.title = previousTitle
      if (meta && previousDescription !== null) {
        meta.setAttribute('content', previousDescription)
      }
    }
  }, [title, description])
}
