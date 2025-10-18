/**
 * Zustand store for authentication state management.
 *
 * Manages user authentication state, tokens, and auth actions.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '@/api/client'

/**
 * User role types.
 */
export type UserRole = 'student' | 'instructor' | 'admin'

/**
 * User data structure.
 */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Authentication state interface.
 */
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Authentication actions interface.
 */
interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  clearError: () => void
  setLoading: (isLoading: boolean) => void
}

/**
 * Registration data interface.
 */
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

/**
 * Login response from API.
 */
interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

/**
 * Combined auth store type.
 */
type AuthStore = AuthState & AuthActions

/**
 * Initial authentication state.
 */
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

/**
 * Zustand authentication store with persistence.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      /**
       * Login action - authenticate user with email and password.
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await apiClient.post<LoginResponse>('/auth/login', {
            email,
            password,
          })

          const { access_token, refresh_token, user } = response.data

          // Store tokens in localStorage for axios interceptor
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          const errorMessage = error.message || 'Login failed. Please try again.'

          set({
            isLoading: false,
            error: errorMessage,
          })

          throw error
        }
      },

      /**
       * Register action - create new user account.
       */
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })

        try {
          const response = await apiClient.post<LoginResponse>('/auth/register', data)

          const { access_token, refresh_token, user } = response.data

          // Store tokens in localStorage for axios interceptor
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          const errorMessage =
            error.message || 'Registration failed. Please try again.'

          set({
            isLoading: false,
            error: errorMessage,
          })

          throw error
        }
      },

      /**
       * Logout action - clear authentication state.
       */
      logout: () => {
        // Clear tokens and user data from localStorage
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')

        // Reset state to initial
        set(initialState)

        // Optional: Call logout endpoint to invalidate token on server
        apiClient.post('/auth/logout').catch(() => {
          // Ignore errors on logout endpoint
        })
      },

      /**
       * Update user data in store.
       */
      updateUser: (user: User) => {
        set({ user })
      },

      /**
       * Clear error message.
       */
      clearError: () => {
        set({ error: null })
      },

      /**
       * Set loading state.
       */
      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist essential data
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
