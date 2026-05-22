import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { me } from '../api/auth.api'
import { createOrganization } from '../api/onboarding.api'
import { listOrganizations } from '../api/organizations.api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { setActiveOrganizationUuid } from '../auth/auth.store'

const schema = z.object({
  organization_name: z.string().min(2),
  organization_slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa kebab-case'),
  organization_type: z.enum(['individual', 'business', 'enterprise', 'academy']),
})

type Values = z.infer<typeof schema>

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const meQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: me })
  const orgsQuery = useQuery({ queryKey: ['organizations', 'onboarding'], queryFn: listOrganizations })

  useEffect(() => {
    const profile = meQuery.data
    if (!profile) return
    if (
      profile.dashboard_mode === 'independent' ||
      (profile.is_independent_user && profile.primary_role === 'independent_user' && !profile.organization_uuid)
    ) {
      navigate('/dashboard', { replace: true })
    }
  }, [meQuery.data, navigate])

  // If orgs appear (e.g. user got invited), go select/auto.
  useEffect(() => {
    if ((orgsQuery.data?.items?.length ?? 0) > 0) {
      navigate('/select-organization', { replace: true })
    }
  }, [orgsQuery.data, navigate])

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization_name: '',
      organization_slug: '',
      organization_type: 'business',
    },
  })

  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async (created) => {
      // created has organization_uuid
      setActiveOrganizationUuid(created.organization_uuid)
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
      navigate('/dashboard', { replace: true })
    },
  })

  const display = meQuery.data?.display_name ?? meQuery.data?.email ?? 'your account'

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="info" className="w-fit">
          Onboarding
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text">Welcome, {display}</h1>
        <p className="mt-1 text-sm text-ase-text2">
          Opcional: crea una organización para equipos o acepta una invitación. Los usuarios independientes acceden al
          dashboard sin este paso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2" interactive>
          <div className="text-sm font-semibold text-ase-text">Create organization</div>
          <div className="mt-1 text-sm text-ase-text2">Primary path for teams and businesses.</div>

          <form
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ase-muted">organization_name</label>
              <Input
                placeholder="Acme Corporation"
                {...form.register('organization_name', {
                  onChange: (e) => {
                    const name = String(e.target.value ?? '')
                    const cur = form.getValues('organization_slug')
                    if (!cur) form.setValue('organization_slug', slugify(name))
                  },
                })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">organization_slug</label>
              <Input placeholder="acme-corp" {...form.register('organization_slug')} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">organization_type</label>
              <Select {...form.register('organization_type')}>
                <option value="individual">individual</option>
                <option value="business">business</option>
                <option value="enterprise">enterprise</option>
                <option value="academy">academy</option>
              </Select>
            </div>

            {mutation.isError && (
              <div className="sm:col-span-2 rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                Could not create organization. Check slug duplicates/permissions.
              </div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create organization'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-6" interactive>
            <div className="text-sm font-semibold text-ase-text">Individual workspace</div>
            <div className="mt-1 text-sm text-ase-text2">Quick setup for solo work.</div>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  const base = meQuery.data?.display_name || 'individual'
                  const name = `Workspace — ${base}`
                  mutation.mutate({
                    organization_name: name,
                    organization_slug: slugify(name),
                    organization_type: 'individual',
                  })
                }}
              >
                Create individual workspace
              </Button>
            </div>
          </Card>

          <Card className="p-6" interactive>
            <div className="text-sm font-semibold text-ase-text">Accept invitation</div>
            <div className="mt-1 text-sm text-ase-text2">
              If you’ve been invited, it will appear in your organizations automatically.
            </div>
            <div className="mt-4">
              <Button variant="ghost" onClick={() => queryClient.invalidateQueries({ queryKey: ['organizations'] })}>
                Refresh organizations
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

