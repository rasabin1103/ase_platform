export type ProfileForm = {
  first_name: string
  last_name: string
  display_name: string
  phone_e164: string
}

export function fmtDate(iso: string | null | undefined, language: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** "1 año 3 meses" / "8 meses" style tenure label from an account creation
 * date — kept as a small local helper (language-branched, not a full i18n
 * key set) since it's a single presentational string, not reusable copy. */
export function tenureLabel(createdAt: string | null | undefined, language: string): string | null {
  if (!createdAt) return null
  const start = new Date(createdAt)
  if (Number.isNaN(start.getTime())) return null
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  if (months < 0) months = 0

  const years = Math.floor(months / 12)
  const remMonths = months % 12
  const isEn = language === 'en'

  if (years === 0) {
    const n = months < 1 ? 0 : months
    return isEn ? `${n} month${n === 1 ? '' : 's'}` : `${n} mes${n === 1 ? '' : 'es'}`
  }
  const yearPart = isEn ? `${years} year${years === 1 ? '' : 's'}` : `${years} año${years === 1 ? '' : 's'}`
  if (remMonths === 0) return yearPart
  const monthPart = isEn
    ? `${remMonths} month${remMonths === 1 ? '' : 's'}`
    : `${remMonths} mes${remMonths === 1 ? '' : 'es'}`
  return `${yearPart} ${monthPart}`
}
