import { apiClient } from './client'

export type BlogPostCard = {
  uuid: string
  title: string
  slug: string
  excerpt: string
  cover_image_url: string | null
  author_name: string | null
  tags: string[]
  published_at: string | null
}

export type BlogReaction = 'like' | 'dislike'

export type BlogPostDetail = BlogPostCard & {
  content_html: string
  meta_title: string | null
  meta_description: string | null
  likesCount: number
  dislikesCount: number
  myReaction: BlogReaction | null
  commentsCount: number
  sharesCount: number
}

export type PublicBlogListResponse = {
  items: BlogPostCard[]
  limit: number
  offset: number
  total: number
}

export async function listPublicBlogPosts(params?: {
  limit?: number
  offset?: number
  search?: string
  tags?: string[]
}) {
  const { data } = await apiClient.get<PublicBlogListResponse>('/public/blog', { params })
  return data
}

export async function listPublicBlogTags() {
  const { data } = await apiClient.get<string[]>('/public/blog/tags')
  return data
}

export async function getPublicBlogPost(slug: string) {
  const { data } = await apiClient.get<BlogPostDetail>(`/public/blog/${slug}`)
  return data
}

// --- engagement: comments, reactions, shares --------------------------------

export type BlogComment = {
  id: number
  authorName: string
  content: string
  createdAt: string
  parentId: number | null
  isOwn: boolean
  canDelete: boolean
  replies: BlogComment[]
}

export type BlogCommentListResponse = {
  comments: BlogComment[]
  total: number
}

export async function listBlogComments(slug: string) {
  const { data } = await apiClient.get<BlogCommentListResponse>(`/public/blog/${slug}/comments`)
  return data
}

export async function createBlogComment(slug: string, payload: { content: string; parentId?: number | null }) {
  const { data } = await apiClient.post<BlogComment>(`/public/blog/${slug}/comments`, payload)
  return data
}

export async function deleteBlogComment(slug: string, commentId: number) {
  await apiClient.delete(`/public/blog/${slug}/comments/${commentId}`)
}

export type BlogReactionCounts = {
  likesCount: number
  dislikesCount: number
  myReaction: BlogReaction | null
}

export async function getBlogReaction(slug: string) {
  const { data } = await apiClient.get<BlogReactionCounts>(`/public/blog/${slug}/reaction`)
  return data
}

export async function setBlogReaction(slug: string, reaction: BlogReaction) {
  const { data } = await apiClient.post<BlogReactionCounts>(`/public/blog/${slug}/reaction`, { reaction })
  return data
}

export async function removeBlogReaction(slug: string) {
  const { data } = await apiClient.delete<BlogReactionCounts>(`/public/blog/${slug}/reaction`)
  return data
}

export type BlogShareNetwork = 'linkedin' | 'twitter' | 'facebook' | 'whatsapp' | 'instagram' | 'copy_link' | 'native'

export async function logBlogShare(slug: string, network: BlogShareNetwork) {
  const { data } = await apiClient.post<{ total: number }>(`/public/blog/${slug}/share`, { network })
  return data
}
