import { useEffect, useState, type ReactNode } from 'react'
import type { CatalogItemAdmin } from '../../api/catalogAdmin.api'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { cn } from '../../components/ui/cn'
import { useI18n } from '../../i18n'
import type { CatalogItemType } from '../../types/catalog.types'
import { ContentFields, LicenseFields } from './catalog-item/ContentSections'
import { FormSection } from './catalog-item/FormBits'
import {
  BasicsFields,
  DescriptionFields,
  MediaFields,
  OrganizeFields,
  PricingFields,
} from './catalog-item/GeneralSections'
import {
  FIELD_SECTION,
  SECTION_COPY,
  SECTION_IDS,
  sectionDomId,
  type FormValues,
  type SectionId,
} from './catalog-item/catalogItemForm.utils'
import { useCatalogItemForm, type CatalogItemSubmit } from './catalog-item/useCatalogItemForm'

type Props = {
  open: boolean
  onClose: () => void
  initial?: CatalogItemAdmin | null
  defaultType?: CatalogItemType
  onSubmit: CatalogItemSubmit
  isSubmitting?: boolean
}

const FORM_ID = 'admin-catalog-item-form'

/**
 * Alta y edición de un ítem del catálogo. El formulario se organiza en
 * secciones numeradas con navegación fija arriba; el estado y el envío viven
 * en `useCatalogItemForm` y cada sección en `./catalog-item/`.
 */
