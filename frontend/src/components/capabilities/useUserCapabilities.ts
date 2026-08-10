import { useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { CapabilityId, CapabilityStatus, UserCapability } from './types'

function publishingStatus(canCreate: boolean, creatorStatus: string): CapabilityStatus {
  if (canCreate) return 'active'
  if (creatorStatus === 'pending') return 'pending'
  if (creatorStatus === 'rejected') return 'restricted'
  return 'restricted'
}

function creatorProgramStatus(canCreate: boolean, creatorStatus: string): CapabilityStatus {
  if (canCreate) return 'active'
  if (creatorStatus === 'pending') return 'pending'
  if (creatorStatus === 'rejected') return 'restricted'
  return 'available'
}

export function useUserCapabilities() {
  const { currentUser } = useAuth()
  const canCreate = Boolean(currentUser?.can_create_content)
  const creatorStatus = currentUser?.creator_status ?? 'none'
  const publish = publishingStatus(canCreate, creatorStatus)
  const creator = creatorProgramStatus(canCreate, creatorStatus)

  const capabilities = useMemo<UserCapability[]>(
    () => [
      { id: 'content_creator', status: creator },
      { id: 'publish_products', status: publish },
      { id: 'publish_courses', status: publish },
      { id: 'publish_books', status: canCreate ? 'coming_soon' : publish },
      { id: 'private_demos', status: 'available' },
      { id: 'catalog_access', status: 'active' },
    ],
    [canCreate, creator, publish],
  )

  const showCreatorRequestCta =
    !canCreate && creatorStatus !== 'pending' && creatorStatus !== 'approved'

  return {
    canCreate,
    creatorStatus,
    capabilities,
    creatorProgramStatus: creator,
    showCreatorRequestCta,
    getStatus: (id: CapabilityId) => capabilities.find((c) => c.id === id)?.status ?? 'restricted',
  }
}
