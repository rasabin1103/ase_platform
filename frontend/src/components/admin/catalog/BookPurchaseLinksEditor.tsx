import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { Badge } from '../../ui/Badge'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'
import type { BookPurchaseLinkInput, BookPurchasePlatform } from '../../../types/catalog.types'

const PLATFORMS: BookPurchasePlatform[] = [
  'amazon',
  'ase',
  'lulu',
  'gumroad',
  'shopify',
  'hotmart',
  'other',
]

type Props = {
  value: BookPurchaseLinkInput[]
  onChange: (next: BookPurchaseLinkInput[]) => void
  max?: number
}

export function BookPurchaseLinksEditor({ value, onChange, max = 8 }: Props) {
  const { t } = useI18n()

  const addLink = () => {
    if (value.length >= max) return
    onChange([
      ...value,
      {
        platform: 'amazon',
        label: '',
        url: '',
        currency: 'EUR',
        price: null,
        country: null,
        is_primary: value.length === 0,
        is_active: true,
        sort_order: value.length,
      },
    ])
  }

  const update = (index: number, patch: Partial<BookPurchaseLinkInput>) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row))
    if (patch.is_primary) {
      onChange(next.map((row, i) => ({ ...row, is_primary: i === index })))
      return
    }
    onChange(next)
  }

  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i }))
    onChange(next)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/90">
            {t('adminCatalog.purchaseLinksSection')}
          </h3>
          <p className="mt-1 text-xs text-ase-muted">{t('adminCatalog.purchaseLinksHint')}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addLink} disabled={value.length >= max}>
          {t('adminCatalog.addPurchaseLink')}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-ase-muted">{t('adminCatalog.noPurchaseLinks')}</p>
      ) : (
        <div className="space-y-4">
          {value.map((link, index) => {
            const previewLabel =
              link.label?.trim() ||
              (t(`adminCatalog.purchasePlatform.${link.platform}`) as string)
            return (
              <div
                key={link.id ?? `new-${index}`}
                className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="info">{previewLabel}</Badge>
                  <span className="text-xs text-ase-muted">{t('adminCatalog.buttonPreview')}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-ase-muted">
                    {t('adminCatalog.fields.platform')}
                    <Select
                      className="mt-1"
                      value={link.platform}
                      onChange={(e) =>
                        update(index, { platform: e.target.value as BookPurchasePlatform })
                      }
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {t(`adminCatalog.purchasePlatform.${p}`)}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="block text-xs text-ase-muted sm:col-span-2">
                    {t('adminCatalog.fields.linkLabel')}
                    <Input
                      className="mt-1"
                      value={link.label ?? ''}
                      placeholder={
                        link.platform === 'other'
                          ? (t('adminCatalog.otherPlatformRequired') as string)
                          : (t(`adminCatalog.purchasePlatform.${link.platform}`) as string)
                      }
                      onChange={(e) => update(index, { label: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-ase-muted sm:col-span-2">
                    URL
                    <Input
                      className="mt-1"
                      value={link.url}
                      placeholder="https://…"
                      onChange={(e) => update(index, { url: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-ase-muted">
                    {t('adminCatalog.fields.price')}
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      value={link.price ?? ''}
                      onChange={(e) =>
                        update(index, { price: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </label>
                  <label className="block text-xs text-ase-muted">
                    {t('adminCatalog.fields.currency')}
                    <Input
                      className="mt-1"
                      value={link.currency ?? ''}
                      onChange={(e) => update(index, { currency: e.target.value || null })}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-ase-text2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={link.is_active}
                      onChange={(e) => update(index, { is_active: e.target.checked })}
                    />
                    {t('adminCatalog.linkActive')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="primary-link"
                      checked={link.is_primary}
                      onChange={() => update(index, { is_primary: true })}
                    />
                    {t('adminCatalog.primaryLink')}
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                    {t('adminCatalog.removePurchaseLink')}
                  </Button>
                </div>
                <div className="pt-1">
                  <Button
                    type="button"
                    variant={link.is_primary ? 'primary' : 'secondary'}
                    className={cn(link.platform === 'ase' && link.is_primary && 'shadow-[0_0_20px_rgba(56,189,248,0.2)]')}
                    disabled
                  >
                    {previewLabel}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
