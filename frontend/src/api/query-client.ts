/**
 * TanStack Query (React Query) configuration.
 *
 * Provides global query client configuration for server state management.
 */
import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * Default options for all queries and mutations.
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Stale time: data is considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Cache time: unused data stays in cache for 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)

    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus for user interactions
    refetchOnWindowFocus: true,

    // Don't refetch on mount if data is fresh
    refetchOnMount: false,

    // Refetch on reconnect to get latest data
    refetchOnReconnect: true,

    // Use network mode to handle offline scenarios
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    retryDelay: 1000,

    // Network mode for mutations
    networkMode: 'online',
  },
}

/**
 * Create and configure the global query client.
 */
export const queryClient = new QueryClient({
  defaultOptions,
})

/**
 * Query keys factory for consistent key management.
 */
export const queryKeys = {
  // Authentication
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, any>) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
  },

  // Courses
  courses: {
    all: ['courses'] as const,
    list: (filters?: Record<string, any>) => ['courses', 'list', filters] as const,
    detail: (id: string) => ['courses', 'detail', id] as const,
    lessons: (courseId: string) => ['courses', courseId, 'lessons'] as const,
  },

  // Enrollments
  enrollments: {
    all: ['enrollments'] as const,
    list: (filters?: Record<string, any>) =>
      ['enrollments', 'list', filters] as const,
    detail: (id: string) => ['enrollments', 'detail', id] as const,
    byCourse: (courseId: string) => ['enrollments', 'course', courseId] as const,
    byUser: (userId: string) => ['enrollments', 'user', userId] as const,
  },

  // Lessons
  lessons: {
    all: ['lessons'] as const,
    detail: (id: string) => ['lessons', 'detail', id] as const,
    byCourse: (courseId: string) => ['lessons', 'course', courseId] as const,
  },

  // Progress
  progress: {
    all: ['progress'] as const,
    byLesson: (lessonId: string) => ['progress', 'lesson', lessonId] as const,
    byCourse: (courseId: string) => ['progress', 'course', courseId] as const,
    byUser: (userId: string) => ['progress', 'user', userId] as const,
  },

  // Assignments
  assignments: {
    all: ['assignments'] as const,
    list: (filters?: Record<string, any>) =>
      ['assignments', 'list', filters] as const,
    detail: (id: string) => ['assignments', 'detail', id] as const,
    submissions: (assignmentId: string) =>
      ['assignments', assignmentId, 'submissions'] as const,
  },

  // Certificates
  certificates: {
    all: ['certificates'] as const,
    list: (filters?: Record<string, any>) =>
      ['certificates', 'list', filters] as const,
    detail: (id: string) => ['certificates', 'detail', id] as const,
    byUser: (userId: string) => ['certificates', 'user', userId] as const,
  },
} as const

/**
 * Invalidation helpers for common patterns.
 */
export const invalidateQueries = {
  /**
   * Invalidate all queries related to a specific course.
   */
  course: (courseId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.lessons(courseId) })
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollments.byCourse(courseId),
    })
    queryClient.invalidateQueries({ queryKey: queryKeys.lessons.byCourse(courseId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.byCourse(courseId) })
  },

  /**
   * Invalidate all queries related to a specific user.
   */
  user: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.byUser(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.byUser(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.certificates.byUser(userId) })
  },

  /**
   * Invalidate all list queries (useful after bulk operations).
   */
  allLists: () => {
    queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    queryClient.invalidateQueries({ queryKey: ['courses', 'list'] })
    queryClient.invalidateQueries({ queryKey: ['enrollments', 'list'] })
    queryClient.invalidateQueries({ queryKey: ['assignments', 'list'] })
    queryClient.invalidateQueries({ queryKey: ['certificates', 'list'] })
  },
}

export default queryClient
