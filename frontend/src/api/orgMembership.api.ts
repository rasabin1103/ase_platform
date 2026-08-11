import { apiClient } from './client'

export type OrgJoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type OrgMemberInviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export type OrganizationSearchItem = {
  uuid: string
  name: string
  slug: string
  type: 'individual' | 'business' | 'enterprise' | 'academy' | string
  member_count: number
  has_pending_request: boolean
}

export type OrganizationSearchResponse = {
  items: OrganizationSearchItem[]
  limit: number
  offset: number
  total: number
}

export async function searchOrganizations(q: string) {
  const { data } = await apiClient.get<OrganizationSearchResponse>('/org-membership/organizations/search', {
    params: { q: q || undefined },
  })
  return data
}

export type JoinRequest = {
  id: number
  organization_uuid: string
  organization_name: string
  user_uuid: string
  user_display_name: string | null
  user_email: string
  status: OrgJoinRequestStatus
  message: string | null
  created_at: string
  reviewed_at: string | null
}

export type JoinRequestListResponse = {
  items: JoinRequest[]
  limit: number
  offset: number
  total: number
}

export async function createJoinRequest(organizationUuid: string, message?: string) {
  const { data } = await apiClient.post<JoinRequest>(
    `/org-membership/organizations/${organizationUuid}/join-requests`,
    { message: message || undefined },
  )
  return data
}

export async function listMyJoinRequests() {
  const { data } = await apiClient.get<JoinRequestListResponse>('/org-membership/join-requests/mine')
  return data
}

export async function cancelJoinRequest(requestId: number) {
  const { data } = await apiClient.post<JoinRequest>(`/org-membership/join-requests/${requestId}/cancel`)
  return data
}

export async function listOrganizationJoinRequests(status?: OrgJoinRequestStatus) {
  const { data } = await apiClient.get<JoinRequestListResponse>('/org-membership/join-requests', {
    params: { status },
  })
  return data
}

export async function approveJoinRequest(requestId: number) {
  const { data } = await apiClient.post<JoinRequest>(`/org-membership/join-requests/${requestId}/approve`)
  return data
}

export async function rejectJoinRequest(requestId: number) {
  const { data } = await apiClient.post<JoinRequest>(`/org-membership/join-requests/${requestId}/reject`)
  return data
}

export type UserSearchItem = {
  uuid: string
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
}

export type UserSearchResponse = {
  items: UserSearchItem[]
  limit: number
  offset: number
  total: number
}

export async function searchUnaffiliatedUsers(q: string) {
  const { data } = await apiClient.get<UserSearchResponse>('/org-membership/users/search', {
    params: { q: q || undefined },
  })
  return data
}

export type MemberInvite = {
  id: number
  organization_uuid: string
  organization_name: string
  invited_user_uuid: string
  invited_user_display_name: string | null
  invited_user_email: string
  invited_by_user_uuid: string
  status: OrgMemberInviteStatus
  created_at: string
  responded_at: string | null
}

export type MemberInviteListResponse = {
  items: MemberInvite[]
  limit: number
  offset: number
  total: number
}

export async function createMemberInvite(userUuid: string) {
  const { data } = await apiClient.post<MemberInvite>('/org-membership/member-invites', { user_uuid: userUuid })
  return data
}

export async function listOrganizationMemberInvites(status?: OrgMemberInviteStatus) {
  const { data } = await apiClient.get<MemberInviteListResponse>('/org-membership/member-invites', {
    params: { status },
  })
  return data
}

export async function cancelMemberInvite(inviteId: number) {
  const { data } = await apiClient.post<MemberInvite>(`/org-membership/member-invites/${inviteId}/cancel`)
  return data
}

export async function listMyMemberInvites() {
  const { data } = await apiClient.get<MemberInviteListResponse>('/org-membership/member-invites/mine')
  return data
}

export async function acceptMemberInvite(inviteId: number) {
  const { data } = await apiClient.post<MemberInvite>(`/org-membership/member-invites/${inviteId}/accept`)
  return data
}

export async function declineMemberInvite(inviteId: number) {
  const { data } = await apiClient.post<MemberInvite>(`/org-membership/member-invites/${inviteId}/decline`)
  return data
}
