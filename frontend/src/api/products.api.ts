import { apiClient } from './client'
import type {
  Product,
  ProductCreateRequest,
  ProductListResponse,
  ProductStatus,
  ProductUpdateRequest,
} from '../types/product.types'

export async function listProducts(params?: { limit?: number; offset?: number; status?: ProductStatus | null }) {
  const { data } = await apiClient.get<ProductListResponse>('/products', { params })
  return data
}

export async function createProduct(payload: ProductCreateRequest) {
  const { data } = await apiClient.post<Product>('/products', payload)
  return data
}

export async function updateProduct(product_id: number, payload: ProductUpdateRequest) {
  const { data } = await apiClient.patch<Product>(`/products/${product_id}`, payload)
  return data
}

export async function deleteProduct(product_id: number) {
  const { data } = await apiClient.delete<Product>(`/products/${product_id}`)
  return data
}
