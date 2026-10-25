import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, FileText, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { getCgContract, importCgContract, listCgContracts, type CgContract } from '../../../api/contractGuard.api'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Input } from '../../ui/Input'
import { Modal } from '../../ui/Modal'
import { Skeleton } from '../../ui/Skeleton'
import { CgErrorNote } from './CgErrorNote'
import { formatDateTime } from './contractGuard.utils'
import { useCgT } from './useCgT'

const MAX_BYTES = 2 * 1024 * 1024
const ACCEPT = '.json,.yaml,.yml'
const SPEC_PREVIEW_CHARS = 30_000

/** Versiones de contrato de un proyecto: importar (JSON o YAML OpenAPI 3.0/3.1,
 * hasta 2 MiB) y consultar. Las versiones son inmutables: para cambiar un
 * contrato se importa otra con etiqueta nueva. */
export function ContractsPanel({ projectId }: { projectId: string }) {
  const { tt, locale } = useCgT()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [label, setLabel] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<CgContract | null>(null)

  const contractsQuery = useQuery({
    queryKey: ['cg-contracts', projectId],
    queryFn: () => listCgContracts(projectId, { limit: 200 }),
  })
  const specQuery = useQuery({
    queryKey: ['cg-contract', projectId, viewing?.id],
    queryFn: () => getCgContract(projectId, viewing!.id),
    enabled: viewing !== null,
  })

  const importMut = useMutation({
    mutationFn: () => importCgContract(projectId, { versionLabel: label.trim(), file: file! }),
    onSuccess: async () => {
      setLabel('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await qc.invalidateQueries({ queryKey: ['cg-contracts', projectId] })
    },
  })

  const onPick = (picked: File | null) => {
    setFileError(null)
    importMut.reset()
    if (picked && picked.size > MAX_BYTES) {
      setFile(null)
      setFileError(tt('contracts.tooLarge'))
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setFile(picked)
  }

  const contracts = contractsQuery.data ?? []
  const spec = specQuery.data?.specification_content ?? ''

  return (
    <div className="space-y-5">
      <form
        className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          if (label.trim() && file) importMut.mutate()
        }}
      >
        <div>
          <label htmlFor="cg-contract-label" className="mb-1 block text-xs font-medium text-ase-muted">
            {tt('contracts.label')}
          </label>
          <Input
            id="cg-contract-label"
            value={label}
            maxLength={100}
            placeholder={tt('contracts.labelPlaceholder')}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="cg-contract-file" className="mb-1 block text-xs font-medium text-ase-muted">
            {tt('contracts.file')}
          </label>
          <input
            id="cg-contract-file"
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ase-text2 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.05] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ase-text"
          />
        </div>
        <Button
          type="submit"
          disabled={!label.trim() || !file || importMut.isPending}
          leftIcon={<Upload className="h-4 w-4" strokeWidth={1.75} />}
        >
          {importMut.isPending ? tt('contracts.importing') : tt('contracts.import')}
        </Button>
        <p className="text-xs text-ase-muted md:col-span-3">{tt('contracts.hint')}</p>
        {fileError ? <p className="text-sm text-rose-300 md:col-span-3">{fileError}</p> : null}
        {importMut.isError ? (
          <div className="md:col-span-3">
            <CgErrorNote error={importMut.error} />
          </div>
        ) : null}
      </form>

      {contractsQuery.isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : contractsQuery.isError ? (
        <CgErrorNote error={contractsQuery.error} fallbackKey="errors.load" />
      ) : contracts.length === 0 ? (
        <EmptyState title={tt('contracts.empty')} description={tt('contracts.emptyHint')} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {contracts.map((c) => (
            <li key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="h-4 w-4 text-ase-muted" strokeWidth={1.75} aria-hidden="true" />
                <span className="font-semibold text-ase-text">{c.version_label}</span>
                <Badge variant="info">OpenAPI {c.openapi_version}</Badge>
              </div>
              <p className="mt-1 break-all text-xs text-ase-muted">{c.original_filename}</p>
              <p className="mt-1 text-xs text-ase-muted">
                {formatDateTime(c.created_at, locale)} · <span className="font-mono">{c.content_hash.slice(0, 10)}</span>
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="ghost"
                onClick={() => setViewing(c)}
                leftIcon={<Eye className="h-4 w-4" strokeWidth={1.75} />}
              >
                {tt('contracts.view')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={viewing !== null}
        title={viewing ? `${viewing.version_label} · ${viewing.original_filename}` : ''}
        closeLabel={tt('common.close')}
        onClose={() => setViewing(null)}
      >
        {specQuery.isLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : specQuery.isError ? (
          <CgErrorNote error={specQuery.error} fallbackKey="errors.load" />
        ) : (
          <>
            <pre className="max-h-[60vh] overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-ase-text2">
              {spec.slice(0, SPEC_PREVIEW_CHARS)}
            </pre>
            {spec.length > SPEC_PREVIEW_CHARS ? (
              <p className="mt-2 text-xs text-ase-muted">{tt('contracts.truncated')}</p>
            ) : null}
          </>
        )}
      </Modal>
    </div>
  )
}
