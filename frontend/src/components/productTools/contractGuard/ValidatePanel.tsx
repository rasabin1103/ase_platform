import { useMutation, useQuery } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  listCgContracts,
  validateCgResponse,
  validateCgSchema,
  validateCgSchemaFiles,
  type CgHttpMethod,
  type CgValidationReport,
} from '../../../api/contractGuard.api'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'
import { cn } from '../../ui/cn'
import { CgErrorNote } from './CgErrorNote'
import { parseJsonInput, statusForbidsBody } from './contractGuard.utils'
import { useCgT } from './useCgT'
import { ValidationReport } from './ValidationReport'

type Mode = 'contract' | 'schema' | 'files'
const METHODS: CgHttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE']
const MAX_BYTES = 2 * 1024 * 1024

const EXAMPLE_SCHEMA = `{
  "type": "object",
  "required": ["id", "nombre", "saldo"],
  "properties": {
    "id": { "type": "integer" },
    "nombre": { "type": "string" },
    "saldo": { "type": "number", "minimum": 0 }
  },
  "additionalProperties": false
}`
const EXAMPLE_BODY = `{ "id": "123", "nombre": "Ana", "saldo": -50 }`

/** Validar una respuesta JSON ya capturada: contra un contrato guardado, contra
 * un JSON Schema pegado o contra dos archivos. ASE no llama a ninguna API
 * externa: el usuario aporta los datos reales. Nada se guarda. */
export function ValidatePanel({ projectId }: { projectId: string | null }) {
  const { tt } = useCgT()
  const [mode, setMode] = useState<Mode>(projectId ? 'contract' : 'schema')
  const [report, setReport] = useState<CgValidationReport | null>(null)

  const modes: { key: Mode; label: string; needsProject?: boolean }[] = [
    { key: 'contract', label: tt('validate.modeContract'), needsProject: true },
    { key: 'schema', label: tt('validate.modeSchema') },
    { key: 'files', label: tt('validate.modeFiles') },
  ]
  const effectiveMode: Mode = mode === 'contract' && !projectId ? 'schema' : mode

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label={tt('validate.modes')} className="flex flex-wrap gap-2">
        {modes.map((m) => {
          const disabled = m.needsProject && !projectId
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={effectiveMode === m.key}
              disabled={disabled}
              title={disabled ? tt('validate.needsProject') : undefined}
              onClick={() => {
                setMode(m.key)
                setReport(null)
              }}
              className={cn(
                'rounded-xl border px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45',
                effectiveMode === m.key
                  ? 'border-ase-brand/40 bg-ase-brand/15 text-ase-brand'
                  : 'border-white/10 bg-ase-surface text-ase-text2 hover:border-white/20',
              )}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      {effectiveMode === 'contract' && projectId ? (
        <ContractForm projectId={projectId} onResult={setReport} />
      ) : effectiveMode === 'schema' ? (
        <SchemaForm onResult={setReport} />
      ) : (
        <FilesForm onResult={setReport} />
      )}

      {report ? <ValidationReport report={report} /> : null}
    </div>
  )
}

function JsonField({
  id,
  label,
  value,
  onChange,
  disabled,
  rows = 8,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  rows?: number
  hint?: string
}) {
  const { tt } = useCgT()
  const parsed = value.trim() ? parseJsonInput(value) : null
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-ase-muted">
        {label}
      </label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        disabled={disabled}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs"
      />
      {parsed && !parsed.ok ? (
        <p className="mt-1 text-xs text-rose-300">
          {tt('validate.jsonInvalid')}: {parsed.error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-ase-muted">{hint}</p>
      ) : null}
    </div>
  )
}

function ContractForm({ projectId, onResult }: { projectId: string; onResult: (r: CgValidationReport | null) => void }) {
  const { tt } = useCgT()
  const [versionId, setVersionId] = useState('')
  const [path, setPath] = useState('')
  const [method, setMethod] = useState<CgHttpMethod>('GET')
  const [status, setStatus] = useState('200')
  const [contentType, setContentType] = useState('application/json')
  const [noBody, setNoBody] = useState(false)
  const [body, setBody] = useState('')

  const contractsQuery = useQuery({
    queryKey: ['cg-contracts', projectId],
    queryFn: () => listCgContracts(projectId, { limit: 200 }),
  })
  const statusNum = Number(status)
  const statusOk = Number.isInteger(statusNum) && statusNum >= 100 && statusNum <= 599
  const forbids = statusOk && statusForbidsBody(method, statusNum)
  const parsedBody = noBody ? { ok: true as const, value: null } : parseJsonInput(body)
  const pathOk = path.startsWith('/') && !path.includes('?') && !path.includes('#') && path.length <= 2048

  const mut = useMutation({
    mutationFn: () =>
      validateCgResponse(projectId, versionId, {
        path,
        method,
        status_code: statusNum,
        content_type: contentType.trim() || 'application/json',
        response_body: parsedBody.ok ? parsedBody.value : null,
        // Sin cuerpo se envía null Y body_present:false; `null` con
        // body_present:true sería un valor JSON real.
        body_present: !noBody,
      }),
    onSuccess: onResult,
    onError: () => onResult(null),
  })

  const canRun = Boolean(versionId) && pathOk && statusOk && parsedBody.ok && !mut.isPending

  return (
    <form
      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canRun) mut.mutate()
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="cg-v-contract" className="mb-1 block text-xs font-medium text-ase-muted">
            {tt('validate.contract')}
          </label>
          <Select id="cg-v-contract" value={versionId} onChange={(e) => setVersionId(e.target.value)}>
            <option value="">{tt('compare.choose')}</option>
            {(contractsQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.version_label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="cg-v-path" className="mb-1 block text-xs font-medium text-ase-muted">
            {tt('validate.path')}
          </label>
          <Input
            id="cg-v-path"
            value={path}
            placeholder="/pet/123"
            onChange={(e) => setPath(e.target.value)}
            aria-invalid={path !== '' && !pathOk}
          />
          <p className={cn('mt-1 text-[11px]', path !== '' && !pathOk ? 'text-rose-300' : 'text-ase-muted')}>
            {tt('validate.pathHint')}
          </p>
        </div>
        <div>
          <label htmlFor="cg-v-method" className="mb-1 block text-xs font-medium text-ase-muted">
            {tt('validate.method')}
          </label>
          <Select id="cg-v-method" value={method} onChange={(e) => setMethod(e.target.value as CgHttpMethod)}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cg-v-status" className="mb-1 block text-xs font-medium text-ase-muted">
              {tt('validate.statusCode')}
            </label>
            <Input
              id="cg-v-status"
              inputMode="numeric"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-invalid={!statusOk}
            />
          </div>
          <div>
            <label htmlFor="cg-v-ct" className="mb-1 block text-xs font-medium text-ase-muted">
              {tt('validate.contentType')}
            </label>
            <Input id="cg-v-ct" value={contentType} onChange={(e) => setContentType(e.target.value)} />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ase-text2">
        <input type="checkbox" checked={noBody} onChange={(e) => setNoBody(e.target.checked)} />
        {tt('validate.noBody')}
      </label>
      {forbids && !noBody ? <p className="text-xs text-amber-300">{tt('validate.bodyForbidden')}</p> : null}
      <JsonField
        id="cg-v-body"
        label={tt('validate.responseBody')}
        value={body}
        onChange={setBody}
        disabled={noBody}
        hint={tt('validate.bodyHint')}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canRun} leftIcon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}>
          {mut.isPending ? tt('validate.running') : tt('validate.run')}
        </Button>
        <p className="text-xs text-ase-muted">{tt('validate.notStored')}</p>
      </div>
      {mut.isError ? <CgErrorNote error={mut.error} /> : null}
    </form>
  )
}

function SchemaForm({ onResult }: { onResult: (r: CgValidationReport | null) => void }) {
  const { tt } = useCgT()
  const [schema, setSchema] = useState('')
  const [body, setBody] = useState('')
  const s = schema.trim() ? parseJsonInput(schema) : null
  const b = body.trim() ? parseJsonInput(body) : null

  const mut = useMutation({
    mutationFn: () => {
      if (!s?.ok || !b?.ok) throw new Error('invalid')
      return validateCgSchema({ schema: s.value, responseBody: b.value })
    },
    onSuccess: onResult,
    onError: () => onResult(null),
  })
  const canRun = Boolean(s?.ok && b?.ok) && !mut.isPending

  return (
    <form
      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canRun) mut.mutate()
      }}
    >
      <p className="text-sm text-ase-text2">{tt('validate.schemaIntro')}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <JsonField id="cg-s-schema" label={tt('validate.schema')} value={schema} onChange={setSchema} rows={12} hint={tt('validate.schemaHint')} />
        <JsonField id="cg-s-body" label={tt('validate.responseBody')} value={body} onChange={setBody} rows={12} hint={tt('validate.bodyHint')} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canRun} leftIcon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}>
          {mut.isPending ? tt('validate.running') : tt('validate.run')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setSchema(EXAMPLE_SCHEMA)
            setBody(EXAMPLE_BODY)
          }}
        >
          {tt('validate.loadExample')}
        </Button>
        <p className="text-xs text-ase-muted">{tt('validate.notStored')}</p>
      </div>
      {mut.isError ? <CgErrorNote error={mut.error} /> : null}
    </form>
  )
}

