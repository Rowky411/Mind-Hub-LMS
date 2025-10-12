/**
 * RoleGate component.
 *
 * Conditional rendering based on user roles.
 * Shows children only if user has one of the required roles.
 */
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser, UserRole } from '../../api/auth'

interface RoleGateProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
  redirectTo?: string
}

export default function RoleGate({
  children,
  allowedRoles,
  fallback = null,
  redirectTo,
}: RoleGateProps) {
  const user = getCurrentUser()

  if (!user) {
    // User not authenticated, redirect to login
    return <Navigate to="/login" replace />
  }

  const hasAccess = allowedRoles.includes(user.role)

  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook to check if current user has required roles.
 *
 * @param allowedRoles - Array of allowed roles
 * @returns True if user has one of the allowed roles
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const user = getCurrentUser()
  if (!user) return false
  return allowedRoles.includes(user.role)
}

/**
 * Hook to check if current user can teach (instructor or admin).
 *
 * @returns True if user can teach
 */
export function useCanTeach(): boolean {
  return useHasRole([UserRole.INSTRUCTOR, UserRole.ADMIN])
}

/**
 * Hook to check if current user is admin.
 *
 * @returns True if user is admin
 */
export function useIsAdmin(): boolean {
  return useHasRole([UserRole.ADMIN])
}

/**
 * Hook to check if current user is student.
 *
 * @returns True if user is student
 */
export function useIsStudent(): boolean {
  return useHasRole([UserRole.STUDENT])
}
