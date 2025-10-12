/**
 * Authentication hook for accessing auth state and actions.
 *
 * Provides convenient access to authentication functionality throughout the app.
 */
import { useAuthStore } from '@/store/auth'
import type { User, UserRole } from '@/types/api'

/**
 * Authentication hook return type.
 */
interface UseAuthReturn {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: UserRole
  }) => Promise<void>
  logout: () => void
  clearError: () => void

  // Authorization helpers
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isStudent: boolean
  isInstructor: boolean
  isAdmin: boolean
}

/**
 * Custom hook for authentication functionality.
 *
 * @returns Authentication state and actions
 *
 * @example
 * ```tsx
 * function LoginPage() {
 *   const { login, isLoading, error } = useAuth()
 *
 *   const handleLogin = async (email: string, password: string) => {
 *     try {
 *       await login(email, password)
 *       // Redirect to dashboard
 *     } catch (err) {
 *       // Error is already set in state
 *     }
 *   }
 *
 *   return <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const store = useAuthStore()

  /**
   * Check if user has a specific role.
   */
  const hasRole = (role: UserRole): boolean => {
    if (!store.user) return false
    // Admin has access to everything
    if (store.user.role === 'admin') return true
    return store.user.role === role
  }

  /**
   * Check if user has any of the specified roles.
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!store.user) return false
    // Admin has access to everything
    if (store.user.role === 'admin') return true
    return roles.includes(store.user.role)
  }

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,

    // Authorization helpers
    hasRole,
    hasAnyRole,
    isStudent: store.user?.role === 'student',
    isInstructor: store.user?.role === 'instructor' || store.user?.role === 'admin',
    isAdmin: store.user?.role === 'admin',
  }
}

/**
 * Hook to require authentication and optionally a specific role.
 *
 * Throws an error if user is not authenticated or doesn't have required role.
 * Use this in protected components that should only be accessed by authenticated users.
 *
 * @param requiredRole - Optional role requirement
 * @throws Error if user is not authenticated or doesn't have required role
 *
 * @example
 * ```tsx
 * function InstructorDashboard() {
 *   const auth = useRequireAuth('instructor')
 *
 *   return <div>Welcome, {auth.user.firstName}!</div>
 * }
 * ```
 */
export function useRequireAuth(requiredRole?: UserRole): UseAuthReturn {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    throw new Error('Authentication required')
  }

  if (requiredRole && !auth.hasRole(requiredRole)) {
    throw new Error(`Role '${requiredRole}' required`)
  }

  return auth
}

/**
 * Hook to get current user with type safety.
 *
 * Returns the current user or null if not authenticated.
 * Use this when you need user information but don't want to enforce authentication.
 *
 * @example
 * ```tsx
 * function UserMenu() {
 *   const user = useCurrentUser()
 *
 *   if (!user) {
 *     return <LoginButton />
 *   }
 *
 *   return <div>Hello, {user.firstName}!</div>
 * }
 * ```
 */
export function useCurrentUser(): User | null {
  const { user } = useAuth()
  return user
}

/**
 * Hook to check if user has permission for an action.
 *
 * Useful for conditional rendering based on user permissions.
 *
 * @param permission - Permission check function
 * @returns Boolean indicating if user has permission
 *
 * @example
 * ```tsx
 * function CourseCard({ course }) {
 *   const canEdit = usePermission((user) =>
 *     user.role === 'instructor' && course.instructorId === user.id
 *   )
 *
 *   return (
 *     <Card>
 *       <CardTitle>{course.title}</CardTitle>
 *       {canEdit && <EditButton />}
 *     </Card>
 *   )
 * }
 * ```
 */
export function usePermission(permission: (user: User) => boolean): boolean {
  const { user } = useAuth()

  if (!user) return false

  // Admin has all permissions
  if (user.role === 'admin') return true

  return permission(user)
}
