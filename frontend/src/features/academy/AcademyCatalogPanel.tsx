import { Gamepad2 } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Bloque que aparece en la ficha de un ítem del catálogo vinculado a un
 * curso del simulador (CatalogItem.academy_course_key).
 */
export function AcademyCatalogPanel({
  courseKey,
  owned,
  t,
}: {
  courseKey: string
  owned: boolean
  t: (key: string) => string
}) {
  return (
    <div className="rounded-2xl border border-ase-brand/40 bg-ase-brand/5 p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ase-brand">
        <Gamepad2 className="h-4 w-4" /> {t('catalog.academy.badge')}
      </p>
      <h2 className="mt-2 font-sans text-base font-semibold text-ase-text">{t('catalog.academy.title')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ase-text2">{t('catalog.academy.body')}</p>
      <Link
        to={`/academy/${courseKey}`}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-ase-brand px-4 py-2 text-sm font-semibold text-white hover:bg-ase-brand-strong"
      >
        {owned ? t('catalog.academy.play') : t('catalog.academy.demo')}
      </Link>
    </div>
  )
}