export function AdminCatalogItemModal({
  open,
  onClose,
  initial,
  defaultType = 'product',
  onSubmit,
  isSubmitting,
}: Props) {
  const { t, language } = useI18n()
  const copy = language === 'en' ? SECTION_COPY.en : SECTION_COPY.es
  const isEdit = Boolean(initial)
  const s = useCatalogItemForm({ open, initial, defaultType, onSubmit, onClose })
  const { errors } = s.form.formState

  const errorKeys = Object.keys(errors) as (keyof FormValues)[]
  const sectionsWithErrors = new Set(errorKeys.map((k) => FIELD_SECTION[k]).filter(Boolean) as SectionId[])

  const body: Record<SectionId, ReactNode> = {
    basics: <BasicsFields s={s} isEdit={isEdit} />,
    description: <DescriptionFields s={s} />,
    media: <MediaFields s={s} initial={initial} />,
    pricing: <PricingFields s={s} />,
    organize: <OrganizeFields s={s} />,
    content: <ContentFields s={s} />,
    license: <LicenseFields s={s} />,
  }

  // Sección visible (scrollspy): resalta el índice mientras se recorre el formulario.
  const [active, setActive] = useState<SectionId>(SECTION_IDS[0])
  const activeIndex = SECTION_IDS.indexOf(active)
  useEffect(() => {
    if (!open || typeof IntersectionObserver === 'undefined') return
    const visible = new Map<SectionId, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = SECTION_IDS.find((x) => sectionDomId(x) === entry.target.id)
          if (!id) continue
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top)
          else visible.delete(id)
        }
        const first = SECTION_IDS.find((x) => visible.has(x))
        if (first) setActive(first)
      },
      { rootMargin: '-15% 0px -60% 0px' },
    )
    const timer = window.setTimeout(() => {
      for (const id of SECTION_IDS) {
        const el = document.getElementById(sectionDomId(id))
        if (el) observer.observe(el)
      }
    }, 0)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [open])

  const jumpTo = (id: SectionId) => {
    setActive(id)
    document.getElementById(sectionDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('adminCatalog.formEdit') : t('adminCatalog.formCreate')}
      className="sm:max-w-3xl lg:max-w-5xl"
      allowFullscreen
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ase-muted">{t('adminCatalog.requiredMark')}</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('adminCatalog.cancel')}
            </Button>
            <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
              {t('adminCatalog.save')}
            </Button>
          </div>
        </div>
      }
    >
      {/* Móvil: barra de progreso por secciones + selector (sin scroll horizontal). */}
      <div className="sticky -top-5 z-10 -mx-6 -mt-5 mb-5 border-b border-white/10 bg-ase-surface/95 px-6 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ase-brand/15 text-xs font-bold text-sky-300 ring-1 ring-ase-brand/30">
            {activeIndex + 1}
          </span>
          <label className="min-w-0 flex-1">
            <span className="sr-only">{copy.jump}</span>
            <select
              value={active}
              onChange={(e) => jumpTo(e.target.value as SectionId)}
              className="w-full truncate rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-ase-text"
            >
              {SECTION_IDS.map((id, i) => (
                <option key={id} value={id}>
                  {i + 1}. {copy[id].title}
                  {sectionsWithErrors.has(id) ? ' ⚠' : ''}
                </option>
              ))}
            </select>
          </label>
          <span className="shrink-0 text-xs tabular-nums text-ase-muted">
            {activeIndex + 1}/{SECTION_IDS.length}
          </span>
        </div>
        <div className="mt-2.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${SECTION_IDS.length}, minmax(0, 1fr))` }} aria-hidden>
          {SECTION_IDS.map((id, i) => (
            <span
              key={id}
              className={cn(
                'h-1 rounded-full',
                sectionsWithErrors.has(id) ? 'bg-ase-error/70' : i <= activeIndex ? 'bg-ase-brand' : 'bg-white/10',
              )}
            />
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-8">
        {/* Escritorio: índice lateral fijo con la sección activa resaltada. */}
        <nav aria-label={copy.jump} className="hidden lg:block">
          <div className="sticky top-0">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ase-muted">{copy.jump}</p>
            <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[0.95rem] before:top-3 before:w-px before:bg-white/10">
              {SECTION_IDS.map((id, i) => {
                const isActive = id === active
                const hasError = sectionsWithErrors.has(id)
                return (
                  <li key={id} className="relative">
                    <button
                      type="button"
                      onClick={() => jumpTo(id)}
                      aria-current={isActive ? 'step' : undefined}
                      className={cn(
                        'group flex w-full items-start gap-3 rounded-xl px-1.5 py-2 text-left transition',
                        isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]',
                      )}
                    >
                      <span
                        className={cn(
                          'relative grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ring-1 transition',
                          hasError
                            ? 'bg-ase-error/15 text-ase-error ring-ase-error/50'
                            : isActive
                              ? 'bg-ase-brand text-white ring-ase-brand'
                              : i < activeIndex
                                ? 'bg-ase-brand/15 text-sky-300 ring-ase-brand/30'
                                : 'bg-ase-surface text-ase-muted ring-white/15',
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            'block text-sm font-medium leading-tight',
                            hasError ? 'text-ase-error' : isActive ? 'text-ase-text' : 'text-ase-text2 group-hover:text-ase-text',
                          )}
                        >
                          {copy[id].title}
                        </span>
                        {isActive ? <span className="mt-0.5 block text-[11px] leading-snug text-ase-muted">{copy[id].hint}</span> : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </nav>

      <form id={FORM_ID} className="space-y-6" onSubmit={s.handleSubmit}>
        {s.serverError ? (
          <div role="alert" className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
            {s.serverError}
          </div>
        ) : errorKeys.length > 0 ? (
          <div role="alert" className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
            {copy.errors(errorKeys.length)}
          </div>
        ) : null}

        {s.translationDisabled ? (
          <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            <span className="font-semibold">{t('adminCatalog.translationWarning.title')}</span>{' '}
            {t('adminCatalog.translationWarning.body')}
          </div>
        ) : null}

        {SECTION_IDS.map((id, i) => (
          <FormSection
            key={id}
            id={sectionDomId(id)}
            index={i + 1}
            title={copy[id].title}
            hint={copy[id].hint}
            hasError={sectionsWithErrors.has(id)}
          >
            {body[id]}
          </FormSection>
        ))}
      </form>
      </div>
    </Modal>
  )
}
