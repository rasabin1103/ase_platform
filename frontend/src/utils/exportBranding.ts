import aseLogoIcon from '../assets/ase-logo.png'

/** Shared corporate identity for every admin export (PDF and Excel).
 * Colors mirror the `ase.brand` / `ase.neutrals` tokens in
 * `tailwind.config.ts` exactly, so exported reports look like a natural
 * extension of the product UI rather than a generic spreadsheet/PDF. */
export const ASE_BRAND = {
  companyName: 'Arce Sabin Engineering (ASE)',
  companyShort: 'ASE',
  website: 'www.arcesabinengineering.com',
  email: 'contact@arcesabinengineering.com',
  colors: {
    brand: '#38BDF8',
    brandStrong: '#0EA5E9',
    gold: '#E8B368',
    goldStrong: '#D89A3E',
    ink: '#020617',
    slate: '#0F172A',
    graphite: '#111827',
    ash: '#1E293B',
    fog: '#94A3B8',
    mist: '#CBD5E1',
    chalk: '#F8FAFC',
    line: '#334155',
    white: '#FFFFFF',
  },
} as const

/** Same palette, without the `#`, for libraries (ExcelJS ARGB fills) that
 * expect bare hex. */
export const ASE_BRAND_HEX = Object.fromEntries(
  Object.entries(ASE_BRAND.colors).map(([key, value]) => [key, value.replace('#', '')]),
) as Record<keyof typeof ASE_BRAND.colors, string>

let cachedLogoDataUrl: Promise<string | null> | null = null

/** Fetches the ASE icon logo (already bundled as a static asset used
 * elsewhere in the app) and resolves it as a base64 PNG data URL. Done via
 * `fetch()` against the Vite-hashed asset URL — rather than inlining the
 * ~330KB PNG as a base64 constant in this module — so the payload never
 * ships in any JS chunk and is only pulled over the network the moment an
 * admin actually triggers an export. Memoized so repeated exports in the
 * same session reuse one fetch. */
export function loadAseLogoDataUrl(): Promise<string | null> {
  if (!cachedLogoDataUrl) {
    cachedLogoDataUrl = fetch(aseLogoIcon)
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        const bytes = new Uint8Array(buf)
        let binary = ''
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
        return `data:image/png;base64,${btoa(binary)}`
      })
      .catch(() => null)
  }
  return cachedLogoDataUrl
}

export function reportFooterLine(lang: 'es' | 'en' = 'es'): string {
  return lang === 'en'
    ? `${ASE_BRAND.companyName} · Confidential internal report · ${ASE_BRAND.website}`
    : `${ASE_BRAND.companyName} · Informe confidencial de uso interno · ${ASE_BRAND.website}`
}
