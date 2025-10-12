/**
 * Axios API client with authentication and error handling.
 *
 * Provides base configuration for all API requests with automatic token injection.
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

/**
 * Standard API error response structure.
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  request_id?: string
}

/**
 * Create and configure the Axios instance.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor to add authentication token.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (will be managed by auth store)
    const token = localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor for error handling and token refresh.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')

        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        // Attempt to refresh token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )

        const { access_token, refresh_token } = response.data

        // Store new tokens
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    if (error.response?.data) {
      // API returned structured error
      return Promise.reject(error.response.data)
    }

    // Network or timeout error
    const apiError: ApiError = {
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
      },
    }

    return Promise.reject(apiError)
  }
)

/**
 * Type-safe API response wrapper.
 */
export interface ApiResponse<T> {
  data: T
  message?: string
}

/**
 * Paginated API response structure.
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export default apiClient
