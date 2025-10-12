/**
 * ProtectedRoute component.
 *
 * Wrapper component that protects routes from unauthenticated access.
 * Redirects to login if user is not authenticated.
 */
import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../api/auth'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const authenticated = isAuthenticated()

  if (!authenticated) {
    // Redirect to login page, preserving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