function FilesForm({ onResult }: { onResult: (r: CgValidationReport | null) => void }) {
  const { tt } = useCgT()
  const schemaRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLInputElement>(null)
  const [schemaFile, setSchemaFile] = useState<File | null>(null)
  const [responseFile, setResponseFile] = useState<File | null>(null)

  // El límite del servicio es por petición: dos archivos de 2 MiB no caben juntos.
  const tooLarge = (schemaFile?.size ?? 0) + (responseFile?.size ?? 0) > MAX_BYTES
  const mut = useMutation({
    mutationFn: () => validateCgSchemaFiles({ schemaFile: schemaFile!, responseFile: responseFile! }),
    onSuccess: onResult,
    onError: () => onResult(null),
  })
  const canRun = Boolean(schemaFile && responseFile) && !tooLarge && !mut.isPending

  return (
    <form
      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canRun) mut.mutate()
      }}
    >
      <p className="text-sm text-ase-text2">{tt('validate.filesIntro')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { id: 'cg-f-schema', label: tt('validate.schemaFile'), ref: schemaRef, set: setSchemaFile },
          { id: 'cg-f-body', label: tt('validate.responseFile'), ref: bodyRef, set: setResponseFile },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="mb-1 block text-xs font-medium text-ase-muted">
              {f.label}
            </label>
            <input
              id={f.id}
              ref={f.ref}
              type="file"
              accept=".json,application/json"
              onChange={(e) => f.set(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ase-text2 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.05] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ase-text"
            />
          </div>
        ))}
      </div>
      {tooLarge ? <p className="text-sm text-rose-300">{tt('validate.filesTooLarge')}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canRun} leftIcon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}>
          {mut.isPending ? tt('validate.running') : tt('validate.run')}
        </Button>
        <p className="text-xs text-ase-muted">{tt('validate.notStored')}</p>
      </div>
      {mut.isError ? <CgErrorNote error={mut.error} /> : null}
    </form>
  )
}
