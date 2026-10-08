import { Plus, Trash2 } from 'lucide-react'
import { useWatch } from 'react-hook-form'
import type { TestInputVariableDef } from '../../../api/catalogAdmin.api'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Switch } from '../../../components/ui/Switch'
import { ACADEMY_COURSES } from '../../../features/academy/content/courseList'
import { courseSyllabus, syllabusMarkdown, upsertSyllabus } from '../../../features/academy/syllabus'
import { useI18n } from '../../../i18n'
import { Field, SubGroup } from './FormBits'
import {
  LICENSE_REDISTRIBUTION_OPTIONS,
  LICENSE_SCOPES,
  emptyToNull,
  emptyToNullNumber,
  emptyVariable,
  optionsToText,
  textToOptions,
  textareaClass,
  variableKeySlug,
} from './catalogItemForm.utils'
import type { CatalogItemFormState } from './useCatalogItemForm'

type SectionProps = { s: CatalogItemFormState }

const msg = (e: unknown) => (e as { message?: string } | undefined)?.message

/** Campos de entrega según el tipo de ítem (libro, curso, recurso o producto). */
export function ContentFields({ s }: SectionProps) {
  const { t } = useI18n()
  const { form } = s
  const { errors } = form.formState
  const type = useWatch({ control: form.control, name: 'type' })

  if (type === 'book') {
    return (
      <>
        <SubGroup title={t('adminCatalog.bookRedemptionSection.title')} hint={t('adminCatalog.bookRedemptionSection.hint')}>
          <Field label={t('adminCatalog.fields.repoUrl')} hint={t('adminCatalog.repoUrlHint')} error={msg(errors.repo_url)}>
            <Input placeholder="https://github.com/tu-org/tu-repo" {...form.register('repo_url')} />
          </Field>
          <Field
            label={t('adminCatalog.fields.repoRedeemCode')}
            hint={t('adminCatalog.repoRedeemCodeHint')}
            error={msg(errors.repo_redeem_code)}
          >
            <Input placeholder="ASE-BOOK-2026" {...form.register('repo_redeem_code')} />
          </Field>
        </SubGroup>
        <SubGroup title={t('adminCatalog.bookContentSection.title')} hint={t('adminCatalog.bookContentSection.hint')}>
          <Field label={t('adminCatalog.fields.repoPath')} hint={t('adminCatalog.repoPathHintBook')} error={msg(errors.repo_path)}>
            <Input placeholder="books/mi-libro" {...form.register('repo_path')} />
          </Field>
          <Field
            label={t('adminCatalog.fields.audiobookUrl')}
            hint={t('adminCatalog.audiobookUrlHint')}
            error={msg(errors.audiobook_url)}
          >
            <Input placeholder="https://…" {...form.register('audiobook_url')} />
          </Field>
        </SubGroup>
      </>
    )
  }

  if (type === 'course') {
    return (
      <>
        <Field label={t('adminCatalog.academyCourse.label')} hint={t('adminCatalog.academyCourse.hint')} wide>
          <Select {...form.register('academy_course_key', { setValueAs: (v) => (v === '' || v == null ? null : v) })}>
            <option value="">{t('adminCatalog.academyCourse.none')}</option>
            {ACADEMY_COURSES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.title} · {c.key}
              </option>
            ))}
          </Select>
        </Field>
        <AcademySyllabusHelper s={s} />
      </>
    )
  }

  if (type === 'resource') {
    return (
      <>
        <Field label={t('adminCatalog.fields.repoPath')} hint={t('adminCatalog.repoPathHint')} wide>
          <Input placeholder="resources/deploy-checklist" {...form.register('repo_path')} />
        </Field>
        <SubGroup title={t('adminCatalog.versionSection.title')} hint={t('adminCatalog.versionSection.hint')}>
          <Field label={t('adminCatalog.fields.currentVersion')}>
            <Input placeholder="1.0.0" {...form.register('current_version', { setValueAs: emptyToNull })} />
          </Field>
          <Field label={t('adminCatalog.fields.changelog')} hint={t('adminCatalog.changelogHint')}>
            <textarea
              className={textareaClass}
              rows={4}
              placeholder={t('adminCatalog.placeholders.changelog') as string}
              value={s.changelogInput}
              onChange={(e) => s.setChangelogInput(e.target.value)}
            />
          </Field>
          <Field label={t('adminCatalog.fields.compatibility')} hint={t('adminCatalog.compatibilityHint')}>
            <Input
              placeholder={t('adminCatalog.placeholders.compatibility') as string}
              value={s.compatibilityInput}
              onChange={(e) => s.setCompatibilityInput(e.target.value)}
            />
          </Field>
          <Field label={t('adminCatalog.fields.gettingStarted')} hint={t('adminCatalog.gettingStartedHint')}>
            <textarea
              className={textareaClass}
              rows={4}
              placeholder={t('adminCatalog.placeholders.gettingStarted') as string}
              {...form.register('getting_started', { setValueAs: emptyToNull })}
            />
          </Field>
        </SubGroup>
      </>
    )
  }

  // product
  return (
    <>
      <SubGroup title={t('adminCatalog.productContentSection.title')} hint={t('adminCatalog.productContentSection.hint')}>
        <Field label={t('adminCatalog.fields.repoPath')} hint={t('adminCatalog.repoPathHint')} error={msg(errors.repo_path)}>
          <Input placeholder="products/mi-producto" {...form.register('repo_path')} />
        </Field>
      </SubGroup>
      <SubGroup title={t('adminCatalog.testExecutionSection.title')} hint={t('adminCatalog.testExecutionSection.hint')}>
        <Field label={t('adminCatalog.fields.testRepoUrl')} hint={t('adminCatalog.testRepoUrlHint')} error={msg(errors.test_repo_url)}>
          <Input placeholder="https://github.com/tu-org/tu-framework" {...form.register('test_repo_url')} />
        </Field>
        <Field
          label={t('adminCatalog.fields.testWorkflowFile')}
          hint={t('adminCatalog.testWorkflowFileHint')}
          error={msg(errors.test_workflow_file)}
        >
          <Input placeholder="run-tests.yml" {...form.register('test_workflow_file')} />
        </Field>
        <Field
          label={t('adminCatalog.fields.testIncludedRuns')}
          hint={t('adminCatalog.testIncludedRunsHint')}
          error={msg(errors.test_included_runs)}
        >
          <Input
            type="number"
            min={0}
            placeholder="10"
            {...form.register('test_included_runs', { setValueAs: emptyToNullNumber })}
          />
        </Field>
        <TestVariablesEditor s={s} />
      </SubGroup>
    </>
  )
}

