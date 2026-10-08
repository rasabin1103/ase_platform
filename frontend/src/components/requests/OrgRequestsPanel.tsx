import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Check, Clock, X } from 'lucide-react'
import { useState } from 'react'
import {
  approveOrgAccessRequest,
  escalateOrgAccessRequest,
  listOrgAccessRequests,
  rejectOrgAccessRequest,
  type OrgAccessRequest,
} from '../../api/access_requests.api'
import { useI18n } from '../../i18n'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { Skeleton } from '../ui/Skeleton'
import { Textarea } from '../ui/Textarea'
import { cn } from '../ui/cn'

const COPY = {
  es: {
    title: 'Solicitudes de tu organización',
    subtitle:
      'Lo que piden los miembros de tu organización. Puedes resolverlo tú o escalarlo al equipo de ASE si necesita la plataforma.',
    pending: 'Pendientes',
    all: 'Todas',
    empty: 'No hay solicitudes de tu organización',
    emptyHint: 'Cuando un miembro pida acceso a algo, aparecerá aquí.',
    approve: 'Aprobar',
    reject: 'Rechazar',
    escalate: 'Escalar a ASE',
    escalated: 'Escalada a ASE',
    escalatedHint: 'El equipo de la plataforma ya la tiene en su cola.',
    platformOnly: 'Solo la resuelve el equipo de ASE',
    escalateTitle: 'Escalar al equipo de ASE',
    escalateText:
      'La solicitud seguirá pendiente y el equipo de la plataforma la verá destacada. Añade el contexto que necesiten.',
    noteLabel: 'Nota para el equipo de ASE (opcional)',
    notePh: 'Por qué la escalas, qué necesita esta persona…',
    rejectTitle: 'Rechazar solicitud',
    rejectLabel: 'Motivo (lo verá la persona que la pidió)',
    cancel: 'Cancelar',
    confirmEscalate: 'Escalar',
    confirmReject: 'Rechazar',
    error: 'No se pudo completar la acción. Inténtalo de nuevo.',
    by: 'Solicitada por',
    statuses: { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' },
  },
  en: {
    title: "Your organization's requests",
    subtitle:
      'What members of your organization are asking for. Resolve it yourself or escalate it to the ASE team when it needs the platform.',
    pending: 'Pending',
    all: 'All',
    empty: 'No requests from your organization',
    emptyHint: 'When a member asks for access to something, it will show up here.',
    approve: 'Approve',
    reject: 'Reject',
    escalate: 'Escalate to ASE',
    escalated: 'Escalated to ASE',
    escalatedHint: 'The platform team already has it in their queue.',
    platformOnly: 'Only the ASE team can resolve this',
    escalateTitle: 'Escalate to the ASE team',
    escalateText:
      'The request stays pending and the platform team will see it highlighted. Add any context they need.',
    noteLabel: 'Note for the ASE team (optional)',
    notePh: 'Why you are escalating, what this person needs…',
    rejectTitle: 'Reject request',
    rejectLabel: 'Reason (the requester will see it)',
    cancel: 'Cancel',
    confirmEscalate: 'Escalate',
    confirmReject: 'Reject',
    error: 'The action could not be completed. Try again.',
    by: 'Requested by',
    statuses: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' },
  },
} as const

const isCreatorRequest = (r: OrgAccessRequest) =>
  r.request_type === 'creator_access' || r.target_entity_type === 'platform_creator_permission'

function fmt(iso: string, lang: string) {
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

/**
 * Bandeja de solicitudes de la organización para su owner/admin: aprobar o
 * rechazar (si tiene permiso) y escalar al equipo de la plataforma.
 */
export function OrgRequestsPanel({ canApprove }: { canApprove: boolean }) {
  const { language } = useI18n()
  const c = language === 'en' ? COPY.en : COPY.es
  const qc = useQueryClient()
  const [onlyPending, setOnlyPending] = useState(true)
  const [escalating, setEscalating] = useState<OrgAccessRequest | null>(null)
  const [rejecting, setRejecting] = useState<OrgAccessRequest | null>(null)
  const [note, setNote] = useState('')

  const query = useQuery({
    queryKey: ['org-access-requests', onlyPending],
    queryFn: () => listOrgAccessRequests({ limit: 100, status: onlyPending ? 'pending' : undefined }),
  })
  const done = () => {
    void qc.invalidateQueries({ queryKey: ['org-access-requests'] })
    setEscalating(null)
    setRejecting(null)
    setNote('')
  }
  const approve = useMutation({ mutationFn: (id: number) => approveOrgAccessRequest(id), onSuccess: done })
  const reject = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => rejectOrgAccessRequest(id, notes),
    onSuccess: done,
  })
  const escalate = useMutation({
    mutationFn: ({ id, n }: { id: number; n?: string }) => escalateOrgAccessRequest(id, n),
    onSuccess: done,
  })
  const busy = approve.isPending || reject.isPending || escalate.isPending
  const failed = approve.isError || reject.isError || escalate.isError
  const items = query.data?.items ?? []

  return (
    <section className="rounded-3xl border border-white/10 bg-ase-surface/80">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-ase-text">{c.title}</h2>
          <p className="mt-1.5 text-sm text-ase-text2">{c.subtitle}</p>
        </div>
        <div role="tablist" className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {[
            { v: true, l: c.pending },
            { v: false, l: c.all },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              role="tab"
              aria-selected={onlyPending === o.v}
              onClick={() => setOnlyPending(o.v)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                onlyPending === o.v ? 'bg-ase-brand/20 text-ase-text' : 'text-ase-muted hover:text-ase-text',
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {failed && (
        <p role="alert" className="mx-5 mt-4 rounded-xl border border-ase-error/30 bg-ase-error/10 px-4 py-2 text-sm text-ase-error">
          {c.error}
        </p>
      )}

      {query.isLoading ? (
        <div className="p-6">
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-6">
          <EmptyState title={c.empty} description={c.emptyHint} />
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {items.map((r) => {
            const pending = r.status === 'pending'
            const creator = isCreatorRequest(r)
            return (
              <li key={r.uuid} className="flex flex-wrap items-start justify-between gap-4 p-5 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ase-text">{r.title}</p>
                  <p className="mt-1 text-xs text-ase-muted">
                    {c.by}: {r.requested_by_name || r.requested_by_email || '—'}
                    {r.requested_by_name && r.requested_by_email ? ` · ${r.requested_by_email}` : ''} ·{' '}
                    {fmt(r.created_at, language)}
                  </p>
                  {r.description && <p className="mt-2 text-sm text-ase-text2">{r.description}</p>}
                  {r.escalated_at && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 px-2.5 py-1 text-xs font-semibold text-violet-200">
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      {c.escalated} · {fmt(r.escalated_at, language)}
                    </p>
                  )}
                  {r.admin_notes && <p className="mt-2 text-sm text-amber-100/90">{r.admin_notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={pending ? 'warning' : r.status === 'approved' ? 'success' : 'default'}>
                    {pending && <Clock className="mr-1 h-3 w-3" aria-hidden />}
                    {c.statuses[r.status as keyof typeof c.statuses] ?? r.status}
                  </Badge>
                  {pending && (
                    <div className="flex flex-wrap justify-end gap-2">
                      {canApprove && !creator && (
                        <>
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => approve.mutate(r.id)}
                            leftIcon={<Check className="h-3.5 w-3.5" aria-hidden />}
                          >
                            {c.approve}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              setNote('')
                              setRejecting(r)
                            }}
                            leftIcon={<X className="h-3.5 w-3.5" aria-hidden />}
                          >
                            {c.reject}
                          </Button>
                        </>
                      )}
                      {!r.escalated_at && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setNote('')
                            setEscalating(r)
                          }}
                          leftIcon={<ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}
                        >
                          {c.escalate}
                        </Button>
                      )}
                    </div>
                  )}
                  {pending && creator && !r.escalated_at && (
                    <p className="text-[11px] text-ase-muted">{c.platformOnly}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={escalating !== null}
        onClose={() => setEscalating(null)}
        title={c.escalateTitle}
        closeLabel={c.cancel}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEscalating(null)}>
              {c.cancel}
            </Button>
            <Button
              disabled={escalate.isPending}
              onClick={() => escalating && escalate.mutate({ id: escalating.id, n: note.trim() || undefined })}
            >
              {c.confirmEscalate}
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-sm text-ase-text2">{c.escalateText}</p>
        <label htmlFor="org-escalate-note" className="mb-2 block text-xs font-medium text-ase-muted">
          {c.noteLabel}
        </label>
        <Textarea
          id="org-escalate-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={c.notePh}
        />
      </Modal>

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title={c.rejectTitle}
        closeLabel={c.cancel}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejecting(null)}>
              {c.cancel}
            </Button>
            <Button
              variant="danger"
              disabled={reject.isPending}
              onClick={() => rejecting && reject.mutate({ id: rejecting.id, notes: note.trim() || undefined })}
            >
              {c.confirmReject}
            </Button>
          </div>
        }
      >
        <label htmlFor="org-reject-note" className="mb-2 block text-xs font-medium text-ase-muted">
          {c.rejectLabel}
        </label>
        <Textarea id="org-reject-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>
    </section>
  )
}
