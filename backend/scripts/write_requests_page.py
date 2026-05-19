from pathlib import Path

CLOSE = "</" + "div>"

content = f"""import {{ useMutation, useQuery, useQueryClient }} from '@tanstack/react-query'
import {{
  approveAccessRequest,
  createAccessRequest,
  listAccessRequests,
  rejectAccessRequest,
}} from '../api/access_requests.api'
import {{ Card }} from '../components/ui/Card'
import {{ EmptyState }} from '../components/ui/EmptyState'
import {{ Skeleton }} from '../components/ui/Skeleton'
import {{ Button }} from '../components/ui/Button'
import {{ useI18n }} from '../i18n'
import {{ Can }} from '../rbac/Can'
import {{ useRbac }} from '../rbac/useRbac'

const CREATOR_TYPES = new Set([
  'creator_application',
  'product_creator_application',
  'course_creator_application',
])

export function RequestsPage() {{
  const {{ t }} = useI18n()
  const {{ can, isSuperuser }} = useRbac()
  const qc = useQueryClient()

  const query = useQuery({{
    queryKey: ['access-requests'],
    queryFn: () => listAccessRequests({{ limit: 50 }}),
  }})

  const createMutation = useMutation({{
    mutationFn: () =>
      createAccessRequest({{
        request_type: 'product_access',
        target_entity_type: 'product',
        target_entity_id: 'qa_frameworks',
        title: t('requestsPage.demoRequestTitle'),
        description: t('requestsPage.demoRequestDescription'),
      }}),
    onSuccess: () => qc.invalidateQueries({{ queryKey: ['access-requests'] }}),
  }})

  const approveMutation = useMutation({{
    mutationFn: approveAccessRequest,
    onSuccess: () => qc.invalidateQueries({{ queryKey: ['access-requests'] }}),
  }})

  const rejectMutation = useMutation({{
    mutationFn: rejectAccessRequest,
    onSuccess: () => qc.invalidateQueries({{ queryKey: ['access-requests'] }}),
  }})

  const items = query.data?.items ?? []

  return (
    {CLOSE.replace('/', 'div className="space-y-6"')}
"""

# broken approach - write file directly as single string file
Path(r"d:\workspaces\ase\ase_frontend\src\pages\RequestsPage.tsx").write_text(
    Path(r"d:\workspaces\ase\ase_frontend\src\pages\RequestsPage.tsx").read_text(encoding="utf-8")
    if "motionless" not in open(r"d:\workspaces\ase\ase_frontend\src\pages\RequestsPage.tsx", encoding="utf-8").read()
    else "",
    encoding="utf-8",
)
