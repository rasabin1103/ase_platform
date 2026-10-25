/**
 * Páginas que se muestran: siempre la primera y la última, y dos a cada lado
 * de la actual; los huecos se marcan con «…». Por ejemplo, en la 6 de 12:
 * 1 … 4 5 6 7 8 … 12.
 */
export function visiblePages(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages = new Set([1, pageCount, page - 2, page - 1, page, page + 1, page + 2].filter((p) => p >= 1 && p <= pageCount))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p - sorted[i - 1] === 2 ? p - 1 : 'gap')
    out.push(p)
  })
  return out
}
