import axios from 'axios'
import { getAccessToken, getActiveOrganizationUuid } from '../auth/auth.store'

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL is not set. Define it in ase_frontend/.env')
  }
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  const orgUuid = getActiveOrganizationUuid()
  if (orgUuid) {
    config.headers = config.headers ?? {}
    config.headers['X-Organization-UUID'] = orgUuid
  }
  return config
})

