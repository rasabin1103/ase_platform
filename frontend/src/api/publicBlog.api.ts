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

export type BlogPostDetail = BlogPostCard & {
  content_html: string
  meta_title: string | null
  meta_description: string | null
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
