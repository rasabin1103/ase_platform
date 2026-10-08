import type { ReactNode } from 'react'
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

  const jumpTo = (id: SectionId) =>
    document.getElementById(sectionDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('adminCatalog.formEdit') : t('adminCatalog.formCreate')}
      className="sm:max-w-3xl"
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
      <nav
        aria-label={copy.jump}
        className="sticky -top-5 z-10 -mx-6 -mt-5 mb-5 flex gap-1.5 overflow-x-auto border-b border-white/10 bg-ase-surface px-6 py-3"
      >
        {SECTION_IDS.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => jumpTo(id)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition',
              sectionsWithErrors.has(id)
                ? 'border-ase-error/40 bg-ase-error/10 text-ase-error'
                : 'border-white/10 text-ase-text2 hover:border-ase-brand/40 hover:text-ase-text',
            )}
          >
            {i + 1}. {copy[id].title}
          </button>
        ))}
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
    </Modal>
  )
}
