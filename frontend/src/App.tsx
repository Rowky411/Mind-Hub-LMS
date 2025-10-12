/**
 * Main application component with routing configuration.
 *
 * Provides route definitions and protected route wrapper for authentication.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/api/query-client'
import { useAuthStore } from '@/store/auth'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import StudentDashboard from '@/pages/dashboard/StudentDashboard'
import InstructorDashboard from '@/pages/dashboard/InstructorDashboard'
import AdminDashboard from '@/pages/dashboard/AdminDashboard'

/**
 * Protected route wrapper that requires authentication.
 */
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'instructor' | 'admin'
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    // Allow admin to access all routes
    if (user?.role !== 'admin') {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}

/**
 * Public route wrapper that redirects to dashboard if authenticated.
 */
interface PublicRouteProps {
  children: React.ReactNode
}

function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

/**
 * Dashboard redirect component that redirects to role-specific dashboard.
 */
function DashboardRedirect() {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />
  } else if (user.role === 'instructor') {
    return <Navigate to="/dashboard/instructor" replace />
  } else {
    return <Navigate to="/dashboard/student" replace />
  }
}

/**
 * Main application component.
 */
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes - Role-Based Dashboards */}
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/instructor"
              element={
                <ProtectedRoute requiredRole="instructor">
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Redirect /dashboard to role-specific dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div>Profile Page - TODO</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <div>Course List - TODO</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <div>Course Detail - TODO</div>
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Instructors Only */}
            <Route
              path="/instructor/courses"
              element={
                <ProtectedRoute requiredRole="instructor">
                  <div>Instructor Courses - TODO</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/courses/new"
              element={
                <ProtectedRoute requiredRole="instructor">
                  <div>Create Course - TODO</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/courses/:id/edit"
              element={
                <ProtectedRoute requiredRole="instructor">
                  <div>Edit Course - TODO</div>
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Admin Only */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>User Management - TODO</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Course Management - TODO</div>
                </ProtectedRoute>
              }
            />

            {/* Error Routes */}
            <Route path="/unauthorized" element={<div>Unauthorized - TODO</div>} />
            <Route path="/404" element={<div>Not Found - TODO</div>} />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>

        {/* React Query Devtools (only in development) */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
