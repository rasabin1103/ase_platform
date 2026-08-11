import { apiClient } from './client'

export type RedeemedBook = {
  catalog_item_id: number
  slug: string
  title: string
  image_url: string
  repo_url: string
  github_username: string | null
  redeemed_at: string
}

export type RedeemResult = RedeemedBook & {
  invite_status: 'invited' | 'already_collaborator'
}

export async function redeemBookCode(code: string, githubUsername: string) {
  const { data } = await apiClient.post<RedeemResult>('/book-redemption/redeem', {
    code,
    github_username: githubUsername,
  })
  return data
}

export async function listMyRedeemedBooks() {
  const { data } = await apiClient.get<{ items: RedeemedBook[] }>('/book-redemption/me')
  return data.items
}
