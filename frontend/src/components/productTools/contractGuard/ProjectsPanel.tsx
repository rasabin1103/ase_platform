import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createCgProject, deleteCgProject, updateCgProject, type CgProject } from '../../../api/contractGuard.api'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'
import { CgErrorNote } from './CgErrorNote'
import { useCgT } from './useCgT'

type Props = {
  projects: CgProject[]
  selectedId: string | null
  maxProjects?: number
  onSelect: (id: string | null) => void
}

/** Selector de proyecto y su alta, renombrado y borrado. Borrar exige
 * escribir el nombre exacto: el servicio también lo exige y elimina de
 * golpe sus contratos y comparaciones. */
export function ProjectsPanel({ projects, selectedId, maxProjects, onSelect }: Props) {
  const { tt } = useCgT()
  const qc = useQueryClient()
  const selected = projects.find((p) => p.id === selectedId) ?? null

  const [mode, setMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [confirmName, setConfirmName] = useState('')

  const refresh = () => qc.invalidateQueries({ queryKey: ['cg-projects'] })
  const close = () => {
    setMode(null)
    createMut.reset()
    updateMut.reset()
    deleteMut.reset()
  }

  const createMut = useMutation({
    mutationFn: () => createCgProject({ name: name.trim(), description: description.trim() }),
    onSuccess: async (p) => {
      await refresh()
      onSelect(p.id)
      setMode(null)
    },
  })
  const updateMut = useMutation({
    mutationFn: () => updateCgProject(selected!.id, { name: name.trim(), description: description.trim() }),
    onSuccess: async () => {
      await refresh()
      setMode(null)
    },
  })
  const deleteMut = useMutation({
    mutationFn: () => deleteCgProject(selected!.id, confirmName),
    onSuccess: async () => {
      qc.removeQueries({ queryKey: ['cg-contracts', selected!.id] })
      qc.removeQueries({ queryKey: ['cg-comparisons', selected!.id] })
      onSelect(null)
      await refresh()
      setMode(null)
    },
  })

  const atLimit = maxProjects !== undefined && projects.length >= maxProjects

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="cg-project" className="mb-1 block text-xs font-medium text-ase-muted">
            {tt('projects.label')}
          </label>
          <Select
            id="cg-project"
            value={selectedId ?? ''}
            onChange={(e) => onSelect(e.target.value || null)}
            disabled={projects.length === 0}
          >
            <option value="">{projects.length === 0 ? tt('projects.none') : tt('projects.choose')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setName('')
            setDescription('')
            setMode('create')
          }}
          disabled={atLimit}
          title={atLimit ? tt('projects.limitReached', { max: maxProjects ?? 0 }) : undefined}
          leftIcon={<FolderPlus className="h-4 w-4" strokeWidth={1.75} />}
        >
          {tt('projects.new')}
        </Button>
        <Button
          variant="ghost"
          disabled={!selected}
          onClick={() => {
            setName(selected?.name ?? '')
            setDescription(selected?.description ?? '')
            setMode('edit')
          }}
          leftIcon={<Pencil className="h-4 w-4" strokeWidth={1.75} />}
        >
          {tt('projects.rename')}
        </Button>
        <Button
          variant="ghost"
          className="text-rose-300 hover:text-rose-200"
          disabled={!selected}
          onClick={() => {
            setConfirmName('')
            setMode('delete')
          }}
          leftIcon={<Trash2 className="h-4 w-4" strokeWidth={1.75} />}
        >
          {tt('projects.delete')}
        </Button>
      </div>
      {selected?.description ? <p className="text-sm text-ase-text2">{selected.description}</p> : null}

      <Modal
        open={mode === 'create' || mode === 'edit'}
        title={mode === 'create' ? tt('projects.createTitle') : tt('projects.editTitle')}
        closeLabel={tt('common.cancel')}
        onClose={close}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              {tt('common.cancel')}
            </Button>
            <Button
              disabled={!name.trim() || createMut.isPending || updateMut.isPending}
              onClick={() => (mode === 'create' ? createMut.mutate() : updateMut.mutate())}
            >
              {mode === 'create' ? tt('projects.create') : tt('common.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="cg-project-name" className="mb-1 block text-xs font-medium text-ase-muted">
              {tt('projects.name')}
            </label>
            <Input id="cg-project-name" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cg-project-desc" className="mb-1 block text-xs font-medium text-ase-muted">
              {tt('projects.description')}
            </label>
            <Textarea
              id="cg-project-desc"
              value={description}
              maxLength={5000}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {createMut.isError ? <CgErrorNote error={createMut.error} /> : null}
          {updateMut.isError ? <CgErrorNote error={updateMut.error} /> : null}
        </div>
      </Modal>

      <Modal
        open={mode === 'delete'}
        title={tt('projects.deleteTitle')}
        closeLabel={tt('common.cancel')}
        onClose={close}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              {tt('common.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={confirmName !== selected?.name || deleteMut.isPending}
              onClick={() => deleteMut.mutate()}
            >
              {tt('projects.deleteConfirm')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ase-text2">{tt('projects.deleteBody', { name: selected?.name ?? '' })}</p>
          <label htmlFor="cg-project-confirm" className="block text-xs font-medium text-ase-muted">
            {tt('projects.deleteType', { name: selected?.name ?? '' })}
          </label>
          <Input id="cg-project-confirm" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
          {deleteMut.isError ? <CgErrorNote error={deleteMut.error} /> : null}
        </div>
      </Modal>
    </div>
  )
}
