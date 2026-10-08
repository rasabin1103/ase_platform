import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import type { CatalogItemAdmin, TestInputVariableDef } from '../../../api/catalogAdmin.api'
import { getCatalogTranslationStatus } from '../../../api/catalogAdmin.api'
import { listCatalogCategories } from '../../../api/catalogCategories.api'
import type { PendingGalleryImage } from '../../../components/admin/premium/CatalogGalleryPicker'
import { useI18n } from '../../../i18n'
import type { CatalogItemType } from '../../../types/catalog.types'
import { parseApiError } from '../../../utils/apiError'
import {
  FIELD_SECTION,
  defaultValues,
  parseChangelog,
  parseCompatibility,
  parseTags,
  sectionDomId,
  valuesFromItem,
  type FormValues,
} from './catalogItemForm.utils'

export type CatalogItemSubmit = (
  values: FormValues,
  imageFile: File | null,
  pendingGallery: PendingGalleryImage[],
  pendingCoverKey: string | null,
) => Promise<void>

/**
 * Estado y envío del formulario de ítem del catálogo: react-hook-form para
 * los campos tipados y estado local para los que se editan como texto libre
 * (etiquetas, changelog, compatibilidad), los campos de categoría y las
 * variables de ejecución de tests.
 */
export function useCatalogItemForm({
  open,
  initial,
  defaultType,
  onSubmit,
  onClose,
}: {
  open: boolean
  initial?: CatalogItemAdmin | null
  defaultType: CatalogItemType
  onSubmit: CatalogItemSubmit
  onClose: () => void
}) {
  const { t } = useI18n()
  const form = useForm<FormValues>({ defaultValues: defaultValues(defaultType) })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingGallery, setPendingGallery] = useState<PendingGalleryImage[]>([])
  const [pendingCoverKey, setPendingCoverKey] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [tagsInput, setTagsInput] = useState('')
  const [changelogInput, setChangelogInput] = useState('')
  const [compatibilityInput, setCompatibilityInput] = useState('')
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})
  const [testInputSchema, setTestInputSchema] = useState<TestInputVariableDef[]>([])

  const categoriesQuery = useQuery({
    queryKey: ['admin-catalog-categories-active'],
    queryFn: () => listCatalogCategories({ active_only: true }),
    enabled: open,
  })
  // Con la traducción desactivada, cada guardado copia el texto en español a
  // los campos en inglés (CatalogAdminService._ensure_english_fields); el
  // formulario lo avisa con un banner.
  const translationStatusQuery = useQuery({
    queryKey: ['catalog-translation-status'],
    queryFn: getCatalogTranslationStatus,
    enabled: open,
  })

  // Reinicia el estado al (re)abrir o al cambiar de ítem sin un efecto: este
  // patrón de «ajustar estado durante el render» no añade un commit extra.
  const resetKey = `${open}:${initial?.id ?? 'new'}:${defaultType}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    if (open) {
      setServerError(null)
      form.reset(initial ? valuesFromItem(initial) : defaultValues(defaultType))
      setTagsInput((initial?.tags ?? []).join(', '))
      setChangelogInput((initial?.changelog ?? []).join('\n'))
      setCompatibilityInput((initial?.compatibility ?? []).join(', '))
      setCustomFields(initial?.custom_fields ?? {})
      setTestInputSchema(initial?.test_input_schema ?? [])
      setImageFile(null)
      setPendingGallery((prev) => {
        prev.forEach((img) => {
          if (img.kind === 'file') URL.revokeObjectURL(img.previewUrl)
        })
        return []
      })
      setPendingCoverKey(null)
    }
  }

  const submitValid = async (values: FormValues) => {
    setServerError(null)
    // Un campo «_en» solo se envía como traducción manual si el admin lo ha
    // tocado en esta sesión; si no, va null y el backend vuelve a traducir
    // desde el español (evita bloquear una traducción antigua).
    const dirty = form.formState.dirtyFields
    const englishOverrides = {
      title_en: dirty.title_en && values.title_en ? values.title_en.trim() : null,
      short_description_en:
        dirty.short_description_en && values.short_description_en ? values.short_description_en.trim() : null,
      long_description_en:
        dirty.long_description_en && values.long_description_en ? values.long_description_en.trim() : null,
    }
    try {
      await onSubmit(
        {
          ...values,
          ...englishOverrides,
          tags: parseTags(tagsInput),
          changelog: parseChangelog(changelogInput),
          compatibility: parseCompatibility(compatibilityInput),
          custom_fields: customFields,
          test_input_schema: testInputSchema.filter((v) => v.key && v.label),
        },
        imageFile,
        pendingGallery,
        pendingCoverKey,
      )
      onClose()
    } catch (err) {
      const parsed = parseApiError(err, t('adminCatalog.saveError') as string)
      if (/slug/i.test(parsed.message) && /exist/i.test(parsed.message)) {
        form.setError('slug', { type: 'server', message: t('adminCatalog.slugExists') as string })
      }
      if (/redeem code/i.test(parsed.message) && /use/i.test(parsed.message)) {
        form.setError('repo_redeem_code', { type: 'server', message: t('adminCatalog.repoRedeemCodeExists') as string })
      }
      for (const [field, message] of Object.entries(parsed.fieldErrors)) {
        form.setError(field as keyof FormValues, { type: 'server', message })
      }
      setServerError(parsed.message)
    }
  }

  // Si la validación falla, lleva a la sección del primer campo con error
  // (react-hook-form ya enfoca el campo cuando está registrado).
  const submitInvalid = (errors: FieldErrors<FormValues>) => {
    const first = Object.keys(errors)[0] as keyof FormValues | undefined
    const section = first ? FIELD_SECTION[first] : undefined
    if (section) document.getElementById(sectionDomId(section))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return {
    form,
    handleSubmit: form.handleSubmit(submitValid, submitInvalid),
    serverError,
    translationDisabled: translationStatusQuery.data?.enabled === false,
    categories: categoriesQuery.data ?? [],
    imageFile,
    setImageFile,
    pendingGallery,
    setPendingGallery,
    pendingCoverKey,
    setPendingCoverKey,
    tagsInput,
    setTagsInput,
    changelogInput,
    setChangelogInput,
    compatibilityInput,
    setCompatibilityInput,
    customFields,
    setCustomFields,
    testInputSchema,
    setTestInputSchema,
  }
}

export type CatalogItemFormState = ReturnType<typeof useCatalogItemForm>