function TestVariablesEditor({ s }: SectionProps) {
  const { t } = useI18n()
  const { testInputSchema: vars, setTestInputSchema } = s
  const update = (index: number, patch: Partial<TestInputVariableDef>) =>
    setTestInputSchema((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)))

  return (
    <div className="space-y-3 border-t border-white/10 pt-3">
      <div className="flex items-center justify-between">
        <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">
          {t('adminCatalog.testInputSchemaSection.title')}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setTestInputSchema((prev) => [...prev, { ...emptyVariable }])}
        >
          {t('adminCatalog.addTestVariable')}
        </Button>
      </div>
      <p className="text-[11px] leading-snug text-ase-muted">{t('adminCatalog.testInputSchemaSection.hint')}</p>

      {vars.length === 0 ? (
        <p className="text-xs text-ase-muted">{t('adminCatalog.noTestVariables')}</p>
      ) : (
        <div className="space-y-3">
          {vars.map((variable, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('adminCatalog.testVariableFields.label')}>
                  <Input
                    value={variable.label}
                    onChange={(e) => {
                      const label = e.target.value
                      update(index, { label, key: variable.key || variableKeySlug(label) })
                    }}
                  />
                </Field>
                <Field label={t('adminCatalog.testVariableFields.key')}>
                  <Input value={variable.key} onChange={(e) => update(index, { key: variableKeySlug(e.target.value) })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('adminCatalog.testVariableFields.type')}>
                  <Select
                    value={variable.type}
                    onChange={(e) => update(index, { type: e.target.value as TestInputVariableDef['type'] })}
                  >
                    <option value="text">{t('adminCatalog.testVariableTypes.text')}</option>
                    <option value="secret">{t('adminCatalog.testVariableTypes.secret')}</option>
                    <option value="choice">{t('adminCatalog.testVariableTypes.choice')}</option>
                    <option value="json">{t('adminCatalog.testVariableTypes.json')}</option>
                  </Select>
                </Field>
                <Field label={t('adminCatalog.testVariableFields.description')}>
                  <Input
                    placeholder={t('adminCatalog.testVariableFields.descriptionPlaceholder') as string}
                    value={variable.description ?? ''}
                    onChange={(e) => update(index, { description: e.target.value })}
                  />
                </Field>
              </div>
              {variable.type === 'choice' ? (
                <Field label={t('adminCatalog.testVariableFields.options')} hint={t('adminCatalog.testVariableFields.optionsHint')}>
                  <Input
                    placeholder={t('adminCatalog.testVariableFields.optionsPlaceholder') as string}
                    value={optionsToText(variable.options)}
                    onChange={(e) => update(index, { options: textToOptions(e.target.value) })}
                  />
                </Field>
              ) : null}
              {variable.type !== 'secret' ? (
                <Field label={t('adminCatalog.testVariableFields.default')}>
                  {variable.type === 'json' ? (
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-ase-text"
                      placeholder={t('adminCatalog.testVariableFields.defaultJsonPlaceholder') as string}
                      value={variable.default ?? ''}
                      onChange={(e) => update(index, { default: e.target.value })}
                    />
                  ) : variable.type === 'choice' ? (
                    <Select value={variable.default ?? ''} onChange={(e) => update(index, { default: e.target.value })}>
                      <option value="">—</option>
                      {(variable.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt || '—'}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input value={variable.default ?? ''} onChange={(e) => update(index, { default: e.target.value })} />
                  )}
                </Field>
              ) : null}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] text-ase-muted">
                  <input
                    type="checkbox"
                    checked={variable.required}
                    onChange={(e) => update(index, { required: e.target.checked })}
                  />
                  {t('adminCatalog.testVariableFields.required')}
                </label>
                <button
                  type="button"
                  onClick={() => setTestInputSchema((prev) => prev.filter((_, i) => i !== index))}
                  className="inline-flex items-center gap-1 text-[11px] text-ase-error hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('adminCatalog.removeTestVariable')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LicenseFields({ s }: SectionProps) {
  const { t } = useI18n()
  const { form } = s
  const scope = useWatch({ control: form.control, name: 'license_scope' })
  const updates = useWatch({ control: form.control, name: 'license_updates_included' })
  const support = useWatch({ control: form.control, name: 'license_support_included' })

  return (
    <>
      <div className="sm:col-span-2">
        <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.licenseScope')}</span>
        <div className="flex flex-wrap gap-4">
          {LICENSE_SCOPES.map((sc) => (
            <label key={sc} className="flex items-center gap-2 text-xs text-ase-text">
              <input
                type="checkbox"
                checked={(scope ?? []).includes(sc)}
                onChange={(e) => {
                  const current = form.getValues('license_scope') ?? []
                  form.setValue('license_scope', e.target.checked ? [...current, sc] : current.filter((x) => x !== sc))
                }}
              />
              {t(`adminCatalog.licenseScopeOptions.${sc}`)}
            </label>
          ))}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.licenseScopeHint')}</p>
      </div>
      <Field label={t('adminCatalog.fields.licenseRedistribution')}>
        <Select {...form.register('license_redistribution', { setValueAs: emptyToNull })}>
          <option value="">—</option>
          {LICENSE_REDISTRIBUTION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`adminCatalog.licenseRedistributionOptions.${opt}`)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-col justify-end gap-3">
        <label className="flex items-center gap-2 text-xs text-ase-muted">
          <Switch checked={Boolean(updates)} onCheckedChange={(v) => form.setValue('license_updates_included', v)} />
          {t('adminCatalog.fields.licenseUpdatesIncluded')}
        </label>
        <label className="flex items-center gap-2 text-xs text-ase-muted">
          <Switch checked={Boolean(support)} onCheckedChange={(v) => form.setValue('license_support_included', v)} />
          {t('adminCatalog.fields.licenseSupportIncluded')}
        </label>
      </div>
      <Field label={t('adminCatalog.fields.licenseRefundPolicy')} hint={t('adminCatalog.licenseRefundPolicyHint')} wide>
        <textarea
          className={textareaClass}
          rows={3}
          placeholder={t('adminCatalog.placeholders.licenseRefundPolicy') as string}
          {...form.register('license_refund_policy', { setValueAs: emptyToNull })}
        />
      </Field>
    </>
  )
}

/**
 * Estado real de las misiones del curso de Academy vinculado y botón para
 * volcar el temario actualizado en la descripción larga (sustituye el bloque
 * anterior si ya existía), de modo que la ficha nunca anuncie como «próximas»
 * misiones que ya están disponibles.
 */
function AcademySyllabusHelper({ s }: SectionProps) {
  const { form } = s
  const key = useWatch({ control: form.control, name: 'academy_course_key' })
  if (!key) return null
  const missions = courseSyllabus(key)
  const available = missions.filter((m) => m.available).length
  const insert = () => {
    const current = form.getValues('long_description') ?? ''
    form.setValue('long_description', upsertSyllabus(current, syllabusMarkdown(key, 'es')), { shouldDirty: true })
  }
  return (
    <SubGroup
      title={`Misiones del curso · ${available} de ${missions.length} disponibles`}
      hint="La ficha pública ya muestra este temario automáticamente. Si la descripción larga menciona misiones o temas «próximos», inserta el temario actualizado y revisa el texto antes de guardar."
    >
      <ol className="grid gap-1.5 text-xs sm:grid-cols-2">
        {missions.map((m, i) => (
          <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
            <span className="truncate text-ase-text2">
              {i + 1}. {m.title}
            </span>
            <span className={m.available ? 'text-emerald-300' : 'text-amber-200'}>
              {m.available ? 'Disponible' : 'Próximamente'}
            </span>
          </li>
        ))}
      </ol>
      <Button type="button" size="sm" variant="secondary" onClick={insert}>
        Insertar temario actualizado en la descripción
      </Button>
    </SubGroup>
  )
}
