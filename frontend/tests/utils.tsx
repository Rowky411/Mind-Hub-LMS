/**
 * Test utilities for React component testing.
 *
 * Provides custom render functions with providers and common test helpers.
 */
import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Create a new QueryClient for testing with disabled retries.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Props for AllTheProviders wrapper component.
 */
interface AllTheProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
}

/**
 * Wrapper component that includes all necessary providers for testing.
 */
function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

/**
 * Custom render options extending RTL's RenderOptions.
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

/**
 * Custom render function that wraps components with necessary providers.
 *
 * @param ui - The React element to render
 * @param options - Custom render options
 * @returns Render result from @testing-library/react
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />)
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

/**
 * Mock user data for testing.
 */
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'student' as const,
  avatar: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

/**
 * Mock instructor user data for testing.
 */
export const mockInstructor = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'instructor@example.com',
  firstName: 'John',
  lastName: 'Instructor',
  role: 'instructor' as const,
  avatar: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

/**
 * Mock admin user data for testing.
 */
export const mockAdmin = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin' as const,
  avatar: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

/**
 * Mock course data for testing.
 */
export const mockCourse = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  title: 'Test Course',
  description: 'A test course for unit testing',
  thumbnail: null,
  instructorId: mockInstructor.id,
  isPublished: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

/**
 * Wait for a condition to be true with timeout.
 *
 * @param condition - Function that returns true when condition is met
 * @param timeout - Maximum time to wait in milliseconds
 * @param interval - Check interval in milliseconds
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 3000,
  interval = 100
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition')
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}

/**
 * Delay execution for testing async behavior.
 *
 * @param ms - Milliseconds to delay
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react'
