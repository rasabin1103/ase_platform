import type { UseMutationResult } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateOrganizationResponse } from '../api/onboarding.api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { cn } from '../components/ui/cn'
import type { Organization, OrganizationType } from '../types/organization.types'
import { MiniOrgMetric } from './OrganizationsPage.parts'
import {
  type FormValues,
  isManagedOrganization,
  isMyOrganization,
  organizationTypeLabel,
  slugify,
} from './OrganizationsPage.utils'

export function renderCreateOrganizationForm({
  t,
  form,
  computedSlug,
  na,
  orgTypes,
  createMutation,
}: {
  t: (k: string) => string
  form: UseFormReturn<FormValues>
  computedSlug: string
  na: string
  orgTypes: Array<{ value: OrganizationType; label: string }>
  createMutation: UseMutationResult<CreateOrganizationResponse, Error, FormValues, unknown>
}) {
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
      <div>
        <label htmlFor="org-create-name" className="mb-1 block text-xs font-medium text-ase-muted">
          {t('organizationsPage.create.fields.name')}
        </label>
        <Input
          id="org-create-name"
          placeholder={t('organizationsPage.create.placeholders.name') as string}
          {...form.register('organization_name', {
            onChange: (e) => {
              const name = String(e.target.value ?? '')
              const current = form.getValues('organization_slug')
              if (!current) form.setValue('organization_slug', slugify(name))
            },
          })}
        />
        {form.formState.errors.organization_name && (
          <p className="mt-1 text-sm text-ase-error">{form.formState.errors.organization_name.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="org-create-slug" className="mb-1 block text-xs font-medium text-ase-muted">
            {t('organizationsPage.create.fields.slug')}
          </label>
          <button
            type="button"
            className={cn(
              'rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-ase-text2 transition hover:bg-white/[0.05]',
              !computedSlug && 'opacity-50',
            )}
            disabled={!computedSlug}
            onClick={() => form.setValue('organization_slug', computedSlug)}
          >
            {String(t('organizationsPage.create.helper.suggest')).replace('{{slug}}', computedSlug || na)}
          </button>
        </div>
        <Input
          id="org-create-slug"
          placeholder={t('organizationsPage.create.placeholders.slug') as string}
          {...form.register('organization_slug')}
        />
        {form.formState.errors.organization_slug && (
          <p className="mt-1 text-sm text-ase-error">{form.formState.errors.organization_slug.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="org-create-type" className="mb-1 block text-xs font-medium text-ase-muted">
          {t('organizationsPage.create.fields.type')}
        </label>
        <Select id="org-create-type" {...form.register('organization_type')}>
          {orgTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </div>

      {createMutation.isError && (
        <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
          {t('organizationsPage.create.error')}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={createMutation.isPending}
        leftIcon={<span className="text-xs">+</span>}
      >
        {createMutation.isPending ? t('organizationsPage.create.creating') : t('organizationsPage.create.button')}
      </Button>
    </form>
  )
}

export function renderDetailsDrawer({
  org,
  t,
  activeUuid,
  activateOrganization,
  onClose,
  onToggleStatus,
  onDelete,
  statusPending,
  disableDangerActions,
}: {
  org: Organization
  t: (k: string) => string
  activeUuid: string | null
  activateOrganization: (uuid: string) => void
  onClose: () => void
  onToggleStatus: () => void
  onDelete: () => void
  statusPending: boolean
  disableDangerActions: boolean
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/65" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-ase-bg2/90 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
              {t('organizationsPage.actions.viewDetails')}
            </div>
            <div className="mt-2 truncate text-xl font-extrabold tracking-tight text-ase-text">{org.name}</div>
            <div className="mt-1 text-sm text-ase-text2">{org.slug}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('organizationsPage.actions.close')}
          </Button>
        </div>
        <div className="mt-6 grid gap-3">
          <MiniOrgMetric
            label={t('organizationsPage.list.columns.type') as string}
            value={organizationTypeLabel(t, org.type)}
          />
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            {renderStatusBadge(t, org.status ?? null)}
          </div>
          {activeUuid === org.uuid ? (
            <MiniOrgMetric
              label={t('organizationsPage.badges.activeOrganization') as string}
              value={t('organizationsPage.actions.active') as string}
            />
          ) : (
            <Button className="w-full" onClick={() => activateOrganization(org.uuid)}>
              {t('organizationsPage.actions.setActive')}
            </Button>
          )}
          {org.status !== 'deleted' ? (
            <Button
              className="w-full"
              variant="outline"
              disabled={disableDangerActions || statusPending}
              onClick={onToggleStatus}
            >
              {org.status === 'suspended'
                ? t('organizationsPage.superAdmin.actions.reactivate')
                : t('organizationsPage.superAdmin.actions.suspend')}
            </Button>
          ) : null}
          {org.status !== 'deleted' ? (
            <Button className="w-full" variant="danger" disabled={disableDangerActions} onClick={onDelete}>
              {t('organizationsPage.superAdmin.actions.delete')}
            </Button>
          ) : null}
          {disableDangerActions ? (
            <p className="text-center text-[11px] text-ase-muted">
              {t('organizationsPage.errors.ownOrganizationHint')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function renderStatusBadge(t: (k: string) => string, status: string | null) {
  if (!status) return <span className="text-ase-muted">{t('organizationsPage.common.na') as string}</span>
  const key =
    status === 'active' || status === 'suspended' || status === 'deleted'
      ? (`organizationsPage.status.${status}` as const)
      : ('organizationsPage.status.unknown' as const)

  const variant =
    status === 'active' ? 'success' : status === 'suspended' ? 'warning' : status === 'deleted' ? 'error' : 'default'
  return <Badge variant={variant}>{t(key) as string}</Badge>
}

export function renderOrganizationBadges(
  t: (k: string) => string,
  org: Organization,
  context: { activeUuid: string | null; currentUserUuid: string | null },
) {
  const badges = []
  if (context.activeUuid === org.uuid) {
    badges.push(
      <Badge key="active" variant="info" className="text-[10px]">
        {t('organizationsPage.badges.activeOrganization') as string}
      </Badge>,
    )
  }
  if (isMyOrganization(org, context.currentUserUuid)) {
    badges.push(
      <Badge key="mine" variant="success" className="text-[10px]">
        {t('organizationsPage.badges.myOrganization') as string}
      </Badge>,
    )
  }
  if (isManagedOrganization(org, context.currentUserUuid)) {
    badges.push(
      <Badge key="managed" variant="info" className="text-[10px]">
        {t('organizationsPage.badges.managed') as string}
      </Badge>,
    )
  }
  if (org.status === 'suspended') {
    badges.push(
      <Badge key="suspended" variant="warning" className="text-[10px]">
        {t('organizationsPage.badges.suspended') as string}
      </Badge>,
    )
  }
  return badges
}
