import { useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { CatalogItemAdmin } from '../../../api/catalogAdmin.api'
import { CatalogGalleryManager } from '../../../components/admin/premium/CatalogGalleryManager'
import { CatalogGalleryPicker } from '../../../components/admin/premium/CatalogGalleryPicker'
import { ImageUploadField } from '../../../components/admin/premium/ImageUploadField'
import { MarkdownField } from '../../../components/admin/premium/MarkdownField'
import { PricingEngineSection } from '../../../components/admin/premium/PricingEngineSection'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Switch } from '../../../components/ui/Switch'
import { useI18n } from '../../../i18n'
import { Field, SubGroup } from './FormBits'
import {
  LEVELS,
  STATUSES,
  TYPES,
  emptyToNull,
  emptyToNullNumber,
  inputErrClass,
  slugify,
  textareaClass,
} from './catalogItemForm.utils'
import type { CatalogItemFormState } from './useCatalogItemForm'

type SectionProps = { s: CatalogItemFormState }

const msg = (e: unknown) => (e as { message?: string } | undefined)?.message

export function BasicsFields({ s, isEdit }: SectionProps & { isEdit: boolean }) {
  const { t } = useI18n()
  const { form, categories } = s
  const { errors } = form.formState
  const required = t('adminCatalog.validation.required') as string
  const title = useWatch({ control: form.control, name: 'title' })
  const category = useWatch({ control: form.control, name: 'category' })
  // Un ítem puede traer una categoría que ya no está gestionada: se mantiene
  // seleccionable para que editar nunca cambie el valor guardado sin avisar.
  const names = categories.map((c) => c.name)
  const categoryValues = category && !names.includes(category) ? [category, ...names] : names

  return (
    <>
      <Field label={t('adminCatalog.fields.title')} required error={msg(errors.title)} wide>
        <Input className={inputErrClass(Boolean(errors.title))} {...form.register('title', { required })} />
      </Field>
      <Field label={t('adminCatalog.fields.titleEn')} hint={t('adminCatalog.translationHint')} wide>
        <Input placeholder={t('adminCatalog.placeholders.titleEn') as string} {...form.register('title_en')} />
      </Field>
      <Field
        label={t('adminCatalog.fields.slug')}
        required
        error={msg(errors.slug)}
        hint={isEdit ? t('adminCatalog.slugEditHint') : undefined}
      >
        <div className="flex gap-2">
          <Input className={inputErrClass(Boolean(errors.slug))} {...form.register('slug', { required })} />
          <Button
            type="button"
            variant="secondary"
            aria-label="slug ← título"
            onClick={() => form.setValue('slug', slugify(title || ''))}
          >
            →
          </Button>
        </div>
      </Field>
      <Field label={t('adminCatalog.fields.type')}>
        <Select {...form.register('type')} disabled={isEdit}>
          {TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {tp}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={t('adminCatalog.fields.category')}
        required
        error={msg(errors.category)}
        aside={
          <Link to="/admin/catalog?section=categories" className="text-sky-300 hover:underline">
            {t('adminCatalog.manageCategories')}
          </Link>
        }
      >
        {categoryValues.length > 0 ? (
          <Select className={inputErrClass(Boolean(errors.category))} {...form.register('category', { required })}>
            {categoryValues.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        ) : (
          <Input className={inputErrClass(Boolean(errors.category))} {...form.register('category', { required })} />
        )}
      </Field>
      <Field label={t('adminCatalog.fields.author')} required error={msg(errors.author)}>
        <Input className={inputErrClass(Boolean(errors.author))} {...form.register('author', { required })} />
      </Field>
    </>
  )
}

export function DescriptionFields({ s }: SectionProps) {
  const { t } = useI18n()
  const { form } = s
  const { errors } = form.formState
  const required = t('adminCatalog.validation.required') as string
  return (
    <>
      <Field label={t('adminCatalog.fields.shortDescription')} required error={msg(errors.short_description)} wide>
        <Input
          className={inputErrClass(Boolean(errors.short_description))}
          {...form.register('short_description', { required })}
        />
      </Field>
      <Field label={t('adminCatalog.fields.shortDescriptionEn')} hint={t('adminCatalog.translationHint')} wide>
        <Input
          placeholder={t('adminCatalog.placeholders.shortDescriptionEn') as string}
          {...form.register('short_description_en')}
        />
      </Field>
      <Field
        label={t('adminCatalog.fields.longDescription')}
        required
        error={msg(errors.long_description)}
        hint={t('adminCatalog.longDescriptionMarkdownHint')}
        wide
      >
        <MarkdownField
          form={form}
          name="long_description"
          rows={6}
          required
          requiredMessage={required}
          hasError={Boolean(errors.long_description)}
        />
      </Field>
      <Field label={t('adminCatalog.fields.longDescriptionEn')} hint={t('adminCatalog.translationHint')} wide>
        <MarkdownField
          form={form}
          name="long_description_en"
          rows={6}
          placeholder={t('adminCatalog.placeholders.longDescriptionEn') as string}
        />
      </Field>
    </>
  )
}

export function MediaFields({ s, initial }: SectionProps & { initial?: CatalogItemAdmin | null }) {
  const { t } = useI18n()
  const { form } = s
  const { errors } = form.formState
  const required = t('adminCatalog.validation.required') as string
  return (
    <>
      <div className="space-y-4 sm:col-span-2">
        <ImageUploadField
          label={t('adminCatalog.fields.photo')}
          hint={t('adminCatalog.uploadPhotoHint')}
          uploadLabel={t('adminCatalog.uploadPhoto')}
          previewSrc={initial?.image_url}
          onFileSelect={s.setImageFile}
          fit="contain"
          zoomable
        />
        {initial ? (
          <CatalogGalleryManager itemId={initial.id} />
        ) : (
          <CatalogGalleryPicker
            images={s.pendingGallery}
            coverKey={s.pendingCoverKey}
            onChange={s.setPendingGallery}
            onCoverChange={s.setPendingCoverKey}
          />
        )}
      </div>
      <Field label={t('adminCatalog.fields.imageUrl')} required error={msg(errors.image_url)} wide>
        <Input className={inputErrClass(Boolean(errors.image_url))} {...form.register('image_url', { required })} />
      </Field>
      <Field label={t('adminCatalog.fields.previewUrl')} error={msg(errors.preview_url)} wide>
        <Input placeholder="https://…" {...form.register('preview_url')} />
      </Field>
    </>
  )
}

export function PricingFields({ s }: SectionProps) {
  const { t } = useI18n()
  const { form } = s
  const { errors } = form.formState
  const required = t('adminCatalog.validation.required') as string
  const type = useWatch({ control: form.control, name: 'type' })
  const dimensionSelections = useWatch({ control: form.control, name: 'dimension_selections' })
  const pageCount = useWatch({ control: form.control, name: 'page_count' })
  return (
    <>
      <Field label={t('adminCatalog.fields.price')} required error={msg(errors.price)}>
        <Input
          type="number"
          step="0.01"
          className={inputErrClass(Boolean(errors.price))}
          {...form.register('price', {
            required,
            valueAsNumber: true,
            min: { value: 0, message: t('adminCatalog.validation.priceMin') as string },
          })}
        />
      </Field>
      <Field label={t('adminCatalog.fields.currency')} required error={msg(errors.currency)}>
        <Input className={inputErrClass(Boolean(errors.currency))} {...form.register('currency', { required })} />
      </Field>
      <Field label={t('adminCatalog.fields.status')} hint={t('adminCatalog.statusNotifyHint')}>
        <Select {...form.register('status')}>
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {t(`adminCatalog.status.${st}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('adminCatalog.fields.level')}>
        <Select {...form.register('level')}>
          {LEVELS.map((lv) => (
            <option key={lv} value={lv}>
              {t(`catalog.levels.${lv}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('adminCatalog.fields.duration')} wide>
        <Input {...form.register('duration')} />
      </Field>
      <PricingEngineSection
        pillarCode={type}
        dimensionSelections={dimensionSelections ?? []}
        onDimensionSelectionsChange={(next) => form.setValue('dimension_selections', next)}
        quantity={type === 'book' ? (pageCount ?? null) : null}
        onQuantityChange={(n) => form.setValue('page_count', n)}
        onUseRecommended={(price) => form.setValue('price', price)}
      />
    </>
  )
}

export function OrganizeFields({ s }: SectionProps) {
  const { t } = useI18n()
  const { form, categories, customFields, setCustomFields } = s
  const category = useWatch({ control: form.control, name: 'category' })
  const selected = categories.find((c) => c.name === category)
  const setCustom = (key: string, value: unknown) => setCustomFields((prev) => ({ ...prev, [key]: value }))

  return (
    <>
      <Field label={t('adminCatalog.fields.tags')} hint={t('adminCatalog.tagsHint')} wide>
        <Input
          placeholder={t('adminCatalog.placeholders.tags') as string}
          value={s.tagsInput}
          onChange={(e) => s.setTagsInput(e.target.value)}
        />
      </Field>
      <Field label={t('adminCatalog.fields.seriesName')} hint={t('adminCatalog.seriesNameHint')}>
        <Input
          placeholder={t('adminCatalog.placeholders.seriesName') as string}
          {...form.register('series_name', { setValueAs: emptyToNull })}
        />
      </Field>
      <Field label={t('adminCatalog.fields.seriesOrder')} hint={t('adminCatalog.seriesOrderHint')}>
        <Input type="number" min={1} placeholder="1" {...form.register('series_order', { setValueAs: emptyToNullNumber })} />
      </Field>
      {selected && selected.fields.length > 0 ? (
        <SubGroup title={`${t('adminCatalog.customFields.title')} · ${selected.name}`}>
          {selected.fields.map((f) => (
            <Field key={f.key} label={f.label} required={f.required}>
              {f.type === 'textarea' ? (
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={String(customFields[f.key] ?? '')}
                  onChange={(e) => setCustom(f.key, e.target.value)}
                />
              ) : f.type === 'boolean' ? (
                <Switch checked={Boolean(customFields[f.key])} onCheckedChange={(v) => setCustom(f.key, v)} />
              ) : f.type === 'select' ? (
                <Select value={String(customFields[f.key] ?? '')} onChange={(e) => setCustom(f.key, e.target.value)}>
                  <option value="">—</option>
                  {(f.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
                  value={String(customFields[f.key] ?? '')}
                  onChange={(e) => setCustom(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                />
              )}
            </Field>
          ))}
        </SubGroup>
      ) : null}
    </>
  )
}
