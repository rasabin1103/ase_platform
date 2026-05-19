export type ProductStatus = 'active' | 'inactive'

export type Product = {
  id: number
  code: string
  name: string
  description: string | null
  status: ProductStatus
  created_at: string
  updated_at: string
}

export type ProductListResponse = {
  items: Product[]
  limit: number
  offset: number
  total: number
}

export type ProductCreateRequest = {
  code: string
  name: string
  description?: string | null
  status?: ProductStatus
}

export type ProductUpdateRequest = Partial<ProductCreateRequest>

