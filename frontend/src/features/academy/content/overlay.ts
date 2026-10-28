/**
 * Traducción por capas (overlay). La versión inglesa de una misión parte de la
 * española y sustituye solo los textos, de modo que ids, flags, condiciones,
 * efectos, funciones y números son los mismos por construcción (i18nParity.test.ts
 * lo comprueba igualmente).
 *
 * Un `patch` refleja la forma del original, pero solo con lo que cambia:
 * - texto/número/booleano → sustituye al valor original;
 * - objeto sobre objeto → se aplica clave a clave;
 * - listas con elementos que tienen `id` → el patch es un objeto `{ [id]: patch }`;
 * - listas sin ids → el patch es un objeto `{ [índice]: patch }`, o una lista
 *   completa de textos cuando son cadenas (se sustituye entera).
 */
export type Patch = string | number | boolean | Patch[] | { [key: string]: Patch | undefined } | undefined

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

export function overlay<T>(base: T, patch: Patch): T {
  if (patch === undefined) return base
  if (Array.isArray(base)) {
    if (Array.isArray(patch)) return patch as unknown as T // lista completa de textos
    if (!isObj(patch)) throw new Error('overlay: una lista solo admite un patch en forma de objeto o lista')
    const used = new Set<string>()
    const out = base.map((item, i) => {
      const id = isObj(item) && typeof item.id === 'string' ? item.id : undefined
      const key = id !== undefined && id in patch ? id : String(i) in patch ? String(i) : undefined
      if (key === undefined) return item
      used.add(key)
      return overlay(item, patch[key])
    })
    for (const k of Object.keys(patch)) if (!used.has(k)) throw new Error(`overlay: no existe el elemento «${k}»`)
    return out as unknown as T
  }
  if (isObj(base)) {
    if (!isObj(patch)) throw new Error('overlay: se esperaba un objeto')
    const out: Obj = { ...base }
    for (const [k, v] of Object.entries(patch)) {
      if (!(k in base) && k !== 'lang') throw new Error(`overlay: clave «${k}» inexistente en el original`)
      out[k] = overlay(base[k], v)
    }
    return out as T
  }
  return patch as unknown as T
}
