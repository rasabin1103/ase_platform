import { Badge } from './Badge'

export type Status =
  | 'active'
  | 'suspended'
  | 'deleted'
  | 'canceled'
  | 'draft'
  | 'published'

const variantByStatus: Record<Status, Parameters<typeof Badge>[0]['variant']> = {
  active: 'success',
  suspended: 'warning',
  deleted: 'error',
  canceled: 'error',
  draft: 'default',
  published: 'info',
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant={variantByStatus[status]}>{status}</Badge>
}

