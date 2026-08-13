import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  createCatalogCategory,
  deleteCatalogCategory,
  listCatalogCategories,
  updateCatalogCategory,
  type CatalogCategory,
  type CategoryFieldDef,
  type CategoryFieldType,
} from '../../api/catalogCategories.api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Switch } from '../../components/ui/Switch'
import { Textarea } from '../../components/ui/Textarea'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { parseApiError } from '../../utils/apiError'

const FIELD_TYPES: CategoryFieldType[] = ['text', 'textarea', 'number', 'boolean', 'url', 'select']

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140)
}

function fieldKeySlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
}

const emptyField: CategoryFieldDef = { key: '', label: '', type: 'text', required: false, options: [] }

export function AdminCatalogCategoriesPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin-catalog-categories'], queryFn: () => listCatalogCategories() })
  const [editing, setEditing] = useState<CatalogCategory | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CatalogCategory | null>(null)

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['admin-catalog-categories'] })

  const deleteMut = useMutation({
    mutationFn: deleteCatalogCategory,
    onSuccess: () => {
      invalidate()
      setDeleting(null)
    },
  })

  const categories = query.data ?? []

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="cyan"
        badge={t('adminCatalogCategories.premium.badge')}
        title={t('adminCatalogCategories.title')}
        subtitle={t('adminCatalogCategories.subtitle')}
        actions={
          <Button size="sm" onClick={() => setEditing('new')} leftIcon={<Plus className="h-4 w-4" />}>
            {t('adminCatalogCategories.create')}
          </Button>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-56 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminCatalogCategories.loadError')} />
      ) : categories.length === 0 ? (
        <EmptyState title={t('adminCatalogCategories.empty')} description={t('adminCatalogCategories.subtitle')} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((cat) => (
            <Card key={cat.id} className="space-y-3 rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ase-text">{cat.name}</h3>
                  <p className="text-xs text-ase-muted">/{cat.slug}</p>
                </div>
                <Badge variant={cat.is_active ? 'success' : 'default'}>
                  {cat.is_active ? t('adminCatalogCategories.active') : t('adminCatalogCategories.inactive')}
                </Badge>
              </div>
              {cat.description && <p className="text-sm text-ase-text2">{cat.description}</p>}
              <div className="flex flex-wrap gap-1.5">
                {cat.fields.length === 0 ? (
                  <span className="text-xs text-ase-muted">{t('adminCatalogCategories.noFields')}</span>
                ) : (
                  cat.fields.map((f) => (
                    <Badge key={f.key} variant="default">
                      {f.label}
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(cat)}>
                  {t('adminCatalogCategories.edit')}
                </Button>
                <Button size="sm" variant="outline" className="border-ase-error/30" onClick={() => setDeleting(cat)}>
                  {t('adminCatalogCategories.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <CategoryEditorModal
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate()
            setEditing(null)
          }}
        />
      )}

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title={t('adminCatalogCategories.delete')}>
        <p className="text-sm text-ase-text2">{t('adminCatalogCategories.confirmDelete')}</p>
        <p className="mt-2 font-medium text-ase-text">{deleting?.name}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            {t('adminCatalogCategories.cancel')}
          </Button>
          <Button variant="danger" disabled={deleteMut.isPending} onClick={() => deleting && deleteMut.mutate(deleting.id)}>
            {t('adminCatalogCategories.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function CategoryEditorModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: CatalogCategory | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [fields, setFields] = useState<CategoryFieldDef[]>(initial?.fields ?? [])
  const [serverError, setServerError] = useState<string | null>(null)

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug,
        description: description.trim() || null,
        fields: fields.filter((f) => f.key && f.label),
        is_active: isActive,
      }
      if (initial) return updateCatalogCategory(initial.id, payload)
      return createCatalogCategory(payload)
    },
    onSuccess: onSaved,
    onError: (err) => {
      setServerError(parseApiError(err, t('adminCatalogCategories.saveError') as string).message)
    },
  })

  const updateField = (index: number, patch: Partial<CategoryFieldDef>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? t('adminCatalogCategories.editTitle') : t('adminCatalogCategories.newTitle')}
      className="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('adminCatalogCategories.cancel')}
          </Button>
          <Button disabled={!name || !slug || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? t('adminCatalogCategories.saving') : t('adminCatalogCategories.save')}
          </Button>
        </div>
      }
    >
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <label className="block">
          <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalogCategories.fields.name')}</span>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalogCategories.fields.slug')}</span>
          <Input
            value={slug}
            onFocus={() => setSlugTouched(true)}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value))
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalogCategories.fields.description')}</span>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <span className="text-sm text-ase-text2">{t('adminCatalogCategories.fields.active')}</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
              {t('adminCatalogCategories.fields.questionnaire')}
            </span>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setFields((prev) => [...prev, { ...emptyField }])}
            >
              {t('adminCatalogCategories.addField')}
            </Button>
          </div>
          <p className="text-[11px] leading-snug text-ase-muted">{t('adminCatalogCategories.questionnaireHint')}</p>

          {fields.length === 0 ? (
            <p className="text-xs text-ase-muted">{t('adminCatalogCategories.noFields')}</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={index} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t('adminCatalogCategories.fields.fieldLabel') as string}
                      value={field.label}
                      onChange={(e) => {
                        const label = e.target.value
                        updateField(index, { label, key: field.key || fieldKeySlug(label) })
                      }}
                    />
                    <Select value={field.type} onChange={(e) => updateField(index, { type: e.target.value as CategoryFieldType })}>
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft} value={ft}>
                          {t(`adminCatalogCategories.fieldTypes.${ft}`)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {field.type === 'select' && (
                    <Input
                      placeholder={t('adminCatalogCategories.fields.optionsPlaceholder') as string}
                      value={(field.options ?? []).join(', ')}
                      onChange={(e) =>
                        updateField(index, {
                          options: e.target.value
                            .split(',')
                            .map((o) => o.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-ase-muted">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                      />
                      {t('adminCatalogCategories.fields.required')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setFields((prev) => prev.filter((_, i) => i !== index))}
                      className="inline-flex items-center gap-1 text-xs text-ase-error hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('adminCatalogCategories.removeField')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {serverError && (
          <div className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{serverError}</div>
        )}
      </div>
    </Modal>
  )
}
