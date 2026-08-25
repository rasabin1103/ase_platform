import { apiClient } from './client'

export type BlogPostStatus = 'draft' | 'published'

export type BlogPostAdmin = {
  id: number
  uuid: string
  title: string
  slug: string
  excerpt: string
  content_html: string
  cover_image_url: string | null
  has_stored_image?: boolean
  author_name: string | null
  tags: string[]
  status: BlogPostStatus
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  viewsTotal: number
  viewsAuthenticated: number
  likesCount: number
  dislikesCount: number
  commentsCount: number
  sharesTotal: number
  sharesByNetwork: Record<string, number>
}

export type BlogAdminListResponse = {
  items: BlogPostAdmin[]
  limit: number
  offset: number
  total: number
}

export type BlogPostAdminPayload = {
  title: string
  slug: string
  excerpt: string
  content_html: string
  cover_image_url?: string | null
  author_name?: string | null
  tags?: string[]
  status: BlogPostStatus
  meta_title?: string | null
  meta_description?: string | null
}

export type BlogPostAdminUpdatePayload = Partial<BlogPostAdminPayload>

export async function listAdminBlogPosts(params?: {
  limit?: number
  offset?: number
  search?: string
  tags?: string[]
  status?: BlogPostStatus
}) {
  const { data } = await apiClient.get<BlogAdminListResponse>('/admin/blog', { params })
  return data
}

export async function listAdminBlogTags() {
  const { data } = await apiClient.get<string[]>('/admin/blog/tags')
  return data
}

export async function getAdminBlogPost(postId: number) {
  const { data } = await apiClient.get<BlogPostAdmin>(`/admin/blog/${postId}`)
  return data
}

export async function createAdminBlogPost(payload: BlogPostAdminPayload) {
  const { data } = await apiClient.post<BlogPostAdmin>('/admin/blog', payload)
  return data
}

export async function updateAdminBlogPost(postId: number, payload: BlogPostAdminUpdatePayload) {
  const { data } = await apiClient.patch<BlogPostAdmin>(`/admin/blog/${postId}`, payload)
  return data
}

export async function deleteAdminBlogPost(postId: number) {
  await apiClient.delete(`/admin/blog/${postId}`)
}

export async function uploadBlogCoverImage(postId: number, file: File) {
  const form = new FormData()
  form.append('file', file)
  await apiClient.post(`/admin/blog/${postId}/image`, form)
}

export async function clearBlogCoverImage(postId: number) {
  await apiClient.delete(`/admin/blog/${postId}/image`)
}

// --- comment moderation (raw/uncensored text, any comment) ------------------

export type BlogCommentAdmin = {
  id: number
  authorName: string
  content: string
  createdAt: string
  parentId: number | null
  isOwn: boolean
  canDelete: boolean
  replies: BlogCommentAdmin[]
}

export type BlogCommentAdminListResponse = {
  comments: BlogCommentAdmin[]
  total: number
}

export async function listAdminBlogComments(postId: number) {
  const { data } = await apiClient.get<BlogCommentAdminListResponse>(`/admin/blog/${postId}/comments`)
  return data
}

export async function deleteAdminBlogComment(postId: number, commentId: number) {
  await apiClient.delete(`/admin/blog/${postId}/comments/${commentId}`)
}
