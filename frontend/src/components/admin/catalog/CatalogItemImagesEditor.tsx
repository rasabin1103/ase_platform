import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { useI18n } from '../../../i18n'
import type { CatalogItemImageInput } from '../../../types/catalog.types'

type Props = {
  value: CatalogItemImageInput[]
  onChange: (next: CatalogItemImageInput[]) => void
  max?: number
}

export function CatalogItemImagesEditor({ value, onChange, max = 10 }: Props) {
  const { t } = useI18n()

  const addImage = () => {
    if (value.length >= max) return
    onChange([
      ...value,
      {
        image_url: '',
        alt_text: '',
        title: '',
        sort_order: value.length,
        is_primary: value.length === 0,
      },
    ])
  }

  const update = (index: number, patch: Partial<CatalogItemImageInput>) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row))
    if (patch.is_primary) {
      onChange(next.map((row, i) => ({ ...row, is_primary: i === index })))
      return
    }
    onChange(next)
  }

  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i }))
    if (next.length && !next.some((r) => r.is_primary)) next[0].is_primary = true
    onChange(next)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-violet-400/15 bg-violet-500/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-300/90">
            {t('adminCatalog.imagesSection')}
          </h3>
          <p className="mt-1 text-xs text-ase-muted">{t('adminCatalog.imagesHint')}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addImage} disabled={value.length >= max}>
          {t('adminCatalog.addImage')}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-ase-muted">{t('adminCatalog.noImages')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {value.map((img, index) => (
            <div
              key={img.id ?? `new-${index}`}
              className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              {img.image_url ? (
                <img
                  src={img.image_url}
                  alt={img.alt_text || ''}
                  className="h-32 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/15 text-xs text-ase-muted">
                  {t('adminCatalog.imagePreview')}
                </div>
              )}
              <Input
                placeholder="https://…"
                value={img.image_url}
                onChange={(e) => update(index, { image_url: e.target.value })}
              />
              <Input
                placeholder={t('adminCatalog.fields.altText') as string}
                value={img.alt_text ?? ''}
                onChange={(e) => update(index, { alt_text: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-ase-text2">
                  <input
                    type="radio"
                    name="primary-image"
                    checked={img.is_primary}
                    onChange={() => update(index, { is_primary: true })}
                  />
                  {t('adminCatalog.primaryImage')}
                </label>
                <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                  {t('adminCatalog.removeImage')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
