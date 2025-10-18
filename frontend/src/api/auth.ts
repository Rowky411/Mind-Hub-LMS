/**
 * Authentication API client functions.
 *
 * Provides functions for user authentication, registration, and token management.
 */
import apiClient, { ApiError } from './client'

/**
 * User role enumeration matching backend UserRole.
 */
export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

/**
 * User data structure.
 */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  bio?: string
  avatarUrl?: string
  emailVerified: boolean
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

/**
 * Authentication tokens response.
 */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: User
}

/**
 * Login credentials.
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Registration data.
 */
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

/**
 * Token refresh request.
 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/**
 * Token refresh response.
 */
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

/**
 * Password reset request.
 */
export interface PasswordResetRequest {
  email: string
}

/**
 * Password reset confirmation.
 */
export interface PasswordResetConfirm {
  token: string
  newPassword: string
}

/**
 * Backend response format (snake_case).
 */
interface BackendAuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  user: any
}

/**
 * Convert snake_case user object to camelCase.
 */
function convertUserToCamelCase(backendUser: any): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    firstName: backendUser.first_name,
    lastName: backendUser.last_name,
    role: backendUser.role as UserRole,
    bio: backendUser.bio,
    avatarUrl: backendUser.avatar_url,
    emailVerified: backendUser.email_verified,
    isActive: backendUser.is_active,
    lastLogin: backendUser.last_login,
    createdAt: backendUser.created_at,
    updatedAt: backendUser.updated_at,
  }
}

/**
 * Register a new user.
 *
 * @param data - Registration data
 * @returns Authentication tokens and user data
 * @throws {ApiError} If registration fails
 */
export async function register(data: RegisterData): Promise<AuthTokens> {
  try {
    const response = await apiClient.post<BackendAuthTokens>('/auth/register', {
      email: data.email.trim(),
      password: data.password,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      role: data.role || UserRole.STUDENT,
    })

    // Convert snake_case to camelCase
    const authTokens: AuthTokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenType: response.data.token_type,
      user: convertUserToCamelCase(response.data.user),
    }

    // Store tokens in localStorage
    localStorage.setItem('access_token', authTokens.accessToken)
    localStorage.setItem('refresh_token', authTokens.refreshToken)

    // Also store user data for quick access
    localStorage.setItem('user', JSON.stringify(authTokens.user))

    return authTokens
  } catch (error) {
    console.error('Registration error:', error)
    throw error as ApiError
  }
}

/**
 * Log in an existing user.
 *
 * @param credentials - User email and password
 * @returns Authentication tokens and user data
 * @throws {ApiError} If login fails
 */
export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  try {
    const response = await apiClient.post<BackendAuthTokens>('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    })

    // Convert snake_case to camelCase
    const authTokens: AuthTokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenType: response.data.token_type,
      user: convertUserToCamelCase(response.data.user),
    }

    // Store tokens in localStorage
    localStorage.setItem('access_token', authTokens.accessToken)
    localStorage.setItem('refresh_token', authTokens.refreshToken)

    // Also store user data for quick access
    localStorage.setItem('user', JSON.stringify(authTokens.user))

    return authTokens
  } catch (error) {
    console.error('Login error:', error)
    throw error as ApiError
  }
}

/**
 * Log out the current user.
 *
 * Clears authentication tokens from localStorage and makes logout API call.
 */
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint (backend may invalidate refresh token)
    await apiClient.post('/auth/logout')
  } catch (error) {
    // Log error but don't throw - we still want to clear local state
    console.error('Logout API error:', error)
  } finally {
    // Clear tokens and user data from localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')

    // IMPORTANT: Clear Zustand auth store persistence
    localStorage.removeItem('auth-storage')

    // Redirect to login page
    window.location.href = '/login'
  }
}

/**
 * Refresh authentication tokens.
 *
 * @param refreshToken - Current refresh token
 * @returns New access and refresh tokens
 * @throws {ApiError} If refresh fails
 */
export async function refreshTokens(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  try {
    interface BackendRefreshTokenResponse {
      access_token: string
      refresh_token: string
      token_type: string
    }

    const response = await apiClient.post<BackendRefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })

    // Convert snake_case to camelCase
    const tokens: RefreshTokenResponse = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenType: response.data.token_type,
    }

    // Store new tokens
    localStorage.setItem('access_token', tokens.accessToken)
    localStorage.setItem('refresh_token', tokens.refreshToken)

    return tokens
  } catch (error) {
    console.error('Token refresh error:', error)

    // If refresh fails, clear tokens and redirect to login
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    window.location.href = '/login'

    throw error as ApiError
  }
}

/**
 * Request a password reset email.
 *
 * @param email - User's email address
 * @throws {ApiError} If request fails
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await apiClient.post('/auth/password-reset-request', {
      email: email.trim(),
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    throw error as ApiError
  }
}

/**
 * Confirm password reset with token.
 *
 * @param data - Reset token and new password
 * @throws {ApiError} If confirmation fails
 */
export async function confirmPasswordReset(
  data: PasswordResetConfirm
): Promise<void> {
  try {
    await apiClient.post('/auth/password-reset-confirm', {
      token: data.token,
      new_password: data.newPassword,
    })
  } catch (error) {
    console.error('Password reset confirmation error:', error)
    throw error as ApiError
  }
}

/**
 * Get current user from localStorage.
 *
 * @returns User data or null if not logged in
 */
export function getCurrentUser(): User | null {
  try {
    const userJson = localStorage.getItem('user')
    if (!userJson) {
      return null
    }
    return JSON.parse(userJson) as User
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

/**
 * Check if user is currently authenticated.
 *
 * @returns True if user has valid access token
 */
export function isAuthenticated(): boolean {
  const accessToken = localStorage.getItem('access_token')
  return !!accessToken
}

/**
 * Get current access token.
 *
 * @returns Access token or null
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

/**
 * Get current refresh token.
 *
 * @returns Refresh token or null
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

/**
 * Check if current user has a specific role.
 *
 * @param role - Role to check
 * @returns True if user has the role
 */
export function hasRole(role: UserRole): boolean {
  const user = getCurrentUser()
  return user?.role === role
}

/**
 * Check if current user can teach (instructor or admin).
 *
 * @returns True if user can teach
 */
export function canTeach(): boolean {
  const user = getCurrentUser()
  return user?.role === UserRole.INSTRUCTOR || user?.role === UserRole.ADMIN
}

/**
 * Check if current user is admin.
 *
 * @returns True if user is admin
 */
export function isAdmin(): boolean {
  return hasRole(UserRole.ADMIN)
}
