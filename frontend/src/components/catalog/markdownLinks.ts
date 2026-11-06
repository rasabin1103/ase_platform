/** ¿Es un enlace relativo a otro Markdown de la misma carpeta (no web, mail ni ancla)? */
export function isRelativeMarkdownLink(href: string | undefined): boolean {
  if (!href) return false
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return false
  return /\.(md|markdown)(#.*)?$/i.test(href.split('?')[0])
}

/** Resuelve `href` relativo al directorio del documento actual (ruta relativa a la raíz del recurso).
 * Devuelve null si saldría de la carpeta del recurso. */
export function resolveRelativeMarkdownPath(currentFile: string, href: string): string | null {
  const target = decodeURIComponent(href.split('#')[0].split('?')[0])
  const base = currentFile.includes('/') ? currentFile.slice(0, currentFile.lastIndexOf('/')).split('/') : []
  const stack = target.startsWith('/') ? [] : [...base]
  for (const part of target.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (stack.length === 0) return null
      stack.pop()
    } else stack.push(part)
  }
  return stack.length ? stack.join('/') : null
}
